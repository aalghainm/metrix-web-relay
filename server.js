const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Metrix Web - لوحة التحكم الشاملة للمشاريع وحصر الكميات</title>
  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <!-- مكتبة SheetJS لتصدير Excel بجودة احترافية -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; min-height: 100vh; }

    /* شاشة تسجيل الدخول عبر الـ QR */
    #authScreen { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1.5rem; }
    .auth-card { background: #ffffff; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); width: 100%; max-width: 440px; text-align: center; border: 1px solid #e2e8f0; }
    .icon-badge { display: inline-flex; padding: 0.75rem; background: #e0e7ff; color: #4f46e5; border-radius: 9999px; margin-bottom: 0.75rem; }
    .icon-badge svg { width: 32px; height: 32px; }
    .title { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
    .subtitle { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; }
    .qr-box { position: relative; display: inline-block; padding: 1rem; background: #ffffff; border: 2px dashed #818cf8; border-radius: 1rem; margin-bottom: 1.25rem; }
    .qr-expired { position: absolute; inset: 0; background: rgba(255,255,255,0.96); display: none; flex-direction: column; align-items: center; justify-content: center; border-radius: 1rem; gap: 0.75rem; }
    .btn-refresh { padding: 0.5rem 1.25rem; background: #4f46e5; color: #fff; font-weight: 600; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem; }
    .timer { display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; }
    .timer-sec { font-weight: 700; color: #4f46e5; }

    /* لوحة التحكم الرئيسية */
    #dashboardScreen { display: none; flex-direction: column; min-height: 100vh; }
    .header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 20; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .logo-area { display: flex; align-items: center; gap: 0.75rem; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
    .header-actions { display: flex; gap: 0.75rem; align-items: center; }

    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.15rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; cursor: pointer; border: none; transition: 0.2s; }
    .btn-primary { background: #4f46e5; color: #fff; }
    .btn-primary:hover { background: #4338ca; }
    .btn-excel { background: #10b981; color: #fff; }
    .btn-excel:hover { background: #059669; }
    .btn-print { background: #0284c7; color: #fff; }
    .btn-print:hover { background: #0369a1; }
    .btn-out { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .btn-out:hover { background: #fecaca; }

    .main { flex: 1; padding: 2rem; max-width: 1300px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 1.5rem; }
    
    /* الإحصائيات */
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .stat-item { background: #ffffff; padding: 1.25rem 1.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; }
    .stat-lbl { font-size: 0.85rem; color: #64748b; font-weight: 600; }
    .stat-val { font-size: 2rem; font-weight: 800; margin-top: 0.25rem; }

    /* شريط التحكم والتصفية */
    .filter-bar { background: #ffffff; padding: 1rem 1.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; }
    .search-input { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.9rem; min-width: 280px; }
    .project-selector { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.9rem; background: #fff; }

    /* جدول البيانات */
    .table-wrap { background: #ffffff; border-radius: 1rem; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .table-top { padding: 1rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .badge-ok { font-size: 0.75rem; background: #dcfce7; color: #15803d; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600; }
    
    table { width: 100%; border-collapse: collapse; text-align: right; font-size: 0.9rem; }
    th { background: #f8fafc; color: #475569; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; font-weight: 700; white-space: nowrap; }
    td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:hover td { background-color: #f8fafc; }
    .num { font-family: monospace; font-weight: 700; color: #4f46e5; }
    .price-num { font-family: monospace; font-weight: 700; color: #059669; }

    /* أنماط الطباعة الرسمية للتقارير */
    @media print {
      body { background: #ffffff; }
      .header, .filter-bar, .header-actions, .btn, .btn-out, #authScreen { display: none !important; }
      #dashboardScreen { display: block !important; }
      .main { max-width: 100% !important; padding: 0 !important; }
      .table-wrap { border: 1px solid #000; box-shadow: none; border-radius: 0; }
      th, td { border: 1px solid #cbd5e1 !important; padding: 6px 10px !important; }
      .print-header { display: block !important; margin-bottom: 1.5rem; border-bottom: 2px solid #0f172a; padding-bottom: 1rem; }
    }
    .print-header { display: none; text-align: center; }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.1); }
    }
  </style>
</head>
<body>

  <!-- شاشة المصادقة عبر الـ QR -->
  <div id="authScreen">
    <div class="auth-card">
      <div class="icon-badge">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
      </div>
      <h1 class="title">ربط Metrix Web</h1>
      <p class="subtitle">افتح تطبيق Metrix على الهاتف وامسح الرمز ضوئياً للتحكم الكامل</p>

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

  <!-- لوحة التحكم الكاملة -->
  <div id="dashboardScreen">
    <header class="header">
      <div class="logo-area">
        <div class="dot"></div>
        <h1>لوحة بيانات Metrix - متصل بالهاتف</h1>
      </div>
      <div class="header-actions">
        <button onclick="printReport()" class="btn btn-print">
          🖨️ طباعة التقرير (PDF)
        </button>
        <button onclick="exportToExcel()" class="btn btn-excel">
          📊 تصدير Excel
        </button>
        <button onclick="logout()" class="btn btn-out">
          تسجيل الخروج
        </button>
      </div>
    </header>

    <main class="main">
      <!-- ترويسة خاصة بالطباعة الورقية فقط -->
      <div class="print-header">
        <h1 style="font-size: 1.8rem; font-weight: 800;">تقرير حصر الكميات والمشاريع - تطبيق Metrix</h1>
        <p style="color: #475569; font-size: 0.95rem; margin-top: 4px;">تاريخ الطباعة: <span id="printDate"></span></p>
      </div>

      <!-- الإحصائيات المالية والحصر -->
      <div class="stats">
        <div class="stat-item">
          <div class="stat-lbl">إجمالي المشاريع</div>
          <div id="projectsCount" class="stat-val" style="color: #0f172a;">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-lbl">إجمالي بنود الحصر</div>
          <div id="itemsCount" class="stat-val" style="color: #4f46e5;">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-lbl">إجمالي الأمتار / الكميات</div>
          <div id="totalMetersSum" class="stat-val" style="color: #0284c7;">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-lbl">إجمالي المبالغ التقديرية</div>
          <div id="totalAmountSum" class="stat-val" style="color: #059669;">0 ر.س</div>
        </div>
      </div>

      <!-- شريط البحث والتصفية -->
      <div class="filter-bar">
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <input type="text" id="searchInput" oninput="applyFilters()" placeholder="🔍 ابحث عن اسم مشروع، بند، نوع عمل..." class="search-input" />
          <select id="projectFilter" onchange="applyFilters()" class="project-selector">
            <option value="ALL">جميع المشاريع</option>
          </select>
        </div>
        <div style="font-size: 0.85rem; color: #64748b;">
          عدد البنود المعروضة: <span id="displayedCount" style="font-weight: 700; color: #0f172a;">0</span>
        </div>
      </div>

      <!-- جدول البيانات التفصيلي -->
      <div class="table-wrap">
        <div class="table-top">
          <h2 style="font-size: 1.1rem; font-weight: 700;">تفاصيل بنود الحصر والقياسات</h2>
          <span class="badge-ok">مزامنة حية من الهاتف</span>
        </div>
        <div style="overflow-x: auto;">
          <table id="projectsTable">
            <thead>
              <tr>
                <th>اسم المشروع</th>
                <th>اسم البند</th>
                <th>نوع العمل</th>
                <th>الأبعاد (طول × عرض × ارتفاع)</th>
                <th>الكمية الإجمالية</th>
                <th>السعر للمتر</th>
                <th>المبلغ الإجمالي</th>
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
    let globalProjectsData = [];

    function initSocket() {
      socket = io();

      socket.on('connect', () => {
        if (currentSessionId) socket.emit('join_session', currentSessionId);
      });

      socket.on('authenticated', (data) => {
        clearInterval(countdownInterval);
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'flex';

        globalProjectsData = data.projects || [];
        populateProjectFilter(globalProjectsData);
        renderTableAndStats(globalProjectsData);
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

    function populateProjectFilter(projects) {
      const select = document.getElementById('projectFilter');
      select.innerHTML = '<option value="ALL">جميع المشاريع</option>';
      projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id || p.name;
        opt.textContent = p.name || 'مشروع بدون اسم';
        select.appendChild(opt);
      });
    }

    function renderTableAndStats(projects) {
      document.getElementById('projectsCount').textContent = projects.length;

      let totalItems = 0;
      let sumMeters = 0;
      let sumAmount = 0;
      const tbody = document.getElementById('dataTableBody');
      tbody.innerHTML = '';

      const query = (document.getElementById('searchInput').value || '').trim().toLowerCase();
      const selectedProj = document.getElementById('projectFilter').value;

      let rowCount = 0;

      projects.forEach(p => {
        if (selectedProj !== 'ALL' && String(p.id || p.name) !== selectedProj) return;

        const items = p.items || [];
        totalItems += items.length;

        items.forEach(it => {
          const meters = Number(it.totalMeters || it.quantity || 0);
          const amount = Number(it.totalAmount || 0);
          sumMeters += meters;
          sumAmount += amount;

          // تصفية البحث
          const searchStr = (p.name + ' ' + (it.title || it.itemName || '') + ' ' + (it.jobType || '')).toLowerCase();
          if (query && !searchStr.includes(query)) return;

          rowCount++;
          const dim = it.length ? (it.length + ' × ' + (it.width || '-') + ' × ' + (it.height || '-')) : '-';
          const price = it.pricePerMeter ? Number(it.pricePerMeter).toLocaleString() + ' ر.س' : '-';

          tbody.innerHTML += '<tr>' +
            '<td style="font-weight:700; color:#0f172a;">' + (p.name || '-') + '</td>' +
            '<td style="font-weight:600;">' + (it.title || it.itemName || '-') + '</td>' +
            '<td><span style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:0.85rem;">' + (it.jobType || '-') + '</span></td>' +
            '<td style="color:#64748b; font-family:monospace;">' + dim + '</td>' +
            '<td class="num">' + meters.toLocaleString() + '</td>' +
            '<td style="color:#64748b;">' + price + '</td>' +
            '<td class="price-num">' + amount.toLocaleString() + ' ر.س</td>' +
            '</tr>';
        });
      });

      if (rowCount === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:2.5rem;">لا توجد بيانات مطابقة لخيارات البحث</td></tr>';
      }

      document.getElementById('itemsCount').textContent = totalItems;
      document.getElementById('totalMetersSum').textContent = sumMeters.toLocaleString();
      document.getElementById('totalAmountSum').textContent = sumAmount.toLocaleString() + ' ر.س';
      document.getElementById('displayedCount').textContent = rowCount;
    }

    function applyFilters() {
      renderTableAndStats(globalProjectsData);
    }

    function printReport() {
      document.getElementById('printDate').textContent = new Date().toLocaleDateString('ar-SA', { dateStyle: 'full' });
      window.print();
    }

    function exportToExcel() {
      if (!globalProjectsData || globalProjectsData.length === 0) {
        alert('لا توجد بيانات مشاريع لتصديرها!');
        return;
      }

      const rows = [];
      rows.push(['اسم المشروع', 'العميل', 'رقم الهاتف', 'اسم البند', 'نوع العمل', 'طريقة الحساب', 'الطول', 'العرض', 'الارتفاع', 'الكمية الإجمالية', 'سعر المتر', 'المبلغ الإجمالي']);

      globalProjectsData.forEach(p => {
        const items = p.items || [];
        items.forEach(it => {
          rows.push([
            p.name || '',
            p.clientName || '',
            p.mobileNumber || '',
            it.title || it.itemName || '',
            it.jobType || '',
            it.calcMode || '',
            it.length || '',
            it.width || '',
            it.height || '',
            it.totalMeters || it.quantity || 0,
            it.pricePerMeter || 0,
            it.totalAmount || 0
          ]);
        });
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!dir'] = 'rtl'; // ضبط الاتجاه من اليمين لليسار في الإكسل
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "حصر الكميات");
      XLSX.writeFile(wb, "تقرير_حصر_الكميات_Metrix_" + Date.now() + ".xlsx");
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

app.get('*', (req, res) => {
  res.send(htmlContent);
});

io.on('connection', (socket) => {
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
  });

  socket.on('send_payload', ({ sessionId, payload }) => {
    io.to(sessionId).emit('authenticated', payload);
  });

  socket.on('terminate_session', (sessionId) => {
    socket.to(sessionId).emit('session_terminated');
    socket.leave(sessionId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log('Metrix Pro Relay Server running on port', PORT);
});
