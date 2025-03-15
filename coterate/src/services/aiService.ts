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
 * @param customPrompt Optional custom prompt to guide the AI in generating improvements
 * @returns Object with improved image and analysis
 */
export const generateImprovedUIDesign = async (
  imageBase64: string,
  customPrompt?: string
): Promise<{ image: string; analysis: string }> => {
  console.log('🎨 Starting UI design improvement process...');
  
  try {
    // Step 1: Analyze the image with GPT-4V
    console.log('🔍 Analyzing current UI design...');
    const analysis = await analyzeUIDesign(imageBase64, customPrompt);
    console.log('✅ Analysis complete');
    
    // Step 2: Generate improved image with Stability AI
    console.log('🎨 Starting image generation with Stability AI...');
    const improvedImage = await generateImprovedImage(imageBase64, analysis, customPrompt);
    console.log('✅ Improved UI generated');
    
    return {
      image: improvedImage,
      analysis
    };
  } catch (error) {
    console.error('❌ Error in UI design improvement process:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API')) {
        throw new Error(`OpenAI API error: ${error.message}. Please try again later.`);
      } else if (error.message.includes('Stability API')) {
        throw new Error(`Stability API error: ${error.message}. Please try again with a simpler prompt.`);
      } else if (error.message.includes('rate limit')) {
        throw new Error('API rate limit exceeded. Please try again in a few minutes.');
      } else if (error.message.includes('character limit')) {
        throw new Error('Prompt is too long. Please use a shorter custom prompt.');
      }
    }
    
    // Re-throw with a more user-friendly message if no specific case matched
    throw new Error(`Failed to improve UI design: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Analyze a UI design using GPT-4o
 * @param imageBase64 Base64 encoded image data
 * @param customPrompt Optional custom prompt to guide the analysis
 * @returns Analysis text
 */
export const analyzeUIDesign = async (
  imageBase64: string,
  customPrompt?: string
): Promise<string> => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is missing. Please check your environment variables.');
  }

  try {
    console.log('🔍 Starting UI analysis with GPT-4o...');
    
    // Prepare the base prompt for UI analysis
    let prompt = `Analyze this UI design and provide specific, actionable improvements. 
Focus on:
1. Layout and spacing
2. Color scheme and contrast
3. Typography and readability
4. Visual hierarchy
5. Consistency
6. Usability and accessibility

Format your response as a structured analysis with clear sections.`;

    // Add custom prompt if provided
    if (customPrompt) {
      prompt += `\n\nAdditional focus areas: ${customPrompt}`;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorData);
      throw new Error(`OpenAI API error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No analysis was generated by OpenAI');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing UI design:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Authentication error with OpenAI API. Please check your API key.');
      } else if (error.message.includes('model_not_found')) {
        throw new Error('The AI model is not available. Please check your OpenAI account or try again later.');
      }
    }
    
    // Re-throw the original error if it doesn't match any specific cases
    throw error;
  }
};

/**
 * Generate an improved image based on analysis
 * @param originalImageBase64 Original image
 * @param analysisText Analysis text
 * @param customPrompt Optional custom prompt to guide the image generation
 * @returns Improved image
 */
export const generateImprovedImage = async (
  imageBase64: string,
  analysisText: string,
  customPrompt?: string
): Promise<string> => {
  const apiKey = process.env.REACT_APP_STABILITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Stability API key is missing. Please check your environment variables.');
  }

  try {
    // Extract the most important insights from the analysis text
    // Limit to first 15 non-empty, non-header lines and cap at 500 chars
    const analysisExcerpt = analysisText
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .slice(0, 15)
      .join('\n')
      .substring(0, 500);
    
    // Create a structured prompt that stays within character limits
    let prompt = `
Improve this UI design while maintaining the original layout and components.

REQUIREMENTS:
- Keep the same overall layout structure
- Maintain all existing functionality
- Preserve the same information hierarchy

IMPROVEMENTS:
${analysisExcerpt}

POLISH:
- Use professional, modern UI design principles
- Ensure visual hierarchy and balance
- Apply consistent spacing and alignment
- Enhance typography and color harmony
`;

    // Add custom prompt if provided (limited to 100 chars)
    if (customPrompt) {
      prompt += `\nCUSTOM: ${customPrompt.substring(0, 100)}`;
    }

    // Final check to ensure we're within limits (with buffer)
    if (prompt.length > 1900) {
      prompt = prompt.substring(0, 1900);
    }

    console.log(`Prompt length: ${prompt.length} characters`);
    
    // Prepare the request to Stability AI
    const engine_id = "stable-diffusion-xl-1024-v1-0";
    const apiHost = process.env.REACT_APP_API_HOST || 'https://api.stability.ai';
    
    console.log(`Sending request to Stability AI (${engine_id})...`);
    
    // Ensure the image is properly formatted - remove data URL prefix if present
    const cleanedImage = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Try a different approach - using text-to-image endpoint instead of image-to-image
    // This is a workaround for the image-to-image endpoint issues
    const response = await fetch(
      `${apiHost}/v1/generation/${engine_id}/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1.0,
            },
            {
              text: "blurry, distorted, low quality, pixelated, poor design, amateurish, inconsistent layout",
              weight: -1.0,
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30,
          style_preset: "digital-art",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Stability API error (${response.status}):`, errorData);
      throw new Error(`Stability API error (${response.status}): ${errorData}`);
    }

    const responseJSON = await response.json();
    
    if (!responseJSON.artifacts || responseJSON.artifacts.length === 0) {
      throw new Error('No image was generated by Stability API');
    }
    
    return `data:image/png;base64,${responseJSON.artifacts[0].base64}`;
  } catch (error) {
    console.error('Error generating improved image:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('Stability API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Authentication error with Stability API. Please check your API key.');
      } else if (error.message.includes('text_prompts')) {
        throw new Error('Prompt exceeds character limit. Please use a shorter custom prompt.');
      } else if (error.message.includes('init_image')) {
        throw new Error('Invalid image format. Please use a valid PNG or JPEG image.');
      } else if (error.message.includes('content-type')) {
        throw new Error('Stability API requires multipart/form-data format. Using FormData to send the request.');
      } else if (error.message.includes('bad_request')) {
        throw new Error('Bad request to Stability API. Please check your image format and try again.');
      }
    }
    
    // Re-throw the original error if it doesn't match any specific cases
    throw error;
  }
};

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