const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Read the token from .env.figma file
async function getToken() {
  try {
    const envFilePath = path.join(__dirname, '.env.figma');
    const content = await fs.readFile(envFilePath, 'utf8');
    const match = content.match(/REACT_APP_FIGMA_ACCESS_TOKEN=([^\s]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error reading token file:', error);
    return null;
  }
}

// Test the token with a simple Figma API request
async function testFigmaToken(token) {
  return new Promise((resolve, reject) => {
    // Use a test file key (this is just an example, it might not exist)
    const fileKey = 'S7wAI9AwZwEuJxbRtzm0cM';
    const url = `https://api.figma.com/v1/files/${fileKey}`;
    
    console.log('Testing Figma API with URL:', url);
    console.log('Using token:', token.substring(0, 5) + '...');
    
    const options = {
      method: 'GET',
      headers: {
        'X-Figma-Token': token
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response status code:', res.statusCode);
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          console.error('Error parsing JSON response:', error);
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error making request:', error);
      reject(error);
    });
    
    req.end();
  });
}

// Main function
async function main() {
  try {
    // Get the token
    const token = await getToken();
    
    if (!token) {
      console.error('No token found in .env.figma file');
      return;
    }
    
    console.log('Token found:', token.substring(0, 5) + '...');
    
    // Test the token
    const result = await testFigmaToken(token);
    
    console.log('API test result:');
    console.log('Status code:', result.status);
    
    if (result.status === 200) {
      console.log('Success! The token is valid.');
      console.log('Document name:', result.data.name);
    } else if (result.status === 403) {
      console.error('Error: The token is invalid or has insufficient permissions.');
    } else if (result.status === 404) {
      console.error('Error: The file was not found. This could be because the file doesn\'t exist or the token doesn\'t have access to it.');
    } else {
      console.error('Error: Unexpected status code.');
    }
    
    console.log('Response data:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main(); 