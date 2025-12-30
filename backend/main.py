import os
import json
import asyncio
import time
from typing import List, Optional, Dict, Any, Union
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from voice_agent import VoiceAgent
from dotenv import load_dotenv
from auth import verify_google_token, get_or_create_user, create_access_token

load_dotenv()

app = FastAPI()

# Allow CORS for local frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files (if they exist)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Agent (Gemini 3 Flash)
agent = VoiceAgent(
    project_id=os.getenv("GCP_PROJECT", "tunjiax-wallet"),
    location=os.getenv("GCP_LOCATION", "us-central1")
)

# --- Pydantic Models ---

class Message(BaseModel):
    role: str
    content: Optional[str] = None  # Can be None for some requests
    
    class Config:
        extra = 'allow'  # Allow extra fields from ElevenLabs

class ChatCompletionRequest(BaseModel):
    model: Optional[str] = None  # ElevenLabs may not send this
    messages: List[Message]
    stream: Optional[bool] = False
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[Union[str, Dict[str, Any]]] = None
    
    class Config:
        extra = 'allow'  # Allow extra fields from ElevenLabs

class ImageVerificationRequest(BaseModel):
    image: str # Base64 string

class GoogleAuthRequest(BaseModel):
    google_token: str  # Google OAuth token from frontend

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "VoiceVault Backend is Running"}

