import os
import sqlalchemy
from google.cloud.sql.connector import Connector

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

def execute_transfer(amount: int, beneficiary_name: str, bank_name: str, account_number: str):
    """
    Executes the final transfer after biometric approval.
    In production, this would:
    1. Deduct from user's account
    2. Create DEBIT transaction record
    3. Call external payment gateway API
    """
    # TODO: Implement real transfer logic
    return {"status": "success", "transaction_id": "TXN_123456789"}

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
