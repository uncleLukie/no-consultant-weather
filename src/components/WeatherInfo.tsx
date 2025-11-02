import { useState, useEffect } from 'react';
import { WeatherData } from '../types/radar';
import {
  formatTemperature,
  formatTime,
  getUVCategoryColor,
  getFireDangerColor
} from '../utils/weatherApi';

interface WeatherInfoProps {
  weatherData: WeatherData | null;
  loading?: boolean;
  error?: string | null;
  isDarkMode?: boolean;
}

export default function WeatherInfo({ weatherData, loading, error, isDarkMode = false }: WeatherInfoProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('weatherExpanded');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('weatherExpanded', isExpanded.toString());
  }, [isExpanded]);

  // Loading state
  if (loading) {
    return (
      <div className={`border-b px-4 py-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse flex items-center gap-3">
            <div className={`h-3 rounded w-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className={`h-3 rounded w-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - compact
  if (error) {
    return (
      <div className={`border-b px-4 py-2 ${isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
        <div className="max-w-7xl mx-auto">
          <p className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
            Weather unavailable
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!weatherData) {
    return null;
  }

  const { location, observations, forecast } = weatherData;
  const todayForecast = forecast?.today;

  // Get temperature from observations first, fallback to forecast
  const currentTemp = observations?.temp ?? todayForecast?.temp_max ?? todayForecast?.temp_min;
  const feelsLike = observations?.temp_feels_like;

  // Collapsed view - single compact line
  if (!isExpanded) {
    return (
      <div className={`border-b px-4 py-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-between hover:opacity-75 transition"
          >
            <div className="flex items-center gap-3 text-sm">
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                {location.name}, {location.state}
              </span>
              <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTemperature(currentTemp)}
              </span>
              {todayForecast?.short_text && (
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {todayForecast.short_text}
                </span>
              )}
            </div>
            <svg
              className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Expanded view - detailed info
  return (
    <div className={`border-b px-4 py-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with collapse button */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-baseline gap-3">
              <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {location.name}, {location.state}
              </h2>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatTemperature(currentTemp)}
              </div>
              {feelsLike !== undefined && (
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Feels {formatTemperature(feelsLike)}
                </span>
              )}
            </div>
            {observations?.station?.name && (
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Station: {observations.station.name}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className={`p-1 rounded hover:bg-opacity-75 transition ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            aria-label="Collapse weather info"
          >
            <svg
              className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Forecast Summary */}
        {todayForecast && (
          <div className="mb-2 pb-2 border-b border-opacity-50" style={{ borderColor: isDarkMode ? '#4B5563' : '#E5E7EB' }}>
            {todayForecast.short_text && (
              <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {todayForecast.short_text}
              </p>
            )}
            <div className={`flex gap-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {todayForecast.temp_max !== undefined && (
                <span>High: {formatTemperature(todayForecast.temp_max)}</span>
              )}
              {todayForecast.temp_min !== undefined && (
                <span>Low: {formatTemperature(todayForecast.temp_min)}</span>
              )}
              {todayForecast.rain?.chance !== undefined && (
                <span>Rain: {todayForecast.rain.chance}%</span>
              )}
            </div>
          </div>
        )}

        {/* Compact Details Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
          {/* Humidity */}
          {observations?.humidity !== undefined && (
            <div>
              <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Humidity</p>
              <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {observations.humidity}%
              </p>
            </div>
          )}

          {/* Wind */}
          {observations?.wind?.speed_kilometre !== undefined && (
            <div>
              <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Wind</p>
              <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {observations.wind.direction || ''} {Math.round(observations.wind.speed_kilometre)}
              </p>
            </div>
          )}

          {/* Rain */}
          {observations?.rain_since_9am !== undefined && (
            <div>
              <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Rain</p>
              <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {observations.rain_since_9am}mm
              </p>
            </div>
          )}

          {/* UV */}
          {todayForecast?.uv?.max_index !== undefined && (
            <div>
              <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>UV</p>
              <p className={`font-semibold ${getUVCategoryColor(todayForecast.uv.category)}`}>
                {todayForecast.uv.max_index}
              </p>
            </div>
          )}

          {/* Fire */}
          {todayForecast?.fire_danger && (
            <div>
              <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Fire</p>
              <p className={`font-semibold capitalize ${getFireDangerColor(todayForecast.fire_danger)}`}>
                {todayForecast.fire_danger}
              </p>
            </div>
          )}

          {/* Sunrise */}
          {todayForecast?.astronomical?.sunrise_time && (
            <div>
              <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Sunrise</p>
              <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatTime(todayForecast.astronomical.sunrise_time)}
              </p>
            </div>
          )}

          {/* Sunset */}
          {todayForecast?.astronomical?.sunset_time && (
            <div>
              <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Sunset</p>
              <p className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatTime(todayForecast.astronomical.sunset_time)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
