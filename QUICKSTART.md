# Quick Start Guide - Perl-to-ODM Dashboard

## ✅ Server is Already Running!

**The dashboard is currently accessible at: http://localhost:8000/web_dashboard/**

Just open that URL in your web browser!

---

## How to Start the Server (If Not Running)

### Option 1: Use the Start Script (Easiest)

**On Mac/Linux (from project root):**
```bash
./start_dashboard.sh
```

**On Windows:**
```cmd
start_dashboard.bat
```

The script will automatically:
- Check for Python or Node.js
- Start the web server
- Tell you the URL to open

### Option 2: Manual Start

**If you have Python 3:**
```bash
# From project root, go to web_dashboard directory
cd web_dashboard
python3 -m http.server 8000
```

**If you have Python 2:**
```bash
cd web_dashboard
python -m SimpleHTTPServer 8000
```

**If you have Node.js:**
```bash
cd web_dashboard
npx http-server -p 8000
```

## Access the Dashboard

Once the server is running, open your web browser and go to:

**http://localhost:8000**

## What You'll See

1. **Rule Comparison Tab** (default) - Compare PERL rules with ODM design
2. **Test Explorer Tab** - Browse test cases
3. **Decision Engine Tab** - Simulate ODM decisions
4. **Parity Report Tab** - View migration metrics

## Using the Rule Comparison Viewer

1. Select a rule category from the dropdown (e.g., "Underwriting Rules")
2. View PERL code on the left with syntax highlighting
3. View ODM design documentation on the right
4. Click "Copy" buttons to copy code or documentation
5. Toggle between side-by-side and stacked layouts

## Troubleshooting

### "Address already in use" Error

Another process is using port 8000. Either:
- Stop the other process
- Use a different port: `python3 -m http.server 8001`

### "No suitable web server found" Error

Install Python or Node.js:
- **Python**: https://www.python.org/downloads/
- **Node.js**: https://nodejs.org/

### 404 Errors for Rules or Test Cases

Make sure you're running the server from the `web_dashboard` directory, not the project root.

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

---

**Need more help?** See `web_dashboard/README.md` for detailed documentation.