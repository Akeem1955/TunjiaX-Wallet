import requests
import json
import os
import time
from dotenv import load_dotenv

load_dotenv()

# Configuration
BASE_URL = "http://localhost:8080"
SECRET_KEY = os.getenv("ELEVENLABS_CUSTOM_LLM_SECRET")

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.session_id = f"test_session_{int(time.time())}"
    
    def test_transaction(self, prompt: str, test_name: str, use_persistent_session: bool = False):
        """Test a single transaction scenario"""
        print(f"\n{'='*70}")
        print(f"🧪 TEST {self.passed + self.failed + 1}: {test_name}")
        print(f"{'='*70}")
        print(f"📤 User Says: '{prompt}'")
        print(f"{'-'*70}")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {SECRET_KEY}"
        }
        
        # Add session ID for multi-turn tests
        if use_persistent_session:
            headers["X-Session-ID"] = self.session_id
        
        # Make request
        response = requests.post(
            f"{BASE_URL}/v1/chat/completions",
            headers=headers,
            json={
                "model": "gemini-2.0-flash-exp",
                "messages": [{"role": "user", "content": prompt}],
                "stream": True
            },
            stream=True
        )
        
        # Collect response
        full_response = ""
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    json_str = decoded[6:]
                    if json_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(json_str)
                        delta = chunk['choices'][0]['delta']
                        if 'content' in delta:
                            content = delta['content']
                            full_response += content
                            print(content, end="", flush=True)
                    except json.JSONDecodeError:
                        pass
        
        print(f"\n{'-'*70}")
        print(f"✅ Response Complete")
        
        # Add delay to avoid rate limiting (10 seconds between requests)
        print(f"⏳ Waiting 10 seconds before next test...")
        time.sleep(10)
        
        return full_response
    
    def assert_contains(self, response: str, expected: str, test_name: str):
        """Check if response contains expected text"""
        if expected.lower() in response.lower():
            self.passed += 1
            print(f"✅ PASS: Found '{expected}'")
            return True
        else:
            self.failed += 1
            print(f"❌ FAIL: Expected to find '{expected}'")
            return False
    
    def print_summary(self):
        """Print test summary"""
        total = self.passed + self.failed
        success_rate = (self.passed / total * 100) if total > 0 else 0
        
        print("\n" + "="*70)
        print("📊 FINAL TEST SUMMARY")
        print("="*70)
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Success Rate: {success_rate:.1f}%")
        print("="*70)

def main():
    print("\n" + "="*70)
    print("🚀 TunjiaX Voice Agent - Comprehensive Test Suite (15 Tests)")
    print("="*70)
    print(f"🔒 API Key: {SECRET_KEY[:6]}...{SECRET_KEY[-5:]}")
    print(f"📡 Backend: {BASE_URL}")
    print(f"👤 Test User: user_id=1 (Admin User)")
    
    runner = TestRunner()
    
    # ========== CATEGORY 1: BENEFICIARY LOOKUP (5 tests) ==========
    print("\n" + "="*70)
    print("📋 CATEGORY 1: Beneficiary Lookup & Recognition")
    print("="*70)
    
    # Test 1: Known beneficiary - Bisola
    response = runner.test_transaction(
        "Transfer 20000 naira to Bisola",
        "Known Beneficiary - Bisola"
    )
    runner.assert_contains(response, "Abisola Adebayo", "Bisola lookup")
    runner.assert_contains(response, "GTBank", "Bisola bank")
    
    # Test 2: Known beneficiary - Tunde
    response = runner.test_transaction(
        "Pay Tunde 10000 naira",
        "Known Beneficiary - Tunde"
    )
    runner.assert_contains(response, "Tunde Adeola", "Tunde lookup")
    runner.assert_contains(response, "Zenith", "Tunde bank")
    
    # Test 3: Known beneficiary - Chioma (different phrasing)
    response = runner.test_transaction(
        "I want to send 5000 to Chioma please",
        "Known Beneficiary - Chioma (polite phrasing)"
    )
    # This might fail - testing phrasing variation
    
    # Test 4: Unknown beneficiary
    response = runner.test_transaction(
        "Transfer 1000 to John",
        "Unknown Beneficiary - John"
    )
    runner.assert_contains(response, "don't have", "Unknown beneficiary handled")
    
    # Test 5: Beneficiary with special characters
    response = runner.test_transaction(
        "Send money to Bisola-Adebayo",
        "Beneficiary Name Variation"
    )
    
    # ========== CATEGORY 2: MULTI-TURN CONVERSATIONS (3 tests) ==========
    print("\n" + "="*70)
    print("📋 CATEGORY 2: Multi-Turn Conversation (Session Management)")
    print("="*70)
    
    # Test 6: Start conversation
    response = runner.test_transaction(
        "I want to send money",
        "Multi-Turn Part 1 - Initial Intent",
        use_persistent_session=True
    )
    runner.assert_contains(response, "how much", "Asks for amount")
    
    # Test 7: Provide amount (should remember context)
    response = runner.test_transaction(
        "5000 naira",
        "Multi-Turn Part 2 - Provide Amount",
        use_persistent_session=True
    )
    # Should ask for beneficiary since it remembers we're sending money
    
    # Test 8: Provide beneficiary name
    response = runner.test_transaction(
        "To Bisola",
        "Multi-Turn Part 3 - Provide Beneficiary",
        use_persistent_session=True
    )
    runner.assert_contains(response, "Bisola", "Remembers conversation")
    
    # ========== CATEGORY 3: INPUT VALIDATION (3 tests) ==========
    print("\n" + "="*70)
    print("📋 CATEGORY 3: Input Validation & Error Handling")
    print("="*70)
    
    # Test 9: Invalid amount
    response = runner.test_transaction(
        "Send negative 5000 to Bisola",
        "Invalid Amount - Negative"
    )
    
    # Test 10: Missing information
    response = runner.test_transaction(
        "Transfer money",
        "Incomplete Request - Missing Details"
    )
    runner.assert_contains(response, "how much", "Asks for missing info")
    
    # Test 11: Ambiguous request
    response = runner.test_transaction(
        "Help me with a transaction",
        "Ambiguous Request"
    )
    runner.assert_contains(response, "help", "Acknowledges request")
    
    # ========== CATEGORY 4: PHRASING VARIATIONS (2 tests) ==========
    print("\n" + "="*70)
    print("📋 CATEGORY 4: Natural Language Variations")
    print("="*70)
    
    # Test 12: Casual phrasing
    response = runner.test_transaction(
        "Yo, send 2k to Tunde real quick",
        "Casual Phrasing - '2k'"
    )
    runner.assert_contains(response, "Tunde", "Understands casual language")
    
    # Test 13: Formal phrasing
    response = runner.test_transaction(
        "I would like to initiate a transfer of fifteen thousand naira to Abisola Adebayo",
        "Formal Phrasing - Full Name"
    )
    
    # ========== CATEGORY 5: OUT-OF-SCOPE REQUESTS (2 tests) ==========
    print("\n" + "="*70)
    print("📋 CATEGORY 5: Out-of-Scope Handling")
    print("="*70)
    
    # Test 14: Balance check (out of scope)
    response = runner.test_transaction(
        "What's my account balance?",
        "Out-of-Scope - Balance Check"
    )
    runner.assert_contains(response, "sorry", "Politely declines")
    
    # Test 15: Completely unrelated
    response = runner.test_transaction(
        "What's the weather like today?",
        "Out-of-Scope - Weather"
    )
    runner.assert_contains(response, "sorry", "Stays in scope")
    
    # Print final summary
    runner.print_summary()

if __name__ == "__main__":
    main()
