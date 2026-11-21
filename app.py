"""Shortcut: lets you run `python app.py` from this folder. The real server is in backend/app.py"""
import os
import runpy
import sys

target = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "app.py")
sys.argv[0] = target
runpy.run_path(target, run_name="__main__")
