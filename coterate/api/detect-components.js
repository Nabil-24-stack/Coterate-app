// Serverless function for UI component detection
import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is missing' });
    }

    // Get the request body
    const { imageBase64 } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Prepare the prompt for component detection
    const prompt = `Analyze this UI design and identify all UI components present. 
For each component, provide:
1. Component type (button, input, card, navbar, etc.)
2. Bounding box coordinates (approximate x, y, width, height as percentages of the image)
3. Key attributes (color, text, state, etc.)

Format your response as a JSON array of components, each with:
- type: string (the component type)
- boundingBox: object with x, y, width, height (all as percentages 0-100)
- attributes: object with relevant properties
- confidence: number (0-1 indicating detection confidence)

Example:
[
  {
    "type": "button",
    "boundingBox": { "x": 10, "y": 20, "width": 15, "height": 5 },
    "attributes": { "text": "Submit", "backgroundColor": "blue", "state": "default" },
    "confidence": 0.95
  }
]`;

    // Make the request to OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a UI component detection system. Respond only with valid JSON.'
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
        response_format: { type: "json_object" },
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Parse the JSON response
    const content = response.data.choices[0].message.content;
    let components;
    
    try {
      const parsedResponse = JSON.parse(content);
      components = parsedResponse.components || parsedResponse;
      
      // Ensure components is an array
      if (!Array.isArray(components)) {
        components = [];
      }
      
      // Generate unique IDs for each component
      components = components.map((component, index) => ({
        ...component,
        id: `component-${Date.now()}-${index}`
      }));
    } catch (parseError) {
      console.error('Error parsing component detection response:', parseError);
      components = [];
    }

    // Return the components and the original image
    return res.status(200).json({
      components: components,
      image: imageBase64,
      analysis: 'Component detection completed successfully.'
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