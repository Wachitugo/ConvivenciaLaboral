import { useState } from 'react';

export default function useChatFiles() {
  const [chatFiles, setChatFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileList, setShowFileList] = useState(false);

  const addFiles = (files) => {
    setChatFiles(prev => [...prev, ...files]);
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    setShowFileList(false);
  };

  const closeFilePreview = () => {
    setSelectedFile(null);
  };

  const handleBackToFileList = () => {
    setSelectedFile(null);
    setShowFileList(true);
  };

  const toggleFileList = () => {
    setShowFileList(!showFileList);
    if (!showFileList) {
      setSelectedFile(null);
    }
  };

  const closeFileList = () => {
    setShowFileList(false);
  };

  return {
    chatFiles,
    selectedFile,
    showFileList,
    addFiles,
    handleFileClick,
    closeFilePreview,
    handleBackToFileList,
    toggleFileList,
    closeFileList,
    setChatFiles // Exposing setter for sync
  };
}