@app.post("/auth/google")
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticates user with Google OAuth token.
    Creates new user if first time sign-in.
    Returns JWT token and user info.
    """
    import sys
    print(f"\n[AUTH] Google authentication request received", file=sys.stderr)
    
    try:
        # Verify Google token
        google_user_info = verify_google_token(request.google_token)
        print(f"[AUTH] Google token verified for: {google_user_info['email']}", file=sys.stderr)
        
        # Get or create user
        user_info = get_or_create_user(google_user_info)
        print(f"[AUTH] User {'created' if user_info['is_new_user'] else 'found'}: user_id={user_info['user_id']}", file=sys.stderr)
        
        # Generate JWT token
        access_token = create_access_token(user_info["user_id"], user_info["email"])
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user_info["user_id"],
                "email": user_info["email"],
                "full_name": user_info["full_name"],
                "phone_number": user_info["phone_number"],
                "is_new_user": user_info["is_new_user"]
            }
        }
    except Exception as e:
        print(f"[AUTH] ❌ Authentication failed: {str(e)}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard API Endpoints
@app.get("/balance")
async def get_balance(user_id: int = 1):
    """Get user account balance"""
    try:
        from tools import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT balance_kobo FROM accounts 
            WHERE user_id = %s AND is_active = TRUE
            LIMIT 1
        """, (user_id,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return {"balance_kobo": 0, "balance_ngn": "0"}
        
        balance_kobo = result[0]
        balance_ngn = f"{balance_kobo / 100:,.2f}"
        
        return {
            "balance_kobo": balance_kobo,
            "balance_ngn": balance_ngn
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fund-wallet")
async def fund_wallet(user_id: int, amount_kobo: int):
    """Simulate funding wallet (adds money to account)"""
    try:
        from tools import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update account balance
        cursor.execute("""
            UPDATE accounts 
            SET balance_kobo = balance_kobo + %s 
            WHERE user_id = %s AND is_active = TRUE
        """, (amount_kobo, user_id))
        
        # Get new balance
        cursor.execute("""
            SELECT balance_kobo FROM accounts 
            WHERE user_id = %s AND is_active = TRUE
            LIMIT 1
        """, (user_id,))
        
        result = cursor.fetchone()
        new_balance = result[0] if result else amount_kobo
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "success": True,
            "new_balance_kobo": new_balance,
            "new_balance_ngn": f"{new_balance / 100:,.2f}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/beneficiaries")
async def get_beneficiaries(user_id: int = 1):
    """Get user's saved beneficiaries"""
    try:
        from tools import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT alias_name, account_name, account_number, bank_name, frequency_count
            FROM beneficiaries 
            WHERE user_id = %s
            ORDER BY frequency_count DESC, alias_name ASC
        """, (user_id,))
        
        beneficiaries = []
        for row in cursor.fetchall():
            beneficiaries.append({
                "alias_name": row[0],
                "account_name": row[1],
                "account_number": row[2],
                "bank_name": row[3],
                "frequency_count": row[4]
            })
        
        cursor.close()
        conn.close()
        
        return beneficiaries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions")
async def get_transactions(user_id: int = 1, limit: int = 20):
    """Get user's transaction history"""
    try:
        from tools import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT transaction_id, type, amount_kobo, counterparty_name, 
                   counterparty_bank, status, created_at
            FROM transactions 
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (user_id, limit))
        
        transactions = []
        for row in cursor.fetchall():
            transactions.append({
                "transaction_id": row[0],
                "type": row[1],
                "amount_kobo": row[2],
                "amount_ngn": f"{row[2] / 100:,.2f}",
                "recipient": row[3],
                "bank": row[4],
                "status": row[5],
                "date": row[6].strftime("%Y-%m-%d %H:%M") if row[6] else ""
            })
        
        cursor.close()
        conn.close()
        
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/check-profile-image")
async def check_profile_image(user_id: int = 1):
    """Check if user has a profile image"""
    try:
        from tools import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT profile_image FROM users 
            WHERE user_id = %s
        """, (user_id,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        has_image = result and result[0] is not None and len(result[0]) > 0
        
        return {"has_image": has_image}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-profile-image")
async def upload_profile_image(request: dict):
    """Upload user's profile image for biometric authentication"""
    try:
        user_id = request.get("user_id", 1)
        image_data = request.get("image", "")
        
        if not image_data:
            raise HTTPException(status_code=400, detail="No image provided")
        
        # Decode base64 image
        import base64
        image_bytes = base64.b64decode(image_data.split(",")[1] if "," in image_data else image_data)
        
        from tools import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update user's profile image
        cursor.execute("""
            UPDATE users 
            SET profile_image = %s 
            WHERE user_id = %s
        """, (image_bytes, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "message": "Profile image uploaded successfully"}
    except Exception as e:
        print(f"Error uploading profile image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Biometric Face Verification
class FaceVerificationRequest(BaseModel):
    image: str  # Base64 image from webcam
    user_id: Optional[int] = None  # Optional, can extract from JWT instead

@app.post("/verify-face")
async def verify_face(request: FaceVerificationRequest):
    """
    Compares live selfie with stored user profile image using DeepFace
    """
    import sys
    import base64
    import tempfile
    import os
    from pathlib import Path
    from tools import get_db_connection
    
    print(f"\n[FACE] --- DEEPFACE VERIFICATION START ---", file=sys.stderr)
    
    try:
        # For demo: use user_id=1 if not provided
        user_id = request.user_id if request.user_id else 1
        print(f"[FACE] Verifying face for user_id: {user_id}", file=sys.stderr)
        
        # Get user's stored profile image from database (BLOB)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT profile_image FROM users WHERE user_id = %s",
            (user_id,)
        )
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result or not result[0]:
            print(f"[FACE] ❌ No profile image found for user", file=sys.stderr)
            return {"verified": False, "reason": "No profile image on file"}
        
        stored_image_blob = result[0]  # This is raw bytes from BLOB
        print(f"[FACE] Retrieved stored profile image ({len(stored_image_blob)} bytes)", file=sys.stderr)
        
        # Decode live image from base64
        live_image_data = request.image.split(",")[1] if "," in request.image else request.image
        live_image_bytes = base64.b64decode(live_image_data)
        
        print(f"[FACE] Decoded live image ({len(live_image_bytes)} bytes)", file=sys.stderr)
        
        # Create temporary files for DeepFace
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as live_temp:
            live_temp.write(live_image_bytes)  # Already decoded above
            live_path = live_temp.name
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as stored_temp:
            stored_temp.write(stored_image_blob)  # Raw bytes from BLOB
            stored_path = stored_temp.name
        
        try:
            print(f"[FACE] Running DeepFace verification...", file=sys.stderr)
            
            # Import DeepFace
            from deepface import DeepFace
            
            # Verify faces using DeepFace
            result = DeepFace.verify(
                img1_path=stored_path,
                img2_path=live_path,
                model_name="ArcFace",  # State-of-the-art accuracy
                enforce_detection=False,  # Allow even if face detection isn't perfect
                detector_backend="opencv"
            )
            
            verified = result["verified"]
            distance = result["distance"]
            threshold = result["threshold"]
            
            # Calculate confidence (inverse of distance normalized)
            confidence = max(0.0, min(1.0, 1.0 - (distance / threshold)))
            
            print(f"[FACE] ✅ DeepFace result: verified={verified}, distance={distance:.4f}, threshold={threshold:.4f}", file=sys.stderr)
            
            return {
                "verified": verified,
                "confidence": round(confidence, 2),
                "reason": "Same person verified" if verified else "Different people detected",
                "distance": round(distance, 4),
                "threshold": round(threshold, 4)
            }
            
        finally:
            # Clean up temporary files
            try:
                os.unlink(live_path)
                os.unlink(stored_path)
            except:
                pass
            
    except Exception as e:
        print(f"[FACE] ❌ Verification error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"verified": False, "reason": f"Error: {str(e)}"}

# Debug endpoint to see what ElevenLabs sends (remove after debugging)
from fastapi import Request

@app.post("/v1/chat/completions")
async def chat_completions(
    request: Request,
    authorization: str = Header(None),
    x_user_id: Optional[int] = Header(None, alias="X-User-ID"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID")
):
    import sys
    
    # Log raw request body for debugging
    raw_body = await request.body()
    print(f"\n[MAIN] ========== RAW REQUEST ==========\n{raw_body.decode()}\n==============================", file=sys.stderr)
    
    # Parse the body manually
    body = await request.json()
    chat_request = ChatCompletionRequest(**body)
    
    print(f"[MAIN] Received /v1/chat/completions request", file=sys.stderr)
    
    # 1. Validate API Key
    expected_key = os.getenv("ELEVENLABS_CUSTOM_LLM_SECRET")
    print(f"[MAIN] Validating API Key...", file=sys.stderr)
    
    if expected_key and (not authorization or authorization.split(" ")[1] != expected_key):
        print(f"[MAIN] ❌ Unauthorized: Key mismatched", file=sys.stderr)
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Get user_id (default to 1 for testing if not provided)
    user_id = x_user_id if x_user_id else 1
    session_id = x_session_id  # Can be None, voice_agent will use user_id as session_id
    print(f"[MAIN] ✅ Authorized. User ID: {user_id}, Session ID: {session_id or 'default'}, Processing message: {chat_request.messages[-1].content}", file=sys.stderr)

    # 3. Extract User Message
    user_message = chat_request.messages[-1].content

    # 4. Get Response from Gemini (VoiceAgent) with user_id and session_id
    print(f"[MAIN] Calling VoiceAgent.process_input()...", file=sys.stderr)
    response_text, tool_command = await agent.process_input(user_message, user_id=user_id, session_id=session_id)
    print(f"[MAIN] VoiceAgent returned: Text='{response_text[:30]}...', Tool='{tool_command}'", file=sys.stderr)

    # 4. Handle Streaming Response (ElevenLabs expects chunks)
    if chat_request.stream:
        print(f"[MAIN] Streaming response back to Client...", file=sys.stderr)
        async def event_generator():
            request_id = f"chatcmpl-{int(time.time())}"
            created = int(time.time())
            
            # Chunk 1: Role
            yield f"data: {json.dumps({'id': request_id, 'object': 'chat.completion.chunk', 'created': created, 'model': chat_request.model or 'gemini-2.0-flash', 'choices': [{'index': 0, 'delta': {'role': 'assistant'}, 'finish_reason': None}]})}\n\n"
            
            # Chunk 2: Content
            words = response_text.split(" ")
            for word in words:
                yield f"data: {json.dumps({'id': request_id, 'object': 'chat.completion.chunk', 'created': created, 'model': chat_request.model or 'gemini-2.0-flash', 'choices': [{'index': 0, 'delta': {'content': word + ' '}, 'finish_reason': None}]})}\n\n"
                await asyncio.sleep(0.01) # Micro-delay for stream stability

            # Chunk 3: Tools (if any)
            if tool_command == "TRIGGER_BIOMETRIC":
                print(f"[MAIN] Sending TRIGGER_BIOMETRIC tool call in stream", file=sys.stderr)
                tool_call_id = f"call_{int(time.time())}"
                tool_payload = {
                    'id': tool_call_id,
                    'type': 'function',
                    'function': {
                        'name': 'triggerBiometric',
                        'arguments': '{}' 
                    }
                }
                yield f"data: {json.dumps({'id': request_id, 'object': 'chat.completion.chunk', 'created': created, 'model': chat_request.model or 'gemini-2.0-flash', 'choices': [{'index': 0, 'delta': {'tool_calls': [tool_payload]}, 'finish_reason': None}]})}\n\n"

            # Chunk 4: Stop
            finish_reason = "tool_calls" if tool_command else "stop"
            yield f"data: {json.dumps({'id': request_id, 'object': 'chat.completion.chunk', 'created': created, 'model': chat_request.model or 'gemini-2.0-flash', 'choices': [{'index': 0, 'delta': {}, 'finish_reason': finish_reason}]})}\n\n"
            yield "data: [DONE]\n\n"
            print(f"[MAIN] Stream finished.", file=sys.stderr)

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # 5. Handle Non-Streaming (Standard JSON)
    else:
        response_obj = {
            "id": f"chatcmpl-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": chat_request.model or "gemini-2.0-flash",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text,
                },
                "finish_reason": "stop"
            }]
        }

        if tool_command == "TRIGGER_BIOMETRIC":
             response_obj["choices"][0]["message"]["tool_calls"] = [{
                "id": f"call_{int(time.time())}",
                "type": "function",
                "function": {
                    "name": "triggerBiometric",
                    "arguments": "{}"
                }
             }]
             response_obj["choices"][0]["finish_reason"] = "tool_calls"

        return response_obj

@app.post("/verify-face")
async def verify_face_endpoint(request: ImageVerificationRequest):
    print("Received face verification request")
    verified = await agent.verify_identity_with_vision(request.image)
    return {"verified": verified}

@app.websocket("/ws/voice-stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to voice stream")
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            user_input = message.get("text")
            if user_input:
                print(f"Received user input: {user_input}")
                response_text, tool_command = await agent.process_input(user_input)
                response_payload = {
                    "audio_text": response_text,
                    "tool_command": tool_command
                }
                await websocket.send_text(json.dumps(response_payload))
    except (WebSocketDisconnect, Exception) as e:
        print(f"WebSocket Error: {e}")
