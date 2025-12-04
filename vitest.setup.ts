import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock API handlers
const handlers = [
  // Mock backend radar API
  http.get('http://localhost:3001/api/radar/:productId', ({ params }) => {
    const { productId } = params;
    return HttpResponse.json({
      productId,
      images: [
        {
          url: `/radar/${productId}.T.202512040100.png`,
          timestamp: '202512040100',
        },
        {
          url: `/radar/${productId}.T.202512040106.png`,
          timestamp: '202512040106',
        },
      ],
    });
  }),

  // Mock backend weather API
  http.get('http://localhost:3001/api/weather', () => {
    return HttpResponse.json({
      location: 'Brisbane',
      temperature: 25,
      conditions: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 15,
      windDirection: 'NE',
    });
  }),

  // Mock IP geolocation API
  http.get('https://ipapi.co/json/', () => {
    return HttpResponse.json({
      latitude: -27.4698,
      longitude: 153.0251,
      city: 'Brisbane',
      region: 'Queensland',
      country_name: 'Australia',
    });
  }),

  // Mock BoM radar images
  http.get('https://reg.bom.gov.au/radar/:image', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }),

  // Mock BoM radar transparencies
  http.get('https://reg.bom.gov.au/products/radar_transparencies/:image', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }),
];

// Setup MSW server
const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close server after all tests
afterAll(() => {
  server.close();
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

export { server, handlers };
