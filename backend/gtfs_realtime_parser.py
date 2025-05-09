# hamilton-transit-map/backend/gtfs_realtime_parser.py
import requests
import traceback
import logging
from google.transit import gtfs_realtime_pb2
from gtfs_static_parser import GTFSStaticParser

logger = logging.getLogger(__name__)

class GTFSRealtimeParser:
    def __init__(self):
        self.vehicle_positions_url = "https://opendata.hamilton.ca/GTFS-RT/GTFS_VehiclePositions.pb"
        self.trip_updates_url = "https://opendata.hamilton.ca/GTFS-RT/GTFS_TripUpdates.pb"
        self.static_parser = GTFSStaticParser()
    
    def fetch_protobuf_data(self, url):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return response.content
            else:
                logger.warning(f"Failed to fetch data from {url}: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Error fetching data from {url}: {e}")
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
                trip_id = vehicle.trip.trip_id if vehicle.HasField('trip') else None
                
                route_info = self.static_parser.route_data.get(route_id, {})
                route_short_name = route_info.get('route_short_name', route_id if route_id else 'Unknown')
                route_color = route_info.get('route_color', '#FF0000')
                
                bus_data = {
                    'vehicle_id': vehicle.vehicle.id if vehicle.HasField('vehicle') else f"unknown_{len(results)}",
                    'route_id': route_id,
                    'trip_id': trip_id,
                    'route_short_name': route_short_name,
                    'route_color': route_color,
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

    # Pass-through methods to access the static data
    def get_stop_positions(self):
        return self.static_parser.get_stop_positions()
    
    def get_route_stops(self, route_id=None):
        return self.static_parser.get_route_stops(route_id)
    
    def get_shapes(self):
        return self.static_parser.get_shapes()
    
    def get_route_shapes(self, route_id=None):
        return self.static_parser.get_route_shapes(route_id)
    
    @property
    def route_data(self):
        return self.static_parser.route_data
