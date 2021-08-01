import os

import cv2 as cv


def crop_image(
    filename: str, name: str, x: int, y: int, w: int, h: int, output: str = None,
) -> str:
    output = output or os.getcwd()
    base, ext = os.path.splitext(os.path.basename(filename))
    img = cv.imread(filename)
    x = max(x - 10, 0)
    y = max(y - 10, 0)
    w = max(w + 20, 1)
    h = max(h + 20, 1)
    safe = name.lower().replace(" ", "_")
    path = os.path.join(output, f"{safe}{ext}")
    cv.imwrite(path, img[y : y + h, x : x + w])
    return os.path.basename(path)


class Image:
    def crop_image(
        self,
        filename: str,
        name: str,
        x: int,
        y: int,
        w: int,
        h: int,
        output: str = None,
    ) -> str:
        return crop_image(filename, name, x, y, w, h, output)
