// Serverless function for Supabase operations
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || 'https://ppzmwdcpllzcaefxfpll.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwem13ZGNwbGx6Y2FlZnhmcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NjYzNzksImV4cCI6MjA1NzI0MjM3OX0.GgbPHs285VOnIAbfSDQSvAq-vJs9rheamn5HLdvmRxQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert snake_case to camelCase
const snakeToCamel = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {});
};

// Helper function to convert camelCase to snake_case
const camelToSnake = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {});
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('Supabase API request received:', req.body);
    const { operation, table, data, id, userId } = req.body;
    
    if (!operation || !table) {
      return res.status(400).json({ error: 'Operation and table are required' });
    }
    
    // Perform the requested operation
    switch (operation) {
      case 'getItems':
        let query = supabase.from(table).select('*');
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data: items, error: itemsError } = await query;
        
        if (itemsError) {
          console.error('Supabase getItems error:', itemsError);
          return res.status(400).json({ error: itemsError.message });
        }
        
        return res.status(200).json({ data: snakeToCamel(items) });
        
      case 'getItem':
        if (!id) {
          return res.status(400).json({ error: 'Item ID is required' });
        }
        
        const { data: item, error: itemError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (itemError) {
          console.error('Supabase getItem error:', itemError);
          return res.status(400).json({ error: itemError.message });
        }
        
        return res.status(200).json({ data: snakeToCamel(item) });
        
      case 'createItem':
        if (!data) {
          return res.status(400).json({ error: 'Item data is required' });
        }
        
        const snakeCaseData = camelToSnake(data);
        console.log('Creating item with data:', snakeCaseData);
        
        const { data: createdItem, error: createError } = await supabase
          .from(table)
          .insert(snakeCaseData)
          .select();
        
        if (createError) {
          console.error('Supabase createItem error:', createError);
          return res.status(400).json({ error: createError.message });
        }
        
        return res.status(200).json({ data: snakeToCamel(createdItem) });
        
      case 'updateItem':
        if (!id) {
          return res.status(400).json({ error: 'Item ID is required' });
        }
        
        if (!data) {
          return res.status(400).json({ error: 'Update data is required' });
        }
        
        const snakeCaseUpdates = camelToSnake(data);
        
        const { data: updatedItem, error: updateError } = await supabase
          .from(table)
          .update(snakeCaseUpdates)
          .eq('id', id)
          .select();
        
        if (updateError) {
          console.error('Supabase updateItem error:', updateError);
          return res.status(400).json({ error: updateError.message });
        }
        
        return res.status(200).json({ data: snakeToCamel(updatedItem) });
        
      case 'deleteItem':
        if (!id) {
          return res.status(400).json({ error: 'Item ID is required' });
        }
        
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        
        if (deleteError) {
          console.error('Supabase deleteItem error:', deleteError);
          return res.status(400).json({ error: deleteError.message });
        }
        
        return res.status(200).json({ success: true });
        
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    console.error('Error in Supabase API:', error);
    return res.status(500).json({ error: error.message || 'An error occurred' });
  }
} 