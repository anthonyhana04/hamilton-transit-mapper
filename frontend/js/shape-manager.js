// hamilton-transit-map/frontend/js/shape-manager.js
import { API, ELEMENTS, DEFAULT_ROUTE_COLOR } from './config.js';

class ShapeManager {
    constructor(mapManager, routeManager) {
        this.mapManager = mapManager;
        this.routeManager = routeManager;
        this.shapesLoaded = false;
        this.shapesVisible = false;
        
        this.toggleShapesButton = document.getElementById(ELEMENTS.TOGGLE_SHAPES);
        this.toggleShapesButton.addEventListener('click', () => this.toggleShapes());
    }
    
    toggleShapes() {
        if (!this.shapesLoaded) {
            this.loadShapesForCurrentSelection();
            return;
        }
        
        if (this.shapesVisible) {
            this.mapManager.removeShapesLayer();
            this.toggleShapesButton.textContent = 'Show Route Shapes';
            this.toggleShapesButton.classList.remove('active');
        } else {
            this.mapManager.addShapesLayer();
            this.toggleShapesButton.textContent = 'Hide Route Shapes';
            this.toggleShapesButton.classList.add('active');
        }
        
        this.shapesVisible = !this.shapesVisible;
    }
    
    async loadShapesForCurrentSelection() {
        this.mapManager.clearShapesLayer();
        
        this.toggleShapesButton.disabled = true;
        this.toggleShapesButton.textContent = 'Loading Shapes...';
        
        const selectedRouteId = this.routeManager.getSelectedRouteId();
        const url = selectedRouteId ? `${API.SHAPES}?route_id=${selectedRouteId}` : API.SHAPES;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const shapes = await response.json();
            if (Object.keys(shapes).length === 0) {
                console.warn('No shapes data available');
                this.toggleShapesButton.disabled = true;
                this.toggleShapesButton.textContent = 'No Shapes Data Available';
                return;
            }
            
            console.log(`Loaded ${Object.keys(shapes).length} route shapes`);
            
            const color = selectedRouteId && this.routeManager.getRouteColor(selectedRouteId)
                ? this.routeManager.getRouteColor(selectedRouteId)
                : DEFAULT_ROUTE_COLOR;
            
            Object.keys(shapes).forEach(shapeId => {
                const points = shapes[shapeId];
                this.mapManager.addRouteShape(points, color);
            });
            
            this.shapesLoaded = true;
            this.mapManager.addShapesLayer();
            this.shapesVisible = true;
            this.toggleShapesButton.disabled = false;
            this.toggleShapesButton.textContent = 'Hide Route Shapes';
            this.toggleShapesButton.classList.add('active');
            
            if (selectedRouteId) {
                this.mapManager.fitToShapes();
            }
        } catch (error) {
            console.error('Error loading shapes:', error);
            this.toggleShapesButton.disabled = false;
            this.toggleShapesButton.textContent = 'Failed to Load Shapes';
        }
    }
    
    resetShapeState() {
        this.shapesLoaded = false;
    }
}

export default ShapeManager;
