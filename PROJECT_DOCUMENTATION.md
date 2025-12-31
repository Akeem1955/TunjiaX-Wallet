# TunjiaX-Wallet: Voice Banking Platform

## Technical Documentation & Project Overview

---

## 1. Executive Summary

**TunjiaX** is a voice-first banking application designed to bridge Nigeria's digital divide. By combining Google's Gemini 2.0 Flash AI with ElevenLabs' conversational voice technology and DeepFace biometric verification, TunjiaX enables users to perform banking transactions through natural speech—making finance accessible to both tech-savvy youth and elderly users who struggle with traditional mobile banking interfaces.

### Key Features
- 🎤 **Voice Banking** - Execute transfers via natural conversation
- 💬 **Chat Banking** - Text-based AI assistant interface  
- 🔐 **Biometric Security** - Face verification for transaction authorization
- 👥 **Beneficiary Management** - Save and recall frequent recipients
- 📊 **Transaction History** - Complete record of all transactions

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, Vite 7, Tailwind CSS | Modern responsive web interface |
| **Voice Layer** | ElevenLabs Conversational AI | Voice-to-text and text-to-speech |
| **AI Engine** | Google Gemini 2.0 Flash (Vertex AI) | Natural language understanding, intent extraction |
| **Biometrics** | DeepFace | Facial recognition and verification |
| **Backend** | FastAPI (Python 3.11) | RESTful API server |
| **Database** | Google Cloud SQL (MySQL) | Persistent data storage |
| **Hosting** | Google Cloud Run | Serverless container deployment |
| **Authentication** | Google OAuth 2.0 | Secure user login |

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  VoiceWidget    │    │   ChatWidget    │                     │
│  │  (Voice Input)  │    │  (Text Input)   │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                       │                              │
└───────────┼───────────────────────┼──────────────────────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────┐   ┌─────────────────────────────────────────┐
│    ElevenLabs       │   │              FastAPI Backend            │
│   Voice Agent       │───│                                         │
│  (Speech-to-Text)   │   │  ┌─────────────────────────────────┐   │
└─────────────────────┘   │  │  /v1/chat/completions           │   │
                          │  │  (OpenAI-Compatible Endpoint)    │   │
                          │  └──────────────┬──────────────────┘   │
                          │                 │                       │
                          │                 ▼                       │
                          │  ┌─────────────────────────────────┐   │
                          │  │     Gemini 2.0 Flash            │   │
                          │  │   (Intent & Entity Extraction)  │   │
                          │  └──────────────┬──────────────────┘   │
                          │                 │                       │
                          │    ┌────────────┼────────────┐         │
                          │    ▼            ▼            ▼         │
                          │ ┌──────┐   ┌──────────┐  ┌────────┐   │
                          │ │Tools │   │DeepFace  │  │Database│   │
                          │ │      │   │Biometric │  │(MySQL) │   │
                          │ └──────┘   └──────────┘  └────────┘   │
                          └─────────────────────────────────────────┘
```

---

## 3. Core Features

### 3.1 Voice Banking

The voice banking feature uses ElevenLabs' Conversational AI SDK to create a natural dialogue experience:

1. **User speaks**: "Send five thousand naira to Tunde"
2. **ElevenLabs** converts speech to text
3. **Backend receives** the text via `/v1/chat/completions`
4. **Gemini extracts** intent (transfer), amount (₦5,000), and recipient (Tunde)
5. **System confirms** with the user
6. **Biometric trigger** opens face verification modal
7. **Transaction executes** after successful verification

### 3.2 Chat Banking

The text-based chat interface provides the same functionality with streaming responses:

- Real-time character streaming for faster perceived response times
- Message history maintained for conversational context
- Automatic biometric modal trigger when transfers are confirmed

### 3.3 Biometric Face Verification

DeepFace provides secure identity verification:

- **Enrollment**: User's profile image stored during onboarding
- **Verification**: Live webcam capture compared against stored image
- **Threshold**: Configurable similarity threshold for security tuning
- **Atomic Execution**: Transfer only executes after successful verification

---

## 4. API Reference

### 4.1 OpenAI-Compatible Chat Endpoint

```http
POST /v1/chat/completions
Content-Type: application/json
Authorization: Bearer <ELEVENLABS_SECRET>
X-User-ID: <user_id>

