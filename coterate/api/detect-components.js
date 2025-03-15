// Simplified serverless function for component detection
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
  
  // Return a mock response for testing
  return res.status(200).json({
    components: [
      {
        type: "Button",
        x: 20,
        y: 30,
        width: 15,
        height: 5,
        content: "Submit",
        style: {
          backgroundColor: "#3498db",
          textColor: "#ffffff",
          borderRadius: "4px",
          borderColor: "transparent"
        }
      },
      {
        type: "Input",
        x: 20,
        y: 20,
        width: 60,
        height: 5,
        content: "Email",
        style: {
          backgroundColor: "#ffffff",
          textColor: "#333333",
          borderRadius: "4px",
          borderColor: "#cccccc"
        }
      },
      {
        type: "Navbar",
        x: 0,
        y: 0,
        width: 100,
        height: 8,
        content: "Navigation",
        style: {
          backgroundColor: "#2c3e50",
          textColor: "#ffffff",
          borderRadius: "0px",
          borderColor: "transparent"
        }
      }
    ],
    image: req.body?.imageBase64 || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  });
} 