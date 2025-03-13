import { useEffect } from 'react';

interface UseClipboardOptions {
  onImagePaste: (imageDataUrl: string) => void;
}

export const useClipboard = ({ onImagePaste }: UseClipboardOptions) => {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const imageDataUrl = e.target?.result as string;
              if (imageDataUrl) {
                onImagePaste(imageDataUrl);
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
  }, [onImagePaste]);
}; 