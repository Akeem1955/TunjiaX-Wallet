"""
Reset database and create two test users with profile images
NO beneficiaries added - test Gemini's ability to add them
Run: python reset_database.py
"""
import os
from dotenv import load_dotenv
from tools import get_db_connection

load_dotenv()

def reset_and_seed():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("🔄 Clearing all data...")
    
    # Clear all tables in order (foreign key constraints)
    cursor.execute("DELETE FROM transactions")
    cursor.execute("DELETE FROM beneficiaries")
    cursor.execute("DELETE FROM accounts")
    cursor.execute("DELETE FROM users")
    
    # Reset auto-increment
    cursor.execute("ALTER TABLE users AUTO_INCREMENT = 1")
    cursor.execute("ALTER TABLE accounts AUTO_INCREMENT = 1")
    cursor.execute("ALTER TABLE beneficiaries AUTO_INCREMENT = 1")
    cursor.execute("ALTER TABLE transactions AUTO_INCREMENT = 1")
    
    print("✅ All tables cleared")
    
    # Load images
    akeem_image_path = "test_images/akeem.jpeg"
    afeez_image_path = "test_images/afeez.jpeg"
    
    akeem_image = None
    afeez_image = None
    
    if os.path.exists(akeem_image_path):
        with open(akeem_image_path, "rb") as f:
            akeem_image = f.read()
        print(f"✅ Loaded akeem.jpeg ({len(akeem_image)} bytes)")
    else:
        print(f"⚠️ akeem.jpeg not found at {akeem_image_path}")
    
    if os.path.exists(afeez_image_path):
        with open(afeez_image_path, "rb") as f:
            afeez_image = f.read()
        print(f"✅ Loaded afeez.jpeg ({len(afeez_image)} bytes)")
    else:
        print(f"⚠️ afeez.jpeg not found at {afeez_image_path}")
    
    # Create User A: Akeem
    cursor.execute("""
        INSERT INTO users (email, full_name, phone_number, profile_image, password_hash)
        VALUES (%s, %s, %s, %s, %s)
    """, ("akeem@tunjiax.com", "Akeem Oluwaseun", "+2348012345678", akeem_image, "test_hash_akeem"))
    akeem_id = cursor.lastrowid
    print(f"✅ Created User A: Akeem (user_id={akeem_id})")
    
    # Create User B: Tunde
    cursor.execute("""
        INSERT INTO users (email, full_name, phone_number, profile_image, password_hash)
        VALUES (%s, %s, %s, %s, %s)
    """, ("tunde@tunjiax.com", "Tunde Bakare", "+2348098765432", afeez_image, "test_hash_tunde"))
    tunde_id = cursor.lastrowid
    print(f"✅ Created User B: Tunde (user_id={tunde_id})")
    
    # Create accounts for both users
    cursor.execute("""
        INSERT INTO accounts (user_id, account_number, balance_kobo, is_active)
        VALUES (%s, %s, %s, TRUE)
    """, (akeem_id, "1234567890", 500000 * 100))  # ₦500,000
    print(f"✅ Created account for Akeem: 1234567890 (₦500,000)")
    
    cursor.execute("""
        INSERT INTO accounts (user_id, account_number, balance_kobo, is_active)
        VALUES (%s, %s, %s, TRUE)
    """, (tunde_id, "0987654321", 300000 * 100))  # ₦300,000
    print(f"✅ Created account for Tunde: 0987654321 (₦300,000)")
    
    # NO beneficiaries added - test Gemini's ability to add them
    print("⏭️ Skipping beneficiaries - test Gemini add_beneficiary feature")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("\n" + "="*50)
    print("✅ DATABASE RESET COMPLETE!")
    print("="*50)
    print(f"""
Users (NO beneficiaries):
  1. Akeem (user_id=1)
     - Email: akeem@tunjiax.com
     - Account: 1234567890
     - Balance: ₦500,000
     
  2. Tunde (user_id=2)
     - Email: tunde@tunjiax.com  
     - Account: 0987654321
     - Balance: ₦300,000

To check beneficiaries later: python check_beneficiaries.py
""")

if __name__ == "__main__":
    reset_and_seed()
