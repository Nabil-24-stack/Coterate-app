import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import * as aiComponentService from '../services/aiComponentService';
import { htmlToImageService } from '../services/htmlToImageService';
import { AnalysisPanel } from './AnalysisPanel';
import { usePageContext } from '../contexts/PageContext';
import { generateImprovedUIDesign, aiService } from '../services/aiService';
import { FigmaExport } from './FigmaExport';
import { DesignIteration, DetectedComponent } from '../types';
import figmaService from '../services/figmaService';
import { DebugEnv } from './DebugEnv';
import FigmaDebug from './FigmaDebug';
import FigmaComponentsView from './FigmaComponentsView';

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
  width: 600px;
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

// Add this styled component for the improved design actions
const ImprovedDesignActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

// Add this styled component for the custom prompt input
const CustomPromptInput = styled.input`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

// Add this styled component for the error overlay
const ErrorOverlay = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1000;
`;

// Add styled components for Figma URL input
const FigmaUrlInputContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  width: 100%;
`;

const FigmaUrlField = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #E3E6EA;
  border-radius: 6px 0 0 6px;
  font-size: 14px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  &:focus {
    outline: none;
    border-color: #4A90E2;
  }
`;

const FigmaUrlButton = styled.button`
  padding: 10px 15px;
  background-color: #0066ff;
  color: white;
  border: none;
  border-radius: 0 6px 6px 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  &:hover {
    background-color: #0052cc;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

// Add error message component
const ErrorMessage = styled.div`
  color: #e53935;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

// Add this styled component for design actions
const DesignActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
`;

// Add this styled component near the other styled components
const ComponentActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 4px;
  font-size: 12px;
`;

const ComponentCount = styled.div`
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
`;

