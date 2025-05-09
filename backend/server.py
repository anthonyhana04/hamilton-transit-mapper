# hamilton-transit-map/backend/server.py
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
import time
import threading
from gtfs_parser import GTFSRealtimeParser

app = Flask(__name__, static_folder='../frontend')
CORS(app)

parser = GTFSRealtimeParser()
bus_data = []
last_update = 0
update_interval = 60

def update_bus_data():
    global bus_data, last_update
    while True:
        try:
            bus_data = parser.get_vehicle_positions()
            last_update = time.time()
            print(f"Updated {len(bus_data)} bus positions")
        except Exception as e:
            print(f"Error updating bus data: {e}")
        
        time.sleep(update_interval)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/buses')
def get_buses():
    return jsonify(bus_data)

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
    
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
