import os
import base64
from google import genai
from google.genai import types
from google.oauth2 import service_account
from tools import tools_list
from session_manager import SessionManager

class VoiceAgent:
    def __init__(self, project_id: str, location: str):
        # Load service account credentials explicitly
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_path and os.path.exists(credentials_path):
            credentials = service_account.Credentials.from_service_account_file(
                credentials_path,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
        else:
            credentials = None
        
        # Initialize Google Gen AI Client with Vertex AI backend
        client_kwargs = {
            'vertexai': True,
            'project': project_id,
            'location': location
        }
        if credentials:
            client_kwargs['credentials'] = credentials
            
        self.client = genai.Client(**client_kwargs)
        
        self.system_instruction = """
### ROLE
You are TunjiaX, a secure transaction assistant for the Nigerian banking system. Your job is to extract transaction details and prepare a transfer.

### TOOL USAGE - CRITICAL
When the user mentions ANY name (e.g., "Bisola", "Tunde", "Chioma"), you MUST immediately call the `lookup_beneficiary` tool to check if they're in the saved beneficiaries list.

**Examples where you MUST call lookup_beneficiary:**
- "Transfer 5k to Bisola" → Call lookup_beneficiary(name="Bisola")
- "Send money to Tunde" → Call lookup_beneficiary(name="Tunde")
- "Pay Chioma 10000" → Call lookup_beneficiary(name="Chioma")
- "I want to send 2000 to John" → Call lookup_beneficiary(name="John")

**Do NOT assume a name is unknown without checking the tool first.**

### REQUIRED DATA (The "Must-Haves")
To process ANY transfer, you must identify:
1. **Amount** (in Naira).
2. **Beneficiary Name** (Who is receiving it?).
3. **Bank Name** (Destination Bank, e.g., GTBank, Opay, Zenith, Kuda).
4. **Account Number (NUBAN)**:
   - MUST be exactly 10 digits.
   - If the user says a name, check the `lookup_beneficiary` tool first. If found, you don't need the account number.
   - If the name is NOT found in lookup, THEN ask for the 10-digit NUBAN and Bank Name.

### BEHAVIOR RULES
1. **One Question at a Time:** Do not overwhelm the user. If multiple items are missing, ask for the most important one first.
2. **Validation:**
   - If the user provides an account number like "1234", reject it. Say: "That account number is too short. It needs to be 10 digits."
3. **Confirmation:** Before calling the `execute_transfer` tool, you MUST summarize: "Confirming [Amount] to [Name] at [Bank]?"
4. **Context Awareness:** If the user says "Opay" or "PalmPay", treat these as valid banks.
5. **Tool Trigger:** When you have all information and want to proceed, call the `trigger_biometric_auth` tool.
6. **Stay in Scope:** You can ONLY handle money transfers. Politely decline balance checks, transaction history, or unrelated requests.
"""
        
        # Store model name and config
        self.model_name = "gemini-2.0-flash-exp"
        self.config = types.GenerateContentConfig(
            system_instruction=self.system_instruction,
            tools=tools_list
        )
        
        # Initialize session manager (5 minute timeout)
        self.session_manager = SessionManager(timeout_seconds=300)

    async def process_input(self, text: str, user_id: int = 1, session_id: str = None):
        """
        Sends text to Gemini Chat and returns (speech_response, tool_action)
        user_id: The authenticated user's ID for database queries
        session_id: Unique session identifier for conversation continuity
        """
        import sys
        
        # Use user_id as session_id if not provided
        if session_id is None:
            session_id = f"user_{user_id}"
        
        # DEBUG: Force print to console
        print(f"\n[AGENT] --- GEMINI PROCESSING START ---", file=sys.stderr)
        print(f"[AGENT] User ID: {user_id}, Session: {session_id[:12]}..., Input: {text}", file=sys.stderr)
        
        try:
            # Get session-based chat history
            chat_history = self.session_manager.get_or_create_session(session_id)
            
            # Add user message to history
            chat_history.append(types.Content(
                role="user",
                parts=[types.Part(text=text)]
            ))
            
            print(f"[AGENT] Sending message to Gemini via Google Gen AI SDK...", file=sys.stderr)
            
            # Generate response
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=chat_history,
                config=self.config
            )
            
            print(f"[AGENT] Received response from Gemini.", file=sys.stderr)
            
            # Initialize defaults
            response_text = "I'm processing your request."
            tool_command = None
            
            # Parse Response
            if response.candidates and len(response.candidates) > 0:
                candidate = response.candidates[0]
                
                # Add assistant response to history
                chat_history.append(candidate.content)
                
                # Check for function calls in parts
                for part in candidate.content.parts:
                    if part.function_call:
                        tool_name = part.function_call.name
                        print(f"[AGENT] 🛠️ Gemini Function Call Detected: {tool_name}", file=sys.stderr)
                        
                        if tool_name == "trigger_biometric_auth":
                            tool_command = "trigger_biometric"
                            response_text = "Please confirm with biometric authentication."
                        
                        elif tool_name == "lookup_beneficiary":
                            print(f"[AGENT] Querying Database...", file=sys.stderr)
                            # Call actual function with user_id
                            from tools import lookup_beneficiary
                            result = lookup_beneficiary(
                                part.function_call.args.get('name', ''),
                                user_id=user_id
                            )
                            if result:
                                response_text = f"I found {result['name']} at {result['bank']} (Account: {result['account']})."
                            else:
                                response_text = "I couldn't find that person in your beneficiary list."
                        
                        elif tool_name == "execute_transfer":
                            print(f"[AGENT] Executing Transfer...", file=sys.stderr)
                            from tools import execute_transfer
                            args = part.function_call.args
                            result = execute_transfer(
                                amount=args.get('amount'),
                                beneficiary_name=args.get('beneficiary_name'),
                                bank_name=args.get('bank_name'),
                                account_number=args.get('account_number'),
                                user_id=user_id  # Pass user_id for proper account lookup
                            )
                            tool_command = "transfer_complete"
                            # Handle success/failure from execute_transfer
                            if result.get('status') == 'success':
                                response_text = f"Transfer successful! {result.get('message', '')} Your new balance is {result.get('new_balance_ngn', '')}."
                            else:
                                response_text = f"Transfer failed: {result.get('message', 'Unknown error')}"
                                tool_command = "transfer_failed"
                    elif part.text:
                        response_text += part.text
            
            # Update session with new history
            self.session_manager.update_session(session_id, chat_history)
            
            # If no response text from parts, use default
            if not response_text:
                response_text = "I'm processing that."
            
            print(f"[AGENT] Final Response: {response_text[:50]}...", file=sys.stderr)
            sys.stderr.flush()

            return response_text, tool_command

        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Detailed Gemini Error: {str(e)}")
            return f"System Error: {str(e)}", None

    async def verify_identity_with_vision(self, base64_image: str) -> bool:
        """
        Uses Gemini (Multimodal) to verify if the image contains a human face.
        """
        try:
            # 1. Strip header if present (data:image/jpeg;base64,...)
            if "," in base64_image:
                base64_image = base64_image.split(",")[1]
            
            # 2. Decode bytes
            image_bytes = base64.b64decode(base64_image)
            
            # 3. Create image part
            image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
            
            # 4. Prompt for Verification
            prompt = """
            Analyze this image strictly. 
            1. Is there a clear human face visible?
            2. Does the person appear to be looking at the camera (liveness check)?
            
            Return ONLY the string 'VERIFIED' if both are true. Otherwise return 'FAILED'.
            """
            
            # 5. Generate content
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[image_part, types.Part(text=prompt)]
                    )
                ]
            )
            
            if response.candidates and len(response.candidates) > 0:
                text = response.candidates[0].content.parts[0].text.strip().upper()
                print(f"Gemini Vision Result: {text}")
                return "VERIFIED" in text
            else:
                print("No response from Gemini Vision")
                return False

        except Exception as e:
            print(f"Vision Verification Failed: {e}")
            return False
