"""
Update user profile image to BLOB format
Run this AFTER running the SQL migration
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from tools import get_db_connection

load_dotenv()

def update_profile_image_blob():
    print("\n🔧 Updating user_id=1 profile image (BLOB format)...")
    
    # Load akeem image
    akeem_img = Path("test_images/akeem.jpeg")
    
    if not akeem_img.exists():
        print(f"❌ {akeem_img} not found!")
        return
    
    # Read as raw bytes
    with open(akeem_img, 'rb') as f:
        image_bytes = f.read()
    
    print(f"✅ Loaded image ({len(image_bytes)} bytes)")
    
    # Update database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users 
            SET profile_image = %s, 
                is_biometric_enabled = TRUE
            WHERE user_id = 1
        """, (image_bytes,))
        
        conn.commit()
        print(f"✅ Updated user_id=1 profile image (BLOB)")
        print(f"✅ Enabled biometric authentication")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        cursor.close()
        conn.close()

if __name__ == "__main__":
    update_profile_image_blob()
