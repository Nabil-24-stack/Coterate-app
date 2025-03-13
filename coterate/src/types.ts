// Shared types for the Coterate application

// Interface for design iteration
export interface DesignIteration {
  id: string;
  image: string;
  label: string;
  iterationType: 'base' | 'improved';
  iterationNumber: number;
  analysis?: string;
  components?: DetectedComponent[];
  position?: { x: number, y: number }; // Position for dragging
}

// Interface for AI service result
export interface AIResult {
  image: string;
  analysis: any;
}

// Interface for component result
export interface ComponentResult {
  components: DetectedComponent[];
  image: string;
  analysis: string;
}

// Define the DetectedComponent interface
export interface DetectedComponent {
  id: string;
  type: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    fontSize?: number;
    padding?: string;
    text?: string;
    state?: string;
    [key: string]: any;
  };
  page_id?: string;
  z_index?: number;
  created_at?: string;
  updated_at?: string;
}

// Interface for Page (formerly Persona)
export interface Page {
  id: string;
  name: string;
  baseImage?: string;
  iteratedImage?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface for Page Context
export interface PageContextType {
  pages: Page[];
  currentPage: Page | null;
  addPage: (name: string) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  deletePage: (id: string) => void;
  setCurrentPage: (page: Page) => void;
  renamePage: (id: string, newName: string) => void;
} 