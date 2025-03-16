import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import * as aiComponentService from '../services/aiComponentService';
import { htmlToImageService } from '../services/htmlToImageService';
import { AnalysisPanel } from './AnalysisPanel';
import { usePageContext } from '../contexts/PageContext';
import { generateImprovedUIDesign, aiService } from '../services/aiService';
import { FigmaExport } from './FigmaExport';
import { DesignIteration, DetectedComponent } from '../types';
import { InlineLogo } from './LogoComponent';
// Import logo files directly
import logoSvg from '../assets/logo.svg';
import coterateLogo from '../assets/coterate-logo.svg';

// Global style to remove focus outlines and borders 

<CanvasHeader>
  <Logo>
    <LogoIcon 
      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc4IiBoZWlnaHQ9IjE3OCIgdmlld0JveD0iMCAwIDE3OCAxNzgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0zNC42MTExIDQ5LjQ0NTNMNjkuNTY4MyAxMzMuMzUzTDgxLjk3ODkgOTYuODEzMUwxMTguNTE4IDg0LjQwMjVMMzQuNjExMSA0OS40NDUzWiIgZmlsbD0iIzgwOEM5RiIgc3Ryb2tlPSIjNEM2Mzg2IiBzdHJva2Utd2lkdGg9IjkuODg4ODkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNNjQuMjc3NyA0NC40OTEyTDk5LjIzNDkgMTI4LjM5OEwxMTEuNjQ1IDkxLjg1OUwxNDguMTg1IDc5LjQ0ODRMNjQuMjc3NyA0NC40OTEyWiIgZmlsbD0iI0FDQzZGMSIgc3Ryb2tlPSIjM0M3OURBIiBzdHJva2Utd2lkdGg9IjkuODg4ODkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K" 
      alt="Coterate" 
      onError={(e) => {
        // Fallback to alternative logo if main logo fails to load
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMzZMMjQgOEwzNiAzNkwyNCAyNEwxMiAzNloiIGZpbGw9IiM0QTkwRTIiIHN0cm9rZT0iIzRBOTBFMiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTggMzJMMjAgNEwzMiAzMkwyMCAyMEw4IDMyWiIgZmlsbD0iIzJDNTI4MiIgc3Ryb2tlPSIjMkM1MjgyIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4g";
      }} 
    />
    Coterate
  </Logo>
  
  <HeaderTabs>
  </HeaderTabs>
</CanvasHeader> 