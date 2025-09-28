from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import io
from PIL import Image
import os
import logging
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime, timedelta
import threading
import time
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
UPLOAD_FOLDER = './uploads'
RESULTS_FOLDER = './results'
LOGS_FOLDER = './logs'
MODEL_PATH = '../Hardware-utilities/weapon/model/best.pt'
WEAPON_ALERT_THRESHOLD = 5.0

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs(LOGS_FOLDER, exist_ok=True)

try:
    model = YOLO(MODEL_PATH)
    logger.info("YOLO model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {e}")
    model = None

class WeaponDetector:
    def __init__(self, model):
        self.model = model

    def detect_weapons(self, image):
        if self.model is None:
            return {"error": "Model not loaded"}

        try:
            results = self.model(image)
            detections = []

            for r in results:
                boxes = r.boxes
                if boxes is not None:
                    for i in range(len(boxes.cls)):
                        class_id = int(boxes.cls[i])
                        class_name = r.names[class_id].lower()

                        if class_name == "pistol":
                            class_name = "gun"

                        confidence = float(boxes.conf[i])
                        bbox = boxes.xyxy[i].cpu().numpy().tolist()

                        detection = {
                            "class": class_name,
                            "confidence": confidence,
                            "bbox": {
                                "x1": bbox[0],
                                "y1": bbox[1],
                                "x2": bbox[2],
                                "y2": bbox[3]
                            }
                        }
                        detections.append(detection)

            return {
                "success": True,
                "detections": detections,
                "count": len(detections)
            }

        except Exception as e:
            logger.error(f"Detection error: {e}")
            return {"error": str(e)}

    def annotate_image(self, image):
        if self.model is None:
            return image

        try:
            results = self.model(image)
            annotated_image = image.copy()

            for r in results:
                boxes = r.boxes
                if boxes is not None:
                    for i in range(len(boxes.cls)):
                        class_id = int(boxes.cls[i])
                        class_name = r.names[class_id].lower()

                        if class_name == "pistol":
                            class_name = "gun"

                        confidence = float(boxes.conf[i])
                        bbox = boxes.xyxy[i].cpu().numpy().astype(int)

                        cv2.rectangle(annotated_image, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 0, 255), 2)

                        label = f"{class_name}: {confidence:.2f}"
                        label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]

                        cv2.rectangle(annotated_image,
                                    (bbox[0], bbox[1] - label_size[1] - 10),
                                    (bbox[0] + label_size[0], bbox[1]),
                                    (0, 0, 255), -1)

                        cv2.putText(annotated_image, label,
                                  (bbox[0], bbox[1] - 5),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

            return annotated_image

        except Exception as e:
            logger.error(f"Annotation error: {e}")
            return image

detector = WeaponDetector(model)

# Camera monitoring system
class CameraMonitor:
    def __init__(self, detector):
        self.detector = detector
        self.camera = None
        self.is_monitoring = False
        self.weapon_detected_time = None
        self.last_detection_time = None
        self.alert_logged = False
        self.monitoring_thread = None

    def start_monitoring(self, camera_index=0):
        try:
            self.camera = cv2.VideoCapture(camera_index)
            if not self.camera.isOpened():
                logger.error(f"Could not open camera {camera_index}")
                return False

            self.is_monitoring = True
            self.monitoring_thread = threading.Thread(target=self._monitor_loop)
            self.monitoring_thread.daemon = True
            self.monitoring_thread.start()
            logger.info(f"Camera monitoring started on camera {camera_index}")
            return True
        except Exception as e:
            logger.error(f"Failed to start camera monitoring: {e}")
            return False

    def stop_monitoring(self):
        self.is_monitoring = False
        if self.camera:
            self.camera.release()
        logger.info("Camera monitoring stopped")

    def _monitor_loop(self):
        while self.is_monitoring:
            try:
                ret, frame = self.camera.read()
                if not ret:
                    logger.warning("Failed to read from camera")
                    time.sleep(1)
                    continue

                results = self.detector.detect_weapons(frame)
                current_time = time.time()

                if results.get('success') and results.get('count', 0) > 0:
                    if self.weapon_detected_time is None:
                        self.weapon_detected_time = current_time
                        self.alert_logged = False
                        logger.info("Weapon detection started")

                    self.last_detection_time = current_time

                    # Check for if weapon has been detected for more than threshold
                    detection_duration = current_time - self.weapon_detected_time

                    if detection_duration >= WEAPON_ALERT_THRESHOLD and not self.alert_logged:
                        self._log_weapon_alert(results, detection_duration)
                        self.alert_logged = True

                    # detection data
                    socketio.emit('weapon_detection', {
                        'detected': True,
                        'duration': detection_duration,
                        'detections': results.get('detections', []),
                        'count': results.get('count', 0),
                        'timestamp': datetime.now().isoformat()
                    })

                else:
                    if (self.last_detection_time is not None and
                        current_time - self.last_detection_time > 2.0):
                        self.weapon_detected_time = None
                        self.alert_logged = False
                        logger.info("Weapon detection reset")

                    socketio.emit('weapon_detection', {
                        'detected': False,
                        'duration': 0,
                        'timestamp': datetime.now().isoformat()
                    })

                time.sleep(0.1)

            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(1)

    def _log_weapon_alert(self, results, duration):
        try:
            alert_data = {
                'timestamp': datetime.now().isoformat(),
                'alert_type': 'WEAPON_DETECTED',
                'duration_seconds': round(duration, 2),
                'detections': results.get('detections', []),
                'detection_count': results.get('count', 0),
                'threshold_seconds': WEAPON_ALERT_THRESHOLD
            }

            log_filename = f"weapon_alerts_{datetime.now().strftime('%Y%m%d')}.json"
            log_path = os.path.join(LOGS_FOLDER, log_filename)
            #append
            with open(log_path, 'a') as f:
                f.write(json.dumps(alert_data) + '\n')
            # console
            logger.warning(f"WEAPON ALERT: Detected for {duration:.2f} seconds at {alert_data['timestamp']}")

            socketio.emit('weapon_alert', alert_data)

        except Exception as e:
            logger.error(f"Failed to log weapon alert: {e}")

    def get_status(self):
        return {
            'monitoring': self.is_monitoring,
            'camera_connected': self.camera is not None and self.camera.isOpened() if self.camera else False,
            'weapon_detected': self.weapon_detected_time is not None,
            'detection_duration': time.time() - self.weapon_detected_time if self.weapon_detected_time else 0
        }

camera_monitor = CameraMonitor(detector)

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def image_to_base64(image):
    _, buffer = cv2.imencode('.jpg', image)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return img_base64

def base64_to_image(base64_string):
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]

        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        logger.error(f"Base64 decode error: {e}")
        return None

