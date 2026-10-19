const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const sessionStore = new Map();

function getOrCreateSession(sessionId) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      payload: null,
      pendingCommands: [],
      phoneSockets: new Set()
    });
  }
  return sessionStore.get(sessionId);
}

io.on('connection', (socket) => {
  socket.on('join_session', (arg) => {
    const sessionId = typeof arg === 'string' ? arg : (arg && arg.sessionId ? arg.sessionId : '');
    if (!sessionId) return;
    socket.join(sessionId);
    socket.data.sessionId = sessionId;
    if (typeof arg === 'object' && arg && arg.role === 'phone') {
      const s = getOrCreateSession(sessionId);
      s.phoneSockets.add(socket.id);
    }
  });

  socket.on('send_payload', ({ sessionId, payload }) => {
    if (!sessionId) return;
    const s = getOrCreateSession(sessionId);
    s.phoneSockets.add(socket.id);
    if (s.pendingCommands.length > 0) {
      const cmds = s.pendingCommands.splice(0, s.pendingCommands.length);
      cmds.forEach(cmd => {
        socket.emit(cmd.action, cmd.data);
      });
      return;
    }
    s.payload = payload;
    io.to(sessionId).emit('authenticated', payload);
  });

  socket.on('relay_to_phone', ({ sessionId, action, data }) => {
    if (!sessionId || !action) return;
    const s = getOrCreateSession(sessionId);

    if (action === 'request_sync') {
      if (s.phoneSockets.size > 0) {
        io.to(sessionId).emit(action, data);
      } else if (s.payload) {
        socket.emit('authenticated', s.payload);
      }
      return;
    }

    if (action !== 'security_error' && s.phoneSockets.size === 0) {
      s.pendingCommands.push({ action, data });
      if (s.pendingCommands.length > 100) s.pendingCommands.shift();
    }

    io.to(sessionId).emit(action, data);
  });

  socket.on('terminate_session', (sessionId) => {
    if (!sessionId) return;
    sessionStore.delete(sessionId);
    socket.to(sessionId).emit('session_terminated');
    socket.leave(sessionId);
  });

  socket.on('disconnect', () => {
    const sessionId = socket.data.sessionId;
    if (sessionId && sessionStore.has(sessionId)) {
      const s = sessionStore.get(sessionId);
      s.phoneSockets.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Metrix Pro Enterprise Server running on port', PORT);
});