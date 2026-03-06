import { useState, useEffect, useCallback } from 'react';
import { RadarImage, RadarRange, RadarOverlays, RadarMode } from '../types/radar';
import { fetchRadarImages, formatTimestamp, buildProductId } from '../utils/radarApi';
import RainLegend from './RainLegend';

interface RadarViewerProps {
  baseId: string;
  isDarkMode: boolean;
  selectedRange: RadarRange;
  currentMode: RadarMode;
  dopplerProductId?: string;
  overlays: RadarOverlays;
  onError?: (error: string | null) => void;
}

export function RadarViewer({
  baseId,
  isDarkMode,
  selectedRange,
  currentMode,
  dopplerProductId,
  overlays,
  onError
}: RadarViewerProps) {
  const [images, setImages] = useState<RadarImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

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

  const currentImage = images[currentIndex];

  // For overlays, always use the rain radar product ID (128km default)
  // Doppler products don't have overlay images, so we use the rain radar overlays
  const overlayProductId = currentMode === 'doppler'
    ? `IDR${baseId}3` // 128km rain radar for overlays
    : currentProductId;

  const transparencyBaseUrl = `https://reg.bom.gov.au/products/radar_transparencies/${overlayProductId}`;

  return (
    <div className="h-full flex flex-col items-center">
      {/* Radar Image with Overlays - This should take maximum available space */}
      <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center p-1 md:p-2 lg:p-4">
        <div 
          className={`relative w-full h-full max-w-full max-h-full rounded shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} 
          style={{ 
            aspectRatio: '1',
            maxHeight: 'calc(100vh - 180px)' // Account for header and controls
          }}
        >
          {/* Subtle loading indicator overlay */}
          {isLoading && (
            <div className="absolute top-2 right-2 z-50 flex items-center gap-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-[10px] text-white">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Loading...
            </div>
          )}

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
          {images.length > 0 && currentImage && (
            <img
              src={currentImage.url}
              alt={`Radar loop frame ${currentIndex + 1}`}
              className="absolute inset-0 w-full h-full object-contain block"
              style={{ zIndex: 4, objectPosition: 'center' }}
            />
          )}

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
          
          {/* Time and Frame Info Overlay (instead of separate div) */}
          <div className="absolute bottom-2 left-2 z-50 px-2 py-1 bg-black/40 backdrop-blur-sm rounded text-white text-xs md:text-sm">
            {images.length > 0 && currentImage ? (
              <>
                <div className="font-bold">{formatTimestamp(currentImage.timestamp)}</div>
                <div className="opacity-80">Frame {currentIndex + 1} / {images.length}</div>
              </>
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
      </div>

      {/* Playback Controls - Minimal padding */}
      <div className="w-full lg:max-w-4xl px-2 py-1 flex items-center justify-center gap-1 md:gap-2 flex-wrap">
        <button
          onClick={handlePrevious}
          className="p-2 md:px-4 md:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium"
          disabled={images.length <= 1}
          title="Previous Frame"
        >
          <span className="md:hidden">◀</span>
          <span className="hidden md:inline">◀ Prev</span>
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-bold min-w-[100px]"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={handleNext}
          className="p-2 md:px-4 md:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium"
          disabled={images.length <= 1}
          title="Next Frame"
        >
          <span className="md:hidden">▶</span>
          <span className="hidden md:inline">Next ▶</span>
        </button>

        <button
          onClick={handleLatest}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
          disabled={images.length <= 1 || currentIndex === images.length - 1}
        >
          Latest
        </button>
      </div>

      {/* Rain Rate Legend - Mobile/Tablet Only */}
      <div className="lg:hidden w-full px-4">
        <RainLegend isDarkMode={isDarkMode} inline={true} />
      </div>
    </div>
  );
}
