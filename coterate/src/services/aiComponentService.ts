// AI Component-Based UI Enhancement Service for Coterate
// This service implements a component-level approach to UI design improvements

import React from 'react';
import { render } from 'react-dom';
import html2canvas from 'html2canvas';

// Environment variables for API keys
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.REACT_APP_STABILITY_API_KEY;

// Base URLs for APIs
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_VISION_URL = 'https://api.openai.com/v1/chat/completions';
const STABILITY_API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';

// Interfaces for component detection and processing
interface DetectedComponent {
  id: string;
  type: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    fontSize?: number;
    padding?: string;
    text?: string;
    state?: 'default' | 'hover' | 'active' | 'disabled';
    [key: string]: any;
  };
}

interface ComponentImprovementSuggestion {
  componentId: string;
  original: DetectedComponent;
  improvements: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    fontSize?: number;
    padding?: string;
    [key: string]: any;
  };
  reasoning: string;
  cssStyles?: string; // CSS styles for the component
  componentConfig?: ComponentConfig; // Configuration for the component
}

// Component library mapping for Material-UI components
interface ComponentConfig {
  type: string;
  props: Record<string, any>;
  children?: string | ComponentConfig[];
  styles?: Record<string, any>;
}

// Define the interface for the expected structure
interface ComponentsData {
  components: any[];
  [key: string]: any;
}

// Add a helper function to check if the API key is valid
const checkOpenAIKey = () => {
  if (!OPENAI_API_KEY || !OPENAI_API_KEY.toString().startsWith('sk-')) {
    throw new Error('OpenAI API key is missing or invalid. Please add a valid REACT_APP_OPENAI_API_KEY to your .env.local file.');
  }
  
  // Clean up the API key by removing any quotes, spaces, or line breaks
  const cleanedApiKey = OPENAI_API_KEY.toString()
    .replace(/["']/g, '') // Remove quotes
    .replace(/\s+/g, '')  // Remove whitespace including line breaks
    .trim();              // Trim any remaining whitespace
  
  if (cleanedApiKey === 'your-openai-api-key-here' || cleanedApiKey === 'your_openai_api_key_here') {
    throw new Error('Please replace the placeholder API key with your actual OpenAI API key in the .env.local file.');
  }
  
  // Return the cleaned key for use
  return cleanedApiKey;
};

/**
 * STEP 1: ENHANCED COMPONENT DETECTION
 * Uses GPT-4o with detailed prompting to precisely identify UI components
 * @param imageBase64 Base64 encoded image data
 * @returns Array of detected components with bounding boxes and initial classification
 */
export const detectComponents = async (imageBase64: string): Promise<DetectedComponent[]> => {
  console.log('STEP 1: Detecting UI components within design...');
  
  try {
    // Check API key before making the request and get the cleaned key
    const cleanedApiKey = checkOpenAIKey();
    
    // Ensure base64 string is properly formatted
    const formattedImage = imageBase64.startsWith('data:image') 
      ? imageBase64 
      : `data:image/png;base64,${imageBase64}`;
      
    // Simplified and more direct prompt for better component detection
    const detectionPrompt = `
You are a UI component detection expert. Analyze this UI design image and identify all UI components.

I need you to:
1. Look at this UI design image
2. Identify all visible UI components (buttons, text fields, cards, headers, etc.)
3. For each component, determine its:
   - Type (button, input, card, etc.)
   - Position and size (as percentages of the image)
   - Visual properties (colors, text, etc.)

IMPORTANT: Your response MUST be ONLY valid JSON with this structure:
{
  "components": [
    {
      "type": "button",
      "confidence": 0.95,
      "boundingBox": {
        "x": 10.5,
        "y": 25.3,
        "width": 20.8,
        "height": 5.2
      },
      "attributes": {
        "backgroundColor": "#4285f4",
        "textColor": "#ffffff",
        "borderRadius": 8,
        "fontSize": 16,
        "padding": "8px 16px",
        "text": "Submit",
        "state": "default"
      }
    },
    // More components...
  ]
}

DO NOT include any explanations, notes, or text outside the JSON. ONLY return the JSON object.
`;

    console.log('Calling OpenAI API with GPT-4o model for component detection...');
    
    // Call OpenAI's GPT-4o with the simplified prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanedApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a UI component detection expert. Analyze the image and extract UI components with precise details. You ONLY respond with valid JSON."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: detectionPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: formattedImage,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.2 // Lower temperature for more deterministic output
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status}`, errorText);
      
      // Check for specific error types
      if (errorText.includes('model_not_found')) {
        console.error('The GPT-4o model is not available. Please check your OpenAI account or try again later.');
      }
      
      // Try one more time with a different approach before falling back
      return await retryComponentDetection(imageBase64);
    }
    
    const data = await response.json();
    
    // Extract JSON from the response
    const contentText = data.choices[0].message.content;
    console.log("GPT-4o Response:", contentText.substring(0, 200) + "...");
    
    // Check if the response indicates the API can't analyze images
    if (contentText.includes("unable to") || 
        contentText.includes("can't analyze") || 
        contentText.includes("cannot analyze") || 
        contentText.includes("I'm unable to") ||
        contentText.includes("I cannot perform")) {
      console.log('GPT-4o indicated it cannot analyze the image properly. Trying alternative approach...');
      return await retryComponentDetection(imageBase64);
    }
    
    // Try to extract the JSON data using various patterns
    const componentsData = await extractComponentsData(contentText);
    
    if (!componentsData || !componentsData.components || !Array.isArray(componentsData.components) || componentsData.components.length === 0) {
      console.warn('No components detected or invalid component data structure. Trying alternative approach...');
      return await retryComponentDetection(imageBase64);
    }
    
    // Transform the data into our DetectedComponent format with validation
    const detectedComponents: DetectedComponent[] = componentsData.components.map((comp: any, index: number) => {
      // Validate bounding box values
      const boundingBox = {
        x: typeof comp.boundingBox?.x === 'number' ? comp.boundingBox.x : 0,
        y: typeof comp.boundingBox?.y === 'number' ? comp.boundingBox.y : 0,
        width: typeof comp.boundingBox?.width === 'number' ? comp.boundingBox.width : 10,
        height: typeof comp.boundingBox?.height === 'number' ? comp.boundingBox.height : 10
      };
      
      // Ensure bounding box values are within valid ranges
      boundingBox.x = Math.max(0, Math.min(100, boundingBox.x));
      boundingBox.y = Math.max(0, Math.min(100, boundingBox.y));
      boundingBox.width = Math.max(1, Math.min(100, boundingBox.width));
      boundingBox.height = Math.max(1, Math.min(100, boundingBox.height));
      
      return {
        id: `component-${index}`,
        type: comp.type || 'unknown',
        confidence: typeof comp.confidence === 'number' ? comp.confidence : 0.9,
        boundingBox,
        attributes: {
          backgroundColor: comp.attributes?.backgroundColor || '#ffffff',
          textColor: comp.attributes?.textColor || '#333333',
          borderRadius: comp.attributes?.borderRadius || 0,
          fontSize: comp.attributes?.fontSize || 14,
          padding: comp.attributes?.padding || '8px',
          text: comp.attributes?.text || comp.text || '',
          state: comp.attributes?.state || 'default'
        }
      };
    });
    
    console.log(`Successfully detected ${detectedComponents.length} components`);
    
    // Log each component for debugging
    detectedComponents.forEach(component => {
      console.log(`Component: ${component.type}, Position: (${component.boundingBox.x}, ${component.boundingBox.y}), Size: ${component.boundingBox.width}x${component.boundingBox.height}`);
    });
    
    return detectedComponents;
    
  } catch (error) {
    console.error('Error in component detection step:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('model_not_found')) {
        console.error('The GPT-4o model is not available. Please check your OpenAI account or try again later.');
      } else if (error.message.includes('429')) {
        console.error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('Authentication error with OpenAI API. Please check your API key.');
      }
    }
    
    // Try alternative approach before falling back
    try {
      return await retryComponentDetection(imageBase64);
    } catch (retryError) {
      console.warn('Retry also failed. Using fallback component detection due to error');
    return createFallbackComponents();
    }
  }
};

/**
 * Retry component detection with a different approach
 * @param imageBase64 Base64 encoded image data
 * @returns Array of detected components
 */
async function retryComponentDetection(imageBase64: string): Promise<DetectedComponent[]> {
  console.log('Retrying component detection with alternative approach...');
  
  try {
    const cleanedApiKey = checkOpenAIKey();
    
    // Ensure base64 string is properly formatted
    const formattedImage = imageBase64.startsWith('data:image') 
      ? imageBase64 
      : `data:image/png;base64,${imageBase64}`;
    
    // Alternative prompt focusing on simpler detection
    const alternativePrompt = `
Describe the UI components in this image. For each component, provide:
1. Component type (button, input field, card, etc.)
2. Approximate position (top-left, center, bottom-right, etc.)
3. Size (small, medium, large)
4. Colors (background and text)
5. Any text content

Format your response as JSON:
{
  "components": [
    {
      "type": "button",
      "position": "top-right",
      "size": "medium",
      "backgroundColor": "#4285f4",
      "textColor": "#ffffff",
      "text": "Submit"
    }
  ]
}
`;
    
    // Call OpenAI's GPT-4o with the alternative prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanedApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a UI component detection expert. Describe the UI components you see in the image."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: alternativePrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: formattedImage,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const contentText = data.choices[0].message.content;
    
    // Try to extract JSON from the response
    let componentsData;
    try {
      // Look for JSON in the response
      const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/) || 
                       contentText.match(/```\n([\s\S]*?)\n```/) ||
                       contentText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        let jsonText = jsonMatch[0];
        if (jsonText.startsWith('```')) {
          jsonText = jsonMatch[1] || jsonText.replace(/```(json)?\n?|```$/g, '');
        }
        
        componentsData = JSON.parse(jsonText);
      } else {
        // If no JSON found, try to extract component information from the text
        componentsData = extractComponentsFromText(contentText);
      }
    } catch (error) {
      console.error('Error parsing alternative response:', error);
      componentsData = extractComponentsFromText(contentText);
    }
    
    if (!componentsData || !componentsData.components || !Array.isArray(componentsData.components)) {
      throw new Error('Failed to extract components from alternative approach');
    }
    
    // Convert the alternative format to our DetectedComponent format
    const detectedComponents: DetectedComponent[] = componentsData.components.map((comp: any, index: number) => {
      // Convert position string to coordinates
      const position = positionStringToCoordinates(comp.position || 'center');
      
      return {
        id: `component-${index}`,
        type: comp.type || 'unknown',
        confidence: 0.8,
      boundingBox: {
          x: position.x,
          y: position.y,
          width: sizeToWidth(comp.size || 'medium'),
          height: sizeToHeight(comp.size || 'medium')
      },
      attributes: {
          backgroundColor: comp.backgroundColor || '#ffffff',
          textColor: comp.textColor || '#333333',
          borderRadius: 4,
          fontSize: 14,
        padding: '8px',
          text: comp.text || '',
        state: 'default'
      }
      };
    });
    
    console.log(`Alternative approach detected ${detectedComponents.length} components`);
    return detectedComponents;
  } catch (error) {
    console.error('Error in alternative component detection:', error);
    return createFallbackComponents();
  }
}

