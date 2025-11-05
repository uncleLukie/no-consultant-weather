import { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { RadarViewer } from './components/RadarViewer';
import WeatherInfo from './components/WeatherInfo';
import RainLegend from './components/RainLegend';
import SettingsModal from './components/SettingsModal';
import TerminalBadge from './components/TerminalBadge';
import { radarLocations } from './data/radarLocations';
import { RadarLocation, WeatherData, RadarRange, RadarOverlays, RadarMode } from './types/radar';
import {
  getCurrentPosition,
  findNearestRadars,
  loadLocationPreference,
  saveLocationPreference,
  RadarWithDistance,
} from './utils/geolocation';
import { fetchWeatherData } from './utils/weatherApi';
import { useThemeColor } from './hooks/useThemeColor';

function RadarApp() {
  const params = useParams<{ radarId?: string; range?: string; mode?: string }>();
  const navigate = useNavigate();

  const [selectedRadar, setSelectedRadar] = useState<RadarLocation | null>(() => {
    // First check URL params
    if (params.radarId) {
      const radar = radarLocations.find(r => r.productId === params.radarId);
      if (radar) return radar;
    }
    // Then check localStorage
    const savedRadarId = localStorage.getItem('selectedRadar');
    if (savedRadarId) {
      const radar = radarLocations.find(r => r.productId === savedRadarId);
      if (radar) return radar;
    }
    return null; // Don't default to Sydney, let IP geolocation handle it
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then fall back to system preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      return savedDarkMode === 'true';
    }
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [terminalTextLength, setTerminalTextLength] = useState(0);

  // Update browser theme color to match dark mode
  useThemeColor(isDarkMode);

  // Radar settings state
  const [selectedRange, setSelectedRange] = useState<RadarRange>(() => {
    // First check URL params
    if (params.range && ['64', '128', '256', '512'].includes(params.range)) {
      return params.range as RadarRange;
    }
    // Then check localStorage
    const savedRange = localStorage.getItem('radarRange');
    if (savedRange && ['64', '128', '256', '512'].includes(savedRange)) {
      return savedRange as RadarRange;
    }
    return '128';
  });
  const [overlays, setOverlays] = useState<RadarOverlays>(() => {
    const defaultOverlays: RadarOverlays = {
      background: true,
      topography: true,
      catchments: true,
      range: true,
      locations: true,
      legend: true,
    };
    const savedOverlays = localStorage.getItem('radarOverlays');
    if (savedOverlays) {
      try {
        return { ...defaultOverlays, ...JSON.parse(savedOverlays) };
      } catch (e) {
        console.error('Failed to parse saved overlays:', e);
      }
    }
    return defaultOverlays;
  });

  // Radar mode state (rain vs doppler)
  const [radarMode, setRadarMode] = useState<RadarMode>(() => {
    // First check URL params
    if (params.mode && (params.mode === 'doppler' || params.mode === 'rain')) {
      return params.mode as RadarMode;
    }
    // Then check localStorage
    const savedMode = localStorage.getItem('radarMode');
    return (savedMode === 'doppler' ? 'doppler' : 'rain') as RadarMode;
  });

  // Weather data state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    const savedLocation = loadLocationPreference();
    if (savedLocation) {
      setUserLocation(savedLocation);
    }
  }, []);

  // Save selected radar when it changes AND update URL
  useEffect(() => {
    if (selectedRadar) {
      localStorage.setItem('selectedRadar', selectedRadar.productId);
      // Update URL to match current state
      const newPath = `/radar/${selectedRadar.productId}/${selectedRange}/${radarMode}`;
      navigate(newPath, { replace: true });
    }
  }, [selectedRadar, selectedRange, radarMode, navigate]);

  // Save dark mode preference when it changes
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Save radar settings when they change
  useEffect(() => {
    localStorage.setItem('radarRange', selectedRange);
  }, [selectedRange]);

  useEffect(() => {
    localStorage.setItem('radarOverlays', JSON.stringify(overlays));
  }, [overlays]);

  useEffect(() => {
    localStorage.setItem('radarMode', radarMode);
  }, [radarMode]);

  // Auto-switch to rain mode if selected radar doesn't support doppler
  useEffect(() => {
    if (selectedRadar && radarMode === 'doppler' && !selectedRadar.hasDoppler) {
      console.log(`Radar ${selectedRadar.name} doesn't support doppler, switching to rain mode`);
      setRadarMode('rain');
    }
  }, [selectedRadar, radarMode]);

  // IP-based geolocation for initial radar selection
  useEffect(() => {
    const initializeLocationFromIP = async () => {
      // Skip if URL has radar ID (user is visiting a specific radar)
      if (params.radarId) return;

      // Check if user already has radar preference set
      const savedRadar = localStorage.getItem('selectedRadar');

      // Only run IP geolocation if no radar is selected
      if (savedRadar) return;

      try {
        console.log('Starting IP geolocation...');
        // Use IP geolocation to get approximate location
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          console.log('IP geolocation service unavailable, falling back to default');
          // Fallback to first radar if IP geolocation fails
          setSelectedRadar(radarLocations[0]);
          return;
        }

        const data = await response.json();
        console.log('IP geolocation result:', data);

        if (data.latitude && data.longitude) {
          const ipLocation = { lat: data.latitude, lng: data.longitude };
          setUserLocation(ipLocation);
          saveLocationPreference(ipLocation);

          // Auto-select nearest radar based on IP location
          const nearest = findNearestRadars(
            ipLocation.lat,
            ipLocation.lng,
            radarLocations,
            1
          );

          if (nearest.length > 0) {
            setSelectedRadar(nearest[0]);
            console.log(`Auto-selected nearest radar: ${nearest[0].name} (${nearest[0].location})`);
          } else {
            // Fallback to first radar if no nearest found
            setSelectedRadar(radarLocations[0]);
          }
        } else {
          console.log('No coordinates in IP geolocation response, falling back to default');
          setSelectedRadar(radarLocations[0]);
        }
      } catch (error) {
        console.log('IP geolocation unavailable, using default radar:', error);
        // Fallback to first radar if IP geolocation fails
        setSelectedRadar(radarLocations[0]);
      }
    };

    initializeLocationFromIP();
  }, [params.radarId]); // Run when params change or on mount

  // Fetch weather data when selected radar changes
  useEffect(() => {
    if (!selectedRadar) return;

    const loadWeatherData = async () => {
      setIsLoadingWeather(true);
      setWeatherError(null);

      try {
        const data = await fetchWeatherData(selectedRadar.lat, selectedRadar.lng);
        setWeatherData(data);
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        setWeatherError(error instanceof Error ? error.message : 'Failed to load weather data');
      } finally {
        setIsLoadingWeather(false);
      }
    };

    loadWeatherData();
  }, [selectedRadar]);

  // Calculate nearest radars when user location changes
  const nearestRadars: RadarWithDistance[] = useMemo(() => {
    if (!userLocation) return [];
    return findNearestRadars(userLocation.lat, userLocation.lng, radarLocations, 5);
  }, [userLocation]);

  // Calculate radars nearest to current radar location
  const nearestToRadar: RadarWithDistance[] = useMemo(() => {
    if (!selectedRadar) return [];
    return findNearestRadars(selectedRadar.lat, selectedRadar.lng, radarLocations, 5)
      .filter(radar => radar.productId !== selectedRadar.productId); // Exclude current radar
  }, [selectedRadar]);

  // Organize radars by state for dropdown
  const radarsByState = useMemo(() => {
    const states = ['NSW', 'ACT', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT'];
    return states.map(state => ({
      state,
      radars: radarLocations.filter(r => r.state === state),
    })).filter(group => group.radars.length > 0);
  }, []);

  // Handle radar error - just show error, no automatic fallback
  const handleRadarError = useCallback((error: string | null) => {
    setRadarError(error);
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

  // Manual fallback to next nearest radar
  const handleTryNextNearest = () => {
    if (!userLocation || !selectedRadar) return;
    
    const nearestRadars = findNearestRadars(userLocation.lat, userLocation.lng, radarLocations, 10);
    const nextRadar = nearestRadars.find(radar => radar.productId !== selectedRadar.productId);
    
    if (nextRadar) {
      setSelectedRadar(nextRadar);
      setRadarError(null);
    }
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Center-Aligned Header */}
      <header className={`shadow-sm border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-screen-xl mx-auto px-2 py-2 sm:px-4 sm:py-3 xl:px-12">
          <div className="flex flex-col items-center gap-2">
            {/* Top Row: Title and Controls */}
            <div className="flex items-center justify-center gap-3 w-full relative">
              {/* Social Icons - Left */}
              <div className="absolute left-0 xl:left-8 flex items-center gap-2">
                <a
                  href="https://github.com/uncleLukie/no-consultant-weather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-1.5 rounded hover:bg-opacity-80 transition ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
                  aria-label="GitHub Repository"
                  title="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <div className="relative flex items-center">
                  <a
                    href="https://www.linkedin.com/in/unclelukie/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1.5 rounded hover:bg-opacity-80 transition ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
                    aria-label="LinkedIn Profile - Open to Work"
                    title="LinkedIn - #OpenToWork"
                  >
                    <div className="linkedin-pulse flex items-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                  </a>
                  <TerminalBadge
                    isDarkMode={isDarkMode}
                    onTextLengthChange={setTerminalTextLength}
                  />
                </div>
              </div>

              {/* Title - Center */}
              <h1
                className={`flex items-center gap-2 text-base md:text-lg font-bold whitespace-nowrap title-smooth-bump ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                style={{ transform: `translateX(${terminalTextLength * 6}px)` }}
              >
                <img src="/thunder.png" alt="Thunder icon" className="w-6 h-6 md:w-7 md:h-7" />
                <span className="font-sans min-[450px]:hidden">NCW</span>
                <span className="font-sans hidden min-[450px]:inline">No-Consultant Weather</span>
              </h1>

              {/* Settings Button - Right */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`absolute right-0 xl:right-8 p-2 rounded-lg transition hover:bg-opacity-10 ${isDarkMode ? 'hover:bg-white text-gray-300' : 'hover:bg-gray-900 text-gray-700'}`}
                aria-label="Open settings"
                title="Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6m9-9h-6M7 12H1m15.36 7.36l-4.24-4.24m0-6.36l4.24-4.24M8.64 16.36l-4.24 4.24m0-16.72l4.24 4.24" />
                </svg>
              </button>
            </div>

            {/* Radar Selector Row - Centered */}
            <div className="flex items-center justify-center gap-2 w-full max-w-2xl">
              <select
                id="radar-select"
                value={selectedRadar?.productId || ''}
                onChange={(e) => {
                  const radar = radarLocations.find(
                    (r) => r.productId === e.target.value
                  );
                  if (radar) setSelectedRadar(radar);
                }}
                className={`flex-1 px-2 md:px-3 py-1.5 text-xs md:text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="" disabled>Select location...</option>
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

              {/* Find Nearest Button */}
              <button
                onClick={handleUseLocation}
                disabled={isLoadingLocation}
                className="px-2 md:px-3 py-1.5 text-xs md:text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1"
              >
                {isLoadingLocation ? (
                  <span>...</span>
                ) : (
                  <>
                    <span>📍</span>
                    <span>Find Nearest</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive Layout */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden flex flex-col max-w-screen-xl mx-auto w-full px-4 lg:px-8 xl:px-12">
          {/* Weather Banner - Mobile/Tablet Only */}
          <div className="lg:hidden">
            <WeatherInfo
              weatherData={weatherData}
              loading={isLoadingWeather}
              error={weatherError}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* 2-Column Layout for Desktop, Single Column for Mobile/Tablet */}
          <div className="flex-1 min-h-0 flex flex-row gap-4">
          {/* Left Sidebar - Weather + Legend (Desktop Only) */}
          <aside className="hidden lg:flex flex-col gap-2 w-64 xl:w-80 overflow-y-auto shrink-0">
            <WeatherInfo
              weatherData={weatherData}
              loading={isLoadingWeather}
              error={weatherError}
              isDarkMode={isDarkMode}
            />
            <RainLegend isDarkMode={isDarkMode} inline={false} />
          </aside>

          {/* Center - Radar Viewer */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Error Banner */}
            {radarError && selectedRadar && (
              <div className={`mb-2 p-3 rounded-lg border ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="flex flex-col gap-3">
                  <p className="font-medium">{radarError}</p>

                  <div className="flex flex-wrap gap-2">
                    {userLocation && (
                      <button
                        onClick={handleTryNextNearest}
                        className={`px-3 py-1.5 text-xs rounded transition font-medium ${isDarkMode ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                      >
                        🔄 Next Nearest to You
                      </button>
                    )}

                    {nearestToRadar.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedRadar(nearestToRadar[0]);
                          setRadarError(null);
                        }}
                        className={`px-3 py-1.5 text-xs rounded transition font-medium ${isDarkMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                      >
                        🎯 Next Nearest to {selectedRadar.name}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {userLocation && nearestRadars.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                          📍 Nearest to your location:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {nearestRadars.slice(0, 3).map((radar) => (
                            <button
                              key={`user-${radar.productId}`}
                              onClick={() => {
                                setSelectedRadar(radar);
                                setRadarError(null);
                              }}
                              className={`px-3 py-1.5 text-xs rounded transition ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                            >
                              {radar.name} ({radar.distance}km)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {nearestToRadar.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                          🎯 Nearest to {selectedRadar.name}:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {nearestToRadar.slice(0, 3).map((radar) => (
                            <button
                              key={`radar-${radar.productId}`}
                              onClick={() => {
                                setSelectedRadar(radar);
                                setRadarError(null);
                              }}
                              className={`px-3 py-1.5 text-xs rounded transition ${isDarkMode ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                            >
                              {radar.name} ({radar.distance}km)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0">
              {selectedRadar ? (
                <RadarViewer
                  key={selectedRadar.baseId}
                  baseId={selectedRadar.baseId}
                  isDarkMode={isDarkMode}
                  selectedRange={selectedRange}
                  onRangeChange={setSelectedRange}
                  currentMode={radarMode}
                  onModeChange={setRadarMode}
                  hasDoppler={selectedRadar.hasDoppler}
                  dopplerProductId={selectedRadar.dopplerProductId}
                  overlays={overlays}
                  onError={handleRadarError}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Detecting your location...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className={`py-1 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-screen-xl mx-auto px-2 xl:px-12 text-center">
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
            {' • '}
            <a
              href="https://www.flaticon.com/free-icons/rain"
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              title="rain icons"
            >
              Icon by Freepik
            </a>
          </p>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        overlays={overlays}
        onOverlaysChange={setOverlays}
        isDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
      />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RadarApp />} />
      <Route path="/radar/:radarId" element={<RadarApp />} />
      <Route path="/radar/:radarId/:range" element={<RadarApp />} />
      <Route path="/radar/:radarId/:range/:mode" element={<RadarApp />} />
    </Routes>
  );
}

export default App;
