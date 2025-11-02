import { useState, useEffect } from 'react';

interface RainLegendProps {
  isDarkMode?: boolean;
  inline?: boolean; // If false, displays as sidebar format
}

export default function RainLegend({ isDarkMode = false, inline = true }: RainLegendProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('legendExpanded');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('legendExpanded', isExpanded.toString());
  }, [isExpanded]);

  // Sidebar format (always vertical, always expanded)
  if (!inline) {
    return (
      <div className={`rounded shadow-sm border p-3 h-fit ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`font-semibold text-sm mb-3 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Rain Rate Legend
        </div>
        <div className="flex flex-col gap-3 text-xs">
          {/* Light */}
          <div>
            <div className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Light</div>
            <div className="flex gap-1 flex-wrap">
              <div className="w-6 h-6 border border-gray-400" style={{ backgroundColor: '#f5f5ff' }} title="Light"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#b4b4ff' }} title="Light"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#7878ff' }} title="Light"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#1414ff' }} title="Light"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#00d8c3' }} title="Light"></div>
            </div>
          </div>

          {/* Moderate */}
          <div>
            <div className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Moderate</div>
            <div className="flex gap-1 flex-wrap">
              <div className="w-6 h-6" style={{ backgroundColor: '#009690' }} title="Moderate"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#006666' }} title="Moderate"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#ffff00' }} title="Moderate"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#ffc800' }} title="Moderate"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#ff9600' }} title="Moderate"></div>
            </div>
          </div>

          {/* Heavy */}
          <div>
            <div className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Heavy</div>
            <div className="flex gap-1 flex-wrap">
              <div className="w-6 h-6" style={{ backgroundColor: '#ff6400' }} title="Heavy"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#ff0000' }} title="Heavy"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#c80000' }} title="Heavy"></div>
              <div className="w-6 h-6" style={{ backgroundColor: '#6b0000' }} title="Heavy"></div>
            </div>
          </div>

          {/* Extreme */}
          <div>
            <div className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Extreme</div>
            <div className="flex gap-1 flex-wrap">
              <div className="w-6 h-6" style={{ backgroundColor: '#280000' }} title="Extreme"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline format (horizontal, collapsible)
  return (
    <div className={`mt-1 rounded shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div
        className={`px-2 py-1 font-semibold text-xs flex items-center justify-between cursor-pointer ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ borderBottom: isExpanded ? `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}` : 'none' }}
      >
        <span>Rain Rate Legend</span>
        <span className="ml-1 text-xs">{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div className="px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Light */}
            <div className="flex items-center gap-1">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Light:</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4 border border-gray-400" style={{ backgroundColor: '#f5f5ff' }} title="Light"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#b4b4ff' }} title="Light"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#7878ff' }} title="Light"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#1414ff' }} title="Light"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#00d8c3' }} title="Light"></div>
              </div>
            </div>

            {/* Moderate */}
            <div className="flex items-center gap-1">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Moderate:</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4" style={{ backgroundColor: '#009690' }} title="Moderate"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#006666' }} title="Moderate"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#ffff00' }} title="Moderate"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#ffc800' }} title="Moderate"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#ff9600' }} title="Moderate"></div>
              </div>
            </div>

            {/* Heavy */}
            <div className="flex items-center gap-1">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Heavy:</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4" style={{ backgroundColor: '#ff6400' }} title="Heavy"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#ff0000' }} title="Heavy"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#c80000' }} title="Heavy"></div>
                <div className="w-4 h-4" style={{ backgroundColor: '#6b0000' }} title="Heavy"></div>
              </div>
            </div>

            {/* Extreme */}
            <div className="flex items-center gap-1">
              <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Extreme:</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4" style={{ backgroundColor: '#280000' }} title="Extreme"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
