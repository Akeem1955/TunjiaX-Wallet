# TunjiaX-Wallet: Voice Banking for Nigeria

🎤 Voice-first banking assistant using **Gemini 2.0 Flash** + **ElevenLabs** + **DeepFace biometrics**.

## Features
- ✅ Voice Banking with ElevenLabs
- ✅ Chat Banking with Gemini AI
- ✅ Face Verification with DeepFace
- ✅ Internal TunjiaX Transfers
- ✅ Beneficiary Management
- ✅ Google OAuth Authentication


## Quick Start (Local Development)

### Backend
```bash
cd backend
pip install -r requirements.txt
# Configure .env with your values
python -m uvicorn main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
# Configure .env with your values
npm run dev
```

## Cloud Run Deployment

### 1. Build & Push
```bash
gcloud builds submit --tag gcr.io/tunjiax-wallet-482614/tunjiax-app \
  --build-arg VITE_GOOGLE_CLIENT_ID=your_client_id \
  --build-arg VITE_BACKEND_URL=https://tunjiax-app-xxxxx.run.app \
  --build-arg VITE_ELEVENLABS_AGENT_ID=your_agent_id
```

### 2. Deploy
```bash
gcloud run deploy tunjiax-app \
  --image gcr.io/tunjiax-wallet-482614/tunjiax-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT=tunjiax-wallet-482614,GCP_LOCATION=us-central1" \
  --set-secrets="ELEVENLABS_CUSTOM_LLM_SECRET=elevenlabs-secret:latest,DB_PASSWORD=db-password:latest,JWT_SECRET_KEY=jwt-secret:latest,GOOGLE_CLIENT_ID=google-client-id:latest" \
  --add-cloudsql-instances=tunjiax-wallet-482614:us-central1:tunjiax-db
```

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Build-arg | Google OAuth Client ID |
| `VITE_BACKEND_URL` | Build-arg | Backend URL (same origin for combined deploy) |
| `VITE_ELEVENLABS_AGENT_ID` | Build-arg | ElevenLabs Agent ID |
| `GOOGLE_CLIENT_ID` | Runtime | Same as VITE_GOOGLE_CLIENT_ID |
| `GCP_PROJECT` | Runtime | Google Cloud Project ID |
| `GCP_LOCATION` | Runtime | Vertex AI region |
| `CLOUD_SQL_CONNECTION_NAME` | Runtime | Cloud SQL connection string |
| `DB_PASSWORD` | Secret | Database password |
| `JWT_SECRET_KEY` | Secret | JWT signing key |
| `ELEVENLABS_CUSTOM_LLM_SECRET` | Secret | ElevenLabs API key |

---
*Built with ❤️ for the Nigerian hustle*