import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDashboardStore } from '../../store/dashboardStore';
import { Upload, File, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FileUpload: React.FC = () => {
  const { loadExcelData } = useDashboardStore();
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    // Check if file is JSON
    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result;
        
        if (typeof fileContent === 'string') {
          // For JSON files
          const jsonData = JSON.parse(fileContent);
          loadExcelData(jsonData);
          // Navigate to dashboard after successful load
          navigate('/dashboard');
        } else {
          setError('Could not read the file content');
        }
      } catch (error) {
        console.error('Error reading file:', error);
        setError('Failed to parse the uploaded file');
      }
    };
    
    reader.onerror = () => {
      setError('Error reading the file');
    };
    
    reader.readAsText(file);
  }, [loadExcelData, navigate]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1
  });
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-card">
      <h3 className="text-lg font-semibold mb-4 text-neutral-800">Upload Project Data</h3>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-md p-8 text-center transition-colors
                   ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'}`}
      >
        <input {...getInputProps()} />
        <Upload size={40} className={`mx-auto mb-4 ${isDragActive ? 'text-primary-500' : 'text-neutral-400'}`} />
        
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop your file here</p>
        ) : (
          <>
            <p className="text-neutral-600">Drag and drop your JSON file here</p>
            <p className="text-neutral-500 text-sm mt-2">or</p>
            <button className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors">
              Browse Files
            </button>
          </>
        )}
        <p className="text-xs text-neutral-500 mt-4">Supported format: .json</p>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-md flex items-start">
          <AlertCircle size={16} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="mt-4">
        <h4 className="text-sm font-medium text-neutral-700 mb-2">Before you begin:</h4>
        <ul className="text-sm text-neutral-600 list-disc pl-5 space-y-1">
          <li>Ensure your data is in JSON format</li>
          <li>Verify that your data includes all required fields</li>
          <li>For large files, processing may take a moment</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;