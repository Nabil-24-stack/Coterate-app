# Coterate

Coterate is a design iteration tool that functions similarly to Figma with a canvas-based UI. It allows users to paste UI designs and generate improved versions using AI.

## Features

- Canvas interface for UI design interaction
- Clipboard paste functionality to capture UI design images
- Hover interaction with "Iterate" button for design improvement
- AI-powered design improvement using OpenAI's GPT-4o and Stability AI's SDXL
- Persona management for organizing different design iterations

## API Key Setup

Coterate requires API keys from OpenAI and Stability AI to function properly. Follow these steps to set up your API keys:

### Option 1: Using the Setup Script (Recommended)

We provide setup scripts to help you configure your environment variables:

**For macOS/Linux users:**
```bash
./setup-env.sh
```

**For Windows users:**
```bash
setup-env.bat
```

The script will:
1. Create a `.env.local` file from the template
2. Prompt you to enter your API keys
3. Save the keys to the `.env.local` file

### Option 2: Manual Setup

1. **Create a .env.local file**
   - Copy the provided `.env.example` file to `.env.local`
   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys**
   - Open the `.env.local` file in a text editor
   - Replace the placeholder values with your actual API keys:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   REACT_APP_STABILITY_API_KEY=your_stability_api_key_here
   ```

### Obtaining API Keys

- **OpenAI API Key**: Sign up at [OpenAI Platform](https://platform.openai.com/api-keys)
- **Stability AI API Key**: Sign up at [Stability AI](https://platform.stability.ai/)

### Security Best Practices

- Never commit your `.env.local` file to version control
- The `.env.local` file is already added to `.gitignore`
- Rotate your API keys periodically for better security

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/coterate.git
cd coterate
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables as described in the "API Key Setup" section

4. Start the development server
```bash
npm start
# or
yarn start
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Click "New Persona" to create a new design canvas
2. Copy a screenshot of your UI design to your clipboard
3. Paste the image into the canvas (Ctrl+V or Cmd+V)
4. Hover over the image and click the "Iterate" button
5. Wait for the AI to analyze and generate an improved design
6. View the AI analysis by clicking the "View AI Analysis" button
7. Continue iterating on any design by clicking its "Iterate" button

## License

MIT 