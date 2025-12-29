import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header
from fastapi.responses import StreamingResponse
from voice_agent import VoiceAgent

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Voice Agent
# In production, use environment variables for GCP_PROJECT and GCP_LOCATION
agent = VoiceAgent(
    project_id=os.getenv("GCP_PROJECT", "your-project-id"),
    location=os.getenv("GCP_LOCATION", "us-central1")
)

@app.get("/")
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import os
import json
import time

class Message(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    stream: Optional[bool] = False
    tools: Optional[List[Dict[str, Any]]] = None
    tool_choice: Optional[Union[str, Dict[str, Any]]] = None

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest, authorization: str = Header(None)):
    # 1. Validate API Key
    expected_key = os.getenv("ELEVENLABS_CUSTOM_LLM_SECRET")
    if not authorization or authorization.split(" ")[1] != expected_key:
        # User said: "if it does not match our server wont respond" - raising 401
        raise HTTPException(status_code=401, detail="Unauthorized")

    print(f"Received Custom LLM Request: {request.messages[-1].content}")

    # 2. Extract User Message
    user_message = request.messages[-1].content

    # 3. Get Response from Gemini (VoiceAgent)
    # We need to modify agent to return not just text, but identifying if a tool was called.
    response_text, tool_command = await agent.process_input(user_message)

    # 4. Handle Streaming Response (ElevenLabs expects chunks)
    if request.stream:
        async def event_generator():
            request_id = f"chatcmpl-{int(time.time())}"
            created = int(time.time())
            
            # Chunk 1: Role
            yield f"data: {json.dumps({'id': request_id, 'object': 'chat.completion.chunk', 'created': created, 'model': request.model, 'choices': [{'index': 0, 'delta': {'role': 'assistant'}, 'finish_reason': null}]})}\n\n"
            
            # Chunk 2: Content (Simulated streaming for now since Gemini is mock-async here)
            # In real Gemini async stream, we would yield per token.
            words = response_text.split(" ")
            for word in words:
                yield f"data: {json.dumps({'id': request_id, 'object': 'chat.completion.chunk', 'created': created, 'model': request.model, 'choices': [{'index': 0, 'delta': {'content': word + ' '}, 'finish_reason': null}]})}\n\n"
                # await asyncio.sleep(0.05) # Tiny artificial delay for realism? Removed for speed.

            # Chunk 3: Tools (if any)
            if tool_command == "TRIGGER_BIOMETRIC":
                # ElevenLabs Format: We must return a tool call that matches what the Client SDK expects.
                # The user's SDK has clientTools: { triggerBiometric: ... }
                # Note: ElevenLabs Custom LLM docs usually expect strict tool_calls format if 'tools' were passed in request.
                # Assuming ElevenLabs passes the available client tools in the request, we should match it.
                # For this implementation, we force the tool call structure.
                
                tool_call_id = f"call_{int(time.time())}"
                tool_payload = {
                    'id': tool_call_id,
                    'type': 'function',
                    'function': {
                        'name': 'triggerBiometric',
                        'arguments': '{}' 
                    }
                }
                yield f"data: {json.dumps({'id': request_id, 'object': 'chat.completion.chunk', 'created': created, 'model': request.model, 'choices': [{'index': 0, 'delta': {'tool_calls': [tool_payload]}, 'finish_reason': null}]})}\n\n"

            # Chunk 4: Stop
            finish_reason = "tool_calls" if tool_command else "stop"
            yield f"data: {json.dumps({'id': request_id, 'object': 'chat.completion.chunk', 'created': created, 'model': request.model, 'choices': [{'index': 0, 'delta': {}, 'finish_reason': finish_reason}]})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # 5. Handle Non-Streaming (Standard JSON)
    else:
        response_obj = {
            "id": f"chatcmpl-{int(time.time())}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": request.model,
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

class ImageVerificationRequest(BaseModel):
    image: str # Base64 string

@app.post("/verify-face")
async def verify_face_endpoint(request: ImageVerificationRequest):
    print("Received face verification request")
    # verification_result = await agent.verify_face(request.image)
    # Using a direct mock-up of the agent call for stability in this step, 
    # but strictly calling the real agent method in next step.
    
    verified = await agent.verify_identity_with_vision(request.image)
    return {"verified": verified}

@app.websocket("/ws/voice-stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to voice stream")
    
    try:
        while True:
            # Receive audio/text data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Message structure: {"text": "Transfer 5k to Bisola"} 
            # (In a real audio scenario, this would handle audio chunks, but we start with text for logic verification)
            user_input = message.get("text")
            
            if user_input:
                print(f"Received user input: {user_input}")
                
                # Process with Gemini
                response_text, tool_command = await agent.process_input(user_input)
                
                # Send back response
                response_payload = {
                    "audio_text": response_text, # To be sent to ElevenLabs
                    "tool_command": tool_command # e.g., "TRIGGER_BIOMETRIC"
                }
                
                await websocket.send_text(json.dumps(response_payload))
                
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()
