import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import * as aiComponentService from '../services/aiComponentService';
import { htmlToImageService } from '../services/htmlToImageService';
import { AnalysisPanel } from './AnalysisPanel';
import { usePageContext } from '../contexts/PageContext';
import { generateImprovedUIDesign, aiService } from '../services/aiService';
import { FigmaExport } from './FigmaExport';
import { DesignIteration, DetectedComponent } from '../types';

// Global style to remove focus outlines and borders
const GlobalStyle = createGlobalStyle`
  * {
    outline: none !important;
    &:focus, &:focus-visible, &:focus-within {
      outline: none !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
  }
  
  img {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  
  /* Additional reset for all elements */
  div, img, canvas, section, article, figure {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  
  /* Override browser default focus styles */
  :focus {
    outline: none !important;
  }
  
  ::-moz-focus-inner {
    border: 0 !important;
  }
  
  button, h1, h2, h3, h4, h5, h6, p, span, div {
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
`;

// Logo component
const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 28px;
  color: #333;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const LogoIcon = styled.img`
  width: 36px;
  height: 36px;
`;

// Redesigned Canvas Container
const CanvasContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f5;
  z-index: 1; /* Lower z-index to ensure borders are visible */
`;

// Canvas header with tabs
const CanvasHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: white;
  border-bottom: 1px solid #E3E6EA;
  z-index: 100;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); /* Enhanced shadow for better visibility */
`;

const HeaderTabs = styled.div`
  display: flex;
  gap: 16px;
  justify-self: center;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  justify-self: end;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background-color: white;
  color: #333;
  border-radius: 8px;
  font-weight: 600;
  border: 1px solid #E3E6EA;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const HeaderTab = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  background-color: ${props => props.active ? '#EFEFEF' : 'transparent'};
  color: ${props => props.active ? '#333' : '#666'};
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  &:hover {
    background-color: ${props => props.active ? '#EFEFEF' : '#F5F5F5'};
  }
