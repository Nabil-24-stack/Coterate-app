/**
 * AI Service for UI Improvements
 * This service handles whole-image approaches for UI design improvements
 */

// API keys from environment variables
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.REACT_APP_STABILITY_API_KEY;

// Base URLs for APIs
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_VISION_URL = 'https://api.openai.com/v1/chat/completions';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

/**
 * Generate an improved UI design using the whole-image approach
 * @param imageBase64 Base64 encoded image data
 * @returns Object with improved image and analysis
 */
export const generateImprovedUIDesign = async (imageBase64: string): Promise<{ image: string; analysis: string }> => {
  console.log('Starting whole-image UI improvement process...');

  // Validate API key - fail explicitly if not present
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing. Please add REACT_APP_OPENAI_API_KEY to your .env.local file.');
  }
  
  try {
    // First, analyze the UI design with OpenAI
    const analysis = await analyzeUIDesign(imageBase64);
    console.log('UI analysis completed');
    
    // Then, generate an improved UI design based on the analysis
    const improvedImage = await generateImprovedImage(imageBase64, analysis);
    console.log('Improved UI generated');
    
    return {
      image: improvedImage,
      analysis: analysis
    };
  } catch (error) {
    console.error('Error in UI improvement process:', error);
    throw error;
  }
};

/**
 * Analyze a UI design using OpenAI's GPT-4 Vision
 * @param imageBase64 Base64 encoded image data
 * @returns Analysis text
 */
async function analyzeUIDesign(imageBase64: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing. Please check your .env file.');
  }
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this UI design and suggest improvements for color scheme, typography, layout, spacing, and overall visual hierarchy. Be specific with your suggestions.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing UI design:', error);
    throw error;
  }
}

/**
 * Generate an improved image based on analysis
 * @param originalImageBase64 Original image
 * @param analysisText Analysis text
 * @returns Improved image
 */
async function generateImprovedImage(originalImageBase64: string, analysisText: string): Promise<string> {
  if (!STABILITY_API_KEY) {
    throw new Error('Stability API key is missing. Please check your .env file.');
  }
  
  try {
    // Create a prompt based on the analysis
    const prompt = `Create an improved version of this UI design with these changes:
${analysisText.substring(0, 1000)}

Make sure to maintain the same general layout and content, but improve the visual design.`;
    
    // Call Stability AI API
    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1
          },
          {
            text: "blurry, distorted, low quality, pixelated, poor design, amateurish",
            weight: -1
          }
        ],
        cfg_scale: 7,
        height: 768,
        width: 1024,
        samples: 1,
        steps: 40
      })
    });
    
    if (!response.ok) {
      throw new Error(`Stability API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.artifacts || data.artifacts.length === 0) {
      throw new Error('No image generated');
    }
    
    return `data:image/png;base64,${data.artifacts[0].base64}`;
  } catch (error) {
    console.error('Error generating improved image:', error);
    throw error;
  }
} 