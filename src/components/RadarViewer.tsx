import { useState, useEffect, useCallback } from 'react';
import { RadarImage, RadarRange, RadarOverlays, RadarMode } from '../types/radar';
import { fetchRadarImages, formatTimestamp, buildProductId } from '../utils/radarApi';
import RainLegend from './RainLegend';
import RadarControlBar from './RadarControlBar';

interface RadarViewerProps {
  baseId: string;
  isDarkMode: boolean;
  selectedRange: RadarRange;
  onRangeChange: (range: RadarRange) => void;
  currentMode: RadarMode;
  onModeChange: (mode: RadarMode) => void;
  hasDoppler: boolean;
  dopplerProductId?: string;
  overlays: RadarOverlays;
  onError?: (error: string | null) => void;
}

export function RadarViewer({
  baseId,
  isDarkMode,
  selectedRange,
  onRangeChange,
  currentMode,
  onModeChange,
  hasDoppler,
  dopplerProductId,
  overlays,
  onError
}: RadarViewerProps) {
  const [images, setImages] = useState<RadarImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate current product ID based on mode and range
  const currentProductId = buildProductId(baseId, currentMode, selectedRange, dopplerProductId);

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

  // For overlays, always use the rain radar product ID (128km default)
  // Doppler products don't have overlay images, so we use the rain radar overlays
  const overlayProductId = currentMode === 'doppler'
    ? `IDR${baseId}3` // 128km rain radar for overlays
    : currentProductId;

  const transparencyBaseUrl = `https://reg.bom.gov.au/products/radar_transparencies/${overlayProductId}`;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Radar Controls */}
      <div className="w-full max-w-4xl mx-auto">
        <RadarControlBar
          currentRange={selectedRange}
          onRangeChange={onRangeChange}
          currentMode={currentMode}
          onModeChange={onModeChange}
          hasDoppler={hasDoppler}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Radar Image with Overlays */}
      <div className={`w-full max-w-4xl mx-auto rounded-b overflow-hidden shadow relative ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} style={{ aspectRatio: '1' }}>
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
          className="absolute inset-0 w-full h-full object-contain block"
          style={{ zIndex: 4, objectPosition: 'center' }}
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

      {/* Rain Rate Legend - Mobile/Tablet Only */}
      <div className="lg:hidden">
        <RainLegend isDarkMode={isDarkMode} inline={true} />
      </div>

      {/* Time and Frame Info */}
      <div className={`mt-2 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <div className="text-sm md:text-base font-medium">
          {formatTimestamp(currentImage.timestamp)}
        </div>
        <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Frame {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={handlePrevious}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium whitespace-nowrap"
          disabled={images.length <= 1}
        >
          ◀ Prev
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold whitespace-nowrap"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={handleNext}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium whitespace-nowrap"
          disabled={images.length <= 1}
        >
          Next ▶
        </button>

        <button
          onClick={handleLatest}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium whitespace-nowrap"
          disabled={images.length <= 1 || currentIndex === images.length - 1}
        >
          Latest
        </button>
      </div>
    </div>
  );
}
