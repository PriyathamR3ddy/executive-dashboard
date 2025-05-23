import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Key, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SmartsheetInput: React.FC = () => {
  const { loadSmartsheetData } = useDashboardStore();
  const [token, setToken] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleConnect = async () => {
    if (!token || !sheetId) {
      setError('Please provide both API token and Sheet ID');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await loadSmartsheetData({ token, sheetId });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error connecting to Smartsheet:', err);
      setError(err.message || 'Failed to connect to Smartsheet. Check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-card">
      <h3 className="text-lg font-semibold mb-4 text-neutral-800">Connect to Smartsheet</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="api-token" className="block text-sm font-medium text-neutral-700 mb-1">
            Smartsheet API Token
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key size={16} className="text-neutral-400" />
            </div>
            <input
              id="api-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your API token"
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            You can generate an API token in your Smartsheet account settings
          </p>
        </div>
        
        <div>
          <label htmlFor="sheet-id" className="block text-sm font-medium text-neutral-700 mb-1">
            Sheet ID
          </label>
          <input
            id="sheet-id"
            type="text"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            className="block w-full px-4 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter the Sheet ID"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Find the Sheet ID in the URL of your Smartsheet
          </p>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 rounded-md flex items-start">
            <AlertCircle size={16} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium
                    ${isLoading 
                      ? 'bg-neutral-400 cursor-not-allowed' 
                      : 'bg-primary-500 hover:bg-primary-600 transition-colors'}`}
        >
          {isLoading ? 'Connecting...' : 'Connect to Smartsheet'}
        </button>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium text-neutral-700 mb-2">Instructions:</h4>
        <ol className="text-sm text-neutral-600 list-decimal pl-5 space-y-1">
          <li>Go to your Smartsheet Account settings</li>
          <li>Navigate to "Personal Settings" {'>'} "API Access"</li>
          <li>Generate a new access token</li>
          <li>Copy the token and paste it above</li>
          <li>Open your sheet and copy the Sheet ID from the URL</li>
        </ol>
      </div>
    </div>
  );
};

export default SmartsheetInput;