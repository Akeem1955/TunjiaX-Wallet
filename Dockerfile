# ==============================================================================
# TunjiaX-Wallet: Combined Frontend + Backend Dockerfile
# Optimized for Google Cloud Run deployment
# ==============================================================================

# Stage 1: Build Frontend (Node 20+ required for Vite 7)
FROM node:20-slim AS frontend-builder

WORKDIR /frontend

# Install dependencies first (better caching)
COPY frontend/package*.json ./
RUN npm ci --only=production=false

# Copy source and build
COPY frontend/ ./

# Build-time args for Vite (these get baked into the bundle)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BACKEND_URL
ARG VITE_ELEVENLABS_AGENT_ID

# Set as env vars for the build process
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_ELEVENLABS_AGENT_ID=$VITE_ELEVENLABS_AGENT_ID

# Build the production bundle
RUN npm run build

# ==============================================================================
# Stage 2: Production Backend + Serve Frontend
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for DeepFace/OpenCV
# Note: libgl1-mesa-glx replaced by libgl1 in newer Debian (Trixie)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend from Stage 1 into /app/static
COPY --from=frontend-builder /frontend/dist ./static

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Cloud Run handles health checks automatically via HTTP requests to /

# Run with uvicorn
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
