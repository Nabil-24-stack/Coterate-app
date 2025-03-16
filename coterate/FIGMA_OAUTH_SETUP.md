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
   - Scopes: Select `files:read` (Figma does not support `files:write` for OAuth)
4. Click "Create app"
5. Note down the Client ID and Client Secret

## 2. Configure Supabase OAuth Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to Authentication > Providers
4. Find and enable the Figma provider
5. Enter the Client ID and Client Secret from your Figma OAuth app
6. Set the Redirect URL to: **https://ppzmwdcpllzcaefxfpll.supabase.co/auth/v1/callback**
7. Set the Scopes to: `files:read`
8. Save the changes

## 3. Update Your Application

1. Make sure your application is using the correct Supabase URL and anon key in your `.env.local` file:
   ```
   REACT_APP_SUPABASE_URL=https://ppzmwdcpllzcaefxfpll.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Ensure your application is using the correct OAuth configuration in the Figma OAuth flow:
   ```javascript
   const { data, error } = await supabase.auth.signInWithOAuth({
     provider: 'figma',
     options: {
       redirectTo: `${window.location.origin}/auth/callback`,
       scopes: 'files:read',
       skipBrowserRedirect: true // Get the URL instead of redirecting automatically
     }
   });
   
   // If we have a URL, redirect manually
   if (data?.url) {
     window.location.href = data.url;
   }
   ```

## 4. Testing the OAuth Flow

1. Make sure your application has a route set up to handle the callback at `/auth/callback`
2. Try signing in with Figma from your application
3. Check the browser console for any errors
4. If you encounter CORS errors, try using the direct test page at `/direct-figma-auth.html`

## 5. Troubleshooting CORS Issues

If you're experiencing CORS errors when using Figma OAuth, try these solutions:

1. **Use the Direct Test Page**: 
   - Open `/direct-figma-auth.html` in your browser
   - Enter your Figma Client ID
   - Use the page URL itself as the redirect URI
   - This bypasses Supabase and tests the Figma OAuth flow directly

2. **Check Browser Extensions**:
   - Disable any ad blockers or privacy extensions that might be blocking requests to Figma
   - Try using an incognito/private browsing window

3. **Verify Redirect URI**:
   - Make sure the redirect URI in your Figma app settings exactly matches the one you're using
   - For Supabase, this should be: `https://ppzmwdcpllzcaefxfpll.supabase.co/auth/v1/callback`

4. **Manual Code Exchange**:
   - If the authorization code is received but session creation fails, try manually exchanging the code:
   ```javascript
   const { data, error } = await supabase.auth.exchangeCodeForSession(code);
   ```

5. **Check Network Requests**:
   - Use the Network tab in your browser's developer tools
   - Look for requests to Figma's API endpoints
   - Check for any blocked requests or CORS errors

## 6. Important Notes

- The Supabase callback URL is specific to your Supabase project
- You must use the exact same callback URL in both Figma and Supabase
- The callback URL must be an exact match, including the protocol (https://) and any trailing slashes
- Figma OAuth requires HTTPS for production applications
- Figma only supports the `files:read` scope for OAuth, not `files:write`
- If you continue to experience CORS issues, consider using a server-side OAuth flow instead of client-side 