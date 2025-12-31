"""
Add test beneficiaries and account for user testing
Run: python add_test_data.py
"""
import os
from dotenv import load_dotenv
from tools import get_db_connection

load_dotenv()

def add_test_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    user_id = 5  # Your current user
    
    # Add beneficiaries
    beneficiaries = [
        ("Bisola", "Abisola Adebayo", "0123456789", "Opay", user_id, 5),
        ("Mama", "Aduke Oluwaseun", "9876543210", "GTBank", user_id, 10),
        ("Adams", "Adams Yusuf", "1234567890", "Access Bank", user_id, 3),
        ("Tunde", "Tunde Bakare", "5555555555", "FirstBank", user_id, 2),
    ]
    
    for alias, name, account, bank, uid, freq in beneficiaries:
        try:
            cursor.execute("""
                INSERT INTO beneficiaries (alias_name, account_name, account_number, bank_name, user_id, frequency_count)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE account_name=%s, bank_name=%s
            """, (alias, name, account, bank, uid, freq, name, bank))
            print(f"✅ Added beneficiary: {alias} ({name})")
        except Exception as e:
            print(f"⚠️ {alias}: {e}")
    
    # Check if user has an account, if not create one
    cursor.execute("SELECT account_id FROM accounts WHERE user_id = %s", (user_id,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO accounts (user_id, account_number, balance_kobo, is_active)
            VALUES (%s, %s, %s, TRUE)
        """, (user_id, "1234567890", 500000 * 100))  # ₦500,000
        print(f"✅ Created account with ₦500,000 balance")
    else:
        # Update balance to 500k
        cursor.execute("UPDATE accounts SET balance_kobo = %s WHERE user_id = %s", (500000 * 100, user_id))
        print(f"✅ Updated account balance to ₦500,000")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("\n✅ Done! Test data added successfully.")

if __name__ == "__main__":
    add_test_data()
