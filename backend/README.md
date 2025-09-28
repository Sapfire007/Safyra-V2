# Safyra Backend Setup

## Quick Start

### Option 1: Use the Startup Script (Windows)
```bash
# Simply double-click or run:
start_server.bat
```

### Option 2: Manual Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment (if not exists)
python -m venv .venv

# 3. Activate virtual environment
# Windows:
.venv\Scripts\activate.bat
# Linux/Mac:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start the server
python app.py
```

## Requirements

- Python 3.8+
- Webcam/Camera connected to your system
- YOLO model file (`best.pt`) in `../Hardware-utilities/weapon/model/`

## API Endpoints

### Camera Control
- `GET /` - Health check
- `POST /camera/start` - Start camera monitoring
- `POST /camera/stop` - Stop camera monitoring
- `GET /camera/status` - Get camera status
- `GET /camera/stream` - Live video stream with weapon detection

### Alerts & Logs
- `GET /logs/weapon-alerts` - Get weapon alert logs
- `GET /logs/weapon-alerts/summary` - Get alert summary

## WebSocket Events

The server emits real-time events via WebSocket:
- `weapon_detection` - Live detection status
- `weapon_alert` - Weapon alert notifications
- `status` - Camera system status updates

## Troubleshooting

### Common Issues:

1. **Camera not found**
   - Ensure camera is connected and not used by other applications
   - Try different camera indices (0, 1, 2) in the frontend
   - Check camera permissions

2. **Model loading failed**
   - Verify `best.pt` exists in `../Hardware-utilities/weapon/model/`
   - Check file permissions
   - Ensure sufficient disk space

3. **Port already in use**
   - Change port in `app.py` if 5000 is occupied
   - Update `NEXT_PUBLIC_BACKEND_URL` in frontend accordingly

4. **Dependencies missing**
   - Run `pip install -r requirements.txt`
   - Ensure virtual environment is activated

## Development

- The server runs on `http://localhost:5000` by default
- Debug mode is enabled for development
- CORS is configured to allow frontend connections
- Logs are saved in the `logs/` directory
