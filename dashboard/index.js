const fs = require('fs-extra');
const path = require('path');

// Ensure the dashboard directory structure exists
function ensureDashboardStructure() {
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
}

// Initialize the dashboard
function initializeDashboard() {
    try {
        ensureDashboardStructure();
        const server = require('./server');
        server.initialize();
        return true;
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        return false;
    }
}

module.exports = {
    initialize: initializeDashboard
};