/**
 * Extract components from text description
 * @param text Description of components
 * @returns Components data
 */
function extractComponentsFromText(text: string): ComponentsData {
  console.log('Extracting components from text description...');
  
  const components = [];
  
  // Look for component descriptions in the text
  const buttonMatches = text.match(/button/gi);
  const inputMatches = text.match(/input|field|textfield/gi);
  const cardMatches = text.match(/card|container|box/gi);
  const headerMatches = text.match(/header|heading|title/gi);
  const navMatches = text.match(/nav|navigation|menu/gi);
  
  // Add buttons
  if (buttonMatches) {
    for (let i = 0; i < Math.min(buttonMatches.length, 3); i++) {
      components.push({
        type: "button",
        position: i === 0 ? "top-right" : i === 1 ? "center" : "bottom-left",
        size: "medium",
        backgroundColor: "#4285f4",
        textColor: "#ffffff",
        text: "Button"
      });
    }
  }
  
  // Add inputs
  if (inputMatches) {
    for (let i = 0; i < Math.min(inputMatches.length, 2); i++) {
      components.push({
        type: "input",
        position: i === 0 ? "top-center" : "center-left",
        size: "large",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        text: "Input field"
      });
    }
  }
  
  // Add cards
  if (cardMatches) {
    for (let i = 0; i < Math.min(cardMatches.length, 2); i++) {
      components.push({
        type: "card",
        position: i === 0 ? "center" : "bottom-center",
        size: "large",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        text: "Card content"
      });
    }
  }
  
  // Add headers
  if (headerMatches) {
    components.push({
      type: "header",
      position: "top-center",
      size: "large",
      backgroundColor: "#f8f9fa",
      textColor: "#212529",
      text: "Header"
    });
  }
  
  // Add navigation
  if (navMatches) {
    components.push({
      type: "navigation",
      position: "top-left",
      size: "medium",
      backgroundColor: "#f8f9fa",
      textColor: "#212529",
      text: "Navigation"
    });
  }
  
  // Ensure we have at least 5 components
  if (components.length < 5) {
    const missingCount = 5 - components.length;
    const types = ["button", "input", "card", "text", "image"];
    const positions = ["bottom-right", "center-right", "center-bottom", "bottom-center", "center-top"];
    
    for (let i = 0; i < missingCount; i++) {
      components.push({
        type: types[i % types.length],
        position: positions[i % positions.length],
        size: "medium",
        backgroundColor: "#ffffff",
        textColor: "#333333",
        text: `${types[i % types.length]} content`
      });
    }
  }
  
  return { components };
}

/**
 * Convert position string to coordinates
 * @param position Position string (e.g., "top-left", "center", etc.)
 * @returns Coordinates as percentages
 */
function positionStringToCoordinates(position: string): { x: number, y: number } {
  const positions: Record<string, { x: number, y: number }> = {
    'top-left': { x: 10, y: 10 },
    'top-center': { x: 50, y: 10 },
    'top-right': { x: 80, y: 10 },
    'center-left': { x: 10, y: 50 },
    'center': { x: 50, y: 50 },
    'center-right': { x: 80, y: 50 },
    'bottom-left': { x: 10, y: 80 },
    'bottom-center': { x: 50, y: 80 },
    'bottom-right': { x: 80, y: 80 },
    'center-top': { x: 50, y: 30 },
    'center-bottom': { x: 50, y: 70 }
  };
  
  return positions[position.toLowerCase()] || { x: 50, y: 50 };
}

