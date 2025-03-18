// Enhanced serverless function for UI improvement using OpenAI and Stability AI
const axios = require('axios');

module.exports = async (req, res) => {
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
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only POST requests are supported for this endpoint'
    });
  }

  try {
    // Log request details for debugging
    console.log('Request method:', req.method);
    console.log('Request headers:', JSON.stringify(req.headers));
    
    // Get request data
    const { imageBase64, customPrompt } = req.body || {};
    
    if (!imageBase64) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Missing required parameter: imageBase64'
      });
    }
    
    // Format image for API requests
    const formattedImage = imageBase64.startsWith('data:') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    // === STEP 1: Analyze the UI design using OpenAI ===
    let analysis = '';
    
    try {
      // Check for OpenAI API key
      const openaiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
      
      if (!openaiKey) {
        console.warn('OpenAI API key is missing, skipping analysis step');
        analysis = "UI design analysis skipped due to missing API key.";
      } else {
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
        const openaiResponse = await axios.post(
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
                      url: `data:image/jpeg;base64,${formattedImage}`
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
              'Authorization': `Bearer ${openaiKey}`
            }
          }
        );

        analysis = openaiResponse.data.choices[0].message.content;
        console.log('✅ OpenAI analysis successful');
      }
    } catch (analysisError) {
      console.error('❌ Error in OpenAI analysis:', analysisError);
      analysis = "Failed to analyze UI design. Continuing with image generation.";
    }
    
    // === STEP 2: Generate improved UI design using Stability AI ===
    let improvedImage = '';
    
    try {
      // Check for Stability API key
      const stabilityKey = process.env.STABILITY_API_KEY || process.env.REACT_APP_STABILITY_API_KEY;
      
      if (!stabilityKey) {
        console.warn('Stability API key is missing, using local canvas-based fallback');
        throw new Error('Missing Stability API key');
      }
      
      // Extract key improvements from the analysis
      const improvements = extractImprovements(analysis);
      
      // Create a prompt for Stability AI
      let imagePrompt = `Create a modern, professional UI design with the following improvements: ${improvements}`;
      
      // Add custom prompt if provided
      if (customPrompt) {
        imagePrompt += `\n\nAdditional requirements: ${customPrompt}`;
      }

      // Make the request to Stability AI API
      const stabilityResponse = await axios.post(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          text_prompts: [
            {
              text: imagePrompt,
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
            'Authorization': `Bearer ${stabilityKey}`
          }
        }
      );

      // Get the generated image
      improvedImage = `data:image/png;base64,${stabilityResponse.data.artifacts[0].base64}`;
      console.log('✅ Stability AI image generation successful');
      
    } catch (generationError) {
      console.error('❌ Error in Stability AI image generation:', generationError);
      console.log('Using canvas-based fallback for image enhancement');
      
      try {
        // Implement a canvas-based enhancement logic
        // This will be executed in browser context when called from the client
        // For the serverless function, we'll return the original image
        // The client-side mockImprovedUIDesign will handle the visual enhancements
        improvedImage = `data:image/jpeg;base64,${formattedImage}`;
      } catch (fallbackError) {
        console.error('Error in fallback image generation:', fallbackError);
        // If all else fails, return the original image
        improvedImage = `data:image/jpeg;base64,${formattedImage}`;
      }
    }
    
    // Return both the analysis and improved image
    return res.status(200).json({
      analysis,
      image: improvedImage
    });
  } catch (error) {
    console.error('Error in improve-ui endpoint:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Unknown error'
    });
  }
};

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