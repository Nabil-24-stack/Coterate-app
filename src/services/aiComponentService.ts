// AI Component-Based UI Enhancement Service for Coterate
// This service implements a component-level approach to UI design improvements

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

/**
 * STEP 1: COMPONENT DETECTION
 * Uses GPT-4V to identify UI components
 * @param imageBase64 Base64 encoded image data
 * @returns Array of detected components with bounding boxes and initial classification
 */
export const detectComponents = async (imageBase64: string): Promise<DetectedComponent[]> => {
  console.log('STEP 1: Detecting UI components within design...');
  
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing. Please check your .env.local file.');
    throw new Error('OpenAI API key is missing');
  }
  
  try {
    // Ensure base64 string is properly formatted
    const formattedImage = imageBase64.startsWith('data:image') 
      ? imageBase64 
      : `data:image/png;base64,${imageBase64}`;
      
    // Enhanced prompt for better component detection
    const detectionPrompt = `
I need you to analyze this UI design image and identify all distinct UI components.

CRITICAL REQUIREMENTS:
1. Identify EACH individual UI component (buttons, text fields, cards, dropdowns, headers, icons, etc.)
2. For EACH component, provide:
   - Precise component type (be specific: primary_button, secondary_button, text_input, dropdown, etc.)
   - Exact bounding box coordinates as percentages of the image (x, y, width, height)
   - Detailed visual attributes (background color as hex, text color as hex, border radius in px, etc.)
   - Any text content within the component
   - Component state (default, active, disabled, etc.)

Your response MUST be valid JSON with this exact structure:
{
  "components": [
    {
      "type": "specific_component_type",
      "confidence": 0.95,
      "boundingBox": {
        "x": 10.5,
        "y": 25.3,
        "width": 20.8,
        "height": 5.2
      },
      "attributes": {
        "backgroundColor": "#hexcode",
        "textColor": "#hexcode",
        "borderRadius": 8,
        "fontSize": 16,
        "padding": "8px 16px",
        "text": "Button text if any",
        "state": "default"
      }
    },
    // Additional components...
  ]
}

CRITICAL: BE PRECISE WITH COORDINATES. ENSURE BOUNDING BOXES DO NOT OVERLAP INCORRECTLY.
`;

    // Call OpenAI's GPT-4 Vision with the enhanced prompt
    const response = await fetch(OPENAI_VISION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
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
                  url: formattedImage
                }
              }
            ]
          }
        ],
        max_tokens: 3000
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract JSON from the response
    const contentText = data.choices[0].message.content;
    console.log("GPT-4V Response:", contentText.substring(0, 200) + "...");
    
    const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/) || 
                      contentText.match(/```\n([\s\S]*?)\n```/) ||
                      contentText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract component data from API response');
    }
    
    const jsonText = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
    const componentsData = JSON.parse(jsonText);
    
    // Transform and validate the data
    if (!componentsData.components || !Array.isArray(componentsData.components) || componentsData.components.length === 0) {
      throw new Error('No components detected or invalid component data structure');
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
          backgroundColor: comp.attributes?.backgroundColor || '',
          textColor: comp.attributes?.textColor || '',
          borderRadius: comp.attributes?.borderRadius || 0,
          fontSize: comp.attributes?.fontSize || 14,
          padding: comp.attributes?.padding || '',
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
    throw error;
  }
};

/**
 * Complete component-based UI improvement process
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
  console.log('Starting COMPONENT-BASED UI IMPROVEMENT PROCESS...');
  
  // Validate API key - fail explicitly if not present
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing. Please add REACT_APP_OPENAI_API_KEY to your .env.local file.');
  }
  
  try {
    console.log('-------------- PROCESS STARTED --------------');
    
    // Step 1: Detect UI components in the image
    console.log('\n👁️ STEP 1: COMPONENT DETECTION');
    const detectedComponents = await detectComponents(imageBase64);
    console.log(`✅ Detection complete: Found ${detectedComponents.length} components`);
    
    // For now, return a simple analysis since we're focusing on API key handling
    return {
      html: `<html><body><h1>UI Analysis Complete</h1><p>Found ${detectedComponents.length} components</p></body></html>`,
      analysis: {
        componentCount: detectedComponents.length,
        improvements: detectedComponents.map(component => ({
          componentType: component.type,
          improvements: {},
          reasoning: "Component detected successfully."
        }))
      }
    };
  } catch (error) {
    console.error('Error in component-based UI improvement process:', error);
    // Re-throw the error
    throw error;
  }
}; 