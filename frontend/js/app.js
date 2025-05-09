// hamilton-transit-map/frontend/js/app.js
const map = L.map('map').setView([43.2557, -79.8711], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const busesByRoute = {};
const busMarkers = {};
const routeColors = {};

function updateBusLocations() {
    fetch('/api/buses')
        .then(response => response.json())
        .then(data => {
            document.getElementById('update-time').textContent = new Date().toLocaleTimeString();
            
            const routesList = document.getElementById('routes-list');
            routesList.innerHTML = '';
            
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
                
                if (busMarkers[vehicle_id]) {
                    busMarkers[vehicle_id].setLatLng([latitude, longitude]);
                    
                    if (bearing !== undefined) {
                        busMarkers[vehicle_id].setRotationAngle(bearing);
                    }
                } else {
                    const busIcon = L.divIcon({
                        html: `<div style="background-color: ${routeColors[route_id]}; width: 20px; height: 20px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; font-size: 10px;">${route_short_name}</div>`,
                        className: 'bus-icon',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    
                    const marker = L.marker([latitude, longitude], { icon: busIcon })
                        .addTo(map);
                    
                    marker.bindPopup(`
                        <strong>Route ${route_short_name}</strong><br>
                        Vehicle ID: ${vehicle_id}<br>
                        Speed: ${speed ? Math.round(speed * 3.6) + ' km/h' : 'N/A'}
                    `);
                    
                    busMarkers[vehicle_id] = marker;
                }
            });
            
            const currentBusIds = data.map(bus => bus.vehicle_id);
            Object.keys(busMarkers).forEach(busId => {
                if (!currentBusIds.includes(busId)) {
                    map.removeLayer(busMarkers[busId]);
                    delete busMarkers[busId];
                }
            });
        })
        .catch(error => {
            console.error('Error fetching bus data:', error);
            document.getElementById('update-time').textContent = 'Failed to update';
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

setInterval(updateBusLocations, 60000);
