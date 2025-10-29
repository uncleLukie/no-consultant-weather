import { useState, useEffect, useMemo } from 'react';
import { RadarViewer } from './components/RadarViewer';
import { radarLocations } from './data/radarLocations';
import {
  getCurrentPosition,
  findNearestRadars,
  getCoordinatesFromPostcode,
  isValidAustralianPostcode,
  loadLocationPreference,
  saveLocationPreference,
  RadarWithDistance,
} from './utils/geolocation';

function App() {
  const [selectedRadar, setSelectedRadar] = useState(radarLocations[0]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [postcodeInput, setPostcodeInput] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
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
    setLocationError(null);

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
      setLocationError(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle postcode search
  const handlePostcodeSearch = () => {
    setLocationError(null);

    if (!isValidAustralianPostcode(postcodeInput)) {
      setLocationError('Please enter a valid 4-digit Australian postcode');
      return;
    }

    const coords = getCoordinatesFromPostcode(postcodeInput);
    if (!coords) {
      setLocationError('Postcode not found. Try a nearby major postcode.');
      return;
    }

    setUserLocation(coords);
    saveLocationPreference(coords);

    // Auto-select nearest radar
    const nearest = findNearestRadars(coords.lat, coords.lng, radarLocations, 1);
    if (nearest.length > 0) {
      setSelectedRadar(nearest[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header with Inline Location Selector */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                No-Consultant Weather
              </h1>
              <span className="text-xs text-gray-500 hidden sm:inline">
                — Fast Australian radar
              </span>
            </div>
          </div>

          {/* Location Detection Row */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <button
              onClick={handleUseLocation}
              disabled={isLoadingLocation}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoadingLocation ? 'Locating...' : '📍 Find Nearest Radar'}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={postcodeInput}
                onChange={(e) => setPostcodeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePostcodeSearch()}
                placeholder="Postcode (e.g., 2000)"
                className="px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md w-36"
              />
              <button
                onClick={handlePostcodeSearch}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Find
              </button>
            </div>

            {locationError && (
              <span className="text-xs text-red-600">{locationError}</span>
            )}
          </div>

          {/* Radar Selector Row */}
          <div className="flex items-center gap-3">
            <label htmlFor="radar-select" className="text-sm font-medium text-gray-700">
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
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
            >
              {nearestRadars.length > 0 && (
                <optgroup label="📍 Nearest">
                  {nearestRadars.map((radar) => (
                    <option key={`nearest-${radar.productId}`} value={radar.productId}>
                      {radar.name} ({radar.distance} km)
                    </option>
                  ))}
                </optgroup>
              )}
              {radarsByState.map(({ state, radars }) => (
                <optgroup key={state} label={state}>
                  {radars.map((radar) => (
                    <option key={radar.productId} value={radar.productId}>
                      {radar.name} - {radar.location}
                    </option>
                  ))}
                </optgroup>
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
