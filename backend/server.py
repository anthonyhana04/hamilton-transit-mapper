# hamiton-transit-map/backend/server.py
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
import time
import threading
import logging
import webbrowser
from gtfs_realtime_parser import GTFSRealtimeParser

app = Flask(__name__, static_folder='../frontend')
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

parser = GTFSRealtimeParser()
bus_data = []
last_update = 0
update_interval = 60

def update_bus_data():
    global bus_data, last_update
    while True:
        try:
            new_data = parser.get_vehicle_positions()
            if new_data:
                bus_data = new_data
                last_update = time.time()
                logger.info(f"Updated {len(bus_data)} bus positions")
            else:
                logger.warning("Failed to get new bus positions - no data returned")
        except Exception as e:
            logger.error(f"Error updating bus data: {e}")
        
        time.sleep(update_interval)

def open_browser():
    time.sleep(1.5)
    webbrowser.open('http://localhost:8000')

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/buses')
def get_buses():
    route_id = request.args.get('route_id')
    
    if route_id:
        route_short_name = None
        for rid, route_info in parser.route_data.items():
            if rid == route_id:
                route_short_name = route_info.get('route_short_name')
                break
        
        if route_short_name:
            filtered_buses = []
            for bus in bus_data:
                bus_route_id = bus.get('route_id')
                if bus_route_id in parser.route_data:
                    if parser.route_data[bus_route_id].get('route_short_name') == route_short_name:
                        filtered_buses.append(bus)
            return jsonify(filtered_buses)
        else:
            filtered_buses = [bus for bus in bus_data if bus.get('route_id') == route_id]
            return jsonify(filtered_buses)
    
    if not bus_data:
        return jsonify([]), 404
    return jsonify(bus_data)

@app.route('/api/stops')
def get_stops():
    route_id = request.args.get('route_id')
    
    if route_id:
        stops = parser.get_route_stops(route_id)
        return jsonify(stops)
    
    stops = parser.get_stop_positions()
    return jsonify(stops)

@app.route('/api/shapes')
def get_shapes():
    route_id = request.args.get('route_id')
    
    if route_id:
        route_shapes = parser.get_route_shapes(route_id)
        return jsonify(route_shapes)
    
    shapes = parser.get_shapes()
    return jsonify(shapes)

@app.route('/api/routes')
def get_routes():
    routes = []
    unique_route_names = set()
    
    for route_id, route_info in parser.route_data.items():
        route_short_name = route_info.get('route_short_name', route_id)
        
        if route_short_name in unique_route_names:
            continue
            
        unique_route_names.add(route_short_name)
        
        routes.append({
            'route_id': route_id,
            'route_short_name': route_short_name,
            'route_color': route_info.get('route_color', '#FF0000')
        })
    
    try:
        routes.sort(key=lambda x: int(x['route_short_name']))
    except (ValueError, TypeError):
        routes.sort(key=lambda x: x['route_short_name'])
    
    return jsonify(routes)

@app.route('/api/status')
def get_status():
    return jsonify({
        'last_update': last_update,
        'bus_count': len(bus_data),
        'server_time': time.time()
    })

if __name__ == '__main__':
    update_thread = threading.Thread(target=update_bus_data, daemon=True)
    update_thread.start()
    
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
