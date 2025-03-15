import React, { useState } from 'react';
import styled from 'styled-components';
import { DetectedComponent, DesignIteration } from '../types';

// Styled components
const ComponentsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const ComponentOverlay = styled.div<{
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  componentType: string;
}>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  border: 2px solid ${props => getColorForComponentType(props.componentType, props.isSelected)};
  background-color: ${props => getBackgroundForComponentType(props.componentType, props.isSelected)};
  border-radius: 2px;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-width: 3px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }
`;

const ComponentLabel = styled.div<{
  componentType: string;
  isSelected: boolean;
}>`
  position: absolute;
  top: -20px;
  left: 0;
  background-color: ${props => getColorForComponentType(props.componentType, props.isSelected)};
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  z-index: 10;
`;

const ComponentDetails = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const DetailItem = styled.div`
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  font-weight: 600;
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
`;

const DetailValue = styled.div`
  font-size: 12px;
  color: #333;
  word-break: break-word;
`;

const ToggleButton = styled.button`
  position: fixed;
  bottom: 20px;
  left: 20px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  z-index: 1000;
  
  &:hover {
    background-color: #3367d6;
  }
`;

// Helper functions
const getColorForComponentType = (type: string, isSelected: boolean): string => {
  if (isSelected) return '#ff5722';
  
  switch (type.toLowerCase()) {
    case 'button':
      return '#4285f4';
    case 'text':
      return '#0f9d58';
    case 'input':
      return '#f4b400';
    case 'image':
      return '#db4437';
    case 'container':
    case 'frame':
      return '#673ab7';
    case 'icon':
      return '#00bcd4';
    case 'card':
      return '#ff9800';
    case 'navigation':
      return '#795548';
    case 'header':
      return '#607d8b';
    case 'footer':
      return '#9e9e9e';
    default:
      return '#9e9e9e';
  }
};

const getBackgroundForComponentType = (type: string, isSelected: boolean): string => {
  if (isSelected) return 'rgba(255, 87, 34, 0.1)';
  
  switch (type.toLowerCase()) {
    case 'button':
      return 'rgba(66, 133, 244, 0.1)';
    case 'text':
      return 'rgba(15, 157, 88, 0.1)';
    case 'input':
      return 'rgba(244, 180, 0, 0.1)';
    case 'image':
      return 'rgba(219, 68, 55, 0.1)';
    case 'container':
    case 'frame':
      return 'rgba(103, 58, 183, 0.1)';
    case 'icon':
      return 'rgba(0, 188, 212, 0.1)';
    case 'card':
      return 'rgba(255, 152, 0, 0.1)';
    case 'navigation':
      return 'rgba(121, 85, 72, 0.1)';
    case 'header':
      return 'rgba(96, 125, 139, 0.1)';
    case 'footer':
      return 'rgba(158, 158, 158, 0.1)';
    default:
      return 'rgba(158, 158, 158, 0.1)';
  }
};

interface FigmaComponentsViewProps {
  iteration: DesignIteration;
  canvasScale: number;
  canvasPosition: { x: number, y: number };
}

const FigmaComponentsView: React.FC<FigmaComponentsViewProps> = ({
  iteration,
  canvasScale,
  canvasPosition
}) => {
  const [showComponents, setShowComponents] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<DetectedComponent | null>(null);
  
  // If no components or figmaData, don't render anything
  if (!iteration.components || !iteration.figmaData) {
    return null;
  }
  
  const toggleComponentsVisibility = () => {
    setShowComponents(!showComponents);
  };
  
  const handleComponentClick = (component: DetectedComponent) => {
    setSelectedComponent(component === selectedComponent ? null : component);
  };
  
  return (
    <>
      <ToggleButton onClick={toggleComponentsVisibility}>
        {showComponents ? 'Hide Components' : 'Show Components'}
      </ToggleButton>
      
      {showComponents && (
        <ComponentsContainer>
          {iteration.components.map((component) => {
            // Skip components without valid bounding boxes
            if (!component.boundingBox || 
                component.boundingBox.width <= 0 || 
                component.boundingBox.height <= 0) {
              return null;
            }
            
            const isSelected = selectedComponent?.id === component.id;
            
            return (
              <ComponentOverlay
                key={component.id}
                x={component.boundingBox.x}
                y={component.boundingBox.y}
                width={component.boundingBox.width}
                height={component.boundingBox.height}
                isSelected={isSelected}
                componentType={component.type}
                onClick={() => handleComponentClick(component)}
              >
                <ComponentLabel
                  componentType={component.type}
                  isSelected={isSelected}
                >
                  {component.type} {component.attributes?.name ? `- ${component.attributes.name}` : ''}
                </ComponentLabel>
              </ComponentOverlay>
            );
          })}
        </ComponentsContainer>
      )}
      
      {selectedComponent && (
        <ComponentDetails>
          <DetailItem>
            <DetailLabel>Component Type</DetailLabel>
            <DetailValue>{selectedComponent.type}</DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Name</DetailLabel>
            <DetailValue>{selectedComponent.attributes?.name || 'Unnamed'}</DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Position</DetailLabel>
            <DetailValue>
              X: {selectedComponent.boundingBox.x.toFixed(2)}, 
              Y: {selectedComponent.boundingBox.y.toFixed(2)}
            </DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Size</DetailLabel>
            <DetailValue>
              Width: {selectedComponent.boundingBox.width.toFixed(2)}, 
              Height: {selectedComponent.boundingBox.height.toFixed(2)}
            </DetailValue>
          </DetailItem>
          
          {selectedComponent.attributes?.text && (
            <DetailItem>
              <DetailLabel>Text Content</DetailLabel>
              <DetailValue>{selectedComponent.attributes.text}</DetailValue>
            </DetailItem>
          )}
          
          {selectedComponent.attributes?.backgroundColor && (
            <DetailItem>
              <DetailLabel>Background Color</DetailLabel>
              <DetailValue>{selectedComponent.attributes.backgroundColor}</DetailValue>
            </DetailItem>
          )}
          
          {selectedComponent.attributes?.textColor && (
            <DetailItem>
              <DetailLabel>Text Color</DetailLabel>
              <DetailValue>{selectedComponent.attributes.textColor}</DetailValue>
            </DetailItem>
          )}
          
          {selectedComponent.attributes?.borderRadius !== undefined && (
            <DetailItem>
              <DetailLabel>Border Radius</DetailLabel>
              <DetailValue>{selectedComponent.attributes.borderRadius}px</DetailValue>
            </DetailItem>
          )}
          
          {selectedComponent.attributes?.fontSize !== undefined && (
            <DetailItem>
              <DetailLabel>Font Size</DetailLabel>
              <DetailValue>{selectedComponent.attributes.fontSize}px</DetailValue>
            </DetailItem>
          )}
          
          {selectedComponent.attributes?.padding && (
            <DetailItem>
              <DetailLabel>Padding</DetailLabel>
              <DetailValue>{selectedComponent.attributes.padding}</DetailValue>
            </DetailItem>
          )}
          
          <DetailItem>
            <DetailLabel>Figma Type</DetailLabel>
            <DetailValue>{selectedComponent.attributes?.figmaType || 'Unknown'}</DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Figma ID</DetailLabel>
            <DetailValue>{selectedComponent.attributes?.figmaId || 'Unknown'}</DetailValue>
          </DetailItem>
        </ComponentDetails>
      )}
    </>
  );
};

export default FigmaComponentsView; 