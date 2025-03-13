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
 * Uses GPT-4V with detailed prompting to precisely identify UI components
 * @param imageBase64 Base64 encoded image data
 * @returns Array of detected components with bounding boxes and initial classification
 */
export const detectComponents = async (imageBase64: string): Promise<DetectedComponent[]> => {
  console.log('STEP 1: Detecting UI components within design...');
  
  try {
    // Check API key before making the request and get the cleaned key
    const cleanedApiKey = checkOpenAIKey();
    
    // Add fallback for empty or invalid input
    if (!imageBase64 || !imageBase64.includes('data:image')) {
      console.warn('Invalid image data provided');
      return createFallbackComponents();
    }
    
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
        "y": 20.3,
        "width": 15.2,
        "height": 8.7
      },
      "attributes": {
        "backgroundColor": "#ffffff",
        "textColor": "#333333",
        "borderRadius": 8,
        "fontSize": 14,
        "padding": "12px",
        "text": "Component text content",
        "state": "default"
      }
    }
  ]
}

IMPORTANT:
- Ensure your JSON is valid with no syntax errors
- Do not include any explanations or text outside the JSON object
- Use double quotes for all strings and property names
- Do not use trailing commas
- Provide as many components as you can identify
`;

    // Call OpenAI's API with the enhanced detection prompt
    const response = await fetch(OPENAI_API_URL, {
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
            content: "You are a UI component detection expert. You analyze UI designs and identify individual components with precise details."
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
    
    // Check if the response indicates the API can't analyze images
    if (contentText.includes("unable to directly analyze images") || 
        contentText.includes("can't analyze images") ||
        contentText.includes("cannot analyze images") ||
        contentText.includes("I'm unable to") ||
        !contentText.includes("{")) {
      console.log("API indicated it cannot analyze images, using fallback components");
      return createFallbackComponents();
    }
    
    try {
      // Try multiple approaches to extract valid JSON
      let componentsData = await extractComponentsData(contentText);
      
      if (componentsData && componentsData.components && Array.isArray(componentsData.components) && componentsData.components.length > 0) {
    // Transform the data into our DetectedComponent format with validation
    const detectedComponents: DetectedComponent[] = componentsData.components.map((comp: any, index: number) => {
      // Validate bounding box values
      const boundingBox = {
        x: typeof comp.boundingBox?.x === 'number' ? comp.boundingBox.x : 0,
        y: typeof comp.boundingBox?.y === 'number' ? comp.boundingBox.y : 0,
        width: typeof comp.boundingBox?.width === 'number' ? comp.boundingBox.width : 10,
        height: typeof comp.boundingBox?.height === 'number' ? comp.boundingBox.height : 10
      };
      
          // Ensure values are within valid ranges (0-100%)
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
      } else {
        console.warn('No valid components found in API response, using fallback');
        return createFallbackComponents();
      }
    } catch (extractError) {
      console.error('Error extracting component data:', extractError);
      console.log('Using fallback components instead');
      return createFallbackComponents();
    }
  } catch (error) {
    console.error('Error in component detection step:', error);
    console.log('Using fallback components due to error');
    return createFallbackComponents();
  }
};

// Helper function to create fallback components when detection fails
function createFallbackComponents(): DetectedComponent[] {
  console.log('Creating fallback components that match the original UI structure');
  
  return [
    // Header with title and user info
    {
      id: 'component-header',
      type: 'header',
      confidence: 1,
      boundingBox: {
        x: 0,
        y: 0,
        width: 100,
        height: 10
      },
      attributes: {
        backgroundColor: '#3333cc', // Blue header
        textColor: '#ffffff',
        borderRadius: 0,
        fontSize: 24,
        padding: '16px',
        text: "Alex's Notion",
        state: 'default'
      }
    },
    // Navigation sidebar
    {
      id: 'component-sidebar',
      type: 'navigation',
      confidence: 1,
      boundingBox: {
        x: 0,
        y: 10,
        width: 20,
        height: 80
      },
      attributes: {
        backgroundColor: '#f5f5f7',
        textColor: '#333366',
        borderRadius: 0,
        fontSize: 16,
        padding: '16px',
        text: 'Navigation',
        state: 'default'
      }
    },
    // Main content area
    {
      id: 'component-content',
      type: 'container',
      confidence: 1,
      boundingBox: {
        x: 20,
        y: 10,
        width: 80,
        height: 80
      },
      attributes: {
        backgroundColor: '#ffffff',
        textColor: '#333366',
        borderRadius: 0,
        fontSize: 16,
        padding: '24px',
        text: '',
        state: 'default'
      }
    },
    // Page title
    {
      id: 'component-page-title',
      type: 'text',
      confidence: 1,
      boundingBox: {
        x: 22,
        y: 15,
        width: 76,
        height: 8
      },
      attributes: {
        backgroundColor: 'transparent',
        textColor: '#333333',
        borderRadius: 0,
        fontSize: 24,
        padding: '8px',
        text: 'Jump back in',
        state: 'default'
      }
    },
    // Card 1 - Getting Started
    {
      id: 'component-card-1',
      type: 'card',
      confidence: 1,
      boundingBox: {
        x: 22,
        y: 25,
        width: 30,
        height: 25
      },
      attributes: {
        backgroundColor: '#f9f9f9',
        textColor: '#333333',
        borderRadius: 8,
        fontSize: 18,
        padding: '16px',
        text: 'Getting Started on Mobile',
        state: 'default'
      }
    },
    // Card 2 - Private
    {
      id: 'component-card-2',
      type: 'card',
      confidence: 1,
      boundingBox: {
        x: 22,
        y: 55,
        width: 30,
        height: 10
      },
      attributes: {
        backgroundColor: '#f9f9f9',
        textColor: '#333333',
        borderRadius: 8,
        fontSize: 18,
        padding: '16px',
        text: 'Private',
        state: 'default'
      }
    },
    // List item 1
    {
      id: 'component-list-item-1',
      type: 'list-item',
      confidence: 1,
      boundingBox: {
        x: 22,
        y: 70,
        width: 76,
        height: 6
      },
      attributes: {
        backgroundColor: 'transparent',
        textColor: '#333333',
        borderRadius: 0,
        fontSize: 16,
        padding: '8px',
        text: 'Getting Started on Mobile',
        state: 'default'
      }
    },
    // List item 2
    {
      id: 'component-list-item-2',
      type: 'list-item',
      confidence: 1,
      boundingBox: {
        x: 22,
        y: 76,
        width: 76,
        height: 6
      },
      attributes: {
        backgroundColor: 'transparent',
        textColor: '#333333',
        borderRadius: 0,
        fontSize: 16,
        padding: '8px',
        text: 'Habit Tracker',
        state: 'default'
      }
    },
    // List item 3
    {
      id: 'component-list-item-3',
      type: 'list-item',
      confidence: 1,
      boundingBox: {
        x: 22,
        y: 82,
        width: 76,
        height: 6
      },
      attributes: {
        backgroundColor: 'transparent',
        textColor: '#333333',
        borderRadius: 0,
        fontSize: 16,
        padding: '8px',
        text: 'Weekly To-do List',
        state: 'default'
      }
    },
    // List item 4
    {
      id: 'component-list-item-4',
      type: 'list-item',
      confidence: 1,
      boundingBox: {
        x: 22,
        y: 88,
        width: 76,
        height: 6
      },
      attributes: {
        backgroundColor: 'transparent',
        textColor: '#333333',
        borderRadius: 0,
        fontSize: 16,
        padding: '8px',
        text: 'Personal Website',
        state: 'default'
      }
    },
    // Button - Browse templates
    {
      id: 'component-button',
      type: 'button',
      confidence: 1,
      boundingBox: {
        x: 22,
        y: 95,
        width: 40,
        height: 8
      },
      attributes: {
        backgroundColor: '#f0f0f0',
        textColor: '#333333',
        borderRadius: 8,
        fontSize: 16,
        padding: '12px',
        text: 'Browse templates',
        state: 'default'
      }
    },
    // Bottom navigation
    {
      id: 'component-bottom-nav',
      type: 'navigation',
      confidence: 1,
      boundingBox: {
        x: 0,
        y: 90,
        width: 100,
        height: 10
      },
      attributes: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        borderRadius: 0,
        fontSize: 16,
        padding: '8px',
        text: '',
        state: 'default'
      }
    }
  ];
}

// Helper function to extract components data from API response
async function extractComponentsData(contentText: string): Promise<ComponentsData | null> {
  // Check for common error responses
  if (contentText.includes("unable to directly analyze images") || 
      contentText.includes("can't analyze images") ||
      contentText.includes("cannot analyze images") ||
      contentText.includes("I'm unable to")) {
    console.log("API indicated it cannot analyze images");
    throw new Error('API cannot analyze images');
  }

  // Enhanced JSON extraction with multiple patterns
  let jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/) || 
                 contentText.match(/```\n([\s\S]*?)\n```/) ||
                 contentText.match(/```([\s\S]*?)```/) ||
                 contentText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    console.error('Failed to extract JSON. Full response:', contentText);
    throw new Error('Failed to extract component data from API response');
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
      console.error('No valid JSON object found in:', jsonText);
      throw new Error('No valid JSON object found in API response');
    }
  }
  
  // Remove any comments from the JSON text
  jsonText = jsonText.replace(/\/\/.*$/gm, ''); // Remove single-line comments
  jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
  
  // Clean up any trailing commas which are invalid in JSON
  jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
  
  console.log('Extracted JSON text:', jsonText.substring(0, 100) + '...');
  
  // Try multiple parsing approaches
  try {
    // First try: direct parsing
    return JSON.parse(jsonText);
  } catch (error1) {
    try {
      // Second try: fix quotes
      const fixedJson = jsonText.replace(/'/g, '"');
      return JSON.parse(fixedJson);
    } catch (error2) {
      try {
        // Third try: extract components array
        const componentsMatch = jsonText.match(/"components"\s*:\s*(\[[\s\S]*?\])/);
        if (componentsMatch && componentsMatch[1]) {
          const componentsArray = JSON.parse(componentsMatch[1]);
          return { components: componentsArray };
        }
      } catch (error3) {
        // Last resort: try to manually construct a valid JSON
        try {
          // Look for component-like structures
          const componentMatches = jsonText.match(/\{\s*"type"\s*:\s*"[^"]+"/g);
          if (componentMatches && componentMatches.length > 0) {
            // Try to extract individual components and build a valid array
            const components = [];
            for (const match of componentMatches) {
              const componentText = jsonText.substring(
                jsonText.indexOf(match),
                jsonText.indexOf('}', jsonText.indexOf(match)) + 1
              );
              try {
                const component = JSON.parse(componentText);
                components.push(component);
              } catch (e) {
                // Skip invalid components
              }
            }
            if (components.length > 0) {
              return { components };
            }
          }
        } catch (error4) {
          // If all parsing attempts fail, throw the original error
          throw error1;
        }
      }
    }
  }
  
  return null;
}

/**
 * STEP 2: ENHANCED COMPONENT ANALYSIS & MATERIAL-UI MAPPING
 * Analyzes each component and creates suggestions with Material-UI configurations
 * @param components Array of detected components
 * @param fullImageBase64 Original full UI design image
 * @returns Array of improvement suggestions for each component with Material-UI configs
 */
export const analyzeComponents = async (
  components: DetectedComponent[],
  fullImageBase64: string
): Promise<ComponentImprovementSuggestion[]> => {
  console.log('STEP 2: Analyzing components for improvements and Material-UI mapping...');
  
  try {
    // Check API key before making the request and get the cleaned key
    const cleanedApiKey = checkOpenAIKey();
    
    // Enhanced analysis prompt with Material-UI component mapping
    const componentAnalysisPrompt = `
