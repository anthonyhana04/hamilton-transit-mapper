// hamilton-transit-map/frontend/js/bus-manager.js
import { API, ELEMENTS, DEFAULT_MARKER_COLOR } from './config.js';

class BusManager {
    constructor(mapManager, routeManager) {
        this.mapManager = mapManager;
        this.routeManager = routeManager;
        this.busMarkers = {};
        this.busesByRoute = {};
        this.isUpdating = false;
    }
    
    async updateBusLocations() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        const selectedRouteId = this.routeManager.getSelectedRouteId();
        const url = selectedRouteId ? `${API.BUSES}?route_id=${selectedRouteId}` : API.BUSES;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            document.getElementById(ELEMENTS.UPDATE_TIME).textContent = new Date().toLocaleTimeString();
            
            this.mapManager.clearBusLayer();
            Object.keys(this.busMarkers).forEach(id => delete this.busMarkers[id]);
            
            Object.keys(this.busesByRoute).forEach(id => {
                this.busesByRoute[id] = [];
            });
            this.routeManager.resetBusCounts();
            
            data.forEach(bus => this.addBusToMap(bus));
        } catch (error) {
            console.error('Error fetching bus data:', error);
            document.getElementById(ELEMENTS.UPDATE_TIME).textContent = 'Failed to update';
        } finally {
            this.isUpdating = false;
        }
    }
    
    addBusToMap(bus) {
        const { vehicle_id, route_id, route_short_name, route_color, latitude, longitude, bearing, speed } = bus;
        
        if (!this.busesByRoute[route_id]) {
            this.busesByRoute[route_id] = [];
        }
        this.busesByRoute[route_id].push(vehicle_id);
        
        if (this.routeManager.routeBusCount[route_id]) {
            this.routeManager.updateBusCount(route_id, this.busesByRoute[route_id].length);
        } else if (route_short_name) {
            for (const [rid, shortName] of Object.entries(this.routeManager.routeShortNameMap)) {
                if (shortName === route_short_name && this.routeManager.routeBusCount[rid]) {
                    const count = parseInt(this.routeManager.routeBusCount[rid].textContent || '0');
                    this.routeManager.updateBusCount(rid, count + 1);
                    if (!this.busesByRoute[rid]) {
                        this.busesByRoute[rid] = [];
                    }
                    this.busesByRoute[rid].push(vehicle_id);
                    break;
                }
            }
        }
        
        const color = route_color || this.routeManager.getRouteColor(route_id) || DEFAULT_MARKER_COLOR;
        
        const busIcon = L.divIcon({
            html: `<div style="background-color: ${color}; color: white; font-weight: bold; font-size: 12px; display: flex; justify-content: center; align-items: center; width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 0 3px rgba(0,0,0,0.3);">${route_short_name}</div>`,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        
        const marker = this.mapManager.addBusMarker(latitude, longitude, busIcon);
        
        marker.bindPopup(`
            <strong>Route ${route_short_name}</strong><br>
            Vehicle ID: ${vehicle_id}<br>
            Speed: ${speed ? Math.round(speed * 3.6) + ' km/h' : 'N/A'}
        `);
        
        this.busMarkers[vehicle_id] = marker;
    }
}

export default BusManager;
