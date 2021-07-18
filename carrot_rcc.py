import os
import subprocess
import sys

NODE_JS_EXECUTABLE = os.environ.get("NODE_JS_EXECUTABLE") or "node"
CARROT_RCC_EXECUTABLE = os.environ.get("CARROT_RCC_EXECUTABLE") or os.path.join(
    os.path.dirname(__file__), "carrot-rcc"
)


def main():
    args = sys.argv[1:]
    subprocess.run([NODE_JS_EXECUTABLE] + [CARROT_RCC_EXECUTABLE] + list(args))


if __name__ == "__main__":
    main()
