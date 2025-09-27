import os
import tkinter as tk
import pyaudio
import wave
import threading
from datetime import datetime
import json
import geocoder

class AudioRecorderApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🚨 SOS Distress Recorder")
        self.root.geometry("350x250")

        self.output_dir = r"C:\Users\sapfi\Downloads\voiceSOS\Distress_calls"
        os.makedirs(self.output_dir, exist_ok=True)

        self.is_recording = False
        self.frames = []
        self.audio = pyaudio.PyAudio()
        self.stream = None
        self.sample_rate = 44100
        self.chunk_size = 1024
        self.channels = 1
        self.format = pyaudio.paInt16

        self.setup_gui()

    def setup_gui(self):
        main_frame = tk.Frame(self.root, padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)

        self.record_button = tk.Button(
            main_frame,
            text="Press & Hold SOS",
            bg="red",
            fg="white",
            font=("Arial", 14, "bold")
        )
        self.record_button.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.record_button.bind("<ButtonPress-1>", self.start_recording)
        self.record_button.bind("<ButtonRelease-1>", self.stop_recording)

        self.status_label = tk.Label(main_frame, text="Ready", font=("Arial", 10))
        self.status_label.pack(pady=10)

    def start_recording(self, event=None):
        if not self.is_recording:
            self.is_recording = True
            self.frames = []
            self.record_button.config(text="Recording...", bg="darkred")
            self.status_label.config(text="Recording in progress...")

            self.record_thread = threading.Thread(target=self.record_audio, daemon=True)
            self.record_thread.start()

    def stop_recording(self, event=None):
        if self.is_recording:
            self.is_recording = False
            self.record_button.config(text="Press & Hold SOS", bg="red")

            if hasattr(self, 'record_thread') and self.record_thread.is_alive():
                self.record_thread.join()

            if self.frames:
                self.save_audio()
                self.status_label.config(text="Audio saved successfully")
            else:
                self.status_label.config(text="Recording too short, not saved")

    def record_audio(self):
        self.stream = self.audio.open(
            format=self.format,
            channels=self.channels,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size
        )

        while self.is_recording:
            data = self.stream.read(self.chunk_size, exception_on_overflow=False)
            self.frames.append(data)

        self.stream.stop_stream()
        self.stream.close()
        self.stream = None

    def save_audio(self):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"SOS_{timestamp}"
        audio_filename = os.path.join(self.output_dir, f"{base_filename}.mp3")
        json_filename = os.path.join(self.output_dir, f"{base_filename}.json")

        with wave.open(audio_filename, 'wb') as wf:
            wf.setnchannels(self.channels)
            wf.setsampwidth(self.audio.get_sample_size(self.format))
            wf.setframerate(self.sample_rate)
            wf.writeframes(b''.join(self.frames))

        metadata = self.get_metadata()
        metadata["file"] = audio_filename
        with open(json_filename, "w") as jf:
            json.dump(metadata, jf, indent=4)

        print(f"🎙️ Audio saved: {audio_filename}")
        print(f"📄 Metadata saved: {json_filename}")

    def get_metadata(self):
        """Collect metadata including GPS coordinates and location."""
        current_time = datetime.now()

        try:
            g = geocoder.ip('me')
            lat, lng = g.latlng if g.latlng else ("Unknown", "Unknown")
            city = g.city or "Unknown"
            country = g.country or "Unknown"
        except Exception as e:
            print(f"⚠️ Location error: {e}")
            lat, lng, city, country = ("Unknown", "Unknown", "Unknown", "Unknown")

        return {
            "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "date": current_time.strftime("%Y-%m-%d"),
            "time": current_time.strftime("%H:%M:%S"),
            "latitude": lat,
            "longitude": lng,
            "location": f"{city}, {country}"
        }

    def on_closing(self):
        if self.is_recording:
            self.stop_recording()
        if self.stream:
            self.stream.close()
        self.audio.terminate()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = AudioRecorderApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()