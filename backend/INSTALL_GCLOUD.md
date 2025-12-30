# Install Google Cloud CLI on Windows

## Quick Install (Recommended)

1. **Download the installer:**
   - Go to: https://cloud.google.com/sdk/docs/install
   - Click "Windows" tab
   - Download the installer (GoogleCloudSDKInstaller.exe)

2. **Run the installer:**
   - Double-click the downloaded file
   - Follow the prompts
   - Check "Run `gcloud init`" at the end

3. **Initialize gcloud:**
   ```powershell
   gcloud init
   ```
   - Login with your Google account
   - Select project: `tunjiax-wallet-482614`
   - Set default region: `us-central1`

4. **Verify installation:**
   ```powershell
   gcloud --version
   ```

## After Installation

You can now deploy:
```powershell
cd C:\Users\akimy\Documents\TunjiaX\backend
gcloud run deploy tunjiax-backend --source . --region us-central1 --allow-unauthenticated
```

---

## Alternative: Use Google Cloud Console UI

If you prefer not to install gcloud:

1. Go to: https://console.cloud.google.com/run
2. Click "Create Service"
3. Select "Continuously deploy from a repository (source)"
4. Connect your GitHub repo
5. Configure build settings

This is slower but doesn't require gcloud CLI.