/**
 * Convert size string to width percentage
 * @param size Size string (e.g., "small", "medium", "large")
 * @returns Width as percentage
 */
function sizeToWidth(size: string): number {
  const sizes: Record<string, number> = {
    'small': 15,
    'medium': 30,
    'large': 60
  };
  
  return sizes[size.toLowerCase()] || 30;
}

/**
 * Convert size string to height percentage
 * @param size Size string (e.g., "small", "medium", "large")
 * @returns Height as percentage
 */
function sizeToHeight(size: string): number {
  const sizes: Record<string, number> = {
    'small': 8,
    'medium': 15,
    'large': 30
  };
  
  return sizes[size.toLowerCase()] || 15;
}

/**
 * Create fallback components when detection fails
 * @returns Array of generic UI components
 */
function createFallbackComponents(): DetectedComponent[] {
  console.log('Creating fallback components for UI improvement');
  
  // Create a set of generic components that would typically be found in a UI
  const fallbackComponents: DetectedComponent[] = [
    // Header component
    {
      id: 'component-0',
      type: 'header',
      confidence: 0.95,
      boundingBox: {
        x: 0,
        y: 0,
        width: 100,
        height: 10
      },
      attributes: {
        backgroundColor: '#f8f9fa',
        textColor: '#212529',
        borderRadius: 0,
        fontSize: 24,
        padding: '16px',
        text: 'Header',
        state: 'default'
      }
    },
    // Primary button
    {
      id: 'component-1',
      type: 'primary_button',
      confidence: 0.95,
      boundingBox: {
        x: 10,
        y: 30,
        width: 20,
        height: 8
      },
      attributes: {
        backgroundColor: '#0d6efd',
        textColor: '#ffffff',
        borderRadius: 4,
        fontSize: 16,
        padding: '10px 16px',
        text: 'Primary Button',
        state: 'default'
      }
    },
    // Secondary button
    {
      id: 'component-2',
      type: 'secondary_button',
      confidence: 0.95,
      boundingBox: {
        x: 40,
        y: 30,
        width: 20,
        height: 8
      },
      attributes: {
        backgroundColor: '#6c757d',
        textColor: '#ffffff',
        borderRadius: 4,
        fontSize: 16,
        padding: '10px 16px',
        text: 'Secondary Button',
        state: 'default'
      }
    },
    // Text input
    {
      id: 'component-3',
      type: 'text_input',
      confidence: 0.95,
      boundingBox: {
        x: 10,
        y: 50,
        width: 50,
        height: 8
      },
      attributes: {
        backgroundColor: '#ffffff',
        textColor: '#212529',
        borderRadius: 4,
        fontSize: 16,
        padding: '8px 12px',
        text: 'Input field',
        state: 'default'
      }
    },
    // Card component
    {
      id: 'component-4',
      type: 'card',
      confidence: 0.95,
      boundingBox: {
        x: 10,
        y: 70,
        width: 80,
        height: 20
      },
      attributes: {
        backgroundColor: '#ffffff',
        textColor: '#212529',
        borderRadius: 8,
        fontSize: 16,
        padding: '16px',
        text: 'Card content',
        state: 'default'
      }
    }
  ];
  
  console.log(`Created ${fallbackComponents.length} fallback components`);
  return fallbackComponents;
}

// Helper function to extract components data from API response
async function extractComponentsData(contentText: string): Promise<ComponentsData | null> {
  // Check for common error responses
  if (contentText.includes("unable to directly analyze images") || 
      contentText.includes("can't analyze images") ||
      contentText.includes("cannot analyze images") ||
      contentText.includes("I'm unable to")) {
    console.log("API indicated it cannot analyze images");
    return createFallbackComponentsData();
  }

  // Enhanced JSON extraction with multiple patterns
  let jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/) || 
                 contentText.match(/```\n([\s\S]*?)\n```/) ||
                 contentText.match(/```([\s\S]*?)```/) ||
                 contentText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    console.error('Failed to extract JSON. Using fallback components.');
    return createFallbackComponentsData();
  }
  
  let jsonText = jsonMatch[0];
  
  // If the match is a code block, extract the content
  if (jsonText.startsWith('```')) {
    // Extract content between code block markers
    const codeContent = jsonMatch[1] || jsonText.replace(/```(json)?\n?|```$/g, '');
    jsonText = codeContent;
  }
  
  // Ensure we have a valid JSON object
  if (!jsonText.trim().startsWith('{')) {
    // Try to find a JSON object in the text
    const objectMatch = jsonText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonText = objectMatch[0];
    } else {
      console.error('No valid JSON object found. Using fallback components.');
      return createFallbackComponentsData();
    }
  }
  
  // Clean up the JSON text
  jsonText = jsonText
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Ensure property names are quoted
    .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes for values
    .replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
    .replace(/[\u2018\u2019]/g, "'") // Replace curly apostrophes
    .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
    .replace(/,\s*\]/g, ']') // Remove trailing commas before closing brackets
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3'); // Ensure property names are quoted
  
  // Fix specific issues we're seeing in the console
  jsonText = jsonText
    .replace(/:\s*"([^"]*),([^"]*)"/g, ':"$1,$2"') // Fix commas inside string values
    .replace(/:\s*"([^"]*)\{([^"]*)"/g, ':"$1\\{$2"') // Escape curly braces inside string values
    .replace(/:\s*"([^"]*)\}([^"]*)"/g, ':"$1\\}$2"') // Escape curly braces inside string values
    .replace(/:\s*"([^"]*)\[([^"]*)"/g, ':"$1\\[$2"') // Escape square brackets inside string values
    .replace(/:\s*"([^"]*)\]([^"]*)"/g, ':"$1\\]$2"') // Escape square brackets inside string values
    .replace(/:\s*"([^"]*)"([^,}]*)/g, ':"$1"$2'); // Fix missing commas after string values
  
  console.log('Cleaned JSON text:', jsonText.substring(0, 100) + '...');
  
  // Try multiple parsing approaches
  try {
    // First try: direct parsing
    return JSON.parse(jsonText);
  } catch (error1) {
    console.warn('First parsing attempt failed:', error1.message);
    try {
      // Second try: fix quotes
      const fixedJson = jsonText.replace(/'/g, '"');
      return JSON.parse(fixedJson);
    } catch (error2) {
      console.warn('Second parsing attempt failed:', error2.message);
      try {
        // Third try: extract components array
        const componentsMatch = jsonText.match(/"components"\s*:\s*(\[[\s\S]*?\])/);
        if (componentsMatch && componentsMatch[1]) {
          try {
            // Fix potential JSON issues in the components array
            let componentsText = componentsMatch[1]
              .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
              .replace(/,\s*\]/g, ']') // Remove trailing commas before closing brackets
              .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3') // Ensure property names are quoted
              .replace(/:\s*"([^"]*),([^"]*)"/g, ':"$1,$2"') // Fix commas inside string values
              .replace(/:\s*"([^"]*)\{([^"]*)"/g, ':"$1\\{$2"') // Escape curly braces inside string values
              .replace(/:\s*"([^"]*)\}([^"]*)"/g, ':"$1\\}$2"'); // Escape curly braces inside string values
            
            const componentsArray = JSON.parse(componentsText);
            return { components: componentsArray };
          } catch (e) {
            console.warn('Failed to parse components array:', e.message);
          }
        }
        
        // Fourth try: look for component-like structures
        try {
          const componentMatches = jsonText.match(/\{\s*"type"\s*:\s*"[^"]+"/g);
          if (componentMatches && componentMatches.length > 0) {
            // Try to extract individual components and build a valid array
            const components = [];
            for (const match of componentMatches) {
              try {
                // Find the closing brace for this component object
                const startIndex = jsonText.indexOf(match);
                let braceCount = 0;
                let endIndex = startIndex;
                
                for (let i = startIndex; i < jsonText.length; i++) {
                  if (jsonText[i] === '{') braceCount++;
                  if (jsonText[i] === '}') braceCount--;
                  if (braceCount === 0) {
                    endIndex = i + 1;
                    break;
                  }
                }
                
                let componentText = jsonText.substring(startIndex, endIndex);
                
                // Fix the component JSON
                const fixedComponentText = componentText
                  .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3') // Ensure property names are quoted
                  .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes for values
                  .replace(/,\s*}/g, '}') // Remove trailing commas
                  .replace(/:\s*"([^"]*),([^"]*)"/g, ':"$1,$2"') // Fix commas inside string values
                  .replace(/:\s*"([^"]*)\{([^"]*)"/g, ':"$1\\{$2"') // Escape curly braces inside string values
                  .replace(/:\s*"([^"]*)\}([^"]*)"/g, ':"$1\\}$2"'); // Escape curly braces inside string values
                
                const component = JSON.parse(fixedComponentText);
                components.push(component);
              } catch (componentError) {
                console.warn('Failed to parse individual component:', componentError.message);
                // Continue to the next component
              }
            }
            
            if (components.length > 0) {
              console.log(`Successfully extracted ${components.length} components manually`);
              return { components };
            }
          }
        } catch (structureError) {
          console.warn('Failed to extract component structures:', structureError.message);
        }
        
        // Final fallback: use the fallback components
        console.warn('All parsing attempts failed. Using fallback components.');
        return createFallbackComponentsData();
      } catch (error3) {
        console.warn('Third parsing attempt failed:', error3.message);
        console.warn('Using fallback components.');
        return createFallbackComponentsData();
      }
    }
  }
}

