// Simplified serverless function for Supabase operations
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log request details for debugging
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  // Extract operation from request body
  const operation = req.body?.operation;
  
  // Return mock responses based on the operation
  switch (operation) {
    case 'getItems':
      return res.status(200).json({
        data: [
          { id: '1', title: 'Sample Page 1', userId: req.body?.userId || 'user123' },
          { id: '2', title: 'Sample Page 2', userId: req.body?.userId || 'user123' }
        ]
      });
      
    case 'getItem':
      return res.status(200).json({
        data: { id: req.body?.id || '1', title: 'Sample Page', userId: 'user123' }
      });
      
    case 'createItem':
      return res.status(200).json({
        data: [{ id: 'new-id', ...req.body?.data, createdAt: new Date().toISOString() }]
      });
      
    case 'updateItem':
      return res.status(200).json({
        data: [{ id: req.body?.id || '1', ...req.body?.data, updatedAt: new Date().toISOString() }]
      });
      
    case 'deleteItem':
      return res.status(200).json({ success: true });
      
    default:
      // If no operation specified, return a generic response
      return res.status(200).json({
        message: 'Supabase API endpoint is working',
        timestamp: new Date().toISOString()
      });
  }
} 