import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Sector, ResponsiveContainer
} from 'recharts';
import { getNotificationAnalytics } from '../api';

const COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const DATE_FILTERS = [
  { value: 'all',   label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

// ── Summary card ────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color, bg, loading }) {
  return (
    <div className="col-sm-6 col-xl-3">
      <div className="stat-card d-flex align-items-center gap-3">
        <div className="stat-icon" style={{ background: bg, color }}>
          <i className={icon}></i>
        </div>
        <div>
          <div className="stat-value">
            {loading
              ? <span className="spinner-border spinner-border-sm text-muted"></span>
              : (value ?? 0)}
          </div>
          <div className="stat-label">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ── Active slice (hover expands) ─────────────────────────────────────────────
function ActiveSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 12}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.95} />
    </g>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  return (
    <div className="na-tooltip">
      <div className="na-tooltip-title">{name}</div>
      <div className="na-tooltip-row">Count <strong>{value}</strong></div>
      <div className="na-tooltip-row">Share <strong>{pct}%</strong></div>
    </div>
  );
}

// ── Center label inside donut ─────────────────────────────────────────────────
function DonutCenter({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.4em" fontSize="28" fontWeight="800" fill="#1a1a2e">{total}</tspan>
      <tspan x={cx} dy="1.6em" fontSize="11" fill="#888" textTransform="uppercase" letterSpacing="1">TOTAL</tspan>
    </text>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotificationAnalytics({ onNavigate }) {
  const [analyticsData, setAnalyticsData]   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [activeIdx, setActiveIdx]           = useState(null);
  const [filter, setFilter]                 = useState('all');
  const [fromDate, setFromDate]             = useState('');
  const [toDate, setToDate]                 = useState('');
  const [exporting, setExporting]           = useState('');
  const chartRef  = useRef(null);
  const timerRef  = useRef(null);
  const lastFetch = useRef(null);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const params = new URLSearchParams({ filter });
    if (filter === 'custom') {
      if (fromDate) params.append('from', fromDate);
      if (toDate)   params.append('to', toDate);
    }
    try {
      const res = await getNotificationAnalytics(params.toString());
      if (res.data.success) {
        setAnalyticsData(res.data.data);
        lastFetch.current = new Date();
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, [filter, fromDate, toDate]);

  useEffect(() => {
    setLoading(true);
    load();
    timerRef.current = setInterval(load, 30_000);
    return () => clearInterval(timerRef.current);
  }, [load]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const pieData = (analyticsData?.categories || [])
    .filter(c => c.count > 0)
    .map((c, i) => ({ ...c, name: c.label, value: c.count, fill: COLORS[i % COLORS.length] }));

  const total      = analyticsData?.summary?.total      ?? 0;
  const pending    = analyticsData?.summary?.pending    ?? 0;
  const read       = analyticsData?.summary?.read       ?? 0;
  const todayTotal = analyticsData?.summary?.todayTotal ?? 0;
  const isEmpty    = !loading && pieData.length === 0;

  // ── PNG export (SVG → canvas) ─────────────────────────────────────────────
  const exportPNG = () => {
    const svgEl = chartRef.current?.querySelector('svg');
    if (!svgEl) return;
    const w = svgEl.clientWidth  || 500;
    const h = svgEl.clientHeight || 400;
    const serialized = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = w * 2; // 2× for sharpness
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = 'notification-analytics.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  // ── Excel export ──────────────────────────────────────────────────────────
  const exportExcel = async () => {
    setExporting('excel');
    try {
      const XLSX = await import('xlsx');
      const rows = [
        ['Notification Analytics Report'],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ['Category', 'Count', 'Percentage'],
        ...(analyticsData?.categories || []).map(c => [
          c.label,
          c.count,
          total > 0 ? parseFloat(((c.count / total) * 100).toFixed(2)) : 0,
        ]),
        [],
        ['Summary'],
        ['Total Notifications', total],
        ['Pending (Unread)',    pending],
        ['Read',               read],
        ["Today's Notifications", todayTotal],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 32 }, { wch: 12 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Notification Analytics');
      XLSX.writeFile(wb, 'notification-analytics.xlsx');
    } catch (e) {
      console.error('Excel export failed:', e);
    } finally {
      setExporting('');
    }
  };

  // ── PDF export ────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setExporting('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const gold = [201, 168, 76];

      // Header bar
      doc.setFillColor(...gold);
      doc.rect(0, 0, 210, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Notification Analytics Report', 14, 14);

      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Filter: ${DATE_FILTERS.find(f => f.value === filter)?.label || 'All Time'}`, 14, 34);

      // Summary cards
      let y = 44;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...gold);
      doc.text('Summary', 14, y); y += 6;

      const summaryItems = [
        ['Total Notifications', total],
        ['Pending (Unread)',    pending],
        ['Read',               read],
        ["Today's Notifications", todayTotal],
      ];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      summaryItems.forEach(([lbl, val], i) => {
        const col = i % 2 === 0 ? 14 : 110;
        const row = y + Math.floor(i / 2) * 8;
        doc.setFont('helvetica', 'bold');
        doc.text(String(val), col, row);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(lbl, col + 14, row);
        doc.setTextColor(50, 50, 50);
      });
      y += Math.ceil(summaryItems.length / 2) * 8 + 10;

      // Category table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...gold);
      doc.text('Category Breakdown', 14, y); y += 6;

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('Category', 16, y + 5.5);
      doc.text('Count', 130, y + 5.5);
      doc.text('Share (%)', 160, y + 5.5);
      y += 8;

      (analyticsData?.categories || []).forEach((c, i) => {
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(14, y, 182, 8, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.text(c.label, 16, y + 5.5);
        doc.text(String(c.count), 130, y + 5.5);
        const pct = total > 0 ? ((c.count / total) * 100).toFixed(1) : '0.0';
        doc.text(`${pct}%`, 160, y + 5.5);
        y += 8;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text('Advocate Chauhan — Admin Panel', 14, 290);
      doc.text(`Page 1`, 196, 290, { align: 'right' });

      doc.save('notification-analytics.pdf');
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setExporting('');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="na-wrapper">

      {/* ── Summary Cards ──────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        <SummaryCard icon="fas fa-bell"        label="Total Notifications"  value={total}      color="#4F46E5" bg="#EEF2FF" loading={loading} />
        <SummaryCard icon="fas fa-clock"       label="Pending"              value={pending}    color="#F59E0B" bg="#FFFBEB" loading={loading} />
        <SummaryCard icon="fas fa-check-circle" label="Read"                value={read}       color="#10B981" bg="#ECFDF5" loading={loading} />
        <SummaryCard icon="fas fa-calendar-day" label="Today's Notifications" value={todayTotal} color="#EF4444" bg="#FEF2F2" loading={loading} />
      </div>

      {/* ── Main Analytics Card ─────────────────────────────────── */}
      <div className="page-card mb-4 na-card">

        {/* Card header */}
        <div className="page-card-header flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-chart-pie text-gold"></i>
            <h6 className="mb-0 fw-bold">Notification Overview</h6>
            {loading && <span className="spinner-border spinner-border-sm text-muted ms-1"></span>}
            {lastFetch.current && !loading && (
              <small className="text-muted ms-2" style={{ fontSize: '0.72rem' }}>
                Updated {lastFetch.current.toLocaleTimeString()}
              </small>
            )}
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            {/* Date filter buttons */}
            <div className="btn-group btn-group-sm na-filter-group">
              {DATE_FILTERS.map(f => (
                <button
                  key={f.value}
                  className={`btn ${filter === f.value ? 'btn-gold' : 'btn-outline-secondary'}`}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Export buttons */}
            <div className="d-flex gap-1">
              <button className="btn btn-sm btn-outline-secondary" onClick={exportPNG} title="Download chart as PNG">
                <i className="fas fa-image me-1"></i>PNG
              </button>
              <button
                className="btn btn-sm btn-outline-success"
                onClick={exportExcel}
                disabled={exporting === 'excel'}
                title="Export as Excel"
              >
                {exporting === 'excel'
                  ? <span className="spinner-border spinner-border-sm me-1"></span>
                  : <i className="fas fa-file-excel me-1"></i>}
                Excel
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={exportPDF}
                disabled={exporting === 'pdf'}
                title="Export as PDF"
              >
                {exporting === 'pdf'
                  ? <span className="spinner-border spinner-border-sm me-1"></span>
                  : <i className="fas fa-file-pdf me-1"></i>}
                PDF
              </button>
              <button className="btn btn-sm btn-outline-primary" onClick={load} title="Refresh now">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Custom date range row */}
        {filter === 'custom' && (
          <div className="na-custom-range d-flex flex-wrap gap-2 align-items-center px-4 py-3 border-bottom">
            <label className="text-muted small mb-0">From</label>
            <input
              type="date"
              className="form-control form-control-sm na-date-input"
              value={fromDate}
              max={toDate || undefined}
              onChange={e => setFromDate(e.target.value)}
            />
            <label className="text-muted small mb-0">To</label>
            <input
              type="date"
              className="form-control form-control-sm na-date-input"
              value={toDate}
              min={fromDate || undefined}
              onChange={e => setToDate(e.target.value)}
            />
            <button className="btn btn-sm btn-gold" onClick={() => { setLoading(true); load(); }}>
              Apply
            </button>
          </div>
        )}

        {/* Card body */}
        <div className="page-card-body na-chart-body">

          {/* Empty state */}
          {isEmpty && (
            <div className="na-empty">
              <div className="na-empty-icon"><i className="fas fa-bell-slash"></i></div>
              <h6>No Notifications Available</h6>
              <p className="text-muted mb-0">All notification counts are zero for the selected period.</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="na-skeleton">
              <div className="na-skeleton-chart"></div>
              <div className="na-skeleton-legend">
                {[1,2,3,4].map(i => <div key={i} className="na-skeleton-row"></div>)}
              </div>
            </div>
          )}

          {/* Chart + Legend */}
          {!loading && !isEmpty && (
            <div className="na-chart-grid">
              {/* Pie chart */}
              <div className="na-chart-area" ref={chartRef} style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={140}
                      paddingAngle={3}
                      dataKey="value"
                      activeIndex={activeIdx}
                      activeShape={ActiveSlice}
                      onMouseEnter={(_, i) => setActiveIdx(i)}
                      onMouseLeave={() => setActiveIdx(null)}
                      onClick={(entry) => onNavigate?.(entry.pageKey)}
                      isAnimationActive={true}
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      style={{ cursor: 'pointer' }}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.key} fill={COLORS[i % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip total={total} />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center donut label (CSS-positioned, works reliably) */}
                <div className="na-donut-center" style={{ pointerEvents: 'none' }}>
                  <div className="na-donut-total">{total}</div>
                  <div className="na-donut-label">TOTAL</div>
                </div>
              </div>

              {/* Legend */}
              <div className="na-legend">
                <div className="na-legend-title">Category Breakdown</div>
                {(analyticsData?.categories || []).map((cat, i) => {
                  const pct = total > 0 ? ((cat.count / total) * 100).toFixed(1) : 0;
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div
                      key={cat.key}
                      className="na-legend-item"
                      onClick={() => onNavigate?.(cat.pageKey)}
                      style={{ '--na-color': color }}
                      title={`Go to ${cat.label}`}
                    >
                      <span className="na-legend-dot" style={{ background: color }}></span>
                      <div className="na-legend-info">
                        <div className="na-legend-label">{cat.label}</div>
                        <div className="na-legend-bar-wrap">
                          <div
                            className="na-legend-bar"
                            style={{
                              width: `${pct}%`,
                              background: color,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="na-legend-meta">
                        <span className="na-legend-count">{cat.count}</span>
                        <span className="na-legend-pct">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
