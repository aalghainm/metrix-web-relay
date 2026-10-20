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

function parseUserAgentInfo(uaString) {
  const ua = String(uaString || '');
  let browser = 'متصفح ويب';
  let browserCode = 'WEB';
  if (ua.includes('Edg/')) {
    browser = 'Microsoft Edge';
    browserCode = 'EDGE';
  } else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browser = 'Opera';
    browserCode = 'OPERA';
  } else if (ua.includes('Brave')) {
    browser = 'Brave Browser';
    browserCode = 'BRAVE';
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    browser = 'Google Chrome';
    browserCode = 'CHROME';
  } else if (ua.includes('Firefox/')) {
    browser = 'Mozilla Firefox';
    browserCode = 'FIREFOX';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    browser = 'Apple Safari';
    browserCode = 'SAFARI';
  }

  let os = 'الكمبيوتر';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return {
    browser,
    browserCode,
    os,
    label: `${browser} (${os})`
  };
}

function getOrCreateSession(sessionId) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, {
      payload: null,
      pendingCommands: [],
      phoneSockets: new Set(),
      clientInfo: null
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
    const s = getOrCreateSession(sessionId);

    if (typeof arg === 'object' && arg && arg.role === 'phone') {
      s.phoneSockets.add(socket.id);
    } else {
      const ua = (socket.handshake && socket.handshake.headers) ? socket.handshake.headers['user-agent'] : '';
      const detected = parseUserAgentInfo(ua);
      s.clientInfo = (typeof arg === 'object' && arg && arg.clientInfo) ? Object.assign({}, detected, arg.clientInfo) : detected;
      
      // إذا كان الهاتف قد أرسل البيانات مسبقاً قبل انضمام صفحة الويب، نرسلها للمتصفح فوراً
      if (s.payload) {
        socket.emit('authenticated', s.payload);
      }
    }
  });

  socket.on('register_phone', (sessionId) => {
    if (!sessionId) return;
    const s = getOrCreateSession(sessionId);
    s.phoneSockets.add(socket.id);
    if (s.clientInfo) {
      socket.emit('client_device_info', Object.assign({ sessionId }, s.clientInfo));
    }
  });

  socket.on('send_payload', ({ sessionId, payload }) => {
    if (!sessionId) return;
    const s = getOrCreateSession(sessionId);
    s.phoneSockets.add(socket.id);
    if (s.clientInfo) {
      socket.emit('client_device_info', Object.assign({ sessionId }, s.clientInfo));
    }
    
    // حفظ البيانات وبثها فوراً وبشكل مؤكد للمتصفح
    s.payload = payload;
    io.to(sessionId).emit('authenticated', payload);

    if (s.pendingCommands.length > 0) {
      const cmds = s.pendingCommands.splice(0, s.pendingCommands.length);
      cmds.forEach(cmd => {
        socket.emit(cmd.action, cmd.data);
      });
    }
  });

  socket.on('check_auth_status', (sessionId) => {
    if (!sessionId) return;
    const s = sessionStore.get(sessionId);
    if (s && s.payload) {
      socket.emit('authenticated', s.payload);
    }
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
    io.to(sessionId).emit('session_terminated', { sessionId });
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