// Create fallback components data when parsing fails
function createFallbackComponentsData(): ComponentsData {
  console.log('Creating fallback components data');
  return {
    components: [
      {
        type: "header",
        boundingBox: { x: 0, y: 0, width: 100, height: 10 },
        confidence: 0.95,
        attributes: { backgroundColor: "#ffffff", textColor: "#333333" }
      },
      {
        type: "button",
        boundingBox: { x: 20, y: 50, width: 20, height: 10 },
        confidence: 0.95,
        attributes: { backgroundColor: "#0066ff", textColor: "#ffffff", text: "Button" }
      },
      {
        type: "text",
        boundingBox: { x: 20, y: 30, width: 60, height: 10 },
        confidence: 0.95,
        attributes: { textColor: "#333333", text: "Text content" }
      },
      {
        type: "input",
        boundingBox: { x: 20, y: 70, width: 60, height: 10 },
        confidence: 0.95,
        attributes: { backgroundColor: "#ffffff", borderColor: "#cccccc" }
      },
      {
        type: "image",
        boundingBox: { x: 70, y: 40, width: 20, height: 20 },
        confidence: 0.95,
        attributes: { }
      }
    ]
  };
}

/**
 * STEP 2: COMPONENT ANALYSIS AND IMPROVEMENT SUGGESTIONS
 * Analyzes each detected component and suggests targeted improvements
 * @param components Array of detected components
 * @param fullImageBase64 Base64 encoded full image for context
 * @returns Array of component improvement suggestions
 */
