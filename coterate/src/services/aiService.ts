/**
 * AI Service for UI Improvements
 * This service handles whole-image approaches for UI design improvements
 * Updated to use serverless functions for API calls
 */

import axios from 'axios';

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
    // Call the serverless function for UI improvement
    console.log('🔍 Calling UI improvement API...');
    const response = await axios.post('/api/improve-ui', {
      imageBase64,
      customPrompt
    });
    
    console.log('✅ UI improvement complete');
    
    return {
      image: response.data.image,
      analysis: response.data.analysis
    };
  } catch (error) {
    console.error('❌ Error in UI design improvement process:', error);
    
    // Provide more specific error messages based on the error type
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data.error || error.message;
      throw new Error(errorMessage);
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
  try {
    console.log('🔍 Starting UI analysis...');
    
    // Call the serverless function for UI analysis
    const response = await axios.post('/api/openai', {
      imageBase64,
      customPrompt
    });
    
    return response.data.analysis;
  } catch (error) {
    console.error('Error in UI analysis:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.message);
    }
    
    throw error;
  }
};

/**
 * Generate an improved image based on analysis
 * @param analysis Analysis text from analyzeUIDesign
 * @param customPrompt Optional custom prompt to guide the generation
 * @returns Base64 encoded image data
 */
export const generateImprovedImage = async (
  analysis: string,
  customPrompt?: string
): Promise<string> => {
  try {
    console.log('🎨 Starting image generation...');
    
    // Call the serverless function for image generation
    const response = await axios.post('/api/stability', {
      analysis,
      customPrompt
    });
    
    return response.data.image;
  } catch (error) {
    console.error('Error in image generation:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || error.message);
    }
    
    throw error;
  }
};

/**
 * Resize an image to dimensions supported by Stability AI
 * @param base64Image Base64 encoded image data (without data URL prefix)
 * @returns Resized image as base64 string
 */
async function resizeImageToSupportedDimensions(base64Image: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an image element to load the base64 image
    const img = new Image();
    img.onload = () => {
      try {
        // Create a canvas with the target dimensions (1024x1024)
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        
        // Get the canvas context and draw the image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Fill the canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate dimensions to maintain aspect ratio
        const aspectRatio = img.width / img.height;
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (aspectRatio > 1) {
          // Image is wider than tall
          drawWidth = 1024;
          drawHeight = 1024 / aspectRatio;
          offsetX = 0;
          offsetY = (1024 - drawHeight) / 2;
        } else {
          // Image is taller than wide
          drawHeight = 1024;
          drawWidth = 1024 * aspectRatio;
          offsetX = (1024 - drawWidth) / 2;
          offsetY = 0;
        }
        
        // Draw the image centered on the canvas
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert the canvas to base64
        const resizedBase64 = canvas.toDataURL('image/png').replace(/^data:image\/[a-z]+;base64,/, '');
        resolve(resizedBase64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
    };
    
    // Set the source of the image
    img.src = `data:image/png;base64,${base64Image}`;
  });
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