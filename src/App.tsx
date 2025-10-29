import { useState } from 'react';
import { RadarViewer } from './components/RadarViewer';
import { radarLocations } from './data/radarLocations';

function App() {
  const [selectedRadar, setSelectedRadar] = useState(radarLocations[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            No-Consultant Weather
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Simple, fast Australian weather radar
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Location Selector */}
        <div className="mb-8">
          <label
            htmlFor="radar-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Radar Location
          </label>
          <select
            id="radar-select"
            value={selectedRadar.productId}
            onChange={(e) => {
              const radar = radarLocations.find(
                (r) => r.productId === e.target.value
              );
              if (radar) setSelectedRadar(radar);
            }}
            className="block w-full max-w-md px-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
          >
            {radarLocations.map((radar) => (
              <option key={radar.productId} value={radar.productId}>
                {radar.name}, {radar.state} ({radar.location})
              </option>
            ))}
          </select>
        </div>

        {/* Radar Viewer */}
        <RadarViewer
          key={selectedRadar.baseId}
          baseId={selectedRadar.baseId}
        />
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            Data provided by the{' '}
            <a
              href="http://www.bom.gov.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Australian Bureau of Meteorology
            </a>
            . Radar images update approximately every 5-10 minutes.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
