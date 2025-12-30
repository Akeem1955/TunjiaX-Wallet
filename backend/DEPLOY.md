# Deploy TunjiaX Backend to Cloud Run

## Step 1: Build and Deploy

```bash
cd backend

# Initiate deployment (gcloud will build the container automatically)
gcloud run deploy tunjiax-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances tunjiax-wallet-482614:us-central1:tunjiax-db \
  --set-env-vars GCP_PROJECT=tunjiax-wallet-482614,GCP_LOCATION=us-central1,CLOUD_SQL_CONNECTION_NAME=tunjiax-wallet-482614:us-central1:tunjiax-db \
  --max-instances 10 \
  --memory 2Gi \
  --timeout 300
```

## Step 2: Set Secrets

```bash
# Create secret for service account credentials
gcloud secrets create tunjiax-service-account \
  --data-file=tunjiax-wallet-key.json \
  --replication-policy="automatic"

# Create secret for DB password
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create db-password --data-file=-

# Create secret for JWT key
echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# Create secret for ElevenLabs key
echo -n "YOUR_ELEVENLABS_SECRET" | gcloud secrets create elevenlabs-secret --data-file=-

# Grant Cloud Run service account access to secrets
gcloud secrets add-iam-policy-binding tunjiax-service-account \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 3: Update Deployment with Secrets

```bash
gcloud run services update tunjiax-backend \
  --region us-central1 \
  --set-secrets=GOOGLE_APPLICATION_CREDENTIALS=tunjiax-service-account:latest \
  --set-secrets=DB_PASSWORD=db-password:latest \
  --set-secrets=JWT_SECRET_KEY=jwt-secret:latest \
  --set-secrets=ELEVENLABS_CUSTOM_LLM_SECRET=elevenlabs-secret:latest
```

## Step 4: Get URL

```bash
gcloud run services describe tunjiax-backend --region us-central1 --format='value(status.url)'
```

This will output something like:
```
https://tunjiax-backend-abc123-uc.a.run.app
```

## Step 5: Test Deployment

```bash
# Test the endpoint
curl https://tunjiax-backend-abc123-uc.a.run.app/v1/chat/completions \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-2.0-flash-exp","messages":[{"role":"user","content":"Hello"}],"stream":false}'
```

## Next: Configure ElevenLabs

1. Copy the Cloud Run URL
2. Go to ElevenLabs dashboard
3. Configure Custom LLM with the URL