`;

// Infinite Canvas
const InfiniteCanvas = styled.div<{ scale: number }>`
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  margin-top: 60px; /* Add margin to account for fixed header */
  overflow: hidden;
  background-color: #f5f5f5;
  background-image: 
    linear-gradient(rgba(150, 150, 150, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(150, 150, 150, 0.1) 1px, transparent 1px);
  background-size: ${props => 20 * props.scale}px ${props => 20 * props.scale}px;
  cursor: grab;
  border: none !important;
  outline: none !important;
  z-index: 1; /* Lower z-index to ensure borders are visible */
  margin-left: 1px; /* Add margin to prevent overlap with sidebar border */
  
  &:active {
    cursor: grabbing;
  }
  
  &:focus, &:focus-visible, &:focus-within {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }
  
  * {
    border: none !important;
    outline: none !important;
  }
`;

const CanvasContent = styled.div<{ x: number; y: number; scale: number }>`
  position: absolute;
  transform: translate(${props => props.x}px, ${props => props.y}px) scale(${props => props.scale});
  transform-origin: 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 100%;
  min-height: 100%;
  border: none !important;
  outline: none !important;
  z-index: 1; /* Lower z-index to ensure borders are visible */
  
  &:focus, &:focus-visible, &:focus-within {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }
  
  * {
    border: none !important;
    outline: none !important;
  }
`;

// Design elements
const DesignContainer = styled.div`
  position: relative;
  min-width: 100%;
  min-height: 100%;
  padding: 100px;
`;

const DesignCard = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
  max-width: 600px;
  border: 2px solid transparent;
  outline: none;
  z-index: 10;
  cursor: pointer; /* Default cursor is pointer for selection */
  transition: box-shadow 0.2s ease, transform 0.05s ease, border-color 0.2s ease;
  
  &:focus, &:focus-visible, &:focus-within {
    outline: none;
    border-color: #1a73e8;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
  
  &.selected {
    border-color: #1a73e8; /* Darker Google blue for selected state */
    border-width: 3px; /* Thicker border */
    box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.3);
    cursor: move; /* Change cursor to move when selected */
  }
  
  &.selected:active {
    cursor: grabbing; /* Show grabbing cursor when active and selected */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(26, 115, 232, 0.3);
    transform: scale(1.01); /* Slight scale effect when dragging */
  }
  
  &.dragging {
    opacity: 0.9; /* Slight transparency when dragging */
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(26, 115, 232, 0.5);
  }
`;

const DesignLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const DesignImage = styled.img`
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 4px;
  border: none !important;
  outline: none !important;
  
  &:focus, &:focus-visible, &:focus-within {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }
`;

// Floating Action Button
const FloatingActionButton = styled.button`
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #4A90E2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  z-index: 10;

  &:hover {
    background-color: #3A7BC8;
    transform: scale(1.05);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

// Iteration Dialog
const IterationDialog = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const DialogContent = styled.div`
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const DialogTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const DialogTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 16px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
`;

const DialogButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const DialogButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  &.primary {
    background-color: #0066ff;
    color: white;
    border: none;
    
    &:hover {
      background-color: #0052cc;
    }
  }
  
  &.secondary {
    background-color: white;
    color: #333;
    border: 1px solid #ddd;
    
    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

// Loading Overlay
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  p {
    margin-top: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
`;

// Paste overlay
const PasteOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  width: 500px;
  max-width: 90%;
  
  h2 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 24px;
    font-weight: 600;
    color: #333;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  
  p {
    font-size: 16px;
    color: #666;
    max-width: 400px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
`;

// Error message
const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 500;
`;

// Tooltip for selection hint
const SelectionHint = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #1a73e8;
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  pointer-events: none;
  opacity: 0.9;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 500;
`;

// Icon for the hint
const HintIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
`;

// Canvas component
export const Canvas = () => {
  const { currentPage, updatePage } = usePageContext();
  const [iterationsMap, setIterationsMap] = useState<Record<string, DesignIteration[]>>({});
  const [selectedIteration, setSelectedIteration] = useState<DesignIteration | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showFigmaExport, setShowFigmaExport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceRender, setForceRender] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [detectedComponents, setDetectedComponents] = useState<DetectedComponent[]>([]);
  const [activeTab, setActiveTab] = useState<'research' | 'iterations'>('iterations');
  
  // Ref to track the current page ID and whether we've centered for it
  const centeringRef = useRef<{
    pageId: string | null;
    hasCentered: boolean;
    animationFrameId: number | null;
  }>({
    pageId: null,
    hasCentered: false,
    animationFrameId: null
  });
  
  // Canvas state
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showIterationDialog, setShowIterationDialog] = useState(false);
  const [iterationPrompt, setIterationPrompt] = useState('');
  
  // Store canvas positions for each page
  const [pageCanvasPositions, setPageCanvasPositions] = useState<Record<string, { x: number, y: number, scale: number }>>({});
  
  // Dragging state for designs
  const [draggingDesign, setDraggingDesign] = useState<string | null>(null);
  const [designDragStart, setDesignDragStart] = useState({ x: 0, y: 0 });
  
  // Maximum number of iterations
  const maxIterations = 5;

  // Get the iterations for the current page
  const iterations = currentPage ? (iterationsMap[currentPage.id] || []) : [];
  
  // Reset canvas position and scale
  const resetCanvas = () => {
    // If we don't have a current page, do nothing
    if (!currentPage) return;
    
    // Center the canvas if there's a canvasRef
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newPosition = {
        x: rect.width / 2,
        y: rect.height / 3  // Position slightly higher to account for UI elements
      };
      
      // Force the canvas position to be centered
      setCanvasPosition(newPosition);
      
      // Reset scale to 1 for consistent view
      const newScale = 1;
      setCanvasScale(newScale);
      
      // Mark that we've centered for this page
      centeringRef.current = {
        pageId: currentPage.id,
        hasCentered: true,
        animationFrameId: null
      };
      
      // Clear any saved position for this page to prevent it from being restored
      setPageCanvasPositions(prev => {
        const newPositions = {...prev};
        delete newPositions[currentPage.id];
        return newPositions;
      });
    } else {
      const newPosition = { x: 0, y: 0 };
      setCanvasPosition(newPosition);
      const newScale = 1;
      setCanvasScale(newScale);
      
      // Mark that we've centered for this page
      centeringRef.current = {
        pageId: currentPage.id,
        hasCentered: true,
        animationFrameId: null
      };
      
      // Clear any saved position for this page
      setPageCanvasPositions(prev => {
        const newPositions = {...prev};
        delete newPositions[currentPage.id];
        return newPositions;
      });
    }
  };

  // Effect to handle page changes
  useEffect(() => {
    if (currentPage) {
      // Reset selected iteration when switching pages
      setSelectedIteration(null);
      
      // Close any open panels
      setShowAnalysis(false);
      setShowFigmaExport(false);
      
      // If the page has a base image but no iterations, create a base iteration
      if (currentPage.baseImage && 
          currentPage.baseImage !== 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design' && 
          (!iterationsMap[currentPage.id] || iterationsMap[currentPage.id].length === 0)) {
        
        const baseIteration: DesignIteration = {
          id: `base-${currentPage.id}-${Date.now()}`,
          image: currentPage.baseImage,
          label: 'Base Design',
          iterationType: 'base',
          iterationNumber: 0,
          position: { x: 0, y: 0 } // Initialize position
        };
                
        setIterationsMap(prev => ({
          ...prev,
          [currentPage.id]: [baseIteration]
        }));
        
        setSelectedIteration(baseIteration);
      } else if (iterationsMap[currentPage.id] && iterationsMap[currentPage.id].length > 0) {
        // If the page has iterations, select the first one
        setSelectedIteration(iterationsMap[currentPage.id][0]);
      }
      
      // Cancel any existing animation frame
      if (centeringRef.current.animationFrameId !== null) {
        cancelAnimationFrame(centeringRef.current.animationFrameId);
      }
      
      // Reset the centering state for the new page
      centeringRef.current = {
        pageId: currentPage.id,
        hasCentered: false,
        animationFrameId: null
      };
      
      // Use requestAnimationFrame for more reliable centering
      const frameId = requestAnimationFrame(() => {
        // Use another requestAnimationFrame to ensure we're in the next render cycle
        centeringRef.current.animationFrameId = requestAnimationFrame(() => {
          // Only center if we haven't already centered for this page
          if (centeringRef.current.pageId === currentPage.id && !centeringRef.current.hasCentered) {
            resetCanvas();
            
            // Schedule another centering after a delay to ensure it sticks
            setTimeout(() => {
              if (centeringRef.current.pageId === currentPage.id) {
                resetCanvas();
              }
            }, 500);
          }
        });
      });
      
      // Store the frame ID so we can cancel it if needed
      centeringRef.current.animationFrameId = frameId;
      
      // Clean up function to cancel animation frames
      return () => {
        if (centeringRef.current.animationFrameId !== null) {
          cancelAnimationFrame(centeringRef.current.animationFrameId);
        }
      };
    }
  }, [currentPage?.id, iterationsMap]);

  // Add an effect to center the canvas when the component mounts
  useEffect(() => {
    resetCanvas();
  }, []);

  // Handle canvas mouse down for dragging
  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 || draggingDesign) return; // Only left mouse button and not dragging a design
    
    // Deselect any selected design when clicking on the canvas
    if (selectedIteration) {
      setSelectedIteration(null);
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - canvasPosition.x,
      y: e.clientY - canvasPosition.y
    });
  };

  // Handle canvas mouse move for dragging
  const handleCanvasMouseMove = (e: MouseEvent) => {
    // If we're dragging a design, handle that instead of canvas dragging
    if (draggingDesign) {
      handleDesignMouseMove(e);
      return;
    }
    
    // Otherwise, handle canvas dragging
    if (!isDragging) return;
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };
    setCanvasPosition(newPosition);
    
    // Save the position for this page
    if (currentPage) {
      setPageCanvasPositions(prev => ({
        ...prev,
        [currentPage.id]: { ...prev[currentPage.id], x: newPosition.x, y: newPosition.y }
      }));
      
      // Mark that the user has manually positioned the canvas
      if (centeringRef.current.pageId === currentPage.id) {
        centeringRef.current.hasCentered = true;
      }
    }
  };

  // Handle canvas mouse up to stop dragging
  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    
    // Also stop design dragging if active
    if (draggingDesign) {
      handleDesignMouseUp();
    }
  };

  // Handle canvas wheel for zooming
  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (!currentPage) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(2, canvasScale + delta));
    
    // Calculate cursor position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new position to zoom towards cursor
    const newX = canvasPosition.x - ((mouseX - canvasPosition.x) * (delta / canvasScale));
    const newY = canvasPosition.y - ((mouseY - canvasPosition.y) * (delta / canvasScale));
    
    setCanvasScale(newScale);
    setCanvasPosition({ x: newX, y: newY });
    
    // Save the position and scale for this page
    setPageCanvasPositions(prev => ({
      ...prev,
      [currentPage.id]: { x: newX, y: newY, scale: newScale }
    }));
    
    // Mark that the user has manually positioned the canvas
    if (centeringRef.current.pageId === currentPage.id) {
      centeringRef.current.hasCentered = true;
    }
  };

  // Toggle analysis panel
  const toggleAnalysis = () => {
    setShowAnalysis(!showAnalysis);
  };

  // Toggle Figma export panel
  const toggleFigmaExport = () => {
    setShowFigmaExport(!showFigmaExport);
  };

  // Open iteration dialog
  const openIterationDialog = () => {
    setShowIterationDialog(true);
  };

  // Close iteration dialog
  const closeIterationDialog = () => {
    setShowIterationDialog(false);
    setIterationPrompt('');
  };

  // Handle iteration
  const handleIterate = async () => {
    if (!currentPage) return;
    
    // Get the base iteration to improve
    const baseIteration = iterations.find(i => i.iterationType === 'base');
    
    if (!baseIteration) {
      console.error('No base iteration found for improvement');
      setError('No base design found to improve');
            return;
    }
    
    setIsLoading(true);
    setError(null);
    setShowIterationDialog(false);
    
    try {
      console.log('🔄 Starting design iteration...');
      
      // Get the image to improve
      const imageToImprove = baseIteration.image;
      
      // Process the image
      console.log('🖼️ Processing image for AI improvement...');
      
      // Call the AI service to generate an improved design
      const result = await generateImprovedUIDesign(imageToImprove, iterationPrompt || undefined);
      
      if (!result || !result.image) {
        throw new Error('Failed to generate improved design');
      }
      
      console.log('✅ Successfully generated improved design');
      
      // Create a new iteration
      const newIteration: DesignIteration = {
        id: `iteration-${Date.now()}`,
        image: result.image,
        label: `Iteration ${iterations.filter(i => i.iterationType === 'improved').length + 1}`,
        iterationType: 'improved',
        iterationNumber: iterations.filter(i => i.iterationType === 'improved').length + 1,
        analysis: result.analysis,
        // Position the iterated design with an offset from the base design
        position: {
          x: (baseIteration.position?.x || 0) + 100,
          y: (baseIteration.position?.y || 0) + 50
        }
      };
      
      // Add the new iteration to the map for the current page
      const updatedPageIterations = [...iterations, newIteration];
      setIterationsMap(prev => ({
        ...prev,
        [currentPage.id]: updatedPageIterations
      }));
      
      // Set the new iteration as selected
      setSelectedIteration(newIteration);
      
      // Update the page with the iterated image
      updatePage(currentPage.id, {
        ...currentPage,
        iteratedImage: result.image
      });
      
      console.log('✅ Iteration completed successfully');
      setIterationPrompt('');
    } catch (error) {
      console.error('❌ Error during iteration:', error);
      setError(`Failed to generate improved design: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle paste event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!currentPage) return;
      
      // Prevent default paste behavior which might cause focus issues
      e.preventDefault();
      e.stopPropagation();
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const imageDataUrl = e.target?.result as string;
              if (imageDataUrl) {
                // Get current iterations for this page
                const currentIterations = iterationsMap[currentPage.id] || [];
                
                // If this is the first design being pasted (empty canvas)
                if (currentIterations.length === 0 || 
                    (currentPage?.baseImage === 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design')) {
                  // Update the page's base image
                  updatePage(currentPage.id, { baseImage: imageDataUrl });
                  
                  // Create base iteration
                  const baseIteration: DesignIteration = {
                    id: `base-${currentPage.id}-${Date.now()}`,
                    image: imageDataUrl,
                    label: 'Base Design',
                    iterationType: 'base',
                    iterationNumber: 0,
                    position: { x: 0, y: 0 } // Initialize position
                  };
                  
                  // Set iterations for this page to just the base iteration
                  setIterationsMap(prev => ({
                    ...prev,
                    [currentPage.id]: [baseIteration]
                  }));
                  
                  setSelectedIteration(baseIteration);
                } else {
                  // Calculate a position offset for the new design
                  // This will place new designs in a cascading pattern
                  const offsetX = (currentIterations.length % 3) * 50;
                  const offsetY = (currentIterations.length % 3) * 50;
                  
                  // Create a new design iteration
                  const newIteration: DesignIteration = {
                    id: `design-${currentPage.id}-${Date.now()}`,
                    image: imageDataUrl,
                    label: `Design ${currentIterations.length + 1}`,
                    iterationType: 'base',
                    iterationNumber: currentIterations.length,
                    position: { x: offsetX, y: offsetY } // Initialize with offset
                  };
                  
                  // Add the new iteration to the existing ones
                  setIterationsMap(prev => ({
                    ...prev,
                    [currentPage.id]: [...(prev[currentPage.id] || []), newIteration]
                  }));
                  
                  // Select the newly added iteration
                  setSelectedIteration(newIteration);
                }
                
                // Reset canvas position and scale
                // Use requestAnimationFrame to ensure the DOM has updated
                requestAnimationFrame(() => {
                  // Reset the centering state for the current page
                  if (currentPage) {
                    centeringRef.current = {
                      pageId: currentPage.id,
                      hasCentered: false,
                      animationFrameId: null
                    };
                  }
                  
                  // Reset the canvas to center the design
                  resetCanvas();
                });
                
                // Remove focus from any elements
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                
                // Add a small delay and then apply a CSS fix to remove any borders
                setTimeout(() => {
                  const images = document.querySelectorAll('img');
                  images.forEach(img => {
                    img.style.border = 'none';
                    img.style.outline = 'none';
                    img.style.boxShadow = 'none';
                  });
                }, 100);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [currentPage, updatePage, iterationsMap]);

  // Check if we need to show the paste overlay
  const showPasteOverlay = (iterations.length === 0 || 
    (currentPage?.baseImage === 'https://via.placeholder.com/800x600?text=Paste+Your+UI+Design'));

  // Handle design mouse down for dragging
  const handleDesignMouseDown = (e: React.MouseEvent, iterationId: string) => {
    e.stopPropagation(); // Prevent canvas drag
    
    // Find the iteration being clicked
    if (!currentPage) return;
    const iteration = iterationsMap[currentPage.id]?.find(it => it.id === iterationId);
    if (!iteration) return;
    
    // If the clicked design is not the selected one, just select it and don't start dragging
    if (selectedIteration?.id !== iterationId) {
      setSelectedIteration(iteration);
      return;
    }
    
    // Only allow dragging if the design is already selected
    setDraggingDesign(iterationId);
    
    // Calculate the offset between the mouse position and the design's top-left corner
    // This ensures the design doesn't jump to have its top-left corner at the mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    setDesignDragStart({
      x: e.clientX - (iteration.position?.x || 0),
      y: e.clientY - (iteration.position?.y || 0)
    });
  };
  
  // Handle design mouse move for dragging
  const handleDesignMouseMove = (e: MouseEvent) => {
    if (!draggingDesign || !currentPage) return;
    
    // Find the iteration being dragged
    const iteration = iterationsMap[currentPage.id]?.find(it => it.id === draggingDesign);
    if (!iteration) return;
    
    // Calculate new position based on the initial offset
    const newPosition = {
      x: e.clientX - designDragStart.x,
      y: e.clientY - designDragStart.y
    };
    
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      // Update the iteration's position
      setIterationsMap(prev => {
        const updatedIterations = prev[currentPage.id].map(it => {
          if (it.id === draggingDesign) {
            return {
              ...it,
              position: newPosition
            };
          }
          return it;
        });
        
        return {
          ...prev,
          [currentPage.id]: updatedIterations
        };
      });
    });
  };
  
  // Handle design mouse up to stop dragging
  const handleDesignMouseUp = () => {
    setDraggingDesign(null);
  };

  // Add event listeners for mouse move and mouse up on the document
  useEffect(() => {
    const handleDocumentMouseMove = (e: globalThis.MouseEvent) => {
      if (draggingDesign) {
        handleDesignMouseMove(e as unknown as MouseEvent);
      } else if (isDragging) {
        handleCanvasMouseMove(e as unknown as MouseEvent);
      }
    };
    
    const handleDocumentMouseUp = () => {
      if (draggingDesign) {
        handleDesignMouseUp();
      }
      if (isDragging) {
        handleCanvasMouseUp();
      }
    };
    
    // Add event listeners to the document
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    
    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [draggingDesign, isDragging, handleDesignMouseMove, handleCanvasMouseMove, handleDesignMouseUp, handleCanvasMouseUp]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected design when pressing Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIteration && currentPage) {
        // Prevent deleting if it's the only design
        if (iterationsMap[currentPage.id]?.length <= 1) {
          return;
        }
        
        // Remove the selected design from iterations
        setIterationsMap(prev => {
          const updatedIterations = prev[currentPage.id].filter(it => it.id !== selectedIteration.id);
          return {
            ...prev,
            [currentPage.id]: updatedIterations
          };
        });
        
        // Clear the selected iteration
        setSelectedIteration(null);
      }
    };
    
    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIteration, currentPage, iterationsMap]);

  // Add event listener to deselect when clicking outside the canvas
  useEffect(() => {
    const handleDocumentClick = (e: globalThis.MouseEvent) => {
      // If we have a selected design and the click is outside the canvas
      if (selectedIteration && canvasRef.current) {
        // Check if the click is outside the canvas
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const isOutsideCanvas = 
          e.clientX < canvasRect.left || 
          e.clientX > canvasRect.right || 
          e.clientY < canvasRect.top || 
          e.clientY > canvasRect.bottom;
        
        if (isOutsideCanvas) {
          setSelectedIteration(null);
        }
      }
    };
    
    // Add event listener
    document.addEventListener('click', handleDocumentClick);
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [selectedIteration]);

  // Render message if no page is selected
  if (!currentPage) {
    return <CanvasContainer>No page selected</CanvasContainer>;
  }

  return (
    <CanvasContainer>
      <GlobalStyle />
      <CanvasHeader>
        <Logo>
          <LogoIcon src="/Coterate logo.svg" alt="Coterate" />
          Coterate
        </Logo>
        
        <HeaderTabs>
          <HeaderTab 
            active={activeTab === 'research'} 
            onClick={() => setActiveTab('research')}
          >
            Research
          </HeaderTab>
          <HeaderTab 
            active={activeTab === 'iterations'} 
            onClick={() => setActiveTab('iterations')}
          >
            Iterations
          </HeaderTab>
        </HeaderTabs>
        
        <HeaderActions>
          {iterations.length > 0 && (
            <>
              <ActionButton onClick={toggleAnalysis}>Analysis</ActionButton>
              <ActionButton onClick={toggleFigmaExport}>Export</ActionButton>
              {iterations.filter(i => i.iterationType === 'improved').length < maxIterations && (
                <ActionButton onClick={openIterationDialog}>Iterate</ActionButton>
              )}
            </>
          )}
        </HeaderActions>
      </CanvasHeader>

      <InfiniteCanvas
        ref={canvasRef}
        scale={canvasScale}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleCanvasWheel}
        tabIndex={-1}
      >
        <CanvasContent 
          x={canvasPosition.x} 
          y={canvasPosition.y} 
          scale={canvasScale}
          tabIndex={-1}
        >
          {showPasteOverlay ? (
            <PasteOverlay>
              <h2>Paste Your UI Design</h2>
              <p>Copy a UI design image and press Ctrl+V / Cmd+V to paste it here</p>
            </PasteOverlay>
          ) : (
            <DesignContainer>
              {iterations.map((iteration) => (
                <DesignCard 
                  key={iteration.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIteration(iteration);
                  }}
                  onMouseDown={(e) => handleDesignMouseDown(e, iteration.id)}
                  tabIndex={-1}
                  className={`
                    ${selectedIteration?.id === iteration.id ? 'selected' : ''}
                    ${draggingDesign === iteration.id ? 'dragging' : ''}
                  `}
                  style={{
                    backgroundColor: selectedIteration?.id === iteration.id ? '#f8f9ff' : 'white',
                    transform: `translate(${iteration.position?.x || 0}px, ${iteration.position?.y || 0}px)`,
                    zIndex: draggingDesign === iteration.id ? 30 : (selectedIteration?.id === iteration.id ? 20 : 10)
                  }}
                >
                  <DesignLabel>{iteration.label}</DesignLabel>
                  <div style={{ position: 'relative' }}>
                    <DesignImage 
                      src={iteration.image} 
                      alt={iteration.label}
                      tabIndex={-1}
                    />
                    
                    {iteration.iterationType === 'base' && iterations.filter(i => i.iterationType === 'improved').length < maxIterations && (
                      <FloatingActionButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          openIterationDialog();
                        }}
                        disabled={isLoading}
                        style={{
                          position: 'absolute',
                          right: '-24px', 
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4V20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 12H20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </FloatingActionButton>
                    )}
                  </div>
                </DesignCard>
              ))}
            </DesignContainer>
          )}
        </CanvasContent>
      </InfiniteCanvas>

      {showAnalysis && selectedIteration?.analysis && (
        <AnalysisPanel 
          selectedIteration={selectedIteration}
          onClose={toggleAnalysis} 
        />
      )}

          {showFigmaExport && selectedIteration && (
            <FigmaExport 
          selectedIteration={selectedIteration}
          onClose={toggleFigmaExport}
        />
      )}

      {showIterationDialog && (
        <IterationDialog>
          <DialogContent>
            <DialogTitle>Create New Iteration</DialogTitle>
            <p>Provide instructions for improving the design:</p>
            <DialogTextarea 
              value={iterationPrompt}
              onChange={(e) => setIterationPrompt(e.target.value)}
              placeholder="E.g., Improve the color scheme, make the buttons more prominent, etc."
              rows={4}
            />
            
            <DialogButtons>
              <DialogButton 
                className="secondary" 
                onClick={closeIterationDialog}
              >
                Cancel
              </DialogButton>
              <DialogButton 
                className="primary" 
                onClick={handleIterate}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Generate Improved Design'}
              </DialogButton>
            </DialogButtons>
          </DialogContent>
        </IterationDialog>
      )}

      {error && (
        <ErrorMessage>
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </ErrorMessage>
          )}
          
          {isLoading && (
            <LoadingOverlay>
          <div className="spinner"></div>
          <p>Generating improved design...</p>
            </LoadingOverlay>
      )}

      {selectedIteration && (
        <SelectionHint>
          <HintIcon>👇</HintIcon>
          Drag to move
        </SelectionHint>
      )}
      
      {!selectedIteration && iterations.length > 0 && !showPasteOverlay && (
        <SelectionHint>
          <HintIcon>👆</HintIcon>
          Click a design to select it
        </SelectionHint>
      )}
    </CanvasContainer>
  );
}; 