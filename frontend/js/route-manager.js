// hamilton-transit-map/frontend/js/route-manager.js
import { API, ELEMENTS } from './config.js';

class RouteManager {
    constructor(onRouteSelect) {
        this.routesData = [];
        this.routeColors = {};
        this.routeBusCount = {};
        this.routeShortNameMap = {};
        this.selectedRouteId = null;
        this.selectedRouteShortName = null;
        this.routesLoaded = false;
        this.onRouteSelect = onRouteSelect;
    }
    
    async loadRoutes() {
        if (this.routesLoaded) {
            return;
        }
        
        try {
            const response = await fetch(API.ROUTES);
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const routes = await response.json();
            this.routesData = routes;
            this.renderRoutesList();
            this.routesLoaded = true;
            return routes;
        } catch (error) {
            console.error('Error loading routes:', error);
            return [];
        }
    }
    
    renderRoutesList() {
        const routesList = document.getElementById(ELEMENTS.ROUTES_LIST);
        routesList.innerHTML = '';
        
        this.routesData.forEach(route => {
            const { route_id, route_short_name, route_color } = route;
            
            this.routeColors[route_id] = route_color;
            this.routeShortNameMap[route_id] = route_short_name;
            
            const routeItem = document.createElement('div');
            routeItem.className = 'route-item';
            routeItem.dataset.routeId = route_id;
            routeItem.dataset.routeShortName = route_short_name;
            routeItem.addEventListener('click', () => this.selectRoute(route_id));
            
            const routeColor = document.createElement('div');
            routeColor.className = 'route-color';
            routeColor.style.backgroundColor = route_color;
            
            const routeName = document.createElement('span');
            routeName.textContent = `Route ${route_short_name}`;
            
            const busCount = document.createElement('span');
            busCount.className = 'bus-count';
            busCount.textContent = '0';
            this.routeBusCount[route_id] = busCount;
            
            routeItem.appendChild(routeColor);
            routeItem.appendChild(routeName);
            routeItem.appendChild(busCount);
            routesList.appendChild(routeItem);
        });
    }
    
    selectRoute(routeId) {
        const routeItem = document.querySelector(`.route-item[data-route-id="${routeId}"]`);
        const routeShortName = routeItem ? routeItem.dataset.routeShortName : null;
        
        if (this.selectedRouteId === routeId) {
            this.selectedRouteId = null;
            this.selectedRouteShortName = null;
            
            const activeRoutes = document.querySelectorAll('.route-item.active');
            activeRoutes.forEach(route => route.classList.remove('active'));
        } else {
            this.selectedRouteId = routeId;
            this.selectedRouteShortName = routeShortName;
            
            const activeRoutes = document.querySelectorAll('.route-item.active');
            activeRoutes.forEach(route => route.classList.remove('active'));
            
            if (routeItem) {
                routeItem.classList.add('active');
            }
        }
        
        if (this.onRouteSelect) {
            this.onRouteSelect(this.selectedRouteId, this.selectedRouteShortName);
        }
    }
    
    updateBusCount(routeId, count) {
        if (this.routeBusCount[routeId]) {
            this.routeBusCount[routeId].textContent = count;
        }
    }
    
    resetBusCounts() {
        Object.keys(this.routeBusCount).forEach(routeId => {
            if (this.routeBusCount[routeId]) {
                this.routeBusCount[routeId].textContent = '0';
            }
        });
    }
    
    getRouteColor(routeId) {
        return this.routeColors[routeId] || null;
    }
    
    getShortName(routeId) {
        return this.routeShortNameMap[routeId] || routeId;
    }
    
    getSelectedRouteId() {
        return this.selectedRouteId;
    }
    
    getSelectedRouteShortName() {
        return this.selectedRouteShortName;
    }
}

export default RouteManager;
