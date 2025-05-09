// hamilton-transit-map/frontend/js/app.js
const map = L.map('map').setView([43.2557, -79.8711], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const stopLayerGroup = L.layerGroup();
const busLayerGroup = L.layerGroup().addTo(map);

const busesByRoute = {};
const busMarkers = {};
const stopMarkers = {};
const routeColors = {};
let isUpdating = false;
let stopsLoaded = false;
let stopsVisible = false;

const toggleStopsButton = document.getElementById('toggle-stops');
toggleStopsButton.addEventListener('click', toggleStops);

function toggleStops() {
    if (!stopsLoaded) {
        loadStops();
        return;
    }
    
    if (stopsVisible) {
        map.removeLayer(stopLayerGroup);
        toggleStopsButton.textContent = 'Show Bus Stops';
    } else {
        stopLayerGroup.addTo(map);
        toggleStopsButton.textContent = 'Hide Bus Stops';
    }
    
    stopsVisible = !stopsVisible;
}

function loadStops() {
    if (stopsLoaded) return;
    
    toggleStopsButton.disabled = true;
    toggleStopsButton.textContent = 'Loading Stops...';
    
    fetch('/api/stops')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            return response.json();
        })
        .then(stops => {
            if (stops.length === 0) {
                console.warn('No stops data available');
                toggleStopsButton.disabled = true;
                toggleStopsButton.textContent = 'No Stops Data Available';
                return;
            }
            
            console.log(`Loading ${stops.length} bus stops`);
            
            const stopIcon = L.divIcon({
                html: `<div style="background-color: #333; opacity: 0.6; width: 6px; height: 6px; border-radius: 50%;"></div>`,
                className: '',
                iconSize: [6, 6],
                iconAnchor: [3, 3]
            });
            
            // Process stops in chunks to avoid blocking the UI
            const CHUNK_SIZE = 200;
            let index = 0;
            
            function processNextChunk() {
                const chunk = stops.slice(index, index + CHUNK_SIZE);
                
                if (chunk.length === 0) {
                    // All stops loaded
                    stopsLoaded = true;
                    stopLayerGroup.addTo(map);
                    stopsVisible = true;
                    toggleStopsButton.disabled = false;
                    toggleStopsButton.textContent = 'Hide Bus Stops';
                    return;
                }
                
                chunk.forEach(stop => {
                    const { stop_id, stop_name, latitude, longitude } = stop;
                    
                    const marker = L.marker([latitude, longitude], { icon: stopIcon })
                        .addTo(stopLayerGroup);
                    
                    marker.bindPopup(`<strong>${stop_name}</strong><br>Stop ID: ${stop_id}`);
                    
                    stopMarkers[stop_id] = marker;
                });
                
                index += CHUNK_SIZE;
                toggleStopsButton.textContent = `Loading Stops... ${Math.min(index, stops.length)}/${stops.length}`;
                
                // Process next chunk after a brief delay to allow UI updates
                setTimeout(processNextChunk, 10);
            }
            
            processNextChunk();
        })
        .catch(error => {
            console.error('Error loading stops:', error);
            toggleStopsButton.disabled = false;
            toggleStopsButton.textContent = 'Failed to Load Stops';
        });
}

function updateBusLocations() {
    if (isUpdating) return;
    
    isUpdating = true;
    
    fetch('/api/buses')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
            
            const routesList = document.getElementById('routes-list');
            routesList.innerHTML = '';
            
            busLayerGroup.clearLayers();
            Object.keys(busMarkers).forEach(id => delete busMarkers[id]);
            
            data.forEach(bus => {
                const { vehicle_id, route_id, route_short_name, latitude, longitude, bearing, speed } = bus;
                
                if (!routeColors[route_id]) {
                    routeColors[route_id] = getRandomColor();
                }
                
                if (!busesByRoute[route_id]) {
                    busesByRoute[route_id] = [];
                    
                    const routeItem = document.createElement('div');
                    routeItem.className = 'route-item';
                    
                    const routeColor = document.createElement('div');
                    routeColor.className = 'route-color';
                    routeColor.style.backgroundColor = routeColors[route_id];
                    
                    const routeName = document.createElement('span');
                    routeName.textContent = `Route ${route_short_name}`;
                    
                    routeItem.appendChild(routeColor);
                    routeItem.appendChild(routeName);
                    routesList.appendChild(routeItem);
                }
                
                busesByRoute[route_id].push(vehicle_id);
                
                const color = routeColors[route_id];
                
                const circleIcon = L.divIcon({
                    html: `<div style="background-color: ${color}; color: white; font-weight: bold; font-size: 12px; display: flex; justify-content: center; align-items: center; width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 0 3px rgba(0,0,0,0.3);">${route_short_name}</div>`,
                    className: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                const marker = L.marker([latitude, longitude], { icon: circleIcon, zIndexOffset: 1000 })
                    .addTo(busLayerGroup);
                
                marker.bindPopup(`
                    <strong>Route ${route_short_name}</strong><br>
                    Vehicle ID: ${vehicle_id}<br>
                    Speed: ${speed ? Math.round(speed * 3.6) + ' km/h' : 'N/A'}
                `);
                
                busMarkers[vehicle_id] = marker;
            });
        })
        .catch(error => {
            console.error('Error fetching bus data:', error);
            document.getElementById('update-time').textContent = 'Failed to update';
        })
        .finally(() => {
            isUpdating = false;
        });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

updateBusLocations();

function setupPeriodicUpdates() {
    const updateInterval = 60000;
    
    function scheduleNextUpdate() {
        setTimeout(() => {
            updateBusLocations();
            scheduleNextUpdate();
        }, updateInterval);
    }
    
    scheduleNextUpdate();
}

setupPeriodicUpdates();
