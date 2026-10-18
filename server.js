const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// خدمة ملفات واجهة الويب
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log(`[+] متصل جديد: ${socket.id}`);

  // انضمام لغرفة الجلسة
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} انضم إلى الجلسة: ${sessionId}`);
  });

  // تمرير البيانات فوراً من الهاتف إلى المتصفح دون تخزين
  socket.on('send_payload', ({ sessionId, payload }) => {
    console.log(`[>] تمرير بيانات للجلسة: ${sessionId}`);
    socket.to(sessionId).emit('authenticated', payload);
  });

  // إنهاء الجلسة
  socket.on('terminate_session', (sessionId) => {
    socket.to(sessionId).emit('session_terminated');
    socket.leave(sessionId);
  });

  socket.on('disconnect', () => {
    console.log(`[-] مفصول: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Metrix Relay Server is running on port ${PORT}`);
});