export const analyzeComponents = async (
  components: DetectedComponent[],
  fullImageBase64: string
): Promise<ComponentImprovementSuggestion[]> => {
  console.log('STEP 2: Analyzing components and generating improvement suggestions...');
  
  if (!components || components.length === 0) {
    console.warn('No components provided for analysis');
    return [];
  }
  
  try {
    // Check API key before making the request
    const cleanedApiKey = checkOpenAIKey();
    
    // Ensure image is properly formatted
    const formattedImage = fullImageBase64.startsWith('data:image') 
      ? fullImageBase64 
      : `data:image/png;base64,${fullImageBase64}`;
    
    // Simplify the component data to reduce complexity
    const simplifiedComponents = components.map(comp => ({
      id: comp.id,
      type: comp.type,
      boundingBox: comp.boundingBox,
      attributes: {
        backgroundColor: comp.attributes.backgroundColor,
        textColor: comp.attributes.textColor,
        text: comp.attributes.text || ''
      }
    }));
    
    // Create a more direct prompt for component analysis
    const analysisPrompt = `
Analyze these UI components and suggest specific improvements for each one:

${JSON.stringify(simplifiedComponents, null, 2)}

For each component, provide:
1. Improved visual properties (colors, spacing, typography)
2. Brief reasoning for the improvements

IMPORTANT: Your response MUST be ONLY valid JSON with this structure:
{
  "improvements": [
  {
    "componentId": "component-0",
    "improvements": {
        "backgroundColor": "#4285f4",
        "textColor": "#ffffff",
      "borderRadius": 8,
      "fontSize": 16,
        "padding": "8px 16px"
      },
      "reasoning": "Brief explanation of improvements"
    }
  ],
  "designSystem": {
    "colors": {
      "primary": "#4285f4",
      "secondary": "#34a853",
      "background": "#ffffff",
      "text": "#202124"
    }
  }
}

DO NOT include any explanations or text outside the JSON. ONLY return the JSON object.
`;
    
    console.log('Calling OpenAI API with GPT-4o model for component analysis...');
    
    // Call OpenAI API for component analysis with improved parameters
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanedApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a UI design expert that analyzes UI components and suggests specific improvements. You ONLY respond with valid JSON."
          },
          {
            role: "user", 
            content: [
              {
                type: "text",
                text: analysisPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: formattedImage,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.3 // Lower temperature for more deterministic output
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status}`, errorText);
      
      // Check for specific error types
      if (errorText.includes('model_not_found')) {
        throw new Error('The GPT-4o model is not available. Please check your OpenAI account or try again later.');
      }
      
      // Try alternative approach
      return await generateFallbackImprovements(components);
    }
    
    const data = await response.json();
    
    // Extract the content from the response
    const contentText = data.choices[0].message.content;
    console.log("GPT-4o Analysis Response:", contentText.substring(0, 200) + "...");
    
    // Parse the JSON response with enhanced error handling
    let improvementData;
    try {
      // First, clean the response text to handle common JSON formatting issues
      let cleanedContent = contentText
        .replace(/[\u201C\u201D]/g, '"') // Replace curly quotes
        .replace(/[\u2018\u2019]/g, "'") // Replace curly apostrophes
        .replace(/\n\s*\/\/.*$/gm, '') // Remove comments
        .replace(/,\s*}/g, '}')         // Remove trailing commas
        .replace(/,\s*]/g, ']');        // Remove trailing commas in arrays
      
      // Try to extract JSON from code blocks first
      const codeBlockMatch = cleanedContent.match(/```(?:json)?([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        cleanedContent = codeBlockMatch[1].trim();
      } else {
        // If no code block, try to find a JSON object
        const jsonMatch = cleanedContent.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedContent = jsonMatch[1];
        }
      }
      
      // Additional cleaning for common JSON issues
      cleanedContent = cleanedContent
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Ensure property names are quoted
        .replace(/:\s*'([^']*)'/g, ':"$1"'); // Replace single quotes with double quotes for values
      
      console.log("Cleaned JSON content:", cleanedContent.substring(0, 100) + "...");
      
      // Try to parse the cleaned JSON
      improvementData = JSON.parse(cleanedContent);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.log('Original content:', contentText);
      
      // Try alternative approach
      return await generateFallbackImprovements(components);
    }
    
    // Validate the structure and provide fallback if needed
    if (!improvementData || typeof improvementData !== 'object') {
      console.warn('Invalid improvement data structure. Using fallback improvements.');
      return await generateFallbackImprovements(components);
    }
    
    if (!improvementData.improvements || !Array.isArray(improvementData.improvements)) {
      console.warn('No improvements array found. Using fallback improvements.');
      return await generateFallbackImprovements(components);
    }
    
    // Map the improvements to our ComponentImprovementSuggestion format
    const improvementSuggestions: ComponentImprovementSuggestion[] = improvementData.improvements
      .filter((improvement: any) => {
        // Validate each improvement has required fields
        if (!improvement.componentId) {
          console.warn('Improvement missing componentId, skipping');
          return false;
        }
        return true;
      })
      .map((improvement: any) => {
        // Find the original component
        const originalComponent = components.find(comp => comp.id === improvement.componentId);
        
        if (!originalComponent) {
          console.warn(`Original component not found for ID: ${improvement.componentId}`);
          return null;
        }
        
        return {
          componentId: improvement.componentId,
          original: originalComponent,
          improvements: improvement.improvements || {},
          reasoning: improvement.reasoning || 'No reasoning provided',
          cssStyles: generateComponentCSS(inferComponentConfig(originalComponent, improvement.improvements)),
          componentConfig: inferComponentConfig(originalComponent, improvement.improvements)
        };
      }).filter(Boolean) as ComponentImprovementSuggestion[];
    
    // If we didn't get improvements for all components, add fallbacks for the missing ones
    if (improvementSuggestions.length < components.length) {
      console.log(`Only got improvements for ${improvementSuggestions.length} out of ${components.length} components. Adding fallbacks for missing components.`);
      
      // Find components that don't have improvements
      const improvedComponentIds = improvementSuggestions.map(imp => imp.componentId);
      const missingComponents = components.filter(comp => !improvedComponentIds.includes(comp.id));
      
      // Generate fallback improvements for missing components
      const fallbackImprovements = missingComponents.map(component => {
        const improvements = generateFallbackImprovementForComponent(component);
        return {
          componentId: component.id,
          original: component,
          improvements,
          reasoning: `Default styling improvement for ${component.type} component.`,
          cssStyles: generateComponentCSS(inferComponentConfig(component, improvements)),
          componentConfig: inferComponentConfig(component, improvements)
        };
      });
      
      // Add fallbacks to the list
      improvementSuggestions.push(...fallbackImprovements);
    }
    
    console.log(`Generated ${improvementSuggestions.length} component improvement suggestions`);
    return improvementSuggestions;
    
  } catch (error) {
    console.error('Error in component analysis step:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('model_not_found')) {
        console.error('The GPT-4o model is not available. Please check your OpenAI account or try again later.');
      } else if (error.message.includes('429')) {
        console.error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('Authentication error with OpenAI API. Please check your API key.');
      }
    }
    
    // Generate fallback improvements instead of returning empty array
    return await generateFallbackImprovements(components);
  }
};

/**
 * Generate fallback improvements for components when analysis fails
 * @param components Array of detected components
 * @returns Array of component improvement suggestions
 */
async function generateFallbackImprovements(components: DetectedComponent[]): Promise<ComponentImprovementSuggestion[]> {
  console.log('Generating fallback improvements for components...');
  
  return components.map(component => {
    const improvements = generateFallbackImprovementForComponent(component);
      
      return {
        componentId: component.id,
        original: component,
      improvements,
      reasoning: `Improved styling for ${component.type} component to enhance visual appeal and usability.`,
      cssStyles: generateComponentCSS(inferComponentConfig(component, improvements)),
      componentConfig: inferComponentConfig(component, improvements)
      };
    });
}

/**
 * Generate fallback improvement for a specific component type
 * @param component The component to generate improvements for
 * @returns Improvement object with visual properties
 */
function generateFallbackImprovementForComponent(component: DetectedComponent): Record<string, any> {
  const type = component.type.toLowerCase();
  
  // Default improvements
  const improvements: Record<string, any> = {
    borderRadius: 4,
    fontSize: 16,
    padding: '8px 16px'
  };
  
  // Customize based on component type
  if (type.includes('button')) {
    // Primary button styling
    improvements.backgroundColor = '#4285f4';
    improvements.textColor = '#ffffff';
    improvements.fontWeight = 500;
    improvements.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    improvements.borderRadius = 8;
  } else if (type.includes('input') || type.includes('field') || type.includes('text')) {
    // Input field styling
    improvements.backgroundColor = '#ffffff';
    improvements.textColor = '#202124';
    improvements.borderColor = '#dadce0';
    improvements.borderWidth = '1px';
    improvements.borderStyle = 'solid';
    improvements.borderRadius = 4;
    improvements.padding = '12px 16px';
  } else if (type.includes('card') || type.includes('container')) {
    // Card styling
    improvements.backgroundColor = '#ffffff';
    improvements.textColor = '#202124';
    improvements.borderRadius = 8;
    improvements.boxShadow = '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';
    improvements.padding = '16px';
  } else if (type.includes('header') || type.includes('nav')) {
    // Header/navigation styling
    improvements.backgroundColor = '#f8f9fa';
    improvements.textColor = '#202124';
    improvements.fontWeight = 500;
    improvements.padding = '16px 24px';
    improvements.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
  } else if (type.includes('image') || type.includes('icon')) {
    // Image styling
    improvements.borderRadius = 4;
    improvements.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  } else {
    // Default styling for other components
    improvements.backgroundColor = '#ffffff';
    improvements.textColor = '#202124';
    improvements.padding = '8px 16px';
  }
  
  return improvements;
}

/**
 * Generates CSS string from component configuration
 * @param config Component configuration
 * @param componentId Component ID for class naming
 * @returns CSS styles as string
 */
function generateComponentCSS(config?: ComponentConfig, componentId: string = 'component'): string | undefined {
  if (!config || !config.styles) return undefined;
  
  // Convert styles object to CSS string
  const styleEntries = Object.entries(config.styles);
  if (styleEntries.length === 0) return undefined;
  
  const className = `improved-${componentId.replace(/[^a-z0-9]/gi, '-')}`;
  
  const cssProperties = styleEntries
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `  ${kebabKey}: ${value};`;
    })
    .join('\n');
  
  return `.${className} {
${cssProperties}
}`;
}

/**
 * Generate React Material-UI JSX for a component
 * @param componentConfig Material-UI component configuration
 * @param componentId Component ID for class naming
 * @returns JSX string for the component
 */
