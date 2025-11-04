import { useEffect, useState } from 'react';
import { RadarRange, RadarOverlays } from '../types/radar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: RadarRange;
  onRangeChange: (range: RadarRange) => void;
  overlays: RadarOverlays;
  onOverlaysChange: (overlays: RadarOverlays) => void;
  isDarkMode: boolean;
  onDarkModeChange: (isDarkMode: boolean) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  selectedRange,
  onRangeChange,
  overlays,
  onOverlaysChange,
  isDarkMode,
  onDarkModeChange,
}: SettingsModalProps) {
  // Pending state - changes don't apply until modal closes
  const [pendingRange, setPendingRange] = useState(selectedRange);
  const [pendingOverlays, setPendingOverlays] = useState(overlays);
  const [pendingDarkMode, setPendingDarkMode] = useState(isDarkMode);

  // Initialize pending state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPendingRange(selectedRange);
      setPendingOverlays(overlays);
      setPendingDarkMode(isDarkMode);
    }
  }, [isOpen, selectedRange, overlays, isDarkMode]);

  // Apply changes when closing
  const handleClose = () => {
    onRangeChange(pendingRange);
    onOverlaysChange(pendingOverlays);
    onDarkModeChange(pendingDarkMode);
    onClose();
  };
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className={`relative w-full max-w-md rounded-lg shadow-2xl ${
          pendingDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
        } animate-fadeIn`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            pendingDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <h2 id="settings-title" className="text-xl font-semibold">
            Settings
          </h2>
          <button
            onClick={handleClose}
            className={`text-2xl leading-none hover:opacity-70 transition ${
              pendingDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-3 sm:py-5 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-16rem)] sm:max-h-[60vh]">
          {/* Radar Range Section */}
          <div>
            <h3
              className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                pendingDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Radar Range
            </h3>
            <div className="space-y-2">
              {(['64', '128', '256', '512'] as RadarRange[]).map((range) => (
                <label
                  key={range}
                  className={`flex items-center cursor-pointer p-2 rounded transition ${
                    pendingDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="range"
                    value={range}
                    checked={pendingRange === range}
                    onChange={() => setPendingRange(range)}
                    className="w-4 h-4 mr-3"
                  />
                  <span className="text-base">{range} km</span>
                </label>
              ))}
            </div>
          </div>

          {/* Map Layers Section */}
          <div>
            <h3
              className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                pendingDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Map Layers
            </h3>
            <div className="space-y-2">
              <label
                className={`flex items-center cursor-pointer p-2 rounded transition ${
                  pendingDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pendingOverlays.locations}
                  onChange={(e) =>
                    setPendingOverlays({ ...pendingOverlays, locations: e.target.checked })
                  }
                  className="w-4 h-4 mr-3"
                />
                <span className="text-base">Locations</span>
              </label>

              <label
                className={`flex items-center cursor-pointer p-2 rounded transition ${
                  pendingDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pendingOverlays.range}
                  onChange={(e) =>
                    setPendingOverlays({ ...pendingOverlays, range: e.target.checked })
                  }
                  className="w-4 h-4 mr-3"
                />
                <span className="text-base">Range Rings</span>
              </label>

              <label
                className={`flex items-center cursor-pointer p-2 rounded transition ${
                  pendingDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pendingOverlays.topography}
                  onChange={(e) =>
                    setPendingOverlays({ ...pendingOverlays, topography: e.target.checked })
                  }
                  className="w-4 h-4 mr-3"
                />
                <span className="text-base">Topography</span>
              </label>

              <label
                className={`flex items-center cursor-pointer p-2 rounded transition ${
                  pendingDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pendingOverlays.catchments}
                  onChange={(e) =>
                    setPendingOverlays({ ...pendingOverlays, catchments: e.target.checked })
                  }
                  className="w-4 h-4 mr-3"
                />
                <span className="text-base">Catchments</span>
              </label>

              <label
                className={`flex items-center cursor-pointer p-2 rounded transition ${
                  pendingDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pendingOverlays.background}
                  onChange={(e) =>
                    setPendingOverlays({ ...pendingOverlays, background: e.target.checked })
                  }
                  className="w-4 h-4 mr-3"
                />
                <span className="text-base">Background</span>
              </label>
            </div>
          </div>

          {/* Appearance Section */}
          <div>
            <h3
              className={`text-sm font-semibold uppercase tracking-wide mb-3 ${
                pendingDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Appearance
            </h3>
            <div className="space-y-2">
              <label
                className={`flex items-center cursor-pointer p-2 rounded transition ${
                  pendingDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={pendingDarkMode}
                  onChange={(e) => setPendingDarkMode(e.target.checked)}
                  className="w-4 h-4 mr-3"
                />
                <span className="text-base">Dark Mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t ${
            pendingDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <button
            onClick={handleClose}
            className={`w-full py-2.5 rounded font-medium transition ${
              pendingDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
