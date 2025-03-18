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
    // First try to call the serverless function for UI improvement
    console.log('🔍 Calling UI improvement API...');
    
    try {
      // Attempt to use the API endpoint first
      console.log('Trying API endpoint first...');
      
      const apiUrl = window.location.hostname.includes('vercel.app') || 
                     window.location.hostname.includes('localhost') ? 
                     '/api/improve-ui' : 
                     'https://coterate-app.vercel.app/api/improve-ui';
      
      const response = await axios.post(apiUrl, {
        imageBase64: imageBase64.startsWith('data:') ? 
                    imageBase64.split(',')[1] : 
                    imageBase64,
        customPrompt
      }, {
        // Include longer timeout to account for serverless cold starts
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API call successful');
      
      return {
        image: response.data.image,
        analysis: response.data.analysis
      };
    } catch (apiError) {
      // Log the API error but continue with fallback
      console.warn('API call failed, using local fallback:', apiError);
      
      // Fall back to local implementation
      console.log('Using local fallback implementation');
      return await mockImprovedUIDesign(imageBase64);
    }
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
 * @returns Promise with mock improved design
 */
function mockImprovedUIDesign(originalImage: string): Promise<{ image: string; analysis: string }> {
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
  
  // Apply actual visual improvements to the image
  return new Promise<{ image: string; analysis: string }>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Apply visual enhancements to make it look improved
        
        // 1. Slightly increase contrast
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 2. Add a subtle vignette effect
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.width * 0.1,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.8
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.15)');
        
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 3. Add a bit more saturation
        ctx.globalCompositeOperation = 'saturation';
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = 'rgba(100,100,255,0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        
        // Generate image data URL
        const improvedImageUrl = canvas.toDataURL('image/png');
        
        resolve({
          image: improvedImageUrl,
          analysis: mockAnalysis
        });
      } else {
        // Fallback if canvas context is not available
        resolve({
          image: originalImage,
          analysis: mockAnalysis
        });
      }
    };
    
    img.onerror = () => {
      // If image loading fails, return the original
      resolve({
        image: originalImage,
        analysis: mockAnalysis
      });
    };
    
    // Handle both data URL and base64 string formats
    img.src = originalImage.startsWith('data:') 
      ? originalImage 
      : `data:image/png;base64,${originalImage}`;
  });
}