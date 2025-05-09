# Hamilton Transit Real-Time Map

A real-time transit tracking application for Hamilton, Ontario's public transportation system. This application displays bus locations, routes, and stops on an interactive map, providing up-to-date information for commuters.

![Hamilton Transit Map Screenshot](https://raw.githubusercontent.com/anthonyhana04/hamilton-transit-map/main/screenshots/map-view.png)

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Building from Source](#building-from-source)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Real-Time Bus Tracking**: View the current locations of buses across Hamilton's transit system, updated every 60 seconds.
- **Interactive Route Selection**: Click on routes to focus the map on specific bus lines.
- **Bus Stop Visualization**: Toggle to display all bus stops on the map with detailed stop information.
- **Route Path Display**: View the exact paths that buses follow along their routes.
- **Responsive Design**: Works on both desktop and mobile devices.
- **Light & Fast**: Minimal dependencies ensure the application loads quickly and runs smoothly.


## Technology Stack

### Backend
- **Python 3.8+**: Core programming language
- **Flask**: Lightweight web server framework
- **GTFS Parser**: Custom module for parsing static and real-time GTFS transit data
- **Protocol Buffers**: For handling GTFS-RT data format

### Frontend
- **HTML5/CSS3**: Structure and styling
- **JavaScript (ES6+)**: Client-side logic with modular architecture
- **Leaflet.js**: Open-source interactive mapping library
- **OpenStreetMap**: Map tiles provider

### Data Sources
- Hamilton Open Data Portal: [GTFS-RT Feed](https://opendata.hamilton.ca/GTFS-RT/)  

## Installation

### Prerequisites
- Python 3.8+
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/anthonyhana04/hamilton-transit-map.git
cd hamilton-transit-map
```

2. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python backend/server.py
```

5. Open your browser and navigate to:
```
(it should automatically open)
http://localhost:8000
```

## Usage

- **View All Buses**: When you first load the application, you'll see all active buses in Hamilton.
- **Select a Route**: Click on a route in the sidebar to focus on buses for that specific route.
- **Show Bus Stops**: Click the "Show Bus Stops" button to display all stops on the map.
- **Show Route Shapes**: Click the "Show Route Shapes" button to display the paths buses follow.
- **Reset View**: Click "Reset View & Show All Routes" to return to the default map view.

## API Documentation

The application provides several RESTful API endpoints:

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/buses` | GET | Get current bus positions | `?route_id=X` (optional) |
| `/api/stops` | GET | Get stop locations | `?route_id=X` (optional) |
| `/api/shapes` | GET | Get route shape data | `?route_id=X` (optional) |
| `/api/routes` | GET | Get list of available routes | None |
| `/api/status` | GET | Get server status information | None |

## Project Structure

```
hamilton-transit-map/
├── backend/                # Server-side code
│   ├── data/               # GTFS static data storage
│   ├── gtfs_static_parser.py  # Static GTFS data parser
│   ├── gtfs_realtime_parser.py # Real-time GTFS data parser
│   └── server.py           # Flask application
├── frontend/              # Client-side code
│   ├── css/               # Stylesheets
│   │   └── style.css      # Main stylesheet
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Main application
│   │   ├── bus-manager.js # Bus tracking functionality
│   │   ├── config.js      # Configuration constants
│   │   ├── map-manager.js # Map handling functionality
│   │   ├── route-manager.js # Route selection handling
│   │   ├── shape-manager.js # Route shapes handling
│   │   └── stop-manager.js  # Bus stops handling
│   └── index.html         # Main HTML page
├── screenshots/           # Application screenshots
├── .gitignore             # Git ignore file
├── LICENSE                # MIT License
├── README.md              # This file
└── requirements.txt       # Python dependencies
```

## Building from Source

### Backend Development
1. Make changes to Python files in the `backend/` directory
2. Test changes by running:
```bash
python3 backend/server.py
```

### Frontend Development
1. Make changes to HTML, CSS, or JavaScript files in the `frontend/` directory
2. Refresh your browser to see changes (no build step required)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Developed by [Anthony Hana](https://github.com/anthonyhana04)

Data provided by [City of Hamilton Open Data](https://opendata.hamilton.ca/)
