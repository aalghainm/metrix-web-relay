const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// صفحة ويب كاملة مدمجة داخل السيرفر بدون الاعتماد على أي مجلدات أو ملفات إضافية
const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Metrix Web - مزامنة المشاريع وحصر الكميات</title>
  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; min-height: 100vh; }

    #authScreen { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1.5rem; }
    .card { background: #ffffff; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); width: 100%; max-width: 440px; text-align: center; border: 1px solid #e2e8f0; }
    .title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin-bottom: 0.25rem; }
    .subtitle { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; }
    .qr-box { position: relative; display: inline-block; padding: 1rem; background: #ffffff; border: 2px dashed #818cf8; border-radius: 1rem; margin-bottom: 1.25rem; }
    .qr-expired { position: absolute; inset: 0; background: rgba(255,255,255,0.96); display: none; flex-direction: column; align-items: center; justify-content: center; border-radius: 1rem; gap: 0.75rem; }
    .btn-refresh { padding: 0.5rem 1.25rem; background: #4f46e5; color: #fff; font-weight: 600; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem; }
    .timer { display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; }
    .timer-sec { font-weight: 700; color: #4f46e5; }

    #dashboardScreen { display: none; flex-direction: column; min-height: 100vh; }
    .header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .logo-area { display: flex; align-items: center; gap: 0.75rem; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; }
    .btn-out { padding: 0.5rem 1.25rem; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; border-radius: 0.5rem; font-weight: 600; cursor: pointer; }

    .main { flex: 1; padding: 2rem; max-width: 1200px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 1.5rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
    .stat-item { background: #ffffff; padding: 1.25rem 1.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; }
    .stat-lbl { font-size: 0.9rem; color: #64748b; font-weight: 600; }
    .stat-val { font-size: 2.2rem; font-weight: 700; margin-top: 0.25rem; }

    .table-wrap { background: #ffffff; border-radius: 1rem; border: 1px solid #e2e8f0; overflow: hidden; }
    .table-top { padding: 1rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .badge-ok { font-size: 0.8rem; background: #dcfce7; color: #15803d; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; text-align: right; font-size: 0.95rem; }
    th { background: #f8fafc; color: #475569; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; font-weight: 600; }
    td { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:hover td { background-color: #f8fafc; }
  </style>
</head>
<body>

  <div id="authScreen">
    <div class="card">
      <h1 class="title">ربط Metrix Web</h1>
      <p class="subtitle">افتح تطبيق Metrix على الهاتف وامسح الرمز ضوئياً</p>

      <div class="qr-box">
        <div id="qrcode"></div>
        <div id="qrOverlay" class="qr-expired">
          <p style="color: #e11d48; font-weight: 700;">انتهت صلاحية الرمز</p>
          <button onclick="initSession()" class="btn-refresh">تحديث الرمز</button>
        </div>
      </div>

      <div class="timer">
        <span>صلاحية الرمز:</span>
        <span id="timerText" class="timer-sec">60 ثانية</span>
      </div>
    </div>
  </div>

  <div id="dashboardScreen">
    <header class="header">
      <div class="logo-area">
        <div class="dot"></div>
        <h1>لوحة بيانات Metrix - متصل بالهاتف</h1>
      </div>
      <button onclick="logout()" class="btn-out">تسجيل الخروج</button>
    </header>

    <main class="main">
      <div class="stats">
        <div class="stat-item">
          <div class="stat-lbl">إجمالي المشاريع</div>
          <div id="projectsCount" class="stat-val" style="color: #0f172a;">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-lbl">إجمالي بنود الحصر</div>
          <div id="itemsCount" class="stat-val" style="color: #4f46e5;">0</div>
        </div>
      </div>

      <div class="table-wrap">
        <div class="table-top">
          <h2 style="font-size: 1.1rem; font-weight: 700;">بيانات المشاريع وحصر الكميات</h2>
          <span class="badge-ok">مزامنة مباشرة</span>
        </div>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>اسم المشروع</th>
                <th>اسم البند</th>
                <th>نوع العمل</th>
                <th>الكمية الإجمالية</th>
                <th>المبلغ (ر.س)</th>
              </tr>
            </thead>
            <tbody id="dataTableBody"></tbody>
          </table>
        </div>
      </div>
    </main>
  </div>

  <script>
    let socket;
    let currentSessionId = '';
    let countdownInterval;

    function initSocket() {
      socket = io();

      socket.on('connect', () => {
        if (currentSessionId) socket.emit('join_session', currentSessionId);
      });

      socket.on('authenticated', (data) => {
        clearInterval(countdownInterval);
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'flex';

        const projects = data.projects || [];
        document.getElementById('projectsCount').textContent = projects.length;

        let totalItems = 0;
        const tbody = document.getElementById('dataTableBody');
        tbody.innerHTML = '';

        if (projects.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">لا توجد مشاريع مسجلة في الهاتف</td></tr>';
          return;
        }

        projects.forEach(p => {
          const items = p.items || [];
          totalItems += items.length;

          if (items.length === 0) {
            tbody.innerHTML += '<tr><td style="font-weight:700;">' + (p.name || 'مشروع') + '</td><td colspan="4" style="color:#94a3b8;">لا توجد بنود حصر لهذا المشروع</td></tr>';
          } else {
            items.forEach(it => {
              tbody.innerHTML += '<tr>' +
                '<td style="font-weight:700;">' + (p.name || '-') + '</td>' +
                '<td>' + (it.title || it.itemName || '-') + '</td>' +
                '<td style="color:#64748b;">' + (it.jobType || '-') + '</td>' +
                '<td style="font-weight:700; color:#4f46e5; font-family:monospace; font-size:1.05rem;">' + (it.totalMeters || it.quantity || 0) + '</td>' +
                '<td style="font-weight:700; color:#059669;">' + (it.totalAmount ? Number(it.totalAmount).toLocaleString() : '0') + '</td>' +
                '</tr>';
            });
          }
        });

        document.getElementById('itemsCount').textContent = totalItems;
      });

      socket.on('session_terminated', () => logout());
    }

    function initSession() {
      currentSessionId = 'metrix_' + Math.random().toString(36).substring(2, 10) + Date.now();
      if (socket && socket.connected) {
        socket.emit('join_session', currentSessionId);
      }

      const qrContainer = document.getElementById('qrcode');
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: JSON.stringify({ type: 'METRIX_AUTH', sessionId: currentSessionId }),
        width: 220,
        height: 220,
        colorDark: "#1e293b",
        colorLight: "#ffffff"
      });

      document.getElementById('qrOverlay').style.display = 'none';
      startTimer();
    }

    function startTimer() {
      clearInterval(countdownInterval);
      let timeLeft = 60;
      const timerText = document.getElementById('timerText');
      timerText.textContent = timeLeft + ' ثانية';

      countdownInterval = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft + ' ثانية';
        if (timeLeft <= 0) {
          clearInterval(countdownInterval);
          document.getElementById('qrOverlay').style.display = 'flex';
        }
      }, 1000);
    }

    function logout() {
      if (socket && currentSessionId) {
        socket.emit('terminate_session', currentSessionId);
      }
      document.getElementById('dashboardScreen').style.display = 'none';
      document.getElementById('authScreen').style.display = 'flex';
      initSession();
    }

    window.onload = () => {
      initSocket();
      initSession();
    };
  </script>
</body>
</html>`;

// خدمة الصفحة مباشرة من السيرفر بدون مجلدات خارجية
app.get('*', (req, res) => {
  res.send(htmlContent);
});

io.on('connection', (socket) => {
  console.log('[+] متصل جديد:', socket.id);

  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
    console.log('انضمام للجلسة:', sessionId);
  });

  socket.on('send_payload', ({ sessionId, payload }) => {
    console.log('[>] تمرير البيانات للجلسة:', sessionId);
    socket.to(sessionId).emit('authenticated', payload);
  });

  socket.on('terminate_session', (sessionId) => {
    socket.to(sessionId).emit('session_terminated');
    socket.leave(sessionId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Metrix Relay Server running on port', PORT);
});
