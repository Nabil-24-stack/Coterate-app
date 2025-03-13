/**
 * AI Service for UI Improvements
 * This service handles whole-image approaches for UI design improvements
 */

// API keys from environment variables
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.REACT_APP_STABILITY_API_KEY;

// Base URLs for APIs
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

/**
 * AI Service object for UI improvements
 */
export const aiService = {
  /**
   * Improve a UI design using the whole-image approach
   * @param imageBase64 Base64 encoded image data
   * @returns Object with improved image and analysis
   */
  improveUI: async (imageBase64: string): Promise<{ image: string; analysis: any }> => {
    const result = await generateImprovedUIDesign(imageBase64);
    return {
      image: result.image,
      analysis: result.analysis
    };
  }
};

/**
 * Generate an improved UI design using the whole-image approach
 * @param imageBase64 Base64 encoded image data
 * @param iterationPrompt Optional prompt to guide the AI in generating improvements
 * @returns Object with improved image and analysis
 */
export const generateImprovedUIDesign = async (
  imageBase64: string, 
  iterationPrompt?: string
): Promise<{ image: string; analysis: string }> => {
  console.log('Starting whole-image UI improvement process...');
  if (iterationPrompt) {
    console.log('Using custom iteration prompt:', iterationPrompt);
  }

  // Validate API key - fail explicitly if not present
  if (!OPENAI_API_KEY || !OPENAI_API_KEY.toString().startsWith('sk-')) {
    throw new Error('OpenAI API key is missing or invalid. Please add a valid REACT_APP_OPENAI_API_KEY to your .env.local file.');
  }
  
  // Validate Stability API key
  if (!STABILITY_API_KEY || !STABILITY_API_KEY.toString().startsWith('sk-')) {
    throw new Error('Stability API key is missing or invalid. Please add a valid REACT_APP_STABILITY_API_KEY to your .env.local file.');
  }
  
  // Clean up the API key by removing any quotes, spaces, or line breaks
  const cleanedApiKey = OPENAI_API_KEY.toString()
    .replace(/["']/g, '') // Remove quotes
    .replace(/\s+/g, '')  // Remove whitespace including line breaks
    .trim();              // Trim any remaining whitespace
  
  if (cleanedApiKey === 'your-openai-api-key-here') {
    throw new Error('Please replace the placeholder API key with your actual OpenAI API key in the .env.local file.');
  }
  
  try {
    // First, analyze the UI design with OpenAI
    console.log('🔍 Starting UI analysis with OpenAI...');
    console.log('🌐 Using OpenAI API URL:', OPENAI_API_URL);
    const analysis = await analyzeUIDesign(imageBase64, cleanedApiKey, iterationPrompt);
    console.log('✅ UI analysis completed');
    
    // Then, generate an improved UI design based on the analysis
    console.log('🎨 Starting image generation with Stability AI...');
    console.log('🌐 Using Stability API URL:', STABILITY_API_URL);
    const improvedImage = await generateImprovedImage(imageBase64, analysis, STABILITY_API_KEY.toString(), iterationPrompt);
    console.log('✅ Improved UI generated');
    
    return {
      image: improvedImage,
      analysis: analysis
    };
  } catch (error) {
    console.error('Error in UI improvement process:', error);
    // Re-throw the error instead of falling back to mock
    throw error;
  }
};

/**
 * Analyze a UI design using OpenAI's GPT-4 Vision
 * @param imageBase64 Base64 encoded image data
 * @param apiKey Cleaned OpenAI API key
 * @param iterationPrompt Optional prompt to guide the analysis
 * @returns Analysis text
 */
async function analyzeUIDesign(imageBase64: string, apiKey: string, iterationPrompt?: string): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Please check your .env file.');
  }
  
  try {
    // Create the base prompt
    let promptText = 'Analyze this UI design and suggest improvements for color scheme, typography, layout, spacing, and overall visual hierarchy. Be specific with your suggestions.';
    
    // Add the user's custom prompt if provided
    if (iterationPrompt && iterationPrompt.trim()) {
      promptText = `${promptText}\n\nAdditional instructions: ${iterationPrompt}`;
    }
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText
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
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status}`, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
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
 * @param apiKey Cleaned Stability API key
 * @param iterationPrompt Optional prompt to guide the image generation
 * @returns Improved image
 */
async function generateImprovedImage(
  originalImageBase64: string, 
  analysisText: string, 
  apiKey: string,
  iterationPrompt?: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('Stability API key is missing. Please check your .env file.');
  }
  
  // Clean up the Stability API key
  const cleanedStabilityKey = apiKey
    .replace(/["']/g, '') // Remove quotes
    .replace(/\s+/g, '')  // Remove whitespace including line breaks
    .trim();              // Trim any remaining whitespace
  
  try {
    console.log('📝 Creating prompt for Stability AI based on analysis');
    // Create a prompt based on the analysis
    let prompt = `Create an improved version of this UI design with these changes:
${analysisText.substring(0, 1000)}

Make sure to maintain the same general layout and content, but improve the visual design.`;

    // Add the user's custom prompt if provided
    if (iterationPrompt && iterationPrompt.trim()) {
      prompt += `\n\nAdditional instructions: ${iterationPrompt}`;
    }
    
    console.log('🚀 Sending request to Stability AI API...');
    // Call Stability AI API
    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanedStabilityKey}`,
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
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 40
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Stability API error: ${response.status}`, errorText);
      throw new Error(`Stability API error: ${response.status} - ${errorText}`);
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

/**
 * Mock implementation for testing without API keys
 * @param originalImage Original image
 * @returns Mock improved design
 */
function mockImprovedUIDesign(originalImage: string): { image: string; analysis: string } {
  // Create a mock analysis
  const mockAnalysis = `
# UI Design Analysis

## Visual Hierarchy
The design could benefit from better visual hierarchy to guide users' attention.

## Color Scheme
Consider using a more cohesive color scheme with better contrast for accessibility.

## Typography
The text sizes and weights could be adjusted for better readability and hierarchy.

## Layout
Some elements could be better aligned and spaced for a more polished appearance.

## Recommendations
1. Increase contrast between text and background
2. Use more consistent spacing between elements
3. Enhance the prominence of primary actions
4. Improve alignment of UI elements
  `;
  
  // In a real implementation, we would generate an improved image
  // For now, just return the original image with the mock analysis
  return {
    image: originalImage,
    analysis: mockAnalysis
  };
}