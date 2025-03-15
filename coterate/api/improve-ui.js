// Serverless function for UI improvement (combines OpenAI and Stability AI)
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
    // Get API keys from environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
    const stabilityApiKey = process.env.STABILITY_API_KEY || process.env.REACT_APP_STABILITY_API_KEY;
    
    if (!openaiApiKey) {
      console.error('OpenAI API key is missing. Available env vars:', Object.keys(process.env).filter(key => !key.includes('NODE_') && !key.includes('npm_')));
      return res.status(500).json({ error: 'OpenAI API key is missing. Please check your environment variables.' });
    }
    
    if (!stabilityApiKey) {
      console.error('Stability API key is missing. Available env vars:', Object.keys(process.env).filter(key => !key.includes('NODE_') && !key.includes('npm_')));
      return res.status(500).json({ error: 'Stability API key is missing. Please check your environment variables.' });
    }

    // Get the request body
    const { imageBase64, customPrompt } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Step 1: Analyze the image with OpenAI
    console.log('Analyzing UI design with OpenAI...');
    const analysis = await analyzeUIDesign(imageBase64, customPrompt, openaiApiKey);
    
    // Step 2: Generate improved image with Stability AI
    console.log('Generating improved UI with Stability AI...');
    const improvedImage = await generateImprovedImage(analysis, customPrompt, stabilityApiKey);
    
    // Return the results
    return res.status(200).json({
      image: improvedImage,
      analysis: analysis
    });
  } catch (error) {
    console.error('Error in UI improvement process:', error);
    
    return res.status(500).json({
      error: `Failed to improve UI design: ${error.message || 'Unknown error'}`
    });
  }
}

// Function to analyze UI design with OpenAI
async function analyzeUIDesign(imageBase64, customPrompt, apiKey) {
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

  try {
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

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.data.error?.message || 'Unknown error'}`);
    }
    
    throw error;
  }
}

// Function to generate improved image with Stability AI
async function generateImprovedImage(analysis, customPrompt, apiKey) {
  // Extract key improvements from the analysis
  const improvements = extractImprovements(analysis);
  
  // Create a prompt for Stability AI
  let prompt = `Create a modern, professional UI design with the following improvements: ${improvements}`;
  
  // Add custom prompt if provided
  if (customPrompt) {
    prompt += `\n\nAdditional requirements: ${customPrompt}`;
  }

  try {
    // Make the request to Stability AI API
    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Get the generated image
    const generatedImage = response.data.artifacts[0].base64;
    
    return `data:image/png;base64,${generatedImage}`;
  } catch (error) {
    console.error('Error in Stability AI API call:', error);
    
    if (error.response) {
      throw new Error(`Stability API error: ${error.response.data.message || 'Unknown error'}`);
    }
    
    throw error;
  }
}

// Helper function to extract key improvements from the analysis
function extractImprovements(analysis) {
  // Extract key points from the analysis
  const lines = analysis.split('\n');
  const improvements = lines
    .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
    .map(line => line.trim().replace(/^-|\d+\.\s*/, ''))
    .join(', ');
  
  return improvements || 'Improve visual hierarchy, color scheme, typography, layout, and usability';
} 