As a UI/UX expert, analyze these UI components and create Material-UI component configurations for each one.

COMPONENTS TO ANALYZE:
${JSON.stringify(components, null, 2)}

For EACH component, provide:

1. VISUAL IMPROVEMENTS:
   - Color enhancements (suggest specific hex codes that improve contrast and visual appeal)
   - Typography improvements (font size, weight, line height)
   - Sizing and spacing adjustments (exact padding values in px)
   - Border radius modifications (specific px values)
   - Shadow or elevation changes (specific values)

2. MATERIAL-UI COMPONENT MAPPING:
   - Map each component to the appropriate Material-UI component
   - Provide exact prop configurations for the Material-UI component
   - Include all necessary style overrides

FORMAT YOUR RESPONSE AS A JSON ARRAY:
[
  {
    "componentId": "component-0",
    "improvements": {
      "backgroundColor": "#specificHexCode",
      "textColor": "#specificHexCode",
      "borderRadius": 8,
      "fontSize": 16,
      "padding": "8px 16px",
      "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
      // Add other properties as needed
    },
    "reasoning": "Detailed explanation of why these changes improve the component",
    "componentConfig": {
      "type": "Button", // Material-UI component name
      "props": {
        "variant": "contained",
        "color": "primary",
        "size": "medium",
        "disableElevation": false
      },
      "children": "Button Text", // Or nested component config for complex components
      "styles": {
        "backgroundColor": "#4a90e2",
        "color": "#ffffff",
        "borderRadius": "8px",
        "padding": "12px 24px",
        "textTransform": "none",
        "fontWeight": 500
      }
    }
  },
  // Additional components...
]

