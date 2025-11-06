import { useProgress } from "../hooks/useProgress";


const GlobalProgressBar = () => {
  const { progress, progressLogs, isExpanded, toggleExpanded, clearProgress } = useProgress();

  if (!progress.show) return null;

  const successCount = progressLogs.filter(log => log.type === 'success').length;
  const errorCount = progressLogs.filter(log => log.type === 'error').length;
  const skippedCount = progressLogs.filter(log => log.type === 'skipped').length;

  return (
    <>
      {/* Minimized Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-2xl border-t-2 border-blue-500">
        <div 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={toggleExpanded}
        >
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {progress.status === 'processing' && (
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {progress.status === 'complete' && (
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {progress.status === 'error' && (
                    <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className="font-semibold text-gray-700">Report Generation</span>
                </div>
                <span className="text-sm text-gray-600">
                  {progress.current} / {progress.total} students
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {progress.percentage}%
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {progress.total > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600">✓ {successCount}</span>
                    <span className="text-red-600">✗ {errorCount}</span>
                    <span className="text-yellow-600">⊘ {skippedCount}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded();
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <svg 
                      className={`h-5 w-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  
                  {progress.status === 'complete' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearProgress();
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progress.status === 'complete'
                    ? 'bg-green-500'
                    : progress.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-600 mt-1">{progress.message}</p>
          </div>
        </div>

        {/* Expanded Details Panel */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 max-h-96 overflow-hidden flex flex-col">
            <div className="px-6 py-3 bg-white border-b">
              <h4 className="font-semibold text-gray-800">Activity Log</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
              {progressLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Waiting for updates...</p>
              ) : (
                progressLogs.slice().reverse().map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm border-l-4 ${
                      log.type === 'success'
                        ? 'bg-green-50 border-green-500'
                        : log.type === 'error'
                        ? 'bg-red-50 border-red-500'
                        : log.type === 'skipped'
                        ? 'bg-yellow-50 border-yellow-500'
                        : log.type === 'complete'
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-100 border-gray-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{log.message}</p>
                        {log.studentName && (
                          <p className="text-xs text-gray-600 mt-1">
                            {log.studentName} ({log.rollNo})
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">{log.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spacer to prevent content from being hidden behind fixed bar */}
      <div className={`${isExpanded ? 'h-[500px]' : 'h-24'} transition-all duration-300`}></div>
    </>
  );
};

export default GlobalProgressBar;