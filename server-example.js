/**
 * Collaborative Notepad - Socket.IO Server
 * 
 * This is a simple Node.js + Express + Socket.IO server for the collaborative notepad app.
 * Run this server locally on your laptop, then connect the web app to it.
 * 
 * Setup Instructions:
 * 1. Create a new folder for the server
 * 2. Run: npm init -y
 * 3. Run: npm install express socket.io cors
 * 4. Copy this file as server.js
 * 5. Run: node server.js
 * 6. The server will start on http://localhost:3000
 * 
 * For network access (other devices on the same WiFi):
 * - Find your laptop's local IP (e.g., 192.168.1.100)
 * - Others can connect to http://192.168.1.100:3000
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins (for local development)
app.use(cors());

const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for local development
    methods: ["GET", "POST"]
  }
});

// In-memory storage for sessions
const sessions = {};

// Helper function to generate a random 4-character code
function generateSessionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const interface = interfaces[interfaceName];
    for (const connection of interface) {
      if (connection.family === 'IPv4' && !connection.internal) {
        return connection.address;
      }
    }
  }
  return 'localhost';
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle session creation
  socket.on('create-session', (hostName) => {
    try {
      let code;
      do {
        code = generateSessionCode();
      } while (sessions[code]); // Ensure unique code

      sessions[code] = {
        users: {}
      };

      console.log(`Session created: ${code} by ${hostName}`);
      socket.emit('session-created', { code });
    } catch (error) {
      console.error('Error creating session:', error);
      socket.emit('error', 'Failed to create session');
    }
  });

  // Handle joining a session
  socket.on('join-session', ({ code, name }) => {
    try {
      if (!sessions[code]) {
        socket.emit('error', 'Session not found');
        return;
      }

      // Add user to session
      sessions[code].users[socket.id] = {
        id: socket.id,
        name: name,
        text: ''
      };

      // Join the socket room
      socket.join(code);

      console.log(`${name} (${socket.id}) joined session ${code}`);

      // Send current session state to the new user
      socket.emit('session-joined', {
        session: {
          code: code,
          users: sessions[code].users
        },
        userId: socket.id
      });

      // Notify all users in the session about the update
      io.to(code).emit('session-updated', {
        code: code,
        users: sessions[code].users
      });
    } catch (error) {
      console.error('Error joining session:', error);
      socket.emit('error', 'Failed to join session');
    }
  });

  // Handle text updates
  socket.on('update-text', ({ text }) => {
    try {
      // Find which session this user belongs to
      let userSession = null;
      for (const [code, session] of Object.entries(sessions)) {
        if (session.users[socket.id]) {
          userSession = { code, session };
          break;
        }
      }

      if (!userSession) {
        socket.emit('error', 'Not in any session');
        return;
      }

      // Update user's text
      userSession.session.users[socket.id].text = text;

      console.log(`Text updated by ${userSession.session.users[socket.id].name} in session ${userSession.code}`);

      // Broadcast the update to all users in the session
      io.to(userSession.code).emit('session-updated', {
        code: userSession.code,
        users: userSession.session.users
      });
    } catch (error) {
      console.error('Error updating text:', error);
      socket.emit('error', 'Failed to update text');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    try {
      // Remove user from all sessions
      for (const [code, session] of Object.entries(sessions)) {
        if (session.users[socket.id]) {
          const userName = session.users[socket.id].name;
          delete session.users[socket.id];
          
          console.log(`${userName} left session ${code}`);

          // If session is empty, remove it
          if (Object.keys(session.users).length === 0) {
            delete sessions[code];
            console.log(`Session ${code} removed (empty)`);
          } else {
            // Notify remaining users
            io.to(code).emit('session-updated', {
              code: code,
              users: session.users
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Collaborative Notepad Server Running',
    activeSessions: Object.keys(sessions).length,
    totalUsers: Object.values(sessions).reduce((total, session) => total + Object.keys(session.users).length, 0)
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('\n=================================');
  console.log('📝 Collaborative Notepad Server');
  console.log('=================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`📱 Network access: http://${localIP}:${PORT}`);
  console.log(`💡 Share the network URL with participants!`);
  console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});