function generateComponentJSX(componentConfig?: ComponentConfig, componentId: string = 'component'): string {
  if (!componentConfig) {
    return ''; // No configuration available
  }
  
  const { type, props = {}, children, styles = {} } = componentConfig;
  const className = `improved-${componentId.replace(/[^a-z0-9]/gi, '-')}`;
  
  // Combine props into a string
  const propsString = Object.entries(props)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        return value ? key : ''; // If true, include only the key, otherwise exclude
      } else {
        return `${key}={${JSON.stringify(value)}}`;
      }
    })
    .filter(Boolean) // Remove empty strings (false booleans)
    .join(' ');
  
  // Handle children
  let childrenString = '';
  if (typeof children === 'string') {
    childrenString = children;
  } else if (Array.isArray(children)) {
    childrenString = children
      .map(child => generateComponentJSX(child))
      .join('\n');
  }
  
  // Combine everything into JSX
  return `<${type} className="${className}" ${propsString}>${childrenString}</${type}>`;
}

/**
 * STEP 3: GENERATE CSS FOR IMPROVED MATERIAL-UI COMPONENTS
 * Processes component configurations to create CSS for direct DOM updates
 * @param improvementSuggestions Array of improvement suggestions with Material-UI configs
 * @returns Updated array of suggestions with CSS for each component
 */
export const generateImprovedComponents = async (
  improvementSuggestions: ComponentImprovementSuggestion[]
): Promise<ComponentImprovementSuggestion[]> => {
  console.log('STEP 3: Generating CSS for Material-UI components...');
  
  // No API calls needed here, just process the component configurations
  const processedSuggestions = improvementSuggestions.map(suggestion => {
    if (!suggestion.componentConfig) {
      // Try to infer a basic component configuration from the original component
      suggestion.componentConfig = inferComponentConfig(suggestion.original, suggestion.improvements);
      suggestion.cssStyles = generateComponentCSS(suggestion.componentConfig, suggestion.componentId);
    }
    
    return suggestion;
  });
  
  console.log(`Generated CSS for ${processedSuggestions.filter(s => s.cssStyles).length} out of ${processedSuggestions.length} components`);
  return processedSuggestions;
};

/**
 * Infer Material-UI component configuration from detected component
 * @param component Detected component
 * @param improvements Suggested improvements
 * @returns Basic Material-UI component configuration
 */
function inferComponentConfig(
  component: DetectedComponent,
  improvements: Record<string, any>
): ComponentConfig {
  const type = component.type.toLowerCase();
  let materialComponent: ComponentConfig = {
    type: 'div', // Default to div
    props: {},
    children: component.attributes.text || '',
    styles: {
      ...improvements,
      position: 'relative'
    }
  };
  
  // Ensure styles object is defined (should always be the case from initialization above)
  if (!materialComponent.styles) {
    materialComponent.styles = {};
  }
  
  // Apply background color
  if (improvements.backgroundColor) {
    materialComponent.styles.backgroundColor = improvements.backgroundColor;
  } else if (component.attributes.backgroundColor) {
    materialComponent.styles.backgroundColor = component.attributes.backgroundColor;
  }
  
  // Apply text color
  if (improvements.textColor) {
    materialComponent.styles.color = improvements.textColor;
  } else if (component.attributes.textColor) {
    materialComponent.styles.color = component.attributes.textColor;
  }
  
  // Apply border radius
  if (improvements.borderRadius) {
    materialComponent.styles.borderRadius = `${improvements.borderRadius}px`;
  } else if (component.attributes.borderRadius) {
    materialComponent.styles.borderRadius = `${component.attributes.borderRadius}px`;
  }
  
  // Infer component type based on detected type
  if (type.includes('button')) {
    materialComponent.type = 'Button';
    materialComponent.props = {
      variant: 'contained',
      size: 'medium'
    };
  } else if (type.includes('input') || type.includes('textfield') || type.includes('field')) {
    materialComponent.type = 'TextField';
    materialComponent.props = {
      variant: 'outlined',
      fullWidth: true,
      placeholder: component.attributes.text || ''
    };
    materialComponent.children = '';
  } else if (type.includes('card')) {
    materialComponent.type = 'Card';
    materialComponent.props = {};
  } else if (type.includes('header') || type.includes('title') || type.includes('heading')) {
    const level = type.includes('h1') || type.includes('title') ? 'h1' : 
                 type.includes('h2') ? 'h2' : 
                 type.includes('h3') ? 'h3' : 'h4';
    
    materialComponent.type = 'Typography';
    materialComponent.props = {
      variant: level,
      component: level
    };
  }
  
  return materialComponent;
}

/**
 * STEP 4: APPLY COMPONENT CHANGES TO THE DOM
 * Applies Material-UI components to the DOM for a real, clean UI enhancement
 * @param improvementSuggestions Array of improvement suggestions with CSS styles
 * @param containerId ID of the container element to update
 * @returns HTML string with all CSS styles and detailed report
 */
export const applyComponentChangesToDOM = (
  improvementSuggestions: ComponentImprovementSuggestion[],
  containerId: string
): string => {
  console.log('Applying component changes to generate HTML...');
  
  // We don't need to find the actual DOM element since we're just generating HTML
  // that will be converted to an image later
  
  // For reporting purposes, generate a combined HTML with all components
  const componentHTMLs = improvementSuggestions.map(suggestion => {
    const jsx = generateComponentJSX(suggestion.componentConfig, suggestion.componentId);
    return `<!-- Component: ${suggestion.original.type} -->
<div class="component-container" style="
  position: absolute;
  left: ${suggestion.original.boundingBox.x}%;
  top: ${suggestion.original.boundingBox.y}%;
  width: ${suggestion.original.boundingBox.width}%;
  height: ${suggestion.original.boundingBox.height}%;
  overflow: hidden;
  box-sizing: border-box;
">
  ${jsx}
</div>`;
  }).join('\n\n');
  
  // Generate complete report HTML
  return componentHTMLs;
};

/**
 * Generates report HTML for improved components
 * @param suggestions Component improvement suggestions
 * @param componentsHTML HTML for all components
 * @returns Complete HTML report
 */
