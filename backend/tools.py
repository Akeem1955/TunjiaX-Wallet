# Mock Database
BENEFICIARIES = {
    "bisola": {"name": "Abisola Adebayo", "bank": "GTBank", "account": "0123456789"},
    "tunde": {"name": "Tunde Bakare", "bank": "Zenith", "account": "9876543210"}
}

def lookup_beneficiary(name: str):
    """Searches for a beneficiary by name (fuzzy match simulated)."""
    name_lower = name.lower()
    for key, data in BENEFICIARIES.items():
        if key in name_lower:
            return data
    return None

def trigger_biometric_auth():
    """Signifies that the agent wants to perform a sensitive action."""
    return {"action": "biometric_scan", "status": "pending"}

def execute_transfer(amount: int, beneficiary_name: str, bank_name: str, account_number: str):
    """Executes the final transfer after approval."""
    return {"status": "success", "transaction_id": "TXN_123456789"}

# List of tools to be passed to Gemini
tools_list = [lookup_beneficiary, trigger_biometric_auth, execute_transfer]
