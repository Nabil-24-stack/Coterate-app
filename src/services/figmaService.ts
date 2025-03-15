// Import environment variables for Figma API
const rawFigmaApiKey = process.env.REACT_APP_FIGMA_ACCESS_TOKEN;

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
 * Get Figma file data
 * @param fileKey Figma file key
 * @param nodeId Optional node ID
 * @returns Promise resolving to Figma file data
 */
export const getFigmaFileData = async (
  fileKey: string,
  nodeId?: string
): Promise<any> => {
  console.log('Getting Figma file data for:', { fileKey, nodeId });
  
  if (!fileKey) {
    console.error('No file key provided to getFigmaFileData');
    throw new Error('No file key provided');
  }
  
  const token = cleanFigmaApiToken();
  
  if (!token) {
    console.error('No valid Figma API token available');
    throw new Error('No valid Figma API token available');
  }
  
  try {
    // Construct the API URL
    let url = `https://api.figma.com/v1/files/${fileKey}`;
    
    // Add node ID if provided
    if (nodeId) {
      url += `?ids=${nodeId}`;
    }
    
    console.log('Fetching from Figma API URL:', url);
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Figma-Token': token,
      },
    });
    
    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Figma API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    console.log('Figma API response received successfully');
    
    return data;
  } catch (error) {
    console.error('Error fetching Figma file data:', error);
    throw error;
  }
};

/**
 * Clean and validate the Figma API token
 * @returns Cleaned Figma API token
 */
export const cleanFigmaApiToken = (): string => {
  if (!rawFigmaApiKey) {
    console.error('Figma API token is missing. Please check your environment variables.');
    return '';
  }
  
  console.log('Raw Figma API token:', rawFigmaApiKey);
  console.log('Raw token type:', typeof rawFigmaApiKey);
  console.log('Raw token length:', rawFigmaApiKey.length);
  console.log('Raw token last char code:', rawFigmaApiKey.charCodeAt(rawFigmaApiKey.length - 1));
  
  // Clean up the token by removing any quotes, spaces, line breaks, or trailing % characters
  const cleanedToken = rawFigmaApiKey
    .toString()
    .replace(/["']/g, '') // Remove quotes
    .replace(/\s+/g, '')  // Remove whitespace including line breaks
    .replace(/%$/, '')    // Remove trailing % character if present
    .trim();              // Trim any remaining whitespace
  
  console.log('Cleaned Figma API token length:', cleanedToken.length);
  console.log('Cleaned Figma API token prefix:', cleanedToken.substring(0, 5) + '...');
  console.log('Cleaned token last char code:', cleanedToken.charCodeAt(cleanedToken.length - 1));
  
  if (cleanedToken === 'your-figma-access-token-here' || 
      cleanedToken === 'your_figma_access_token_here' ||
      cleanedToken.length < 10) {
    console.error('Invalid Figma API token. Please set a valid token in your .env.local file.');
    return '';
  }
  
  return cleanedToken;
};

/**
 * Get Figma images for specified nodes
 * @param fileKey Figma file key
 * @param nodeIds Array of node IDs
 * @returns Promise resolving to Figma images data
 */
export const getFigmaImages = async (
  fileKey: string,
  nodeIds: string[]
): Promise<any> => {
  console.log('Getting Figma images for:', { fileKey, nodeIds });
  
  if (!fileKey) {
    console.error('No file key provided to getFigmaImages');
    throw new Error('No file key provided');
  }
  
  if (!nodeIds || nodeIds.length === 0) {
    console.error('No node IDs provided to getFigmaImages');
    throw new Error('No node IDs provided');
  }
  
  const token = cleanFigmaApiToken();
  
  if (!token) {
    console.error('No valid Figma API token available');
    throw new Error('No valid Figma API token available');
  }
  
  try {
    // Construct the API URL with node IDs
    const nodeIdsParam = nodeIds.join(',');
    const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIdsParam}&format=png&scale=2`;
    
    console.log('Fetching images from Figma API URL:', url);
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Figma-Token': token,
      },
    });
    
    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Figma API error when fetching images:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    console.log('Figma images API response received successfully');
    
    return data;
  } catch (error) {
    console.error('Error fetching Figma images:', error);
    throw error;
  }
}; 