# hamilton-transit-map/backend/gtfs_parser.py
import requests
import google.protobuf
from google.transit import gtfs_realtime_pb2
import io
import traceback
import json

class GTFSRealtimeParser:
    def __init__(self):
        self.vehicle_positions_url = "https://opendata.hamilton.ca/GTFS-RT/GTFS_VehiclePositions.pb"
        self.trip_updates_url = "https://opendata.hamilton.ca/GTFS-RT/GTFS_TripUpdates.pb"
        self.route_data = {}
        self.load_route_data()
    
    def load_route_data(self):
        try:
            routes_url = "https://opendata.hamilton.ca/GTFS/routes.txt"
            response = requests.get(routes_url)
            
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                headers = lines[0].split(',')
                
                route_id_idx = headers.index('route_id')
                route_short_name_idx = headers.index('route_short_name')
                
                for i in range(1, len(lines)):
                    fields = lines[i].split(',')
                    self.route_data[fields[route_id_idx]] = {
                        'route_short_name': fields[route_short_name_idx]
                    }
            else:
                print(f"Failed to fetch route data: {response.status_code}")
        except Exception as e:
            print(f"Error loading route data: {e}")
            traceback.print_exc()
    
    def fetch_protobuf_data(self, url):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return response.content
            else:
                print(f"Failed to fetch data from {url}: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error fetching data from {url}: {e}")
            traceback.print_exc()
            return None
    
    def parse_vehicle_positions(self, binary_data):
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(binary_data)
        
        results = []
        
        for entity in feed.entity:
            if entity.HasField('vehicle'):
                vehicle = entity.vehicle
                
                if not vehicle.HasField('position'):
                    continue
                
                route_id = vehicle.trip.route_id if vehicle.HasField('trip') else None
                
                bus_data = {
                    'vehicle_id': vehicle.vehicle.id if vehicle.HasField('vehicle') else f"unknown_{len(results)}",
                    'route_id': route_id,
                    'route_short_name': self.route_data.get(route_id, {}).get('route_short_name', 'Unknown') if route_id else 'Unknown',
                    'latitude': vehicle.position.latitude,
                    'longitude': vehicle.position.longitude,
                    'timestamp': vehicle.timestamp
                }
                
                if vehicle.position.HasField('bearing'):
                    bus_data['bearing'] = vehicle.position.bearing
                
                if vehicle.position.HasField('speed'):
                    bus_data['speed'] = vehicle.position.speed
                
                results.append(bus_data)
        
        return results
    
    def get_vehicle_positions(self):
        binary_data = self.fetch_protobuf_data(self.vehicle_positions_url)
        if binary_data:
            return self.parse_vehicle_positions(binary_data)
        return []

if __name__ == "__main__":
    parser = GTFSRealtimeParser()
    vehicles = parser.get_vehicle_positions()
    print(json.dumps(vehicles, indent=2))
