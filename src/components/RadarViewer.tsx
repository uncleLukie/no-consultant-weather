import { useState, useEffect, useCallback } from 'react';
import { RadarImage } from '../types/radar';
import { fetchRadarImages, formatTimestamp } from '../utils/radarApi';

interface RadarViewerProps {
  productId: string;
}

export function RadarViewer({ productId }: RadarViewerProps) {
  const [images, setImages] = useState<RadarImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch radar images
  useEffect(() => {
    let mounted = true;

    async function loadImages() {
      setIsLoading(true);
      setError(null);

      try {
        const radarImages = await fetchRadarImages(productId);

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
  }, [productId]);

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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Radar Image */}
      <div className="bg-gray-100 rounded-lg overflow-hidden shadow-lg">
        <img
          src={currentImage.url}
          alt={`Radar loop frame ${currentIndex + 1}`}
          className="w-full h-auto"
        />
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
