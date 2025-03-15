import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { usePageContext } from '../contexts/PageContext';
import { aiService } from '../services/aiService';
import { DesignIteration } from '../types';

const PanelContainer = styled.div`
  position: absolute;
  top: var(--header-height);
  right: 0;
  width: 400px;
  height: calc(100vh - var(--header-height));
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #777;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  
  &:hover {
    color: #333;
  }
`;

const AnalysisContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  font-family: 'Plus Jakarta Sans', sans-serif;
  
  pre {
    white-space: pre-wrap;
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    overflow-x: auto;
  }
  
  h4 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  
  ul {
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
`;

const ComponentCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const ComponentHeader = styled.div`
  background-color: #f5f7fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ComponentType = styled.h5`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const ComponentBody = styled.div`
  padding: 16px;
`;

const ImprovementProperty = styled.div`
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
`;

const PropertyName = styled.div`
  width: 120px;
  font-weight: 500;
  color: #555;
`;

const PropertyValue = styled.div`
  flex: 1;
  color: #333;
`;

const ColorSwatch = styled.span<{ color: string }>`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background-color: ${props => props.color};
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const OverallAnalysis = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#4a90e2' : 'transparent'};
  color: ${props => props.active ? '#4a90e2' : '#555'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #4a90e2;
  }
`;

interface AnalysisPanelProps {
  selectedIteration: DesignIteration;
  onClose: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  selectedIteration, 
  onClose 
}) => {
  const { currentPage } = usePageContext();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'components'>('overview');

  // Load the analysis when the component mounts
  useEffect(() => {
    if (selectedIteration && selectedIteration.analysis) {
      setAnalysis(selectedIteration.analysis);
    }
  }, [selectedIteration]);

  // Try to parse the analysis if it's JSON
  let parsedAnalysis: any;
  try {
    parsedAnalysis = analysis ? JSON.parse(analysis) : null;
  } catch (e) {
    // If it's not valid JSON, just use the raw text
    parsedAnalysis = null;
  }
  
  // Check if we have component data
  const hasComponentData = selectedIteration?.components && selectedIteration.components.length > 0;
  
  // Format color values for display
  const formatColorValue = (value: any) => {
    if (typeof value === 'string' && value.startsWith('#')) {
      return (
        <>
          <ColorSwatch color={value} />
          {value}
        </>
      );
    }
    return value;
  };
  
  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>Design Analysis</PanelTitle>
        <CloseButton onClick={onClose}>×</CloseButton>
      </PanelHeader>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Tab>
        <Tab 
          active={activeTab === 'components'} 
          onClick={() => setActiveTab('components')}
        >
          Components
        </Tab>
      </TabContainer>
      
      <AnalysisContent>
        {activeTab === 'overview' && (
          <>
            {parsedAnalysis ? (
              <>
                <OverallAnalysis>
                  <h4>Design Iteration Summary</h4>
                  {parsedAnalysis.summary ? (
                    <p>{parsedAnalysis.summary}</p>
                  ) : (
                    <p>This iteration improves the UI design with targeted enhancements to {parsedAnalysis.componentCount || 'multiple'} components while preserving the original layout and structure.</p>
                  )}
                  
                  {parsedAnalysis.componentCount && (
                    <p><strong>{parsedAnalysis.componentCount}</strong> components were analyzed and improved.</p>
                  )}
                </OverallAnalysis>
                
                <h4>Analysis Details</h4>
                <pre>{analysis}</pre>
              </>
            ) : (
              <pre>{analysis}</pre>
            )}
          </>
        )}
        
        {activeTab === 'components' && (
          <>
            {hasComponentData ? (
              <>
                <h4>Component Improvements</h4>
                {selectedIteration.components?.map((component, index) => (
                  <ComponentCard key={index}>
                    <ComponentHeader>
                      <ComponentType>{component.type}</ComponentType>
                    </ComponentHeader>
                    <ComponentBody>
                      {Object.entries(component.attributes).map(([key, value]) => (
                        <ImprovementProperty key={key}>
                          <PropertyName>{key}:</PropertyName>
                          <PropertyValue>
                            {formatColorValue(value)}
                          </PropertyValue>
                        </ImprovementProperty>
                      ))}
                    </ComponentBody>
                  </ComponentCard>
                ))}
              </>
            ) : parsedAnalysis && parsedAnalysis.improvements ? (
              <>
                <h4>Component Improvements</h4>
                {parsedAnalysis.improvements.map((improvement: any, index: number) => (
                  <ComponentCard key={index}>
                    <ComponentHeader>
                      <ComponentType>{improvement.componentType}</ComponentType>
                    </ComponentHeader>
                    <ComponentBody>
                      <p>{improvement.reasoning}</p>
                      {improvement.improvements && Object.keys(improvement.improvements).length > 0 && (
                        <>
                          <h4>Applied Changes</h4>
                          {Object.entries(improvement.improvements).map(([key, value]: [string, any]) => (
                            <ImprovementProperty key={key}>
                              <PropertyName>{key}:</PropertyName>
                              <PropertyValue>
                                {formatColorValue(value)}
                              </PropertyValue>
                            </ImprovementProperty>
                          ))}
                        </>
                      )}
                    </ComponentBody>
                  </ComponentCard>
                ))}
              </>
            ) : (
              <p>No component-level data available for this iteration.</p>
            )}
          </>
        )}
      </AnalysisContent>
    </PanelContainer>
  );
}; 