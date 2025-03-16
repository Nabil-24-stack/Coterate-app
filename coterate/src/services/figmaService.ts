import axios from 'axios';

/**
 * Figma API Service
 * This service handles interactions with the Figma API
 */

/**
 * Get user information from Figma API
 * @param accessToken Figma access token
 * @returns User information
 */
export const getFigmaUser = async (accessToken: string) => {
  try {
    const response = await axios.get('https://api.figma.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma user:', error);
    throw error;
  }
};

/**
 * Get a list of files from Figma API
 * @param accessToken Figma access token
 * @returns List of files
 */
export const getFigmaFiles = async (accessToken: string) => {
  try {
    const response = await axios.get('https://api.figma.com/v1/me/files', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma files:', error);
    throw error;
  }
};

/**
 * Get file data from Figma API
 * @param accessToken Figma access token
 * @param fileKey Figma file key
 * @returns File data
 */
export const getFigmaFile = async (accessToken: string, fileKey: string) => {
  try {
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma file:', error);
    throw error;
  }
};

/**
 * Get image URLs for nodes in a Figma file
 * @param accessToken Figma access token
 * @param fileKey Figma file key
 * @param nodeIds Array of node IDs
 * @param format Image format (jpg, png, svg, pdf)
 * @returns Object with image URLs
 */
export const getFigmaImages = async (
  accessToken: string, 
  fileKey: string, 
  nodeIds: string[], 
  format: 'jpg' | 'png' | 'svg' | 'pdf' = 'png'
) => {
  try {
    const response = await axios.get(
      `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds.join(',')}&format=${format}`, 
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching Figma images:', error);
    throw error;
  }
};

/**
 * Get the access token from Supabase session
 * @returns Figma access token or null if not available
 */
export const getFigmaAccessToken = (): string | null => {
  try {
    // Get the Supabase session from localStorage
    const supabaseSession = localStorage.getItem('supabase.auth.token');
    
    if (!supabaseSession) {
      return null;
    }
    
    // Parse the session
    const session = JSON.parse(supabaseSession);
    
    // Get the provider token from the session
    const providerToken = session?.currentSession?.provider_token;
    
    return providerToken || null;
  } catch (error) {
    console.error('Error getting Figma access token:', error);
    return null;
  }
}; 