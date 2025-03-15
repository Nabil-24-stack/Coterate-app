const fs = require('fs').promises;
const path = require('path');

async function fixEnvFile() {
  try {
    // Define the path to the .env.local file
    const envFilePath = path.join(__dirname, '.env.local');
    
    // Read the current content of the .env.local file
    const currentContent = await fs.readFile(envFilePath, 'utf8');
    console.log('Current content:', currentContent);
    
    // Replace the Figma API token line, removing any trailing % character
    const updatedContent = currentContent.replace(
      /REACT_APP_FIGMA_ACCESS_TOKEN=([^%\s]+)%?/,
      'REACT_APP_FIGMA_ACCESS_TOKEN=$1'
    );
    
    // Write the updated content back to the .env.local file
    await fs.writeFile(envFilePath, updatedContent, 'utf8');
    console.log('Updated content:', updatedContent);
    
    console.log('Successfully updated the Figma API token in .env.local');
  } catch (error) {
    console.error('Error updating .env.local file:', error);
  }
}

// Run the function
fixEnvFile(); 