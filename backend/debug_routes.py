
import sys
import os

# Add backend directory to path so we can import main
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

def print_routes():
    print("Registered Routes:")
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"{route.methods} {route.path}")
        else:
            print(str(route))

if __name__ == "__main__":
    print_routes()
