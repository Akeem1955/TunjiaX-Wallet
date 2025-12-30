# TunjiaX-Wallet: Banking at the Speed of Thought

**TunjiaX-Wallet** is a next-generation voice banking assistant designed for high-stress, high-speed environments (like Balogun Market in Lagos). It enables hands-free, secure financial transactions using conversational AI and biometric verification.

## The Narrative ("The Power Move")

> **Scene**: Tunde is in a noisy market. He needs to pay Bisola immediately. He can't type. He just speaks.

1.  **The Ears (Input)**: Tunde says *"Transfer 20k to Bisola"*. **ElevenLabs Conversational AI** captures this over WebSocket, cutting through the noise.
2.  **The Brain (Logic)**: **Gemini 3 Flash** (via Python Backend) analyzes the intent, checks transaction history (Cloud SQL), and identifies the beneficiary ("Abisola Adebayo").
3.  **The Mouth (Response)**: Gemini replies via **ElevenLabs Turbo v2.5** with an ultra-realistic Nigerian accent: *"I found Abisola Adebayo. Which bank?"*
4.  **The Loop**: Tunde confirms *"Opay"*. Gemini updates the transaction state.
5.  **The Security**: Gemini determines risk and triggers a **Biometric Scan**. The Web App intercepts this and opens the **Webcam** for **Gemini Vision** identity verification.
6.  **Success**: Face verified. Money moved. Deal closed.

## Technology Stack

*   **Frontend**: React (Vite) + Tailwind CSS
    *   `@11labs/react`: For low-latency conversational voice streaming.
    *   `react-webcam`: For capturing real-world biometric data.
*   **Backend**: Python (FastAPI)
    *   **Custom LLM Server**: Acts as an OpenAI-compatible endpoint (`/v1/chat/completions`) for ElevenLabs.
    *   **Gemini 3 Flash**: For logic, intent recognition, and tool calling.
    *   **Gemini Vision**: For analyzing webcam frames (`/verify-face`).

## Setup Instructions

### 1. Prerequisites
*   Node.js & npm
*   Python 3.9+
*   Google Cloud Service Account Key (`tunjiax-wallet-key.json`)
*   ElevenLabs Account (Agent ID & API Key)

### 2. Backend Setup
1.  Navigate to `backend/`.
2.  Place your GCP Key: `tunjiax-wallet-key.json`.
3.  Create `.env`:
    ```env
    GOOGLE_APPLICATION_CREDENTIAL=./tunjiax-wallet-key.json
    ELEVENLABS_CUSTOM_LLM_SECRET=your_secure_generated_key
    ```
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Run Server:
    ```bash
    python -m uvicorn main:app --reload --port 8080
    ```

### 3. Frontend Setup
1.  Navigate to `frontend/`.
2.  Create `.env`:
    ```env
    VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run App:
    ```bash
    npm run dev
    ```

### 4. ElevenLabs Agent Configuration
1.  Go to **ElevenLabs Dashboard -> Agents**.
2.  **LLM**: Set to "Custom LLM".
3.  **API URL**: Your backend URL (Requires `ngrok` if testing locally: `https://your-ngrok-url/v1/chat/completions`).
4.  **API Key**: Match the `ELEVENLABS_CUSTOM_LLM_SECRET` from your backend `.env`.

## Usage
1.  Open `http://localhost:5173`.
2.  Click the **Microphone** to connect to TunjiaX.
3.  Speak your transaction request.
4.  When asked to authorize, look at the camera and click **SCAN FACE**.

---
*Built with ❤️*
next things to do 

let push this version of backend to cloud run
so we can configure elven labs agent

Configure ElevenLabs Agent with:
Custom LLM backend URL
Dynamic variable headers (X-User-ID)

Create session management (store JWT, user_id)
Add user profile/balance display
Deploy frontend (Firebase Hosting / Vercel / Cloud Run)