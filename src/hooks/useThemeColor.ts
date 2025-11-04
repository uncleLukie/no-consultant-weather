import { useEffect } from 'react';

/**
 * Updates the browser theme-color meta tag to match the app's dark mode setting.
 * This ensures Safari's browser chrome (top/bottom bars) matches the app theme.
 */
export function useThemeColor(isDarkMode: boolean) {
  useEffect(() => {
    // Remove existing theme-color meta tags
    const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
    existingMetas.forEach(meta => meta.remove());

    // Create new meta tag with current theme color
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = isDarkMode ? '#111827' : '#f9fafb'; // gray-900 : gray-50
    document.head.appendChild(meta);
  }, [isDarkMode]);
}
