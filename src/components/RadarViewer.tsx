import { useState, useEffect, useCallback } from 'react';
import { RadarImage, RadarRange, RadarOverlays } from '../types/radar';
import { fetchRadarImages, formatTimestamp } from '../utils/radarApi';

interface RadarViewerProps {
  baseId: string;
  isDarkMode: boolean;
}

export function RadarViewer({ baseId, isDarkMode }: RadarViewerProps) {
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
    };
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

  // Fetch radar images
  useEffect(() => {
    let mounted = true;

    async function loadImages() {
      setIsLoading(true);
      setError(null);

      try {
        const radarImages = await fetchRadarImages(currentProductId);

        if (mounted) {
          setImages(radarImages);
          setCurrentIndex(radarImages.length - 1); // Start with most recent
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load radar data. Please try again later.');
          console.error(err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadImages();

    // Refresh every 5 minutes (radar updates every 5-10 minutes)
    const interval = setInterval(loadImages, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentProductId]);

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
    setCurrentIndex(images.length - 1);
  }, [images.length]);

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
    <div className="h-full flex flex-col">
      {/* Compact Controls Bar */}
      <div className={`mb-2 p-2 rounded shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
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
      <div className={`flex-1 min-h-0 rounded-lg overflow-hidden shadow-lg relative ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {/* Base layers - UNDER the radar image */}
        {overlays.background && (
          <img
            src={`${transparencyBaseUrl}.background.png`}
            alt="Background overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 1 }}
          />
        )}
        {overlays.topography && (
          <img
            src={`${transparencyBaseUrl}.topography.png`}
            alt="Topography overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 2 }}
          />
        )}
        {overlays.catchments && (
          <img
            src={`${transparencyBaseUrl}.catchments.png`}
            alt="Catchments overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 3 }}
          />
        )}

        {/* Radar image - the rain data */}
        <img
          src={currentImage.url}
          alt={`Radar loop frame ${currentIndex + 1}`}
          className="w-full h-full object-contain block relative"
          style={{ zIndex: 4 }}
        />

        {/* Top layers - ON TOP of the radar image */}
        {overlays.range && (
          <img
            src={`${transparencyBaseUrl}.range.png`}
            alt="Range rings overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 5 }}
          />
        )}
        {overlays.locations && (
          <img
            src={`${transparencyBaseUrl}.locations.png`}
            alt="Locations overlay"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{ zIndex: 6 }}
          />
        )}
      </div>

      {/* Compact Playback Controls */}
      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <button
          onClick={handlePrevious}
          className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs"
          disabled={images.length <= 1}
        >
          ◀ Prev
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium text-xs"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={handleNext}
          className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs"
          disabled={images.length <= 1}
        >
          Next ▶
        </button>

        <button
          onClick={handleLatest}
          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs"
          disabled={images.length <= 1 || currentIndex === images.length - 1}
        >
          Latest
        </button>

        <span className="text-xs text-gray-600 ml-2">
          {formatTimestamp(currentImage.timestamp)} • Frame {currentIndex + 1}/{images.length}
        </span>
      </div>
    </div>
  );
}
