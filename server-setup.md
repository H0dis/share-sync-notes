# Collaborative Notepad Server Setup

This guide will help you set up the Socket.IO server for the collaborative notepad app.

## Quick Setup

1. **Create a new folder for the server:**
   ```bash
   mkdir notepad-server
   cd notepad-server
   ```

2. **Initialize a new Node.js project:**
   ```bash
   npm init -y
   ```

3. **Install required dependencies:**
   ```bash
   npm install express socket.io cors
   ```

4. **Copy the server code:**
   - Copy the contents of `server-example.js` to a new file called `server.js`

5. **Start the server:**
   ```bash
   node server.js
   ```

6. **Connect from the web app:**
   - The server will display the local and network URLs
   - Use the network URL (e.g., `http://192.168.1.100:3000`) in the web app for multi-device access

## Network Setup

### For Local Development (Same Computer)
- Use: `http://localhost:3000`

### For Multi-Device Collaboration (Same WiFi Network)
- The server will automatically detect and display your local IP
- Share the network URL (e.g., `http://192.168.1.100:3000`) with participants
- Make sure all devices are on the same WiFi network

## Troubleshooting

### Connection Issues
- Ensure the server is running and accessible
- Check that devices are on the same WiFi network
- Verify firewall settings aren't blocking the connection
- Try using the exact IP address shown when the server starts

### Finding Your Local IP Manually
**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**On Mac/Linux:**
```bash
ifconfig
```
Look for the IP address under your active network interface (usually starts with 192.168.x.x or 10.x.x.x).

## Features

- ✅ Real-time collaboration
- ✅ Automatic session cleanup
- ✅ 4-character session codes
- ✅ User management
- ✅ Cross-platform support
- ✅ No database required (in-memory storage)

## Production Notes

This server is designed for local/conference room use. For production deployment:
- Add authentication
- Use a proper database
- Implement rate limiting
- Add HTTPS support
- Add proper error handling and logging