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

  // Load saved location preference on mount
  useEffect(() => {
    const savedLocation = loadLocationPreference();
    if (savedLocation) {
      setUserLocation(savedLocation);
    }
  }, []);

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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Compact Single-Row Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Title */}
            <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">
              No-Consultant Weather
            </h1>

            {/* Radar Selector */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <label htmlFor="radar-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
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
                className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full w-full px-2 py-2 sm:px-4 sm:py-3">
          <RadarViewer
            key={selectedRadar.baseId}
            baseId={selectedRadar.baseId}
          />
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="py-2 text-center border-t border-gray-200 bg-white">
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
