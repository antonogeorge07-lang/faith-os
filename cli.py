#!/usr/bin/env python3
import argparse
import json
import sys
import os
from compiler import ManifestCompiler, CompileError

def init_manifest(filepath):
    default_manifest = {
        "pages": {
            "default_view": {
                "app_name": "New Sovereign App",
                "headline_kpi": "0.0",
                "chart_values": [0, 0, 0]
            }
        }
    }
    if os.path.exists(filepath):
        print(f"Error: {filepath} already exists.")
        sys.exit(1)
    
    with open(filepath, 'w') as f:
        json.dump(default_manifest, f, indent=2)
    print(f"Initialized empty manifest at {filepath}")

def validate_manifest(filepath):
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found.")
        sys.exit(1)
        
    with open(filepath, 'r') as f:
        raw_data = f.read()
        
    compiler = ManifestCompiler()
    try:
        compiler.compile(raw_data)
        print(f"SUCCESS: {filepath} passed sovereign structural validation.")
    except CompileError as e:
        print(f"VALIDATION FAILED: {str(e)}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="FAITH OS Sovereign Command Line Interface")
    subparsers = parser.add_subparsers(dest="command", help="CLI Commands")
    
    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize a new runtime manifest")
    init_parser.add_argument("filename", default="manifest.json", nargs="?", help="Target filename")
    
    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate a manifest against the FAITH OS compiler contract")
    validate_parser.add_argument("filename", help="Manifest file to validate")

    args = parser.parse_args()

    if args.command == "init":
        init_manifest(args.filename)
    elif args.command == "validate":
        validate_manifest(args.filename)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
