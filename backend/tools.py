import os
import sqlalchemy
from google.cloud.sql.connector import Connector
from datetime import datetime
import uuid

# Global connector instance (initialized on first use)
_connector = None

def get_db_connection():
    """Connect to Cloud SQL MySQL"""
    global _connector
    
    # Initialize connector on first use
    if _connector is None:
        _connector = Connector()
    
    conn = _connector.connect(
        os.getenv("CLOUD_SQL_CONNECTION_NAME"),  # e.g., "tunjiax-wallet-482614:us-central1:tunjiax-db"
        "pymysql",
        user="root",
        password=os.getenv("DB_PASSWORD"),
        db="banking"
    )
    return conn

def lookup_beneficiary(name: str, user_id: int = 1):
    """
    Searches for a beneficiary by alias_name in MySQL for specific user.
    Gemini calls this when user says "Send money to Bisola"
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Case-insensitive search on alias_name for this user only
    cursor.execute(
        """
        SELECT alias_name, account_name, account_number, bank_name, frequency_count
        FROM beneficiaries
        WHERE alias_name LIKE %s AND user_id = %s
        LIMIT 1
        """,
        (f"%{name}%", user_id)
    )
    result = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if result:
        return {
            "alias": result[0],
            "name": result[1],
            "account": result[2],
            "bank": result[3],
            "frequency": result[4]
        }
    return None

def trigger_biometric_auth():
    """Signifies that the agent wants to perform a sensitive action."""
    return {"action": "biometric_scan", "status": "pending"}

def execute_transfer(amount: int, beneficiary_name: str, bank_name: str, account_number: str, user_id: int = 1):
    """
    Executes the final transfer after biometric approval.
    
    This function:
    1. Checks user has sufficient balance
    2. Deducts from user's account
    3. Creates DEBIT transaction record
    4. Updates beneficiary frequency_count
    5. Returns success/failure
    
    Args:
        amount: Amount in Naira (will be converted to kobo internally)
        beneficiary_name: Full name of recipient
        bank_name: Recipient's bank (e.g., GTBank, Opay)
        account_number: 10-digit NUBAN account number
        user_id: The authenticated user's ID
    
    Returns:
        dict with status, transaction_id, and message
    """
    import sys
    print(f"[TRANSFER] Starting transfer: ₦{amount} to {beneficiary_name} ({bank_name})", file=sys.stderr)
    
    # Convert Naira to Kobo
    amount_kobo = amount * 100
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Step 1: Check balance
        cursor.execute(
            """
            SELECT account_id, balance_kobo FROM accounts 
            WHERE user_id = %s AND is_active = TRUE
            LIMIT 1
            """,
            (user_id,)
        )
        account = cursor.fetchone()
        
        if not account:
            print(f"[TRANSFER] ❌ No active account found for user {user_id}", file=sys.stderr)
            return {
                "status": "failed",
                "transaction_id": None,
                "message": "No active account found"
            }
        
        account_id, current_balance = account
        
        if current_balance < amount_kobo:
            print(f"[TRANSFER] ❌ Insufficient balance: {current_balance} kobo < {amount_kobo} kobo", file=sys.stderr)
            return {
                "status": "failed",
                "transaction_id": None,
                "message": f"Insufficient balance. You have ₦{current_balance / 100:,.2f}"
            }
        
        # Step 2: Generate transaction ID
        transaction_id = f"TXN_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8].upper()}"
        
        # Step 3: Deduct from account
        new_balance = current_balance - amount_kobo
        cursor.execute(
            """
            UPDATE accounts 
            SET balance_kobo = %s 
            WHERE account_id = %s
            """,
            (new_balance, account_id)
        )
        print(f"[TRANSFER] Balance updated: {current_balance} → {new_balance} kobo", file=sys.stderr)
        
        # Step 4: Create transaction record
        cursor.execute(
            """
            INSERT INTO transactions 
            (transaction_id, user_id, type, amount_kobo, counterparty_name, counterparty_bank, counterparty_account, status, created_at)
            VALUES (%s, %s, 'DEBIT', %s, %s, %s, %s, 'SUCCESS', NOW())
            """,
            (transaction_id, user_id, amount_kobo, beneficiary_name, bank_name, account_number)
        )
        print(f"[TRANSFER] Transaction record created: {transaction_id}", file=sys.stderr)
        
        # Step 5: Update beneficiary frequency (if exists)
        cursor.execute(
            """
            UPDATE beneficiaries 
            SET frequency_count = frequency_count + 1 
            WHERE user_id = %s AND (alias_name LIKE %s OR account_name LIKE %s)
            """,
            (user_id, f"%{beneficiary_name}%", f"%{beneficiary_name}%")
        )
        
        # Commit all changes
        conn.commit()
        
        print(f"[TRANSFER] ✅ Transfer successful! ID: {transaction_id}", file=sys.stderr)
        
        return {
            "status": "success",
            "transaction_id": transaction_id,
            "message": f"Successfully sent ₦{amount:,} to {beneficiary_name}",
            "new_balance_kobo": new_balance,
            "new_balance_ngn": f"₦{new_balance / 100:,.2f}"
        }
        
    except Exception as e:
        conn.rollback()
        print(f"[TRANSFER] ❌ Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {
            "status": "failed",
            "transaction_id": None,
            "message": f"Transfer failed: {str(e)}"
        }
    finally:
        cursor.close()
        conn.close()


# Tool definitions for Google Gen AI SDK
from google.genai import types

tools_list = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="lookup_beneficiary",
                description="Searches for a beneficiary by their nickname/alias (e.g., 'Bisola'). Returns full banking details.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "name": {"type": "STRING", "description": "The alias or nickname the user mentioned"}
                    },
                    "required": ["name"]
                }
            ),
            types.FunctionDeclaration(
                name="trigger_biometric_auth",
                description="Triggers the biometric security modal (face scan) on the frontend before executing a transfer.",
                parameters={
                    "type": "OBJECT",
                    "properties": {}
                }
            ),
            types.FunctionDeclaration(
                name="execute_transfer",
                description="Executes the final transfer after biometric approval. Only call this AFTER biometric verification.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "amount": {"type": "INTEGER", "description": "Amount in Naira (will be converted to kobo internally)"},
                        "beneficiary_name": {"type": "STRING", "description": "Full name of recipient"},
                        "bank_name": {"type": "STRING", "description": "Recipient's bank (e.g., GTBank, Opay)"},
                        "account_number": {"type": "STRING", "description": "10-digit NUBAN account number"}
                    },
                    "required": ["amount", "beneficiary_name", "bank_name", "account_number"]
                }
            )
        ]
    )
]
