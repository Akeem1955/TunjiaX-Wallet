# Deploy to Cloud Run via Google Cloud Console

## Step 1: Push to GitHub (Done ✅)

Your code is already on GitHub: https://github.com/Akeem1955/TunjiaX-Wallet

---

## Step 2: Deploy via Google Cloud Console

### A. Go to Cloud Run

1. Open: https://console.cloud.google.com/run?project=tunjiax-wallet-482614
2. Click **"Create Service"**

### B. Configure Source

1. Select **"Continuously deploy from a repository"**
2. Click **"Set up with Cloud Build"**
3. Choose **"GitHub"** as source repository
4. Authenticate with GitHub
5. Select repository: **`Akeem1955/TunjiaX-Wallet`**
6. Select branch: **`main`**
7. Build type: **"Dockerfile"**
8. Dockerfile path: **`/Dockerfile`** (at root)

### C. Configure Service

**Service Settings:**
- **Service name:** `tunjiax-app`
- **Region:** `us-central1`
- **Authentication:** Allow unauthenticated invocations ✅

**Container Settings:**
- **Port:** `8080`
- **Memory:** `2 GiB`
- **CPU:** `2`
- **Max instances:** `10`
- **Timeout:** `300` seconds

### D. Add Environment Variables

Click **"Variables & Secrets"** → **"Add Variable"**:

**Backend Variables:**
```
GCP_PROJECT = tunjiax-wallet-482614
GCP_LOCATION = us-central1
CLOUD_SQL_CONNECTION_NAME = tunjiax-wallet-482614:us-central1:tunjiax-db
```

**⚠️ IMPORTANT: Frontend Build Variables**

Since frontend is built at BUILD TIME, you need to set these as **Build Arguments** in Cloud Build settings:

1. Click **"Edit Container"** → **"Variables & Secrets"** → **"Build Arguments"**
2. Add:
   ```
   VITE_GOOGLE_CLIENT_ID = YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
   VITE_BACKEND_URL = https://tunjiax-app-xyz-uc.a.run.app
   VITE_ELEVENLABS_AGENT_ID = YOUR_ELEVENLABS_AGENT_ID
   ```

**OR** you can set them in Cloud Build YAML (if using custom build config):
```yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args:
  - 'build'
  - '--build-arg'
  - 'VITE_GOOGLE_CLIENT_ID=YOUR_VALUE'
  - '--build-arg'
  - 'VITE_BACKEND_URL=https://tunjiax-app-xyz-uc.a.run.app'
  - '--build-arg'
  - 'VITE_ELEVENLABS_AGENT_ID=YOUR_VALUE'
  - '-t'
  - 'gcr.io/$PROJECT_ID/tunjiax-app'
  - '.'
```


### E. Add Secrets

Click **"Add Secret"**:

1. **DB_PASSWORD**
   - Create new secret
   - Value: (your MySQL password)
   - Mount as environment variable

2. **JWT_SECRET_KEY**
   - Create new secret
   - Value: (your JWT secret)
   - Mount as environment variable

3. **ELEVENLABS_CUSTOM_LLM_SECRET**
   - Create new secret
   - Value: (your ElevenLabs API key)
   - Mount as environment variable

4. **GOOGLE_APPLICATION_CREDENTIAL**
   - Upload `tunjiax-wallet-key.json`
   - Mount as volume at: `/secrets/service-account`
   - Then set environment variable: `GOOGLE_APPLICATION_CREDENTIAL=/secrets/service-account/tunjiax-service-account`

### F. Connect Cloud SQL

Under **"Connections"**:
- Click **"Add Connection"**
- Select **"Cloud SQL"**
- Choose instance: `tunjiax-db`

### G. Deploy!

Click **"Create"** and wait (~5-10 minutes for first build)

---

## Step 3: Get Your URL

After deployment completes, you'll get a URL like:
```
https://tunjiax-app-xyz-uc.a.run.app
```

**Test it:**
```bash
curl https://tunjiax-app-xyz-uc.a.run.app
```

You should see your React app!

---

## Step 4: Configure ElevenLabs

1. Go to: https://elevenlabs.io/app/conversational-ai
2. Select your agent
3. Under "LLM" → Select "Custom LLM"
4. Configure:
   - **URL:** `https://tunjiax-app-xyz-uc.a.run.app/v1/chat/completions`
   - **Model:** `gemini-2.0-flash-exp`
   - **API Key:** (your ELEVENLABS_CUSTOM_LLM_SECRET)
   - **Headers:**
     - `Authorization: Bearer <secret>`
     - `X-User-ID: {{user_id}}`
     - `X-Session-ID: {{session_id}}`

---

## Next Steps

- ✅ Frontend accessible at: `https://tunjiax-app-xyz-uc.a.run.app`
- ✅ Backend API at: `https://tunjiax-app-xyz-uc.a.run.app/v1/chat/completions`
- ✅ Update frontend `.env` with Cloud Run URL
- ✅ Test voice conversation
