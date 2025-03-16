import React from 'react';

// Base64 encoded SVG logos
const LOGO_SVG_BASE64 = "PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMzZMMjQgOEwzNiAzNkwyNCAyNEwxMiAzNloiIGZpbGw9IiM0QTkwRTIiIHN0cm9rZT0iIzRBOTBFMiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTggMzJMMjAgNEwzMiAzMkwyMCAyMEw4IDMyWiIgZmlsbD0iIzJDNTI4MiIgc3Ryb2tlPSIjMkM1MjgyIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4g";
const COTERATE_LOGO_BASE64 = "PHN2ZyB3aWR0aD0iMTc4IiBoZWlnaHQ9IjE3OCIgdmlld0JveD0iMCAwIDE3OCAxNzgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0zNC42MTExIDQ5LjQ0NTNMNjkuNTY4MyAxMzMuMzUzTDgxLjk3ODkgOTYuODEzMUwxMTguNTE4IDg0LjQwMjVMMzQuNjExMSA0OS40NDUzWiIgZmlsbD0iIzgwOEM5RiIgc3Ryb2tlPSIjNEM2Mzg2IiBzdHJva2Utd2lkdGg9IjkuODg4ODkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNNjQuMjc3NyA0NC40OTEyTDk5LjIzNDkgMTI4LjM5OEwxMTEuNjQ1IDkxLjg1OUwxNDguMTg1IDc5LjQ0ODRMNjQuMjc3NyA0NC40OTEyWiIgZmlsbD0iI0FDQzZGMSIgc3Ryb2tlPSIjM0M3OURBIiBzdHJva2Utd2lkdGg9IjkuODg4ODkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K";

// Logo component that renders the SVG directly
export const InlineLogo: React.FC<{ className?: string; alt?: string }> = ({ className, alt = "Coterate" }) => {
  return (
    <img 
      src={`data:image/svg+xml;base64,${COTERATE_LOGO_BASE64}`} 
      alt={alt} 
      className={className}
      onError={(e) => {
        // Fallback to alternative logo if main logo fails to load
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.src = `data:image/svg+xml;base64,${LOGO_SVG_BASE64}`;
      }}
    />
  );
};

// Alternative logo component
export const InlineAlternativeLogo: React.FC<{ className?: string; alt?: string }> = ({ className, alt = "Coterate" }) => {
  return (
    <img 
      src={`data:image/svg+xml;base64,${LOGO_SVG_BASE64}`} 
      alt={alt} 
      className={className}
    />
  );
};

// Export the base64 strings for direct use
export const logoDataUrl = `data:image/svg+xml;base64,${LOGO_SVG_BASE64}`;
export const coterateLogoDataUrl = `data:image/svg+xml;base64,${COTERATE_LOGO_BASE64}`; 