import cv2
from ultralytics import YOLO

model = YOLO("best.pt")

cap = cv2.VideoCapture(0)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    results = model(frame)

    for r in results:
        for i in range(len(r.boxes.cls)):
            class_id = int(r.boxes.cls[i])
            if r.names[class_id].lower() == "pistol":
                r.names[class_id] = "gun"

        annotated_frame = r.plot()

    cv2.imshow("Gun and Knife Detection - Press 'q' to Quit", annotated_frame)

    # Exit on 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()