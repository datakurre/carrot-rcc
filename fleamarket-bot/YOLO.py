# https://opencv-tutorial.readthedocs.io/en/latest/yolo/yolo.html

import hashlib
import os
import tempfile
import urllib.request

import cv2 as cv
import numpy as np


COCO_NAMES = os.path.join(os.path.dirname(__file__), "coco.names")
YOLO_V3_CFG = os.path.join(os.path.dirname(__file__), "yolov3.cfg")
YOLO_V3_WEIGHTS = os.path.join(tempfile.gettempdir(), "yolov3.weights")
YOLO_V3_WEIGHTS_SHA = "523e4e69e1d015393a1b0a441cef1d9c7659e3eb2d7e15f793f060a21b32f297"
YOLO_V3_WEIGHTS_URL = "https://pjreddie.com/media/files/yolov3.weights"

YOLO_V3_OI_NAMES = os.path.join(os.path.dirname(__file__), "openimages.names")
YOLO_V3_OI_CFG = os.path.join(os.path.dirname(__file__), "yolov3-openimages.cfg")
YOLO_V3_OI_WEIGHTS = os.path.join(tempfile.gettempdir(), "yolov3-openimages.weights")
YOLO_V3_OI_WEIGHTS_SHA = (
    "be129d792d8c7cc19b17bcb9d40ced71cdf079bfd246cbd1cfca40568ac74ee1"
)
YOLO_V3_OI_WEIGHTS_URL = "https://pjreddie.com/media/files/yolov3-openimages.weights"


def get_outputs(img, cfg, weights):
    net = cv.dnn.readNetFromDarknet(cfg, weights)
    net.setPreferableBackend(cv.dnn.DNN_BACKEND_OPENCV)

    # determine the output layer
    ln = net.getLayerNames()
    ln = [ln[i[0] - 1] for i in net.getUnconnectedOutLayers()]

    blob = cv.dnn.blobFromImage(img, 1 / 255.0, (608, 608), swapRB=True, crop=False)

    net.setInput(blob)
    outputs = net.forward(ln)

    # combine the 3 output groups into 1 (10647, 85)
    # large objects (507, 85)
    # medium objects (2028, 85)
    # small objects (8112, 85)
    outputs = np.vstack(outputs)

    return outputs


def classify_outputs(img, outputs, conf):
    height, width = img.shape[:2]

    boxes = []
    confidences = []
    class_ids = []

    for output, classes in outputs:
        scores = output[5:]
        class_id = np.argmax(scores)
        confidence = scores[class_id]
        if confidence > conf:
            x, y, w, h = output[:4] * np.array([width, height, width, height])
            p0 = int(x - w // 2), int(y - h // 2)
            boxes.append([*p0, int(w), int(h), classes])
            confidences.append(float(confidence))
            class_ids.append(class_id)

    indices = cv.dnn.NMSBoxes(boxes, confidences, conf, conf - 0.1)

    objects = []
    if len(indices) > 0:
        for i in indices.flatten():
            (x, y) = (boxes[i][0], boxes[i][1])
            (w, h) = (boxes[i][2], boxes[i][3])
            objects.append((x, y, w, h, boxes[i][4][class_ids[i]], confidences[i]))

    return objects


class YOLO:
    def __init__(self):

        yolo_v3_weights_downloaded = False

        if os.path.exists(YOLO_V3_WEIGHTS):
            print(f"{YOLO_V3_WEIGHTS}: verifying")
            sha256 = hashlib.sha256()
            with open(YOLO_V3_WEIGHTS, "rb") as fp:
                while True:
                    data = fp.read(2 ** 20)
                    if not data:
                        break
                    sha256.update(data)
            if sha256.hexdigest() == YOLO_V3_WEIGHTS_SHA:
                yolo_v3_weights_downloaded = True
                print(f"{YOLO_V3_WEIGHTS}: verified")

        if not yolo_v3_weights_downloaded:
            print(f"{YOLO_V3_WEIGHTS}: loading")
            response = urllib.request.urlopen(YOLO_V3_WEIGHTS_URL)
            with open(YOLO_V3_WEIGHTS, "wb") as fp:
                while True:
                    chunk = response.read(2 ** 16)
                    if not chunk:
                        break
                    else:
                        fp.write(chunk)
            print(f"{YOLO_V3_WEIGHTS}: loaded")

        yolo_v3_oi_weights_downloaded = False

        if os.path.exists(YOLO_V3_OI_WEIGHTS):
            print(f"{YOLO_V3_OI_WEIGHTS}: verifying")
            sha256 = hashlib.sha256()
            with open(YOLO_V3_OI_WEIGHTS, "rb") as fp:
                while True:
                    data = fp.read(2 ** 20)
                    if not data:
                        break
                    sha256.update(data)
            if sha256.hexdigest() == YOLO_V3_OI_WEIGHTS_SHA:
                yolo_v3_oi_weights_downloaded = True
                print(f"{YOLO_V3_OI_WEIGHTS}: verified")

        if not yolo_v3_oi_weights_downloaded:
            print(f"{YOLO_V3_OI_WEIGHTS}: loading")
            response = urllib.request.urlopen(YOLO_V3_OI_WEIGHTS_URL)
            with open(YOLO_V3_OI_WEIGHTS, "wb") as fp:
                while True:
                    chunk = response.read(2 ** 16)
                    if not chunk:
                        break
                    else:
                        fp.write(chunk)
            print(f"{YOLO_V3_OI_WEIGHTS}: loaded")

        with open(COCO_NAMES) as fp:
            self.YOLO_V3_CLASSES = fp.read().strip().split("\n")

        with open(YOLO_V3_OI_NAMES) as fp:
            self.YOLO_V3_OI_CLASSES = fp.read().strip().split("\n")

    def identify_objects(self, filename, confidence=0.2):
        img = cv.imread(filename)
        outputs = [
            (o, self.YOLO_V3_CLASSES)
            for o in get_outputs(img, YOLO_V3_CFG, YOLO_V3_WEIGHTS)
        ] + [
            (o, self.YOLO_V3_OI_CLASSES)
            for o in get_outputs(img, YOLO_V3_OI_CFG, YOLO_V3_OI_WEIGHTS)
        ]
        results = classify_outputs(img, outputs, confidence)
        final = []
        for idx in range(len(results)):
            result = results[idx]
            x, y, w, h, name, conf = result
            final.append(
                {
                    "name": name.lower(),
                    "x": max(x, 0),
                    "y": max(y, 0),
                    "width": max(w, 1),
                    "height": max(h, 1),
                    "confidence": conf,
                }
            )
        return final
