// Simple test endpoint that doesn't require any API keys
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return a simple response
  return res.status(200).json({
    message: 'Test endpoint is working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
} 