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
RECORDINGS_FOLDER = './recordings'
MODEL_PATH = '../Hardware-utilities/weapon/model/best.pt'
WEAPON_ALERT_THRESHOLD = 5.0
RECORDING_BUFFER_SECONDS = 10  # Record 10 seconds before and after alert

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs(LOGS_FOLDER, exist_ok=True)
os.makedirs(RECORDINGS_FOLDER, exist_ok=True)

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
        self.is_recording = False
        self.video_writer = None
        self.recording_filename = None
        self.frame_buffer = []  # Buffer to store frames before alert
        self.max_buffer_size = int(30 * RECORDING_BUFFER_SECONDS)  # 30 FPS * buffer seconds
        self.recording_session_id = None  # Track recording sessions

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

        # Complete any ongoing recording properly
        self._complete_recording()

        if self.camera:
            self.camera.release()
            self.camera = None

        # Complete reset for fresh start
        self._reset_detection_state()

        logger.info("Camera monitoring COMPLETELY stopped and reset")

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

                # Add frame to buffer for potential recording
                if len(self.frame_buffer) >= self.max_buffer_size:
                    self.frame_buffer.pop(0)  # Remove oldest frame
                self.frame_buffer.append(frame.copy())

                # Process detection results
                weapon_detected = results.get('success') and results.get('count', 0) > 0

                if weapon_detected:
                    # Start new detection cycle if not already started
                    if self.weapon_detected_time is None:
                        self.weapon_detected_time = current_time
                        self.alert_logged = False
                        self.recording_session_id = str(uuid.uuid4())[:8]
                        logger.info(f"NEW weapon detection cycle started [Session: {self.recording_session_id}]")

                    self.last_detection_time = current_time
                    detection_duration = current_time - self.weapon_detected_time

                    # Start recording when threshold is crossed
                    if detection_duration >= WEAPON_ALERT_THRESHOLD and not self.alert_logged:
                        self._start_new_recording()
                        self._log_weapon_alert(results, detection_duration)
                        self.alert_logged = True
                        logger.info(f"NEW Recording started [Session: {self.recording_session_id}] after {detection_duration:.1f}s")

                    # Write frame to recording if active
                    if self.is_recording and self.video_writer:
                        annotated_frame = self.detector.annotate_image(frame)
                        self.video_writer.write(annotated_frame)

                    # Emit detection data
                    socketio.emit('weapon_detection', {
                        'detected': True,
                        'duration': detection_duration,
                        'detections': results.get('detections', []),
                        'count': results.get('count', 0),
                        'session_id': self.recording_session_id,
                        'timestamp': datetime.now().isoformat()
                    })

                else:
                    # No weapon detected - handle recording stop logic
                    if self.last_detection_time is not None:
                        time_since_last_detection = current_time - self.last_detection_time

                        # Continue recording for buffer time after detection stops
                        if self.is_recording and self.video_writer:
                            annotated_frame = self.detector.annotate_image(frame)
                            self.video_writer.write(annotated_frame)

                            # Stop recording after buffer time
                            if time_since_last_detection > RECORDING_BUFFER_SECONDS:
                                self._complete_recording()
                                logger.info(f"Recording completed [Session: {self.recording_session_id}] after buffer time")

                        # COMPLETE RESET after grace period for totally fresh cycle
                        if time_since_last_detection > 5.0:
                            logger.info(f"Detection cycle COMPLETELY RESET [Session: {self.recording_session_id}] - Ready for fresh detection")
                            self._reset_detection_state()

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
                'threshold_seconds': WEAPON_ALERT_THRESHOLD,
                'recording_filename': self.recording_filename,
                'recording_started': self.is_recording
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

    def start_recording(self):
        """Legacy method - redirects to new recording system"""
        self._start_new_recording()

    def stop_recording(self):
        """Stop video recording"""
        try:
            if not self.is_recording:
                return

            self.is_recording = False
            if self.video_writer:
                self.video_writer.release()
                self.video_writer = None

            logger.info(f"Recording stopped: {self.recording_filename}")

            # Emit recording stopped event with file info
            if self.recording_filename:
                recording_path = os.path.join(RECORDINGS_FOLDER, self.recording_filename)
                file_size = os.path.getsize(recording_path) if os.path.exists(recording_path) else 0

                socketio.emit('recording_stopped', {
                    'filename': self.recording_filename,
                    'file_size': file_size,
                    'timestamp': datetime.now().isoformat()
                })

            self.recording_filename = None

        except Exception as e:
            logger.error(f"Failed to stop recording: {e}")

    def force_stop_recording(self):
        """Force stop recording with complete cleanup"""
        try:
            self.is_recording = False
            if self.video_writer:
                self.video_writer.release()
                self.video_writer = None
            self.recording_filename = None
            logger.info("Recording force stopped and cleaned up")
        except Exception as e:
            logger.error(f"Failed to force stop recording: {e}")

    def _start_new_recording(self):
        """Start completely new recording session"""
        try:
            # Force cleanup any existing recording
            self._complete_recording()
            time.sleep(0.1)

            # Create new recording with session ID
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')[:-3]
            self.recording_filename = f"weapon_alert_{timestamp}_{self.recording_session_id}.mp4"
            recording_path = os.path.join(RECORDINGS_FOLDER, self.recording_filename)

            # Get frame dimensions
            height, width = self.frame_buffer[0].shape[:2] if self.frame_buffer else (480, 640)

            # Initialize NEW video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            self.video_writer = cv2.VideoWriter(recording_path, fourcc, 30.0, (width, height))

            if not self.video_writer.isOpened():
                raise Exception("Failed to open video writer")

            # Write buffered frames (pre-alert footage)
            for buffered_frame in self.frame_buffer:
                annotated_frame = self.detector.annotate_image(buffered_frame)
                self.video_writer.write(annotated_frame)

            self.is_recording = True
            logger.info(f"NEW recording session started: {self.recording_filename}")

            # Emit recording started event
            socketio.emit('recording_started', {
                'filename': self.recording_filename,
                'session_id': self.recording_session_id,
                'timestamp': datetime.now().isoformat()
            })

        except Exception as e:
            logger.error(f"Failed to start new recording: {e}")
            self.is_recording = False

    def _complete_recording(self):
        """Complete current recording session"""
        try:
            if not self.is_recording:
                return

            self.is_recording = False
            if self.video_writer:
                self.video_writer.release()
                self.video_writer = None

            logger.info(f"Recording session completed: {self.recording_filename}")

            # Emit recording completed event
            if self.recording_filename:
                recording_path = os.path.join(RECORDINGS_FOLDER, self.recording_filename)
                file_size = os.path.getsize(recording_path) if os.path.exists(recording_path) else 0

                socketio.emit('recording_stopped', {
                    'filename': self.recording_filename,
                    'session_id': self.recording_session_id,
                    'file_size': file_size,
                    'timestamp': datetime.now().isoformat()
                })

        except Exception as e:
            logger.error(f"Failed to complete recording: {e}")

    def _reset_detection_state(self):
        """Completely reset detection state for fresh cycle"""
        try:
            # Complete any ongoing recording
            if self.is_recording:
                self._complete_recording()

            # Reset all state
            self.weapon_detected_time = None
            self.last_detection_time = None
            self.alert_logged = False
            self.recording_session_id = None
            self.recording_filename = None

            # Clear frame buffer for fresh start
            self.frame_buffer.clear()

            logger.info("Detection state COMPLETELY RESET - Ready for new cycle")

        except Exception as e:
            logger.error(f"Failed to reset detection state: {e}")

    def get_status(self):
        return {
            'monitoring': self.is_monitoring,
            'camera_connected': self.camera is not None and self.camera.isOpened() if self.camera else False,
            'weapon_detected': self.weapon_detected_time is not None,
            'detection_duration': time.time() - self.weapon_detected_time if self.weapon_detected_time else 0,
            'recording': self.is_recording,
            'current_recording': self.recording_filename
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
    """Generate video frames for streaming"""
    try:
        while camera_monitor.is_monitoring and camera_monitor.camera:
            try:
                ret, frame = camera_monitor.camera.read()
                if not ret:
                    logger.warning("Failed to read frame for streaming")
                    time.sleep(0.1)
                    continue

                # Annotate frame with detections
                try:
                    annotated_frame = detector.annotate_image(frame)
                except Exception as e:
                    logger.warning(f"Frame annotation error: {e}")
                    annotated_frame = frame  # Use original frame if annotation fails

                # Encode frame as JPEG
                try:
                    ret, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                    if not ret:
                        logger.warning("Failed to encode frame")
                        time.sleep(0.1)
                        continue
                except Exception as e:
                    logger.error(f"Frame encoding error: {e}")
                    time.sleep(0.1)
                    continue

                frame_bytes = buffer.tobytes()

                # Yield frame in multipart format
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(frame_bytes)).encode() + b'\r\n\r\n' +
                       frame_bytes + b'\r\n')

                time.sleep(0.033)  # ~30 FPS

            except Exception as e:
                logger.error(f"Frame processing error: {e}")
                time.sleep(0.1)
                continue

    except Exception as e:
        logger.error(f"Video stream generator error: {e}")
    finally:
        logger.info("Video stream generator stopped")

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
    try:
        # Check if monitoring is active
        if not camera_monitor.is_monitoring:
            logger.error("Camera monitoring not active for streaming")
            return jsonify({"error": "Camera monitoring not active. Please start monitoring first."}), 400

        # Check if camera is accessible
        if not camera_monitor.camera or not camera_monitor.camera.isOpened():
            logger.error("Camera not accessible for streaming")
            return jsonify({"error": "Camera not accessible"}), 500

        logger.info("Starting video stream...")

        return Response(
            generate_frames(),
            mimetype='multipart/x-mixed-replace; boundary=frame',
            headers={
                'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Connection': 'close',
                'X-Accel-Buffering': 'no',
                'Access-Control-Allow-Origin': '*'
            }
        )

    except Exception as e:
        logger.error(f"Video stream error: {e}")
        return jsonify({"error": f"Video stream failed: {str(e)}"}), 500

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

