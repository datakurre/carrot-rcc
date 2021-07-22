# https://opencv-tutorial.readthedocs.io/en/latest/yolo/yolo.html

import hashlib
import os
import tempfile
import urllib.request

import cv2 as cv
import numpy as np

COCO_NAMES = os.path.join(os.path.dirname(__file__), "coco.names")
YOLOV3_CFG = os.path.join(os.path.dirname(__file__), "yolov3.cfg")
YOLOV3_WEIGHTS = os.path.join(tempfile.gettempdir(), "yolov3.weights")
YOLOV3_WEIGHTS_SHA = "523e4e69e1d015393a1b0a441cef1d9c7659e3eb2d7e15f793f060a21b32f297"
YOLOV3_WEIGHTS_URL = "https://pjreddie.com/media/files/yolov3.weights"

YOLOV3_OI_NAMES = os.path.join(os.path.dirname(__file__), "openimages.names")
YOLOV3_OI_CFG = os.path.join(os.path.dirname(__file__), "yolov3-openimages.cfg")
YOLOV3_OI_WEIGHTS = os.path.join(tempfile.gettempdir(), "yolov3-openimages.weights")
YOLOV3_OI_WEIGHTS_SHA = (
    "be129d792d8c7cc19b17bcb9d40ced71cdf079bfd246cbd1cfca40568ac74ee1"
)
YOLOV3_OI_WEIGHTS_URL = "https://pjreddie.com/media/files/yolov3-openimages.weights"

HAS_YOLOV3_WEIGHTS = False
HAS_YOLOV3_OI_WEIGHTS = False

if os.path.exists(YOLOV3_WEIGHTS):
    print(f"{YOLOV3_WEIGHTS}: verifying")
    sha256 = hashlib.sha256()
    with open(YOLOV3_WEIGHTS, "rb") as fp:
        while True:
            data = fp.read(65536)
            if not data:
                break
            sha256.update(data)
    if sha256.hexdigest() == YOLOV3_WEIGHTS_SHA:
        HAS_YOLOV3_WEIGHTS = True
        print(f"{YOLOV3_WEIGHTS}: verified")

if not HAS_YOLOV3_WEIGHTS:
    print(f"{YOLOV3_WEIGHTS}: loading")
    response = urllib.request.urlopen(YOLOV3_WEIGHTS_URL)
    with open(YOLOV3_WEIGHTS, "wb") as fp:
        while True:
            chunk = response.read(65536)
            if not chunk:
                break
            else:
                fp.write(chunk)
    HAS_YOLOV3_WEIGHTS = True
    print(f"{YOLOV3_WEIGHTS}: loaded")

if os.path.exists(YOLOV3_OI_WEIGHTS):
    print(f"{YOLOV3_OI_WEIGHTS}: verifying")
    sha256 = hashlib.sha256()
    with open(YOLOV3_OI_WEIGHTS, "rb") as fp:
        while True:
            data = fp.read(65536)
            if not data:
                break
            sha256.update(data)
    if sha256.hexdigest() == YOLOV3_OI_WEIGHTS_SHA:
        HAS_YOLOV3_OI_WEIGHTS = True
        print(f"{YOLOV3_OI_WEIGHTS}: verified")


if not HAS_YOLOV3_OI_WEIGHTS:
    print(f"{YOLOV3_OI_WEIGHTS}: loading")
    response = urllib.request.urlopen(YOLOV3_OI_WEIGHTS_URL)
    with open(YOLOV3_OI_WEIGHTS, "wb") as fp:
        while True:
            chunk = response.read(65536)
            if not chunk:
                break
            else:
                fp.write(chunk)
    HAS_YOLOV3_OI_WEIGHTS = True
    print(f"{YOLOV3_OI_WEIGHTS}: loaded")


with open(COCO_NAMES) as fp:
    YOLOV3_CLASSES = fp.read().strip().split("\n")

with open(YOLOV3_OI_NAMES) as fp:
    YOLOV3_OI_CLASSES = fp.read().strip().split("\n")


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
    H, W = img.shape[:2]

    boxes = []
    confidences = []
    classIDs = []

    for output, classes in outputs:
        scores = output[5:]
        classID = np.argmax(scores)
        confidence = scores[classID]
        if confidence > conf:
            x, y, w, h = output[:4] * np.array([W, H, W, H])
            p0 = int(x - w // 2), int(y - h // 2)
            boxes.append([*p0, int(w), int(h), classes])
            confidences.append(float(confidence))
            classIDs.append(classID)

    indices = cv.dnn.NMSBoxes(boxes, confidences, conf, conf - 0.1)

    objects = []
    if len(indices) > 0:
        for i in indices.flatten():
            (x, y) = (boxes[i][0], boxes[i][1])
            (w, h) = (boxes[i][2], boxes[i][3])
            objects.append((x, y, w, h, boxes[i][4][classIDs[i]], confidences[i]))

    return objects


class YOLO3:
    def identify_objects(self, filename, confidence=0.2, output=None):
        output = output or os.path.dirname(__file__)
        base, ext = os.path.splitext(os.path.basename(filename))
        img = cv.imread(filename)
        outputs = [
            (o, YOLOV3_CLASSES) for o in get_outputs(img, YOLOV3_CFG, YOLOV3_WEIGHTS)
        ] + [
            (o, YOLOV3_OI_CLASSES)
            for o in get_outputs(img, YOLOV3_OI_CFG, YOLOV3_OI_WEIGHTS)
        ]
        results = classify_outputs(img, outputs, confidence)
        final = []
        for idx in range(len(results)):
            result = results[idx]
            x, y, w, h, name, conf = result
            x = max(x - 10, 0)
            y = max(y - 10, 0)
            w = max(w + 20, 1)
            h = max(h + 20, 1)
            safe = name.lower().replace(" ", "_")
            path = os.path.join(output, f"{base}-{(idx + 1):03d}-{safe}{ext}")
            cv.imwrite(path, img[y : y + h, x : x + w])
            final.append(
                {
                    "filename": path,
                    "basename": os.path.basename(path),
                    "name": name.lower(),
                }
            )
        return final
