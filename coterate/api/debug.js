// Debugging endpoint to check environment variables and request handling
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get all environment variables (filtering out sensitive ones)
  const envVars = Object.keys(process.env)
    .filter(key => !key.includes('NODE_') && !key.includes('npm_'))
    .reduce((obj, key) => {
      // Mask API keys for security
      if (key.includes('KEY') || key.includes('TOKEN') || key.includes('SECRET')) {
        obj[key] = `${key.substring(0, 3)}...${key.substring(key.length - 3)}`;
      } else {
        obj[key] = process.env[key];
      }
      return obj;
    }, {});
  
  // Return debug information
  return res.status(200).json({
    message: 'Debug endpoint is working',
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    envVars: envVars,
    timestamp: new Date().toISOString()
  });
} 