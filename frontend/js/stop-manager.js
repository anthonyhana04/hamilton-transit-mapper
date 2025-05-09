// hamilton-transit-map/frontend/js/stop-manager.js
import { API, ELEMENTS, STOP_CHUNK_SIZE, CHUNK_PROCESSING_DELAY } from './config.js';

class StopManager {
    constructor(mapManager, routeManager) {
        this.mapManager = mapManager;
        this.routeManager = routeManager;
        this.stopMarkers = {};
        this.stopsLoaded = false;
        this.stopsVisible = false;
        
        this.toggleStopsButton = document.getElementById(ELEMENTS.TOGGLE_STOPS);
        this.toggleStopsButton.addEventListener('click', () => this.toggleStops());
    }
    
    toggleStops() {
        if (!this.stopsLoaded) {
            this.loadStopsForCurrentSelection();
            return;
        }
        
        if (this.stopsVisible) {
            this.mapManager.removeStopLayer();
            this.toggleStopsButton.textContent = 'Show Bus Stops';
            this.toggleStopsButton.classList.remove('active');
        } else {
            this.mapManager.addStopLayer();
            this.toggleStopsButton.textContent = 'Hide Bus Stops';
            this.toggleStopsButton.classList.add('active');
        }
        
        this.stopsVisible = !this.stopsVisible;
    }
    
    async loadStopsForCurrentSelection() {
        this.mapManager.clearStopLayer();
        Object.keys(this.stopMarkers).forEach(id => delete this.stopMarkers[id]);
        
        this.toggleStopsButton.disabled = true;
        this.toggleStopsButton.textContent = 'Loading Stops...';
        
        const selectedRouteId = this.routeManager.getSelectedRouteId();
        const url = selectedRouteId ? `${API.STOPS}?route_id=${selectedRouteId}` : API.STOPS;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const stops = await response.json();
            if (stops.length === 0) {
                console.warn('No stops data available');
                this.toggleStopsButton.disabled = true;
                this.toggleStopsButton.textContent = 'No Stops Data Available';
                return;
            }
            
            console.log(`Loading ${stops.length} bus stops`);
            
            const stopIcon = L.divIcon({
                html: `<div style="background-color: #333; opacity: 0.6; width: 6px; height: 6px; border-radius: 50%;"></div>`,
                className: '',
                iconSize: [6, 6],
                iconAnchor: [3, 3]
            });
            
            await this.loadStopsInChunks(stops, stopIcon);
            
            this.stopsLoaded = true;
            this.mapManager.addStopLayer();
            this.stopsVisible = true;
            this.toggleStopsButton.disabled = false;
            this.toggleStopsButton.textContent = 'Hide Bus Stops';
            this.toggleStopsButton.classList.add('active');
        } catch (error) {
            console.error('Error loading stops:', error);
            this.toggleStopsButton.disabled = false;
            this.toggleStopsButton.textContent = 'Failed to Load Stops';
        }
    }
    
    loadStopsInChunks(stops, stopIcon) {
        return new Promise(resolve => {
            let index = 0;
            
            const processNextChunk = () => {
                const chunk = stops.slice(index, index + STOP_CHUNK_SIZE);
                
                if (chunk.length === 0) {
                    resolve();
                    return;
                }
                
                chunk.forEach(stop => {
                    const { stop_id, stop_name, latitude, longitude } = stop;
                    
                    const marker = this.mapManager.addStopMarker(latitude, longitude, stopIcon);
                    marker.bindPopup(`<strong>${stop_name}</strong><br>Stop ID: ${stop_id}`);
                    
                    this.stopMarkers[stop_id] = marker;
                });
                
                index += STOP_CHUNK_SIZE;
                this.toggleStopsButton.textContent = `Loading Stops... ${Math.min(index, stops.length)}/${stops.length}`;
                
                setTimeout(processNextChunk, CHUNK_PROCESSING_DELAY);
            };
            
            processNextChunk();
        });
    }
    
    resetStopState() {
        this.stopsLoaded = false;
    }
}

export default StopManager;
