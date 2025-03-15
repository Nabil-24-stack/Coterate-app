// Serverless function for component detection
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
    
    // For testing purposes, return a mock response if API key is missing
    if (!apiKey) {
      console.log('OpenAI API key missing, returning mock response');
      return res.status(200).json({
        components: [
          {
            type: "Button",
            x: 20,
            y: 30,
            width: 15,
            height: 5,
            content: "Submit",
            style: {
              backgroundColor: "#3498db",
              textColor: "#ffffff",
              borderRadius: "4px",
              borderColor: "transparent"
            }
          },
          {
            type: "Input",
            x: 20,
            y: 20,
            width: 60,
            height: 5,
            content: "Email",
            style: {
              backgroundColor: "#ffffff",
              textColor: "#333333",
              borderRadius: "4px",
              borderColor: "#cccccc"
            }
          },
          {
            type: "Navbar",
            x: 0,
            y: 0,
            width: 100,
            height: 8,
            content: "Navigation",
            style: {
              backgroundColor: "#2c3e50",
              textColor: "#ffffff",
              borderRadius: "0px",
              borderColor: "transparent"
            }
          }
        ],
        image: req.body.imageBase64 || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
      });
    }

    // Get the request body
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Prepare the prompt for component detection
    const prompt = `Analyze this UI design and identify all UI components present in the image. 
For each component, provide:
1. Component type (e.g., Button, Input, Card, Navbar, etc.)
2. Approximate position (x, y coordinates as percentages of the image width/height)
3. Approximate size (width, height as percentages of the image width/height)
4. Content or label text
5. Style information (colors, borders, etc.)

Format your response as a JSON array of components, with each component having the following structure:
{
  "type": "string",
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "content": "string",
  "style": {
    "backgroundColor": "string",
    "textColor": "string",
    "borderRadius": "string",
    "borderColor": "string"
  }
}

Be precise with the coordinates and dimensions. All values should be between 0 and 100 (as percentages).`;

    // Make the request to OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a UI component detection system. You analyze UI designs and identify components with their properties. Always respond with valid JSON.'
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
        max_tokens: 2000,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Parse the response to extract components
    const responseContent = response.data.choices[0].message.content;
    let components;
    
    try {
      const parsedResponse = JSON.parse(responseContent);
      components = parsedResponse.components || [];
      
      if (!Array.isArray(components)) {
        // If components is not an array, try to find an array in the response
        const possibleArrays = Object.values(parsedResponse).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          components = possibleArrays[0];
        } else {
          components = [];
        }
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      components = [];
    }

    // Return the detected components
    return res.status(200).json({
      components,
      image: imageBase64
    });
  } catch (error) {
    console.error('Error in component detection:', error);
    
    // Provide more specific error messages
    if (error.response) {
      return res.status(error.response.status).json({
        error: `OpenAI API error: ${error.response.data.error?.message || 'Unknown error'}`
      });
    }
    
    return res.status(500).json({
      error: `Failed to detect components: ${error.message || 'Unknown error'}`
    });
  }
} 