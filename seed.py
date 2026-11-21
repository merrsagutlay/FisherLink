"""Shortcut: lets you run `python seed.py` from this folder. The real script is backend/seed.py"""
import os
import runpy
import sys

target = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "seed.py")
sys.argv[0] = target
runpy.run_path(target, run_name="__main__")
