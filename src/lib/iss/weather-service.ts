// Weather service for ISS pass predictions
// Uses Open-Meteo API (free, no API key required)

import { ObserverLocation, WeatherConditions } from './types';

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    cloud_cover: number[];
    precipitation: number[];
    visibility: number[];
  };
}

// Good weather thresholds
const GOOD_WEATHER_CLOUD_COVER_MAX = 30; // 30% or less cloud cover
const GOOD_WEATHER_PRECIPITATION_MAX = 0.1; // essentially no precipitation

/**
 * Fetch weather forecast for a location from Open-Meteo API
 * Returns hourly forecast for the next 7 days
 */
export async function fetchWeatherForecast(
  location: ObserverLocation
): Promise<OpenMeteoResponse | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', location.latitude.toFixed(4));
    url.searchParams.set('longitude', location.longitude.toFixed(4));
    url.searchParams.set('hourly', 'cloud_cover,precipitation,visibility');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');

    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'default', // Cache for reasonable time
    });

    if (!response.ok) {
      console.error('Weather API error:', response.status, response.statusText);
      return null;
    }

    const data: OpenMeteoResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch weather forecast:', error);
    return null;
  }
}

/**
 * Get weather conditions for a specific date/time from forecast data
 */
export function getWeatherAtTime(
  forecast: OpenMeteoResponse,
  targetTime: Date
): WeatherConditions | null {
  try {
    const targetTimestamp = targetTime.getTime();

    // Find the closest hour in the forecast
    let closestIndex = 0;
    let closestDiff = Infinity;

    for (let i = 0; i < forecast.hourly.time.length; i++) {
      const forecastTime = new Date(forecast.hourly.time[i]).getTime();
      const diff = Math.abs(forecastTime - targetTimestamp);

      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }

    // Only use forecast if it's within 1 hour of target time
    if (closestDiff > 60 * 60 * 1000) {
      return null;
    }

    const cloudCover = forecast.hourly.cloud_cover[closestIndex] ?? 100;
    const precipitation = forecast.hourly.precipitation[closestIndex] ?? 0;
    const visibility = forecast.hourly.visibility[closestIndex] ?? 0;

    const isGoodWeather =
      cloudCover <= GOOD_WEATHER_CLOUD_COVER_MAX &&
      precipitation <= GOOD_WEATHER_PRECIPITATION_MAX;

    return {
      cloudCover,
      precipitation,
      visibility,
      isGoodWeather,
    };
  } catch (error) {
    console.error('Error extracting weather at time:', error);
    return null;
  }
}

/**
 * Determine if weather conditions are good for viewing
 */
export function isGoodWeatherConditions(weather: WeatherConditions | null | undefined): boolean {
  if (!weather) return false;
  return weather.isGoodWeather;
}

/**
 * Cache for weather forecasts (keyed by lat,lon)
 */
const weatherCache = new Map<string, { forecast: OpenMeteoResponse; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCacheKey(location: ObserverLocation): string {
  return `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
}

/**
 * Fetch weather with caching
 */
export async function fetchWeatherWithCache(
  location: ObserverLocation
): Promise<OpenMeteoResponse | null> {
  const cacheKey = getCacheKey(location);
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.forecast;
  }

  const forecast = await fetchWeatherForecast(location);
  if (forecast) {
    weatherCache.set(cacheKey, { forecast, timestamp: Date.now() });
  }

  return forecast;
}