// Add this styled component near the other styled components
const FigmaIndicator = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: #1e88e5;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 5;
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
  
  // State for component analysis results
  const [componentResult, setComponentResult] = useState<any>(null);
  const [improvedImage, setImprovedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Add state for Figma data
  const [figmaData, setFigmaData] = useState<any>(null);
  const [isLoadingFigma, setIsLoadingFigma] = useState<boolean>(false);
  const [figmaError, setFigmaError] = useState<string | null>(null);

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
    
    // Reduce the zoom sensitivity and add a time-based throttle
    const now = Date.now();
    if (handleCanvasWheel.lastZoomTime && now - handleCanvasWheel.lastZoomTime < 50) {
      return; // Throttle zoom events to max 20 per second
    }
    handleCanvasWheel.lastZoomTime = now;
    
    // Reduce zoom speed and make it more consistent across devices
    const zoomFactor = 0.05; // Smaller value for more gradual zoom
    const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
    
    // Limit the scale change per event
    const newScale = Math.max(0.5, Math.min(2, canvasScale + delta));
    
    // Only proceed if the scale actually changed
    if (newScale === canvasScale) return;
    
    // Calculate cursor position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new position to zoom towards cursor with improved formula
    const zoomPoint = {
      x: (mouseX - canvasPosition.x) / canvasScale,
      y: (mouseY - canvasPosition.y) / canvasScale
    };
    
    const newX = mouseX - zoomPoint.x * newScale;
    const newY = mouseY - zoomPoint.y * newScale;
    
    // Update state
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
  
  // Add static property for throttling
  handleCanvasWheel.lastZoomTime = 0 as number;

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
    // Instead of showing the dialog, directly start the iteration process
    handleIterate();
  };

  // Close iteration dialog - keeping this for compatibility
  const closeIterationDialog = () => {
    setShowIterationDialog(false);
    setIterationPrompt('');
  };

  // Handle iteration
  const handleIterate = async () => {
    if (!canvasRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the current canvas as a base64 image
      const imageBase64 = await htmlToImageService.convertHtmlToImage(canvasRef.current.outerHTML);
      
      // First, analyze the components if not already done
      if (!componentResult) {
        try {
          const result = await aiComponentService.improveUIWithComponents(imageBase64);
          setComponentResult(result);
          console.log(`Successfully analyzed components:`, result);
        } catch (componentError) {
          console.warn('Component analysis failed:', componentError);
          // Continue with basic image generation even if component analysis fails
        }
      }
      
      // Prepare limited improvements if we have component results
      let analysisText = '';
      if (componentResult && componentResult.analysis && componentResult.analysis.improvements) {
        // Take only the first 3 improvements
        const limitedImprovements = componentResult.analysis.improvements
          .slice(0, 3)
          .map((imp: any) => {
            // For each improvement, include only the most important properties
            return {
              component: imp.component,
              suggestion: imp.suggestion?.substring(0, 100) || '',
              reasoning: imp.reasoning ? imp.reasoning.substring(0, 100) : ''
            };
          });
        
        analysisText = JSON.stringify(limitedImprovements, null, 2);
      }
      
      // Generate improved UI design using the Stability API
      const result = await generateImprovedUIDesign(imageBase64, analysisText);
      
      // Set the improved image
      setImprovedImage(result.image);
      
      // Log success
      console.log('Successfully generated improved UI design');
      
    } catch (error) {
      console.error('Error during iteration:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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
    
    // Get the element's bounding rectangle
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Calculate the offset between the mouse position and the design's top-left corner
    // This ensures the design doesn't jump to have its top-left corner at the mouse position
    setDesignDragStart({
      x: e.clientX - (iteration.position?.x || 0),
      y: e.clientY - (iteration.position?.y || 0)
    });
    
    // Immediately apply a grabbing cursor to the document for better UX
    document.body.style.cursor = 'grabbing';
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
    
    // Apply the position directly to the DOM element for immediate visual feedback
    const designElement = document.querySelector(`[data-iteration-id="${draggingDesign}"]`);
    if (designElement) {
      designElement.setAttribute('style', 
        `transform: translate(${newPosition.x}px, ${newPosition.y}px); 
         z-index: 30; 
         background-color: ${selectedIteration?.id === draggingDesign ? '#f8f9ff' : 'white'};
         ${draggingDesign === iteration.id ? 'opacity: 0.9;' : ''}`
      );
    }
    
    // Debounce the state update to reduce React re-renders
    if (!handleDesignMouseMove.debounceTimer) {
      handleDesignMouseMove.debounceTimer = setTimeout(() => {
        // Update the iteration's position in state
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
        handleDesignMouseMove.debounceTimer = null;
      }, 16); // ~60fps
    }
  };
  
  // Add the debounce timer property to the function
  handleDesignMouseMove.debounceTimer = null as any;
  
  // Handle design mouse up to stop dragging
  const handleDesignMouseUp = () => {
    setDraggingDesign(null);
    // Reset cursor style
    document.body.style.cursor = '';
  };

  // Updated paste handler to handle both images and Figma URLs
  const handlePaste = React.useCallback(async (e: ClipboardEvent) => {
    // Check if the paste target is an input field
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      // Allow default paste behavior for input fields
      console.log('Paste target is an input field, allowing default behavior');
      return;
    }
    
    // For all other paste events, prevent default and handle manually
    e.preventDefault();
    console.log('Paste event detected, prevented default behavior');
    
    // Check if the pasted content is text (potentially a Figma URL)
    const clipboardText = e.clipboardData?.getData('text');
    console.log('Clipboard text:', clipboardText);
    
    if (clipboardText && (clipboardText.includes('figma.com/file/') || clipboardText.includes('figma.com/design/'))) {
      console.log('Figma URL detected:', clipboardText);
      try {
        setIsLoadingFigma(true);
        setFigmaError(null);
        
        // Validate the Figma URL
        console.log('Validating Figma URL...');
        const validation = figmaService.validateFigmaUrl(clipboardText);
        console.log('Validation result:', validation);
        
        if (!validation.isValid) {
          console.error('Figma URL validation failed:', validation.message);
          throw new Error(validation.message || 'Invalid Figma URL');
        }
        
        // Extract file key and node ID from the Figma URL
        const { fileKey } = figmaService.extractFigmaInfo(clipboardText);
        let { nodeId } = figmaService.extractFigmaInfo(clipboardText);
        console.log('Extracted file key:', fileKey, 'node ID:', nodeId);
        
        if (!fileKey) {
          console.error('Could not extract file key from Figma URL');
          throw new Error('Invalid Figma URL. Could not extract file key.');
        }
        
        if (!nodeId) {
          console.warn('No node ID found in the Figma URL. Will try to fetch the default frame.');
          // We'll continue without a node ID, but show a warning to the user
          setFigmaError('Warning: No specific frame (node ID) found in the URL. Attempting to fetch the default frame.');
        }
        
        console.log('Processing Figma URL:', clipboardText);
        console.log('Extracted file key:', fileKey, 'node ID:', nodeId || 'none (using default)');
        
        // Fetch file data from Figma API
        console.log('Fetching Figma file data...');
        const fileData = await figmaService.getFigmaFileData(fileKey, nodeId || null);
        
        // Process the Figma data
        console.log('Processing Figma data...');
        const processedData = figmaService.processFigmaData(fileData);
        
        // Store the processed Figma data for later use
        setFigmaData(processedData);
        
        // Extract detailed components from the Figma data
        console.log('Extracting detailed components...');
        const detailedComponents = processedData.detailedComponents;
        
        // Convert Figma components to Coterate DetectedComponent format
        console.log('Converting to DetectedComponent format...');
        const detectedComponents = figmaService.convertToDetectedComponents(detailedComponents);
        
        console.log(`Extracted ${detectedComponents.length} components from Figma design`);
        
        // If we don't have a node ID, try to get the first node from the file data
        if (!nodeId && fileData && fileData.document) {
          console.log('No node ID provided, attempting to use the first node from the file data');
          
          // Try to find the first frame or component in the document
          const findFirstNode = (node: any): string | null => {
            // Skip if node is null or undefined
            if (!node) {
              console.log('Node is null or undefined in findFirstNode');
              return null;
            }
            
            console.log('Checking node:', node.id, 'type:', node.type);
            
            // Check for visible content
            const isVisible = node.visible !== false; // Default to true if not specified
            
            // First, check if this is a valid node type that can be rendered
            if (isVisible && (
              node.type === 'FRAME' || 
              node.type === 'COMPONENT' || 
              node.type === 'INSTANCE' || 
              node.type === 'GROUP' || 
              node.type === 'CANVAS' || 
              node.type === 'PAGE'
            )) {
              // Check if the node has a non-zero size (if it has a bounding box)
              if (node.absoluteBoundingBox && 
                  node.absoluteBoundingBox.width > 0 && 
                  node.absoluteBoundingBox.height > 0) {
                console.log('Found valid node:', node.id, 'type:', node.type);
                return node.id;
              } else {
                console.log('Node has zero size or no bounding box:', node.id);
              }
            }
            
            // If this node isn't suitable, check its children
            if (node.children) {
              console.log('Node has children, count:', Array.isArray(node.children) ? node.children.length : 'not an array');
              
              // Check if children is an array
              if (Array.isArray(node.children)) {
                // First try to find FRAME or COMPONENT types (preferred)
                for (const child of node.children) {
                  if (child.type === 'FRAME' || child.type === 'COMPONENT') {
                    const foundId = findFirstNode(child);
                    if (foundId) return foundId;
                  }
                }
                
                // If no FRAME or COMPONENT found, try any other valid node type
                for (const child of node.children) {
                  const foundId = findFirstNode(child);
                  if (foundId) return foundId;
                }
              } else {
                console.warn('node.children is not an array in findFirstNode for node:', node.id || 'unknown');
                
                // Try to handle the case where children might be an object with numeric keys
                if (typeof node.children === 'object') {
                  try {
                    const childValues = Object.values(node.children);
                    
                    // First try to find FRAME or COMPONENT types (preferred)
                    for (const child of childValues) {
                      if ((child as any).type === 'FRAME' || (child as any).type === 'COMPONENT') {
                        const foundId = findFirstNode(child as any);
                        if (foundId) return foundId;
                      }
                    }
                    
                    // If no FRAME or COMPONENT found, try any other valid node type
                    for (const child of childValues) {
                      const foundId = findFirstNode(child as any);
                      if (foundId) return foundId;
                    }
                  } catch (error) {
                    console.error('Failed to process node.children as object:', error);
                  }
                }
              }
            }
            
            return null;
          };
          
          const firstNodeId = findFirstNode(fileData.document);
          
          if (firstNodeId) {
            console.log('Found first node ID:', firstNodeId);
            nodeId = firstNodeId;
          } else {
            console.error('Could not find any frames or components in the document');
            throw new Error('Could not find any frames or components in the document. Please try a different Figma file or specify a node ID.');
          }
        }
        
        if (!nodeId) {
          throw new Error('No node ID found and could not determine a default node. Please use a Figma URL with a specific frame.');
        }
        
        // Fetch the image for the node
        console.log('Fetching Figma image...');
        let imagesResponse;
        let imageUrl;
        let fetchSuccess = false;

        // Try different combinations of formats and scales if the first attempt fails
        const formats = ['png', 'svg', 'jpg'] as const;
        const scales = [2, 1, 3] as const;

        for (const format of formats) {
          if (fetchSuccess) break;
          
          for (const scale of scales) {
            try {
              console.log(`Attempting to fetch image with format: ${format}, scale: ${scale}`);
              imagesResponse = await figmaService.getFigmaImages(fileKey, [nodeId], format, scale);
              
              if (imagesResponse.images && imagesResponse.images[nodeId]) {
                imageUrl = imagesResponse.images[nodeId];
                console.log('Image URL received:', imageUrl.substring(0, 50) + '...');
                fetchSuccess = true;
                break;
              }
            } catch (fetchError) {
              console.warn(`Failed to fetch image with format: ${format}, scale: ${scale}`, fetchError);
              // Continue to the next combination
            }
          }
        }

        if (!fetchSuccess) {
          console.error('All attempts to fetch Figma image failed');
          throw new Error('Could not retrieve image from Figma API. The frame might not contain any visible content or you might not have access to this file.');
        }

        // Create an image element to load the image
        console.log('Loading image...');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        
        // Wait for the image to load
        await new Promise((resolve, reject) => {
          img.onload = () => {
            console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
            resolve(null);
          };
          img.onerror = (err) => {
            console.error('Error loading image:', err);
            reject(new Error('Failed to load the Figma image. The image might be too large or unavailable.'));
          };
          
          // Add a timeout to prevent hanging if the image doesn't load
          setTimeout(() => {
            reject(new Error('Timed out while loading the Figma image. Please try again or use a different frame.'));
          }, 30000); // 30 second timeout
        });
        
        // Create a canvas to convert the image to base64
        console.log('Converting image to base64...');
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not create canvas context for image processing.');
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Get base64 data URL
        const base64Image = canvas.toDataURL('image/png');
        console.log('Image converted to base64, length:', base64Image.length);
        
        // Update the page with the Figma design
        if (!currentPage) {
          throw new Error('No page is currently selected. Please create or select a page first.');
        }
        
        console.log('Updating page with Figma design...');
        // Update the page's base image
        updatePage(currentPage.id, { baseImage: base64Image });
        
        // Get current iterations for this page
        const currentIterations = iterationsMap[currentPage.id] || [];
        
        // Create a base iteration for this design
        const baseIteration: DesignIteration = {
          id: `figma-${currentPage.id}-${Date.now()}`,
          image: base64Image,
          label: 'Figma Design',
          iterationType: 'base',
          iterationNumber: currentIterations.length,
          position: { x: 0, y: 0 }, // Initialize position
          components: detectedComponents, // Store the detected components
          figmaData: {
            fileKey,
            nodeId,
            detailedComponents
          } // Store Figma-specific data
        };
        
        // If this is the first design being pasted (empty canvas)
        if (currentIterations.length === 0) {
          // Set iterations for this page to just the base iteration
          setIterationsMap(prev => ({
            ...prev,
            [currentPage.id]: [baseIteration]
          }));
        } else {
          // Calculate a position offset for the new design
          const offsetX = (currentIterations.length % 3) * 50;
          const offsetY = (currentIterations.length % 3) * 50;
          
          // Update position with offset
          baseIteration.position = { x: offsetX, y: offsetY };
          
          // Add the new iteration to the existing ones
          setIterationsMap(prev => ({
            ...prev,
            [currentPage.id]: [...(prev[currentPage.id] || []), baseIteration]
          }));
        }
        
        // Set the detected components for the current page
        setDetectedComponents(detectedComponents);
        
        // Select the new iteration
        setSelectedIteration(baseIteration);
        
        // Reset canvas position and scale to center the new design
        setTimeout(() => {
          resetCanvas();
          console.log('Canvas reset to center the new design');
        }, 100);
        
        console.log('Figma design loaded successfully!');
        setIsLoadingFigma(false);
      } catch (error) {
        console.error('Error processing Figma URL:', error);
        // Log the full error object for debugging
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
        
        // Set the error message to be displayed to the user
        let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Add helpful suggestions based on the error message
        if (errorMessage.includes('Could not retrieve image from Figma API')) {
          errorMessage += '\n\nPossible solutions:\n' +
            '1. Make sure the Figma frame contains visible content\n' +
            '2. Try copying a link to a specific frame by right-clicking on it in Figma and selecting "Copy Link"\n' +
            '3. Check that your Figma access token has permission to access this file\n' +
            '4. Ensure the file is published and accessible';
        } else if (errorMessage.includes('file not found') || errorMessage.includes('Access denied')) {
          errorMessage += '\n\nPossible solutions:\n' +
            '1. Check that your Figma access token is valid and has permission to access this file\n' +
            '2. Make sure the file is published and accessible\n' +
            '3. Try copying the link again from Figma';
        }
        
        setFigmaError(errorMessage);
        console.log('Set figmaError to:', errorMessage);
        
        // Check if the error is being displayed
        console.log('Current figmaError state:', figmaError);
        
        setIsLoadingFigma(false);
      }
    } else {
      console.log('Not a Figma URL, checking for image paste');
      // Handle image paste
      const items = e.clipboardData?.items;
      console.log('Clipboard items:', items ? items.length : 'none');
      
      if (items) {
        for (let i = 0; i < items.length; i++) {
          console.log(`Item ${i} type:`, items[i].type);
          if (items[i].type.indexOf('image') !== -1) {
            console.log('Image detected in clipboard');
            const blob = items[i].getAsFile();
            if (blob) {
              console.log('Got file blob, reading as data URL');
              const reader = new FileReader();
              reader.onload = (event) => {
                const base64data = event.target?.result as string;
                console.log('Image loaded as base64, length:', base64data ? base64data.length : 0);
                if (currentPage) {
                  // Update the page's base image
                  updatePage(currentPage.id, { baseImage: base64data });
                  
                  // Get current iterations for this page
                  const currentIterations = iterationsMap[currentPage.id] || [];
                  
                  // If this is the first design being pasted (empty canvas)
                  if (currentIterations.length === 0) {
                    // Create base iteration
                    const baseIteration: DesignIteration = {
                      id: `base-${currentPage.id}-${Date.now()}`,
                      image: base64data,
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
                      image: base64data,
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
                  setTimeout(() => {
                    resetCanvas();
                  }, 100);
                }
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    }
  }, [currentPage, updatePage, iterationsMap, resetCanvas]);

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
      
      // Clear any pending timers
      if (handleDesignMouseMove.debounceTimer) {
        clearTimeout(handleDesignMouseMove.debounceTimer);
        handleDesignMouseMove.debounceTimer = null;
      }
      
      // Reset cursor if needed
      document.body.style.cursor = '';
    };
  }, [draggingDesign, isDragging, handleDesignMouseMove, handleCanvasMouseMove, handleDesignMouseUp, handleCanvasMouseUp]);

  // Add paste event listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [currentPage, updatePage, iterationsMap, resetCanvas, handlePaste]);

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
          <DesignContainer>
            {iterations.length > 0 ? (
              iterations.map((iteration) => (
                <DesignCard 
                  key={iteration.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIteration(iteration);
                  }}
                  onMouseDown={(e) => handleDesignMouseDown(e, iteration.id)}
                  tabIndex={-1}
                  data-iteration-id={iteration.id}
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
                  
                  {/* Add Figma indicator for designs with Figma data */}
                  {iteration.figmaData && (
                    <FigmaIndicator>
                      <span role="img" aria-label="Figma">🖼️</span>
                      Figma
                    </FigmaIndicator>
                  )}
                  
                  <DesignImage src={iteration.image} alt={iteration.label} />
                  
                  {/* Add component actions if this is a Figma design with components */}
                  {iteration.figmaData && iteration.components && iteration.components.length > 0 && (
                    <ComponentActions>
                      <ComponentCount>
                        {iteration.components.length} components detected
                      </ComponentCount>
                    </ComponentActions>
                  )}
                  
                  {selectedIteration?.id === iteration.id && (
                    <DesignActions>
                      <ActionButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAnalysis();
                        }}
                      >
                        <span role="img" aria-label="Analyze">🔍</span> Analyze
                      </ActionButton>
                      
                      <ActionButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFigmaExport();
                        }}
                      >
                        <span role="img" aria-label="Export">📤</span> Export
                      </ActionButton>
                    </DesignActions>
                  )}
                </DesignCard>
              ))
            ) : (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: '#666',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                padding: '20px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ marginBottom: '10px', color: '#333' }}>Canvas Ready</h3>
                <p style={{ marginBottom: '15px' }}>
                  <strong>Paste</strong> an image or Figma link (Ctrl+V / Cmd+V)
                </p>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#999',
                  marginBottom: '10px'
                }}>
                  <span role="img" aria-label="Paste">📋</span>
                  <span style={{ margin: '0 10px' }}>or</span>
                  <span role="img" aria-label="Figma">🖼️</span>
                </div>
                {figmaError && (
                  <div style={{ 
                    backgroundColor: '#ffebee', 
                    color: '#d32f2f', 
                    padding: '10px', 
                    borderRadius: '4px',
                    marginTop: '10px',
                    border: '1px solid #ffcdd2'
                  }}>
                    <strong>Error:</strong> {figmaError}
                  </div>
                )}
                {/* Debug info */}
                <div style={{ 
                  marginTop: '20px', 
                  fontSize: '12px', 
                  color: '#666', 
                  textAlign: 'left',
                  backgroundColor: '#f5f5f5',
                  padding: '10px',
                  borderRadius: '4px'
                }}>
                  <p><strong>Debug Info:</strong></p>
                  <p>isLoadingFigma: {isLoadingFigma ? 'true' : 'false'}</p>
                  <p>figmaError: {figmaError || 'none'}</p>
                  <p>Try pasting a Figma URL with one of these formats:</p>
                  <p>- https://www.figma.com/file/FILEID/FILENAME</p>
                  <p>- https://www.figma.com/design/FILEID/FILENAME</p>
                  <p><em>Note: Adding ?node-id=NODEID to the URL will fetch a specific frame (recommended)</em></p>
                </div>
              </div>
            )}
            
            {/* Add the FigmaComponentsView when a Figma design is selected */}
            {selectedIteration && selectedIteration.figmaData && selectedIteration.components && (
              <FigmaComponentsView 
                iteration={selectedIteration}
                canvasScale={canvasScale}
                canvasPosition={canvasPosition}
              />
            )}
          </DesignContainer>
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

      {selectedIteration && (
        <SelectionHint>
          <HintIcon>👇</HintIcon>
          Drag to move
        </SelectionHint>
      )}
      
      {!selectedIteration && iterations.length > 0 && (
        <SelectionHint>
          <HintIcon>👆</HintIcon>
          Click a design to select it
        </SelectionHint>
      )}

      {/* Error message */}
      {error && (
        <ErrorOverlay>
          <ErrorMessage>{error}</ErrorMessage>
          <ActionButton onClick={() => setError(null)}>
            Dismiss
          </ActionButton>
        </ErrorOverlay>
      )}
          
      {isLoading && (
        <LoadingOverlay>
          <div className="spinner"></div>
          <p>Generating improved design...</p>
        </LoadingOverlay>
      )}
    </CanvasContainer>
  );
}; 