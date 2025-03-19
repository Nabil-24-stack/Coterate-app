import { supabase } from './supabaseService';
import { Page, DetectedComponent } from '../types';
import axios from 'axios';

// Helper function to convert snake_case to camelCase for database responses
const snakeToCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {} as any);
};

// Helper function to convert camelCase to snake_case for database requests
const camelToSnake = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {} as any);
};

// Function to call our serverless API
const callSupabaseApi = async (operation: string, table: string, data?: any, id?: string, userId?: string) => {
  try {
    // Use direct Supabase client calls instead of relying on serverless function
    // This avoids the 405 Method Not Allowed errors when the API route isn't properly configured
    console.log(`Using direct Supabase client for operation: ${operation} on table: ${table}`);
    
    switch (operation) {
      case 'getItems':
        let query = supabase.from(table).select('*');
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data: items, error: itemsError } = await query;
        
        if (itemsError) {
          throw itemsError;
        }
        
        return { data: snakeToCamel(items) };
        
      case 'getItem':
        const { data: item, error: itemError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (itemError) {
          throw itemError;
        }
        
        return { data: snakeToCamel(item) };
        
      case 'createItem':
        const snakeCaseData = camelToSnake(data);
        
        const { data: createdItem, error: createError } = await supabase
          .from(table)
          .insert(snakeCaseData)
          .select();
        
        if (createError) {
          throw createError;
        }
        
        return { data: snakeToCamel(createdItem) };
        
      case 'updateItem':
        const snakeCaseUpdates = camelToSnake(data);
        
        const { data: updatedItem, error: updateError } = await supabase
          .from(table)
          .update(snakeCaseUpdates)
          .eq('id', id)
          .select();
        
        if (updateError) {
          throw updateError;
        }
        
        return { data: snakeToCamel(updatedItem) };
        
      case 'deleteItem':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        
        if (deleteError) {
          throw deleteError;
        }
        
        return { success: true };
        
      default:
        throw new Error(`Invalid operation: ${operation}`);
    }
    
  } catch (error) {
    console.error(`Error in Supabase operation (${operation}):`, error);
    throw error;
  }
};

// Pages
export const getPages = async (): Promise<Page[]> => {
  try {
    const { data } = await callSupabaseApi('getItems', 'pages');
    return data || [];
  } catch (err) {
    console.error('Error getting pages:', err);
    return [];
  }
};

export const getPage = async (id: string): Promise<Page | null> => {
  try {
    const { data } = await callSupabaseApi('getItem', 'pages', null, id);
    return data || null;
  } catch (err) {
    console.error('Error getting page:', err);
    return null;
  }
};

export const createPage = async (page: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Promise<Page | null> => {
  try {
    const { data } = await callSupabaseApi('createItem', 'pages', page);
    return data ? data[0] : null;
  } catch (err) {
    console.error('Error creating page:', err);
    return null;
  }
};

export const updatePage = async (id: string, updates: Partial<Page>): Promise<Page | null> => {
  try {
    const { data } = await callSupabaseApi('updateItem', 'pages', updates, id);
    return data ? data[0] : null;
  } catch (err) {
    console.error('Error updating page:', err);
    return null;
  }
};

export const deletePage = async (id: string): Promise<boolean> => {
  try {
    await callSupabaseApi('deleteItem', 'pages', null, id);
    return true;
  } catch (err) {
    console.error('Error deleting page:', err);
    return false;
  }
};

// Components
export const getComponents = async (pageId: string) => {
  try {
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .eq('page_id', pageId)
      .order('z_index', { ascending: true });
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in getComponents Supabase call:', err);
    return { data: null, error: err };
  }
};

export const createComponent = async (component: Omit<DetectedComponent, 'id'>) => {
  try {
    // Convert camelCase to snake_case
    const snakeCaseComponent = camelToSnake(component);
    
    const { data, error } = await supabase
      .from('components')
      .insert(snakeCaseComponent)
      .select();
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in createComponent Supabase call:', err);
    return { data: null, error: err };
  }
};

export const updateComponent = async (id: string, updates: Partial<DetectedComponent>) => {
  try {
    // Convert camelCase to snake_case
    const snakeCaseUpdates = camelToSnake(updates);
    
    const { data, error } = await supabase
      .from('components')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select();
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in updateComponent Supabase call:', err);
    return { data: null, error: err };
  }
};

export const deleteComponent = async (id: string) => {
  try {
    const { error } = await supabase
      .from('components')
      .delete()
      .eq('id', id);
    
    return { error };
  } catch (err) {
    console.error('Error in deleteComponent Supabase call:', err);
    return { error: err };
  }
};

// Bulk operations
export const createComponentsBulk = async (components: Omit<DetectedComponent, 'id'>[]) => {
  try {
    // Convert camelCase to snake_case
    const snakeCaseComponents = camelToSnake(components);
    
    const { data, error } = await supabase
      .from('components')
      .insert(snakeCaseComponents)
      .select();
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in createComponentsBulk Supabase call:', err);
    return { data: null, error: err };
  }
};

export const updateComponentsBulk = async (components: { id: string, updates: Partial<DetectedComponent> }[]) => {
  // Supabase doesn't support bulk updates directly, so we need to use transactions
  // This is a simple implementation that performs updates sequentially
  const results = [];
  
  try {
    for (const { id, updates } of components) {
      // Convert camelCase to snake_case
      const snakeCaseUpdates = camelToSnake(updates);
      
      const { data, error } = await supabase
        .from('components')
        .update(snakeCaseUpdates)
        .eq('id', id)
        .select();
      
      // Convert snake_case to camelCase
      const transformedData = data ? snakeToCamel(data) : null;
      
      results.push({ data: transformedData, error });
    }
    
    return results;
  } catch (err) {
    console.error('Error in updateComponentsBulk Supabase call:', err);
    return [...results, { data: null, error: err }];
  }
};

// User settings
export const getUserSettings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in getUserSettings Supabase call:', err);
    return { data: null, error: err };
  }
};

export const updateUserSettings = async (userId: string, settings: any) => {
  try {
    // Convert camelCase to snake_case
    const snakeCaseSettings = camelToSnake(settings);
    
    const { data, error } = await supabase
      .from('user_settings')
      .update(snakeCaseSettings)
      .eq('user_id', userId)
      .select();
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in updateUserSettings Supabase call:', err);
    return { data: null, error: err };
  }
}; 