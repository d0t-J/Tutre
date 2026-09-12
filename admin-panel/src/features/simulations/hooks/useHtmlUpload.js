import { useState } from 'react';
import { toast } from 'sonner';
import { extractDescription } from '../utils/extractDescription';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB — the HTML is stored in a TEXT column and fetched whole

export function useHtmlUpload(state) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);

  const processHtmlFile = (file) => {
    if (!file) return;

    if (!/\.html?$/i.test(file.name)) {
      toast.error('Please upload an HTML file (.html or .htm).');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Maximum size is 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const htmlContent = reader.result;
      if (typeof htmlContent !== 'string' || !htmlContent.trim()) {
        toast.error('The selected file is empty.');
        return;
      }
      if (!/<[a-z][\s\S]*>/i.test(htmlContent)) {
        toast.error('The selected file does not appear to contain HTML markup.');
        return;
      }

      const { cleanedHtml, description } = extractDescription(htmlContent);

      state.setSaveSuccess(false);
      state.setIsLoadedFromSaved(false);
      state.setLoadedSimId(null);
      state.setLoadedTopicId(null);
      state.setGeneratedDescription(description);
      state.setGeneratedHtml(cleanedHtml);
      setUploadedFileName(file.name);
      toast.success(`Loaded "${file.name}" — preview it, then publish when ready.`);
    };
    reader.onerror = () => toast.error('Failed to read the file.');
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    processHtmlFile(e.target.files?.[0]);
    e.target.value = ''; // allow re-selecting the same file
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
    processHtmlFile(e.dataTransfer.files?.[0]);
  };

  const handleRemoveFile = () => {
    state.setGeneratedHtml('');
    state.setGeneratedDescription('');
    setUploadedFileName(null);
  };

  return {
    isDragging,
    uploadedFileName,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
  };
}
