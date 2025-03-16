import axios from 'axios';
import { supabase } from './supabaseService';

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
    console.log('Getting Figma user with token:', accessToken ? 'Token exists' : 'No token');
    const response = await axios.get('https://api.figma.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Figma user:', error.response?.data || error.message);
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
    console.log('Getting Figma files with token:', accessToken ? 'Token exists' : 'No token');
    const response = await axios.get('https://api.figma.com/v1/me/files', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Figma files:', error.response?.data || error.message);
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
    console.log(`Getting Figma file ${fileKey} with token:`, accessToken ? 'Token exists' : 'No token');
    const response = await axios.get(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Figma file:', error.response?.data || error.message);
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
    console.log(`Getting Figma images for file ${fileKey} with token:`, accessToken ? 'Token exists' : 'No token');
    const response = await axios.get(
      `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds.join(',')}&format=${format}`, 
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching Figma images:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get the access token from the current session
 * @returns Figma access token or null if not available
 */
export const getFigmaAccessToken = async (): Promise<string | null> => {
  try {
    // Get the current session from Supabase
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    // Check if we have a session and provider token
    if (data.session?.provider_token) {
      console.log('Found provider token in session');
      return data.session.provider_token;
    }
    
    // If we don't have a provider token but have a session, try to refresh it
    if (data.session) {
      console.log('No provider token found, trying to refresh session');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError);
        return null;
      }
      
      if (refreshData.session?.provider_token) {
        console.log('Found provider token after refresh');
        return refreshData.session.provider_token;
      }
    }
    
    console.log('No provider token found');
    return null;
  } catch (error) {
    console.error('Error getting Figma access token:', error);
    return null;
  }
}; 