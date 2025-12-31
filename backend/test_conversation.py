"""
Realistic Conversation Test - Single Session with Biometric Auth
Simulates Akeem (user_id=1) trying to send money to Tunde (user_id=2)

This test:
- Maintains conversation context throughout
- Detects biometric auth tool call from backend
- Performs actual face verification using akeem_b.jpeg

Run: python test_conversation.py
"""
import requests
import time
import json
import base64
from dotenv import load_dotenv
import os
from tools import get_db_connection

load_dotenv()

BASE_URL = "http://localhost:8080"
API_KEY = os.getenv("ELEVENLABS_CUSTOM_LLM_SECRET", "")
DELAY_SECONDS = 10  # Avoid quota limits

# Fixed session for Akeem
USER_ID = 1
SESSION_ID = "akeem_session_test_001"

def call_gemini(message: str, retries: int = 2):
    """Send a message to Gemini, returns (response_text, tool_calls)"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "X-User-ID": str(USER_ID),
        "X-Session-ID": SESSION_ID
    }
    payload = {
        "model": "gemini-2.0-flash",
        "messages": [{"role": "user", "content": message}],
        "stream": False
    }
    
    for attempt in range(retries + 1):
        try:
            response = requests.post(f"{BASE_URL}/v1/chat/completions", json=payload, headers=headers, timeout=60)
            if response.status_code == 200:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "No response")
                tool_calls = data.get("choices", [{}])[0].get("message", {}).get("tool_calls", [])
                return content, tool_calls
            else:
                return f"Error {response.status_code}: {response.text[:100]}", []
        except requests.exceptions.Timeout:
            if attempt < retries:
                print(f"   ⏳ Timeout, retrying ({attempt + 1}/{retries})...")
                time.sleep(5)
            else:
                return f"Timeout after {retries + 1} attempts", []
        except Exception as e:
            return f"Exception: {str(e)}", []
    return "Unknown error", []

def verify_face(image_path: str, transfer_details: dict = None):
    """Call /verify-face endpoint with an image and optional transfer details"""
    print(f"\n🔐 BIOMETRIC VERIFICATION")
    print(f"   Using image: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"   ❌ Image not found!")
        return None
    
    # Read and encode image
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode('utf-8')
    
    # Call verify-face endpoint
    headers = {"Content-Type": "application/json"}
    payload = {
        "image": f"data:image/jpeg;base64,{image_data}",
        "user_id": USER_ID
    }
    
    # Include transfer details if provided
    if transfer_details:
        payload.update(transfer_details)
        print(f"   Transfer: ₦{transfer_details.get('amount')} to {transfer_details.get('beneficiary_name')}")
    
    try:
        response = requests.post(f"{BASE_URL}/verify-face", json=payload, headers=headers, timeout=120)
        if response.status_code == 200:
            result = response.json()
            if result.get("verified"):
                print(f"   ✅ VERIFIED! Match distance: {result.get('distance', 'N/A')}")
                if result.get("transfer"):
                    transfer = result["transfer"]
                    print(f"   💸 TRANSFER: {transfer.get('status')} - {transfer.get('message')}")
                    if transfer.get('new_balance_ngn'):
                        print(f"   💰 New Balance: {transfer.get('new_balance_ngn')}")
                return result
            else:
                print(f"   ❌ NOT VERIFIED: {result.get('reason', 'Unknown')}")
                return result
        else:
            print(f"   ❌ API Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        return None

def check_db():
    """Check database state"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT alias_name, account_name, bank_name FROM beneficiaries WHERE user_id = %s", (USER_ID,))
    beneficiaries = cursor.fetchall()
    
    cursor.execute("SELECT type, amount_kobo, counterparty_name, status FROM transactions WHERE user_id = %s", (USER_ID,))
    transactions = cursor.fetchall()
    
    cursor.execute("SELECT balance_kobo FROM accounts WHERE user_id = %s", (USER_ID,))
    balance = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    return {
        "beneficiaries": beneficiaries,
        "transactions": transactions,
        "balance": balance[0] if balance else 0
    }

