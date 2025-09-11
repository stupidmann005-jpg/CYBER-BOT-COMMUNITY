const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs-extra');

let app;
let server;
let isRunning = false;
const port = process.env.PORT || 3000;
let dashboardUrl = null;

// Store messages for display
const liveMessages = [];
const MAX_MESSAGES = 100;

// Initialize the dashboard server
function initialize() {
    if (isRunning) {
        console.log('Dashboard server is already running');
        return;
    }
    
    console.log('Initializing dashboard server...');
    app = express();
    server = http.createServer(app);
    
    // Serve static files
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json());
    
    // Configure routes
    setupRoutes();
    
    // Add sample message for testing
    addMessage({
        senderID: 'sample1',
        senderName: 'Sample User',
        threadID: '123456789',
        threadName: 'Sample Group',
        body: 'This is a sample message for testing the dashboard',
        timestamp: Date.now()
    });
    
    // Start server
    server.listen(port, () => {
        isRunning = true;
        dashboardUrl = `http://localhost:${port}`;
        console.log(`Dashboard server running on port ${port}`);
        console.log(`Dashboard URL: ${dashboardUrl}`);
    });
}

// Stop the dashboard server
function stop() {
    if (!isRunning || !server) return;
    
    server.close();
    isRunning = false;
    dashboardUrl = null;
    console.log('Dashboard server stopped');
}

// Setup API routes
function setupRoutes() {
    console.log('Setting up dashboard routes...');
    
    // Main dashboard page
    app.get('/', (req, res) => {
        console.log('Serving dashboard main page');
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // API to get all groups
    app.get('/api/groups', (req, res) => {
        try {
            console.log('Fetching all groups data');
            
            // For testing, create sample groups
            const groups = [
                {
                    threadID: '123456789',
                    name: 'Sample Group 1',
                    memberCount: 25,
                    adminIDs: ['admin1', 'admin2'],
                    image: '',
                    members: {
                        'user1': { name: 'User One', gender: 'MALE' },
                        'user2': { name: 'User Two', gender: 'FEMALE' }
                    }
                },
                {
                    threadID: '987654321',
                    name: 'Sample Group 2',
                    memberCount: 15,
                    adminIDs: ['admin3'],
                    image: '',
                    members: {
                        'user3': { name: 'User Three', gender: 'MALE' },
                        'user4': { name: 'User Four', gender: 'FEMALE' }
                    }
                }
            ];
            
            console.log(`Returning ${groups.length} groups`);
            res.json({
                success: true,
                data: groups
            });
        } catch (error) {
            console.error('Error fetching groups:', error);
            res.json({
                success: false,
                error: error.message
            });
        }
    });
    
    // API to get specific group details
    app.get('/api/groups/:threadID', (req, res) => {
        try {
            const threadID = req.params.threadID;
            console.log(`Fetching details for group: ${threadID}`);
            
            // For testing, return sample data
            if (threadID === '123456789') {
                return res.json({
                    success: true,
                    data: {
                        threadID: '123456789',
                        name: 'Sample Group 1',
                        memberCount: 25,
                        adminIDs: ['admin1', 'admin2'],
                        image: '',
                        members: {
                            'user1': { name: 'User One', gender: 'MALE' },
                            'user2': { name: 'User Two', gender: 'FEMALE' }
                        }
                    }
                });
            } else if (threadID === '987654321') {
                return res.json({
                    success: true,
                    data: {
                        threadID: '987654321',
                        name: 'Sample Group 2',
                        memberCount: 15,
                        adminIDs: ['admin3'],
                        image: '',
                        members: {
                            'user3': { name: 'User Three', gender: 'MALE' },
                            'user4': { name: 'User Four', gender: 'FEMALE' }
                        }
                    }
                });
            }
            
            console.log(`Group not found: ${threadID}`);
            return res.json({
                success: false,
                error: 'Group not found'
            });
        } catch (error) {
            console.error(`Error fetching group ${req.params.threadID}:`, error);
            res.json({
                success: false,
                error: error.message
            });
        }
    });
    
    // API to get live messages
    app.get('/api/messages', (req, res) => {
        console.log(`Returning ${liveMessages.length} messages`);
        res.json({
            success: true,
            data: liveMessages
        });
    });
}

// Add a new message to the live messages array
function addMessage(message) {
    console.log('Adding new message to dashboard:', message.body);
    liveMessages.unshift(message);
    if (liveMessages.length > MAX_MESSAGES) {
        liveMessages.pop();
    }
}

// Get the dashboard URL
function getDashboardUrl() {
    if (!isRunning) return null;
    return dashboardUrl;
}

module.exports = {
    initialize,
    stop,
    getDashboardUrl,
    addMessage
};