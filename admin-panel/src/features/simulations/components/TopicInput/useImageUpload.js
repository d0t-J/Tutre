import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useImageUpload(setImageBase64) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const targetTag = e.target.tagName.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') {
        if (!e.clipboardData.files || e.clipboardData.files.length === 0) return;
      }
      
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          const reader = new FileReader();
          reader.onloadend = () => setImageBase64(reader.result);
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [setImageBase64]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePasteClick = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        for (const imageType of imageTypes) {
          const blob = await clipboardItem.getType(imageType);
          const reader = new FileReader();
          reader.onloadend = () => setImageBase64(reader.result);
          reader.readAsDataURL(blob);
          return;
        }
      }
      toast.error('No image found in clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Unable to read clipboard. You can also use Ctrl+V to paste.');
    }
  };

  return { isDragging, handleImageUpload, handleDragOver, handleDragLeave, handleDrop, handlePasteClick };
}
