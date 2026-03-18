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
        className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exportar caso"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{isExporting ? 'Exportando...' : 'Exportar'}</span>
      </button>

      {/* Dropdown de opciones de exportación */}
      {showExportMenu && !isExporting && (
        <div className="absolute right-0 mt-2 w-40 bg-[#0A3866]/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
          <button
            onClick={handleExportPDF}
            className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/10 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-white">PDF</span>
          </button>
          <button
            onClick={handleExportDOCX}
            className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-[#34B6D8]" />
            <span className="text-sm font-medium text-white">Word</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
