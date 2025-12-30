"""
Add test user to database with profile image for face verification testing
"""
import os
import base64
import bcrypt
from pathlib import Path
from dotenv import load_dotenv
from tools import get_db_connection

load_dotenv()

def image_to_base64(image_path):
    """Convert image to base64 with data URI"""
    with open(image_path, 'rb') as f:
        encoded = base64.b64encode(f.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"

def setup_test_user():
    print("\n" + "="*70)
    print("🔧 Setting Up Test User with Face Image")
    print("="*70)
    
    # Check if profile_image_url column exists, add if not
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("\n1️⃣ Checking database schema...")
        
        # Check if column exists
        cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'banking' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'profile_image_url'
        """)
        
        column_exists = cursor.fetchone()[0] > 0
        
        if not column_exists:
            print("   Adding profile_image_url column...")
            cursor.execute("""
                ALTER TABLE users 
                ADD COLUMN profile_image_url TEXT AFTER password_hash
            """)
            conn.commit()
            print("   ✅ Column added")
        else:
            print("   ✅ Column already exists")
        
        # Load akeem image
        print("\n2️⃣ Loading test image...")
        akeem_img = Path("test_images/akeem.jpeg")
        
        if not akeem_img.exists():
            print(f"   ❌ Image not found: {akeem_img}")
            return
        
        akeem_b64 = image_to_base64(str(akeem_img))
        print(f"   ✅ Loaded akeem.jpeg ({len(akeem_b64)} chars)")
        
        # Create test user
        print("\n3️⃣ Creating test user...")
        
        # Hash password
        password = "test123"
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Check if user already exists
        cursor.execute("SELECT user_id FROM users WHERE email = %s", ("akeem.test@tunjiax.com",))
        existing_user = cursor.fetchone()
        
        if existing_user:
            user_id = existing_user[0]
            print(f"   User already exists (ID: {user_id}), updating profile image...")
            
            cursor.execute("""
                UPDATE users 
                SET profile_image_url = %s, 
                    is_biometric_enabled = TRUE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
            """, (akeem_b64, user_id))
            
        else:
            print("   Creating new user...")
            cursor.execute("""
                INSERT INTO users 
                (full_name, email, phone_number, password_hash, profile_image_url, is_biometric_enabled)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                "Akeem Test User",
                "akeem.test@tunjiax.com",
                "+2348012345678",
                password_hash,
                akeem_b64,
                True
            ))
            user_id = cursor.lastrowid
        
        conn.commit()
        print(f"   ✅ User ID: {user_id}")
        
        # Create account if doesn't exist
        print("\n4️⃣ Creating account...")
        cursor.execute("SELECT account_id FROM accounts WHERE user_id = %s", (user_id,))
        existing_account = cursor.fetchone()
        
        if not existing_account:
            cursor.execute("""
                INSERT INTO accounts (user_id, account_number, balance_kobo)
                VALUES (%s, %s, %s)
            """, (user_id, "0123456789", 50000000))  # 500,000 NGN
            conn.commit()
            print(f"   ✅ Account created: 0123456789")
        else:
            print(f"   ✅ Account already exists")
        
        # Summary
        print("\n" + "="*70)
        print("✅ TEST USER SETUP COMPLETE")
        print("="*70)
        print(f"📧 Email: akeem.test@tunjiax.com")
        print(f"🔑 Password: {password}")
        print(f"👤 User ID: {user_id}")
        print(f"🏦 Account: 0123456789")
        print(f"💰 Balance: NGN 500,000")
        print(f"📸 Profile Image: Stored (akeem.jpeg)")
        print(f"🔐 Biometric: Enabled")
        print("="*70)
        
        cursor.close()
        conn.close()
        
        return user_id
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        cursor.close()
        conn.close()

if __name__ == "__main__":
    setup_test_user()
