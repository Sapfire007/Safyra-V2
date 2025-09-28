"""
Violence Detection Test Script
Simple test function with hardcoded paths
"""

import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow import keras
from keras.layers import *
from keras.models import Sequential
from keras.applications.mobilenet_v2 import MobileNetV2

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# -------------------------------
# Configuration
# -------------------------------
IMAGE_HEIGHT, IMAGE_WIDTH = 64, 64
SEQUENCE_LENGTH = 16
CLASSES_LIST = ["NonViolence", "Violence"]

# Hardcoded paths
MODEL_PATH = "MoBiLSTM_model.h5"
VIDEO_PATH = "test_video.mp4"

# -------------------------------
# Model Architecture Recreation
# -------------------------------
def create_model():
    """
    Recreate the exact model architecture from training
    """
    # Load MobileNetV2 base model
    mobilenet = MobileNetV2(include_top=False, weights="imagenet")
    
    # Fine-tuning: make last 40 layers trainable
    mobilenet.trainable = True
    for layer in mobilenet.layers[:-40]:
        layer.trainable = False
    
    # Build the complete model
    model = Sequential()
    
    # Input layer
    model.add(Input(shape=(SEQUENCE_LENGTH, IMAGE_HEIGHT, IMAGE_WIDTH, 3)))
    
    # TimeDistributed MobileNet
    model.add(TimeDistributed(mobilenet))
    model.add(Dropout(0.25))
    model.add(TimeDistributed(Flatten()))
    
    # Bidirectional LSTM
    lstm_fw = LSTM(units=32)
    lstm_bw = LSTM(units=32, go_backwards=True)
    model.add(Bidirectional(lstm_fw, backward_layer=lstm_bw))
    model.add(Dropout(0.25))
    
    # Dense layers
    model.add(Dense(256, activation='relu'))
    model.add(Dropout(0.25))
    model.add(Dense(128, activation='relu'))
    model.add(Dropout(0.25))
    model.add(Dense(64, activation='relu'))
    model.add(Dropout(0.25))
    model.add(Dense(32, activation='relu'))
    model.add(Dropout(0.25))
    
    # Output layer
    model.add(Dense(len(CLASSES_LIST), activation='softmax'))
    
    return model

# -------------------------------
# Model Loading Function
# -------------------------------
def load_trained_model():
    """
    Load the trained model with proper error handling
    """
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model file not found: {MODEL_PATH}")
        print("Please ensure 'MoBiLSTM_model.h5' is in the same directory as this script.")
        return None
        
    try:
        print(f"📥 Loading model from {MODEL_PATH}...")
        model = keras.models.load_model(MODEL_PATH)
        print("✅ Model loaded successfully!")
        return model
        
    except Exception as e:
        print(f"⚠️ Direct loading failed: {str(e)[:100]}...")
        print("🔧 Recreating model architecture and loading weights...")
        
        try:
            # Recreate model and load weights
            model = create_model()
            model.load_weights(MODEL_PATH)
            
            # Compile the model
            model.compile(
                loss='categorical_crossentropy',
                optimizer='sgd',
                metrics=['accuracy']
            )
            print("✅ Model weights loaded successfully!")
            return model
            
        except Exception as e2:
            print(f"❌ Failed to load weights: {e2}")
            return None

# -------------------------------
# Video Processing Functions
# -------------------------------
def extract_frames():
    """
    Extract frames from video for prediction
    """
    if not os.path.exists(VIDEO_PATH):
        print(f"❌ Video file not found: {VIDEO_PATH}")
        print("Please ensure 'test_video.mp4' is in the same directory as this script.")
        return None
    
    frames_list = []
    video_reader = cv2.VideoCapture(VIDEO_PATH)
    
    if not video_reader.isOpened():
        print(f"❌ Could not open video file: {VIDEO_PATH}")
        return None
    
    video_frames_count = int(video_reader.get(cv2.CAP_PROP_FRAME_COUNT))
    skip_frames_window = max(int(video_frames_count / SEQUENCE_LENGTH), 1)
    
    print(f"📹 Video has {video_frames_count} frames, extracting {SEQUENCE_LENGTH} frames...")
    
    for frame_counter in range(SEQUENCE_LENGTH):
        video_reader.set(cv2.CAP_PROP_POS_FRAMES, frame_counter * skip_frames_window)
        success, frame = video_reader.read()
        
        if not success:
            break
            
        # Resize and normalize frame
        resized_frame = cv2.resize(frame, (IMAGE_HEIGHT, IMAGE_WIDTH))
        normalized_frame = resized_frame / 255.0
        frames_list.append(normalized_frame)
    
    video_reader.release()
    
    if len(frames_list) == SEQUENCE_LENGTH:
        print(f"✅ Successfully extracted {len(frames_list)} frames")
        return np.array(frames_list)
    else:
        print(f"⚠️ Only extracted {len(frames_list)} frames, expected {SEQUENCE_LENGTH}")
        return None

def predict_violence():
    """
    Main prediction function
    """
    print("🔍 Analyzing video for violence detection...")
    
    # Extract frames
    frames = extract_frames()
    if frames is None:
        print("❌ Failed to extract frames from video")
        return
    
    # Load model
    model = load_trained_model()
    if model is None:
        print("❌ Failed to load model")
        return
    
    # Make prediction
    print("🤖 Making prediction...")
    frames_batch = np.expand_dims(frames, axis=0)
    predictions = model.predict(frames_batch, verbose=0)[0]
    
    predicted_label = np.argmax(predictions)
    predicted_class = CLASSES_LIST[predicted_label]
    confidence = predictions[predicted_label]
    
    # Display results
    print("\n" + "="*50)
    print("🎯 PREDICTION RESULTS:")
    print("="*50)
    print(f"📊 Prediction: {predicted_class}")
    print(f"📈 Confidence: {confidence:.4f} ({confidence:.1%})")
    print(f"🔴 Violence Probability: {predictions[1]:.4f} ({predictions[1]:.1%})")
    print(f"🟢 Non-Violence Probability: {predictions[0]:.4f} ({predictions[0]:.1%})")
    
    if predicted_class == "Violence":
        print(f"\n🚨 ALERT: VIOLENCE DETECTED with {confidence:.1%} confidence!")
    else:
        print(f"\n✅ SAFE: No violence detected with {confidence:.1%} confidence")
    
    print("="*50)

# -------------------------------
# Simple Test Function
# -------------------------------
def test_violence_detection():
    """
    Simple test function - just run this!
    """
    print("🚀 Violence Detection Test Starting...")
    print("="*50)
    print(f"📁 Model file: {MODEL_PATH}")
    print(f"🎬 Video file: {VIDEO_PATH}")
    print("="*50)
    
    predict_violence()

# -------------------------------
# Run Test
# -------------------------------
if __name__ == "__main__":
    test_violence_detection()