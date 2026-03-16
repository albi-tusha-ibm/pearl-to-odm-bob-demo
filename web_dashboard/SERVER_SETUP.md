# Server Setup Instructions

## Important: Server Must Run from Project Root

The dashboard requires access to files in `legacy_perl/` and `odm_target/` directories, which are outside the `web_dashboard/` directory. Therefore, the HTTP server **must be started from the project root directory**, not from `web_dashboard/`.

## Quick Start

### Option 1: Use the Start Script (Recommended)
```bash
./start_dashboard.sh
```

The script will automatically:
- Start the server from the project root
- Open the dashboard at http://localhost:8000/web_dashboard/

### Option 2: Manual Start
```bash
# From the project root directory
python3 -m http.server 8000
```

Then open: http://localhost:8000/web_dashboard/

## File Path Configuration

The application uses the following path structure:

```
project-root/
├── web_dashboard/          # Dashboard files
│   ├── index.html         # Entry point at /web_dashboard/index.html
│   ├── app.js
│   ├── components/
│   ├── services/
│   ├── styles/
│   └── utils/
├── legacy_perl/           # PERL rules (accessed at /legacy_perl/)
│   ├── rules/
│   └── samples/
└── odm_target/            # ODM design docs (accessed at /odm_target/)
    └── design/
```

## Why This Setup?

The `DataLoader` service needs to fetch files from:
- `legacy_perl/rules/` - PERL rule files
- `legacy_perl/samples/` - Test cases and expected decisions
- `odm_target/design/` - ODM design documentation

These directories are siblings to `web_dashboard/`, so the server must run from their common parent (project root) to serve all files.

## Troubleshooting

### 404 Errors for PERL Rules or Test Cases

**Problem**: Browser console shows 404 errors for files in `legacy_perl/` or `odm_target/`

**Solution**: Make sure the server is running from the project root, not from `web_dashboard/`:
```bash
# Wrong (will cause 404s)
cd web_dashboard
python3 -m http.server 8000

# Correct
cd /path/to/perl-to-odm-bob-demo
python3 -m http.server 8000
```

### Module Import Errors

**Problem**: Browser console shows errors like "Failed to resolve module specifier"

**Solution**: Verify that all import paths in JavaScript files use the correct relative paths from the project root:
- `import { DataLoader } from './web_dashboard/services/DataLoader.js';`
- `import { RuleViewer } from './web_dashboard/components/RuleViewer.js';`

## Development Notes

- All JavaScript files use ES6 modules (`type="module"`)
- Paths in HTML and JavaScript are relative to the project root
- The server serves static files only (no backend processing)
- CORS is not an issue since all files are served from the same origin

---

**Last Updated**: March 16, 2026