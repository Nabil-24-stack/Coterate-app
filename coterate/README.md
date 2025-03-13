# Coterate

Coterate is a design iteration tool that functions similarly to Figma with a canvas-based UI. It allows users to paste UI designs and generate improved versions using AI.

## Features

- Canvas interface for UI design interaction
- Clipboard paste functionality to capture UI design images
- Hover interaction with "Iterate" button for design improvement
- AI-powered design improvement using OpenAI's GPT-4o and Stability AI's SDXL
- Persona management for organizing different design iterations
- Figma API integration for importing and exporting designs

## AI Integration

Coterate uses a powerful AI pipeline to generate improved UI designs:

1. **Analysis with GPT-4o**: When you click "Iterate" on a design, OpenAI's GPT-4o analyzes the UI and generates a detailed improvement prompt focusing on:
   - Visual hierarchy and layout improvements
   - Color contrast and accessibility enhancements
   - Typography and readability optimizations
   - Component spacing and alignment refinements
   - Overall aesthetic improvements

2. **Generation with SDXL**: The improvement prompt is then passed to Stability AI's SDXL model, which generates a new UI design incorporating the suggested improvements.

3. **AI Analysis**: Each improved design comes with an AI analysis that explains the changes made, which you can view by clicking the "View AI Analysis" button.

## Figma Integration

Coterate integrates with Figma to provide a seamless workflow between the two platforms:

1. **Import from Figma**: Import designs directly from Figma using the Figma API. This allows you to:
   - Work with vector components for cleaner, scalable UI elements
   - Maintain proper text rendering and font properties
   - Align with your existing design system
   - Preserve layer structures for targeted improvements

2. **Export to Figma**: Export your improved designs back to Figma format. Since Figma's API doesn't directly support creating designs programmatically, Coterate provides JSON data that can be used with Figma plugins.

3. **Component-Level Manipulation**: Coterate preserves the component structure from Figma, allowing for more precise AI-driven improvements at the component level.

## Supabase Setup

This application uses Supabase for authentication and database storage. Follow these steps to set up your Supabase project:

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in.
2. Create a new project and note your project URL and anon key.

### 2. Configure Environment Variables

1. Create a `.env` file in the root of the project (or update the existing one).
2. Add the following environment variables:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase project URL and anon key.

### 3. Set Up Database Tables

Execute the following SQL in the Supabase SQL editor to create the necessary tables:

```sql
-- Create pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_image TEXT,
  iterated_image TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create components table
CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  confidence FLOAT,
  bounding_box JSONB NOT NULL,
  attributes JSONB,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  z_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Pages policies
CREATE POLICY "Users can view their own pages" 
  ON pages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pages" 
  ON pages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages" 
  ON pages FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages" 
  ON pages FOR DELETE 
  USING (auth.uid() = user_id);

-- Components policies
CREATE POLICY "Users can view components of their pages" 
  ON components FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = components.page_id 
    AND pages.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert components to their pages" 
  ON components FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = components.page_id 
    AND pages.user_id = auth.uid()
  ));

CREATE POLICY "Users can update components of their pages" 
  ON components FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = components.page_id 
    AND pages.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete components of their pages" 
  ON components FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = components.page_id 
    AND pages.user_id = auth.uid()
  ));

-- User settings policies
CREATE POLICY "Users can view their own settings" 
  ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
  ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id);
```

### 4. Set Up Storage Buckets

1. Go to the Storage section in your Supabase dashboard.
2. Create the following buckets:
   - `page-images`: For storing page images
   - `user-uploads`: For storing user-uploaded files

3. Set up the following bucket policies:

For `page-images` and `user-uploads`:
- Allow authenticated users to upload files
- Allow authenticated users to view their own files
- Allow authenticated users to update their own files
- Allow authenticated users to delete their own files

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key (for GPT-4o)
- Stability AI API key (for SDXL)
- Figma Personal Access Token (for Figma integration)

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

3. Set up environment variables
Create a `.env` file in the root directory with your API keys:
```
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_STABILITY_API_KEY=your_stability_api_key
REACT_APP_FIGMA_ACCESS_TOKEN=your_figma_access_token
```

4. Start the development server
```bash
npm start
# or
yarn start
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Click "New Persona" to create a new design canvas
2. Choose your import method:
   - Paste an image from your clipboard (Ctrl+V or Cmd+V)
   - Import directly from Figma by providing a file key or URL
3. Hover over the image and click the "Iterate" button
4. Wait for the AI to analyze and generate an improved design
5. View the AI analysis by clicking the "View AI Analysis" button
6. Continue iterating on any design by clicking its "Iterate" button
7. Export your design to Figma format by clicking the "Export to Figma" button

## Figma API Setup

To use the Figma integration features, you'll need to:

1. Create a Figma account if you don't already have one
2. Generate a personal access token:
   - Go to your Figma account settings
   - Scroll to "Personal access tokens"
   - Create a new token and copy it
3. Add the token to your `.env.local` file as `REACT_APP_FIGMA_ACCESS_TOKEN`

## Technical Details

- Frontend: React with TypeScript
- Styling: Styled Components
- State Management: React Context API
- Clipboard Handling: Custom useClipboard hook
- AI Integration: OpenAI GPT-4o and Stability AI SDXL
- Design Tool Integration: Figma API

## License

MIT 