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
  
  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>Analysis</PanelTitle>
        <CloseButton onClick={onClose}>×</CloseButton>
      </PanelHeader>
      
      <AnalysisContent>
        {parsedAnalysis ? (
          <>
            <div>
              <h4>Components Analyzed</h4>
              <p>{parsedAnalysis.componentCount} components were analyzed</p>
            </div>
            
            <div>
              <h4>Improvements</h4>
              <ul>
                {parsedAnalysis.improvements?.map((improvement: any, index: number) => (
                  <li key={index}>
                    <strong>{improvement.componentType}</strong>
                    <p>{improvement.reasoning}</p>
                    {improvement.improvements && Object.keys(improvement.improvements).length > 0 && (
                      <pre>
                        {Object.entries(improvement.improvements)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join('\n')}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            {parsedAnalysis.summary && (
              <div>
                <h4>Summary</h4>
                <p>{parsedAnalysis.summary}</p>
              </div>
            )}
          </>
        ) : (
          <pre>{analysis}</pre>
        )}
      </AnalysisContent>
    </PanelContainer>
  );
}; 