// hamilton-transit-map/frontend/js/app.js
import { ELEMENTS, BUS_UPDATE_INTERVAL } from './config.js';
import MapManager from './map-manager.js';
import RouteManager from './route-manager.js';
import BusManager from './bus-manager.js';
import StopManager from './stop-manager.js';
import ShapeManager from './shape-manager.js';

class TransitApp {
    constructor() {
        this.mapManager = new MapManager();
        this.routeManager = new RouteManager(this.handleRouteSelection.bind(this));
        this.busManager = new BusManager(this.mapManager, this.routeManager);
        this.stopManager = new StopManager(this.mapManager, this.routeManager);
        this.shapeManager = new ShapeManager(this.mapManager, this.routeManager);
        
        this.resetViewButton = document.getElementById(ELEMENTS.RESET_VIEW);
        this.resetViewButton.addEventListener('click', () => this.resetView());
    }
    
    async initialize() {
        await this.routeManager.loadRoutes();
        await this.busManager.updateBusLocations();
        this.setupPeriodicUpdates();
    }
    
    handleRouteSelection(routeId, routeShortName) {
        this.stopManager.resetStopState();
        this.shapeManager.resetShapeState();
        
        if (this.stopManager.stopsVisible) {
            this.stopManager.loadStopsForCurrentSelection();
        }
        
        if (this.shapeManager.shapesVisible) {
            this.shapeManager.loadShapesForCurrentSelection();
        }
        
        this.busManager.updateBusLocations();
    }
    
    resetView() {
        this.mapManager.resetView();
        
        if (this.routeManager.getSelectedRouteId()) {
            this.routeManager.selectRoute(this.routeManager.getSelectedRouteId());
        }
        
        if (this.stopManager.stopsVisible) {
            this.stopManager.loadStopsForCurrentSelection();
        }
        
        if (this.shapeManager.shapesVisible) {
            this.shapeManager.loadShapesForCurrentSelection();
        }
        
        this.busManager.updateBusLocations();
    }
    
    setupPeriodicUpdates() {
        const scheduleNextUpdate = () => {
            setTimeout(() => {
                this.busManager.updateBusLocations();
                scheduleNextUpdate();
            }, BUS_UPDATE_INTERVAL);
        };
        
        scheduleNextUpdate();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new TransitApp();
    app.initialize();
});
