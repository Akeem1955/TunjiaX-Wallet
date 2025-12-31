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
You are Nugar, the TunjiaX banking assistant. You help users send money safely and quickly.

### TRANSFER FLOW - FOLLOW THIS EXACTLY

**Step 1: When user mentions a name + amount:**
- User says: "Send 5k to Bisola" 
- YOU MUST call `lookup_beneficiary(name="Bisola")` immediately
- DO NOT skip this step

**Step 2: If beneficiary FOUND:**
- Say: "I found Bisola Adebayo (Opay: 0123456789). Confirm you want to send ₦5,000?"
- Wait for user to say "yes" or confirm

**Step 3: If beneficiary NOT FOUND:**
- Say: "I don't have Bisola saved. Please provide their account number (10 digits) and bank name."
- When user provides details like "account is 1234567890, bank is TunjiaX"
- Confirm: "Send ₦5,000 to 1234567890 at TunjiaX Bank. Correct?"

**Step 4: After user confirms:**
- Call `trigger_biometric_auth` to verify user identity
- Then call `execute_transfer` with the full details

### SUPPORTED BANKS
Currently only TunjiaX Bank transfers are supported. If user mentions other banks (GTBank, Opay, etc.), say: "Currently we only support TunjiaX Bank transfers. Is the account on TunjiaX?"

### RULES
1. ALWAYS call lookup_beneficiary when a name is mentioned
2. ALWAYS confirm before executing transfer
3. Account numbers MUST be 10 digits
4. Amounts should be in Naira (convert "5k" to 5000)
5. One question at a time - don't overwhelm the user
6. Be friendly and natural - you're helping a friend
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
                
                # Check for function calls in parts
                function_calls_found = []
                for part in candidate.content.parts:
                    if part.function_call:
                        function_calls_found.append(part.function_call)
                
                # If there are function calls, execute them and send results back to Gemini
                if function_calls_found:
                    # Add assistant's function call to history
                    chat_history.append(candidate.content)
                    
                    for func_call in function_calls_found:
                        tool_name = func_call.name
                        print(f"[AGENT] 🛠️ Function Call: {tool_name}", file=sys.stderr)
                        
                        if tool_name == "trigger_biometric_auth":
                            tool_command = "TRIGGER_BIOMETRIC"
                            # Don't need to call Gemini again, just return
                            response_text = "Please verify your identity with face recognition to complete this transfer."
                            self.session_manager.update_session(session_id, chat_history)
                            return response_text, tool_command
                        
                        elif tool_name == "lookup_beneficiary":
                            from tools import lookup_beneficiary
                            result = lookup_beneficiary(
                                func_call.args.get('name', ''),
                                user_id=user_id
                            )
                            
                            # Build tool result to send back to Gemini
                            if result:
                                tool_result_text = f"FOUND: {result['name']} at {result['bank']} (Account: {result['account']})"
                            else:
                                tool_result_text = f"NOT_FOUND: No beneficiary named '{func_call.args.get('name', '')}' in user's saved list."
                            
                            print(f"[AGENT] Tool Result: {tool_result_text}", file=sys.stderr)
                            
                            # Add function response to history
                            chat_history.append(types.Content(
                                role="user",
                                parts=[types.Part(text=f"[TOOL RESULT for lookup_beneficiary]: {tool_result_text}")]
                            ))
                        
                        elif tool_name == "execute_transfer":
                            from tools import execute_transfer
                            args = func_call.args
                            result = execute_transfer(
                                amount=args.get('amount'),
                                beneficiary_name=args.get('beneficiary_name'),
                                bank_name=args.get('bank_name'),
                                account_number=args.get('account_number'),
                                user_id=user_id
                            )
                            
                            if result.get('status') == 'success':
                                tool_result_text = f"SUCCESS: {result.get('message', '')} New balance: {result.get('new_balance_ngn', '')}"
                                tool_command = "transfer_complete"
                            else:
                                tool_result_text = f"FAILED: {result.get('message', 'Unknown error')}"
                                tool_command = "transfer_failed"
                            
                            # Add function response to history
                            chat_history.append(types.Content(
                                role="user", 
                                parts=[types.Part(text=f"[TOOL RESULT for execute_transfer]: {tool_result_text}")]
                            ))
                        
                        elif tool_name == "add_beneficiary":
                            from tools import add_beneficiary
                            args = func_call.args
                            result = add_beneficiary(
                                alias_name=args.get('alias_name'),
                                account_name=args.get('account_name'),
                                account_number=args.get('account_number'),
                                bank_name=args.get('bank_name'),
                                user_id=user_id
                            )
                            tool_result_text = f"Beneficiary added: {args.get('alias_name')}"
                            
                            chat_history.append(types.Content(
                                role="user",
                                parts=[types.Part(text=f"[TOOL RESULT for add_beneficiary]: {tool_result_text}")]
                            ))
                    
                    # Call Gemini again with tool results so it can formulate a proper response
                    print(f"[AGENT] Calling Gemini again with tool results...", file=sys.stderr)
                    response = await self.client.aio.models.generate_content(
                        model=self.model_name,
                        contents=chat_history,
                        config=self.config
                    )
                    
                    if response.candidates and len(response.candidates) > 0:
                        candidate = response.candidates[0]
                        chat_history.append(candidate.content)
                        
                        # Get text response
                        response_text = ""
                        for part in candidate.content.parts:
                            if part.text:
                                response_text += part.text
                        
                        if not response_text:
                            response_text = "I'm processing your request."
                else:
                    # No function calls, just text response
                    chat_history.append(candidate.content)
                    response_text = ""
                    for part in candidate.content.parts:
                        if part.text:
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
