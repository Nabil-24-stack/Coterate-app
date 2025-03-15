#!/bin/bash

# Coterate Environment Setup Script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Coterate Environment Setup${NC}"
echo "This script will help you set up your environment variables for Coterate."

# Check if .env.example exists
if [ ! -f .env.example ]; then
  echo -e "${RED}Error: .env.example file not found.${NC}"
  exit 1
fi

# Check if .env.local already exists
if [ -f .env.local ]; then
  echo -e "${YELLOW}Warning: .env.local file already exists.${NC}"
  read -p "Do you want to overwrite it? (y/n): " overwrite
  if [ "$overwrite" != "y" ]; then
    echo "Setup cancelled."
    exit 0
  fi
fi

# Copy .env.example to .env.local
cp .env.example .env.local
echo -e "${GREEN}Created .env.local file from template.${NC}"

# Prompt for API keys
echo ""
echo "Please enter your API keys:"
echo ""

# OpenAI API Key
read -p "OpenAI API Key: " openai_key
if [ -z "$openai_key" ]; then
  echo -e "${YELLOW}Warning: No OpenAI API key provided. You'll need to add it manually to .env.local${NC}"
else
  # Replace the placeholder in .env.local
  sed -i '' "s/REACT_APP_OPENAI_API_KEY=your_openai_api_key_here/REACT_APP_OPENAI_API_KEY=$openai_key/" .env.local
  echo -e "${GREEN}OpenAI API key added to .env.local${NC}"
fi

# Stability AI API Key
read -p "Stability AI API Key: " stability_key
if [ -z "$stability_key" ]; then
  echo -e "${YELLOW}Warning: No Stability AI API key provided. You'll need to add it manually to .env.local${NC}"
else
  # Replace the placeholder in .env.local
  sed -i '' "s/REACT_APP_STABILITY_API_KEY=your_stability_api_key_here/REACT_APP_STABILITY_API_KEY=$stability_key/" .env.local
  echo -e "${GREEN}Stability AI API key added to .env.local${NC}"
fi

# Figma API Key
read -p "Figma API Access Token: " figma_key
if [ -z "$figma_key" ]; then
  echo -e "${YELLOW}Warning: No Figma API access token provided. You'll need to add it manually to .env.local${NC}"
else
  # Replace the placeholder in .env.local
  sed -i '' "s/REACT_APP_FIGMA_ACCESS_TOKEN=your_figma_access_token_here/REACT_APP_FIGMA_ACCESS_TOKEN=$figma_key/" .env.local
  echo -e "${GREEN}Figma API access token added to .env.local${NC}"
fi

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo "Your environment variables have been configured in .env.local"
echo ""
echo "If you need to modify your API keys in the future, edit the .env.local file directly."
echo "Remember: Never commit your .env.local file to version control." 