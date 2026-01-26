import { useState, useEffect, useRef } from 'react';
import { FileText, Download } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { exportToDOCX } from '../utils/docxExport';

function ExportButton({ caseData, schoolData, documents = [] }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      await exportToPDF(caseData, schoolData, documents);
    } catch (error) {
      // Error handling is already done in the utility function
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDOCX = async () => {
    setShowExportMenu(false);
    setIsExporting(true);
    try {
      await exportToDOCX(caseData, schoolData, documents);
    } catch (error) {
      // Error handling is already done in the utility function
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={exportMenuRef} style={{ fontFamily: "'Poppins', sans-serif" }}>
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        disabled={isExporting}
        className="flex items-center border border-gray-300 gap-1 px-2 py-1.5 bg-gray-100 text-gray-600 rounded-xl shadow-sm shadow-cyan-600/20 hover:shadow-lg hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exportar caso"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-semibold">
          {isExporting ? 'Exportando...' : 'Exportar'}
        </span>
      </button>

      {/* Dropdown de opciones de exportación */}
      {showExportMenu && !isExporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
          <button
            onClick={handleExportPDF}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-gray-800">Pdf</span>
          </button>
          <button
            onClick={handleExportDOCX}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-800">Word</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
