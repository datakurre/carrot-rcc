import os
import subprocess
import sys

NODE_JS_EXECUTABLE = os.environ.get("NODE_JS_EXECUTABLE") or "node"
CAMUNDA_ROBOT_BRIDGE_BUNDLE = os.environ.get(
    "CAMUNDA_ROBOT_BRIDGE_BUNDLE"
) or os.path.join(os.path.dirname(__file__), "index.js")


def main():
    print("Hello World!")
#    args = sys.argv[1:]
#    subprocess.run([NODE_JS_EXECUTABLE] + list(args) + [CAMUNDA_ROBOT_BRIDGE_BUNDLE])


if __name__ == "__main__":
    main()
