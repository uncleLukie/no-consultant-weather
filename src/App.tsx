import { useState } from 'react';
import { RadarViewer } from './components/RadarViewer';
import { radarLocations } from './data/radarLocations';

function App() {
  const [selectedRadar, setSelectedRadar] = useState(radarLocations[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header with Inline Location Selector */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                No-Consultant Weather
              </h1>
              <span className="text-xs text-gray-500 hidden sm:inline">
                — Fast Australian radar
              </span>
            </div>
            <select
              id="radar-select"
              value={selectedRadar.productId}
              onChange={(e) => {
                const radar = radarLocations.find(
                  (r) => r.productId === e.target.value
                );
                if (radar) setSelectedRadar(radar);
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
            >
              {radarLocations.map((radar) => (
                <option key={radar.productId} value={radar.productId}>
                  {radar.name}, {radar.state}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Radar Viewer */}
        <RadarViewer
          key={selectedRadar.baseId}
          baseId={selectedRadar.baseId}
        />
      </main>

      {/* Compact Footer */}
      <footer className="mt-8 py-3 text-center border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Data from{' '}
          <a
            href="http://www.bom.gov.au/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Australian Bureau of Meteorology
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
