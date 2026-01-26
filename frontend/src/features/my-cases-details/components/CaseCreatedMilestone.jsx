import { formatearFecha } from './timelineConstants';

function CaseCreatedMilestone({ caseData, files, onFileChange, onRemoveFile }) {
  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const fileObjects = uploadedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      file: file,
      source: 'protocolo'
    }));

    onFileChange([...files, ...fileObjects]);
  };

  return (
    <div className="">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-800">Caso Creado</h3>
            <span className="text-xs text-gray-500">
              {formatearFecha(caseData.createdAt || new Date().toISOString())}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Caso inscrito en el sistema
          </p>

       

        </div>
      </div>
    </div>
  );
}

export default CaseCreatedMilestone;
