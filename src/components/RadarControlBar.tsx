import { RadarRange, RadarMode } from '../types/radar';

interface RadarControlBarProps {
  currentRange: RadarRange;
  onRangeChange: (range: RadarRange) => void;
  currentMode: RadarMode;
  onModeChange: (mode: RadarMode) => void;
  hasDoppler: boolean;
  isDarkMode: boolean;
}

export default function RadarControlBar({
  currentRange,
  onRangeChange,
  currentMode,
  onModeChange,
  hasDoppler,
  isDarkMode,
}: RadarControlBarProps) {
  const ranges: RadarRange[] = ['64', '128', '256', '512'];

  const handleRangeClick = (range: RadarRange) => {
    if (currentMode === 'doppler') {
      // Switch back to rain mode when range is clicked
      onModeChange('rain');
    }
    onRangeChange(range);
  };

  const handleDopplerClick = () => {
    onModeChange('doppler');
  };

  // Base button classes with smooth transitions and modern styling
  const baseButtonClass = `
    px-1.5 py-1 md:px-4 md:py-2.5
    text-[10px] md:text-base font-medium
    rounded-md md:rounded-lg
    transition-all duration-200 ease-out
    transform
    active:scale-95
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
  `;

  // Active button (selected) with beautiful highlight
  const activeButtonClass = isDarkMode
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/60 focus:ring-blue-500'
    : 'bg-blue-500 text-white shadow-lg shadow-blue-400/50 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-400/60 focus:ring-blue-400';

  // Inactive button with subtle hover effect
  const inactiveButtonClass = isDarkMode
    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-md border border-gray-600 focus:ring-gray-500'
    : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-300 focus:ring-gray-300';

  return (
    <div className={`w-full px-1.5 py-2 md:px-2 md:py-3 flex flex-wrap items-center justify-center gap-1 md:gap-2 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'} rounded-t-lg border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Range Buttons */}
      <div className="flex items-center gap-0.5 md:gap-2">
        {ranges.map((range) => {
          const isActive = currentMode === 'rain' && currentRange === range;

          return (
            <button
              key={range}
              onClick={() => handleRangeClick(range)}
              className={`
                ${baseButtonClass}
                ${isActive ? activeButtonClass : inactiveButtonClass}
              `}
              aria-label={`${range} kilometer rain radar range`}
              aria-pressed={isActive}
            >
              <span className="flex items-center gap-0.5">
                <span className="text-[10px] md:text-sm">☔</span>
                <span className="whitespace-nowrap">{range}km</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Vertical Divider */}
      {hasDoppler && (
        <div className={`h-8 w-px ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
      )}

      {/* Doppler Button */}
      {hasDoppler && (
        <button
          onClick={handleDopplerClick}
          className={`
            ${baseButtonClass}
            ${currentMode === 'doppler' ? activeButtonClass : inactiveButtonClass}
          `}
          aria-label="Doppler wind mode"
          aria-pressed={currentMode === 'doppler'}
          title="Show wind speed and direction"
        >
          <span className="flex items-center gap-0.5 md:gap-1.5">
            <svg
              className="w-3 h-3 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 2.75C9 1.784 9.784 1 10.75 1h6.5C18.216 1 19 1.784 19 2.75v.5C19 4.216 18.216 5 17.25 5h-6.5A1.75 1.75 0 019 3.25v-.5zM3 8.75C3 7.784 3.784 7 4.75 7h11.5c.966 0 1.75.784 1.75 1.75v.5c0 .966-.784 1.75-1.75 1.75H4.75A1.75 1.75 0 013 9.25v-.5zM6 14.75c0-.966.784-1.75 1.75-1.75h11.5c.966 0 1.75.784 1.75 1.75v.5c0 .966-.784 1.75-1.75 1.75H7.75A1.75 1.75 0 016 15.25v-.5z"
              />
            </svg>
            <span className="hidden sm:inline whitespace-nowrap">Doppler</span>
          </span>
        </button>
      )}
    </div>
  );
}
