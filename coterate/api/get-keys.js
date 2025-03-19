// Serverless function to safely expose specific API keys to the client
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported for this endpoint'
    });
  }

  try {
    // Get OpenAI API key from environment variables
    const openaiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
    
    // Log available environment variables for debugging (exclude sensitive ones)
    const availableEnvKeys = Object.keys(process.env)
      .filter(key => !key.includes('NODE_') && 
               !key.includes('npm_') && 
               !key.includes('PATH') && 
               !key.includes('HOME'));
    
    console.log('Available environment variables:', availableEnvKeys);
    
    if (!openaiKey) {
      console.warn('OpenAI API key not found in environment variables');
      return res.status(404).json({
        error: 'API Key Not Found',
        message: 'OpenAI API key is not configured in the server environment',
        availableEnvKeys
      });
    }
    
    // Clean up the API key by removing any quotes, spaces, or line breaks
    const cleanedOpenaiKey = openaiKey.toString()
      .replace(/["']/g, '') // Remove quotes
      .replace(/\s+/g, '')  // Remove whitespace including line breaks
      .trim();              // Trim any remaining whitespace
    
    // Return the API keys
    return res.status(200).json({
      openaiKey: cleanedOpenaiKey,
      message: 'API keys retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving API keys:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Unknown error occurred while retrieving API keys'
    });
  }
}; 