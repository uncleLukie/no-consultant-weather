import { useState, useEffect, useCallback } from 'react';
import { RadarImage, RadarRange, RadarOverlays } from '../types/radar';
import { fetchRadarImages, formatTimestamp } from '../utils/radarApi';

interface RadarViewerProps {
  baseId: string;
  isDarkMode: boolean;
  onError?: (error: string | null) => void;
}

export function RadarViewer({ baseId, isDarkMode, onError }: RadarViewerProps) {
  const [selectedRange, setSelectedRange] = useState<RadarRange>(() => {
    // Load saved range from localStorage
    const savedRange = localStorage.getItem('radarRange');
    if (savedRange && ['64', '128', '256', '512'].includes(savedRange)) {
      return savedRange as RadarRange;
    }
    return '128';
  });
  const [images, setImages] = useState<RadarImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<RadarOverlays>(() => {
    // Load saved overlays from localStorage
    const savedOverlays = localStorage.getItem('radarOverlays');
    if (savedOverlays) {
      try {
        return JSON.parse(savedOverlays);
      } catch (e) {
        console.error('Failed to parse saved overlays:', e);
      }
    }
    return {
      background: true,
      topography: true,
      catchments: true,
      range: true,
      locations: true,
      legend: true,
    };
  });

  const [isLegendExpanded, setIsLegendExpanded] = useState(() => {
    // Load saved legend state from localStorage
    const savedState = localStorage.getItem('legendExpanded');
    return savedState !== null ? savedState === 'true' : true;
  });

  // Generate current product ID based on selected range
  const currentProductId = `IDR${baseId}${selectedRange === '64' ? '4' : selectedRange === '128' ? '3' : selectedRange === '256' ? '2' : '1'}`;

  // Save range preference when it changes
  useEffect(() => {
    localStorage.setItem('radarRange', selectedRange);
  }, [selectedRange]);

  // Save overlays preference when they change
  useEffect(() => {
    localStorage.setItem('radarOverlays', JSON.stringify(overlays));
  }, [overlays]);

  // Save legend expanded state when it changes
  useEffect(() => {
    localStorage.setItem('legendExpanded', isLegendExpanded.toString());
  }, [isLegendExpanded]);

  // Fetch radar images function
  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    onError?.(null); // Clear parent error state

    try {
      const radarImages = await fetchRadarImages(currentProductId);
      setImages(radarImages);
      setCurrentIndex(radarImages.length - 1); // Start with most recent
    } catch (err) {
      const errorMessage = 'Failed to load radar data. Please try again later.';
      setError(errorMessage);
      onError?.(errorMessage); // Notify parent of error
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProductId, onError]);

  // Fetch radar images on mount and when product changes
  useEffect(() => {
    loadImages();

    // Refresh every 5 minutes (radar updates every 5-10 minutes)
    const interval = setInterval(loadImages, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [loadImages]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 500); // 500ms per frame for smooth animation

    return () => clearInterval(interval);
  }, [isPlaying, images.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handleLatest = useCallback(() => {
    // Refresh radar data to get latest images
    loadImages();
    // Pause playback so user can review latest frame
    setIsPlaying(false);
  }, [loadImages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading radar data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No radar data available</div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const transparencyBaseUrl = `https://reg.bom.gov.au/products/radar_transparencies/${currentProductId}`;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Controls Bar */}
      <div className={`mb-1 p-1.5 rounded shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Mobile Controls (< md breakpoint 768px) */}
        <div className="md:hidden flex items-center gap-2 text-xs">
          {/* Range Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="range-select" className={`font-medium whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Range:
            </label>
            <select
              id="range-select"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value as RadarRange)}
              className={`px-2 py-1 rounded border text-xs ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="64">64 km</option>
              <option value="128">128 km</option>
              <option value="256">256 km</option>
              <option value="512">512 km</option>
            </select>
          </div>

          {/* Divider */}
          <span className={`${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}>|</span>

          {/* Layers Compact Checkboxes */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <span className={`font-medium whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Layers:</span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <input
                  type="checkbox"
                  checked={overlays.locations}
                  onChange={(e) => setOverlays({ ...overlays, locations: e.target.checked })}
                  className="mr-0.5"
                />
                <span className="text-xs">Loc</span>
              </label>
              <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <input
                  type="checkbox"
                  checked={overlays.range}
                  onChange={(e) => setOverlays({ ...overlays, range: e.target.checked })}
                  className="mr-0.5"
                />
                <span className="text-xs">Rng</span>
              </label>
              <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <input
                  type="checkbox"
                  checked={overlays.topography}
                  onChange={(e) => setOverlays({ ...overlays, topography: e.target.checked })}
                  className="mr-0.5"
                />
                <span className="text-xs">Topo</span>
              </label>
              <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <input
                  type="checkbox"
                  checked={overlays.catchments}
                  onChange={(e) => setOverlays({ ...overlays, catchments: e.target.checked })}
                  className="mr-0.5"
                />
                <span className="text-xs">Catch</span>
              </label>
              <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <input
                  type="checkbox"
                  checked={overlays.background}
                  onChange={(e) => setOverlays({ ...overlays, background: e.target.checked })}
                  className="mr-0.5"
                />
                <span className="text-xs">Bg</span>
              </label>
            </div>
          </div>
        </div>

        {/* Desktop Controls (>= md breakpoint 768px) */}
        <div className="hidden md:flex items-center justify-between gap-4 flex-wrap text-xs">
          {/* Range Selector */}
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Range:</span>
            {(['64', '128', '256', '512'] as RadarRange[]).map((range) => (
              <label key={range} className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                <input
                  type="radio"
                  name="range"
                  value={range}
                  checked={selectedRange === range}
                  onChange={(e) => setSelectedRange(e.target.value as RadarRange)}
                  className="mr-1"
                />
                <span>{range}km</span>
              </label>
            ))}
          </div>

          {/* Overlay Toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Layers:</span>
            <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              <input
                type="checkbox"
                checked={overlays.locations}
                onChange={(e) => setOverlays({ ...overlays, locations: e.target.checked })}
                className="mr-1"
              />
              <span>Locations</span>
            </label>
            <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              <input
                type="checkbox"
                checked={overlays.range}
                onChange={(e) => setOverlays({ ...overlays, range: e.target.checked })}
                className="mr-1"
              />
              <span>Range</span>
            </label>
            <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              <input
                type="checkbox"
                checked={overlays.topography}
                onChange={(e) => setOverlays({ ...overlays, topography: e.target.checked })}
                className="mr-1"
              />
              <span>Topo</span>
            </label>
            <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              <input
                type="checkbox"
                checked={overlays.catchments}
                onChange={(e) => setOverlays({ ...overlays, catchments: e.target.checked })}
                className="mr-1"
              />
              <span>Catchments</span>
            </label>
            <label className={`flex items-center cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
              <input
                type="checkbox"
                checked={overlays.background}
                onChange={(e) => setOverlays({ ...overlays, background: e.target.checked })}
                className="mr-1"
              />
              <span>Background</span>
            </label>
          </div>
        </div>
      </div>

      {/* Radar Image with Overlays */}
      <div className={`flex-1 min-h-0 rounded-lg overflow-hidden shadow-lg relative flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {/* Base layers - UNDER the radar image */}
        {overlays.background && (
          <img
            src={`${transparencyBaseUrl}.background.png`}
            alt="Background overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 1, objectPosition: 'center' }}
          />
        )}
        {overlays.topography && (
          <img
            src={`${transparencyBaseUrl}.topography.png`}
            alt="Topography overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 2, objectPosition: 'center' }}
          />
        )}
        {overlays.catchments && (
          <img
            src={`${transparencyBaseUrl}.catchments.png`}
            alt="Catchments overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 3, objectPosition: 'center' }}
          />
        )}

        {/* Radar image - the rain data */}
        <img
          src={currentImage.url}
          alt={`Radar loop frame ${currentIndex + 1}`}
          className="w-full h-full object-contain block"
          style={{ zIndex: 4, objectPosition: 'center', maxWidth: '100%', maxHeight: '100%' }}
        />

        {/* Top layers - ON TOP of the radar image */}
        {overlays.range && (
          <img
            src={`${transparencyBaseUrl}.range.png`}
            alt="Range rings overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 5, objectPosition: 'center' }}
          />
        )}
        {overlays.locations && (
          <img
            src={`${transparencyBaseUrl}.locations.png`}
            alt="Locations overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 6, objectPosition: 'center' }}
          />
        )}
      </div>

      {/* Horizontal Rain Rate Legend */}
      {overlays.legend && (
        <div className={`mt-1 rounded shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div
            className={`px-2 py-1 font-semibold text-xs flex items-center justify-between cursor-pointer ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
            onClick={() => setIsLegendExpanded(!isLegendExpanded)}
            style={{ borderBottom: isLegendExpanded ? `1px solid ${isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'}` : 'none' }}
          >
            <span>Rain Rate Legend</span>
            <span className="ml-1 text-xs">{isLegendExpanded ? '▼' : '▶'}</span>
          </div>
          {isLegendExpanded && (
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
      )}

      {/* Compact Playback Controls */}
      <div className="mt-1 flex items-center justify-center gap-1 text-sm overflow-x-auto">
        <button
          onClick={handlePrevious}
          className="px-1.5 md:px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs whitespace-nowrap"
          disabled={images.length <= 1}
        >
          ◀ Prev
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-2 md:px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-xs whitespace-nowrap"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={handleNext}
          className="px-1.5 md:px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs whitespace-nowrap"
          disabled={images.length <= 1}
        >
          Next ▶
        </button>

        <button
          onClick={handleLatest}
          className="px-1.5 md:px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs whitespace-nowrap"
          disabled={images.length <= 1 || currentIndex === images.length - 1}
        >
          Latest
        </button>

        <span className={`text-xs ml-1 whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {formatTimestamp(currentImage.timestamp)} • Frame {currentIndex + 1}/{images.length}
        </span>
      </div>
    </div>
  );
}
