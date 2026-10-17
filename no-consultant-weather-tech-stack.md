# No Consultant Weather - Tech Stack

This document outlines the technical architecture and choices for the "No Consultant Weather" application.

## Core Architecture
The application is a modern Single Page Application (SPA) built with React, utilizng Cloudflare Workers for its backend API layer.

### Frontend
- **Framework:** **React v19** - Utilizing the latest React features for efficient UI rendering.
- **Language:** **TypeScript v5.9** - ensuring type safety and code maintainability across the codebase.
- **Build Tool:** **Vite v7** - Chosen for its fast development server and optimized production builds.
- **Routing:** **React Router v7** - Handling client-side navigation.
- **State Management:** React Hooks (implied / native).

### Styling
- **CSS Framework:** **Tailwind CSS v4** - Using the latest version of the utility-first CSS framework for rapid UI development.
- **Processor:** **PostCSS** - Handling CSS transformations.

### Backend & Infrastructure
- **Serverless Platform:** **Cloudflare Workers** - The API logic (`workers/api.js`) resides on the Cloudflare edge network, ensuring low latency and high availability.
- **Deployment Tool:** **Wrangler** - The CLI tool used for developing and deploying Cloudflare Workers.

### Testing Strategy
- **Test Runner:** **Vitest** - A fast unit test framework powered by Vite, offering a Jest-compatible API.
- **Component Testing:** **React Testing Library** - Testing components in a way that resembles user interaction.
- **Environment:** **Happy DOM** - A lightweight DOM implementation for faster test execution.
- **API Mocking:** **MSW (Mock Service Worker)** - Intercepting and mocking network requests at the network layer for integration testing.

## Directory Structure Highlights
- `/src` - React application source code.
- `/workers` - Cloudflare Worker scripts (API backend).
- `/public` - Static assets.
