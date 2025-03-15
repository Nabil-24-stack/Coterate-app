// Serverless function for Stability AI API calls
import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the Stability API key from environment variables
    const apiKey = process.env.STABILITY_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Stability API key is missing' });
    }

    // Get the request body
    const { analysis, customPrompt } = req.body;
    
    if (!analysis) {
      return res.status(400).json({ error: 'Analysis data is required' });
    }

    // Extract key improvements from the analysis
    const improvements = extractImprovements(analysis);
    
    // Create a prompt for Stability AI
    let prompt = `Create a modern, professional UI design with the following improvements: ${improvements}`;
    
    // Add custom prompt if provided
    if (customPrompt) {
      prompt += `\n\nAdditional requirements: ${customPrompt}`;
    }

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
    
    // Return the image
    return res.status(200).json({
      image: `data:image/png;base64,${generatedImage}`
    });
  } catch (error) {
    console.error('Error in Stability AI API call:', error);
    
    // Provide more specific error messages
    if (error.response) {
      return res.status(error.response.status).json({
        error: `Stability API error: ${error.response.data.message || 'Unknown error'}`
      });
    }
    
    return res.status(500).json({
      error: `Failed to generate improved UI design: ${error.message || 'Unknown error'}`
    });
  }
}

// Helper function to extract key improvements from the analysis
function extractImprovements(analysis) {
  // Extract key points from the analysis
  // This is a simple implementation - you might want to enhance this
  const lines = analysis.split('\n');
  const improvements = lines
    .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
    .map(line => line.trim().replace(/^-|\d+\.\s*/, ''))
    .join(', ');
  
  return improvements || 'Improve visual hierarchy, color scheme, typography, layout, and usability';
} 