def generate_frames():
    while camera_monitor.is_monitoring and camera_monitor.camera:
        try:
            ret, frame = camera_monitor.camera.read()
            if not ret:
                logger.warning("Failed to read frame for streaming")
                break

            annotated_frame = detector.annotate_image(frame)

            ret, buffer = cv2.imencode('.jpg', annotated_frame)
            if not ret:
                logger.warning("Failed to encode frame")
                continue

            frame_bytes = buffer.tobytes()

            # Yield frame in byte format for multipart streaming
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        except Exception as e:
            logger.error(f"Frame generation error: {e}")
            break
        time.sleep(0.033)  # ~30 FPS

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Safyra Weapon Detection API",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    })

# Camera monitoring endpoints
@app.route('/camera/start', methods=['POST'])
def start_camera_monitoring():
    try:
        data = request.get_json() if request.is_json else {}
        camera_index = data.get('camera_index', 0)

        if camera_monitor.is_monitoring:
            return jsonify({"error": "Camera monitoring is already running"}), 400

        success = camera_monitor.start_monitoring(camera_index)
        if success:
            return jsonify({
                "success": True,
                "message": f"Camera monitoring started on camera {camera_index}",
                "status": camera_monitor.get_status()
            })
        else:
            return jsonify({"error": "Failed to start camera monitoring"}), 500

    except Exception as e:
        logger.error(f"Start camera monitoring error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/camera/stop', methods=['POST'])
def stop_camera_monitoring():
    try:
        camera_monitor.stop_monitoring()
        return jsonify({
            "success": True,
            "message": "Camera monitoring stopped",
            "status": camera_monitor.get_status()
        })
    except Exception as e:
        logger.error(f"Stop camera monitoring error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/camera/status', methods=['GET'])
def get_camera_status():
    """Get current camera monitoring status"""
    try:
        return jsonify({
            "success": True,
            "status": camera_monitor.get_status(),
            "threshold_seconds": WEAPON_ALERT_THRESHOLD
        })
    except Exception as e:
        logger.error(f"Get camera status error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/camera/stream')
def video_stream():
    """Video streaming route - returns live camera feed with weapon detection annotations"""
    if not camera_monitor.is_monitoring:
        return jsonify({"error": "Camera monitoring not active. Please start monitoring first."}), 400

    if not camera_monitor.camera or not camera_monitor.camera.isOpened():
        return jsonify({"error": "Camera not accessible"}), 500

    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/logs/weapon-alerts', methods=['GET'])
def get_weapon_alert_logs():
    try:
        date_str = request.args.get('date', datetime.now().strftime('%Y%m%d'))
        log_filename = f"weapon_alerts_{date_str}.json"
        log_path = os.path.join(LOGS_FOLDER, log_filename)

        alerts = []
        if os.path.exists(log_path):
            with open(log_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        alerts.append(json.loads(line))

        return jsonify({
            "success": True,
            "date": date_str,
            "alerts": alerts,
            "count": len(alerts)
        })

    except Exception as e:
        logger.error(f"Get weapon alert logs error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/logs/weapon-alerts/summary', methods=['GET'])
def get_weapon_alert_summary():
    try:
        summary = {}
        for i in range(7):
            date = datetime.now() - timedelta(days=i)
            date_str = date.strftime('%Y%m%d')
            log_filename = f"weapon_alerts_{date_str}.json"
            log_path = os.path.join(LOGS_FOLDER, log_filename)

            count = 0
            if os.path.exists(log_path):
                with open(log_path, 'r') as f:
                    count = sum(1 for line in f if line.strip())

            summary[date_str] = count

        return jsonify({
            "success": True,
            "summary": summary,
            "total_alerts": sum(summary.values())
        })

    except Exception as e:
        logger.error(f"Get weapon alert summary error: {e}")
        return jsonify({"error": str(e)}), 500

# WebSocket events
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected to WebSocket")
    emit('status', camera_monitor.get_status())

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info("Client disconnected from WebSocket")

if __name__ == '__main__':
    if model is None:
        logger.warning("Model not loaded. Some endpoints may not work.")
    try:
        socketio.run(
            app,
            debug=True,
            host='0.0.0.0',
            port=5000,
            allow_unsafe_werkzeug=True
        )
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        camera_monitor.stop_monitoring()
