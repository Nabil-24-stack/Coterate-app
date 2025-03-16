# Setting Up Figma OAuth with Supabase

This guide will help you set up Figma OAuth authentication with Supabase for the Coterate app.

## 1. Create a Figma OAuth App

1. Go to [Figma Developer Settings](https://www.figma.com/developers/apps)
2. Click "Create a new app"
3. Fill in the required information:
   - Name: Coterate
   - Description: Design iteration tool with AI-powered improvements
   - Website URL: Your app's URL (e.g., https://your-app-domain.com)
   - OAuth Redirect URLs: **https://ppzmwdcpllzcaefxfpll.supabase.co/auth/v1/callback**
   - Scopes: Select `files:read` and `files:write`
4. Click "Create app"
5. Note down the Client ID and Client Secret

## 2. Configure Supabase OAuth Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to Authentication > Providers
4. Find and enable the Figma provider
5. Enter the Client ID and Client Secret from your Figma OAuth app
6. Set the Redirect URL to: **https://ppzmwdcpllzcaefxfpll.supabase.co/auth/v1/callback**
7. Set the Scopes to: `files:read files:write`
8. Save the changes

## 3. Update Your Application

1. Make sure your application is using the correct Supabase URL and anon key in your `.env.local` file:
   ```
   REACT_APP_SUPABASE_URL=https://ppzmwdcpllzcaefxfpll.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Ensure your application is using the correct redirect URL in the Figma OAuth flow:
   ```javascript
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'figma',
     options: {
       redirectTo: `${window.location.origin}/auth/callback`,
       scopes: 'files:read files:write'
     }
   });
   ```

## 4. Testing the OAuth Flow

1. Make sure your application has a route set up to handle the callback at `/auth/callback`
2. Try signing in with Figma from your application
3. Check the browser console for any errors
4. If you encounter CORS errors, make sure:
   - Your Figma OAuth app has the correct redirect URL
   - Your Supabase project has the correct Figma OAuth configuration
   - Your application is using the correct Supabase URL and anon key

## 5. Troubleshooting

If you're still having issues with the OAuth flow, try the following:

1. Check the Network tab in your browser's developer tools to see the exact requests and responses
2. Look for any error messages in the URL parameters when redirected back to your application
3. Verify that your Figma OAuth app has the correct redirect URL
4. Make sure your Supabase project has the correct Figma OAuth configuration
5. Try using the `/figma-oauth-test.html` page to test the direct OAuth flow

## 6. Important Notes

- The Supabase callback URL is specific to your Supabase project
- You must use the exact same callback URL in both Figma and Supabase
- The callback URL must be an exact match, including the protocol (https://) and any trailing slashes
- Figma OAuth requires HTTPS for production applications 