{
  "model": "gemini-2.0-flash",
  "messages": [
    {"role": "user", "content": "Send 5000 to Tunde at TunjiaX"}
  ],
  "stream": true
}
```

### 4.2 Face Verification Endpoint

```http
POST /verify-face
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,...",
  "user_id": 3,
  "session_id": "chat_3",
  "amount": 5000,
  "beneficiary_name": "Tunde Bakare",
  "account_number": "0987654321",
  "bank_name": "TunjiaX Bank"
}
```

### 4.3 Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/google` | POST | Google OAuth authentication |
| `/balance/{user_id}` | GET | Get account balance |
| `/transactions/{user_id}` | GET | Get transaction history |
| `/beneficiaries/{user_id}` | GET | List saved beneficiaries |
| `/check-profile-image` | GET | Check if user has profile image |
| `/verify-face` | POST | Biometric verification + transfer |

---

## 5. Security Implementation

### 5.1 Authentication Flow

1. User clicks "Sign in with Google"
2. Frontend receives Google ID token
3. Backend validates token with Google
4. JWT session token issued
5. All subsequent requests include JWT

### 5.2 Transaction Security

- **API Key Validation**: ElevenLabs requests authenticated via shared secret
- **User Context**: `X-User-ID` header ensures correct user context
- **Biometric Gate**: High-value transfers require face verification
- **Atomic Execution**: Verification and transfer in single transaction

### 5.3 Secret Management

| Secret | Storage | Purpose |
|--------|---------|---------|
| `ELEVENLABS_CUSTOM_LLM_SECRET` | GCP Secret Manager | API authentication |
| `DB_PASSWORD` | GCP Secret Manager | Database access |
| `JWT_SECRET_KEY` | GCP Secret Manager | Session tokens |

---

## 6. Deployment Architecture

### 6.1 Cloud Run Configuration

```yaml
Resources:
  Memory: 4Gi
  CPU: 4
  
Environment:
  GCP_PROJECT: tunjiax-wallet-482614
  GCP_LOCATION: us-central1
  
Connections:
  Cloud SQL: tunjiax-wallet-482614:us-central1:tunjiax-db
```

### 6.2 CI/CD Pipeline

GitHub push triggers Cloud Build:
1. **Build**: Docker image with frontend + backend
2. **Push**: Image to Artifact Registry
3. **Deploy**: Update Cloud Run service

---

## 7. Database Schema

### 7.1 Core Tables

**users**
| Column | Type | Description |
|--------|------|-------------|
| user_id | INT | Primary key |
| email | VARCHAR | Google email |
| full_name | VARCHAR | Display name |
| profile_image | LONGBLOB | Biometric reference image |

**accounts**
| Column | Type | Description |
|--------|------|-------------|
| account_id | INT | Primary key |
| user_id | INT | Foreign key |
| balance_kobo | BIGINT | Balance in kobo |
| account_number | VARCHAR | NUBAN number |

**transactions**
| Column | Type | Description |
|--------|------|-------------|
| transaction_id | VARCHAR | UUID |
| user_id | INT | Owner |
| type | ENUM | DEBIT/CREDIT |
| amount_kobo | BIGINT | Amount |
| counterparty_name | VARCHAR | Recipient |
| status | ENUM | SUCCESS/FAILED |

**beneficiaries**
| Column | Type | Description |
|--------|------|-------------|
| beneficiary_id | INT | Primary key |
| user_id | INT | Owner |
| full_name | VARCHAR | Recipient name |
| account_number | VARCHAR | Account number |
| bank_name | VARCHAR | Bank name |
| frequency | INT | Usage count |

---

## 8. External Integrations

### 8.1 ElevenLabs Configuration

**Agent Settings:**
- Custom LLM: TunjiaX backend endpoint
- Voice: Natural conversational voice
- Dynamic Variables: `user_id` → `x-user-id` header

### 8.2 Google Vertex AI

- Model: `gemini-2.0-flash`
- Function Calling: Banking tools defined
- Session Management: Per-user conversation history

---

## 9. Testing

### 9.1 Conversation Test Script

```bash
cd backend
python test_conversation.py
```

Tests complete transaction flow:
1. Balance inquiry
2. Transfer initiation
3. Biometric verification
4. Transfer execution
5. Beneficiary save

---

## 10. Future Enhancements

- [ ] Multi-language support (Yoruba, Hausa, Igbo)
- [ ] Bill payments and airtime top-up
- [ ] Account statements and reports
- [ ] Mini-app marketplace
- [ ] Offline voice caching

---

## 11. Contact & Support

**Developer**: Akeem Oluwaseun  
**Repository**: github.com/Akeem1955/TunjiaX-Wallet  
**Live Demo**: https://tunjiax-wallet-871640164960.us-central1.run.app

---

*Built with ❤️ for the Google Gemini API Developer Competition 2024*
