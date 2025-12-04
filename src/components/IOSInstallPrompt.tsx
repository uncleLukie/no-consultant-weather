import { useState, useEffect } from 'react';

interface IOSInstallPromptProps {
  isDarkMode: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function IOSInstallPrompt({ isDarkMode, isOpen: manualOpen, onClose }: IOSInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // If manually opened, show it
    if (manualOpen) {
      setShowPrompt(true);
      return;
    }

    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Check if running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // Check if browser is Safari (not Chrome/Firefox on iOS)
    // Safari usually contains "Safari" but not "CriOS" (Chrome) or "FxiOS" (Firefox)
    const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);

    // Show prompt only if on iOS Safari and NOT standalone
    if (isIOS && isSafari && !isStandalone) {
      // Check if user has already dismissed it recently (optional, maybe implemented later)
      setShowPrompt(true);
    }
  }, [manualOpen]);

  const handleClose = () => {
    setShowPrompt(false);
    onClose?.();
  };

  if (!showPrompt) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-4 pb-8 z-50 shadow-lg border-t transition-transform duration-500 transform translate-y-0 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <div className="max-w-screen-md mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Install App</h3>
          <button
            onClick={handleClose}
            className={`text-xl leading-none ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm font-medium">
          <span>1. Tap the</span>
          <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded text-blue-600 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            {/* iOS Share Icon approximation if needed, but generic share icon is often understood.
                  Let's use a more iOS-like share icon SVG */}
            <svg className="h-5 w-5 absolute bg-gray-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </span>
          <span>Share button below</span>
        </div>

        <div className="flex items-center gap-3 text-sm font-medium">
          <span>2. Select</span>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Home Screen
          </span>
        </div>

        {/* Pointing arrow at the bottom center to indicate where the share button usually is on Safari */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full">
          <div className={`w-4 h-4 rotate-45 border-r border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}></div>
        </div>
      </div>
    </div>
  );
}
