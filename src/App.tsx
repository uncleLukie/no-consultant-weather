import { useState, useEffect, useMemo } from 'react';
import { RadarViewer } from './components/RadarViewer';
import { radarLocations } from './data/radarLocations';
import {
  getCurrentPosition,
  findNearestRadars,
  loadLocationPreference,
  saveLocationPreference,
  RadarWithDistance,
} from './utils/geolocation';

function App() {
  const [selectedRadar, setSelectedRadar] = useState(radarLocations[0]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedLocation = loadLocationPreference();
    if (savedLocation) {
      setUserLocation(savedLocation);
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Save dark mode preference when it changes
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Calculate nearest radars when user location changes
  const nearestRadars: RadarWithDistance[] = useMemo(() => {
    if (!userLocation) return [];
    return findNearestRadars(userLocation.lat, userLocation.lng, radarLocations, 5);
  }, [userLocation]);

  // Organize radars by state for dropdown
  const radarsByState = useMemo(() => {
    const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT'];
    return states.map(state => ({
      state,
      radars: radarLocations.filter(r => r.state === state),
    })).filter(group => group.radars.length > 0);
  }, []);

  // Handle browser geolocation
  const handleUseLocation = async () => {
    setIsLoadingLocation(true);

    try {
      const position = await getCurrentPosition();
      setUserLocation(position);
      saveLocationPreference(position);

      // Auto-select nearest radar
      const nearest = findNearestRadars(position.lat, position.lng, radarLocations, 1);
      if (nearest.length > 0) {
        setSelectedRadar(nearest[0]);
      }
    } catch (error) {
      console.error('Geolocation error:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Compact Single-Row Header */}
      <header className={`shadow-sm border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Title */}
            <h1 className={`text-lg font-bold whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No-Consultant Weather
            </h1>

            {/* Radar Selector */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <label htmlFor="radar-select" className={`text-sm font-medium whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Radar:
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
                className={`flex-1 min-w-0 px-3 py-1.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                {nearestRadars.length > 0 && (
                  <optgroup label="📍 Nearest">
                    {nearestRadars.map((radar) => (
                      <option key={`nearest-${radar.productId}`} value={radar.productId}>
                        {radar.name} ({radar.location}) - {radar.distance} km
                      </option>
                    ))}
                  </optgroup>
                )}
                {radarsByState.map(({ state, radars }) => (
                  <optgroup key={state} label={state}>
                    {radars.map((radar) => (
                      <option key={radar.productId} value={radar.productId}>
                        {radar.name} ({radar.location})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Find Nearest Button */}
            <button
              onClick={handleUseLocation}
              disabled={isLoadingLocation}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoadingLocation ? 'Locating...' : '📍 Find Nearest'}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-3 py-1.5 text-sm rounded transition whitespace-nowrap ${isDarkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full w-full px-2 py-2 sm:px-4 sm:py-3">
          <RadarViewer
            key={selectedRadar.baseId}
            baseId={selectedRadar.baseId}
            isDarkMode={isDarkMode}
          />
        </div>
      </main>

      {/* Compact Footer */}
      <footer className={`py-2 text-center border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Data from{' '}
          <a
            href="http://www.bom.gov.au/"
            target="_blank"
            rel="noopener noreferrer"
            className={`hover:underline ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
          >
            Australian Bureau of Meteorology
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
