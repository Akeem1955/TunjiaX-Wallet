# Multi-stage build: Frontend + Backend in one container
FROM node:18-slim AS frontend-builder

# Build arguments for frontend env vars (passed at build time)
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_BACKEND_URL
ARG VITE_ELEVENLABS_AGENT_ID

# Set as environment variables for Vite build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_ELEVENLABS_AGENT_ID=$VITE_ELEVENLABS_AGENT_ID

# Build frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and DeepFace
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /frontend/dist ./static

# Expose port 8080
EXPOSE 8080

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
