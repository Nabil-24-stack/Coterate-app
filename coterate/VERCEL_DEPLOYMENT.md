# Vercel Deployment Guide for Coterate

This guide explains how to deploy Coterate to Vercel with secure API key handling.

## Setting Up Environment Variables in Vercel

For security reasons, API keys should be stored as environment variables in Vercel rather than in your code. Follow these steps to set up your environment variables:

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Select your Coterate project
3. Go to the "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. Add the following environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `OPENAI_API_KEY` | `your-openai-api-key` | Your OpenAI API key |
| `STABILITY_API_KEY` | `your-stability-api-key` | Your Stability AI API key |
| `FIGMA_ACCESS_TOKEN` | `your-figma-access-token` | Your Figma access token (if needed) |

6. Make sure to select all environments (Production, Preview, and Development) where these variables should be available
7. Click "Save" to apply the changes

## Vercel Secrets vs. Environment Variables

In the `vercel.json` file, we're using the `@` prefix for environment variables (e.g., `@openai_api_key`). This syntax refers to Vercel Secrets, which are a more secure way to store sensitive information.

To create these secrets:

1. Install the Vercel CLI if you haven't already: `npm i -g vercel`
2. Log in to Vercel from the CLI: `vercel login`
3. Add your secrets using the CLI:
   ```
   vercel secrets add openai_api_key your-openai-api-key
   vercel secrets add stability_api_key your-stability-api-key
   vercel secrets add figma_access_token your-figma-access-token
   ```

## Redeploying Your Application

After setting up your environment variables:

1. Go to the "Deployments" tab in your Vercel project
2. Click on the "..." menu next to your latest deployment
3. Select "Redeploy" to apply the new environment variables

## Verifying Your Deployment

After redeployment:

1. Visit your deployed application
2. Try using the AI features that require API keys
3. Check the browser console for any errors related to API keys

If you encounter any issues, verify that:
- Your API keys are correct
- The environment variables are properly set up in Vercel
- The serverless functions are properly deployed

## Troubleshooting

If you encounter issues with the API calls:

1. Check the Vercel Function Logs in your project dashboard
2. Verify that the API keys are correctly set in the environment variables
3. Make sure the serverless functions are properly deployed in the `/api` directory

For more help, refer to the [Vercel documentation on environment variables](https://vercel.com/docs/concepts/projects/environment-variables) and [serverless functions](https://vercel.com/docs/concepts/functions/serverless-functions). 