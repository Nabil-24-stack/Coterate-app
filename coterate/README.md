# Coterate - AI-Powered UI Design Improvement

Coterate is a React application that helps users improve UI designs using AI. The application allows users to upload UI designs, analyze them, and generate improved versions using AI services.

## New Secure Architecture

This application now uses Vercel serverless functions to securely handle API calls to OpenAI and Stability AI. This ensures that your API keys are never exposed to the client-side code.

### Serverless Functions

The following serverless functions have been implemented:

- `/api/openai.js` - Handles API calls to OpenAI for UI analysis
- `/api/stability.js` - Handles API calls to Stability AI for image generation
- `/api/improve-ui.js` - Combines OpenAI and Stability AI for UI improvement
- `/api/detect-components.js` - Handles component detection using OpenAI

## Deployment

For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

## Local Development

To run the application locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with the following variables:
   ```
   REACT_APP_OPENAI_API_KEY=your-openai-api-key
   REACT_APP_STABILITY_API_KEY=your-stability-api-key
   REACT_APP_FIGMA_ACCESS_TOKEN=your-figma-access-token
   ```
4. Start the development server: `npm start`

## Features

- **Authentication**: Users can sign up, log in, and log out using Supabase authentication.
- **Page Management**: Users can create, update, delete, and rename pages to organize their UI designs.
- **UI Analysis**: The application can analyze UI designs using OpenAI's GPT-4o.
- **UI Improvement**: The application can generate improved UI designs using Stability AI.
- **Component Detection**: The application can detect UI components in designs.
- **Figma Integration**: Users can export designs to Figma.

## Security

This application uses a secure architecture to protect your API keys:

- API keys are stored as environment variables on the server
- API calls are made through serverless functions
- No API keys are exposed to the client-side code

## Technologies Used

- **Frontend**: React, TypeScript, Styled Components
- **Backend**: Vercel Serverless Functions, Supabase
- **AI Services**: OpenAI, Stability AI
- **Authentication**: Supabase Auth
- **Database**: Supabase Database
- **Storage**: Supabase Storage

## License

This project is licensed under the MIT License - see the LICENSE file for details. 