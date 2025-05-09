// hamilton-transit-map/frontend/js/map-manager.js
import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_LAYER_URL, TILE_LAYER_ATTRIBUTION, ELEMENTS } from './config.js';

class MapManager {
    constructor() {
        this.map = null;
        this.busLayerGroup = null;
        this.stopLayerGroup = null;
        this.shapesLayerGroup = null;
        
        this.init();
    }
    
    init() {
        this.map = L.map(ELEMENTS.MAP).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

        L.tileLayer(TILE_LAYER_URL, {
            attribution: TILE_LAYER_ATTRIBUTION
        }).addTo(this.map);
        
        this.busLayerGroup = L.layerGroup().addTo(this.map);
        this.stopLayerGroup = L.layerGroup();
        this.shapesLayerGroup = L.layerGroup();
    }
    
    resetView() {
        this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }
    
    addStopLayer() {
        this.stopLayerGroup.addTo(this.map);
    }
    
    removeStopLayer() {
        this.map.removeLayer(this.stopLayerGroup);
    }
    
    addShapesLayer() {
        this.shapesLayerGroup.addTo(this.map);
    }
    
    removeShapesLayer() {
        this.map.removeLayer(this.shapesLayerGroup);
    }
    
    clearBusLayer() {
        this.busLayerGroup.clearLayers();
    }
    
    clearStopLayer() {
        this.stopLayerGroup.clearLayers();
    }
    
    clearShapesLayer() {
        this.shapesLayerGroup.clearLayers();
    }
    
    addBusMarker(latitude, longitude, icon) {
        return L.marker([latitude, longitude], { icon, zIndexOffset: 1000 }).addTo(this.busLayerGroup);
    }
    
    addStopMarker(latitude, longitude, icon) {
        return L.marker([latitude, longitude], { icon }).addTo(this.stopLayerGroup);
    }
    
    addRouteShape(points, color, weight = 4, opacity = 0.7) {
        return L.polyline(points, { color, weight, opacity }).addTo(this.shapesLayerGroup);
    }
    
    fitToShapes() {
        if (this.shapesLayerGroup.getLayers().length > 0) {
            const bounds = this.shapesLayerGroup.getBounds();
            if (bounds.isValid()) {
                this.map.fitBounds(bounds, {
                    padding: [50, 50]
                });
            }
        }
    }
}

export default MapManager;