def chat(step: int, message: str, check_for_biometric: bool = False):
    """Chat with Gemini and display result. Returns (response, biometric_triggered)"""
    print(f"\n{'='*60}")
    print(f"STEP {step}: AKEEM")
    print(f"{'='*60}")
    print(f">>> {message}")
    print("-" * 40)
    
    response, tool_calls = call_gemini(message)
    print(f"NUGAR: {response}")
    
    biometric_triggered = False
    if tool_calls:
        print(f"\n🔧 TOOL CALLS DETECTED:")
        for tc in tool_calls:
            print(f"   - {tc.get('function', {}).get('name', 'unknown')}")
            if tc.get('function', {}).get('name') == 'triggerBiometric':
                biometric_triggered = True
    
    # Check response text for biometric trigger as well
    if "face recognition" in response.lower() or "verify your identity" in response.lower():
        biometric_triggered = True
    
    if check_for_biometric:
        if biometric_triggered:
            print(f"\n✅ BIOMETRIC AUTH TOOL CALL DETECTED!")
        else:
            print(f"\n⚠️ BIOMETRIC AUTH NOT DETECTED - Stopping test")
            return response, False
    
    print(f"\n⏳ Waiting {DELAY_SECONDS}s...")
    time.sleep(DELAY_SECONDS)
    return response, biometric_triggered

def main():
    print("\n" + "="*60)
    print("🎬 AKEEM'S TRANSFER TO TUNDE - CONVERSATION TEST")
    print("="*60)
    print(f"User: Akeem (user_id={USER_ID})")
    print(f"Session: {SESSION_ID}")
    print(f"Target: Send money to Tunde (user_id=2, account=0987654321)")
    
    # Initial DB state
    db = check_db()
    print(f"\n📊 INITIAL STATE:")
    print(f"   Balance: ₦{db['balance']/100:,.2f}")
    print(f"   Beneficiaries: {len(db['beneficiaries'])}")
    print(f"   Transactions: {len(db['transactions'])}")
    
    input("\n▶️ Press ENTER to start conversation...")
    
    # ============================================================
    # THE CONVERSATION (Akeem wants to send 5000 to Tunde)
    # ============================================================
    
    # Step 1: Greeting
    chat(1, "Hello")
    
    # Step 2: State intent
    chat(2, "I want to send money to Tunde")
    
    # Step 3: Provide amount
    chat(3, "5000 naira")
    
    # Step 4: Provide account number
    chat(4, "His account number is 0987654321")
    
    # Step 5: Provide bank
    chat(5, "TunjiaX bank")
    
    # Step 6: Confirm - Check for biometric trigger
    response, biometric_triggered = chat(6, "Yes, that's correct. Proceed", check_for_biometric=True)
    
    if not biometric_triggered:
        print("\n❌ TEST STOPPED: Biometric auth was not triggered by Gemini")
        return
    
    # Step 7: Perform atomic biometric verification + transfer
    print(f"\n{'='*60}")
    print("STEP 7: BIOMETRIC VERIFICATION + TRANSFER (ATOMIC)")
    print(f"{'='*60}")
    
    # Include transfer details for atomic execution
    transfer_details = {
        "amount": 5000,  # ₦5,000
        "beneficiary_name": "Tunde Bakare",
        "account_number": "0987654321",
        "bank_name": "TunjiaX",
        "session_id": SESSION_ID  # So backend can update Gemini chat history
    }
    
    result = verify_face("test_images/akeem_b.jpeg", transfer_details)
    
    if not result or not result.get("verified"):
        print("\n❌ TEST STOPPED: Biometric verification failed")
        return
    
    if not result.get("transfer") or result["transfer"].get("status") != "success":
        print("\n❌ TEST STOPPED: Transfer failed after verification")
        return
    
    print("\n✅ Transfer executed atomically after face verification!")
    
    time.sleep(DELAY_SECONDS)
    
    # Step 8: Ask Gemini to save beneficiary
    chat(8, "That worked! Save Tunde as a beneficiary for next time")
    
    # Step 9: Provide full name if asked
    chat(9, "His full name is Tunde Bakare")
    
    # Step 10: Confirm save
    chat(10, "Yes, save it")
    
    # Step 11: Confirm goodbye
    chat(11, "Thanks!")
    
    # ============================================================
    # FINAL STATE
    # ============================================================
    print("\n" + "="*60)
    print("📊 FINAL DATABASE STATE")
    print("="*60)
    
    db = check_db()
    print(f"\nBalance: ₦{db['balance']/100:,.2f}")
    
    print(f"\nBeneficiaries ({len(db['beneficiaries'])}):")
    for b in db['beneficiaries']:
        print(f"  - {b[0]}: {b[1]} at {b[2]}")
    
    print(f"\nTransactions ({len(db['transactions'])}):")
    for t in db['transactions']:
        print(f"  - {t[0]}: ₦{t[1]/100:,.2f} to {t[2]} ({t[3]})")
    
    print("\n✅ CONVERSATION TEST COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    main()
