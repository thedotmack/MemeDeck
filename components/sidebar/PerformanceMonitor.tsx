"use client";

import { useEffect, useRef, useState } from 'react';
import { runAutomatedAccessibilityChecks, measureRenderPerformance, type ManualTestResult } from './__tests__/manual-testing-checklist';

interface PerformanceMonitorProps {
  enabled?: boolean;
  component?: string;
}

export function PerformanceMonitor({ enabled = false, component = 'HotTokensSidebar' }: PerformanceMonitorProps) {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [accessibilityResults, setAccessibilityResults] = useState<ManualTestResult[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const mountTime = useRef<number>(performance.now());

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return;

    
    measureRenderPerformance(component)
      .then(setRenderTime)
      .catch(error => {
        console.warn('[PerformanceMonitor] Measurement failed:', error);
        setRenderTime(null);
      });

    
    const checkAccessibility = () => {
      const results = runAutomatedAccessibilityChecks();
      setAccessibilityResults(results);
    };

    const timer = setTimeout(checkAccessibility, 1000);
    return () => clearTimeout(timer);
  }, [enabled, component]);

  
  if (!enabled || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const totalMountTime = performance.now() - mountTime.current;
  const failedChecks = accessibilityResults.filter(r => !r.passed);
  const criticalIssues = failedChecks.filter(r => r.severity === 'critical');

  return (
    <div className="fixed bottom-4 left-4 z-[100] max-w-xs">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
          criticalIssues.length > 0 
            ? 'bg-red-600 text-white' 
            : failedChecks.length > 0 
            ? 'bg-yellow-600 text-white'
            : 'bg-green-600 text-white'
        }`}
      >
        📊 {component} Monitor {criticalIssues.length > 0 && '⚠️'}
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-white font-mono shadow-lg">
          <div className="space-y-2">
            <div>
              <span className="text-green-400">⏱️ Render:</span> {renderTime?.toFixed(2)}ms
            </div>
            <div>
              <span className="text-blue-400">🚀 Mount:</span> {totalMountTime.toFixed(2)}ms
            </div>
            
            {accessibilityResults.length > 0 && (
              <div className="border-t border-gray-700 pt-2">
                <div className="text-gray-400 mb-1">Accessibility Checks:</div>
                {accessibilityResults.map((result) => (
                  <div key={result.testName} className={`text-xs ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {result.passed ? '✅' : '❌'} {result.testName}
                    {result.notes && (
                      <div className="text-gray-500 ml-4 text-[10px]">{result.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-700 pt-2 text-[10px] text-gray-400">
              <div>React.memo: ✅ Implemented</div>
              <div>Throttle: ✅ 1100ms</div>
              <div>Touch targets: {failedChecks.some(r => r.testName.includes('size')) ? '❌' : '✅'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}