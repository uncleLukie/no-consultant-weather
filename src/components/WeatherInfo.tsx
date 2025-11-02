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

// Weather icon helper
function getWeatherIcon(iconDescriptor?: string): string {
  if (!iconDescriptor) return '☀️';

  const descriptor = iconDescriptor.toLowerCase();
  if (descriptor.includes('sunny')) return '☀️';
  if (descriptor.includes('clear')) return '🌙';
  if (descriptor.includes('cloud')) return '☁️';
  if (descriptor.includes('partly')) return '⛅';
  if (descriptor.includes('shower') || descriptor.includes('rain')) return '🌧️';
  if (descriptor.includes('storm')) return '⛈️';
  if (descriptor.includes('fog')) return '🌫️';
  if (descriptor.includes('wind')) return '💨';

  return '🌤️';
}

// Temperature color helper
function getTemperatureColor(temp?: number, isDark = false): string {
  if (temp === undefined) return isDark ? 'text-gray-200' : 'text-gray-900';

  if (temp >= 35) return 'text-red-600';
  if (temp >= 30) return 'text-orange-500';
  if (temp >= 25) return 'text-yellow-600';
  if (temp >= 20) return 'text-green-600';
  if (temp >= 15) return 'text-blue-500';
  if (temp >= 10) return 'text-blue-600';
  return 'text-blue-700';
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
        <div className="max-w-full mx-auto text-center">
          <div className="animate-pulse flex items-center justify-center gap-3">
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
        <div className="max-w-full mx-auto text-center">
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
  const weatherIcon = getWeatherIcon(todayForecast?.icon_descriptor);

  // Collapsed view - single compact line
  if (!isExpanded) {
    return (
      <div className={`border-b px-4 py-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-full mx-auto">
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center hover:opacity-75 transition gap-3 text-sm"
          >
            <span className="text-2xl">{weatherIcon}</span>
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
              {location.name}, {location.state}
            </span>
            <span className={`font-bold text-lg ${getTemperatureColor(currentTemp, isDarkMode)}`}>
              {formatTemperature(currentTemp)}
            </span>
            {todayForecast?.short_text && (
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {todayForecast.short_text}
              </span>
            )}
            <svg
              className={`w-4 h-4 ml-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
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

  // Expanded view - detailed info (center-aligned, compact single row)
  return (
    <div className={`border-b px-4 py-2.5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="max-w-full mx-auto">
        {/* Header with collapse button - centered */}
        <div className="flex items-center justify-center mb-2 relative">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{weatherIcon}</span>
            <div className="text-center">
              <div className="flex items-baseline gap-2">
                <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {location.name}, {location.state}
                </h2>
                <div className={`text-xl font-bold ${getTemperatureColor(currentTemp, isDarkMode)}`}>
                  {formatTemperature(currentTemp)}
                </div>
              </div>
              {todayForecast?.short_text && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {todayForecast.short_text}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className={`absolute right-0 p-1 rounded hover:bg-opacity-75 transition ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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

        {/* Single compact details row - centered */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          {/* High/Low */}
          {(todayForecast?.temp_max !== undefined || todayForecast?.temp_min !== undefined) && (
            <div className="flex items-center gap-1.5">
              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>H/L:</span>
              <span className={`font-semibold ${getTemperatureColor(todayForecast?.temp_max, isDarkMode)}`}>
                {formatTemperature(todayForecast?.temp_max)}
              </span>
              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>/</span>
              <span className={`font-semibold ${getTemperatureColor(todayForecast?.temp_min, isDarkMode)}`}>
                {formatTemperature(todayForecast?.temp_min)}
              </span>
            </div>
          )}

          {/* Rain */}
          {todayForecast?.rain?.chance !== undefined && (
            <div className="flex items-center gap-1">
              <span>💧</span>
              <span className={`font-semibold ${todayForecast.rain.chance > 60 ? 'text-blue-500' : isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {todayForecast.rain.chance}%
              </span>
            </div>
          )}

          {/* Humidity */}
          {observations?.humidity !== undefined && (
            <div className="flex items-center gap-1">
              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Humidity:</span>
              <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {observations.humidity}%
              </span>
            </div>
          )}

          {/* Wind */}
          {observations?.wind?.speed_kilometre !== undefined && (
            <div className="flex items-center gap-1">
              <span>💨</span>
              <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {observations.wind.direction || ''} {Math.round(observations.wind.speed_kilometre)}km/h
              </span>
            </div>
          )}

          {/* UV */}
          {todayForecast?.uv?.max_index !== undefined && (
            <div className="flex items-center gap-1">
              <span>☀️</span>
              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>UV:</span>
              <span className={`font-semibold ${getUVCategoryColor(todayForecast.uv.category)}`}>
                {todayForecast.uv.max_index}
              </span>
            </div>
          )}

          {/* Fire */}
          {todayForecast?.fire_danger && (
            <div className="flex items-center gap-1">
              <span>🔥</span>
              <span className={`font-semibold capitalize ${getFireDangerColor(todayForecast.fire_danger)}`}>
                {todayForecast.fire_danger}
              </span>
            </div>
          )}

          {/* Sunrise */}
          {todayForecast?.astronomical?.sunrise_time && (
            <div className="flex items-center gap-1">
              <span>🌅</span>
              <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatTime(todayForecast.astronomical.sunrise_time)}
              </span>
            </div>
          )}

          {/* Sunset */}
          {todayForecast?.astronomical?.sunset_time && (
            <div className="flex items-center gap-1">
              <span>🌇</span>
              <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatTime(todayForecast.astronomical.sunset_time)}
              </span>
            </div>
          )}
        </div>

        {/* Station info - centered, smaller */}
        {observations?.station?.name && (
          <p className={`text-center text-xs mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Station: {observations.station.name}
          </p>
        )}
      </div>
    </div>
  );
}
