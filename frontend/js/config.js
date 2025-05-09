// hamilton-transit-map/frontend/js/config.js

// Default map settings
export const DEFAULT_CENTER = [43.2557, -79.8711];
export const DEFAULT_ZOOM = 13;

// Map layers
export const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_LAYER_ATTRIBUTION = '© OpenStreetMap contributors';

// API endpoints
export const API = {
    BUSES: '/api/buses',
    STOPS: '/api/stops',
    SHAPES: '/api/shapes',
    ROUTES: '/api/routes',
    STATUS: '/api/status'
};

// UI elements
export const ELEMENTS = {
    MAP: 'map',
    UPDATE_TIME: 'update-time',
    TOGGLE_STOPS: 'toggle-stops',
    TOGGLE_SHAPES: 'toggle-shapes',
    RESET_VIEW: 'reset-view',
    ROUTES_LIST: 'routes-list'
};

// Visual settings
export const DEFAULT_ROUTE_COLOR = '#1A4D2E';
export const DEFAULT_MARKER_COLOR = '#FF0000';
export const BUS_UPDATE_INTERVAL = 60000; // milliseconds

// Chunk processing
export const STOP_CHUNK_SIZE = 200;
export const CHUNK_PROCESSING_DELAY = 10; // milliseconds
