"""
Direct Face Verification Test
Tests Gemini Vision by sending both images directly (bypassing database)
"""
import requests
import base64
import os
from pathlib import Path

# Configuration
BACKEND_URL = "http://localhost:8080"

def image_to_base64(image_path):
    """Convert image file to base64 string"""
    with open(image_path, 'rb') as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def test_direct_comparison(image1_path, image2_path, test_name, expected_result):
    """
    Direct test: Compare two faces using DeepFace ArcFace
    """
    print(f"\n{'='*70}")
    print(f"🧪 TEST: {test_name}")
    print(f"{'='*70}")
    print(f"📸 Image 1: {Path(image1_path).name}")
    print(f"📸 Image 2: {Path(image2_path).name}")
    print(f"✅ Expected: {'SAME PERSON' if expected_result else 'DIFFERENT PEOPLE'}")
    print(f"{'-'*70}")
    
    try:
        print("🤖 Running DeepFace ArcFace...")
        
        # Import DeepFace
        from deepface import DeepFace
        
        # Verify faces using DeepFace with ArcFace model
        result = DeepFace.verify(
            img1_path=str(image1_path),
            img2_path=str(image2_path),
            model_name="ArcFace",  # State-of-the-art accuracy
            enforce_detection=False,  # Allow even if face detection isn't perfect
            detector_backend="opencv"
        )
        
        verified = result["verified"]
        distance = result["distance"]
        threshold = result["threshold"]
        
        # Calculate confidence as percentage
        # When verified=True: Show how far below threshold (100% = perfect match)
        # When verified=False: Show confidence that it's different people
        if verified:
            # Distance below threshold = same person
            # confidence = how close to 0 (perfect match)
            # 0 distance = 100%, threshold = 0%
            confidence_score = (1 - (distance / threshold)) * 100
        else:
            # Distance above threshold = different people
            # Show confidence that they're different
            # The more above threshold, the higher confidence they're different
            excess_distance = distance - threshold
            confidence_score = min(100, (excess_distance / threshold) * 100)
        
        print(f"\n🗣️  DeepFace says:")
        print(f"  Verified: {verified}")
        print(f"  Distance: {distance:.4f}")
        print(f"  Threshold: {threshold:.4f}")
        print(f"  Gap: {abs(distance - threshold):.4f} {'below' if verified else 'above'} threshold")
        
        print(f"\n📊 RESULT:")
        print(f"  Verified: {verified}")
        print(f"  Confidence: {confidence_score:.1f}%")
        print(f"  Reason: {'Same person verified' if verified else 'Different people detected'}")
        
        # Check if result matches expectation
        if verified == expected_result:
            print(f"\n✅ TEST PASSED")
        else:
            print(f"\n❌ TEST FAILED (Expected: {expected_result}, Got: {verified})")
        
        print(f"{'-'*70}")
        return verified == expected_result
            
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    from dotenv import load_dotenv
    load_dotenv()
    
    print("\n" + "="*70)
    print("🔐 TunjiaX Face Verification Test Suite")
    print("="*70)
    print("Testing DeepFace ArcFace - State-of-the-art Face Recognition")
    
    # Get image paths from user
    print("\n📂 Where are your test images located?")
    print("Please provide the directory containing:")
    print("  - akeem.jpg")
    print("  - akeem_b.jpg")
    print("  - afeez.jpg")
    
    base_dir = input("\nEnter directory path (or press Enter for 'test_images'): ").strip()
    if not base_dir:
        base_dir = "test_images"
    
    base_dir = Path(base_dir)
    
    # Image paths - check both .jpg and .jpeg
    def find_image(base_dir, name):
        """Find image with either .jpg or .jpeg extension"""
        jpg_path = base_dir / f"{name}.jpg"
        jpeg_path = base_dir / f"{name}.jpeg"
        
        if jpg_path.exists():
            return jpg_path
        elif jpeg_path.exists():
            return jpeg_path
        else:
            return None
    
    akeem_img = find_image(base_dir, "akeem")
    akeem_b_img = find_image(base_dir, "akeem_b")
    afeez_img = find_image(base_dir, "afeez")
    
    # Check if images exist
    if not akeem_img:
        print(f"\n❌ ERROR: akeem.jpg or akeem.jpeg not found in {base_dir}!")
        return
    if not akeem_b_img:
        print(f"\n❌ ERROR: akeem_b.jpg or akeem_b.jpeg not found in {base_dir}!")
        return
    if not afeez_img:
        print(f"\n❌ ERROR: afeez.jpg or afeez.jpeg not found in {base_dir}!")
        return
    
    print(f"\n✅ Found all test images in {base_dir}")
    
    # Run tests
    results = []
    
    # Test 1: Same person (should be TRUE)
    result1 = test_direct_comparison(
        str(akeem_img),
        str(akeem_b_img),
        "Same Person Test (Akeem vs Akeem_B)",
        expected_result=True
    )
    results.append(("Same Person", result1))
    
    # Wait a bit to avoid rate limiting
    import time
    time.sleep(10)
    
    # Test 2: Different people (should be FALSE)
    result2 = test_direct_comparison(
        str(akeem_img),
        str(afeez_img),
        "Different Person Test (Akeem vs Afeez)",
        expected_result=False
    )
    results.append(("Different People", result2))
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {total_passed}/{len(results)} tests passed")
    print("="*70)

if __name__ == "__main__":
    main()
