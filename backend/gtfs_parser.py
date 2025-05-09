# hamilton-transit-map/backend/gtfs_parser.py
import requests
import google.protobuf
from google.transit import gtfs_realtime_pb2
import io
import traceback
import json
import logging
import os
import csv
import zipfile
from pathlib import Path

logger = logging.getLogger(__name__)

class GTFSRealtimeParser:
    def __init__(self):
        self.vehicle_positions_url = "https://opendata.hamilton.ca/GTFS-RT/GTFS_VehiclePositions.pb"
        self.trip_updates_url = "https://opendata.hamilton.ca/GTFS-RT/GTFS_TripUpdates.pb"
        self.route_data = {}
        self.stop_data = []
        
        self.static_zip_url = "https://opendata.hamilton.ca/GTFS-Static/google_transit.zip"
        
        self.data_dir = Path(__file__).parent / "data"
        self.backup_zip_path = self.data_dir / "google_transit.zip"
        self.backup_routes_path = self.data_dir / "routes.txt"
        self.backup_stops_path = self.data_dir / "stops.txt"
        
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.download_and_extract_static_data()
        self.load_route_data()
        self.load_stop_data()
    
    def download_and_extract_static_data(self):
        try:
            if not self.backup_routes_path.exists() or not self.backup_stops_path.exists():
                logger.info("Downloading GTFS static data zip file")
                response = requests.get(self.static_zip_url)
                
                if response.status_code == 200:
                    with open(self.backup_zip_path, 'wb') as f:
                        f.write(response.content)
                    
                    logger.info("Extracting GTFS static data from zip file")
                    with zipfile.ZipFile(self.backup_zip_path, 'r') as zip_ref:
                        for file_name in ['routes.txt', 'stops.txt']:
                            try:
                                zip_ref.extract(file_name, self.data_dir)
                                logger.info(f"Extracted {file_name}")
                            except KeyError:
                                logger.warning(f"File {file_name} not found in zip")
                else:
                    logger.warning(f"Failed to download GTFS static data: {response.status_code}")
        except Exception as e:
            logger.error(f"Error downloading or extracting GTFS static data: {e}")
            traceback.print_exc()
    
    def load_route_data(self):
        try:
            if self.backup_routes_path.exists():
                logger.info("Loading route data from file")
                with open(self.backup_routes_path, 'r') as f:
                    self.parse_route_data(f.read())
            else:
                logger.warning("No routes.txt file found. Creating minimal route data")
                self.create_fallback_route_data()
        except Exception as e:
            logger.error(f"Error loading route data: {e}")
            traceback.print_exc()
            self.create_fallback_route_data()
    
    def load_stop_data(self):
        try:
            if self.backup_stops_path.exists():
                logger.info("Loading stop data from file")
                with open(self.backup_stops_path, 'r') as f:
                    self.parse_stop_data(f.read())
            else:
                logger.warning("No stops.txt file found. No stop data will be available.")
        except Exception as e:
            logger.error(f"Error loading stop data: {e}")
            traceback.print_exc()
    
    def parse_route_data(self, text_data):
        try:
            lines = text_data.strip().split('\n')
            reader = csv.DictReader(lines)
            
            for row in reader:
                try:
                    route_id = row['route_id']
                    route_short_name = row['route_short_name']
                    self.route_data[route_id] = {
                        'route_short_name': route_short_name
                    }
                except KeyError as e:
                    logger.warning(f"Missing key in route data: {e}")
        except Exception as e:
            logger.error(f"Error parsing route data: {e}")
            traceback.print_exc()
    
    def parse_stop_data(self, text_data):
        try:
            lines = text_data.strip().split('\n')
            reader = csv.DictReader(lines)
            
            for row in reader:
                try:
                    stop_id = row['stop_id']
                    stop_name = row['stop_name']
                    stop_lat = float(row['stop_lat'])
                    stop_lon = float(row['stop_lon'])
                    
                    self.stop_data.append({
                        'stop_id': stop_id,
                        'stop_name': stop_name,
                        'latitude': stop_lat,
                        'longitude': stop_lon
                    })
                except (KeyError, ValueError) as e:
                    logger.warning(f"Error processing stop data row: {e}")
        except Exception as e:
            logger.error(f"Error parsing stop data: {e}")
            traceback.print_exc()
    
    def create_fallback_route_data(self):
        self.route_data = {}
        for i in range(1, 60):
            route_id = str(i)
            self.route_data[route_id] = {
                'route_short_name': str(i)
            }
    
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
                
                bus_data = {
                    'vehicle_id': vehicle.vehicle.id if vehicle.HasField('vehicle') else f"unknown_{len(results)}",
                    'route_id': route_id,
                    'route_short_name': self.route_data.get(route_id, {}).get('route_short_name', route_id if route_id else 'Unknown'),
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
    
    def get_stop_positions(self):
        return self.stop_data

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = GTFSRealtimeParser()
    vehicles = parser.get_vehicle_positions()
    print(json.dumps(vehicles, indent=2))
