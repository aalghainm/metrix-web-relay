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
  <title>Metrix Pro Desktop - المنصة السحابية المتكاملة للمشاريع وحصر الكميات</title>
  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
    body { background-color: #f1f5f9; color: #1e293b; min-height: 100vh; overflow-x: hidden; }

    /* Auth Screen (QR Login) */
    #authScreen { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1.5rem; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); }
    .auth-card { background: #ffffff; padding: 2.75rem 2.25rem; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.35); width: 100%; max-width: 450px; text-align: center; }
    .auth-icon { width: 56px; height: 56px; background: #e0e7ff; color: #4338ca; border-radius: 1rem; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .auth-title { font-size: 1.7rem; font-weight: 800; color: #0f172a; margin-bottom: 0.35rem; }
    .auth-desc { font-size: 0.9rem; color: #64748b; margin-bottom: 1.75rem; line-height: 1.5; }
    .qr-container { position: relative; display: inline-block; padding: 1rem; background: #ffffff; border: 2px dashed #6366f1; border-radius: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 4px 12px rgba(99,102,241,0.08); }
    .qr-expired-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.96); display: none; flex-direction: column; align-items: center; justify-content: center; border-radius: 1.25rem; gap: 0.75rem; }
    .btn-refresh-qr { padding: 0.6rem 1.4rem; background: #4f46e5; color: #fff; font-weight: 700; border: none; border-radius: 0.6rem; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
    .btn-refresh-qr:hover { background: #4338ca; }
    .auth-timer-bar { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #64748b; padding: 0.4rem 0.5rem; background: #f8fafc; border-radius: 0.5rem; }
    .timer-badge { font-weight: 800; color: #4f46e5; }

    /* Dashboard Layout */
    #dashboardScreen { display: none; flex-direction: column; min-height: 100vh; }
    .top-navbar { background: #ffffff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 40; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
    .top-navbar-inner { max-width: 1400px; margin: 0 auto; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .brand-logo { display: flex; align-items: center; gap: 0.75rem; }
    .live-dot { width: 10px; height: 10px; border-radius: 50%; background: #10b981; animation: pulseDot 2s infinite; }
    .brand-title { font-size: 1.35rem; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .brand-badge { font-size: 0.75rem; background: #e0e7ff; color: #4338ca; padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 700; }

    /* Nav Tabs */
    .tabs-nav { display: flex; gap: 0.35rem; background: #f1f5f9; padding: 0.3rem; border-radius: 0.75rem; }
    .tab-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border: none; background: transparent; color: #64748b; font-size: 0.88rem; font-weight: 700; border-radius: 0.55rem; cursor: pointer; transition: 0.15s; }
    .tab-btn:hover { color: #0f172a; background: rgba(255,255,255,0.6); }
    .tab-btn.active { background: #ffffff; color: #4f46e5; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

    /* Global Buttons */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 0.55rem; font-weight: 700; font-size: 0.85rem; cursor: pointer; border: none; transition: 0.2s; text-decoration: none; }
    .btn-indigo { background: #4f46e5; color: #fff; }
    .btn-indigo:hover { background: #4338ca; }
    .btn-emerald { background: #059669; color: #fff; }
    .btn-emerald:hover { background: #047857; }
    .btn-sky { background: #0284c7; color: #fff; }
    .btn-sky:hover { background: #0369a1; }
    .btn-amber { background: #d97706; color: #fff; }
    .btn-amber:hover { background: #b45309; }
    .btn-danger { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .btn-danger:hover { background: #fecaca; }
    .btn-gray { background: #e2e8f0; color: #475569; }
    .btn-gray:hover { background: #cbd5e1; }
    .btn-del-sm { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.15rem; padding: 4px 8px; border-radius: 6px; transition: 0.15s; }
    .btn-del-sm:hover { background: #fee2e2; }
    .btn-edit-sm { background: none; border: none; color: #4f46e5; cursor: pointer; font-size: 1.15rem; padding: 4px 8px; border-radius: 6px; transition: 0.15s; }
    .btn-edit-sm:hover { background: #e0e7ff; }

    /* Main Container & Tab Panes */
    .app-main { flex: 1; padding: 1.75rem; max-width: 1400px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 1.5rem; }
    .tab-content { display: none; flex-direction: column; gap: 1.5rem; }
    .tab-content.active { display: flex; }

    /* Summary Stats Cards */
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .stat-card { background: #ffffff; padding: 1.25rem 1.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 0.35rem; }
    .stat-title { font-size: 0.85rem; color: #64748b; font-weight: 700; }
    .stat-figure { font-size: 1.85rem; font-weight: 900; line-height: 1.2; }
    .stat-desc { font-size: 0.78rem; color: #94a3b8; }

    /* Card Panels & Tables */
    .panel-card { background: #ffffff; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); overflow: hidden; }
    .panel-header { padding: 1rem 1.5rem; background: #ffffff; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
    .panel-header-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
    .panel-body { padding: 1.25rem 1.5rem; }

    .filter-strip { background: #ffffff; padding: 0.85rem 1.25rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; }
    .search-box { padding: 0.5rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.88rem; min-width: 260px; outline: none; }
    .search-box:focus { border-color: #6366f1; }
    .select-box { padding: 0.5rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.88rem; background: #fff; outline: none; }
    .select-box:focus { border-color: #6366f1; }

    /* Tables */
    .table-container { overflow-x: auto; width: 100%; }
    table.data-table { width: 100%; border-collapse: collapse; text-align: right; font-size: 0.88rem; }
    table.data-table th { background: #f8fafc; color: #475569; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; font-weight: 800; white-space: nowrap; }
    table.data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    table.data-table tr:hover td { background: #f8fafc; }
    .tag-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
    .tag-blue { background: #e0f2fe; color: #0284c7; }
    .tag-indigo { background: #e0e7ff; color: #4338ca; }
    .tag-green { background: #dcfce7; color: #15803d; }
    .tag-amber { background: #fef3c7; color: #b45309; }

    /* Projects Grid Cards View */
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
    .proj-card { background: #ffffff; border-radius: 1rem; border: 1px solid #e2e8f0; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02); display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; transition: transform 0.15s, box-shadow 0.15s; }
    .proj-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05); }
    .proj-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .proj-name { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
    .proj-client { font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 0.35rem; }
    .proj-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: #f8fafc; padding: 0.75rem; border-radius: 0.6rem; }
    .metric-sub { font-size: 0.75rem; color: #64748b; font-weight: 600; }
    .metric-val { font-size: 1rem; font-weight: 800; color: #0f172a; }
    .proj-card-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }

    /* Quotation Preview Document */
    .quotation-paper { background: #ffffff; padding: 2.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; max-width: 900px; margin: 0 auto; width: 100%; box-shadow: 0 4px 15px rgba(0,0,0,0.04); }
    .quote-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
    .quote-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 0.75rem; }
    .quote-party-box h4 { font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .quote-party-box p { font-size: 0.85rem; color: #475569; line-height: 1.6; }
    .quote-totals { margin-top: 1.5rem; margin-right: auto; width: 320px; display: flex; flex-direction: column; gap: 0.5rem; }
    .quote-total-row { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.35rem 0; border-bottom: 1px dashed #cbd5e1; }
    .quote-total-grand { font-size: 1.15rem; font-weight: 900; color: #4f46e5; border-top: 2px solid #0f172a; border-bottom: none; padding-top: 0.5rem; }
    .quote-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; text-align: center; }
    .sig-line { margin-top: 3.5rem; border-top: 1px dashed #94a3b8; padding-top: 0.5rem; font-size: 0.85rem; color: #64748b; font-weight: 700; }

    /* Modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 100; padding: 1.5rem; }
    .modal-box { background: #ffffff; border-radius: 1.25rem; width: 100%; max-width: 580px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #e2e8f0; overflow: hidden; animation: popUp 0.18s ease-out; }
    .modal-head { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-head h3 { font-size: 1.2rem; font-weight: 800; color: #0f172a; }
    .modal-close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; line-height: 1; }
    .modal-close-btn:hover { color: #0f172a; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; max-height: 75vh; overflow-y: auto; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-label { font-size: 0.85rem; font-weight: 700; color: #475569; }
    .form-input { padding: 0.6rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.9rem; outline: none; transition: border-color 0.15s; }
    .form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .modal-footer { padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.75rem; }

    @keyframes popUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes pulseDot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(1.15); }
    }

    /* Print Stylesheet */
    @media print {
      body { background: #fff !important; }
      .top-navbar, .filter-strip, .btn, .btn-del-sm, .btn-edit-sm, #authScreen, .tabs-nav, .panel-header button { display: none !important; }
      #dashboardScreen { display: block !important; }
      .app-main { max-width: 100% !important; padding: 0 !important; }
      .tab-content { display: none !important; }
      .tab-content.active { display: block !important; }
      .quotation-paper { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
      .panel-card { border: none !important; box-shadow: none !important; }
      table.data-table th, table.data-table td { border: 1px solid #000 !important; color: #000 !important; }
      .print-only-header { display: block !important; }
    }
    .print-only-header { display: none; text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid #000; padding-bottom: 0.75rem; }
  </style>
</head>
<body>

  <!-- شاشة المصادقة عبر QR -->
  <div id="authScreen">
    <div class="auth-card">
      <div class="auth-icon">
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
      </div>
      <h1 class="auth-title">منصة Metrix Web</h1>
      <p class="auth-desc">امسح الرمز ضوئياً من قائمة التطبيق بالهاتف [ربط المتصفح] للتحكم الكامل المباشر في مشاريعك وحساباتك.</p>

      <div class="qr-container">
        <div id="qrcode"></div>
        <div id="qrOverlay" class="qr-expired-overlay">
          <p style="color: #e11d48; font-weight: 800; font-size: 0.95rem;">انتهت صلاحية الرمز</p>
          <button onclick="initSession()" class="btn-refresh-qr">تحديث الرمز 🔄</button>
        </div>
      </div>

      <div class="auth-timer-bar">
        <span>صلاحية الرمز المؤقت:</span>
        <span id="timerText" class="timer-badge">60 ثانية</span>
      </div>
    </div>
  </div>

  <!-- لوحة التحكم الكاملة لسطح المكتب -->
  <div id="dashboardScreen">
    <header class="top-navbar">
      <div class="top-navbar-inner">
        <div class="brand-logo">
          <div class="live-dot"></div>
          <span class="brand-title">Metrix Pro</span>
          <span class="brand-badge">متصل بالهاتف مباشر</span>
        </div>

        <!-- أزرار التبويبات الرئيسية للنظام بالكامل -->
        <div class="tabs-nav">
          <button onclick="switchTab('tabProjects')" id="btnTabProjects" class="tab-btn active">
            🏢 المشاريع
          </button>
          <button onclick="switchTab('tabItems')" id="btnTabItems" class="tab-btn">
            📐 حصر الكميات
          </button>
          <button onclick="switchTab('tabPayments')" id="btnTabPayments" class="tab-btn">
            💰 الدفعات والمالية
          </button>
          <button onclick="switchTab('tabQuotations')" id="btnTabQuotations" class="tab-btn">
            📄 عروض الأسعار
          </button>
          <button onclick="switchTab('tabPrices')" id="btnTabPrices" class="tab-btn">
            ⚙️ دليل الأسعار
          </button>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button onclick="printCurrentView()" class="btn btn-sky" title="طباعة">🖨️ طباعة</button>
          <button onclick="exportComprehensiveExcel()" class="btn btn-emerald" title="تصدير إكسل شامل">📊 إكسل</button>
          <button onclick="logout()" class="btn btn-danger" title="قطع الاتصال">خروج</button>
        </div>
      </div>
    </header>

    <main class="app-main">

      <!-- ========================================== -->
      <!-- 1. تبويب المشاريع (PROJECTS TAB) -->
      <!-- ========================================== -->
      <section id="tabProjects" class="tab-content active">
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-title">إجمالي المشاريع</span>
            <span id="statTotalProjects" class="stat-figure" style="color:#0f172a;">0</span>
            <span class="stat-desc">مشروع مسجل في الهاتف</span>
          </div>
          <div class="stat-card">
            <span class="stat-title">إجمالي بنود الحصر</span>
            <span id="statTotalItemsAll" class="stat-figure" style="color:#4f46e5;">0</span>
            <span class="stat-desc">بند قياس وحصر</span>
          </div>
          <div class="stat-card">
            <span class="stat-title">إجمالي المبالغ التقديرية</span>
            <span id="statTotalAmountAll" class="stat-figure" style="color:#059669;">0 ر.س</span>
            <span class="stat-desc">القيمة الإجمالية للعقود</span>
          </div>
          <div class="stat-card">
            <span class="stat-title">إجمالي الدفعات المقبوضة</span>
            <span id="statTotalPaidAll" class="stat-figure" style="color:#0284c7;">0 ر.س</span>
            <span class="stat-desc">مسلم في الحسابات</span>
          </div>
        </div>

        <div class="filter-strip">
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <input type="text" id="projectSearchInput" oninput="renderProjectsList()" placeholder="🔍 ابحث عن اسم المشروع، العميل، الهاتف..." class="search-box" />
          </div>
          <button onclick="openNewProjectModal()" class="btn btn-indigo">
            ➕ إضافة مشروع جديد للهاتف
          </button>
        </div>

        <div id="projectsCardsGrid" class="projects-grid"></div>
      </section>

      <!-- ========================================== -->
      <!-- 2. تبويب حصر الكميات (ITEMS SURVEY TAB) -->
      <!-- ========================================== -->
      <section id="tabItems" class="tab-content">
        <div class="filter-strip">
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
            <input type="text" id="itemsSearchInput" oninput="renderItemsTable()" placeholder="🔍 ابحث في البنود..." class="search-box" />
            <select id="itemsProjectFilter" onchange="renderItemsTable()" class="select-box">
              <option value="ALL">جميع المشاريع</option>
            </select>
            <select id="itemsJobTypeFilter" onchange="renderItemsTable()" class="select-box">
              <option value="ALL">جميع أنواع الأعمال</option>
            </select>
          </div>
          <button onclick="openNewItemModal()" class="btn btn-emerald">
            ➕ إضافة بند حصر جديد
          </button>
        </div>

        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-header-title">
              <span>📐 جدول حصر الكميات والمقاسات التفصيلي</span>
            </div>
            <div style="font-size:0.85rem; color:#64748b;">
              عدد البنود: <b id="displayedItemsCount" style="color:#0f172a;">0</b>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>المشروع</th>
                  <th>اسم البند / الغرفة</th>
                  <th>نوع العمل</th>
                  <th>الأبعاد (ط × ع × ار)</th>
                  <th>الفراغات المخصومة</th>
                  <th>الكمية الصافية</th>
                  <th>سعر المتر</th>
                  <th>الإجمالي</th>
                  <th style="text-align:center;">إجراء</th>
                </tr>
              </thead>
              <tbody id="itemsTableBody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 3. تبويب الدفعات والحسابات المالية (PAYMENTS TAB) -->
      <!-- ========================================== -->
      <section id="tabPayments" class="tab-content">
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-title">قيمة العقود المحددة</span>
            <span id="statPayTotalContracts" class="stat-figure" style="color:#0f172a;">0 ر.س</span>
            <span class="stat-desc">إجمالي قيمة الحصر للمشروع</span>
          </div>
          <div class="stat-card">
            <span class="stat-title">إجمالي المقبوض</span>
            <span id="statPayTotalReceived" class="stat-figure" style="color:#059669;">0 ر.س</span>
            <span class="stat-desc">الدفعات المحصلة بالفعل</span>
          </div>
          <div class="stat-card">
            <span class="stat-title">المتبقي للتحصيل</span>
            <span id="statPayTotalRemaining" class="stat-figure" style="color:#dc2626;">0 ر.س</span>
            <span class="stat-desc">رصيد العميل المستحق</span>
          </div>
        </div>

        <div class="filter-strip">
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
            <select id="paymentProjectFilter" onchange="renderPaymentsTable()" class="select-box">
              <option value="ALL">جميع المشاريع</option>
            </select>
          </div>
          <button onclick="openNewPaymentModal()" class="btn btn-amber">
            ➕ إضافة دفعة مالية (سند قبض)
          </button>
        </div>

        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-header-title">
              <span>💰 سجل الدفعات وسندات القبض</span>
            </div>
            <div style="font-size:0.85rem; color:#64748b;">
              عدد السندات: <b id="displayedPaymentsCount" style="color:#0f172a;">0</b>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>المشروع</th>
                  <th>المبلغ المستلم</th>
                  <th>نوع العمل / المرحلة</th>
                  <th>ملاحظات السند</th>
                  <th>تاريخ الإضافة</th>
                  <th style="text-align:center;">إجراء</th>
                </tr>
              </thead>
              <tbody id="paymentsTableBody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 4. تبويب عروض الأسعار الرسمية (QUOTATIONS TAB) -->
      <!-- ========================================== -->
      <section id="tabQuotations" class="tab-content">
        <div class="filter-strip">
          <div style="display:flex; gap:0.75rem; align-items:center;">
            <label class="form-label">اختر المشروع لعرض السعر:</label>
            <select id="quoteProjectSelect" onchange="renderQuotationView()" class="select-box"></select>
          </div>
          <div style="display:flex; gap:0.75rem; align-items:center;">
            <label style="display:flex; align-items:center; gap:0.35rem; font-size:0.88rem; font-weight:700; cursor:pointer;">
              <input type="checkbox" id="quoteVatCheckbox" onchange="renderQuotationView()" checked />
              تضمين ضريبة القيمة المضافة (15%)
            </label>
            <button onclick="window.print()" class="btn btn-indigo">
              🖨️ طباعة عرض السعر الرسمي PDF
            </button>
          </div>
        </div>

        <div id="quotationSheet" class="quotation-paper">
          <div class="quote-header">
            <div>
              <h2 style="font-size: 1.6rem; font-weight: 900; color: #0f172a;">عرض سعر مقاولة وأعمال حصر</h2>
              <p style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">تاريخ العرض: <span id="quoteDate"></span></p>
            </div>
            <div style="text-align: left;">
              <h3 style="font-size: 1.3rem; font-weight: 800; color: #4f46e5;">تطبيق Metrix</h3>
              <p style="font-size: 0.8rem; color: #64748b;">نظام الحصر وإدارة المشاريع</p>
            </div>
          </div>

          <div class="quote-parties">
            <div class="quote-party-box">
              <h4>بيانات العميل والمشروع</h4>
              <p><b>اسم المشروع:</b> <span id="quoteProjName">-</span></p>
              <p><b>العميل المكرم:</b> <span id="quoteClientName">-</span></p>
              <p><b>رقم الجوال:</b> <span id="quoteClientMobile">-</span></p>
            </div>
            <div class="quote-party-box">
              <h4>شروط التعاقد والتنفيذ</h4>
              <p>• جميع القياسات هندسية صافية بعد خصم الفراغات المعتمدة.</p>
              <p>• الدفعات تصرف بحسب نسب الإنجاز وسندات القبض الموقعة.</p>
              <p>• صلاحية هذا العرض 30 يوماً من تاريخ إصداره.</p>
            </div>
          </div>

          <div class="table-container" style="margin-bottom: 1.5rem;">
            <table class="data-table" style="border: 1px solid #e2e8f0;">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>بيان البند والوصف</th>
                  <th>نوع العمل</th>
                  <th>الكمية المقدرة</th>
                  <th>سعر الوحدة</th>
                  <th>المبلغ الإجمالي</th>
                </tr>
              </thead>
              <tbody id="quoteItemsBody"></tbody>
            </table>
          </div>

          <div class="quote-totals">
            <div class="quote-total-row">
              <span>المجموع الفرعي:</span>
              <span id="quoteSubtotal" style="font-weight:700;">0 ر.س</span>
            </div>
            <div class="quote-total-row">
              <span>ضريبة القيمة المضافة (15%):</span>
              <span id="quoteVatAmount" style="font-weight:700;">0 ر.س</span>
            </div>
            <div class="quote-total-row quote-total-grand">
              <span>المبلغ الإجمالي النهائي:</span>
              <span id="quoteGrandTotal">0 ر.س</span>
            </div>
          </div>

          <div class="quote-signatures">
            <div>
              <p style="font-weight:800; font-size:0.95rem;">الطرف الأول (المقاول / المنفذ)</p>
              <div class="sig-line">الاسم والتوقيع والختم</div>
            </div>
            <div>
              <p style="font-weight:800; font-size:0.95rem;">الطرف الثاني (العميل / المالك)</p>
              <div class="sig-line">الموافقة والاعتماد</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 5. تبويب دليل وتعديل الأسعار (PRICES TAB) -->
      <!-- ========================================== -->
      <section id="tabPrices" class="tab-content">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-header-title">
              <span>⚙️ دليل أسعار بنود الأعمال والتشطيبات الافتراضية</span>
            </div>
            <span class="tag-badge tag-indigo">محفوظ ومزامن مع الهاتف</span>
          </div>
          <div class="panel-body">
            <p style="font-size:0.88rem; color:#64748b; margin-bottom:1.25rem;">
              يمكنك هنا ضبط وتعديل أسعار المتر الافتراضية لكل بند. عند تحديث أي سعر، سيتم حفظه فوراً في قاعدة بيانات الهاتف وتطبيقه تلقائياً عند إضافة بنود جديدة.
            </p>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>نوع العمل / البند</th>
                    <th>السعر الحالي للمتر (ر.س)</th>
                    <th>تعديل السعر الجديد</th>
                    <th style="text-align:center;">إجراء الحفظ</th>
                  </tr>
                </thead>
                <tbody id="pricesTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>

  <!-- ========================================== -->
  <!-- النوافذ المنبثقة التفاعلية (MODALS) -->
  <!-- ========================================== -->

  <!-- نافذة إضافة مشروع جديد -->
  <div id="newProjectModal" class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-head">
        <h3>🏢 إضافة مشروع جديد إلى الهاتف</h3>
        <button onclick="closeModal('newProjectModal')" class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">اسم المشروع *</label>
          <input type="text" id="newProjName" class="form-input" placeholder="مثلاً: فيلا حي الياسمين" />
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">اسم العميل</label>
            <input type="text" id="newProjClient" class="form-input" placeholder="اسم مالك المشروع" />
          </div>
          <div class="form-group">
            <label class="form-label">رقم جوال العميل</label>
            <input type="tel" id="newProjMobile" class="form-input" placeholder="05xxxxxxxx" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">تاريخ المشروع</label>
          <input type="date" id="newProjDate" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">ملاحظات / وصف المشروع</label>
          <textarea id="newProjDesc" class="form-input" rows="2" placeholder="ملاحظات العقد أو الموقع..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="closeModal('newProjectModal')" class="btn btn-gray">إلغاء</button>
        <button onclick="submitNewProject()" class="btn btn-indigo">حفظ المشروع في الهاتف</button>
      </div>
    </div>
  </div>

  <!-- نافذة إضافة بند حصر جديد -->
  <div id="newItemModal" class="modal-backdrop">
    <div class="modal-box" style="max-width:640px;">
      <div class="modal-head">
        <h3>📐 إضافة بند حصر هندسي إلى الهاتف</h3>
        <button onclick="closeModal('newItemModal')" class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">المشروع التابع له *</label>
            <select id="modalItemProjectSelect" class="form-input"></select>
          </div>
          <div class="form-group">
            <label class="form-label">اسم البند / الغرفة *</label>
            <input type="text" id="newItemTitle" class="form-input" placeholder="مجلس الرجال، غرفة النوم..." />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">نوع العمل</label>
            <select id="newItemJobType" onchange="onJobTypeChanged()" class="form-input">
              <option value="لياسة">لياسة (تلييس)</option>
              <option value="دهان">دهان</option>
              <option value="بناء طوب">بناء طوب</option>
              <option value="بلاط وسيراميك">بلاط وسيراميك</option>
              <option value="جبس بورد">جبس بورد</option>
              <option value="صب خرسانة">صب خرسانة</option>
              <option value="عزل مائي">عزل مائي</option>
              <option value="عزل حراري">عزل حراري</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">طريقة الحساب</label>
            <select id="newItemCalcMode" onchange="calculateLiveItem()" class="form-input">
              <option value="WALLS">جدران / حوائط (محيط × ارتفاع)</option>
              <option value="AREA">مسطح / مساحة (طول × عرض)</option>
              <option value="VOLUME">حجم / مكعب (طول × عرض × ارتفاع)</option>
              <option value="LENGTH">طولي (طول فقط)</option>
            </select>
          </div>
        </div>

        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">الطول (م)</label>
            <input type="number" step="0.01" id="newItemLength" oninput="calculateLiveItem()" class="form-input" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">العرض (م)</label>
            <input type="number" step="0.01" id="newItemWidth" oninput="calculateLiveItem()" class="form-input" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">الارتفاع (م)</label>
            <input type="number" step="0.01" id="newItemHeight" oninput="calculateLiveItem()" class="form-input" placeholder="0.00" />
          </div>
        </div>

        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">عدد الجدران / التكرار</label>
            <input type="number" step="1" id="newItemWallCount" value="1" oninput="calculateLiveItem()" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">خصم الأبواب (م2)</label>
            <input type="number" step="0.01" id="newItemDoorsVoid" value="0" oninput="calculateLiveItem()" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">خصم النوافذ (م2)</label>
            <input type="number" step="0.01" id="newItemWindowsVoid" value="0" oninput="calculateLiveItem()" class="form-input" />
          </div>
        </div>

        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">سعر المتر (ر.س)</label>
            <input type="number" step="0.1" id="newItemPrice" oninput="calculateLiveItem()" class="form-input" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">الكمية الصافية المحسوبة</label>
            <input type="text" id="newItemCalcMeters" readonly class="form-input" style="background:#f8fafc; font-weight:800; color:#4f46e5;" value="0" />
          </div>
          <div class="form-group">
            <label class="form-label">المبلغ الإجمالي</label>
            <input type="text" id="newItemCalcAmount" readonly class="form-input" style="background:#f8fafc; font-weight:800; color:#059669;" value="0 ر.س" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="closeModal('newItemModal')" class="btn btn-gray">إلغاء</button>
        <button onclick="submitNewItem()" class="btn btn-emerald">حفظ وإرسال إلى الهاتف</button>
      </div>
    </div>
  </div>

  <!-- نافذة إضافة دفعة مالية جديدة -->
  <div id="newPaymentModal" class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-head">
        <h3>💰 إضافة سند قبض / دفعة مالية إلى الهاتف</h3>
        <button onclick="closeModal('newPaymentModal')" class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">المشروع *</label>
          <select id="modalPaymentProjectSelect" class="form-input"></select>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">المبلغ المستلم (ر.س) *</label>
            <input type="number" step="0.01" id="newPayAmount" class="form-input" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label class="form-label">نوع العمل / المرحلة</label>
            <input type="text" id="newPayJobType" class="form-input" placeholder="دفعة مقدمة، لياسة، دهان..." />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">ملاحظات السند / رقم الإيصال</label>
          <textarea id="newPayNote" class="form-input" rows="2" placeholder="ملاحظات الحوالة أو الاستلام..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="closeModal('newPaymentModal')" class="btn btn-gray">إلغاء</button>
        <button onclick="submitNewPayment()" class="btn btn-amber">حفظ الدفعة في الهاتف</button>
      </div>
    </div>
  </div>

  <script>
    let socket;
    let currentSessionId = '';
    let countdownInterval;
    let globalProjectsData = [];
    let globalPricesData = [];

    // الاتصال بالخادم السحابي
    function initSocket() {
      socket = io();

      socket.on('connect', () => {
        if (currentSessionId) {
          socket.emit('join_session', currentSessionId);
          socket.emit('relay_to_phone', { sessionId: currentSessionId, action: 'request_sync', data: {} });
        }
      });

      socket.on('authenticated', (data) => {
        clearInterval(countdownInterval);
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'flex';

        try {
          localStorage.setItem('metrix_session_id', currentSessionId);
          localStorage.setItem('metrix_cached_data', JSON.stringify(data));
        } catch(e) {}

        globalProjectsData = data.projects || [];
        globalPricesData = data.prices || [];

        populateAllProjectSelectors();
        renderProjectsList();
        renderItemsTable();
        renderPaymentsTable();
        renderQuotationView();
        renderPricesTable();
      });

      socket.on('session_terminated', () => logout());
    }

    // توليد رمز QR وبدء العد التنازلي
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
        colorDark: "#0f172a",
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

    // إدارة التبويبات
    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

      const target = document.getElementById(tabId);
      if (target) target.classList.add('active');

      if (tabId === 'tabProjects') document.getElementById('btnTabProjects').classList.add('active');
      if (tabId === 'tabItems') document.getElementById('btnTabItems').classList.add('active');
      if (tabId === 'tabPayments') document.getElementById('btnTabPayments').classList.add('active');
      if (tabId === 'tabQuotations') document.getElementById('btnTabQuotations').classList.add('active');
      if (tabId === 'tabPrices') document.getElementById('btnTabPrices').classList.add('active');
    }

    // تعبئة قوائم المشاريع المنسدلة في كافة الواجهات
    function populateAllProjectSelectors() {
      const selects = [
        document.getElementById('itemsProjectFilter'),
        document.getElementById('paymentProjectFilter'),
        document.getElementById('quoteProjectSelect'),
        document.getElementById('modalItemProjectSelect'),
        document.getElementById('modalPaymentProjectSelect')
      ];

      selects.forEach(sel => {
        if (!sel) return;
        const cur = sel.value;
        const isFilter = sel.id.includes('Filter');
        sel.innerHTML = isFilter ? '<option value="ALL">جميع المشاريع</option>' : '';

        globalProjectsData.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name || 'مشروع بدون اسم';
          sel.appendChild(opt);
        });

        if (cur && Array.from(sel.options).some(o => o.value === cur)) {
          sel.value = cur;
        }
      });

      // تعبئة فلتر أنواع الأعمال
      const jobFilter = document.getElementById('itemsJobTypeFilter');
      if (jobFilter) {
        const curJob = jobFilter.value;
        const jobSet = new Set();
        globalProjectsData.forEach(p => (p.items || []).forEach(it => { if (it.jobType) jobSet.add(it.jobType); }));
        jobFilter.innerHTML = '<option value="ALL">جميع أنواع الأعمال</option>';
        jobSet.forEach(job => {
          const opt = document.createElement('option');
          opt.value = job;
          opt.textContent = job;
          jobFilter.appendChild(opt);
        });
        if (curJob) jobFilter.value = curJob;
      }
    }

    // ==========================================
    // 1. عرض بطاقات المشاريع وإحصائياتها
    // ==========================================
    function renderProjectsList() {
      let totalProjects = globalProjectsData.length;
      let totalItems = 0;
      let totalAmount = 0;
      let totalPaid = 0;

      const q = (document.getElementById('projectSearchInput').value || '').trim().toLowerCase();
      const grid = document.getElementById('projectsCardsGrid');
      grid.innerHTML = '';

      globalProjectsData.forEach(p => {
        const items = p.items || [];
        const payments = p.payments || [];
        const pTotalAmount = items.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
        const pTotalPaid = payments.reduce((sum, pm) => sum + (Number(pm.amount) || 0), 0);
        const remaining = pTotalAmount - pTotalPaid;

        totalItems += items.length;
        totalAmount += pTotalAmount;
        totalPaid += pTotalPaid;

        const match = !q || (p.name + ' ' + (p.clientName || '') + ' ' + (p.mobileNumber || '')).toLowerCase().includes(q);
        if (!match) return;

        const card = document.createElement('div');
        card.className = 'proj-card';
        card.innerHTML =
          '<div>' +
            '<div class="proj-card-top">' +
              '<div>' +
                '<h3 class="proj-name">' + (p.name || 'بدون اسم') + '</h3>' +
                '<div class="proj-client">👤 ' + (p.clientName || 'عميل عام') + (p.mobileNumber ? (' | 📞 ' + p.mobileNumber) : '') + '</div>' +
              '</div>' +
              '<span class="tag-badge tag-blue">' + (p.projectDate || 'بدون تاريخ') + '</span>' +
            '</div>' +
            (p.description ? ('<p style="font-size:0.82rem; color:#64748b; margin-top:0.5rem;">' + p.description + '</p>') : '') +
            '<div class="proj-metrics" style="margin-top:0.75rem;">' +
              '<div>' +
                '<div class="metric-sub">إجمالي الحصر</div>' +
                '<div class="metric-val" style="color:#4f46e5;">' + pTotalAmount.toLocaleString() + ' ر.س</div>' +
              '</div>' +
              '<div>' +
                '<div class="metric-sub">المقبوض</div>' +
                '<div class="metric-val" style="color:#059669;">' + pTotalPaid.toLocaleString() + ' ر.س</div>' +
              '</div>' +
              '<div>' +
                '<div class="metric-sub">المتبقي</div>' +
                '<div class="metric-val" style="color:' + (remaining > 0 ? '#dc2626' : '#10b981') + ';">' + remaining.toLocaleString() + ' ر.س</div>' +
              '</div>' +
              '<div>' +
                '<div class="metric-sub">عدد البنود</div>' +
                '<div class="metric-val">' + items.length + ' بند</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="proj-card-actions">' +
            '<div style="display:flex; gap:0.4rem;">' +
              '<button onclick="filterByProjectAndOpenItems(' + p.id + ')" class="btn btn-sky" style="padding:0.35rem 0.65rem; font-size:0.8rem;">📐 البنود</button>' +
              '<button onclick="filterByProjectAndOpenPayments(' + p.id + ')" class="btn btn-amber" style="padding:0.35rem 0.65rem; font-size:0.8rem;">💰 الدفعات</button>' +
            '</div>' +
            '<button onclick="deleteProject(' + p.id + ')" class="btn-del-sm" title="حذف المشروع بالكامل من الهاتف">🗑️</button>' +
          '</div>';
        grid.appendChild(card);
      });

      document.getElementById('statTotalProjects').textContent = totalProjects;
      document.getElementById('statTotalItemsAll').textContent = totalItems;
      document.getElementById('statTotalAmountAll').textContent = totalAmount.toLocaleString() + ' ر.س';
      document.getElementById('statTotalPaidAll').textContent = totalPaid.toLocaleString() + ' ر.س';
    }

    function filterByProjectAndOpenItems(projectId) {
      document.getElementById('itemsProjectFilter').value = projectId;
      switchTab('tabItems');
      renderItemsTable();
    }

    function filterByProjectAndOpenPayments(projectId) {
      document.getElementById('paymentProjectFilter').value = projectId;
      switchTab('tabPayments');
      renderPaymentsTable();
    }

    // ==========================================
    // 2. عرض جدول حصر الكميات
    // ==========================================
    function renderItemsTable() {
      const q = (document.getElementById('itemsSearchInput').value || '').trim().toLowerCase();
      const selProj = document.getElementById('itemsProjectFilter').value;
      const selJob = document.getElementById('itemsJobTypeFilter').value;
      const tbody = document.getElementById('itemsTableBody');
      tbody.innerHTML = '';

      let count = 0;

      globalProjectsData.forEach(p => {
        if (selProj !== 'ALL' && String(p.id) !== selProj) return;

        (p.items || []).forEach(it => {
          if (selJob !== 'ALL' && it.jobType !== selJob) return;

          const searchStr = (p.name + ' ' + (it.title || it.itemName || '') + ' ' + (it.jobType || '')).toLowerCase();
          if (q && !searchStr.includes(q)) return;

          count++;
          const dim = (it.length || 0) + ' × ' + (it.width || 0) + ' × ' + (it.height || 0);
          const voidTotal = (Number(it.doorsVoid) || 0) + (Number(it.windowsVoid) || 0) + (Number(it.voidArea) || 0);
          const meters = Number(it.totalMeters || it.quantity || 0);
          const price = Number(it.pricePerMeter || 0);
          const amount = Number(it.totalAmount || 0);

          const tr = document.createElement('tr');
          tr.innerHTML =
            '<td style="font-weight:800; color:#0f172a;">' + (p.name || '-') + '</td>' +
            '<td style="font-weight:700;">' + (it.title || it.itemName || '-') + '</td>' +
            '<td><span class="tag-badge tag-indigo">' + (it.jobType || '-') + '</span></td>' +
            '<td style="font-family:monospace; color:#64748b;">' + dim + '</td>' +
            '<td style="color:#ef4444; font-weight:700;">' + (voidTotal > 0 ? ('-' + voidTotal + ' م2') : '-') + '</td>' +
            '<td style="font-weight:900; color:#4f46e5; font-family:monospace;">' + meters.toLocaleString() + '</td>' +
            '<td style="color:#64748b;">' + (price > 0 ? (price.toLocaleString() + ' ر.س') : '-') + '</td>' +
            '<td style="font-weight:900; color:#059669; font-family:monospace;">' + amount.toLocaleString() + ' ر.س</td>' +
            '<td style="text-align:center;"><button onclick="deleteItem(' + it.itemId + ')" class="btn-del-sm" title="حذف من الهاتف">🗑️</button></td>';
          tbody.appendChild(tr);
        });
      });

      if (count === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#94a3b8; padding:2.5rem;">لا توجد بنود مطابقة للبحث أو التصفية</td></tr>';
      }
      document.getElementById('displayedItemsCount').textContent = count;
    }

    // ==========================================
    // 3. عرض جدول الدفعات والمالية
    // ==========================================
    function renderPaymentsTable() {
      const selProj = document.getElementById('paymentProjectFilter').value;
      const tbody = document.getElementById('paymentsTableBody');
      tbody.innerHTML = '';

      let totalContract = 0;
      let totalReceived = 0;
      let count = 0;

      globalProjectsData.forEach(p => {
        if (selProj !== 'ALL' && String(p.id) !== selProj) return;

        totalContract += (p.items || []).reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);

        (p.payments || []).forEach(pm => {
          count++;
          const amt = Number(pm.amount || 0);
          totalReceived += amt;

          const tr = document.createElement('tr');
          tr.innerHTML =
            '<td style="font-weight:800; color:#0f172a;">' + (p.name || '-') + '</td>' +
            '<td style="font-weight:900; color:#059669; font-size:1.05rem; font-family:monospace;">' + amt.toLocaleString() + ' ر.س</td>' +
            '<td><span class="tag-badge tag-amber">' + (pm.jobType || 'عام') + '</span></td>' +
            '<td>' + (pm.note || 'سند استلام نقدي / حوالة') + '</td>' +
            '<td style="color:#64748b; font-size:0.85rem;">' + (pm.dateAdded ? new Date(pm.dateAdded).toLocaleDateString('ar-SA') : '-') + '</td>' +
            '<td style="text-align:center;"><button onclick="deletePayment(' + pm.id + ')" class="btn-del-sm" title="حذف السند من الهاتف">🗑️</button></td>';
          tbody.appendChild(tr);
        });
      });

      if (count === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2.5rem;">لا توجد دفعات مالية مسجلة</td></tr>';
      }

      const remaining = totalContract - totalReceived;
      document.getElementById('statPayTotalContracts').textContent = totalContract.toLocaleString() + ' ر.س';
      document.getElementById('statPayTotalReceived').textContent = totalReceived.toLocaleString() + ' ر.س';
      document.getElementById('statPayTotalRemaining').textContent = remaining.toLocaleString() + ' ر.س';
      document.getElementById('displayedPaymentsCount').textContent = count;
    }

    // ==========================================
    // 4. عرض وتوليد عروض الأسعار (QUOTATIONS)
    // ==========================================
    function renderQuotationView() {
      const pId = document.getElementById('quoteProjectSelect').value;
      const proj = globalProjectsData.find(p => String(p.id) === String(pId)) || globalProjectsData[0];

      if (!proj) {
        document.getElementById('quoteProjName').textContent = 'لا توجد مشاريع';
        document.getElementById('quoteItemsBody').innerHTML = '<tr><td colspan="6" style="text-align:center;">يرجى إنشاء مشروع أولاً</td></tr>';
        return;
      }

      document.getElementById('quoteDate').textContent = new Date().toLocaleDateString('ar-SA', { dateStyle: 'full' });
      document.getElementById('quoteProjName').textContent = proj.name || '-';
      document.getElementById('quoteClientName').textContent = proj.clientName || 'عميلنا العزيز';
      document.getElementById('quoteClientMobile').textContent = proj.mobileNumber || '-';

      const tbody = document.getElementById('quoteItemsBody');
      tbody.innerHTML = '';

      let subtotal = 0;
      (proj.items || []).forEach((it, idx) => {
        const qty = Number(it.totalMeters || it.quantity || 0);
        const price = Number(it.pricePerMeter || 0);
        const amount = Number(it.totalAmount || (qty * price));
        subtotal += amount;

        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + (idx + 1) + '</td>' +
          '<td style="font-weight:700;">' + (it.title || it.itemName || '-') + '</td>' +
          '<td>' + (it.jobType || '-') + '</td>' +
          '<td style="font-family:monospace; font-weight:700;">' + qty.toLocaleString() + '</td>' +
          '<td>' + price.toLocaleString() + ' ر.س</td>' +
          '<td style="font-family:monospace; font-weight:900; color:#059669;">' + amount.toLocaleString() + ' ر.س</td>';
        tbody.appendChild(tr);
      });

      const includeVat = document.getElementById('quoteVatCheckbox').checked;
      const vatAmount = includeVat ? (subtotal * 0.15) : 0;
      const grandTotal = subtotal + vatAmount;

      document.getElementById('quoteSubtotal').textContent = subtotal.toLocaleString() + ' ر.س';
      document.getElementById('quoteVatAmount').textContent = vatAmount.toLocaleString() + ' ر.س';
      document.getElementById('quoteGrandTotal').textContent = grandTotal.toLocaleString() + ' ر.س';
    }

    // ==========================================
    // 5. عرض وتعديل دليل الأسعار (PRICES GUIDE)
    // ==========================================
    function renderPricesTable() {
      const defaultJobs = [
        'لياسة', 'دهان', 'بناء طوب', 'بلاط وسيراميك', 'جبس بورد',
        'صب خرسانة', 'عزل مائي', 'عزل حراري', 'أخرى'
      ];

      const priceMap = {};
      globalPricesData.forEach(p => { priceMap[p.jobType] = p.pricePerUnit; });

      const tbody = document.getElementById('pricesTableBody');
      tbody.innerHTML = '';

      defaultJobs.forEach(job => {
        const curPrice = priceMap[job] !== undefined ? priceMap[job] : 0;
        const inputId = 'price_input_' + encodeURIComponent(job);

        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td style="font-weight:800; font-size:0.95rem;">' + job + '</td>' +
          '<td style="font-weight:900; color:#4f46e5; font-size:1.1rem; font-family:monospace;">' + curPrice.toLocaleString() + ' ر.س</td>' +
          '<td><input type="number" step="0.5" id="' + inputId + '" value="' + curPrice + '" class="form-input" style="width:140px;" /></td>' +
          '<td style="text-align:center;"><button onclick="saveUnitPrice(\\'' + job + '\\', \\'' + inputId + '\\')" class="btn btn-indigo" style="padding:0.35rem 0.85rem;">💾 حفظ في الهاتف</button></td>';
        tbody.appendChild(tr);
      });
    }

    function saveUnitPrice(jobType, inputId) {
      const newPrice = parseFloat(document.getElementById(inputId).value) || 0;
      socket.emit('relay_to_phone', {
        sessionId: currentSessionId,
        action: 'save_price_from_web',
        data: { jobType: jobType, pricePerUnit: newPrice }
      });
      alert('تم إرسال السعر الجديد للبند [' + jobType + '] إلى الهاتف بنجاح!');
    }

    // ==========================================
    // إدارة النوافذ المنبثقة والعمليات التفاعلية
    // ==========================================
    function openNewProjectModal() {
      document.getElementById('newProjectModal').style.display = 'flex';
      document.getElementById('newProjName').focus();
    }

    function openNewItemModal() {
      if (!globalProjectsData || globalProjectsData.length === 0) {
        alert('يرجى إضافة مشروع أولاً قبل إنشاء بنود الحصر');
        openNewProjectModal();
        return;
      }
      document.getElementById('newItemModal').style.display = 'flex';
      onJobTypeChanged();
      calculateLiveItem();
      document.getElementById('newItemTitle').focus();
    }

    function openNewPaymentModal() {
      if (!globalProjectsData || globalProjectsData.length === 0) {
        alert('يرجى إضافة مشروع أولاً قبل تسجيل الدفعات');
        return;
      }
      document.getElementById('newPaymentModal').style.display = 'flex';
      document.getElementById('newPayAmount').focus();
    }

    function closeModal(id) {
      document.getElementById(id).style.display = 'none';
    }

    // عند تغيير نوع العمل، نقترح السعر الافتراضي من دليل الأسعار
    function onJobTypeChanged() {
      const job = document.getElementById('newItemJobType').value;
      const found = globalPricesData.find(p => p.jobType === job);
      if (found && found.pricePerUnit > 0) {
        document.getElementById('newItemPrice').value = found.pricePerUnit;
      }
      calculateLiveItem();
    }

    // حساب الحصر الهندسي الصافي المباشر
    function calculateLiveItem() {
      const mode = document.getElementById('newItemCalcMode').value;
      const l = parseFloat(document.getElementById('newItemLength').value) || 0;
      const w = parseFloat(document.getElementById('newItemWidth').value) || 0;
      const h = parseFloat(document.getElementById('newItemHeight').value) || 0;
      const walls = parseFloat(document.getElementById('newItemWallCount').value) || 1;
      const dVoid = parseFloat(document.getElementById('newItemDoorsVoid').value) || 0;
      const wVoid = parseFloat(document.getElementById('newItemWindowsVoid').value) || 0;
      const price = parseFloat(document.getElementById('newItemPrice').value) || 0;

      let netMeters = 0;
      if (mode === 'WALLS') {
        // حوائط: محيط الغرفة ((طول + عرض) * 2) * ارتفاع أو طول جدار * ارتفاع * عدد الجدران
        const perimeter = (w > 0) ? ((l + w) * 2) : (l * walls);
        const gross = perimeter * (h > 0 ? h : 1);
        netMeters = Math.max(0, gross - (dVoid + wVoid));
      } else if (mode === 'AREA') {
        // مسطح أرضية أو سقف
        const gross = (l * (w > 0 ? w : 1)) * walls;
        netMeters = Math.max(0, gross - (dVoid + wVoid));
      } else if (mode === 'VOLUME') {
        // خرسانات وحجوم
        netMeters = l * (w > 0 ? w : 1) * (h > 0 ? h : 1) * walls;
      } else if (mode === 'LENGTH') {
        // طولي
        netMeters = l * walls;
      }

      netMeters = Math.round(netMeters * 100) / 100;
      const totalAmount = Math.round((netMeters * price) * 100) / 100;

      document.getElementById('newItemCalcMeters').value = netMeters;
      document.getElementById('newItemCalcAmount').value = totalAmount.toLocaleString() + ' ر.س';
    }

    // إرسال مشروع جديد للهاتف
    function submitNewProject() {
      const name = document.getElementById('newProjName').value.trim();
      if (!name) { alert('يرجى إدخال اسم المشروع'); return; }

      const projData = {
        name: name,
        clientName: document.getElementById('newProjClient').value.trim(),
        mobileNumber: document.getElementById('newProjMobile').value.trim(),
        projectDate: document.getElementById('newProjDate').value || new Date().toISOString().split('T')[0],
        description: document.getElementById('newProjDesc').value.trim()
      };

      socket.emit('relay_to_phone', {
        sessionId: currentSessionId,
        action: 'create_project_from_web',
        data: projData
      });

      closeModal('newProjectModal');
      document.getElementById('newProjName').value = '';
      document.getElementById('newProjClient').value = '';
      document.getElementById('newProjMobile').value = '';
      document.getElementById('newProjDesc').value = '';
    }

    // إرسال بند حصر جديد للهاتف
    function submitNewItem() {
      const pId = parseInt(document.getElementById('modalItemProjectSelect').value);
      const title = document.getElementById('newItemTitle').value.trim();
      if (!pId || !title) { alert('يرجى اختيار المشروع وتحديد اسم البند'); return; }

      const l = parseFloat(document.getElementById('newItemLength').value) || 0;
      const w = parseFloat(document.getElementById('newItemWidth').value) || 0;
      const h = parseFloat(document.getElementById('newItemHeight').value) || 0;
      const walls = parseInt(document.getElementById('newItemWallCount').value) || 1;
      const dVoid = parseFloat(document.getElementById('newItemDoorsVoid').value) || 0;
      const wVoid = parseFloat(document.getElementById('newItemWindowsVoid').value) || 0;
      const price = parseFloat(document.getElementById('newItemPrice').value) || 0;
      const meters = parseFloat(document.getElementById('newItemCalcMeters').value) || 0;
      const totalAmount = meters * price;

      const itemData = {
        projectId: pId,
        itemName: title,
        jobType: document.getElementById('newItemJobType').value,
        calcMode: document.getElementById('newItemCalcMode').value,
        length: l,
        width: w,
        height: h,
        wallCount: walls,
        voidArea: (dVoid + wVoid),
        pricePerMeter: price,
        quantity: 1,
        totalMeters: meters,
        totalAmount: totalAmount,
        doorsVoid: dVoid,
        windowsVoid: wVoid
      };

      socket.emit('relay_to_phone', {
        sessionId: currentSessionId,
        action: 'create_item_from_web',
        data: itemData
      });

      closeModal('newItemModal');
      document.getElementById('newItemTitle').value = '';
      document.getElementById('newItemLength').value = '';
      document.getElementById('newItemWidth').value = '';
      document.getElementById('newItemHeight').value = '';
      document.getElementById('newItemDoorsVoid').value = '0';
      document.getElementById('newItemWindowsVoid').value = '0';
      document.getElementById('newItemCalcMeters').value = '0';
      document.getElementById('newItemCalcAmount').value = '0 ر.س';
    }

    // إرسال دفعة مالية جديدة للهاتف
    function submitNewPayment() {
      const pId = parseInt(document.getElementById('modalPaymentProjectSelect').value);
      const amt = parseFloat(document.getElementById('newPayAmount').value) || 0;
      if (!pId || amt <= 0) { alert('يرجى اختيار المشروع وإدخال مبلغ صحيح'); return; }

      const payData = {
        projectId: pId,
        amount: amt,
        jobType: document.getElementById('newPayJobType').value.trim(),
        note: document.getElementById('newPayNote').value.trim()
      };

      socket.emit('relay_to_phone', {
        sessionId: currentSessionId,
        action: 'add_payment_from_web',
        data: payData
      });

      closeModal('newPaymentModal');
      document.getElementById('newPayAmount').value = '';
      document.getElementById('newPayJobType').value = '';
      document.getElementById('newPayNote').value = '';
    }

    // حذف مشروع من الهاتف
    function deleteProject(projectId) {
      if (confirm('تحذير: هل أنت متأكد من حذف هذا المشروع وجميع بنوده ودفعاته من الهاتف نهائياً؟')) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'delete_project_from_web',
          data: projectId
        });
      }
    }

    // حذف بند من الهاتف
    function deleteItem(itemId) {
      if (confirm('هل أنت متأكد من حذف هذا البند من الهاتف؟')) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'delete_item_from_web',
          data: itemId
        });
      }
    }

    // حذف دفعة من الهاتف
    function deletePayment(paymentId) {
      if (confirm('هل أنت متأكد من حذف هذا السند المالي من الهاتف؟')) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'delete_payment_from_web',
          data: paymentId
        });
      }
    }

    // طباعة الشاشة الحالية
    function printCurrentView() {
      window.print();
    }

    // تصدير ملف إكسل شامل لكل شيء في النظام
    function exportComprehensiveExcel() {
      if (!globalProjectsData || globalProjectsData.length === 0) {
        alert('لا توجد بيانات للتصدير!');
        return;
      }

      const wb = XLSX.utils.book_new();

      // ورقة بنود الحصر
      const itemsRows = [['المشروع', 'العميل', 'رقم الجوال', 'اسم البند / الغرفة', 'نوع العمل', 'طريقة الحساب', 'الطول', 'العرض', 'الارتفاع', 'خصم الأبواب', 'خصم النوافذ', 'الكمية الصافية', 'سعر المتر', 'المبلغ الإجمالي']];
      globalProjectsData.forEach(p => {
        (p.items || []).forEach(it => {
          itemsRows.push([
            p.name || '',
            p.clientName || '',
            p.mobileNumber || '',
            it.title || it.itemName || '',
            it.jobType || '',
            it.calcMode || '',
            it.length || 0,
            it.width || 0,
            it.height || 0,
            it.doorsVoid || 0,
            it.windowsVoid || 0,
            it.totalMeters || it.quantity || 0,
            it.pricePerMeter || 0,
            it.totalAmount || 0
          ]);
        });
      });
      const wsItems = XLSX.utils.aoa_to_sheet(itemsRows);
      wsItems['!dir'] = 'rtl';
      XLSX.utils.book_append_sheet(wb, wsItems, "حصر الكميات");

      // ورقة الدفعات المالية
      const payRows = [['المشروع', 'العميل', 'المبلغ المقبوض', 'نوع العمل / المرحلة', 'الملاحظات', 'تاريخ الاستلام']];
      globalProjectsData.forEach(p => {
        (p.payments || []).forEach(pm => {
          payRows.push([
            p.name || '',
            p.clientName || '',
            pm.amount || 0,
            pm.jobType || '',
            pm.note || '',
            pm.dateAdded ? new Date(pm.dateAdded).toLocaleDateString('ar-SA') : ''
          ]);
        });
      });
      const wsPays = XLSX.utils.aoa_to_sheet(payRows);
      wsPays['!dir'] = 'rtl';
      XLSX.utils.book_append_sheet(wb, wsPays, "الدفعات المالية");

      XLSX.writeFile(wb, "تقرير_شامل_Metrix_" + Date.now() + ".xlsx");
    }

    function logout() {
      try {
        localStorage.removeItem('metrix_session_id');
        localStorage.removeItem('metrix_cached_data');
      } catch(e) {}
      if (socket && currentSessionId) {
        socket.emit('terminate_session', currentSessionId);
      }
      document.getElementById('dashboardScreen').style.display = 'none';
      document.getElementById('authScreen').style.display = 'flex';
      initSession();
    }

    window.onload = () => {
      initSocket();
      const savedSession = localStorage.getItem('metrix_session_id');
      const savedData = localStorage.getItem('metrix_cached_data');

      if (savedSession && savedData) {
        try {
          currentSessionId = savedSession;
          const parsed = JSON.parse(savedData);
          document.getElementById('authScreen').style.display = 'none';
          document.getElementById('dashboardScreen').style.display = 'flex';

          globalProjectsData = parsed.projects || [];
          globalPricesData = parsed.prices || [];

          populateAllProjectSelectors();
          renderProjectsList();
          renderItemsTable();
          renderPaymentsTable();
          renderQuotationView();
          renderPricesTable();

          if (socket && socket.connected) {
            socket.emit('join_session', currentSessionId);
            socket.emit('relay_to_phone', { sessionId: currentSessionId, action: 'request_sync', data: {} });
          }
        } catch (e) {
          initSession();
        }
      } else {
        initSession();
      }
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

  // تمرير أوامر الإضافة والتعديل والحذف من شاشة الويب إلى الهاتف مباشرة
  socket.on('relay_to_phone', ({ sessionId, action, data }) => {
    io.to(sessionId).emit(action, data);
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
