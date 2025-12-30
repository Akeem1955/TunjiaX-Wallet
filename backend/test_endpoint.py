"""
Test /verify-face endpoint with real database user
"""
import requests
import base64
from pathlib import Path

BACKEND_URL = "http://localhost:8080"

def image_to_base64(image_path):
    """Convert image to base64 with data URI"""
    with open(image_path, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"

def test_face_verification_endpoint():
    print("\n" + "="*70)
    print("🧪 Testing /verify-face Endpoint with Database")
    print("="*70)
    
    # Test images
    akeem_b_img = Path("test_images/akeem_b.jpeg")  # Different image of same person
    afeez_img = Path("test_images/afeez.jpeg")      # Different person
    
    if not akeem_b_img.exists() or not afeez_img.exists():
        print("❌ Test images not found!")
        return
    
    print("\n✅ Found test images")
    print(f"   Stored in DB: akeem.jpeg (user_id=1)")
    print(f"   Test 1: akeem_b.jpeg (same person)")
    print(f"   Test 2: afeez.jpeg (different person)\n")
    
    # Test 1: Same person (should verify)
    print("="*70)
    print("TEST 1: Same Person (Akeem stored vs Akeem_B live)")
    print("="*70)
    
    live_b64 = image_to_base64(str(akeem_b_img))  # Already includes data URI prefix
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/verify-face",
            json={
                "image": live_b64,  # Don't add prefix again!
                "user_id": 1
            },
            timeout=30
        )
        
        print(f"📡 Status: {response.status_code}")
        result = response.json()
        print(f"📦 Response:")
        for key, value in result.items():
            print(f"   {key}: {value}")
        
        if result.get("verified"):
            print("\n✅ TEST 1 PASSED: Same person verified!")
        else:
            print("\n❌ TEST 1 FAILED: Should have verified")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print()
    
    # Test 2: Different person (should NOT verify)
    print("="*70)
    print("TEST 2: Different Person (Akeem stored vs Afeez live)")
    print("="*70)
    
    live_b64 = image_to_base64(str(afeez_img))  # Already includes data URI prefix
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/verify-face",
            json={
                "image": live_b64,  # Don't add prefix again!
                "user_id": 1
            },
            timeout=30
        )
        
        print(f"📡 Status: {response.status_code}")
        result = response.json()
        print(f"📦 Response:")
        for key, value in result.items():
            print(f"   {key}: {value}")
        
        if not result.get("verified"):
            print("\n✅ TEST 2 PASSED: Different person rejected!")
        else:
            print("\n❌ TEST 2 FAILED: Should NOT have verified")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    test_face_verification_endpoint()
