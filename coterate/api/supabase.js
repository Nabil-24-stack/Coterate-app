// Enhanced serverless function for Supabase operations
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Ensure we only allow POST requests for actual operations
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST requests are supported for this endpoint'
    });
  }
  
  // Log request details for debugging
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers));
  
  try {
    // Extract operation and other parameters from request body
    const { operation, table, data, id, userId } = req.body || {};
    
    // Validate required parameters
    if (!operation) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameter: operation'
      });
    }
    
    if (!table) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required parameter: table'
      });
    }
    
    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://ppzmwdcpllzcaefxfpll.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwem13ZGNwbGx6Y2FlZnhmcGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NjYzNzksImV4cCI6MjA1NzI0MjM3OX0.GgbPHs285VOnIAbfSDQSvAq-vJs9rheamn5HLdvmRxQ';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Execute operation
    switch (operation) {
      case 'getItems': {
        let query = supabase.from(table).select('*');
        
        if (userId) {
          query = query.eq('user_id', userId);
        }
        
        const { data: items, error } = await query;
        
        if (error) {
          console.error(`Error in getItems (${table}):`, error);
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ data: items });
      }
      
      case 'getItem': {
        if (!id) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameter: id'
          });
        }
        
        const { data: item, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error(`Error in getItem (${table}, id=${id}):`, error);
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ data: item });
      }
      
      case 'createItem': {
        if (!data) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameter: data'
          });
        }
        
        const { data: createdItem, error } = await supabase
          .from(table)
          .insert(data)
          .select();
        
        if (error) {
          console.error(`Error in createItem (${table}):`, error);
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ data: createdItem });
      }
      
      case 'updateItem': {
        if (!id) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameter: id'
          });
        }
        
        if (!data) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameter: data'
          });
        }
        
        const { data: updatedItem, error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select();
        
        if (error) {
          console.error(`Error in updateItem (${table}, id=${id}):`, error);
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ data: updatedItem });
      }
      
      case 'deleteItem': {
        if (!id) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required parameter: id'
          });
        }
        
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error(`Error in deleteItem (${table}, id=${id}):`, error);
          return res.status(500).json({ error: error.message });
        }
        
        return res.status(200).json({ success: true });
      }
      
      default:
        return res.status(400).json({
          error: 'Bad Request',
          message: `Invalid operation: ${operation}`
        });
    }
  } catch (error) {
    console.error('Error in Supabase API:', error);
    
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
} 