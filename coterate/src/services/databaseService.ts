import { supabase } from './supabaseService';
import { Page, DetectedComponent } from '../types';

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

// Pages
export const getPages = async (userId: string) => {
  console.log('Getting pages for user:', userId);
  
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    console.log('Supabase getPages response:', { data, error });
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in getPages Supabase call:', err);
    return { data: null, error: err };
  }
};

export const getPage = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in getPage Supabase call:', err);
    return { data: null, error: err };
  }
};

export const createPage = async (page: Omit<Page, 'id'>) => {
  console.log('createPage called with:', page);
  
  try {
    // Convert camelCase to snake_case
    const snakeCasePage = camelToSnake(page);
    console.log('Converted to snake_case:', snakeCasePage);
    
    const { data, error } = await supabase
      .from('pages')
      .insert(snakeCasePage)
      .select();
    
    console.log('Supabase createPage response:', { data, error });
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in createPage Supabase call:', err);
    return { data: null, error: err };
  }
};

export const updatePage = async (id: string, updates: Partial<Page>) => {
  try {
    // Convert camelCase to snake_case
    const snakeCaseUpdates = camelToSnake(updates);
    
    const { data, error } = await supabase
      .from('pages')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select();
    
    // Convert snake_case to camelCase
    const transformedData = data ? snakeToCamel(data) : null;
    
    return { data: transformedData, error };
  } catch (err) {
    console.error('Error in updatePage Supabase call:', err);
    return { data: null, error: err };
  }
};

export const deletePage = async (id: string) => {
  try {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', id);
    
    return { error };
  } catch (err) {
    console.error('Error in deletePage Supabase call:', err);
    return { error: err };
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