# Recording management endpoints
@app.route('/recordings', methods=['GET'])
def get_recordings():
    """Get list of all recorded videos"""
    try:
        recordings = []
        if os.path.exists(RECORDINGS_FOLDER):
            for filename in os.listdir(RECORDINGS_FOLDER):
                if filename.endswith('.mp4'):
                    file_path = os.path.join(RECORDINGS_FOLDER, filename)
                    file_stats = os.stat(file_path)

                    recording_info = {
                        'filename': filename,
                        'file_size': file_stats.st_size,
                        'created_at': datetime.fromtimestamp(file_stats.st_ctime).isoformat(),
                        'modified_at': datetime.fromtimestamp(file_stats.st_mtime).isoformat(),
                        'download_url': f'/recordings/download/{filename}'
                    }
                    recordings.append(recording_info)

        # Sort by creation date (newest first)
        recordings.sort(key=lambda x: x['created_at'], reverse=True)

        return jsonify({
            "success": True,
            "recordings": recordings,
            "count": len(recordings)
        })

    except Exception as e:
        logger.error(f"Get recordings error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/recordings/download/<filename>', methods=['GET'])
def download_recording(filename):
    """Download a specific recording"""
    try:
        # Security: only allow mp4 files and prevent path traversal
        if not filename.endswith('.mp4') or '..' in filename or '/' in filename:
            return jsonify({"error": "Invalid filename"}), 400

        file_path = os.path.join(RECORDINGS_FOLDER, filename)

        if not os.path.exists(file_path):
            return jsonify({"error": "Recording not found"}), 404

        # Check if this is for video playback (browser request)
        play_mode = request.args.get('play') == '1'

        if play_mode:
            # For video playback - support range requests and proper headers
            file_size = os.path.getsize(file_path)

            # Handle range requests for video seeking
            range_header = request.headers.get('Range', None)
            if range_header:
                byte_start, byte_end = 0, file_size - 1

                # Parse range header
                if 'bytes=' in range_header:
                    ranges = range_header.replace('bytes=', '').split('-')
                    if ranges[0]:
                        byte_start = int(ranges[0])
                    if ranges[1]:
                        byte_end = int(ranges[1])

                # Read the requested chunk
                chunk_size = byte_end - byte_start + 1

                def generate_chunk():
                    with open(file_path, 'rb') as f:
                        f.seek(byte_start)
                        remaining = chunk_size
                        while remaining:
                            read_size = min(8192, remaining)
                            data = f.read(read_size)
                            if not data:
                                break
                            remaining -= len(data)
                            yield data

                response = Response(
                    generate_chunk(),
                    206,  # Partial Content
                    headers={
                        'Content-Type': 'video/mp4',
                        'Accept-Ranges': 'bytes',
                        'Content-Range': f'bytes {byte_start}-{byte_end}/{file_size}',
                        'Content-Length': str(chunk_size),
                        'Cache-Control': 'no-cache',
                    }
                )
                return response
            else:
                # No range request - serve full file for video
                def generate_full_file():
                    with open(file_path, 'rb') as f:
                        while True:
                            data = f.read(8192)
                            if not data:
                                break
                            yield data

                response = Response(
                    generate_full_file(),
                    headers={
                        'Content-Type': 'video/mp4',
                        'Accept-Ranges': 'bytes',
                        'Content-Length': str(file_size),
                        'Cache-Control': 'no-cache',
                    }
                )
                return response
        else:
            # Regular download
            return Response(
                open(file_path, 'rb').read(),
                headers={
                    'Content-Type': 'video/mp4',
                    'Content-Disposition': f'attachment; filename="{filename}"'
                }
            )

    except Exception as e:
        logger.error(f"Download recording error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/recordings/delete/<filename>', methods=['DELETE'])
def delete_recording(filename):
    """Delete a specific recording"""
    try:
        # Security: only allow mp4 files and prevent path traversal
        if not filename.endswith('.mp4') or '..' in filename or '/' in filename:
            return jsonify({"error": "Invalid filename"}), 400

        file_path = os.path.join(RECORDINGS_FOLDER, filename)

        if not os.path.exists(file_path):
            return jsonify({"error": "Recording not found"}), 404

        os.remove(file_path)
        logger.info(f"Recording deleted: {filename}")

        return jsonify({
            "success": True,
            "message": f"Recording {filename} deleted successfully"
        })

    except Exception as e:
        logger.error(f"Delete recording error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/recordings/stream/<filename>')
def stream_recording(filename):
    """Stream a recording for preview"""
    try:
        # Security: only allow mp4 files and prevent path traversal
        if not filename.endswith('.mp4') or '..' in filename or '/' in filename:
            return jsonify({"error": "Invalid filename"}), 400

        file_path = os.path.join(RECORDINGS_FOLDER, filename)

        if not os.path.exists(file_path):
            return jsonify({"error": "Recording not found"}), 404

        def generate_video():
            with open(file_path, 'rb') as f:
                data = f.read(1024)
                while data:
                    yield data
                    data = f.read(1024)

        return Response(
            generate_video(),
            headers={
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes'
            }
        )

    except Exception as e:
        logger.error(f"Stream recording error: {e}")
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
