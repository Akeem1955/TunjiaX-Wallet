import time
from typing import Dict, List
from google.genai import types

class SessionManager:
    """
    Manages conversation sessions with automatic cleanup after 5 minutes of inactivity
    """
    def __init__(self, timeout_seconds: int = 300):  # 5 minutes default
        self.sessions: Dict[str, Dict] = {}
        self.timeout_seconds = timeout_seconds
    
    def get_or_create_session(self, session_id: str) -> List[types.Content]:
        """
        Gets conversation history for a session, or creates new one if expired/missing
        """
        current_time = time.time()
        
        # Check if session exists and is not expired
        if session_id in self.sessions:
            session = self.sessions[session_id]
            last_activity = session['last_activity']
            
            # Check if session expired (5 minutes of inactivity)
            if current_time - last_activity > self.timeout_seconds:
                print(f"[SESSION] Session {session_id[:8]}... expired, creating new")
                del self.sessions[session_id]
            else:
                # Update activity timestamp
                session['last_activity'] = current_time
                return session['history']
        
        # Create new session
        print(f"[SESSION] Creating new session: {session_id[:8]}...")
        self.sessions[session_id] = {
            'history': [],
            'created_at': current_time,
            'last_activity': current_time
        }
        return self.sessions[session_id]['history']
    
    def update_session(self, session_id: str, history: List[types.Content]):
        """Updates the conversation history for a session"""
        if session_id in self.sessions:
            self.sessions[session_id]['history'] = history
            self.sessions[session_id]['last_activity'] = time.time()
    
    def clear_session(self, session_id: str):
        """Manually clear a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            print(f"[SESSION] Cleared session: {session_id[:8]}...")
    
    def cleanup_expired_sessions(self):
        """Remove all expired sessions (called periodically)"""
        current_time = time.time()
        expired = [
            sid for sid, session in self.sessions.items()
            if current_time - session['last_activity'] > self.timeout_seconds
        ]
        for sid in expired:
            del self.sessions[sid]
        
        if expired:
            print(f"[SESSION] Cleaned up {len(expired)} expired sessions")
        
        return len(expired)
    
    def get_active_session_count(self) -> int:
        """Returns number of active sessions"""
        return len(self.sessions)
