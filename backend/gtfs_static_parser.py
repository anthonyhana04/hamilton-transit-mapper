# hamilton-transit-map/backend/gtfs_static_parser.py
import requests
import logging
import os
import csv
import zipfile
import traceback
from pathlib import Path

logger = logging.getLogger(__name__)

class GTFSStaticParser:
    def __init__(self):
        self.route_data = {}
        self.stop_data = []
        self.shapes_data = {}
        self.trips_data = {}
        self.stop_times_data = {}
        self.route_shapes = {}
        self.route_stops = {}
        
        self.static_zip_url = "https://opendata.hamilton.ca/GTFS-Static/google_transit.zip"
        
        self.data_dir = Path(__file__).parent / "data"
        self.backup_zip_path = self.data_dir / "google_transit.zip"
        self.backup_routes_path = self.data_dir / "routes.txt"
        self.backup_stops_path = self.data_dir / "stops.txt"
        self.backup_shapes_path = self.data_dir / "shapes.txt"
        self.backup_trips_path = self.data_dir / "trips.txt"
        self.backup_stop_times_path = self.data_dir / "stop_times.txt"
        
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.load_static_data()
    
    def load_static_data(self):
        self.download_and_extract_static_data()
        
        self.load_route_data()
        self.load_stop_data()
        self.load_shapes_data()
        self.load_trips_data()
        self.load_stop_times_data()
        
        self.process_relationships()
        
        logger.info("Static GTFS data loaded successfully")
    
    def download_and_extract_static_data(self):
        try:
            files_to_extract = ['routes.txt', 'stops.txt', 'shapes.txt', 'trips.txt', 'stop_times.txt']
            files_missing = []
            
            for file_name in files_to_extract:
                file_path = self.data_dir / file_name
                if not file_path.exists():
                    files_missing.append(file_name)
            
            if files_missing:
                logger.info(f"Downloading GTFS static data zip file. Missing files: {files_missing}")
                response = requests.get(self.static_zip_url)
                
                if response.status_code == 200:
                    with open(self.backup_zip_path, 'wb') as f:
                        f.write(response.content)
                    
                    logger.info("Extracting GTFS static data from zip file")
                    with zipfile.ZipFile(self.backup_zip_path, 'r') as zip_ref:
                        for file_name in files_to_extract:
                            try:
                                zip_ref.extract(file_name, self.data_dir)
                                logger.info(f"Extracted {file_name}")
                            except KeyError:
                                logger.warning(f"File {file_name} not found in zip")
                    
                    if self.backup_zip_path.exists():
                        os.remove(self.backup_zip_path)
                        logger.info("Deleted zip file after extraction")
                else:
                    logger.warning(f"Failed to download GTFS static data: {response.status_code}")
            else:
                logger.info("All static GTFS files already exist, skipping download")
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
    
    def load_shapes_data(self):
        try:
            if self.backup_shapes_path.exists():
                logger.info("Loading shapes data from file")
                with open(self.backup_shapes_path, 'r') as f:
                    self.parse_shapes_data(f.read())
            else:
                logger.warning("No shapes.txt file found. No shape data will be available.")
        except Exception as e:
            logger.error(f"Error loading shapes data: {e}")
            traceback.print_exc()
    
    def load_trips_data(self):
        try:
            if self.backup_trips_path.exists():
                logger.info("Loading trips data from file")
                with open(self.backup_trips_path, 'r') as f:
                    self.parse_trips_data(f.read())
            else:
                logger.warning("No trips.txt file found. Route-shape mappings will not be available.")
        except Exception as e:
            logger.error(f"Error loading trips data: {e}")
            traceback.print_exc()
    
    def load_stop_times_data(self):
        try:
            if self.backup_stop_times_path.exists():
                logger.info("Loading stop_times data from file")
                with open(self.backup_stop_times_path, 'r') as f:
                    self.parse_stop_times_data(f.read())
            else:
                logger.warning("No stop_times.txt file found. Route-stop mappings will not be available.")
        except Exception as e:
            logger.error(f"Error loading stop_times data: {e}")
            traceback.print_exc()
    
    def parse_route_data(self, text_data):
        try:
            lines = text_data.strip().split('\n')
            reader = csv.DictReader(lines)
            
            route_groups = {}
            all_route_ids = {}
            
            for row in reader:
                try:
                    route_id = row['route_id']
                    route_short_name = row['route_short_name']
                    route_color = row.get('route_color', '')
                    
                    if route_short_name not in route_groups:
                        route_groups[route_short_name] = []
                    
                    route_groups[route_short_name].append({
                        'route_id': route_id,
                        'route_color': route_color,
                    })
                    
                except KeyError as e:
                    logger.warning(f"Missing key in route data: {e}")
            
            for route_short_name, routes in route_groups.items():
                route = routes[0]
                primary_route_id = route['route_id']
                route_color = route['route_color']
                
                if not route_color:
                    route_color = 'FF0000'
                
                if not route_color.startswith('#'):
                    route_color = f"#{route_color}"
                
                self.route_data[primary_route_id] = {
                    'route_short_name': route_short_name,
                    'route_color': route_color
                }
                
                if len(routes) > 1:
                    duplicate_ids = [r['route_id'] for r in routes]
                    logger.info(f"Found {len(routes)} routes with name {route_short_name}. Using {primary_route_id} as representative. All IDs: {duplicate_ids}")
                    
                    for route_variant in routes:
                        variant_route_id = route_variant['route_id']
                        if variant_route_id != primary_route_id:
                            self.route_data[variant_route_id] = {
                                'route_short_name': route_short_name,
                                'route_color': route_color
                            }
            
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
    
    def parse_shapes_data(self, text_data):
        try:
            lines = text_data.strip().split('\n')
            reader = csv.DictReader(lines)
            
            shape_points = {}
            
            for row in reader:
                try:
                    shape_id = row['shape_id']
                    lat = float(row['shape_pt_lat'])
                    lon = float(row['shape_pt_lon'])
                    sequence = int(row['shape_pt_sequence'])
                    
                    if shape_id not in shape_points:
                        shape_points[shape_id] = []
                    
                    shape_points[shape_id].append({
                        'lat': lat,
                        'lon': lon,
                        'sequence': sequence
                    })
                except (KeyError, ValueError) as e:
                    logger.warning(f"Error processing shape data row: {e}")
            
            for shape_id, points in shape_points.items():
                sorted_points = sorted(points, key=lambda x: x['sequence'])
                self.shapes_data[shape_id] = [[p['lat'], p['lon']] for p in sorted_points]
            
            logger.info(f"Loaded {len(self.shapes_data)} shapes")
        except Exception as e:
            logger.error(f"Error parsing shapes data: {e}")
            traceback.print_exc()
            
    def parse_trips_data(self, text_data):
        try:
            lines = text_data.strip().split('\n')
            reader = csv.DictReader(lines)
            
            for row in reader:
                try:
                    trip_id = row['trip_id']
                    route_id = row['route_id']
                    shape_id = row.get('shape_id', None)
                    
                    self.trips_data[trip_id] = {
                        'route_id': route_id,
                        'shape_id': shape_id
                    }
                    
                except KeyError as e:
                    logger.warning(f"Missing key in trips data: {e}")
            
            logger.info(f"Loaded {len(self.trips_data)} trips")
        except Exception as e:
            logger.error(f"Error parsing trips data: {e}")
            traceback.print_exc()
    
    def parse_stop_times_data(self, text_data):
        try:
            lines = text_data.strip().split('\n')
            reader = csv.DictReader(lines)
            
            for row in reader:
                try:
                    trip_id = row['trip_id']
                    stop_id = row['stop_id']
                    stop_sequence = int(row['stop_sequence'])
                    
                    if trip_id not in self.stop_times_data:
                        self.stop_times_data[trip_id] = []
                    
                    self.stop_times_data[trip_id].append({
                        'stop_id': stop_id,
                        'sequence': stop_sequence
                    })
                except (KeyError, ValueError) as e:
                    logger.warning(f"Error processing stop_times data row: {e}")
            
            for trip_id, stops in self.stop_times_data.items():
                self.stop_times_data[trip_id] = sorted(stops, key=lambda x: x['sequence'])
            
            logger.info(f"Loaded stop times for {len(self.stop_times_data)} trips")
        except Exception as e:
            logger.error(f"Error parsing stop_times data: {e}")
            traceback.print_exc()
    
    def create_fallback_route_data(self):
        self.route_data = {}
        for i in range(1, 60):
            route_id = str(i)
            self.route_data[route_id] = {
                'route_short_name': str(i),
                'route_color': '#' + format(hash(route_id) % 0xFFFFFF, '06x')
            }
    
    def process_relationships(self):
        try:
            logger.info("Processing relationships between routes, shapes, and stops")
            
            route_to_shapes = {}
            for trip_id, trip in self.trips_data.items():
                route_id = trip['route_id']
                shape_id = trip['shape_id']
                
                if shape_id and shape_id in self.shapes_data:
                    if route_id not in route_to_shapes:
                        route_to_shapes[route_id] = set()
                    route_to_shapes[route_id].add(shape_id)
            
            for route_id, shapes in route_to_shapes.items():
                self.route_shapes[route_id] = list(shapes)
            
            logger.info(f"Mapped {len(self.route_shapes)} routes to shapes")
            
            route_to_stops = {}
            for trip_id, stops in self.stop_times_data.items():
                if trip_id in self.trips_data:
                    route_id = self.trips_data[trip_id]['route_id']
                    
                    if route_id not in route_to_stops:
                        route_to_stops[route_id] = set()
                    
                    for stop_data in stops:
                        route_to_stops[route_id].add(stop_data['stop_id'])
            
            stop_dict = {stop['stop_id']: stop for stop in self.stop_data}
            
            for route_id, stop_ids in route_to_stops.items():
                self.route_stops[route_id] = []
                for stop_id in stop_ids:
                    if stop_id in stop_dict:
                        self.route_stops[route_id].append(stop_dict[stop_id])
            
            logger.info(f"Mapped {len(self.route_stops)} routes to stops")
            
        except Exception as e:
            logger.error(f"Error processing relationships: {e}")
            traceback.print_exc()
    
    def get_stop_positions(self):
        return self.stop_data
    
    def get_route_stops(self, route_id=None):
        if route_id:
            return self.route_stops.get(route_id, [])
        return self.route_stops
    
    def get_shapes(self):
        return self.shapes_data
    
    def get_route_shapes(self, route_id=None):
        if route_id:
            shape_ids = self.route_shapes.get(route_id, [])
            return {shape_id: self.shapes_data[shape_id] for shape_id in shape_ids if shape_id in self.shapes_data}
        return self.route_shapes
