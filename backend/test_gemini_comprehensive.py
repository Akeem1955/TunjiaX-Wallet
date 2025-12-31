"""
Comprehensive Gemini Intelligence Test Suite
Tests the AI's ability to handle transfer conversations, tool calls, and edge cases.

Run: python test_gemini_comprehensive.py

Requires:
- Backend running on port 8080
- Database reset with test users (run reset_database.py first)
"""
import requests
import time
import json
from dotenv import load_dotenv
import os
from tools import get_db_connection

load_dotenv()

BASE_URL = "http://localhost:8080"
API_KEY = os.getenv("ELEVENLABS_CUSTOM_LLM_SECRET", "")
DELAY_SECONDS = 10  # Avoid quota limits

def call_gemini(message: str, user_id: int = 1):
    """Send a message to Gemini via /v1/chat/completions"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
        "X-User-ID": str(user_id)
    }
    payload = {
        "model": "gemini-2.0-flash",
        "messages": [{"role": "user", "content": message}],
        "stream": False
    }
    
    try:
        response = requests.post(f"{BASE_URL}/v1/chat/completions", json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "No response")
        else:
            return f"Error {response.status_code}: {response.text[:100]}"
    except Exception as e:
        return f"Exception: {str(e)}"

def check_beneficiaries(user_id: int = None):
    """Check beneficiaries in the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute("SELECT alias_name, account_name, bank_name FROM beneficiaries WHERE user_id = %s", (user_id,))
    else:
        cursor.execute("SELECT alias_name, account_name, bank_name, user_id FROM beneficiaries")
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results

def check_transactions(user_id: int = None):
    """Check transactions in the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute("SELECT transaction_id, type, amount_kobo, counterparty_name, status FROM transactions WHERE user_id = %s", (user_id,))
    else:
        cursor.execute("SELECT transaction_id, type, amount_kobo, counterparty_name, status, user_id FROM transactions")
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results

def check_balance(user_id: int):
    """Check user's account balance"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT balance_kobo FROM accounts WHERE user_id = %s", (user_id,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result[0] if result else 0

def run_test(test_num: int, description: str, message: str, user_id: int = 1, check_db: bool = False):
    """Run a single test case"""
    print(f"\n{'='*60}")
    print(f"TEST {test_num}: {description}")
    print(f"{'='*60}")
    print(f"USER (id={user_id}): {message}")
    print("-" * 40)
    
    response = call_gemini(message, user_id)
    print(f"GEMINI: {response}")
    
    if check_db:
        print("-" * 40)
        beneficiaries = check_beneficiaries(user_id)
        transactions = check_transactions(user_id)
        balance = check_balance(user_id)
        print(f"DB Check - Beneficiaries: {len(beneficiaries)}, Transactions: {len(transactions)}, Balance: ₦{balance/100:,.2f}")
    
    print(f"\n⏳ Waiting {DELAY_SECONDS}s before next test...")
    time.sleep(DELAY_SECONDS)
    return response

