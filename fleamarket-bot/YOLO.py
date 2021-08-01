# https://opencv-tutorial.readthedocs.io/en/latest/yolo/yolo.html

import hashlib
import os
import urllib.request

import cv2 as cv
import numpy as np

from robot.api import logger
from appdirs import user_cache_dir


INITIALIZED = False

USER_CACHE_DIR = user_cache_dir("YOLOv3", "Shared")

COCO_NAMES = os.path.join(os.path.dirname(__file__), "coco.names")
YOLO_CC_CFG = os.path.join(os.path.dirname(__file__), "yolov3.cfg")
YOLO_CC_WEIGHTS = os.path.join(USER_CACHE_DIR, "yolov3.weights")
YOLO_CC_WEIGHTS_SHA = "523e4e69e1d015393a1b0a441cef1d9c7659e3eb2d7e15f793f060a21b32f297"
YOLO_CC_WEIGHTS_URL = "https://pjreddie.com/media/files/yolov3.weights"
YOLO_CC_CLASSES = []

YOLO_OI_NAMES = os.path.join(os.path.dirname(__file__), "openimages.names")
YOLO_OI_CFG = os.path.join(os.path.dirname(__file__), "yolov3-openimages.cfg")
YOLO_OI_WEIGHTS = os.path.join(USER_CACHE_DIR, "yolov3-openimages.weights")
YOLO_OI_WEIGHTS_SHA = "be129d792d8c7cc19b17bcb9d40ced71cdf079bfd246cbd1cfca40568ac74ee1"
YOLO_OI_WEIGHTS_URL = "https://pjreddie.com/media/files/yolov3-openimages.weights"
YOLO_OI_CLASSES = []


def init():
    if not os.path.exists(USER_CACHE_DIR):
        os.makedirs(USER_CACHE_DIR)

    if os.path.exists(YOLO_CC_WEIGHTS):
        logger.info(f"{YOLO_CC_WEIGHTS}: verifying")
        sha256 = hashlib.sha256()
        with open(YOLO_CC_WEIGHTS, "rb") as fp:
            while True:
                data = fp.read(2 ** 20)
                if not data:
                    break
                sha256.update(data)
        if sha256.hexdigest() == YOLO_CC_WEIGHTS_SHA:
            logger.info(f"{YOLO_CC_WEIGHTS}: verified")
        else:
            logger.info(f"{YOLO_CC_WEIGHTS}: invalid")
            os.remove(YOLO_CC_WEIGHTS)

    if not os.path.exists(YOLO_CC_WEIGHTS):
        logger.info(f"{YOLO_CC_WEIGHTS}: downloading")
        response = urllib.request.urlopen(YOLO_CC_WEIGHTS_URL)
        with open(YOLO_CC_WEIGHTS, "wb") as fp:
            while True:
                chunk = response.read(2 ** 16)
                if not chunk:
                    break
                else:
                    fp.write(chunk)
        logger.info(f"{YOLO_CC_WEIGHTS}: downloaded")

    if os.path.exists(YOLO_OI_WEIGHTS):
        logger.info(f"{YOLO_OI_WEIGHTS}: verifying")
        sha256 = hashlib.sha256()
        with open(YOLO_OI_WEIGHTS, "rb") as fp:
            while True:
                data = fp.read(2 ** 20)
                if not data:
                    break
                sha256.update(data)
        if sha256.hexdigest() == YOLO_OI_WEIGHTS_SHA:
            logger.info(f"{YOLO_OI_WEIGHTS}: verified")
        else:
            logger.info(f"{YOLO_OI_WEIGHTS}: invalid")
            os.remove(YOLO_CC_WEIGHTS)

    if not os.path.exists(YOLO_OI_WEIGHTS):
        logger.info(f"{YOLO_OI_WEIGHTS}: downloading")
        response = urllib.request.urlopen(YOLO_OI_WEIGHTS_URL)
        with open(YOLO_OI_WEIGHTS, "wb") as fp:
            while True:
                chunk = response.read(2 ** 16)
                if not chunk:
                    break
                else:
                    fp.write(chunk)
        logger.info(f"{YOLO_OI_WEIGHTS}: downloaded")

    with open(COCO_NAMES) as fp:
        global YOLO_CC_CLASSES
        YOLO_CC_CLASSES = fp.read().strip().split("\n")

    with open(YOLO_OI_NAMES) as fp:
        global YOLO_OI_CLASSES
        YOLO_OI_CLASSES = fp.read().strip().split("\n")

    global INITIALIZED
    INITIALIZED = True


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


def identify_objects(filename, confidence=0.2):
    if not INITIALIZED:
        init()
    img = cv.imread(filename)
    outputs = [
        (o, YOLO_CC_CLASSES) for o in get_outputs(img, YOLO_CC_CFG, YOLO_CC_WEIGHTS)
    ] + [(o, YOLO_OI_CLASSES) for o in get_outputs(img, YOLO_OI_CFG, YOLO_OI_WEIGHTS)]
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


class YOLO:
    def identify_objects(self, filename, confidence=0.2):
        return identify_objects(filename, confidence)
