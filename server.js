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
  <title>Metrix Pro - منصة إدارة المشاريع وحصر الكميات الذكية</title>
  
  <!-- مكتبات الخطوط والأيقونات والرسوم البيانية -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
    
    :root {
      --primary: #4f46e5;
      --primary-dark: #4338ca;
      --primary-light: #e0e7ff;
      --secondary: #0f172a;
      --emerald: #059669;
      --emerald-light: #dcfce7;
      --amber: #d97706;
      --amber-light: #fef3c7;
      --rose: #e11d48;
      --rose-light: #ffe4e6;
      --sky: #0284c7;
      --sky-light: #e0f2fe;
      --surface: #ffffff;
      --bg: #f8fafc;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --radius: 1rem;
      --shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      --shadow-lg: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', sans-serif; }
    body { background-color: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }

    /* ========================================= */
    /* 1. شاشة تسجيل الدخول ومسح الرمز (QR AUTH) */
    /* ========================================= */
    #authScreen {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1.5rem;
      background: radial-gradient(circle at 10% 20%, #1e1b4b 0%, #0f172a 90%);
      position: relative;
    }
    .auth-glass-card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(16px);
      border-radius: 1.75rem;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 480px;
      padding: 2.75rem 2.25rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: fadeInUp 0.4s ease-out;
    }
    .auth-badge-logo {
      width: 68px;
      height: 68px;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #fff;
      font-size: 2rem;
      border-radius: 1.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
    }
    .auth-title { font-size: 1.85rem; font-weight: 900; color: #0f172a; margin-bottom: 0.35rem; }
    .auth-subtitle { font-size: 0.92rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1.75rem; }

    .qr-frame {
      position: relative;
      display: inline-block;
      padding: 1.25rem;
      background: #ffffff;
      border-radius: 1.5rem;
      border: 2px solid #e0e7ff;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.1);
      margin-bottom: 1.25rem;
    }
    .qr-frame::before {
      content: '';
      position: absolute;
      inset: 6px;
      border: 2px dashed #818cf8;
      border-radius: 1.25rem;
      pointer-events: none;
    }
    .qr-expired-curtain {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.96);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 1.5rem;
      gap: 0.75rem;
      z-index: 10;
    }

    .auth-steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
    }
    .auth-step-item { font-size: 0.78rem; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 0.35rem; font-weight: 600; }
    .auth-step-icon { width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }

    /* ========================================= */
    /* 2. شريط التنقل العلوي (NAVBAR) */
    /* ========================================= */
    #dashboardScreen { display: none; flex-direction: column; min-height: 100vh; }
    .app-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 40;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .header-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0.75rem 1.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brand-section { display: flex; align-items: center; gap: 0.85rem; }
    .brand-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
      color: #fff;
      border-radius: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
    }
    .brand-text h2 { font-size: 1.25rem; font-weight: 900; color: var(--secondary); letter-spacing: -0.5px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      background: #ecfdf5;
      color: #059669;
      padding: 0.15rem 0.6rem;
      border-radius: 9999px;
      font-weight: 700;
      border: 1px solid #a7f3d0;
    }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pingDot 2s infinite; }

    /* التبويبات الفاخرة (Tabs) */
    .nav-tabs-wrapper {
      display: flex;
      background: #f1f5f9;
      padding: 0.35rem;
      border-radius: 0.9rem;
      gap: 0.25rem;
      overflow-x: auto;
    }
    .tab-pill {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 1.1rem;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.88rem;
      font-weight: 700;
      border-radius: 0.65rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
    }
    .tab-pill:hover { color: var(--text); background: rgba(255,255,255,0.7); }
    .tab-pill.active {
      background: var(--surface);
      color: var(--primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .tab-pill.active i { color: var(--primary); }

    /* الأزرار العلوية */
    .header-btns { display: flex; align-items: center; gap: 0.6rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.55rem 1.15rem;
      border-radius: 0.65rem;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn i { font-size: 0.95rem; }
    .btn-primary { background: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }
    .btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); }
    .btn-emerald { background: var(--emerald); color: #fff; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25); }
    .btn-emerald:hover { background: #047857; transform: translateY(-1px); }
    .btn-sky { background: var(--sky); color: #fff; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); }
    .btn-sky:hover { background: #0369a1; transform: translateY(-1px); }
    .btn-amber { background: var(--amber); color: #fff; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25); }
    .btn-amber:hover { background: #b45309; transform: translateY(-1px); }
    .btn-danger-light { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .btn-danger-light:hover { background: #fecaca; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }
    .btn-outline:hover { background: #f1f5f9; color: var(--text); }
    .btn-danger { background: var(--rose); color: #fff; }
    .btn-danger:hover { background: #be123c; }

    /* ========================================= */
    /* 3. الحاوية العامة والمحتوى */
    /* ========================================= */
    .app-viewport { flex: 1; padding: 2rem; max-width: 1440px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 1.75rem; }
    .tab-pane { display: none; flex-direction: column; gap: 1.75rem; animation: fadeIn 0.25s ease-out; }
    .tab-pane.active { display: flex; }

    /* بطاقات المؤشرات الإحصائية (KPI Cards) */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
    .kpi-card {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 1.5rem;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .kpi-card::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 4px;
      height: 100%;
      background: var(--primary);
    }
    .kpi-emerald::after { background: var(--emerald); }
    .kpi-amber::after { background: var(--amber); }
    .kpi-sky::after { background: var(--sky); }

    .kpi-info-title { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
    .kpi-info-val { font-size: 1.85rem; font-weight: 900; margin-top: 0.35rem; color: var(--secondary); letter-spacing: -0.5px; }
    .kpi-info-sub { font-size: 0.78rem; color: #94a3b8; font-weight: 600; margin-top: 0.25rem; }
    .kpi-icon-bubble {
      width: 48px;
      height: 48px;
      border-radius: 0.85rem;
      background: #f1f5f9;
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }
    .bubble-emerald { background: var(--emerald-light); color: var(--emerald); }
    .bubble-amber { background: var(--amber-light); color: var(--amber); }
    .bubble-sky { background: var(--sky-light); color: var(--sky); }

    /* شريط الأدوات والفلترة */
    .toolbar-bar {
      background: var(--surface);
      border-radius: var(--radius);
      padding: 1rem 1.5rem;
      border: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow);
    }
    .toolbar-inputs { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
    .input-icon-group { position: relative; display: flex; align-items: center; }
    .input-icon-group i { position: absolute; right: 1rem; color: #94a3b8; font-size: 0.9rem; pointer-events: none; }
    .custom-input {
      padding: 0.55rem 2.4rem 0.55rem 1rem;
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      font-size: 0.9rem;
      background: #fff;
      color: var(--text);
      outline: none;
      min-width: 250px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .custom-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12); }
    .custom-select {
      padding: 0.55rem 2rem 0.55rem 1rem;
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      font-size: 0.9rem;
      background: #fff;
      color: var(--text);
      outline: none;
      cursor: pointer;
    }

    /* بطاقات المشاريع العصرية (Project Cards) */
    .projects-masonry { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .project-item-card {
      background: var(--surface);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1.25rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .project-item-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: #cbd5e1; }
    .proj-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
    .proj-title-area h3 { font-size: 1.2rem; font-weight: 800; color: var(--secondary); margin-bottom: 0.25rem; }
    .proj-client-row { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
    .proj-date-chip { font-size: 0.75rem; background: #f1f5f9; color: #475569; padding: 0.25rem 0.65rem; border-radius: 0.5rem; font-weight: 700; }
    
    .proj-financial-bar { background: #f8fafc; padding: 0.9rem 1rem; border-radius: 0.75rem; border: 1px solid #f1f5f9; }
    .progress-track { height: 7px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; margin: 0.5rem 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 9999px; }
    .proj-fin-metrics { display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 700; }

    .proj-card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.9rem; }
    .proj-action-group { display: flex; gap: 0.4rem; }

    /* الجداول الفاخرة (Data Tables) */
    .table-container-card {
      background: var(--surface);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .table-card-top {
      padding: 1.15rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fdfdfe;
    }
    .table-card-title { font-size: 1.1rem; font-weight: 800; color: var(--secondary); display: flex; align-items: center; gap: 0.5rem; }
    
    table.metrix-table { width: 100%; border-collapse: collapse; text-align: right; font-size: 0.88rem; }
    table.metrix-table th { background: #f8fafc; color: #475569; padding: 1rem 1.25rem; font-weight: 800; border-bottom: 1px solid var(--border); white-space: nowrap; }
    table.metrix-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    table.metrix-table tr:hover td { background: #f8fafc; }

    /* شارات أنواع الأعمال الملونة */
    .job-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.65rem; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 700; }
    .job-plaster { background: #e0f2fe; color: #0369a1; }
    .job-paint { background: #f3e8ff; color: #7e22ce; }
    .job-tile { background: #fef3c7; color: #b45309; }
    .job-block { background: #ffedd5; color: #c2410c; }
    .job-gypsum { background: #f1f5f9; color: #475569; }
    .job-concrete { background: #e2e8f0; color: #1e293b; }
    .job-insulation { background: #dcfce7; color: #15803d; }
    .job-other { background: #e0e7ff; color: #4338ca; }

    /* أزرار الإجراءات في الجداول */
    .icon-action-btn { width: 34px; height: 34px; border-radius: 0.5rem; border: none; background: transparent; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; transition: all 0.15s; }
    .btn-action-edit { color: var(--primary); }
    .btn-action-edit:hover { background: var(--primary-light); }
    .btn-action-delete { color: var(--rose); }
    .btn-action-delete:hover { background: var(--rose-light); }

    /* تبويب التحليلات البيانية */
    .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .chart-panel-card { background: var(--surface); border-radius: var(--radius); padding: 1.5rem; border: 1px solid var(--border); box-shadow: var(--shadow); }

    /* ========================================================== */
    /* 4. تنسيق ملفات الـ PDF المتطابقة تماماً مع كود التطبيق      */
    /* (ProjectReportHtml & QuotationReportHtml)                  */
    /* ========================================================== */
    .pdf-report-sheet {
      background: #ffffff;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      padding: 2rem;
      position: relative;
    }

    /* هيدر تقرير حصر المشروع (ProjectReportHtml) */
    .app-report-header {
      background: linear-gradient(180deg, #1E3A8A 0%, #172554 100%);
      color: white;
      padding: 20px;
      border-radius: 14px;
      margin-bottom: 14px;
    }
    .app-report-header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .app-report-header .sub { margin-top: 6px; opacity: .9; font-size: 13px; font-weight: 600; }
    .app-report-header .chip {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,.16);
      margin-top: 10px;
      font-size: 12px;
      font-weight: 700;
    }

    /* كروت المقاييس المالية المدمجة */
    .app-report-kpi-card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 18px;
    }
    .app-report-kpi-row { display: flex; justify-content: space-between; gap: 12px; }
    .app-report-metric {
      flex: 1;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }
    .app-report-metric .k { color: #4B5563; font-size: 12px; font-weight: 700; }
    .app-report-metric .v { font-size: 17px; font-weight: 800; margin-top: 4px; }
    .app-report-metric .v.primary { color: #1E3A8A; }
    .app-report-metric .v.accent { color: #F59E0B; }

    /* جداول تقارير الـ PDF المطابقة تماماً لتطبيق الأندرويد */
    table.app-pdf-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
    }
    table.app-pdf-table th, table.app-pdf-table td {
      border: 1px solid #E5E7EB;
      padding: 9px;
      font-size: 11px;
      text-align: center;
    }
    table.app-pdf-table th {
      background: #1E3A8A;
      color: white;
      font-weight: 700;
    }
    table.app-pdf-table .totalRow {
      background: #FEF3C7;
      font-weight: 700;
    }
    table.app-pdf-table .totalRow td {
      border-top: 2px solid #F59E0B;
    }

    /* هيدر عرض السعر التقديري (QuotationReportHtml) */
    .app-quo-banner {
      background: linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%);
      color: white;
      padding: 24px;
      border-radius: 16px;
      margin-bottom: 20px;
      text-align: center;
    }
    .app-quo-banner h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
    .app-quo-banner .badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.2);
      font-size: 12px;
      font-weight: 700;
    }

    .app-quo-info-grid {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
    }
    .app-quo-info-card {
      flex: 1;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px;
    }
    .app-quo-info-card h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 800;
      color: #1E3A8A;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 4px;
    }
    .app-quo-info-row { font-size: 12px; margin-bottom: 4px; color: #334155; }
    .app-quo-info-row b { color: #0F172A; }

    .app-quo-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 45px;
      padding: 0 20px;
    }
    .app-quo-sig-box {
      text-align: center;
      font-size: 12px;
      color: #4B5563;
      width: 170px;
    }
    .app-quo-sig-line {
      border-top: 1px dashed #9CA3AF;
      margin-top: 40px;
      padding-top: 6px;
      font-weight: 700;
    }
    .app-quo-footer-note {
      margin-top: 35px;
      text-align: center;
      font-size: 11px;
      color: #9CA3AF;
      border-top: 1px solid #E2E8F0;
      padding-top: 10px;
    }

    /* ========================================= */
    /* 5. النوافذ المنبثقة التفاعلية (MODALS) */
    /* ========================================= */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 1.5rem;
    }
    .modal-dialog {
      background: var(--surface);
      border-radius: 1.25rem;
      width: 100%;
      max-width: 620px;
      box-shadow: 0 25px 60px -15px rgba(0,0,0,0.3);
      border: 1px solid var(--border);
      overflow: hidden;
      animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-dialog-header {
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
    }
    .modal-dialog-title { font-size: 1.2rem; font-weight: 800; color: var(--secondary); display: flex; align-items: center; gap: 0.5rem; }
    .btn-close-modal { width: 32px; height: 32px; border-radius: 50%; border: none; background: #e2e8f0; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
    .btn-close-modal:hover { background: #cbd5e1; color: var(--secondary); }

    .modal-dialog-body { padding: 1.75rem; display: flex; flex-direction: column; gap: 1.15rem; max-height: 75vh; overflow-y: auto; }
    .form-field { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-field label { font-size: 0.86rem; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 0.35rem; }
    .form-field input, .form-field select, .form-field textarea {
      padding: 0.65rem 0.95rem;
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      font-size: 0.92rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }
    .modal-dialog-footer {
      padding: 1.1rem 1.75rem;
      background: #f8fafc;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
    .grid-3col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem; }

    /* حركات وتأثيرات */
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes pingDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } }

    /* ========================================= */
    /* 6. أنماط الطباعة الرسمية النظيفة (Print CSS) */
    /* ========================================= */
    @media print {
      @page { size: A4; margin: 10mm; }
      body { background: #ffffff !important; color: #111827 !important; margin: 0; padding: 0; font-family: Arial, sans-serif !important; }
      .app-header, .toolbar-bar, .btn, .icon-action-btn, #authScreen, .nav-tabs-wrapper, .modal-overlay, .tab-pill, .report-nav-strip { display: none !important; }
      #dashboardScreen { display: block !important; }
      .app-viewport { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
      .tab-pane { display: none !important; }
      .tab-pane.active { display: block !important; }
      .pdf-report-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }
      table.app-pdf-table th { background: #1E3A8A !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .app-report-header, .app-quo-banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .totalRow { background: #FEF3C7 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- ========================================= -->
  <!-- 1. شاشة تسجيل الدخول ومسح الرمز (QR AUTH) -->
  <!-- ========================================= -->
  <div id="authScreen">
    <div class="auth-glass-card">
      <div class="auth-badge-logo">
        <i class="fa-solid fa-compass-drafting"></i>
      </div>
      <h1 class="auth-title">منصة Metrix Web</h1>
      <p class="auth-subtitle">امسح رمز الاستجابة السريعة (QR) من تطبيق الهاتف عبر خيار <b>[ربط المتصفح]</b> لفتح لوحة التحكم الشاملة.</p>

      <div class="qr-frame">
        <div id="qrcode"></div>
        <div id="qrOverlay" class="qr-expired-curtain">
          <i class="fa-solid fa-clock-rotate-left" style="font-size: 2.2rem; color: var(--rose);"></i>
          <p style="color: var(--rose); font-weight: 800; font-size: 0.95rem;">انتهت صلاحية الرمز المؤقت</p>
          <button onclick="initSession()" class="btn btn-primary" style="padding: 0.5rem 1.25rem;">
            <i class="fa-solid fa-arrows-rotate"></i> تحديث الرمز
          </button>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.5rem 1rem; border-radius:0.75rem; border:1px solid #e2e8f0; font-size:0.85rem;">
        <span style="color:var(--text-muted);"><i class="fa-regular fa-clock"></i> صلاحية الرمز:</span>
        <span id="timerText" style="font-weight:800; color:var(--primary);">60 ثانية</span>
      </div>

      <div class="auth-steps">
        <div class="auth-step-item">
          <div class="auth-step-icon"><i class="fa-solid fa-mobile-screen"></i></div>
          <span>1. افتح تطبيق Metrix</span>
        </div>
        <div class="auth-step-item">
          <div class="auth-step-icon"><i class="fa-solid fa-bars"></i></div>
          <span>2. اختر ربط المتصفح</span>
        </div>
        <div class="auth-step-item">
          <div class="auth-step-icon"><i class="fa-solid fa-qrcode"></i></div>
          <span>3. وجه الكاميرا للرمز</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ========================================= -->
  <!-- 2. لوحة التحكم الشاملة لسطح المكتب -->
  <!-- ========================================= -->
  <div id="dashboardScreen">
    <header class="app-header">
      <div class="header-container">
        
        <div class="brand-section">
          <div class="brand-icon">
            <i class="fa-solid fa-ruler-combined"></i>
          </div>
          <div class="brand-text">
            <h2>Metrix Pro Desktop</h2>
            <div class="status-badge" id="headerStatusBadge">
              <div class="pulse-dot" id="headerStatusDot"></div>
              <span id="headerStatusText">متصل مباشر بالهاتف</span>
            </div>
          </div>
        </div>

        <!-- التبويبات الرئيسية -->
        <nav class="nav-tabs-wrapper">
          <button onclick="switchTab('tabProjects')" id="btnTabProjects" class="tab-pill active">
            <i class="fa-solid fa-city"></i> المشاريع
          </button>
          <button onclick="switchTab('tabItems')" id="btnTabItems" class="tab-pill">
            <i class="fa-solid fa-calculator"></i> حصر الكميات
          </button>
          <button onclick="switchTab('tabPayments')" id="btnTabPayments" class="tab-pill">
            <i class="fa-solid fa-file-invoice-dollar"></i> الدفعات والمالية
          </button>
          <button onclick="switchTab('tabAnalytics')" id="btnTabAnalytics" class="tab-pill">
            <i class="fa-solid fa-chart-pie"></i> التحليلات
          </button>
          <button onclick="switchTab('tabReports')" id="btnTabReports" class="tab-pill">
            <i class="fa-solid fa-file-pdf"></i> تقارير و PDF
          </button>
          <button onclick="switchTab('tabPrices')" id="btnTabPrices" class="tab-pill">
            <i class="fa-solid fa-sliders"></i> دليل الأسعار
          </button>
        </nav>

        <!-- أدوات التحكم والطباعة والخروج -->
        <div class="header-btns">
          <button onclick="window.print()" class="btn btn-sky" title="طباعة الصفحة الحالية">
            <i class="fa-solid fa-print"></i> طباعة
          </button>
          <button onclick="exportComprehensiveExcel()" class="btn btn-emerald" title="تصدير إكسل شامل">
            <i class="fa-solid fa-file-excel"></i> إكسل
          </button>
          <button onclick="logout()" class="btn btn-danger-light" title="قطع الاتصال وتسجيل الخروج">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> خروج
          </button>
        </div>

      </div>
    </header>

    <main class="app-viewport">

      <!-- ========================================== -->
      <!-- 1. تبويب المشاريع (PROJECTS TAB) -->
      <!-- ========================================== -->
      <section id="tabProjects" class="tab-pane active">
        <div class="kpi-grid">
          <div class="kpi-card">
            <div>
              <div class="kpi-info-title">إجمالي المشاريع المسجلة</div>
              <div id="kpiProjectsCount" class="kpi-info-val">0</div>
              <div class="kpi-info-sub">مشروع في قاعدة بيانات الهاتف</div>
            </div>
            <div class="kpi-icon-bubble"><i class="fa-solid fa-building-wheat"></i></div>
          </div>
          <div class="kpi-card">
            <div>
              <div class="kpi-info-title">إجمالي بنود الحصر</div>
              <div id="kpiItemsCount" class="kpi-info-val" style="color:var(--primary);">0</div>
              <div class="kpi-info-sub">غرفة وبند قياس هندسي</div>
            </div>
            <div class="kpi-icon-bubble bubble-sky"><i class="fa-solid fa-ruler-horizontal"></i></div>
          </div>
          <div class="kpi-card kpi-emerald">
            <div>
              <div class="kpi-info-title">إجمالي القيمة التعاقدية</div>
              <div id="kpiTotalAmount" class="kpi-info-val" style="color:var(--emerald);">0 ر.س</div>
              <div class="kpi-info-sub">إجمالي مبالغ الحصر التقديرية</div>
            </div>
            <div class="kpi-icon-bubble bubble-emerald"><i class="fa-solid fa-sack-dollar"></i></div>
          </div>
          <div class="kpi-card kpi-amber">
            <div>
              <div class="kpi-info-title">إجمالي المقبوض الفعلي</div>
              <div id="kpiTotalPaid" class="kpi-info-val" style="color:var(--amber);">0 ر.س</div>
              <div class="kpi-info-sub">سندات القبض والدفعات المستلمة</div>
            </div>
            <div class="kpi-icon-bubble bubble-amber"><i class="fa-solid fa-hand-holding-dollar"></i></div>
          </div>
        </div>

        <div class="toolbar-bar">
          <div class="toolbar-inputs">
            <div class="input-icon-group">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="projectSearchInput" oninput="renderProjectsList()" placeholder="ابحث باسم المشروع، العميل، الهاتف..." class="custom-input" style="min-width:320px;" />
            </div>
          </div>
          <button onclick="openNewProjectModal()" class="btn btn-primary">
            <i class="fa-solid fa-folder-plus"></i> إضافة مشروع جديد للهاتف
          </button>
        </div>

        <div id="projectsContainer" class="projects-masonry"></div>
      </section>

      <!-- ========================================== -->
      <!-- 2. تبويب حصر الكميات (ITEMS SURVEY TAB) -->
      <!-- ========================================== -->
      <section id="tabItems" class="tab-pane">
        <div class="toolbar-bar">
          <div class="toolbar-inputs">
            <div class="input-icon-group">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="itemsSearchInput" oninput="renderItemsTable()" placeholder="ابحث في أسماء البنود..." class="custom-input" />
            </div>
            <select id="itemsProjectFilter" onchange="renderItemsTable()" class="custom-select"></select>
            <select id="itemsJobTypeFilter" onchange="renderItemsTable()" class="custom-select"></select>
          </div>
          <button onclick="openNewItemModal()" class="btn btn-emerald">
            <i class="fa-solid fa-plus-circle"></i> إضافة بند حصر جديد
          </button>
        </div>

        <div class="table-container-card">
          <div class="table-card-top">
            <div class="table-card-title">
              <i class="fa-solid fa-list-check" style="color:var(--primary);"></i>
              <span>جدول حصر الكميات والمقاسات الهندسية الصافية</span>
            </div>
            <div style="font-size:0.86rem; color:var(--text-muted); font-weight:700;">
              عدد البنود: <span id="displayedItemsCount" style="color:var(--primary);">0</span>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="metrix-table">
              <thead>
                <tr>
                  <th>المشروع</th>
                  <th>اسم البند / الغرفة</th>
                  <th>نوع العمل</th>
                  <th>الأبعاد (ط × ع × ار)</th>
                  <th>الفراغات المخصومة</th>
                  <th>الكمية الصافية</th>
                  <th>سعر المتر</th>
                  <th>المبلغ الإجمالي</th>
                  <th style="text-align:center;">إجراء</th>
                </tr>
              </thead>
              <tbody id="itemsTableBody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 3. تبويب الدفعات والمالية (PAYMENTS TAB) -->
      <!-- ========================================== -->
      <section id="tabPayments" class="tab-pane">
        <div class="kpi-grid">
          <div class="kpi-card">
            <div>
              <div class="kpi-info-title">إجمالي العقود المحددة</div>
              <div id="statPayTotalContracts" class="kpi-info-val">0 ر.س</div>
              <div class="kpi-info-sub">القيمة الإجمالية للمشروع المختار</div>
            </div>
            <div class="kpi-icon-bubble"><i class="fa-solid fa-file-contract"></i></div>
          </div>
          <div class="kpi-card kpi-emerald">
            <div>
              <div class="kpi-info-title">إجمالي المقبوض</div>
              <div id="statPayTotalReceived" class="kpi-info-val" style="color:var(--emerald);">0 ر.س</div>
              <div class="kpi-info-sub">الدفعات المحصلة بالفعل</div>
            </div>
            <div class="kpi-icon-bubble bubble-emerald"><i class="fa-solid fa-circle-check"></i></div>
          </div>
          <div class="kpi-card" style="border-right: 4px solid var(--rose);">
            <div>
              <div class="kpi-info-title">المتبقي للتحصيل</div>
              <div id="statPayTotalRemaining" class="kpi-info-val" style="color:var(--rose);">0 ر.س</div>
              <div class="kpi-info-sub">رصيد العميل المستحق للقبض</div>
            </div>
            <div class="kpi-icon-bubble" style="background:var(--rose-light); color:var(--rose);"><i class="fa-solid fa-hourglass-half"></i></div>
          </div>
        </div>

        <div class="toolbar-bar">
          <div class="toolbar-inputs">
            <select id="paymentProjectFilter" onchange="renderPaymentsTable()" class="custom-select"></select>
          </div>
          <button onclick="openNewPaymentModal()" class="btn btn-amber">
            <i class="fa-solid fa-receipt"></i> إضافة سند قبض / دفعة مالية
          </button>
        </div>

        <div class="table-container-card">
          <div class="table-card-top">
            <div class="table-card-title">
              <i class="fa-solid fa-money-bill-wave" style="color:var(--amber);"></i>
              <span>سجل سندات القبض والدفعات المستلمة</span>
            </div>
            <div style="font-size:0.86rem; color:var(--text-muted); font-weight:700;">
              عدد السندات: <span id="displayedPaymentsCount" style="color:var(--amber);">0</span>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table class="metrix-table">
              <thead>
                <tr>
                  <th>المشروع</th>
                  <th>المبلغ المستلم</th>
                  <th>نوع العمل / المرحلة</th>
                  <th>ملاحظات السند / طريقة الدفع</th>
                  <th>تاريخ الاستلام</th>
                  <th style="text-align:center;">إجراء</th>
                </tr>
              </thead>
              <tbody id="paymentsTableBody"></tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 4. تبويب التحليلات البيانية (ANALYTICS TAB) -->
      <!-- ========================================== -->
      <section id="tabAnalytics" class="tab-pane">
        <div class="analytics-grid">
          <div class="chart-panel-card">
            <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
              <i class="fa-solid fa-chart-pie" style="color:var(--primary);"></i>
              توزيع تكلفة الأعمال حسب البنود (ر.س)
            </h3>
            <div style="position:relative; height:300px; display:flex; align-items:center; justify-content:center;">
              <canvas id="jobTypesPieChart"></canvas>
            </div>
          </div>
          <div class="chart-panel-card">
            <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
              <i class="fa-solid fa-chart-column" style="color:var(--emerald);"></i>
              الكميات المقدرة لكل نوع عمل (متر/م2/م3)
            </h3>
            <div style="position:relative; height:300px; display:flex; align-items:center; justify-content:center;">
              <canvas id="jobTypesBarChart"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- ========================================== -->
      <!-- 5. تبويب التقارير وملفات الـ PDF المنسقة    -->
      <!-- ========================================== -->
      <section id="tabReports" class="tab-pane">
        <div class="toolbar-bar">
          <div class="toolbar-inputs">
            <label style="font-size:0.88rem; font-weight:700;"><i class="fa-solid fa-folder"></i> المشروع:</label>
            <select id="reportProjectSelect" onchange="renderActiveReport()" class="custom-select"></select>

            <!-- التبديل بين نوعي التقرير المطابقين تماماً للتطبيق -->
            <div class="report-nav-strip" style="display:flex; background:#f1f5f9; padding:0.25rem; border-radius:0.65rem; gap:0.25rem; margin-right:0.5rem;">
              <button onclick="setReportType('projectReport')" id="btnReportTypeProject" class="tab-pill active" style="padding:0.4rem 0.9rem; font-size:0.82rem;">
                <i class="fa-solid fa-file-lines"></i> تقرير حصر كميات المشروع
              </button>
              <button onclick="setReportType('quotationReport')" id="btnReportTypeQuo" class="tab-pill" style="padding:0.4rem 0.9rem; font-size:0.82rem;">
                <i class="fa-solid fa-file-contract"></i> عرض سعر تقديري رسمي
              </button>
            </div>
          </div>

          <div style="display:flex; gap:0.75rem; align-items:center;">
            <button onclick="window.print()" class="btn btn-primary">
              <i class="fa-solid fa-print"></i> طباعة كـ PDF (A4)
            </button>
          </div>
        </div>

        <!-- ورقة التقرير المنسقة بنمط الـ PDF الأصلي في تطبيق Metrix -->
        <div id="pdfReportViewer" class="pdf-report-sheet"></div>
      </section>

      <!-- ========================================== -->
      <!-- 6. تبويب دليل وتعديل الأسعار (PRICES TAB) -->
      <!-- ========================================== -->
      <section id="tabPrices" class="tab-pane">
        <div class="table-container-card">
          <div class="table-card-top">
            <div class="table-card-title">
              <i class="fa-solid fa-sliders" style="color:var(--primary);"></i>
              <span>دليل أسعار بنود الأعمال والتشطيبات الافتراضية</span>
            </div>
            <span class="status-badge"><i class="fa-solid fa-cloud-arrow-up"></i> محفوظ ومزامن بالهاتف</span>
          </div>
          <div style="padding:1.5rem;">
            <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.5rem; line-height:1.6;">
              يمكنك هنا ضبط أسعار المتر الافتراضية لكل بند. عند تحديث أي سعر، سيتم حفظه فوراً في قاعدة بيانات الهاتف واستخدامه تلقائياً عند إضافة بنود حصر جديدة.
            </p>
            <div style="overflow-x:auto;">
              <table class="metrix-table">
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
  <div id="newProjectModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-dialog-header">
        <div class="modal-dialog-title"><i class="fa-solid fa-folder-plus" style="color:var(--primary);"></i> إضافة مشروع جديد إلى الهاتف</div>
        <button onclick="closeModal('newProjectModal')" class="btn-close-modal">&times;</button>
      </div>
      <div class="modal-dialog-body">
        <div class="form-field">
          <label><i class="fa-solid fa-tag"></i> اسم المشروع *</label>
          <input type="text" id="newProjName" placeholder="مثلاً: فيلا حي الياسمين" />
        </div>
        <div class="grid-2col">
          <div class="form-field">
            <label><i class="fa-solid fa-user"></i> اسم العميل</label>
            <input type="text" id="newProjClient" placeholder="اسم مالك المشروع" />
          </div>
          <div class="form-field">
            <label><i class="fa-solid fa-phone"></i> رقم جوال العميل</label>
            <input type="tel" id="newProjMobile" placeholder="05xxxxxxxx" />
          </div>
        </div>
        <div class="form-field">
          <label><i class="fa-solid fa-calendar-days"></i> تاريخ المشروع</label>
          <input type="date" id="newProjDate" />
        </div>
        <div class="form-field">
          <label><i class="fa-solid fa-note-sticky"></i> ملاحظات / وصف المشروع</label>
          <textarea id="newProjDesc" rows="2" placeholder="ملاحظات العقد أو الموقع..."></textarea>
        </div>
      </div>
      <div class="modal-dialog-footer">
        <button onclick="closeModal('newProjectModal')" class="btn btn-outline">إلغاء</button>
        <button onclick="submitNewProject()" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> حفظ في الهاتف</button>
      </div>
    </div>
  </div>

  <!-- نافذة تعديل مشروع -->
  <div id="editProjectModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-dialog-header">
        <div class="modal-dialog-title"><i class="fa-solid fa-pen-to-square" style="color:var(--sky);"></i> تعديل بيانات المشروع</div>
        <button onclick="closeModal('editProjectModal')" class="btn-close-modal">&times;</button>
      </div>
      <div class="modal-dialog-body">
        <input type="hidden" id="editProjId" />
        <div class="form-field">
          <label><i class="fa-solid fa-tag"></i> اسم المشروع *</label>
          <input type="text" id="editProjName" />
        </div>
        <div class="grid-2col">
          <div class="form-field">
            <label><i class="fa-solid fa-user"></i> اسم العميل</label>
            <input type="text" id="editProjClient" />
          </div>
          <div class="form-field">
            <label><i class="fa-solid fa-phone"></i> رقم جوال العميل</label>
            <input type="tel" id="editProjMobile" />
          </div>
        </div>
        <div class="form-field">
          <label><i class="fa-solid fa-calendar-days"></i> تاريخ المشروع</label>
          <input type="date" id="editProjDate" />
        </div>
        <div class="form-field">
          <label><i class="fa-solid fa-note-sticky"></i> ملاحظات / وصف المشروع</label>
          <textarea id="editProjDesc" rows="2"></textarea>
        </div>
      </div>
      <div class="modal-dialog-footer">
        <button onclick="closeModal('editProjectModal')" class="btn btn-outline">إلغاء</button>
        <button onclick="submitEditProject()" class="btn btn-sky"><i class="fa-solid fa-check"></i> حفظ التعديلات في الهاتف</button>
      </div>
    </div>
  </div>

  <!-- نافذة إضافة بند حصر جديد -->
  <div id="newItemModal" class="modal-overlay">
    <div class="modal-dialog" style="max-width: 660px;">
      <div class="modal-dialog-header">
        <div class="modal-dialog-title"><i class="fa-solid fa-calculator" style="color:var(--emerald);"></i> إضافة بند حصر هندسي إلى الهاتف</div>
        <button onclick="closeModal('newItemModal')" class="btn-close-modal">&times;</button>
      </div>
      <div class="modal-dialog-body">
        <div class="grid-2col">
          <div class="form-field">
            <label><i class="fa-solid fa-folder"></i> المشروع التابع له *</label>
            <select id="modalItemProjectSelect"></select>
          </div>
          <div class="form-field">
            <label><i class="fa-solid fa-signature"></i> اسم البند / الغرفة *</label>
            <input type="text" id="newItemTitle" placeholder="مجلس الضيوف، غرفة نوم 1..." />
          </div>
        </div>

        <div class="grid-2col">
          <div class="form-field">
            <label><i class="fa-solid fa-hammer"></i> نوع العمل</label>
            <select id="newItemJobType" onchange="onJobTypeChanged('newItemJobType', 'newItemPrice', calculateLiveItem)">
              <option value="PLASTER_IN">تلييس داخلي</option>
              <option value="PLASTER_OUT">تلييس خارجي</option>
              <option value="PAINT_IN">دهانات داخلية</option>
              <option value="PAINT_OUT">دهانات خارجية</option>
              <option value="TILES">بلاط</option>
              <option value="DOORS">أبواب</option>
              <option value="WINDOWS">نوافذ</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div class="form-field">
            <label><i class="fa-solid fa-compass"></i> طريقة الحساب</label>
            <select id="newItemCalcMode" onchange="calculateLiveItem()">
              <option value="WALLS">جدران / حوائط (محيط × ارتفاع)</option>
              <option value="SURFACE">سقف / أرضيات / مسطح (طول × عرض)</option>
              <option value="BOTH">جدران + سقف / أرضيات معاً</option>
            </select>
          </div>
        </div>

        <div class="grid-3col">
          <div class="form-field">
            <label>الطول (م)</label>
            <input type="number" step="0.01" id="newItemLength" oninput="calculateLiveItem()" placeholder="0.00" />
          </div>
          <div class="form-field">
            <label>العرض (م)</label>
            <input type="number" step="0.01" id="newItemWidth" oninput="calculateLiveItem()" placeholder="0.00" />
          </div>
          <div class="form-field">
            <label>الارتفاع (م)</label>
            <input type="number" step="0.01" id="newItemHeight" oninput="calculateLiveItem()" placeholder="0.00" />
          </div>
        </div>

        <div class="grid-3col">
          <div class="form-field">
            <label id="newItemWallCountLabel">عدد الجدران (1-4) / التكرار</label>
            <input type="number" step="1" id="newItemWallCount" value="4" oninput="calculateLiveItem()" />
          </div>
          <div class="form-field">
            <label>خصم الأبواب (م2)</label>
            <input type="number" step="0.01" id="newItemDoorsVoid" value="0" oninput="calculateLiveItem()" />
          </div>
          <div class="form-field">
            <label>خصم النوافذ (م2)</label>
            <input type="number" step="0.01" id="newItemWindowsVoid" value="0" oninput="calculateLiveItem()" />
          </div>
        </div>

        <div class="grid-3col">
          <div class="form-field">
            <label>سعر المتر (ر.س)</label>
            <input type="number" step="0.1" id="newItemPrice" oninput="calculateLiveItem()" placeholder="0" />
          </div>
          <div class="form-field">
            <label>الكمية الصافية المحسوبة</label>
            <input type="text" id="newItemCalcMeters" readonly style="background:#f8fafc; font-weight:800; color:var(--primary);" value="0" />
          </div>
          <div class="form-field">
            <label>المبلغ الإجمالي</label>
            <input type="text" id="newItemCalcAmount" readonly style="background:#f8fafc; font-weight:800; color:var(--emerald);" value="0 ر.س" />
          </div>
        </div>
      </div>
      <div class="modal-dialog-footer">
        <button onclick="closeModal('newItemModal')" class="btn btn-outline">إلغاء</button>
        <button onclick="submitNewItem()" class="btn btn-emerald"><i class="fa-solid fa-paper-plane"></i> إرسال وحفظ في الهاتف</button>
      </div>
    </div>
  </div>

  <!-- نافذة تعديل بند حصر -->
  <div id="editItemModal" class="modal-overlay">
    <div class="modal-dialog" style="max-width: 660px;">
      <div class="modal-dialog-header">
        <div class="modal-dialog-title"><i class="fa-solid fa-pen-to-square" style="color:var(--sky);"></i> تعديل بند حصر هندسي</div>
        <button onclick="closeModal('editItemModal')" class="btn-close-modal">&times;</button>
      </div>
      <div class="modal-dialog-body">
        <input type="hidden" id="editItemId" />
        <div class="grid-2col">
          <div class="form-field">
            <label><i class="fa-solid fa-folder"></i> المشروع التابع له *</label>
            <select id="editItemProjectSelect"></select>
          </div>
          <div class="form-field">
            <label><i class="fa-solid fa-signature"></i> اسم البند / الغرفة *</label>
            <input type="text" id="editItemTitle" />
          </div>
        </div>

        <div class="grid-2col">
          <div class="form-field">
            <label><i class="fa-solid fa-hammer"></i> نوع العمل</label>
            <select id="editItemJobType" onchange="calculateLiveEditItem()">
              <option value="PLASTER_IN">تلييس داخلي</option>
              <option value="PLASTER_OUT">تلييس خارجي</option>
              <option value="PAINT_IN">دهانات داخلية</option>
              <option value="PAINT_OUT">دهانات خارجية</option>
              <option value="TILES">بلاط</option>
              <option value="DOORS">أبواب</option>
              <option value="WINDOWS">نوافذ</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div class="form-field">
            <label><i class="fa-solid fa-compass"></i> طريقة الحساب</label>
            <select id="editItemCalcMode" onchange="calculateLiveEditItem()">
              <option value="WALLS">جدران / حوائط (محيط × ارتفاع)</option>
              <option value="SURFACE">سقف / أرضيات / مسطح (طول × عرض)</option>
              <option value="BOTH">جدران + سقف / أرضيات معاً</option>
            </select>
          </div>
        </div>

        <div class="grid-3col">
          <div class="form-field">
            <label>الطول (م)</label>
            <input type="number" step="0.01" id="editItemLength" oninput="calculateLiveEditItem()" />
          </div>
          <div class="form-field">
            <label>العرض (م)</label>
            <input type="number" step="0.01" id="editItemWidth" oninput="calculateLiveEditItem()" />
          </div>
          <div class="form-field">
            <label>الارتفاع (م)</label>
            <input type="number" step="0.01" id="editItemHeight" oninput="calculateLiveEditItem()" />
          </div>
        </div>

        <div class="grid-3col">
          <div class="form-field">
            <label>عدد الجدران / التكرار</label>
            <input type="number" step="1" id="editItemWallCount" oninput="calculateLiveEditItem()" />
          </div>
          <div class="form-field">
            <label>خصم الأبواب (م2)</label>
            <input type="number" step="0.01" id="editItemDoorsVoid" oninput="calculateLiveEditItem()" />
          </div>
          <div class="form-field">
            <label>خصم النوافذ (م2)</label>
            <input type="number" step="0.01" id="editItemWindowsVoid" oninput="calculateLiveEditItem()" />
          </div>
        </div>

        <div class="grid-3col">
          <div class="form-field">
            <label>سعر المتر (ر.س)</label>
            <input type="number" step="0.1" id="editItemPrice" oninput="calculateLiveEditItem()" />
          </div>
          <div class="form-field">
            <label>الكمية الصافية المحسوبة</label>
            <input type="text" id="editItemCalcMeters" readonly style="background:#f8fafc; font-weight:800; color:var(--primary);" />
          </div>
          <div class="form-field">
            <label>المبلغ الإجمالي</label>
            <input type="text" id="editItemCalcAmount" readonly style="background:#f8fafc; font-weight:800; color:var(--emerald);" />
          </div>
        </div>
      </div>
      <div class="modal-dialog-footer">
        <button onclick="closeModal('editItemModal')" class="btn btn-outline">إلغاء</button>
        <button onclick="submitEditItem()" class="btn btn-sky"><i class="fa-solid fa-check"></i> حفظ التعديل في الهاتف</button>
      </div>
    </div>
  </div>

  <!-- نافذة إضافة دفعة مالية جديدة -->
  <div id="newPaymentModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-dialog-header">
        <div class="modal-dialog-title"><i class="fa-solid fa-receipt" style="color:var(--amber);"></i> إضافة سند قبض إلى الهاتف</div>
        <button onclick="closeModal('newPaymentModal')" class="btn-close-modal">&times;</button>
      </div>
      <div class="modal-dialog-body">
        <div class="form-field">
          <label><i class="fa-solid fa-folder"></i> المشروع *</label>
          <select id="modalPaymentProjectSelect"></select>
        </div>
        <div class="grid-2col">
          <div class="form-field">
            <label><i class="fa-solid fa-money-bill-1-wave"></i> المبلغ المستلم (ر.س) *</label>
            <input type="number" step="0.01" id="newPayAmount" placeholder="0.00" />
          </div>
          <div class="form-field">
            <label><i class="fa-solid fa-layer-group"></i> نوع العمل / المرحلة</label>
            <input type="text" id="newPayJobType" placeholder="دفعة مقدمة، لياسة، بلاط..." />
          </div>
        </div>
        <div class="form-field">
          <label><i class="fa-solid fa-note-sticky"></i> ملاحظات السند / رقم الحوالة</label>
          <textarea id="newPayNote" rows="2" placeholder="ملاحظات الاستلام..."></textarea>
        </div>
      </div>
      <div class="modal-dialog-footer">
        <button onclick="closeModal('newPaymentModal')" class="btn btn-outline">إلغاء</button>
        <button onclick="submitNewPayment()" class="btn btn-amber"><i class="fa-solid fa-floppy-disk"></i> حفظ الدفعة في الهاتف</button>
      </div>
    </div>
  </div>

  <!-- نافذة تعديل دفعة مالية -->
  <div id="editPaymentModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-dialog-header">
        <div class="modal-dialog-title"><i class="fa-solid fa-pen-to-square" style="color:var(--sky);"></i> تعديل سند الدفعة المالية</div>
        <button onclick="closeModal('editPaymentModal')" class="btn-close-modal">&times;</button>
      </div>
      <div class="modal-dialog-body">
        <input type="hidden" id="editPayId" />
        <div class="form-field">
          <label><i class="fa-solid fa-folder"></i> المشروع *</label>
          <select id="editPaymentProjectSelect"></select>
        </div>
        <div class="grid-2col">
          <div class="form-field">
            <label><i class="fa-solid fa-money-bill-1-wave"></i> المبلغ المستلم (ر.س) *</label>
            <input type="number" step="0.01" id="editPayAmount" />
          </div>
          <div class="form-field">
            <label><i class="fa-solid fa-layer-group"></i> نوع العمل / المرحلة</label>
            <input type="text" id="editPayJobType" />
          </div>
        </div>
        <div class="form-field">
          <label><i class="fa-solid fa-note-sticky"></i> ملاحظات السند</label>
          <textarea id="editPayNote" rows="2"></textarea>
        </div>
      </div>
      <div class="modal-dialog-footer">
        <button onclick="closeModal('editPaymentModal')" class="btn btn-outline">إلغاء</button>
        <button onclick="submitEditPayment()" class="btn btn-sky"><i class="fa-solid fa-check"></i> حفظ التعديل في الهاتف</button>
      </div>
    </div>
  </div>

  <!-- نافذة تأكيد الحذف بالرقم السري (PIN SECURITY MODAL) -->
  <div id="deleteConfirmModal" class="modal-overlay">
    <div class="modal-dialog" style="max-width: 440px;">
      <div class="modal-dialog-header" style="background:#fff1f2;">
        <div class="modal-dialog-title" style="color:var(--rose);"><i class="fa-solid fa-shield-halved"></i> تأكيد الحذف برقم الأمان</div>
        <button onclick="closeModal('deleteConfirmModal')" class="btn-close-modal">&times;</button>
      </div>
      <div class="modal-dialog-body" style="text-align: center;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 0.5rem auto;">
          <i class="fa-solid fa-trash-can"></i>
        </div>
        <p style="font-size: 0.92rem; color: #475569; line-height: 1.6;" id="deleteConfirmPromptText">
          هذا الإجراء سيقوم بحذف هذا العنصر نهائياً من قاعدة بيانات الهاتف.
        </p>
        <div class="form-field" style="margin-top: 1rem; text-align: right;">
          <label style="color: #b91c1c;"><i class="fa-solid fa-key"></i> أدخل الرقم السري للتطبيق (Passcode) *</label>
          <input type="password" id="deletePasscodeInput" style="font-size: 1.3rem; text-align: center; letter-spacing: 5px;" placeholder="••••" />
          <span style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">إذا لم تكن قد عيّنت رقماً سرياً في إعدادات التطبيق، اضغط تأكيد مباشرة.</span>
        </div>
      </div>
      <div class="modal-dialog-footer" style="background:#fff1f2;">
        <button onclick="closeModal('deleteConfirmModal')" class="btn btn-outline">إلغاء</button>
        <button onclick="executeConfirmedDelete()" class="btn btn-danger"><i class="fa-solid fa-trash-can"></i> تأكيد الحذف النهائي</button>
      </div>
    </div>
  </div>

  <script>
    let socket;
    let currentSessionId = '';
    let countdownInterval;
    let globalProjectsData = [];
    let globalPricesData = [];
    let pendingDeleteType = '';
    let pendingDeleteId = null;

    let activeReportType = 'projectReport'; // 'projectReport' or 'quotationReport'

    let pieChartInstance = null;
    let barChartInstance = null;

    // إشعار فوري (Toast)
    function showToast(msg, isSuccess = true) {
      let toast = document.getElementById('metrixToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'metrixToast';
        toast.style.cssText = 'position:fixed; bottom:24px; left:50%; transform:translateX(-50%); padding:0.75rem 1.5rem; border-radius:9999px; font-weight:700; font-size:0.9rem; z-index:99999; box-shadow:0 10px 25px rgba(0,0,0,0.2); transition:all 0.3s ease; display:flex; align-items:center; gap:0.5rem; pointer-events:none;';
        document.body.appendChild(toast);
      }
      toast.style.background = isSuccess ? '#059669' : '#dc2626';
      toast.style.color = '#ffffff';
      toast.innerHTML = (isSuccess ? '<i class="fa-solid fa-circle-check"></i> ' : '<i class="fa-solid fa-triangle-exclamation"></i> ') + msg;
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(toast.timeout);
      toast.timeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
      }, 3500);
    }

    function updateConnectionBadge(connected) {
      const badge = document.getElementById('headerStatusBadge');
      const dot = document.getElementById('headerStatusDot');
      const text = document.getElementById('headerStatusText');
      if (!badge || !dot || !text) return;
      if (connected) {
        badge.style.background = '#ecfdf5';
        badge.style.color = '#059669';
        badge.style.borderColor = '#a7f3d0';
        dot.style.background = '#10b981';
        text.textContent = 'متصل مباشر بالهاتف';
      } else {
        badge.style.background = '#fef2f2';
        badge.style.color = '#dc2626';
        badge.style.borderColor = '#fecaca';
        dot.style.background = '#ef4444';
        text.textContent = 'غير متصل بالهاتف';
      }
    }

    function reRenderAll() {
      try {
        localStorage.setItem('metrix_cached_data', JSON.stringify({
          projects: globalProjectsData,
          prices: globalPricesData
        }));
      } catch(e) {}
      populateAllProjectSelectors();
      renderProjectsList();
      renderItemsTable();
      renderPaymentsTable();
      renderActiveReport();
      renderPricesTable();
      renderAnalyticsCharts();
    }

    // الاتصال بالخادم السحابي
    function initSocket() {
      socket = io();

      socket.on('connect', () => {
        updateConnectionBadge(true);
        if (currentSessionId) {
          socket.emit('join_session', currentSessionId);
          socket.emit('relay_to_phone', { sessionId: currentSessionId, action: 'request_sync', data: {} });
        }
      });

      socket.on('disconnect', () => {
        updateConnectionBadge(false);
      });

      socket.on('authenticated', (data) => {
        clearInterval(countdownInterval);
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'flex';
        updateConnectionBadge(true);

        try {
          localStorage.setItem('metrix_session_id', currentSessionId);
          localStorage.setItem('metrix_cached_data', JSON.stringify(data));
        } catch(e) {}

        globalProjectsData = data.projects || [];
        globalPricesData = data.prices || [];

        reRenderAll();
      });

      socket.on('security_error', (data) => {
        alert('❌ تنبيه أمان: ' + (data.message || 'الرقم السري غير صحيح! تم رفض عملية الحذف.'));
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
        width: 210,
        height: 210,
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
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-pill').forEach(el => el.classList.remove('active'));

      const target = document.getElementById(tabId);
      if (target) target.classList.add('active');

      if (tabId === 'tabProjects') document.getElementById('btnTabProjects').classList.add('active');
      if (tabId === 'tabItems') document.getElementById('btnTabItems').classList.add('active');
      if (tabId === 'tabPayments') document.getElementById('btnTabPayments').classList.add('active');
      if (tabId === 'tabAnalytics') {
        document.getElementById('btnTabAnalytics').classList.add('active');
        renderAnalyticsCharts();
      }
      if (tabId === 'tabReports') {
        document.getElementById('btnTabReports').classList.add('active');
        renderActiveReport();
      }
      if (tabId === 'tabPrices') document.getElementById('btnTabPrices').classList.add('active');
    }

    // تبديل نوع التقرير
    function setReportType(type) {
      activeReportType = type;
      if (type === 'projectReport') {
        document.getElementById('btnReportTypeProject').classList.add('active');
        document.getElementById('btnReportTypeQuo').classList.remove('active');
      } else {
        document.getElementById('btnReportTypeQuo').classList.add('active');
        document.getElementById('btnReportTypeProject').classList.remove('active');
      }
      renderActiveReport();
    }

    // تعبئة قوائم المشاريع المنسدلة
    function populateAllProjectSelectors() {
      const selects = [
        document.getElementById('itemsProjectFilter'),
        document.getElementById('paymentProjectFilter'),
        document.getElementById('reportProjectSelect'),
        document.getElementById('modalItemProjectSelect'),
        document.getElementById('modalPaymentProjectSelect'),
        document.getElementById('editItemProjectSelect'),
        document.getElementById('editPaymentProjectSelect')
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
          opt.textContent = getJobLabel(job);
          jobFilter.appendChild(opt);
        });
        if (curJob) jobFilter.value = curJob;
      }
    }

    function getJobLabel(jobType) {
      if (!jobType) return 'أخرى';
      const t = String(jobType).trim();
      if (t === 'PLASTER_IN' || t === 'تلييس داخلي') return 'تلييس داخلي';
      if (t === 'PLASTER_OUT' || t === 'تلييس خارجي') return 'تلييس خارجي';
      if (t === 'PAINT_IN' || t === 'دهانات داخلية') return 'دهانات داخلية';
      if (t === 'PAINT_OUT' || t === 'دهانات خارجية') return 'دهانات خارجية';
      if (t === 'TILES' || t === 'بلاط') return 'بلاط';
      if (t === 'DOORS' || t === 'أبواب') return 'أبواب';
      if (t === 'WINDOWS' || t === 'نوافذ') return 'نوافذ';
      if (t.includes('لياسة') || t.includes('تلييس')) return 'تلييس داخلي';
      if (t.includes('دهان')) return 'دهانات داخلية';
      return t;
    }

    function getJobBadgeClass(jobType) {
      if (!jobType) return 'job-other';
      const t = String(jobType).toUpperCase();
      if (t.includes('PLASTER') || t.includes('تلييس') || t.includes('لياسة')) return 'job-plaster';
      if (t.includes('PAINT') || t.includes('دهان')) return 'job-paint';
      if (t.includes('TILE') || t.includes('بلاط') || t.includes('سيراميك') || t.includes('رخام')) return 'job-tile';
      if (t.includes('DOOR') || t.includes('أبواب') || t.includes('باب')) return 'job-block';
      if (t.includes('WINDOW') || t.includes('نوافذ') || t.includes('شباك')) return 'job-sky';
      if (t.includes('طوب') || t.includes('بلك')) return 'job-block';
      if (t.includes('جبس')) return 'job-gypsum';
      if (t.includes('خرسانة')) return 'job-concrete';
      if (t.includes('عزل')) return 'job-insulation';
      return 'job-other';
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
      const container = document.getElementById('projectsContainer');
      container.innerHTML = '';

      let matchedCount = 0;

      globalProjectsData.forEach(p => {
        const items = p.items || [];
        const payments = p.payments || [];
        const pTotalAmount = items.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
        const pTotalPaid = payments.reduce((sum, pm) => sum + (Number(pm.amount) || 0), 0);
        const remaining = pTotalAmount - pTotalPaid;
        const percentPaid = pTotalAmount > 0 ? Math.min(100, Math.round((pTotalPaid / pTotalAmount) * 100)) : 0;

        totalItems += items.length;
        totalAmount += pTotalAmount;
        totalPaid += pTotalPaid;

        const match = !q || (p.name + ' ' + (p.clientName || '') + ' ' + (p.mobileNumber || '')).toLowerCase().includes(q);
        if (!match) return;
        matchedCount++;

        const card = document.createElement('div');
        card.className = 'project-item-card';
        card.innerHTML =
          '<div>' +
            '<div class="proj-card-header">' +
              '<div class="proj-title-area">' +
                '<h3>' + (p.name || 'مشروع بدون اسم') + '</h3>' +
                '<div class="proj-client-row">' +
                  '<i class="fa-solid fa-user-circle"></i> ' + (p.clientName || 'عميل عام') +
                  (p.mobileNumber ? (' <span style="color:#cbd5e1;">|</span> <i class="fa-solid fa-phone"></i> ' + p.mobileNumber) : '') +
                '</div>' +
              '</div>' +
              '<span class="proj-date-chip"><i class="fa-regular fa-calendar"></i> ' + (p.projectDate || 'بدون تاريخ') + '</span>' +
            '</div>' +
            (p.description ? ('<p style="font-size:0.83rem; color:#64748b; margin-top:0.6rem; line-height:1.5;">' + p.description + '</p>') : '') +
            '<div class="proj-financial-bar" style="margin-top:0.85rem;">' +
              '<div class="proj-fin-metrics">' +
                '<span>التحصيل: <b style="color:var(--emerald);">' + percentPaid + '%</b></span>' +
                '<span>قيمة الحصر: <b>' + pTotalAmount.toLocaleString() + ' ر.س</b></span>' +
              '</div>' +
              '<div class="progress-track">' +
                '<div class="progress-fill" style="width: ' + percentPaid + '%;"></div>' +
              '</div>' +
              '<div class="proj-fin-metrics" style="color:#64748b; font-size:0.78rem;">' +
                '<span>المقبوض: <b style="color:var(--emerald);">' + pTotalPaid.toLocaleString() + ' ر.س</b></span>' +
                '<span>المتبقي: <b style="color:' + (remaining > 0 ? 'var(--rose)' : 'var(--emerald)') + ';">' + remaining.toLocaleString() + ' ر.س</b></span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="proj-card-footer">' +
            '<div class="proj-action-group">' +
              '<button onclick="filterByProjectAndOpenItems(' + p.id + ')" class="btn btn-sky" style="padding:0.35rem 0.65rem; font-size:0.8rem;"><i class="fa-solid fa-ruler"></i> البنود (' + items.length + ')</button>' +
              '<button onclick="filterByProjectAndOpenPayments(' + p.id + ')" class="btn btn-amber" style="padding:0.35rem 0.65rem; font-size:0.8rem;"><i class="fa-solid fa-file-invoice"></i> الدفعات</button>' +
              '<button onclick="openEditProjectModal(' + p.id + ')" class="btn btn-outline" style="padding:0.35rem 0.65rem; font-size:0.8rem;"><i class="fa-solid fa-pen"></i> تعديل</button>' +
            '</div>' +
            '<button onclick="requestDeleteProject(' + p.id + ')" class="icon-action-btn btn-action-delete" title="حذف المشروع نهائياً"><i class="fa-solid fa-trash-can"></i></button>' +
          '</div>';
        container.appendChild(card);
      });

      if (matchedCount === 0) {
        container.innerHTML =
          '<div class="empty-state-box" style="grid-column: 1 / -1;">' +
            '<div class="empty-illustration"><i class="fa-solid fa-folder-open"></i></div>' +
            '<h3 style="font-size:1.15rem; font-weight:800; color:#475569;">لا توجد مشاريع مطابقة</h3>' +
            '<p style="font-size:0.88rem; color:#94a3b8;">يمكنك إضافة مشروع جديد إلى الهاتف بضغطة زر</p>' +
            '<button onclick="openNewProjectModal()" class="btn btn-primary" style="margin-top:0.5rem;"><i class="fa-solid fa-plus"></i> إضافة مشروع جديد</button>' +
          '</div>';
      }

      document.getElementById('kpiProjectsCount').textContent = totalProjects;
      document.getElementById('kpiItemsCount').textContent = totalItems;
      document.getElementById('kpiTotalAmount').textContent = totalAmount.toLocaleString() + ' ر.س';
      document.getElementById('kpiTotalPaid').textContent = totalPaid.toLocaleString() + ' ر.س';
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
          if (selJob !== 'ALL') {
            const itLabel = getJobLabel(it.jobType);
            const selLabel = getJobLabel(selJob);
            if (it.jobType !== selJob && itLabel !== selLabel) return;
          }

          const searchStr = (p.name + ' ' + (it.title || it.itemName || '') + ' ' + (it.jobType || '') + ' ' + getJobLabel(it.jobType)).toLowerCase();
          if (q && !searchStr.includes(q)) return;

          count++;
          const dim = (it.length || 0) + ' × ' + (it.width || 0) + ' × ' + (it.height || 0);
          const voidTotal = (Number(it.doorsVoid) || 0) + (Number(it.windowsVoid) || 0) + (Number(it.voidArea) || 0);
          const meters = Number(it.totalMeters || it.quantity || 0);
          const price = Number(it.pricePerMeter || 0);
          const amount = Number(it.totalAmount || 0);
          const badgeCls = getJobBadgeClass(it.jobType);
          const displayJobName = getJobLabel(it.jobType);

          const tr = document.createElement('tr');
          tr.innerHTML =
            '<td style="font-weight:800; color:var(--secondary);">' + (p.name || '-') + '</td>' +
            '<td style="font-weight:700;">' + (it.title || it.itemName || '-') + '</td>' +
            '<td><span class="job-badge ' + badgeCls + '">' + displayJobName + '</span></td>' +
            '<td style="font-family:monospace; color:#64748b;">' + dim + '</td>' +
            '<td style="color:var(--rose); font-weight:700;">' + (voidTotal > 0 ? ('-' + voidTotal + ' م2') : '-') + '</td>' +
            '<td style="font-weight:900; color:var(--primary); font-family:monospace; font-size:1rem;">' + meters.toLocaleString() + '</td>' +
            '<td style="color:#64748b;">' + (price > 0 ? (price.toLocaleString() + ' ر.س') : '-') + '</td>' +
            '<td style="font-weight:900; color:var(--emerald); font-family:monospace; font-size:1.05rem;">' + amount.toLocaleString() + ' ر.س</td>' +
            '<td style="text-align:center; white-space:nowrap;">' +
              '<button onclick="openEditItemModal(' + it.itemId + ')" class="icon-action-btn btn-action-edit" title="تعديل البند"><i class="fa-solid fa-pen"></i></button>' +
              '<button onclick="requestDeleteItem(' + it.itemId + ')" class="icon-action-btn btn-action-delete" title="حذف من الهاتف"><i class="fa-solid fa-trash-can"></i></button>' +
            '</td>';
          tbody.appendChild(tr);
        });
      });

      if (count === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#94a3b8; padding:3rem;"><i class="fa-solid fa-box-open" style="font-size:2rem; display:block; margin-bottom:0.5rem;"></i>لا توجد بنود حصر مطابقة للبحث</td></tr>';
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
            '<td style="font-weight:800; color:var(--secondary);">' + (p.name || '-') + '</td>' +
            '<td style="font-weight:900; color:var(--emerald); font-size:1.05rem; font-family:monospace;">' + amt.toLocaleString() + ' ر.س</td>' +
            '<td><span class="job-badge job-tile">' + (pm.jobType || 'عام') + '</span></td>' +
            '<td>' + (pm.note || 'سند استلام نقدي / حوالة') + '</td>' +
            '<td style="color:#64748b; font-size:0.85rem;"><i class="fa-regular fa-calendar-check"></i> ' + (pm.dateAdded ? new Date(pm.dateAdded).toLocaleDateString('ar-SA') : '-') + '</td>' +
            '<td style="text-align:center; white-space:nowrap;">' +
              '<button onclick="openEditPaymentModal(' + pm.id + ')" class="icon-action-btn btn-action-edit" title="تعديل الدفعة"><i class="fa-solid fa-pen"></i></button>' +
              '<button onclick="requestDeletePayment(' + pm.id + ')" class="icon-action-btn btn-action-delete" title="حذف السند"><i class="fa-solid fa-trash-can"></i></button>' +
            '</td>';
          tbody.appendChild(tr);
        });
      });

      if (count === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:3rem;"><i class="fa-solid fa-receipt" style="font-size:2rem; display:block; margin-bottom:0.5rem;"></i>لا توجد دفعات مالية مسجلة</td></tr>';
      }

      const remaining = totalContract - totalReceived;
      document.getElementById('statPayTotalContracts').textContent = totalContract.toLocaleString() + ' ر.س';
      document.getElementById('statPayTotalReceived').textContent = totalReceived.toLocaleString() + ' ر.س';
      document.getElementById('statPayTotalRemaining').textContent = remaining.toLocaleString() + ' ر.س';
      document.getElementById('displayedPaymentsCount').textContent = count;
    }

    // ==========================================
    // 4. التحليلات البيانية (CHARTS)
    // ==========================================
    function renderAnalyticsCharts() {
      const jobCostMap = {};
      const jobQtyMap = {};

      globalProjectsData.forEach(p => {
        (p.items || []).forEach(it => {
          const j = getJobLabel(it.jobType);
          const amt = Number(it.totalAmount) || 0;
          const qty = Number(it.totalMeters) || Number(it.quantity) || 0;
          jobCostMap[j] = (jobCostMap[j] || 0) + amt;
          jobQtyMap[j] = (jobQtyMap[j] || 0) + qty;
        });
      });

      const labels = Object.keys(jobCostMap);
      const costData = Object.values(jobCostMap);
      const qtyData = labels.map(l => jobQtyMap[l] || 0);

      const colors = ['#4f46e5', '#059669', '#d97706', '#0284c7', '#7e22ce', '#c2410c', '#e11d48', '#64748b'];

      const pieCtx = document.getElementById('jobTypesPieChart');
      if (pieCtx) {
        if (pieChartInstance) pieChartInstance.destroy();
        pieChartInstance = new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: labels.length ? labels : ['لا توجد بيانات'],
            datasets: [{
              data: costData.length ? costData : [1],
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } }
            }
          }
        });
      }

      const barCtx = document.getElementById('jobTypesBarChart');
      if (barCtx) {
        if (barChartInstance) barChartInstance.destroy();
        barChartInstance = new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['لا توجد بيانات'],
            datasets: [{
              label: 'إجمالي الكمية (متر)',
              data: qtyData.length ? qtyData : [0],
              backgroundColor: '#059669',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }
    }

    // ==========================================================
    // 5. عرض تقارير الـ PDF المطابقة تماماً لكود تطبيق Metrix
    // (ProjectReportHtml.kt & QuotationReportHtml.kt)
    // ==========================================================
    function renderActiveReport() {
      const viewer = document.getElementById('pdfReportViewer');
      const pId = document.getElementById('reportProjectSelect').value;
      const proj = globalProjectsData.find(p => String(p.id) === String(pId)) || globalProjectsData[0];

      if (!proj) {
        viewer.innerHTML = '<div style="text-align:center; padding:3rem; color:#94a3b8;">يرجى إضافة مشروع أولاً لعرض التقرير المنسق</div>';
        return;
      }

      const items = proj.items || [];
      const payments = proj.payments || [];
      const totalAmount = items.reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);
      const totalPaid = payments.reduce((s, pm) => s + (Number(pm.amount) || 0), 0);
      const remaining = Math.max(0, totalAmount - totalPaid);
      const dateStr = new Date().toISOString().split('T')[0];

      if (activeReportType === 'projectReport') {
        // ==========================================================
        // تقرير حصر كميات المشروع (طِبق الأصل من ProjectReportHtml.kt)
        // ==========================================================
        const grouped = {};
        const totalsByJob = {};

        items.forEach(it => {
          const j = getJobLabel(it.jobType);
          if (!grouped[j]) {
            grouped[j] = [];
            totalsByJob[j] = { totalMeters: 0, totalAmount: 0 };
          }
          const m = Number(it.totalMeters || it.quantity || 0);
          const a = Number(it.totalAmount || 0);
          totalsByJob[j].totalMeters += m;
          totalsByJob[j].totalAmount += a;
          grouped[j].push(it);
        });

        let jobSummaryRows = '';
        let jobIdx = 1;
        for (const j in totalsByJob) {
          jobSummaryRows += '<tr>' +
            '<td style="width: 8%;">' + (jobIdx++) + '</td>' +
            '<td style="font-weight:700;">' + j + '</td>' +
            '<td>' + totalsByJob[j].totalMeters.toFixed(2) + '</td>' +
            '<td style="font-weight:700;">' + totalsByJob[j].totalAmount.toLocaleString() + ' ر.س</td>' +
            '</tr>';
        }

        let detailedSections = '';
        for (const j in grouped) {
          let itemRows = '';
          let subtotal = 0;
          grouped[j].forEach((it, idx) => {
            const amt = Number(it.totalAmount || 0);
            subtotal += amt;
            const m = Number(it.totalMeters || it.quantity || 0);
            itemRows += '<tr>' +
              '<td style="width: 8%;">' + (idx + 1) + '</td>' +
              '<td style="font-weight:600;">' + (it.title || it.itemName || '-') + '</td>' +
              '<td>' + m.toFixed(2) + '</td>' +
              '<td>' + amt.toLocaleString() + ' ر.س</td>' +
              '</tr>';
          });

          detailedSections += '<h2 style="margin: 20px 0 10px; font-size: 15px; font-weight: 800; color: #111827;">تفاصيل البنود: ' + j + '</h2>' +
            '<table class="app-pdf-table">' +
              '<thead><tr><th style="width: 8%;">#</th><th>البند</th><th>الكمية</th><th>الإجمالي (ر.س)</th></tr></thead>' +
              '<tbody>' +
                itemRows +
                '<tr class="totalRow"><td colspan="2">مجموع ' + j + '</td><td style="color:#6B7280;">—</td><td>' + subtotal.toLocaleString() + ' ر.س</td></tr>' +
              '</tbody>' +
            '</table>';
        }

        viewer.innerHTML =
          '<div class="app-report-header">' +
            '<h1>تقرير حصر كميات المشروع</h1>' +
            '<div class="sub"><b>' + (proj.name || 'مشروع بدون اسم') + '</b></div>' +
            (proj.clientName ? ('<div class="sub">العميل: <b>' + proj.clientName + '</b></div>') : '') +
            '<div class="sub">التاريخ: <b>' + dateStr + '</b></div>' +
            '<div class="chip">Metrix</div>' +
          '</div>' +

          '<div class="app-report-kpi-card">' +
            '<div class="app-report-kpi-row">' +
              '<div class="app-report-metric">' +
                '<div class="k">إجمالي التكاليف</div>' +
                '<div class="v primary">' + totalAmount.toLocaleString() + ' ر.س</div>' +
              '</div>' +
              '<div class="app-report-metric">' +
                '<div class="k">المدفوع</div>' +
                '<div class="v" style="color:var(--emerald);">' + totalPaid.toLocaleString() + ' ر.س</div>' +
              '</div>' +
              '<div class="app-report-metric">' +
                '<div class="k">المتبقي</div>' +
                '<div class="v accent">' + remaining.toLocaleString() + ' ر.س</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<h2 style="margin: 18px 0 10px; font-size: 15px; font-weight: 800; color: #111827;">توزيع التكاليف حسب نوع العمل</h2>' +
          '<table class="app-pdf-table">' +
            '<thead><tr><th style="width: 8%;">#</th><th>نوع العمل</th><th>الكمية</th><th>الإجمالي (ر.س)</th></tr></thead>' +
            '<tbody>' +
              jobSummaryRows +
              '<tr class="totalRow"><td colspan="2">الإجمالي</td><td style="color:#6B7280;">—</td><td>' + totalAmount.toLocaleString() + ' ر.س</td></tr>' +
            '</tbody>' +
          '</table>' +

          detailedSections;

      } else {
        // ==========================================================
        // عرض سعر تقديري رسمي (طِبق الأصل من QuotationReportHtml.kt)
        // ==========================================================
        let totalMeters = 0;
        let itemRows = '';

        items.forEach((it, idx) => {
          const m = Number(it.totalMeters || it.quantity || 0);
          const p = Number(it.pricePerMeter || 0);
          const amt = Number(it.totalAmount || (m * p));
          totalMeters += m;

          itemRows += '<tr>' +
            '<td style="width: 8%;">' + (idx + 1) + '</td>' +
            '<td style="text-align: right; padding-right: 15px; font-weight: 600;">' + (it.title || it.itemName || '-') + '</td>' +
            '<td>' + m.toFixed(2) + ' م²</td>' +
            '<td>' + p.toLocaleString() + '</td>' +
            '<td><b>' + amt.toLocaleString() + '</b></td>' +
            '</tr>';
        });

        viewer.innerHTML =
          '<div class="app-quo-banner">' +
            '<h1>عرض سعر تقديري</h1>' +
            '<span class="badge">ميتركس المعماري للحسابات الذكية</span>' +
          '</div>' +

          '<div class="app-quo-info-grid">' +
            '<div class="app-quo-info-card">' +
              '<h3>بيانات مقدم العرض (المقاول)</h3>' +
              '<div class="app-quo-info-row"><b>مؤسسة / مقاول معتمد</b></div>' +
              '<div class="app-quo-info-row">العنوان: <b>المملكة العربية السعودية</b></div>' +
              '<div class="app-quo-info-row">رقم الجوال: <b>' + (proj.mobileNumber || '—') + '</b></div>' +
            '</div>' +
            '<div class="app-quo-info-card">' +
              '<h3>بيانات العميل</h3>' +
              '<div class="app-quo-info-row"><b>' + (proj.clientName || 'عميلنا العزيز') + '</b></div>' +
              '<div class="app-quo-info-row">المشروع: <b>' + (proj.name || '—') + '</b></div>' +
              '<div class="app-quo-info-row">تاريخ العرض: <b>' + dateStr + '</b></div>' +
            '</div>' +
          '</div>' +

          '<h3 style="font-size: 14px; font-weight: 800; color: #1E3A8A; margin-bottom: 6px;">تفاصيل بنود العرض</h3>' +
          '<table class="app-pdf-table">' +
            '<thead>' +
              '<tr>' +
                '<th style="width: 8%;">#</th>' +
                '<th style="text-align: right; padding-right: 15px;">اسم البند</th>' +
                '<th style="width: 20%;">كمية الأمتار</th>' +
                '<th style="width: 20%;">سعر المتر (ر.س)</th>' +
                '<th style="width: 22%;">الإجمالي (ر.س)</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              itemRows +
              '<tr class="totalRow">' +
                '<td colspan="2">إجمالي التكاليف</td>' +
                '<td>' + totalMeters.toFixed(2) + ' م²</td>' +
                '<td>—</td>' +
                '<td style="color: #B45309; font-size: 12px; font-weight: 800;">' + totalAmount.toLocaleString() + ' ر.س</td>' +
              '</tr>' +
            '</tbody>' +
          '</table>' +

          '<div class="app-quo-signatures">' +
            '<div class="app-quo-sig-box">' +
              '<div class="app-quo-sig-line">توقيع مقدم العرض</div>' +
            '</div>' +
            '<div class="app-quo-sig-box">' +
              '<div class="app-quo-sig-line">توقيع واعتماد العميل</div>' +
            '</div>' +
          '</div>' +

          '<div class="app-quo-footer-note">' +
            'هذا العرض تقديري وصالح لمدة 30 يوماً من تاريخ إصداره. تم الإنشاء بواسطة تطبيق ميتركس المعماري.' +
          '</div>';
      }
    }

    // ==========================================
    // 6. عرض وتعديل دليل الأسعار (PRICES GUIDE)
    // ==========================================
    function renderPricesTable() {
      const defaultJobs = [
        { code: 'PLASTER_IN', label: 'تلييس داخلي' },
        { code: 'PLASTER_OUT', label: 'تلييس خارجي' },
        { code: 'PAINT_IN', label: 'دهانات داخلية' },
        { code: 'PAINT_OUT', label: 'دهانات خارجية' },
        { code: 'TILES', label: 'بلاط' },
        { code: 'DOORS', label: 'أبواب' },
        { code: 'WINDOWS', label: 'نوافذ' }
      ];

      const priceMap = {};
      globalPricesData.forEach(p => { 
        priceMap[p.jobType] = p.pricePerUnit;
        priceMap[getJobLabel(p.jobType)] = p.pricePerUnit;
      });

      const tbody = document.getElementById('pricesTableBody');
      tbody.innerHTML = '';

      defaultJobs.forEach(jobItem => {
        const curPrice = priceMap[jobItem.code] !== undefined ? priceMap[jobItem.code] : (priceMap[jobItem.label] !== undefined ? priceMap[jobItem.label] : 0);
        const inputId = 'price_input_' + encodeURIComponent(jobItem.code);

        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td style="font-weight:800; font-size:0.95rem;">' + jobItem.label + '</td>' +
          '<td style="font-weight:900; color:var(--primary); font-size:1.1rem; font-family:monospace;">' + curPrice.toLocaleString() + ' ر.س</td>' +
          '<td><input type="number" step="0.5" id="' + inputId + '" value="' + curPrice + '" class="custom-input" style="width:140px; padding:0.4rem 0.75rem;" /></td>' +
          '<td style="text-align:center;"><button onclick="saveUnitPrice(\\'' + jobItem.code + '\\', \\'' + inputId + '\\')" class="btn btn-primary" style="padding:0.35rem 0.95rem;"><i class="fa-solid fa-floppy-disk"></i> حفظ في الهاتف</button></td>';
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
    // إدارة النوافذ المنبثقة والإضافة والتعديل
    // ==========================================
    function openNewProjectModal() {
      document.getElementById('newProjectModal').style.display = 'flex';
      document.getElementById('newProjName').focus();
    }

    function openEditProjectModal(projectId) {
      const proj = globalProjectsData.find(p => p.id === projectId);
      if (!proj) return;
      document.getElementById('editProjId').value = proj.id;
      document.getElementById('editProjName').value = proj.name || '';
      document.getElementById('editProjClient').value = proj.clientName || '';
      document.getElementById('editProjMobile').value = proj.mobileNumber || '';
      document.getElementById('editProjDate').value = proj.projectDate || '';
      document.getElementById('editProjDesc').value = proj.description || '';
      document.getElementById('editProjectModal').style.display = 'flex';
    }

    function submitEditProject() {
      const id = parseInt(document.getElementById('editProjId').value);
      const name = document.getElementById('editProjName').value.trim();
      if (!id || !name) { alert('يرجى إدخال اسم المشروع'); return; }

      const projData = {
        id: id,
        name: name,
        clientName: document.getElementById('editProjClient').value.trim(),
        mobileNumber: document.getElementById('editProjMobile').value.trim(),
        projectDate: document.getElementById('editProjDate').value,
        description: document.getElementById('editProjDesc').value.trim()
      };

      // تحديث فوري مباشر في واجهة المتصفح
      const target = globalProjectsData.find(p => p.id === id);
      if (target) {
        target.name = projData.name;
        target.clientName = projData.clientName;
        target.mobileNumber = projData.mobileNumber;
        target.projectDate = projData.projectDate;
        target.description = projData.description;
        reRenderAll();
      }

      if (socket && socket.connected) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'update_project_from_web',
          data: projData
        });
        showToast('تم حفظ تعديل المشروع وإرساله للهاتف');
      } else {
        showToast('تم الحفظ محلياً (تأكد من اتصال الهاتف بالإنترنت)', false);
      }

      closeModal('editProjectModal');
    }

    function openNewItemModal() {
      if (!globalProjectsData || globalProjectsData.length === 0) {
        alert('يرجى إضافة مشروع أولاً قبل إنشاء بنود الحصر');
        openNewProjectModal();
        return;
      }
      document.getElementById('newItemModal').style.display = 'flex';
      onJobTypeChanged('newItemJobType', 'newItemPrice', calculateLiveItem);
      calculateLiveItem();
      document.getElementById('newItemTitle').focus();
    }

    function openEditItemModal(itemId) {
      let foundItem = null;
      globalProjectsData.forEach(p => {
        (p.items || []).forEach(it => {
          if (it.itemId === itemId) foundItem = it;
        });
      });
      if (!foundItem) return;

      document.getElementById('editItemId').value = foundItem.itemId;
      document.getElementById('editItemProjectSelect').value = foundItem.projectId;
      document.getElementById('editItemTitle').value = foundItem.title || foundItem.itemName || '';
      document.getElementById('editItemJobType').value = foundItem.jobType || 'لياسة';
      document.getElementById('editItemCalcMode').value = foundItem.calcMode || 'WALLS';
      document.getElementById('editItemLength').value = foundItem.length || 0;
      document.getElementById('editItemWidth').value = foundItem.width || 0;
      document.getElementById('editItemHeight').value = foundItem.height || 0;
      document.getElementById('editItemWallCount').value = foundItem.wallCount || 1;
      document.getElementById('editItemDoorsVoid').value = foundItem.doorsVoid || 0;
      document.getElementById('editItemWindowsVoid').value = foundItem.windowsVoid || 0;
      document.getElementById('editItemPrice').value = foundItem.pricePerMeter || 0;

      calculateLiveEditItem();
      document.getElementById('editItemModal').style.display = 'flex';
    }

    function calculateMetrixJobLogic(jobType, l, w, h, wc, voidArea, price, mode) {
      const type = (jobType || '').trim().toUpperCase();
      const m = (mode || 'WALLS').trim().toUpperCase();

      let netMeters = 0;
      if (type.includes('TILE') || type.includes('بلاط')) {
        const floorGross = Math.max(0, l * w);
        const wallsRatio = Math.min(4, Math.max(0, wc)) / 4.0;
        const fullPerimeter = 2.0 * (l + w);
        const wallsGross = Math.max(0, fullPerimeter * h * wallsRatio);

        let gross = floorGross;
        if (m === 'WALLS') gross = wallsGross;
        else if (m === 'BOTH') gross = wallsGross + floorGross;
        else gross = floorGross; // SURFACE

        netMeters = Math.max(0, gross - voidArea);
      } else if (
        type.includes('PLASTER') || type.includes('PAINT') ||
        type.includes('تلييس') || type.includes('دهان') || type.includes('لياسة')
      ) {
        const wallsRatio = Math.min(4, Math.max(0, wc)) / 4.0;
        const fullPerimeter = (w > 0) ? (2.0 * (l + w)) : (l * wc);
        const grossWalls = fullPerimeter * (h > 0 ? h : 1) * wallsRatio;
        const netWalls = Math.max(0, grossWalls - voidArea);
        const netSurface = Math.max(0, (l * (w > 0 ? w : 1)) - voidArea);

        if (m === 'SURFACE') netMeters = netSurface;
        else if (m === 'BOTH') netMeters = Math.max(0, netWalls + netSurface);
        else netMeters = netWalls; // WALLS
      } else if (type.includes('DOOR') || type.includes('WINDOW') || type.includes('أبواب') || type.includes('نوافذ')) {
        if (l > 0 && w > 0) {
          netMeters = (l * w) * Math.max(1, wc);
        } else {
          netMeters = 1.0 * Math.max(1, wc); // بالعدد
        }
      } else {
        // حسابات عامة
        if (m === 'WALLS') {
          const perimeter = (w > 0) ? ((l + w) * 2) : (l * wc);
          netMeters = Math.max(0, (perimeter * (h > 0 ? h : 1)) - voidArea);
        } else {
          netMeters = Math.max(0, (l * (w > 0 ? w : 1)) - voidArea);
        }
      }

      netMeters = Math.round(netMeters * 100) / 100;
      const totalAmount = Math.round((netMeters * price) * 100) / 100;
      return { netMeters, totalAmount };
    }

    function calculateLiveItem() {
      const job = document.getElementById('newItemJobType').value;
      const mode = document.getElementById('newItemCalcMode').value;
      const l = parseFloat(document.getElementById('newItemLength').value) || 0;
      const w = parseFloat(document.getElementById('newItemWidth').value) || 0;
      const h = parseFloat(document.getElementById('newItemHeight').value) || 0;
      const walls = parseFloat(document.getElementById('newItemWallCount').value) || 1;
      const dVoid = parseFloat(document.getElementById('newItemDoorsVoid').value) || 0;
      const wVoid = parseFloat(document.getElementById('newItemWindowsVoid').value) || 0;
      const price = parseFloat(document.getElementById('newItemPrice').value) || 0;

      const res = calculateMetrixJobLogic(job, l, w, h, walls, (dVoid + wVoid), price, mode);

      document.getElementById('newItemCalcMeters').value = res.netMeters;
      document.getElementById('newItemCalcAmount').value = res.totalAmount.toLocaleString() + ' ر.س';
    }

    function calculateLiveEditItem() {
      const job = document.getElementById('editItemJobType').value;
      const mode = document.getElementById('editItemCalcMode').value;
      const l = parseFloat(document.getElementById('editItemLength').value) || 0;
      const w = parseFloat(document.getElementById('editItemWidth').value) || 0;
      const h = parseFloat(document.getElementById('editItemHeight').value) || 0;
      const walls = parseFloat(document.getElementById('editItemWallCount').value) || 1;
      const dVoid = parseFloat(document.getElementById('editItemDoorsVoid').value) || 0;
      const wVoid = parseFloat(document.getElementById('editItemWindowsVoid').value) || 0;
      const price = parseFloat(document.getElementById('editItemPrice').value) || 0;

      const res = calculateMetrixJobLogic(job, l, w, h, walls, (dVoid + wVoid), price, mode);

      document.getElementById('editItemCalcMeters').value = res.netMeters;
      document.getElementById('editItemCalcAmount').value = res.totalAmount.toLocaleString() + ' ر.س';
    }

    function submitEditItem() {
      const itemId = parseInt(document.getElementById('editItemId').value);
      const pId = parseInt(document.getElementById('editItemProjectSelect').value);
      const title = document.getElementById('editItemTitle').value.trim();
      if (!itemId || !pId || !title) { alert('يرجى تحديد اسم البند'); return; }

      const l = parseFloat(document.getElementById('editItemLength').value) || 0;
      const w = parseFloat(document.getElementById('editItemWidth').value) || 0;
      const h = parseFloat(document.getElementById('editItemHeight').value) || 0;
      const walls = parseInt(document.getElementById('editItemWallCount').value) || 1;
      const dVoid = parseFloat(document.getElementById('editItemDoorsVoid').value) || 0;
      const wVoid = parseFloat(document.getElementById('editItemWindowsVoid').value) || 0;
      const price = parseFloat(document.getElementById('editItemPrice').value) || 0;
      const meters = parseFloat(document.getElementById('editItemCalcMeters').value) || 0;
      const totalAmount = meters * price;

      const itemData = {
        itemId: itemId,
        projectId: pId,
        itemName: title,
        title: title,
        jobType: document.getElementById('editItemJobType').value,
        calcMode: document.getElementById('editItemCalcMode').value,
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

      // تحديث فوري مباشر في واجهة المتصفح
      globalProjectsData.forEach(p => {
        (p.items || []).forEach(it => {
          if (it.itemId === itemId) {
            Object.assign(it, itemData);
          }
        });
      });
      reRenderAll();

      if (socket && socket.connected) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'update_item_from_web',
          data: itemData
        });
        showToast('تم حفظ تعديل البند وإرساله للهاتف');
      } else {
        showToast('تم الحفظ محلياً (تأكد من اتصال الهاتف بالإنترنت)', false);
      }

      closeModal('editItemModal');
    }

    function openNewPaymentModal() {
      if (!globalProjectsData || globalProjectsData.length === 0) {
        alert('يرجى إضافة مشروع أولاً قبل تسجيل الدفعات');
        return;
      }
      document.getElementById('newPaymentModal').style.display = 'flex';
      document.getElementById('newPayAmount').focus();
    }

    function openEditPaymentModal(paymentId) {
      let foundPay = null;
      globalProjectsData.forEach(p => {
        (p.payments || []).forEach(pm => {
          if (pm.id === paymentId) foundPay = pm;
        });
      });
      if (!foundPay) return;

      document.getElementById('editPayId').value = foundPay.id;
      document.getElementById('editPaymentProjectSelect').value = foundPay.projectId;
      document.getElementById('editPayAmount').value = foundPay.amount || 0;
      document.getElementById('editPayJobType').value = foundPay.jobType || '';
      document.getElementById('editPayNote').value = foundPay.note || '';
      document.getElementById('editPaymentModal').style.display = 'flex';
    }

    function submitEditPayment() {
      const id = parseInt(document.getElementById('editPayId').value);
      const pId = parseInt(document.getElementById('editPaymentProjectSelect').value);
      const amt = parseFloat(document.getElementById('editPayAmount').value) || 0;
      if (!id || !pId || amt <= 0) { alert('يرجى إدخال مبلغ صحيح'); return; }

      const payData = {
        id: id,
        projectId: pId,
        amount: amt,
        jobType: document.getElementById('editPayJobType').value.trim(),
        note: document.getElementById('editPayNote').value.trim()
      };

      // تحديث فوري مباشر في واجهة المتصفح
      globalProjectsData.forEach(p => {
        (p.payments || []).forEach(pm => {
          if (pm.id === id) {
            Object.assign(pm, payData);
          }
        });
      });
      reRenderAll();

      if (socket && socket.connected) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'update_payment_from_web',
          data: payData
        });
        showToast('تم حفظ تعديل الدفعة وإرسالها للهاتف');
      } else {
        showToast('تم الحفظ محلياً (تأكد من اتصال الهاتف بالإنترنت)', false);
      }

      closeModal('editPaymentModal');
    }

    function closeModal(id) {
      document.getElementById(id).style.display = 'none';
    }

    function onJobTypeChanged(jobSelectId, priceInputId, calcFunc) {
      const job = document.getElementById(jobSelectId).value;
      const found = globalPricesData.find(p => p.jobType === job);
      if (found && found.pricePerUnit > 0) {
        document.getElementById(priceInputId).value = found.pricePerUnit;
      }
      if (calcFunc) calcFunc();
    }



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

      if (socket && socket.connected) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'create_project_from_web',
          data: projData
        });
        showToast('جاري إنشاء المشروع في الهاتف...');
      } else {
        showToast('تعذر الإرسال: غير متصل بالهاتف', false);
      }

      closeModal('newProjectModal');
      document.getElementById('newProjName').value = '';
      document.getElementById('newProjClient').value = '';
      document.getElementById('newProjMobile').value = '';
      document.getElementById('newProjDesc').value = '';
    }

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

      if (socket && socket.connected) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'create_item_from_web',
          data: itemData
        });
        showToast('جاري إضافة البند في الهاتف...');
      } else {
        showToast('تعذر الإرسال: غير متصل بالهاتف', false);
      }

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

      if (socket && socket.connected) {
        socket.emit('relay_to_phone', {
          sessionId: currentSessionId,
          action: 'add_payment_from_web',
          data: payData
        });
        showToast('جاري إضافة الدفعة في الهاتف...');
      } else {
        showToast('تعذر الإرسال: غير متصل بالهاتف', false);
      }

      closeModal('newPaymentModal');
      document.getElementById('newPayAmount').value = '';
      document.getElementById('newPayJobType').value = '';
      document.getElementById('newPayNote').value = '';
    }

    // ==========================================
    // إدارة الحذف مع التحقق من الرقم السري (PIN)
    // ==========================================
    function requestDeleteProject(projectId) {
      pendingDeleteType = 'project';
      pendingDeleteId = projectId;
      document.getElementById('deleteConfirmPromptText').textContent = 'هل أنت متأكد من رغبتك في حذف هذا المشروع وجميع بنوده ودفعاته نهائياً من الهاتف؟';
      document.getElementById('deletePasscodeInput').value = '';
      document.getElementById('deleteConfirmModal').style.display = 'flex';
      document.getElementById('deletePasscodeInput').focus();
    }

    function requestDeleteItem(itemId) {
      pendingDeleteType = 'item';
      pendingDeleteId = itemId;
      document.getElementById('deleteConfirmPromptText').textContent = 'هل أنت متأكد من رغبتك في حذف هذا البند نهائياً من الهاتف؟';
      document.getElementById('deletePasscodeInput').value = '';
      document.getElementById('deleteConfirmModal').style.display = 'flex';
      document.getElementById('deletePasscodeInput').focus();
    }

    function requestDeletePayment(paymentId) {
      pendingDeleteType = 'payment';
      pendingDeleteId = paymentId;
      document.getElementById('deleteConfirmPromptText').textContent = 'هل أنت متأكد من رغبتك في حذف هذا السند المالي نهائياً من الهاتف؟';
      document.getElementById('deletePasscodeInput').value = '';
      document.getElementById('deleteConfirmModal').style.display = 'flex';
      document.getElementById('deletePasscodeInput').focus();
    }

    function executeConfirmedDelete() {
      const passcode = document.getElementById('deletePasscodeInput').value.trim();
      if (!pendingDeleteId) return;

      let action = '';
      if (pendingDeleteType === 'project') action = 'delete_project_from_web';
      if (pendingDeleteType === 'item') action = 'delete_item_from_web';
      if (pendingDeleteType === 'payment') action = 'delete_payment_from_web';

      socket.emit('relay_to_phone', {
        sessionId: currentSessionId,
        action: action,
        data: { id: pendingDeleteId, passcode: passcode }
      });

      closeModal('deleteConfirmModal');
      pendingDeleteId = null;
      pendingDeleteType = '';
    }

    function exportComprehensiveExcel() {
      if (!globalProjectsData || globalProjectsData.length === 0) {
        alert('لا توجد بيانات للتصدير!');
        return;
      }

      const wb = XLSX.utils.book_new();

      const itemsRows = [['المشروع', 'العميل', 'رقم الجوال', 'اسم البند / الغرفة', 'نوع العمل', 'طريقة الحساب', 'الطول', 'العرض', 'الارتفاع', 'خصم الأبواب', 'خصم النوافذ', 'الكمية الصافية', 'سعر المتر', 'المبلغ الإجمالي']];
      globalProjectsData.forEach(p => {
        (p.items || []).forEach(it => {
          itemsRows.push([
            p.name || '',
            p.clientName || '',
            p.mobileNumber || '',
            it.title || it.itemName || '',
            getJobLabel(it.jobType),
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
          renderActiveReport();
          renderPricesTable();
          renderAnalyticsCharts();

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

  // تمرير أوامر الإضافة والتعديل والحذف والتنبيهات بين المتصفح والهاتف
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
  console.log('Metrix Pro Enterprise Server running on port', PORT);
});
