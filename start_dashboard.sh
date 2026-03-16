#!/bin/bash

# Quick-start script for the Interactive Web Dashboard
# Perl-to-ODM Migration Demo

echo "=========================================="
echo "  Perl-to-ODM Interactive Dashboard"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "web_dashboard" ]; then
    echo "Error: web_dashboard directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Navigate to web_dashboard directory
cd web_dashboard

echo "Starting local web server..."
echo ""

# Try Python 3 first
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP server"
    echo "Dashboard will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
# Try Python 2 as fallback
elif command -v python &> /dev/null; then
    echo "Using Python 2 HTTP server"
    echo "Dashboard will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8000
# Try Node.js http-server
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server"
    echo "Dashboard will be available at: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    npx http-server -p 8000
else
    echo "Error: No suitable web server found!"
    echo ""
    echo "Please install one of the following:"
    echo "  - Python 3: https://www.python.org/downloads/"
    echo "  - Node.js: https://nodejs.org/"
    echo ""
    echo "Or use VS Code Live Server extension:"
    echo "  1. Install 'Live Server' extension in VS Code"
    echo "  2. Right-click on web_dashboard/index.html"
    echo "  3. Select 'Open with Live Server'"
    exit 1
fi

# Made with Bob
