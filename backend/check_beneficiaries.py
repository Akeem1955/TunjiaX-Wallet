"""
Check beneficiaries in the database
Run: python check_beneficiaries.py
"""
from dotenv import load_dotenv
from tools import get_db_connection

load_dotenv()

def check_beneficiaries():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("BENEFICIARIES CHECK")
    print("="*60)
    
    # Get all beneficiaries
    cursor.execute("""
        SELECT b.beneficiary_id, b.alias_name, b.account_name, b.account_number, 
               b.bank_name, b.user_id, u.full_name as owner_name
        FROM beneficiaries b
        JOIN users u ON b.user_id = u.user_id
        ORDER BY b.user_id, b.alias_name
    """)
    
    beneficiaries = cursor.fetchall()
    
    if not beneficiaries:
        print("\n❌ No beneficiaries found in database!")
        print("   Gemini has not added any beneficiaries yet.\n")
    else:
        print(f"\n✅ Found {len(beneficiaries)} beneficiary(s):\n")
        for b in beneficiaries:
            print(f"  ID: {b[0]}")
            print(f"  Alias: {b[1]}")
            print(f"  Account Name: {b[2]}")
            print(f"  Account Number: {b[3]}")
            print(f"  Bank: {b[4]}")
            print(f"  Owner (user_id={b[5]}): {b[6]}")
            print("-" * 40)
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_beneficiaries()
