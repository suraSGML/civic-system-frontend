import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, FileText } from 'lucide-react';
import { analyticsApi } from '../../services/reports';
import { useThemeStore } from '../../store/themeStore';
import styles from './AdminDashboard.module.css';

// ── CSV export helper ──────────────────────────────────────
function exportCSV(filename: string, rows: any[], headers: string[]) {
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const AdminDashboard: React.FC = () => {
  const { dark } = useThemeStore();
  
  // Theme-aware colors
  const COLORS = dark
    ? ['#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#a78bfa', '#06b6d4', '#f472b6']
    : ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0ea5e9', '#ec4899'];
  
  const textColor = dark ? '#cbd5e1' : '#475569';
  const gridColor = dark ? '#334155' : '#e2e8f0';
  const tooltipBg = dark ? '#1e293b' : '#ffffff';
  
  const { data: summary }      = useQuery({ queryKey: ['analytics-summary'],  queryFn: analyticsApi.dashboard });
  const { data: byCategory }   = useQuery({ queryKey: ['analytics-category'], queryFn: analyticsApi.byCategory });
  const { data: bySeverity }   = useQuery({ queryKey: ['analytics-severity'], queryFn: analyticsApi.bySeverity });
  const { data: trend }        = useQuery({ queryKey: ['analytics-trend'],    queryFn: () => analyticsApi.trend(30) });
  const { data: workers }      = useQuery({ queryKey: ['analytics-workers'],  queryFn: analyticsApi.workers });
  const { data: responseTime } = useQuery({ queryKey: ['analytics-response'], queryFn: analyticsApi.responseTime });

  const handleExportSummary = () => {
    if (!summary) return;
    const rows = [
      { metric: 'Total Reports',      value: summary.reports.total },
      { metric: 'Pending',            value: summary.reports.pending },
      { metric: 'In Progress',        value: summary.reports.in_progress },
      { metric: 'Resolved',           value: summary.reports.resolved },
      { metric: 'Active Emergencies', value: summary.reports.emergency_active },
      { metric: 'Resolution Rate',    value: `${summary.performance.resolution_rate}%` },
      { metric: 'Total Citizens',     value: summary.users.total_citizens },
      { metric: 'Total Workers',      value: summary.users.total_workers },
    ];
    exportCSV('civic_summary.csv', rows, ['metric', 'value']);
  };

  const handleExportWorkers = () => {
    if (!workers) return;
    exportCSV('worker_performance.csv', workers,
      ['name', 'department', 'total_assigned', 'completed', 'in_progress', 'completion_rate']);
  };

  const handleExportTrend = () => {
    if (!trend) return;
    exportCSV('report_trend.csv', trend, ['date', 'count', 'resolved', 'emergency']);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Admin Analytics Dashboard</h1>
          <p>Real-time overview of civic issues and response performance</p>
        </div>
        <div className={styles.exportBtns}>
          <button className={styles.exportBtn} onClick={handleExportSummary} disabled={!summary}>
            <Download size={15} /> Export Summary
          </button>
          <button className={styles.exportBtn} onClick={handleExportTrend} disabled={!trend}>
            <FileText size={15} /> Export Trend
          </button>
          <button className={styles.exportBtn} onClick={handleExportWorkers} disabled={!workers}>
            <Download size={15} /> Export Workers
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className={styles.summaryGrid}>
          {[
            { label: 'Total Reports', value: summary.reports.total, color: '#2563eb' },
            { label: 'Pending', value: summary.reports.pending, color: '#d97706' },
            { label: 'In Progress', value: summary.reports.in_progress, color: '#7c3aed' },
            { label: 'Resolved', value: summary.reports.resolved, color: '#16a34a' },
            { label: 'Active Emergencies', value: summary.reports.emergency_active, color: '#dc2626' },
            { label: 'Resolution Rate', value: `${summary.performance.resolution_rate}%`, color: '#0ea5e9' },
          ].map((item) => (
            <div key={item.label} className={styles.summaryCard} style={{ borderTopColor: item.color }}>
              <p className={styles.cardLabel}>{item.label}</p>
              <p className={styles.cardValue} style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className={styles.chartsGrid}>
        {/* Trend chart */}
        {trend && (
          <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
            <h2>Report Submissions (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}` }} />
                <Legend />
                <Line type="monotone" dataKey="count" stroke={COLORS[0]} name="Total" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke={COLORS[2]} name="Resolved" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="emergency" stroke={COLORS[1]} name="Emergency" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By category */}
        {byCategory && (
          <div className={styles.chartCard}>
            <h2>Reports by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" tick={{ fontSize: 11, fill: textColor }} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 10, fill: textColor }} width={120} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}` }} />
                <Bar dataKey="count" fill={COLORS[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By severity */}
        {bySeverity && (
          <div className={styles.chartCard}>
            <h2>Reports by Severity</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={bySeverity}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                >
                  {bySeverity.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}` }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Response time */}
        {responseTime && (
          <div className={styles.chartCard}>
            <h2>Avg Response Time by Category (minutes)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={responseTime}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: textColor }} />
                <YAxis tick={{ fontSize: 11, fill: textColor }} />
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}` }} />
                <Bar dataKey="avg_response_minutes" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Worker performance */}
      {workers && workers.length > 0 && (
        <div className={styles.tableCard}>
          <h2>Worker Performance</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Department</th>
                  <th>Assigned</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w: any) => (
                  <tr key={w.worker_id}>
                    <td>{w.name}</td>
                    <td>{w.department || '—'}</td>
                    <td>{w.total_assigned}</td>
                    <td>{w.completed}</td>
                    <td>{w.in_progress}</td>
                    <td>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{
                            width: `${w.completion_rate}%`,
                            background: w.completion_rate >= 80 ? '#16a34a' : w.completion_rate >= 50 ? '#d97706' : '#dc2626',
                          }}
                        />
                        <span>{w.completion_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