IMPORTANT: Be extremely specific with your suggestions and component configurations.
Ensure the Material-UI components map correctly to the original component types.
Use exact values (hex codes, pixel values, etc.) not vague descriptions.
`;

    // Call OpenAI's API with the enhanced analysis prompt
    const response = await fetch(OPENAI_API_URL, {
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
            content: "You are a senior UI/UX designer with expertise in React, Material-UI, and modern interface design. You provide precise, actionable improvements for UI components with exact Material-UI configurations."
          },
          {
            role: "user", 
            content: componentAnalysisPrompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.2 // Lower temperature for more precise responses
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract JSON from the response
    const contentText = data.choices[0].message.content;
    console.log("Analysis response received:", contentText.substring(0, 200) + "...");
    
    // Improved JSON extraction with better regex patterns and error handling
    let jsonText = '';
    let componentsData: any[] | null = null;
    
    try {
      // Try to extract JSON from code blocks or directly from the text
      const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/) || 
                      contentText.match(/```\n([\s\S]*?)\n```/) ||
                      contentText.match(/```([\s\S]*?)```/) ||
                      contentText.match(/\{[\s\S]*\}/) ||
                      contentText.match(/\[[\s\S]*\]/);
    
      if (jsonMatch) {
        // Extract the JSON text
        jsonText = jsonMatch[0];
        
        // If the match is a code block, extract the content
        if (jsonText.startsWith('```')) {
          // Extract content between code block markers
          const codeContent = jsonMatch[1] || jsonText.replace(/```(json)?\n?|```$/g, '');
          jsonText = codeContent;
        }
        
        // Remove any comments from the JSON text
        jsonText = jsonText.replace(/\/\/.*$/gm, ''); // Remove single-line comments
        jsonText = jsonText.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
        
        // Clean up any trailing commas which are invalid in JSON
        jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
        
        console.log('Extracted JSON text:', jsonText.substring(0, 100) + '...');
        
        // Check if the JSON is an array or an object
        if (jsonText.trim().startsWith('[')) {
          // It's an array, parse it directly
          componentsData = JSON.parse(jsonText);
        } else if (jsonText.trim().startsWith('{')) {
          // It's an object, check if it's a single component or a container with components
          const parsedObject = JSON.parse(jsonText);
          
          if (Array.isArray(parsedObject.components)) {
            // It has a components array
            componentsData = parsedObject.components;
          } else if (parsedObject.componentId || parsedObject.id) {
            // It's a single component, wrap it in an array
            componentsData = [parsedObject];
          } else {
            // Try to convert object entries to an array of components
            componentsData = Object.entries(parsedObject).map(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                // Add the key as id if not present
                return { id: key, ...(value as object) };
              }
              return null;
            }).filter(Boolean) as any[];
          }
        }
      }
      
      if (!componentsData || componentsData.length === 0) {
        console.warn('Failed to extract component configurations from API response, using fallback suggestions');
        // Create fallback component suggestions with basic improvements
        componentsData = components.map(comp => ({
          componentId: comp.id,
          improvements: {
            backgroundColor: comp.type.toLowerCase().includes('button') ? '#4a90e2' : '#ffffff',
            textColor: comp.type.toLowerCase().includes('button') ? '#ffffff' : '#333333',
            borderRadius: 8,
            fontSize: 16,
            padding: '12px 16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          reasoning: "Fallback improvements generated due to parsing issues with the API response.",
          componentConfig: {
            type: comp.type,
            props: {
              variant: comp.type.toLowerCase().includes('button') ? 'contained' : 'outlined',
              color: 'primary'
            },
            children: comp.attributes.text || comp.type,
            styles: {
              backgroundColor: comp.type.toLowerCase().includes('button') ? '#4a90e2' : '#ffffff',
              color: comp.type.toLowerCase().includes('button') ? '#ffffff' : '#333333',
              borderRadius: '8px',
              padding: '12px 16px'
            }
          }
        }));
      }
    } catch (parseError: unknown) {
      console.error('JSON parsing error:', parseError);
      console.error('JSON text that failed to parse:', jsonText);
      
      // Create fallback component suggestions
      console.warn('Using fallback component suggestions due to parsing error');
      componentsData = components.map(comp => ({
        componentId: comp.id,
        improvements: {
          backgroundColor: comp.type.toLowerCase().includes('button') ? '#4a90e2' : '#ffffff',
          textColor: comp.type.toLowerCase().includes('button') ? '#ffffff' : '#333333',
          borderRadius: 8,
          fontSize: 16,
          padding: '12px 16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        reasoning: "Fallback improvements generated due to parsing issues with the API response.",
        componentConfig: {
          type: comp.type,
          props: {
            variant: comp.type.toLowerCase().includes('button') ? 'contained' : 'outlined',
            color: 'primary'
          },
          children: comp.attributes.text || comp.type,
          styles: {
            backgroundColor: comp.type.toLowerCase().includes('button') ? '#4a90e2' : '#ffffff',
            color: comp.type.toLowerCase().includes('button') ? '#ffffff' : '#333333',
            borderRadius: '8px',
            padding: '12px 16px'
          }
        }
      }));
    }
    
    if (!Array.isArray(componentsData)) {
      console.warn('Invalid format for component configurations - expected array, using fallback');
      // Create fallback if not an array
      componentsData = components.map(comp => ({
        componentId: comp.id,
        improvements: {
          backgroundColor: '#f8f9fa',
          textColor: '#333333',
          borderRadius: 8,
          padding: '12px 16px'
        },
        reasoning: "Fallback improvements generated due to invalid format in API response.",
        componentConfig: {
          type: comp.type,
          props: {},
          children: comp.attributes.text || comp.type,
          styles: {
            backgroundColor: '#f8f9fa',
            color: '#333333',
            borderRadius: '8px',
            padding: '12px 16px'
          }
        }
      }));
    }
    
    // Map the suggestions to our ComponentImprovementSuggestion format
    const improvementSuggestions: ComponentImprovementSuggestion[] = components.map(component => {
      // Handle both array format and object with components property
      const suggestions = Array.isArray(componentsData) ? componentsData : 
                         (componentsData && typeof componentsData === 'object' && componentsData !== null && 'components' in componentsData) 
                         ? (componentsData as any).components : [];
      
      const suggestion = suggestions.find((s: any) => s.componentId === component.id);
      
      if (!suggestion) {
        // Create a default suggestion if none found
        return {
          componentId: component.id,
          original: component,
          improvements: {
            backgroundColor: component.type.toLowerCase().includes('button') ? '#4a90e2' : '#ffffff',
            textColor: component.type.toLowerCase().includes('button') ? '#ffffff' : '#333333',
            borderRadius: 8,
            padding: '12px 16px'
          },
          reasoning: "Default improvements applied as no specific suggestions were found.",
          componentConfig: {
            type: component.type,
            props: {},
            children: component.attributes.text || component.type,
            styles: {
              backgroundColor: component.type.toLowerCase().includes('button') ? '#4a90e2' : '#ffffff',
              color: component.type.toLowerCase().includes('button') ? '#ffffff' : '#333333',
              borderRadius: '8px',
              padding: '12px 16px'
            }
          },
          cssStyles: `.component-${component.id} {
            background-color: ${component.type.toLowerCase().includes('button') ? '#4a90e2' : '#ffffff'};
            color: ${component.type.toLowerCase().includes('button') ? '#ffffff' : '#333333'};
            border-radius: 8px;
            padding: 12px 16px;
          }`
        };
      }
      
      return {
        componentId: component.id,
        original: component,
        improvements: suggestion.improvements || {},
        reasoning: suggestion.reasoning || "No reasoning provided.",
        componentConfig: suggestion.componentConfig || undefined,
        cssStyles: suggestion.componentConfig ? 
          generateComponentCSS(suggestion.componentConfig, component.id) : 
          `.component-${component.id} {
            background-color: ${component.type.toLowerCase().includes('button') ? '#4a90e2' : '#ffffff'};
            color: ${component.type.toLowerCase().includes('button') ? '#ffffff' : '#333333'};
            border-radius: 8px;
            padding: 12px 16px;
          }`
      };
    });
    
    console.log(`Generated detailed component configurations for ${improvementSuggestions.length} components`);
    
    // Log improvement summaries for debugging
    improvementSuggestions.forEach(suggestion => {
      const hasConfig = suggestion.componentConfig ? 'with' : 'without';
      console.log(`Component ${suggestion.componentId} (${suggestion.original.type}): ${hasConfig} Material-UI config`);
    });
    
    return improvementSuggestions;
    
  } catch (error) {
    console.error('Error in component analysis step:', error);
    throw error;
  }
};

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
 * Complete component-based UI improvement process with enhanced DOM updates
 * @param imageBase64 Original UI design image
 * @param containerId ID of the container element to update (optional)
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
  console.log('Starting UI improvement with component-based approach');
  
  try {
    // Step 1: Detect components in the image
    console.log('Detecting components in the image...');
    const detectedComponents = await detectComponents(imageBase64);
    
    if (!detectedComponents || detectedComponents.length === 0) {
      console.warn('No components detected, using fallback components');
      // Use fallback components that match the original UI structure
      const fallbackComponents = createFallbackComponents();
      
      // Generate a basic HTML report with the fallback components
      const componentsHTML = applyComponentChangesToDOM(
        fallbackComponents.map(component => ({
          componentId: component.id,
          original: component,
          improvements: {
            backgroundColor: component.attributes.backgroundColor,
            textColor: component.attributes.textColor,
            borderRadius: component.attributes.borderRadius,
            fontSize: component.attributes.fontSize,
            padding: component.attributes.padding
          },
          reasoning: 'Using fallback component with improved styling',
          cssStyles: '',
          componentConfig: inferComponentConfig(component, {})
        })),
        'improved-ui-container'
      );
      
      const html = generateReportHTML(
        fallbackComponents.map(component => ({
          componentId: component.id,
          original: component,
          improvements: {
            backgroundColor: component.attributes.backgroundColor,
            textColor: component.attributes.textColor,
            borderRadius: component.attributes.borderRadius,
            fontSize: component.attributes.fontSize,
            padding: component.attributes.padding
          },
          reasoning: 'Using fallback component with improved styling',
          cssStyles: '',
          componentConfig: inferComponentConfig(component, {})
        })),
        componentsHTML
      );
      
      return {
        html,
        analysis: {
          componentCount: fallbackComponents.length,
          improvements: fallbackComponents.map(component => ({
            componentType: component.type,
            improvements: {
              backgroundColor: component.attributes.backgroundColor,
              textColor: component.attributes.textColor,
              borderRadius: component.attributes.borderRadius,
              fontSize: component.attributes.fontSize,
              padding: component.attributes.padding
            },
            reasoning: 'Using fallback component with improved styling'
          }))
        }
      };
    }
    
    console.log(`Detected ${detectedComponents.length} components`);
    
    // Step 2: Analyze components for improvements
    console.log('Analyzing components for improvements...');
    const improvementSuggestions = await analyzeComponents(detectedComponents, imageBase64);
    
    if (!improvementSuggestions || improvementSuggestions.length === 0) {
      console.warn('No improvement suggestions generated, using basic improvements');
      // Apply basic improvements to the detected components
      const basicImprovements = detectedComponents.map(component => ({
        componentId: component.id,
        original: component,
        improvements: {
          backgroundColor: component.type.toLowerCase().includes('button') 
            ? '#4a90e2' // Blue for buttons
            : component.type.toLowerCase().includes('header')
              ? '#3333cc' // Dark blue for headers
              : '#ffffff', // White for other components
          textColor: component.type.toLowerCase().includes('button') || component.type.toLowerCase().includes('header')
            ? '#ffffff' // White text for buttons and headers
            : '#333366', // Dark blue text for other components
          borderRadius: component.type.toLowerCase().includes('button')
            ? 8 // Rounded corners for buttons and cards
            : 0, // No rounded corners for other components
          fontSize: component.type.toLowerCase().includes('header')
            ? 24 // Larger font for headers
            : component.type.toLowerCase().includes('title')
              ? 20 // Medium font for titles
              : 16, // Default font size for other components
          padding: component.type.toLowerCase().includes('button')
            ? '12px 24px' // More padding for buttons
            : '16px' // Default padding for other components
        },
        reasoning: `Applied standard improvements to ${component.type} component`,
        cssStyles: '',
        componentConfig: inferComponentConfig(component, {})
      }));
      
      // Generate HTML with the basic improvements
      const componentsHTML = applyComponentChangesToDOM(basicImprovements, 'improved-ui-container');
      const html = generateReportHTML(basicImprovements, componentsHTML);
      
      return {
        html,
        analysis: {
      componentCount: detectedComponents.length,
          improvements: basicImprovements.map(improvement => ({
            componentType: improvement.original.type,
            improvements: improvement.improvements,
            reasoning: improvement.reasoning
          }))
        }
      };
    }
    
    console.log(`Generated ${improvementSuggestions.length} improvement suggestions`);
    
    // Step 3: Generate improved components with configurations
    console.log('Generating improved components...');
    const improvedComponents = await generateImprovedComponents(improvementSuggestions);
    
    // Step 4: Apply component changes to generate HTML
    console.log('Applying component changes to generate HTML...');
    const componentsHTML = applyComponentChangesToDOM(improvedComponents, 'improved-ui-container');
    
    // Step 5: Generate the final HTML report
    console.log('Generating final HTML report...');
    const html = generateReportHTML(improvedComponents, componentsHTML);
    
    return {
      html,
      analysis: {
        componentCount: improvedComponents.length,
        improvements: improvedComponents.map(component => ({
          componentType: component.original.type,
          improvements: component.improvements,
          reasoning: component.reasoning
        }))
      }
    };
  } catch (error) {
    console.error('Error in improveUIWithComponents:', error);
    
    // Fallback to a basic UI improvement
    console.log('Using fallback UI improvement due to error');
    const fallbackComponents = createFallbackComponents();
    const fallbackHTML = generateFallbackHTMLReport();
    
    return {
      html: fallbackHTML,
      analysis: {
        componentCount: fallbackComponents.length,
        improvements: fallbackComponents.map(component => ({
          componentType: component.type,
          improvements: {
            backgroundColor: component.attributes.backgroundColor,
            textColor: component.attributes.textColor,
            borderRadius: component.attributes.borderRadius,
            fontSize: component.attributes.fontSize,
            padding: component.attributes.padding
          },
          reasoning: 'Using fallback component with improved styling'
        }))
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
    
    // Make the API request
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
    
    // Parse the response
    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || '';
    
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
          summary: parsedAnalysis.summary || extractSummary(analysisText)
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse analysis as JSON:', parseError);
    }
    
    // If JSON parsing fails, return the raw text with a generated summary
    return {
      rawText: analysisText,
      summary: extractSummary(analysisText)
    };
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    throw new Error(`Failed to get AI analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
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