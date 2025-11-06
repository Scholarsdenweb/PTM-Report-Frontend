import React, { useState, createContext } from 'react';

const ProgressContext = createContext(null);

export const ProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState({
    show: false,
    percentage: 0,
    current: 0,
    total: 0,
    message: '',
    status: 'idle',
  });
  const [progressLogs, setProgressLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [finalSummary, setFinalSummary] = useState(null);

  const updateProgress = (data) => {
    setProgress(prev => ({
      ...prev,
      show: data.show !== undefined ? data.show : true,
      percentage: data.percentage !== undefined ? data.percentage : prev.percentage,
      current: data.current !== undefined ? data.current : prev.current,
      total: data.total !== undefined ? data.total : prev.total,
      message: data.message !== undefined ? data.message : prev.message,
      status: data.status !== undefined ? data.status : prev.status,
    }));
  };

  const addLog = (logOrFunction) => {
    if (typeof logOrFunction === 'function') {
      setProgressLogs(logOrFunction);
    } else {
      setProgressLogs(prev => [...prev, {
        ...logOrFunction,
        timestamp: logOrFunction.timestamp || new Date().toLocaleTimeString(),
      }]);
    }
  };

  const setFinalSummaryData = (summary) => {
    setFinalSummary(summary);
  };

  const clearProgress = () => {
    setProgress({
      show: false,
      percentage: 0,
      current: 0,
      total: 0,
      message: '',
      status: 'idle',
    });
    setProgressLogs([]);
    setIsExpanded(false);
    setFinalSummary(null);
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const value = {
    progress,
    progressLogs,
    isExpanded,
    finalSummary,
    updateProgress,
    addLog,
    clearProgress,
    toggleExpanded,
    setFinalSummaryData,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export default ProgressContext;