def main():
    print("\n" + "="*60)
    print("🧪 COMPREHENSIVE GEMINI INTELLIGENCE TEST SUITE")
    print("="*60)
    print(f"API Key: {'✅ Set' if API_KEY else '❌ Missing'}")
    print(f"Delay between tests: {DELAY_SECONDS} seconds")
    
    # Pre-test: Check initial state
    print("\n📊 INITIAL DATABASE STATE:")
    print(f"   Beneficiaries: {len(check_beneficiaries())}")
    print(f"   Transactions: {len(check_transactions())}")
    print(f"   User 1 Balance: ₦{check_balance(1)/100:,.2f}")
    print(f"   User 2 Balance: ₦{check_balance(2)/100:,.2f}")
    
    input("\n▶️ Press ENTER to start tests...")
    
    # ============================================================
    # TEST GROUP 1: Basic Understanding
    # ============================================================
    print("\n\n🔹 GROUP 1: BASIC UNDERSTANDING")
    
    run_test(1, "Greeting - Should respond friendly", 
             "Hello, how are you?")
    
    run_test(2, "Identity - Should introduce itself as Nugar", 
             "Who are you?")
    
    run_test(3, "Capabilities - Should explain it handles transfers", 
             "What can you help me with?")
    
    # ============================================================
    # TEST GROUP 2: Transfer Intent Recognition
    # ============================================================
    print("\n\n🔹 GROUP 2: TRANSFER INTENT RECOGNITION")
    
    run_test(4, "Vague transfer - Should ask for details", 
             "I want to send money")
    
    run_test(5, "Transfer with name only - Should call lookup_beneficiary", 
             "Transfer money to Tunde")
    
    run_test(6, "Transfer with amount + name - Should lookup and ask for confirmation", 
             "Send 5000 to Akeem")
    
    run_test(7, "Nigerian slang - Should understand 5k = 5000", 
             "Send 5k to Mama")
    
    # ============================================================
    # TEST GROUP 3: Edge Cases & Validation
    # ============================================================
    print("\n\n🔹 GROUP 3: EDGE CASES & VALIDATION")
    
    run_test(8, "Invalid account number - Should reject short number", 
             "Send to account 12345")
    
    run_test(9, "Unknown beneficiary - Should ask for full details", 
             "Transfer 10000 to Bisola", check_db=True)
    
    run_test(10, "Provide account details for unknown person", 
             "Her account is 1234567890 at TunjiaX bank")
    
    run_test(11, "Unsupported bank - Should say only TunjiaX supported", 
             "Send 2000 to GTBank account 9876543210")
    
    # ============================================================
    # TEST GROUP 4: Confirmation Flow
    # ============================================================
    print("\n\n🔹 GROUP 4: CONFIRMATION FLOW")
    
    run_test(12, "User confirms transfer - Should proceed", 
             "Yes, send 5000 to Tunde at TunjiaX")
    
    run_test(13, "User cancels - Should not proceed", 
             "No, cancel the transfer")
    
    run_test(14, "Ambiguous response - Should clarify", 
             "Maybe")
    
    # ============================================================
    # TEST GROUP 5: Context & Memory
    # ============================================================
    print("\n\n🔹 GROUP 5: CONTEXT & MEMORY")
    
    run_test(15, "Follow-up question in same topic", 
             "How much did I say I wanted to send?")
    
    run_test(16, "Change amount mid-conversation", 
             "Actually make it 10000 instead")
    
    # ============================================================
    # TEST GROUP 6: Out of Scope Requests
    # ============================================================
    print("\n\n🔹 GROUP 6: OUT OF SCOPE REQUESTS")
    
    run_test(17, "Balance check - Should decline politely", 
             "What's my balance?")
    
    run_test(18, "Transaction history - Should decline politely", 
             "Show me my last 5 transactions")
    
    run_test(19, "Completely off-topic - Should redirect", 
             "What's the weather like today?")
    
    # ============================================================
    # TEST GROUP 7: Multi-user Isolation
    # ============================================================
    print("\n\n🔹 GROUP 7: MULTI-USER ISOLATION")
    
    run_test(20, "User 2 transfer - Different session", 
             "Send 3000 to Akeem", user_id=2)
    
    # ============================================================
    # FINAL DATABASE CHECK
    # ============================================================
    print("\n\n" + "="*60)
    print("📊 FINAL DATABASE STATE")
    print("="*60)
    
    beneficiaries = check_beneficiaries()
    transactions = check_transactions()
    
    print(f"\nBeneficiaries ({len(beneficiaries)}):")
    for b in beneficiaries:
        print(f"  - {b}")
    
    print(f"\nTransactions ({len(transactions)}):")
    for t in transactions:
        print(f"  - {t}")
    
    print(f"\nBalances:")
    print(f"  User 1: ₦{check_balance(1)/100:,.2f}")
    print(f"  User 2: ₦{check_balance(2)/100:,.2f}")
    
    print("\n✅ TEST SUITE COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    main()
