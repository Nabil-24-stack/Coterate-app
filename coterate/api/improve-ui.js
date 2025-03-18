// Improved serverless function for UI improvement with better error handling
module.exports = (req, res) => {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Log request details for debugging
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers));
  
  // Ensure we properly handle all HTTP methods
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Only POST requests are supported.' 
    });
  }
  
  try {
    // Get the image data from the request
    const { imageBase64, customPrompt } = req.body || {};
    
    if (!imageBase64) {
      return res.status(400).json({ 
        error: 'Missing required parameter: imageBase64' 
      });
    }
    
    // In a production environment, we would process the image here
    // For now, return a mock response to ensure the client can continue
    const mockAnalysis = `
# UI Design Analysis
- Improved visual hierarchy
- Enhanced color contrast
- Better typography hierarchy
- More consistent spacing
    `;
    
    // Return success response with the original image and mock analysis
    return res.status(200).json({
      image: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`,
      analysis: mockAnalysis
    });
    
  } catch (error) {
    console.error('Error in improve-ui endpoint:', error);
    
    // Return a graceful error that the client can handle
    return res.status(500).json({
      error: 'An error occurred while processing the image',
      message: error.message
    });
  }
} 