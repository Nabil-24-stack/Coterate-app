# Deploying Coterate to Vercel

This guide provides instructions for deploying the Coterate application to Vercel.

## Method 1: Deploy from the Vercel Dashboard (Recommended)

1. **Log in to your Vercel dashboard** at [vercel.com](https://vercel.com/dashboard)

2. **Import your GitHub repository**:
   - Click "Add New" > "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure the project**:
   - Framework Preset: Create React App
   - Root Directory: coterate
   - Build Command: npm run build
   - Output Directory: build

4. **Add Environment Variables**:
   - Click on "Environment Variables" and add the following:
     - `OPENAI_API_KEY`: Your OpenAI API key (or use a placeholder like "sk-placeholder-for-testing")
     - `STABILITY_API_KEY`: Your Stability AI API key (or use a placeholder)
     - `REACT_APP_SUPABASE_URL`: https://ppzmwdcpllzcaefxfpll.supabase.co
     - `REACT_APP_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwem13ZGNwbGx6Y2FlZnhmcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NjYzNzksImV4cCI6MjA1NzI0MjM3OX0.GgbPHs285VOnIAbfSDQSvAq-vJs9rheamn5HLdvmRxQ

5. **Click "Deploy"**

## Method 2: Deploy Using Vercel CLI

If you prefer using the Vercel CLI, follow these steps:

1. **Install Vercel CLI**:
   ```
   npm install -g vercel
   ```

2. **Log in to Vercel**:
   ```
   vercel login
   ```

3. **Link your project**:
   ```
   cd coterate
   vercel link
   ```

4. **Add environment variables**:
   ```
   vercel env add OPENAI_API_KEY
   vercel env add STABILITY_API_KEY
   vercel env add REACT_APP_SUPABASE_URL
   vercel env add REACT_APP_SUPABASE_ANON_KEY
   ```

5. **Deploy to production**:
   ```
   vercel deploy --prod
   ```

## Troubleshooting

### 405 Method Not Allowed Error

If you encounter a "405 Method Not Allowed" error, it's likely due to one of the following issues:

1. **API Routes Configuration**: Make sure your vercel.json file has the correct routes configuration:
   ```json
   {
     "routes": [
       { "src": "/api/(.*)", "dest": "/api/$1" },
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```

2. **Missing API Keys**: The application is configured to return mock responses when API keys are missing, but you might still see errors in the console. This is expected behavior.

3. **CORS Issues**: If you're experiencing CORS errors, check that the serverless functions have the correct CORS headers:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   ```

### Environment Variables Issues

If you're having trouble with environment variables:

1. **Check Vercel Dashboard**: Go to your project settings in the Vercel dashboard and verify that all environment variables are set correctly.

2. **Use Direct Values**: In your vercel.json file, use direct values instead of references to secrets:
   ```json
   "env": {
     "OPENAI_API_KEY": "sk-placeholder-for-testing",
     "STABILITY_API_KEY": "sk-placeholder-for-testing"
   }
   ```

3. **Redeploy**: After making changes to environment variables, redeploy your application.

## Testing the Deployment

After deploying, test the following endpoints:

1. **Debug Endpoint**: Visit `https://your-app.vercel.app/api/debug` to check environment variables and request handling.

2. **Test Endpoint**: Visit `https://your-app.vercel.app/api/test` to verify that the API routes are working correctly.

3. **UI Improvement**: Try using the UI improvement feature to see if it returns mock responses when API keys are missing.

4. **Component Detection**: Test the component detection feature to ensure it's working as expected. 