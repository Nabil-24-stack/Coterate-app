/**
 * Figma API Service
 * This service handles interactions with the Figma API to extract node information
 */

// Import environment variables for Figma API
const rawFigmaApiKey = process.env.REACT_APP_FIGMA_ACCESS_TOKEN;

// Placeholder token as a fallback (not a real token)
const FALLBACK_TOKEN = 'your-figma-access-token-here';

/**
 * Clean and validate the Figma API token
 * @returns Cleaned Figma API token
 */
export const cleanFigmaApiToken = (): string => {
  if (!rawFigmaApiKey) {
    console.log('Figma API token is missing from env. Please set REACT_APP_FIGMA_ACCESS_TOKEN in your .env.local file.');
    return FALLBACK_TOKEN;
  }
  
  console.log('Raw Figma API token:', rawFigmaApiKey);
  console.log('Raw token type:', typeof rawFigmaApiKey);
  console.log('Raw token length:', rawFigmaApiKey.length);
  
  // Check if the last character is a % and remove it
  const lastChar = rawFigmaApiKey.charAt(rawFigmaApiKey.length - 1);
  console.log('Last character:', lastChar, 'ASCII code:', lastChar.charCodeAt(0));
  
  // Clean up the token by removing any quotes, spaces, line breaks, or trailing % characters
  let cleanedToken = rawFigmaApiKey
    .toString()
    .replace(/["']/g, '') // Remove quotes
    .replace(/\s+/g, '')  // Remove whitespace including line breaks
    .trim();              // Trim any remaining whitespace
  
  // Explicitly check for and remove trailing % character
  if (cleanedToken.endsWith('%')) {
    console.log('Removing trailing % character');
    cleanedToken = cleanedToken.substring(0, cleanedToken.length - 1);
  }
  
  console.log('Cleaned Figma API token length:', cleanedToken.length);
  console.log('Cleaned Figma API token prefix:', cleanedToken.substring(0, 5) + '...');
  
  if (cleanedToken === 'your-figma-access-token-here' || 
      cleanedToken === 'your_figma_access_token_here' ||
      cleanedToken.length < 10) {
    console.error('Invalid Figma API token. Using fallback token.');
    return FALLBACK_TOKEN;
  }
  
  return cleanedToken;
};

// Get the cleaned Figma API token
const FIGMA_API_KEY = cleanFigmaApiToken();

// Base URL for Figma API
const FIGMA_API_URL = 'https://api.figma.com/v1';

/**
 * Validate a Figma URL
 * @param url URL to validate
 * @returns Object with validation result and error message if any
 */
export const validateFigmaUrl = (url: string): { isValid: boolean; message?: string } => {
  if (!url) {
    return { isValid: false, message: 'Please enter a Figma URL' };
  }
  
  // Trim the URL
  const trimmedUrl = url.trim();
  
  // Check if it's a Figma URL
  if (!trimmedUrl.includes('figma.com/file/') && !trimmedUrl.includes('figma.com/design/')) {
    return { 
      isValid: false, 
      message: 'Invalid Figma URL. Please make sure you are copying a link from Figma (should contain "figma.com/file/" or "figma.com/design/")' 
    };
  }
  
  // Check if it has a node ID
  if (!trimmedUrl.includes('node-id=')) {
    console.warn('No node ID found in the Figma URL. This may cause issues when fetching specific frames.');
    // We'll still consider it valid but with a warning
    return { 
      isValid: true, 
      message: 'Warning: No node ID found in the URL. We\'ll try to fetch the default frame, but for best results, copy a link to a specific frame by right-clicking on a frame in Figma and selecting "Copy Link"' 
    };
  }
  
  return { isValid: true };
};

/**
 * Extract file key and node ID from a Figma URL
 * @param url Figma URL
 * @returns Object containing file key and node ID
 */
export const extractFigmaInfo = (url: string): { fileKey: string; nodeId: string } => {
  console.log('Extracting Figma info from URL:', url);
  
  if (!url) {
    console.error('Empty Figma URL provided');
    return { fileKey: '', nodeId: '' };
  }
  
  try {
    // Clean the URL by trimming whitespace
    const cleanUrl = url.trim();
    
    // Different regex patterns to match various Figma URL formats
    const fileKeyPatterns = [
      /https:\/\/www\.figma\.com\/file\/([^/?#]+)/i,  // Standard file URL
      /https:\/\/www\.figma\.com\/proto\/([^/?#]+)/i, // Prototype URL
      /https:\/\/www\.figma\.com\/design\/([^/?#]+)/i // Design URL
    ];
    
    let fileKey = '';
    
    // Try each pattern until we find a match
    for (const pattern of fileKeyPatterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        fileKey = match[1];
        break;
      }
    }
    
    if (!fileKey) {
      console.error('Could not extract file key from Figma URL:', cleanUrl);
      return { fileKey: '', nodeId: '' };
    }
    
    // Extract node ID from URL query parameters
    let nodeId = '';
    const nodeIdMatch = cleanUrl.match(/node-id=([^&]+)/i);
    
    if (nodeIdMatch && nodeIdMatch[1]) {
      // URL decode the node ID in case it's encoded
      nodeId = decodeURIComponent(nodeIdMatch[1]);
    }
    
    console.log('Extracted Figma info:', { fileKey, nodeId });
    return { fileKey, nodeId };
  } catch (error) {
    console.error('Error extracting Figma info:', error);
    return { fileKey: '', nodeId: '' };
  }
};

/**
 * Get file data from Figma API
 * @param fileKey Figma file key
 * @param nodeId Optional node ID to fetch specific node
 * @returns Promise with file data
 */
export const getFigmaFileData = async (
  fileKey: string,
  nodeId?: string | null
): Promise<any> => {
  if (!FIGMA_API_KEY) {
    throw new Error('Figma API key is missing or invalid. Please check your environment variables and ensure you have set a valid REACT_APP_FIGMA_ACCESS_TOKEN in your .env.local file.');
  }

  try {
    // Validate the file key
    if (!fileKey || fileKey.trim() === '') {
      throw new Error('Figma file key is required but was empty or invalid.');
    }
    
    console.log(`Fetching Figma file data for key: ${fileKey}${nodeId ? ` and node: ${nodeId}` : ''}`);
    
    let url = `${FIGMA_API_URL}/files/${fileKey}`;
    
    // If nodeId is provided, use the nodes endpoint
    if (nodeId) {
      url = `${FIGMA_API_URL}/files/${fileKey}/nodes?ids=${nodeId}`;
    }
    
    console.log(`Making request to Figma API: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Figma-Token': FIGMA_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Figma API error (${response.status}): ${errorText}`);
      
      // Provide more helpful error messages based on status code
      if (response.status === 404) {
        throw new Error(`Figma file not found. Please check if the file key "${fileKey}" is correct and that you have access to this file.`);
      } else if (response.status === 403) {
        throw new Error('Access denied. Make sure your Figma access token is valid and you have permission to access this file.');
      } else if (response.status === 401) {
        throw new Error('Unauthorized. Your Figma access token may be invalid or expired.');
      } else {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}. ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Successfully fetched Figma file data');
    return data;
  } catch (error) {
    console.error('Error fetching Figma file data:', error);
    
    // Rethrow with a more user-friendly message
    if (error instanceof Error) {
      throw error; // Already a well-formatted error
    } else {
      throw new Error(`Failed to fetch Figma file data: ${String(error)}`);
    }
  }
};

/**
 * Get image URLs for nodes in a Figma file
 * @param fileKey Figma file key
 * @param nodeIds Array of node IDs
 * @param format Image format (jpg, png, svg, pdf)
 * @param scale Image scale (1, 2, 3, 4)
 * @returns Promise with image URLs
 */
export const getFigmaImages = async (
  fileKey: string,
  nodeIds: string[],
  format: 'jpg' | 'png' | 'svg' | 'pdf' = 'png',
  scale: 1 | 2 | 3 | 4 = 2
): Promise<any> => {
  if (!FIGMA_API_KEY) {
    throw new Error('Figma API key is missing or invalid. Please check your environment variables and ensure you have set a valid REACT_APP_FIGMA_ACCESS_TOKEN in your .env.local file.');
  }

  try {
    // Validate inputs
    if (!fileKey || fileKey.trim() === '') {
      throw new Error('Figma file key is required but was empty or invalid.');
    }
    
    if (!nodeIds || nodeIds.length === 0) {
      throw new Error('At least one node ID is required to fetch images.');
    }
    
    console.log(`Fetching Figma images for file: ${fileKey}, nodes: ${nodeIds.join(', ')}, format: ${format}, scale: ${scale}`);
    
    const idsParam = nodeIds.join(',');
    // Add use_absolute_bounds=true to ensure we capture all content, even if it extends beyond frame boundaries
    const url = `${FIGMA_API_URL}/images/${fileKey}?ids=${idsParam}&format=${format}&scale=${scale}&use_absolute_bounds=true`;
    
    console.log(`Making request to Figma API: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Figma-Token': FIGMA_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Figma API error (${response.status}): ${errorText}`);
      
      // Provide more helpful error messages based on status code
      if (response.status === 404) {
        throw new Error(`Figma file or nodes not found. Please check if the file key "${fileKey}" and node IDs are correct.`);
      } else if (response.status === 403) {
        throw new Error('Access denied. Make sure your Figma access token is valid and you have permission to access this file.');
      } else if (response.status === 401) {
        throw new Error('Unauthorized. Your Figma access token may be invalid or expired.');
      } else {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}. ${errorText}`);
      }
    }

    const data = await response.json();
    
    // Check for API-level errors
    if (data.err) {
      console.error(`Figma API returned an error: ${data.err}`);
      throw new Error(`Figma API error: ${data.err}`);
    }
    
    // Validate that we got images back
    if (!data.images || Object.keys(data.images).length === 0) {
      console.error('Figma API returned no images', data);
      throw new Error('No images were returned from the Figma API. The nodes may not be valid or may not contain renderable content.');
    }
    
    // Check if any of the requested node IDs are missing from the response
    const missingNodeIds = nodeIds.filter(id => !data.images[id]);
    if (missingNodeIds.length > 0) {
      console.warn(`Some node IDs did not return images: ${missingNodeIds.join(', ')}`);
      
      if (missingNodeIds.length === nodeIds.length) {
        throw new Error('Could not retrieve any images from Figma API. The frames might not contain any visible content or might be empty.');
      }
    }
    
    console.log('Successfully fetched Figma images');
    return data;
  } catch (error) {
    console.error('Error fetching Figma images:', error);
    
    // Rethrow with a more user-friendly message
    if (error instanceof Error) {
      throw error; // Already a well-formatted error
    } else {
      throw new Error(`Failed to fetch Figma images: ${String(error)}`);
    }
  }
};

/**
 * Process Figma file data to extract node information
 * @param fileData Figma file data from API
 * @returns Processed node information
 */
export const processFigmaData = (fileData: any): any => {
  console.log('Processing Figma file data...');
  
  // Log the structure of the fileData to help debug
  console.log('fileData keys:', Object.keys(fileData));
  console.log('fileData.document exists:', !!fileData.document);
  console.log('fileData.nodes exists:', !!fileData.nodes);
  
  if (fileData.nodes) {
    console.log('fileData.nodes keys:', Object.keys(fileData.nodes));
    console.log('First node key:', Object.keys(fileData.nodes)[0]);
  }
  
  // Extract document from file data
  const document = fileData.document || 
    (fileData.nodes && Object.values(fileData.nodes)[0] && 
     Object.values(fileData.nodes)[0] as any)?.document;
  
  if (!document) {
    console.error('No document found in fileData:', fileData);
    throw new Error('No document found in Figma file data');
  }
  
  console.log('Document structure:', {
    id: document.id,
    name: document.name,
    type: document.type,
    hasChildren: !!document.children,
    childrenType: document.children ? (Array.isArray(document.children) ? 'array' : typeof document.children) : 'none',
    childrenCount: document.children ? (Array.isArray(document.children) ? document.children.length : 'not an array') : 0
  });
  
  // Process the document to extract relevant information
  try {
    return {
      document,
      components: extractComponents(document),
      styles: fileData.styles || {},
      // Add detailed component structure
      detailedComponents: extractDetailedComponents(document)
    };
  } catch (error) {
    console.error('Error processing Figma data:', error);
    // Return a minimal structure to avoid breaking the application
    return {
      document,
      components: [],
      styles: fileData.styles || {},
      detailedComponents: []
    };
  }
};

/**
 * Extract components from Figma document
 * @param document Figma document
 * @returns Array of components
 */
const extractComponents = (node: any): any[] => {
  const components: any[] = [];
  
  // Function to recursively traverse the document and find components
  const traverse = (node: any) => {
    // Skip if node is null or undefined
    if (!node) return;
    
    // Check if the node is a component
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      components.push({
        id: node.id,
        name: node.name,
        type: node.type,
        x: node.absoluteBoundingBox?.x,
        y: node.absoluteBoundingBox?.y,
        width: node.absoluteBoundingBox?.width,
        height: node.absoluteBoundingBox?.height
      });
    }
    
    // Recursively traverse children
    if (node.children) {
      // Check if children is an array before using forEach
      if (Array.isArray(node.children)) {
        node.children.forEach((child: any) => traverse(child));
      } else {
        console.warn(`Node children is not an array for node: ${node.id || 'unknown'}, type: ${node.type || 'unknown'}`);
        // Try to handle the case where children might be an object with numeric keys
        if (typeof node.children === 'object') {
          try {
            Object.values(node.children).forEach((child: any) => traverse(child));
          } catch (error) {
            console.error('Failed to process node children as object:', error);
          }
        }
      }
    }
  };
  
  // Start traversal from the document
  traverse(node);
  
  return components;
};

/**
 * Extract detailed component information from Figma document
 * This function extracts more detailed information about components including
 * their hierarchy, styles, and properties
 * 
 * @param document Figma document
 * @returns Detailed component structure
 */
export const extractDetailedComponents = (document: any): any[] => {
  const components: any[] = [];
  
  // Function to recursively traverse the document and extract component details
  const traverse = (node: any, parentId: string | null = null, depth: number = 0) => {
    // Skip if node is null or undefined
    if (!node) return;
    
    // Create a base component object with common properties
    const component: any = {
      id: node.id,
      name: node.name,
      type: node.type,
      parentId,
      depth,
      children: [],
      visible: node.visible !== false, // Default to true if not specified
    };
    
    // Add bounding box information if available
    if (node.absoluteBoundingBox) {
      component.boundingBox = {
        x: node.absoluteBoundingBox.x,
        y: node.absoluteBoundingBox.y,
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height
      };
    }
    
    // Add style information
    if (node.fills) component.fills = node.fills;
    if (node.strokes) component.strokes = node.strokes;
    if (node.strokeWeight) component.strokeWeight = node.strokeWeight;
    if (node.strokeAlign) component.strokeAlign = node.strokeAlign;
    if (node.cornerRadius) component.cornerRadius = node.cornerRadius;
    if (node.rectangleCornerRadii) component.rectangleCornerRadii = node.rectangleCornerRadii;
    if (node.opacity) component.opacity = node.opacity;
    if (node.blendMode) component.blendMode = node.blendMode;
    
    // Add text-specific properties
    if (node.type === 'TEXT') {
      component.characters = node.characters;
      component.style = node.style;
      component.characterStyleOverrides = node.characterStyleOverrides;
      component.styleOverrideTable = node.styleOverrideTable;
    }
    
    // Add component-specific properties
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      component.componentId = node.componentId;
    }
    
    // Add frame-specific properties
    if (node.type === 'FRAME' || node.type === 'GROUP') {
      component.layoutMode = node.layoutMode;
      component.primaryAxisSizingMode = node.primaryAxisSizingMode;
      component.counterAxisSizingMode = node.counterAxisSizingMode;
      component.primaryAxisAlignItems = node.primaryAxisAlignItems;
      component.counterAxisAlignItems = node.counterAxisAlignItems;
      component.paddingLeft = node.paddingLeft;
      component.paddingRight = node.paddingRight;
      component.paddingTop = node.paddingTop;
      component.paddingBottom = node.paddingBottom;
      component.itemSpacing = node.itemSpacing;
    }
    
    // Add the component to our list
    components.push(component);
    
    // Recursively process children
    if (node.children) {
      // Check if children is an array before using forEach
      if (Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          traverse(child, node.id, depth + 1);
        });
      } else {
        console.warn(`Node children is not an array for node: ${node.id || 'unknown'}, type: ${node.type || 'unknown'}`);
        // Try to handle the case where children might be an object with numeric keys
        if (typeof node.children === 'object') {
          try {
            Object.values(node.children).forEach((child: any) => {
              traverse(child, node.id, depth + 1);
            });
          } catch (error) {
            console.error('Failed to process node children as object:', error);
          }
        }
      }
    }
  };
  
  // Start traversal from the document
  traverse(document);
  
  // Build parent-child relationships
  const componentsMap = new Map();
  components.forEach(component => {
    componentsMap.set(component.id, component);
  });
  
  // Add children to their parents
  components.forEach(component => {
    if (component.parentId && componentsMap.has(component.parentId)) {
      const parent = componentsMap.get(component.parentId);
      parent.children.push(component.id);
    }
  });
  
  return components;
};

/**
 * Convert Figma components to Coterate DetectedComponent format
 * @param components Array of detailed Figma components
 * @returns Array of DetectedComponent objects
 */
export const convertToDetectedComponents = (components: any[]): any[] => {
  return components
    .filter(component => {
      // Filter out components without bounding boxes or those that are invisible
      return component.boundingBox && component.visible !== false;
    })
    .map((component, index) => {
      // Extract background color from fills if available
      let backgroundColor = '#ffffff';
      let opacity = 1;
      
      if (component.fills && component.fills.length > 0) {
        const solidFill = component.fills.find((fill: any) => fill.type === 'SOLID' && fill.visible !== false);
        if (solidFill) {
          const { r, g, b, a } = solidFill.color;
          backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
          opacity = solidFill.opacity !== undefined ? solidFill.opacity : 1;
        }
      }
      
      // Extract text color and font size for text components
      let textColor = '#000000';
      let fontSize = 14;
      
      if (component.type === 'TEXT' && component.style) {
        if (component.style.fills && component.style.fills.length > 0) {
          const textFill = component.style.fills.find((fill: any) => fill.type === 'SOLID');
          if (textFill) {
            const { r, g, b, a } = textFill.color;
            textColor = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
          }
        }
        
        fontSize = component.style.fontSize || 14;
      }
      
      // Determine component type based on Figma type and properties
      let componentType = 'unknown';
      
      switch (component.type) {
        case 'RECTANGLE':
          componentType = 'container';
          break;
        case 'TEXT':
          componentType = 'text';
          break;
        case 'FRAME':
          componentType = 'frame';
          break;
        case 'GROUP':
          componentType = 'group';
          break;
        case 'COMPONENT':
        case 'INSTANCE':
          // Try to determine more specific component types based on name
          const name = component.name.toLowerCase();
          if (name.includes('button')) {
            componentType = 'button';
          } else if (name.includes('input') || name.includes('field') || name.includes('text field')) {
            componentType = 'input';
          } else if (name.includes('card')) {
            componentType = 'card';
          } else if (name.includes('icon')) {
            componentType = 'icon';
          } else if (name.includes('image') || name.includes('img')) {
            componentType = 'image';
          } else if (name.includes('nav') || name.includes('menu')) {
            componentType = 'navigation';
          } else if (name.includes('header')) {
            componentType = 'header';
          } else if (name.includes('footer')) {
            componentType = 'footer';
          } else {
            componentType = 'component';
          }
          break;
        default:
          componentType = 'unknown';
      }
      
      // Calculate border radius
      let borderRadius = 0;
      if (component.cornerRadius !== undefined) {
        borderRadius = component.cornerRadius;
      } else if (component.rectangleCornerRadii && component.rectangleCornerRadii.length === 4) {
        // Use the average of the four corners
        borderRadius = component.rectangleCornerRadii.reduce((sum: number, radius: number) => sum + radius, 0) / 4;
      }
      
      // Extract padding
      let padding = '';
      if (component.paddingTop !== undefined || component.paddingRight !== undefined || 
          component.paddingBottom !== undefined || component.paddingLeft !== undefined) {
        const top = component.paddingTop || 0;
        const right = component.paddingRight || 0;
        const bottom = component.paddingBottom || 0;
        const left = component.paddingLeft || 0;
        
        padding = `${top}px ${right}px ${bottom}px ${left}px`;
      }
      
      // Create the DetectedComponent object
      return {
        id: component.id || `component-${index}`,
        type: componentType,
        confidence: 0.95, // High confidence since it's from Figma
        boundingBox: {
          x: component.boundingBox.x,
          y: component.boundingBox.y,
          width: component.boundingBox.width,
          height: component.boundingBox.height
        },
        attributes: {
          backgroundColor,
          textColor,
          borderRadius,
          fontSize,
          padding: padding || '0px',
          text: component.type === 'TEXT' ? component.characters || '' : '',
          state: 'default',
          opacity,
          name: component.name,
          figmaType: component.type,
          figmaId: component.id,
          parentId: component.parentId,
          children: component.children
        }
      };
    });
};

/**
 * Figma service object
 */
export const figmaService = {
  validateFigmaUrl,
  extractFigmaInfo,
  getFigmaFileData,
  getFigmaImages,
  processFigmaData,
  extractDetailedComponents,
  convertToDetectedComponents
};

export default figmaService; 