// Serverless function for OpenAI API calls
import axios from 'axios';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key is missing. Available env vars:', Object.keys(process.env).filter(key => !key.includes('NODE_') && !key.includes('npm_')));
      return res.status(500).json({ error: 'OpenAI API key is missing. Please check your environment variables.' });
    }

    // Get the request body
    const { imageBase64, customPrompt } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Prepare the base prompt for UI analysis
    let prompt = `Analyze this UI design and provide specific, actionable improvements. 
Focus on:
1. Visual hierarchy
2. Color scheme and contrast
3. Typography and readability
4. Layout and spacing
5. Consistency
6. Usability and accessibility

Format your response as a structured analysis with clear sections.`;

    // Add custom prompt if provided
    if (customPrompt) {
      prompt += `\n\nAdditional requirements: ${customPrompt}`;
    }

    // Make the request to OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a UI/UX expert specializing in design analysis and improvement.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Return the analysis
    return res.status(200).json({
      analysis: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    
    // Provide more specific error messages
    if (error.response) {
      return res.status(error.response.status).json({
        error: `OpenAI API error: ${error.response.data.error?.message || 'Unknown error'}`
      });
    }
    
    return res.status(500).json({
      error: `Failed to analyze UI design: ${error.message || 'Unknown error'}`
    });
  }
} 