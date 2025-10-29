import { useState, useEffect, useCallback } from 'react';
import { RadarImage, RadarRange, RadarOverlays } from '../types/radar';
import { fetchRadarImages, formatTimestamp } from '../utils/radarApi';

interface RadarViewerProps {
  baseId: string;
}

export function RadarViewer({ baseId }: RadarViewerProps) {
  const [selectedRange, setSelectedRange] = useState<RadarRange>('128');
  const [images, setImages] = useState<RadarImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<RadarOverlays>({
    background: true,
    topography: true,
    catchments: true,
    range: true,
    locations: true,
  });

  // Generate current product ID based on selected range
  const currentProductId = `IDR${baseId}${selectedRange === '64' ? '4' : selectedRange === '128' ? '3' : selectedRange === '256' ? '2' : '1'}`;

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl text-gray-600">Loading radar data...</div>
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
        <div className="text-xl text-gray-600">No radar data available</div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const transparencyBaseUrl = `https://reg.bom.gov.au/products/radar_transparencies/${currentProductId}`;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Range Selector */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Radar Range
        </label>
        <div className="flex gap-4 flex-wrap">
          {(['64', '128', '256', '512'] as RadarRange[]).map((range) => (
            <label key={range} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="range"
                value={range}
                checked={selectedRange === range}
                onChange={(e) => setSelectedRange(e.target.value as RadarRange)}
                className="mr-2"
              />
              <span className="text-sm">{range} km</span>
            </label>
          ))}
        </div>
      </div>

      {/* Overlay Controls */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Map Overlays
        </label>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={overlays.locations}
              onChange={(e) => setOverlays({ ...overlays, locations: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Locations</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={overlays.range}
              onChange={(e) => setOverlays({ ...overlays, range: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Range Rings</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={overlays.topography}
              onChange={(e) => setOverlays({ ...overlays, topography: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Topography</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={overlays.catchments}
              onChange={(e) => setOverlays({ ...overlays, catchments: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Catchments</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={overlays.background}
              onChange={(e) => setOverlays({ ...overlays, background: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm">Background</span>
          </label>
        </div>
      </div>

      {/* Radar Image with Overlays */}
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-lg relative">
        {/* Background layer - behind everything */}
        {overlays.background && (
          <img
            src={`${transparencyBaseUrl}.background.png`}
            alt="Background overlay"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          />
        )}

        {/* Radar image - on top of background */}
        <img
          src={currentImage.url}
          alt={`Radar loop frame ${currentIndex + 1}`}
          className="w-full h-auto block relative"
          style={{ zIndex: 2 }}
        />

        {/* Transparency overlays - on top of radar image */}
        {overlays.topography && (
          <img
            src={`${transparencyBaseUrl}.topography.png`}
            alt="Topography overlay"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 3 }}
          />
        )}
        {overlays.catchments && (
          <img
            src={`${transparencyBaseUrl}.catchments.png`}
            alt="Catchments overlay"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 4 }}
          />
        )}
        {overlays.range && (
          <img
            src={`${transparencyBaseUrl}.range.png`}
            alt="Range rings overlay"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 5 }}
          />
        )}
        {overlays.locations && (
          <img
            src={`${transparencyBaseUrl}.locations.png`}
            alt="Locations overlay"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 6 }}
          />
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col items-center gap-4">
        {/* Timestamp */}
        <div className="text-lg font-medium text-gray-700">
          {formatTimestamp(currentImage.timestamp)}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevious}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            disabled={images.length <= 1}
          >
            Previous
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            disabled={images.length <= 1}
          >
            Next
          </button>
        </div>

        {/* Frame indicator */}
        <div className="text-sm text-gray-600">
          Frame {currentIndex + 1} of {images.length}
        </div>
      </div>
    </div>
  );
}