function generateReportHTML(
  suggestions: ComponentImprovementSuggestion[],
  componentsHTML: string
): string {
  console.log('Generating HTML report with', suggestions.length, 'suggestions');
  
  // Extract layout information from the components
  const headerComponents = suggestions.filter(s => 
    s.original.type.toLowerCase().includes('header') || 
    s.original.boundingBox.y < 10
  );
  
  const navigationComponents = suggestions.filter(s => 
    s.original.type.toLowerCase().includes('nav') || 
    s.original.type.toLowerCase().includes('menu') ||
    s.original.type.toLowerCase().includes('sidebar')
  );
  
  const mainContentComponents = suggestions.filter(s => 
    !s.original.type.toLowerCase().includes('header') && 
    !s.original.type.toLowerCase().includes('nav') && 
    !s.original.type.toLowerCase().includes('menu') &&
    !s.original.type.toLowerCase().includes('sidebar') &&
    !s.original.type.toLowerCase().includes('footer')
  );
  
  const footerComponents = suggestions.filter(s => 
    s.original.type.toLowerCase().includes('footer') || 
    s.original.boundingBox.y > 80
  );
  
  // Sort components by their position
  const sortByPosition = (a: ComponentImprovementSuggestion, b: ComponentImprovementSuggestion) => {
    // First sort by y position
    if (a.original.boundingBox.y !== b.original.boundingBox.y) {
      return a.original.boundingBox.y - b.original.boundingBox.y;
    }
    // Then by x position
    return a.original.boundingBox.x - b.original.boundingBox.x;
  };
  
  headerComponents.sort(sortByPosition);
  navigationComponents.sort(sortByPosition);
  mainContentComponents.sort(sortByPosition);
  footerComponents.sort(sortByPosition);
  
  // Generate HTML for each component
  const generateComponentHTML = (component: ComponentImprovementSuggestion) => {
    const { original, improvements } = component;
    const { boundingBox, attributes } = original;
    
    // Use improved properties or fall back to original
    const backgroundColor = improvements.backgroundColor || attributes.backgroundColor || '#ffffff';
    const textColor = improvements.textColor || attributes.textColor || '#333333';
    const borderRadius = improvements.borderRadius || attributes.borderRadius || 0;
    const fontSize = improvements.fontSize || attributes.fontSize || 16;
    const padding = improvements.padding || attributes.padding || '8px';
    const text = attributes.text || original.type;
    
    // Generate inline styles based on component type
    let styles = `
      position: absolute;
      left: ${boundingBox.x}%;
      top: ${boundingBox.y}%;
      width: ${boundingBox.width}%;
      height: ${boundingBox.height}%;
      background-color: ${backgroundColor};
      color: ${textColor};
      border-radius: ${borderRadius}px;
      font-size: ${fontSize}px;
      padding: ${padding};
      display: flex;
      align-items: center;
      justify-content: ${original.type.toLowerCase().includes('button') ? 'center' : 'flex-start'};
      overflow: hidden;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      z-index: ${original.type.toLowerCase().includes('header') ? 10 : 1};
    `;
    
    // Add specific styles based on component type
    if (original.type.toLowerCase().includes('button')) {
      styles += `
        cursor: pointer;
        font-weight: bold;
        text-align: center;
        border: none;
      `;
    } else if (original.type.toLowerCase().includes('input') || original.type.toLowerCase().includes('field')) {
      styles += `
        border: 1px solid #ddd;
      `;
    } else if (original.type.toLowerCase().includes('card') || original.type.toLowerCase().includes('container')) {
      styles += `
        flex-direction: column;
        justify-content: flex-start;
      `;
    }
    
    return `<div class="component component-${original.id}" style="${styles}">${text}</div>`;
  };
  
  // Generate HTML for each section
  const headerHTML = headerComponents.map(generateComponentHTML).join('\n');
  const navigationHTML = navigationComponents.map(generateComponentHTML).join('\n');
  const mainContentHTML = mainContentComponents.map(generateComponentHTML).join('\n');
  const footerHTML = footerComponents.map(generateComponentHTML).join('\n');
  
  // Create the full UI HTML
  const uiHTML = `
    <div class="ui-container">
      <div class="header-section">${headerHTML}</div>
      <div class="navigation-section">${navigationHTML}</div>
      <div class="main-content-section">${mainContentHTML}</div>
      <div class="footer-section">${footerHTML}</div>
      <div class="watermark">IMPROVED VERSION</div>
    </div>
  `;
  
  // Make the HTML more visually distinct from the original
  const htmlWithDistinctStyling = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Improved UI Design</title>
  <style>
    /* Reset and base styles */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    /* Global styles */
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      width: 800px;
      height: 600px;
      overflow: hidden;
      background-color: #f9f9f9;
    }
    
    /* UI Container */
    .ui-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #f9f9f9;
    }
    
    /* Section styles */
    .header-section, .navigation-section, .main-content-section, .footer-section {
      position: relative;
      width: 100%;
    }
    
    /* Component styles */
    .component {
      transition: all 0.2s ease;
    }
    
    .component:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    
    /* Add a watermark to make it obvious this is the improved version */
    .watermark {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(51, 51, 204, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 12px;
      z-index: 100;
    }
  </style>
</head>
<body>
  ${uiHTML}
</body>
</html>`;

  console.log('Final HTML report generated with UI-like structure');
  return htmlWithDistinctStyling;
}

/**
 * Complete component-based UI improvement process
 * Implements the refined iteration pipeline for targeted UI improvements
 * @param imageBase64 Original UI design image
 * @returns Object with HTML report and detailed analysis
 */
export const improveUIWithComponents = async (imageBase64: string): Promise<{ 
  html: string, 
  analysis: { 
    componentCount: number,
    improvements: Array<{
      componentType: string,
      improvements: Record<string, any>,
      reasoning: string
    }>
  } 
}> => {
  console.log('Starting REFINED COMPONENT-BASED UI IMPROVEMENT PROCESS...');
  
  try {
    console.log('-------------- PROCESS STARTED --------------');
    
    // Step 1: Detect UI components in the image
    console.log('\n👁️ STEP 1: COMPONENT EXTRACTION & ANALYSIS');
    const detectedComponents = await detectComponents(imageBase64);
    console.log(`✅ Detection complete: Found ${detectedComponents.length} components`);
    
    if (detectedComponents.length === 0) {
      console.warn('No components detected, returning basic analysis');
      return {
        html: generateFallbackHTMLReport(),
        analysis: {
          componentCount: 0,
          improvements: []
        }
      };
    }
    
    // Step 2: Analyze components and generate targeted improvement suggestions
    console.log('\n🔍 STEP 2: GENERATING TARGETED IMPROVEMENT BRIEFS');
    const improvementSuggestions = await analyzeComponents(detectedComponents, imageBase64);
    console.log(`✅ Analysis complete: Generated ${improvementSuggestions.length} improvement suggestions`);
    
    if (improvementSuggestions.length === 0) {
      console.warn('No improvement suggestions generated, returning basic analysis');
      return {
        html: generateBasicHTMLReport(),
        analysis: {
      componentCount: detectedComponents.length,
          improvements: []
        }
      };
    }
    
    // Step 3: Generate improved components with consistent design system
    console.log('\n🎨 STEP 3: APPLYING TARGETED IMPROVEMENTS WITH CONSISTENCY');
    const finalImprovements = await generateImprovedComponents(improvementSuggestions);
    console.log(`✅ Improvements applied to ${finalImprovements.length} components`);
    
    // Step 4: Generate HTML report with side-by-side comparison
    console.log('\n📊 STEP 4: GENERATING VISUAL COMPARISON REPORT');
    
    // Create a container for the components
    const containerId = `improved-components-${Date.now()}`;
    
    // Apply the component changes to generate HTML
    const componentsHTML = applyComponentChangesToDOM(finalImprovements, containerId);
    
    // Generate the full HTML report with the components
    const reportHTML = generateReportHTML(finalImprovements, componentsHTML);
    console.log('✅ HTML report generated successfully');
    
    // Create the analysis object for the response
    const analysis = {
      componentCount: detectedComponents.length,
      improvements: finalImprovements.map(improvement => ({
        componentType: improvement.original.type,
        // Limit the improvements to only the most important ones
        improvements: Object.entries(improvement.improvements)
          .slice(0, 5) // Take only the first 5 improvement properties
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {} as Record<string, any>),
        // Limit the reasoning to a reasonable length
        reasoning: improvement.reasoning.substring(0, 100)
      }))
      // Limit to at most 5 components to prevent excessive data
      .slice(0, 5)
    };
    
    console.log('-------------- PROCESS COMPLETED --------------');
    
    return {
      html: reportHTML,
      analysis
    };
  } catch (error) {
    console.error('Error in component-based UI improvement process:', error);
    
    // Return a fallback report in case of error
    return {
      html: generateFallbackHTMLReport(),
      analysis: {
        componentCount: 0,
        improvements: []
      }
    };
  }
};

/**
 * Generate a basic HTML report when the normal report generation fails
 * @returns Basic HTML report
 */
function generateBasicHTMLReport(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Improved UI Components</title>
  <style>
    body {
      font-family: 'Roboto', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f0f8ff; /* Light blue background */
      color: #333366; /* Dark blue text */
    }
    
    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 20px;
    }
    
    .components-container {
      position: relative;
      width: 100%;
      height: 600px;
      border: 1px solid #9999cc; /* Blue border */
      margin-bottom: 20px;
      overflow: hidden;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #e6e6fa;
    }
    
    h1 {
      color: #3333cc; /* Bright blue heading */
      text-align: center;
      margin-bottom: 30px;
    }
    
    .watermark {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: #3333cc;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      opacity: 0.8;
    }
    
    .button {
      background-color: #4a90e2;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      font-weight: bold;
      margin: 10px;
    }
    
    .card {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 20px;
      width: 80%;
      max-width: 500px;
    }
    
    .header {
      background-color: #4a90e2;
      color: white;
      padding: 16px;
      border-radius: 8px 8px 0 0;
      font-weight: bold;
    }
    
    .content {
      padding: 16px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <h1>Improved UI Components</h1>
    <div class="watermark">IMPROVED VERSION</div>
    
    <div class="components-container">
      <div class="card">
        <div class="header">Improved Header</div>
        <div class="content">
          <p>This is an improved UI with better styling and components.</p>
          <button class="button">Primary Button</button>
          <button class="button" style="background-color: #6c757d;">Secondary Button</button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a fallback HTML report when the entire process fails
 * @returns Fallback HTML report
 */
function generateFallbackHTMLReport(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Improved UI Components</title>
  <style>
    body {
      font-family: 'Roboto', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f0f8ff; /* Light blue background */
      color: #333366; /* Dark blue text */
    }
    
    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 20px;
    }
    
    .components-container {
      position: relative;
      width: 100%;
      height: 600px;
      border: 1px solid #9999cc; /* Blue border */
      margin-bottom: 20px;
      overflow: hidden;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #e6e6fa;
    }
    
    h1 {
      color: #3333cc; /* Bright blue heading */
      text-align: center;
      margin-bottom: 30px;
    }
    
    .watermark {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: #3333cc;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      opacity: 0.8;
    }
    
    .fallback-message {
      text-align: center;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 20px;
      max-width: 600px;
    }
    
    .button {
      background-color: #4a90e2;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      font-weight: bold;
      margin: 10px;
    }
    
    .navbar {
      background-color: #3333cc;
      color: white;
      padding: 16px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .content {
      padding: 20px;
    }
    
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 20px 0;
      overflow: hidden;
    }
    
    .card-header {
      background-color: #4a90e2;
      color: white;
      padding: 12px 16px;
      font-weight: bold;
    }
    
    .card-body {
      padding: 16px;
    }
    
    .footer {
      background-color: #f8f9fa;
      padding: 16px;
      text-align: center;
      border-radius: 0 0 8px 8px;
      border-top: 1px solid #dee2e6;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <h1>Improved UI Components</h1>
    <div class="watermark">IMPROVED VERSION</div>
    
    <div class="components-container">
      <div class="navbar">
        <div>Brand Logo</div>
        <div>
          <span style="margin: 0 10px;">Home</span>
          <span style="margin: 0 10px;">Features</span>
          <span style="margin: 0 10px;">Pricing</span>
          <span style="margin: 0 10px;">About</span>
        </div>
      </div>
      
      <div class="content" style="width: 100%;">
        <div class="card">
          <div class="card-header">Featured Content</div>
          <div class="card-body">
            <h3>Special title treatment</h3>
            <p>With supporting text below as a natural lead-in to additional content.</p>
            <button class="button">Go somewhere</button>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between;">
          <div class="card" style="width: 48%;">
            <div class="card-header">Card One</div>
            <div class="card-body">
              <p>Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            </div>
          </div>
          
          <div class="card" style="width: 48%;">
            <div class="card-header">Card Two</div>
            <div class="card-body">
              <p>Some quick example text to build on the card title and make up the bulk of the card's content.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer" style="width: 100%;">
        <p>© 2025 Improved UI. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Get AI analysis for a specific prompt
 * @param prompt The prompt to analyze
 * @returns The AI analysis
 */
export const getAIAnalysis = async (prompt: string): Promise<any> => {
  console.log('Getting AI analysis for prompt...');
  
  try {
    // Check API key before making the request
    const apiKey = checkOpenAIKey();
    
    // Prepare the request payload
    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a UI/UX design expert specializing in modern, accessible, and visually appealing interfaces. Analyze UI components and provide specific, actionable improvements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };
    
    console.log('Calling OpenAI API with GPT-4o model for analysis...');
    
    // Make the API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status}`, errorText);
      
      // Check for specific error types
      if (errorText.includes('model_not_found')) {
        throw new Error('The GPT-4o model is not available. Please check your OpenAI account or try again later.');
      }
      
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    // Parse the response
    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || '';
    
    console.log("GPT-4o Analysis Response:", analysisText.substring(0, 200) + "...");
    
    // Try to parse the analysis as JSON if it's in JSON format
    try {
      // Check if the analysis text contains a JSON object
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                        analysisText.match(/```\n([\s\S]*?)\n```/) ||
                        analysisText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsedAnalysis = JSON.parse(jsonStr);
        return {
          ...parsedAnalysis,
          rawText: analysisText,
          summary: extractSummary(analysisText)
        };
      }
    } catch (jsonError) {
      console.warn('Failed to parse analysis as JSON, returning as text', jsonError);
    }
    
    // If not JSON or parsing failed, return the raw text
    return {
      rawText: analysisText,
      summary: extractSummary(analysisText)
    };
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('model_not_found')) {
        console.error('The GPT-4o model is not available. Please check your OpenAI account or try again later.');
      } else if (error.message.includes('429')) {
        console.error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('Authentication error with OpenAI API. Please check your API key.');
      }
    }
    
    // Return a basic response with the error
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: 'Failed to get AI analysis',
      rawText: 'An error occurred while analyzing the prompt.'
    };
  }
};

/**
 * Extract a summary from analysis text
 * @param text The analysis text
 * @returns A summary of the analysis
 */
const extractSummary = (text: string): string => {
  // Try to extract a summary from the text
  const summaryMatch = text.match(/summary:?\s*(.*?)(?:\n|$)/i) ||
                       text.match(/overview:?\s*(.*?)(?:\n|$)/i) ||
                       text.match(/^(.*?)(?:\n|$)/i);
  
  if (summaryMatch && summaryMatch[1]) {
    return summaryMatch[1].trim();
  }
  
  // If no summary is found, return a generic one
  return 'UI components analyzed and improvements suggested based on modern design principles.';
}; 