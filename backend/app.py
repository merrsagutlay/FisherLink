# BACKEND
"""Entry point: python app.py [port]"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.db import init_db  # noqa: E402
from presentation.api import make_server  # noqa: E402

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    init_db()
    try:
        server = make_server("127.0.0.1", port)
    except OSError:
        print("\nPort %d is already in use (FishMatch may already be running in another window)." % port)
        print("Close that window, or use another port:  python app.py %d" % (port + 1))
        sys.exit(1)
    print("FishMatch running at http://127.0.0.1:%d  (Ctrl+C to stop)" % port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
