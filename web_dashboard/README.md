# Interactive Web Dashboard

Interactive demonstration dashboard for the Perl-to-ODM migration project.

## Overview

This dashboard provides an interactive way to explore the migration from legacy Perl business rules to IBM Operational Decision Manager (ODM). It features:

- **Side-by-Side Rule Comparison**: View Perl rules alongside ODM design documentation
- **Test Case Explorer**: Browse and analyze 60 loan application test cases
- **Decision Engine Simulator**: Execute simulated ODM decisions
- **Parity Report**: Visual metrics showing migration accuracy and coverage

## Technology Stack

- **Vanilla JavaScript (ES6+)** with Web Components
- **Zero build step** - runs directly in the browser
- **CDN-hosted dependencies**:
  - Prism.js for syntax highlighting
  - Chart.js for data visualization

## Directory Structure

```
web_dashboard/
├── index.html              # Main entry point
├── app.js                  # Application controller
├── components/             # Reusable UI components
│   └── BaseComponent.js    # Base class for components
├── services/               # Data and business logic services
│   └── DataLoader.js       # Loads rules, test cases, and data
├── utils/                  # Utility functions
├── styles/                 # CSS stylesheets
│   └── main.css           # Main styles with responsive design
└── data/                   # Data directory (currently empty)
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A local web server (required for loading files via fetch API)

### Running the Dashboard

#### Option 1: Using Python (Recommended)

If you have Python 3 installed:

```bash
# Navigate to the web_dashboard directory
cd web_dashboard

# Start a simple HTTP server
python3 -m http.server 8000

# Open your browser to:
# http://localhost:8000
```

#### Option 2: Using Node.js

If you have Node.js installed:

```bash
# Install http-server globally (one time only)
npm install -g http-server

# Navigate to the web_dashboard directory
cd web_dashboard

# Start the server
http-server -p 8000

# Open your browser to:
# http://localhost:8000
```

#### Option 3: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Important Notes

- **CORS Restrictions**: The dashboard must be served via HTTP/HTTPS (not file://) to load data files
- **Data Files**: The dashboard loads data from `../legacy_perl/` directories relative to its location
- **Browser Console**: Check the browser console for loading status and any errors

## Features

### Current Implementation (Day 1 - Foundation)

✅ **Complete**:
- Directory structure
- Main HTML layout with responsive design
- Tab navigation system
- State management with observer pattern
- Base component class for reusable components
- Data loader service with caching
- Error handling and loading indicators

### Coming Soon (Days 2-3)

🚧 **In Progress**:
- Rule Viewer component (side-by-side comparison)
- Test Case Explorer component
- Decision Engine simulator
- Parity Report with visualizations

## Development

### Adding New Components

1. Create a new file in `components/` directory
2. Extend the `BaseComponent` class
3. Implement the `render()` method
4. Add lifecycle hooks as needed

Example:

```javascript
import { BaseComponent } from './BaseComponent.js';

export class MyComponent extends BaseComponent {
    render() {
        return `
            <div class="my-component">
                <h3>${this.props.title}</h3>
                <p>${this.props.content}</p>
            </div>
        `;
    }
    
    afterMount() {
        // Set up event listeners
        const button = this.$('button');
        this.addEventListener(button, 'click', () => {
            console.log('Button clicked!');
        });
    }
}
```

### State Management

The application uses an observable state pattern:

```javascript
// Subscribe to state changes
app.state.subscribe((newState, prevState) => {
    console.log('State changed:', newState);
});

// Update state
app.state.setState({ currentTab: 'test-explorer' });
```

### Styling

- CSS variables are defined in `styles/main.css` for consistent theming
- Mobile-first responsive design with breakpoints at 768px and 1024px
- Utility classes available for common patterns

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Dashboard won't load

- Ensure you're running a local web server (not opening file:// directly)
- Check browser console for errors
- Verify data files exist in `../legacy_perl/` directories

### Data not loading

- Check network tab in browser dev tools
- Verify file paths are correct relative to `web_dashboard/`
- Ensure CORS is not blocking requests

### Styling issues

- Clear browser cache
- Check that `styles/main.css` is loading correctly
- Verify CDN resources (Prism.js, Chart.js) are accessible

## Contributing

This dashboard is part of the Perl-to-ODM migration demonstration project. See the main project README for contribution guidelines.

## License

See the main project LICENSE file.