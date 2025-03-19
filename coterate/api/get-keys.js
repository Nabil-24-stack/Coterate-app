// Serverless function to safely expose specific API keys to the client
module.exports = async (req, res) => {
  // Set more explicit CORS headers to ensure proper handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');
  
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
    // Direct access to environment variables
    const openaiKey = process.env.OPENAI_API_KEY;
    
    console.log('API Key Request - Checking environment variables');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('REACT_APP_OPENAI_API_KEY exists:', !!process.env.REACT_APP_OPENAI_API_KEY);
    
    // Log all available env vars for debugging (excluding sensitive data)
    const availableEnvKeys = Object.keys(process.env)
      .filter(key => !key.includes('NODE_') && 
               !key.includes('npm_') && 
               !key.includes('PATH') && 
               !key.includes('HOME'));
    
    console.log('Available env keys:', availableEnvKeys);
    
    if (!openaiKey) {
      console.warn('OpenAI API key not found in environment variables');
      
      // Create a JSON response for missing key
      const responseObj = {
        error: 'API Key Not Found',
        message: 'OpenAI API key is not configured in the server environment',
        availableEnvKeys
      };
      
      console.log('Sending response for missing key:', JSON.stringify(responseObj));
      return res.status(404).json(responseObj);
    }
    
    // Clean up the API key by removing any quotes, spaces, or line breaks
    const cleanedOpenaiKey = openaiKey.toString()
      .replace(/["']/g, '') // Remove quotes
      .replace(/\s+/g, '')  // Remove whitespace including line breaks
      .trim();              // Trim any remaining whitespace
    
    console.log('OpenAI key format check:');
    console.log('- Length:', cleanedOpenaiKey.length);
    console.log('- Starts with sk-:', cleanedOpenaiKey.startsWith('sk-'));
    
    // Return the API key
    const responseObj = {
      openaiKey: cleanedOpenaiKey,
      message: 'API key retrieved successfully from Vercel environment variables'
    };
    
    console.log('Sending successful response with API key');
    return res.status(200).json(responseObj);
  } catch (error) {
    console.error('Error retrieving API keys:', error);
    
    // Create a JSON response for errors
    const responseObj = {
      error: 'Internal Server Error',
      message: error.message || 'Unknown error occurred while retrieving API keys'
    };
    
    console.log('Sending error response:', JSON.stringify(responseObj));
    return res.status(500).json(responseObj);
  }
}; 