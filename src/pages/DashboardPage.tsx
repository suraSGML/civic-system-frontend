import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText, AlertTriangle, CheckCircle, Clock,
  TrendingUp, Users, Zap, MapPin,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { reportsApi, analyticsApi } from '../services/reports';
import styles from './DashboardPage.module.css';

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}> = ({ icon, label, value, color, sub }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon} style={{ background: color + '20', color }}>
      {icon}
    </div>
    <div>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'authority' || user?.role === 'super_admin';

  const { data: myReports } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => reportsApi.myReports({ page_size: 5 }),
    enabled: !isAdmin,
  });

  const { data: analytics } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: analyticsApi.dashboard,
    enabled: isAdmin,
  });

  const { data: emergencyReports } = useQuery({
    queryKey: ['emergency-reports'],
    queryFn: reportsApi.emergency,
    enabled: isAdmin,
  });

  return (
    <div className={styles.page}>
      <div className={styles.welcomeBar}>
        <div>
          <h1>Welcome back, {user?.first_name} 👋</h1>
          <p>Here's what's happening in {user?.city || 'your city'} today.</p>
        </div>
        <Link to="/reports/new" className={styles.reportBtn}>
          <AlertTriangle size={16} />
          Report an Issue
        </Link>
      </div>

      {/* Admin stats */}
      {isAdmin && analytics && (
        <>
          <div className={styles.statsGrid}>
            <StatCard
              icon={<FileText size={22} />}
              label="Total Reports"
              value={analytics.reports.total}
              color="#2563eb"
              sub={`+${analytics.reports.today} today`}
            />
            <StatCard
              icon={<Clock size={22} />}
              label="Pending"
              value={analytics.reports.pending}
              color="#d97706"
            />
            <StatCard
              icon={<Zap size={22} />}
              label="In Progress"
              value={analytics.reports.in_progress}
              color="#7c3aed"
            />
            <StatCard
              icon={<CheckCircle size={22} />}
              label="Resolved"
              value={analytics.reports.resolved}
              color="#16a34a"
              sub={`${analytics.performance.resolution_rate}% rate`}
            />
            <StatCard
              icon={<AlertTriangle size={22} />}
              label="Active Emergencies"
              value={analytics.reports.emergency_active}
              color="#dc2626"
            />
            <StatCard
              icon={<Users size={22} />}
              label="Active Workers"
              value={analytics.users.active_workers}
              color="#0ea5e9"
              sub={`of ${analytics.users.total_workers} total`}
            />
          </div>

          {/* Emergency alerts */}
          {emergencyReports?.results?.length > 0 && (
            <div className={styles.emergencySection}>
              <h2 className={styles.sectionTitle}>
                <AlertTriangle size={18} color="#dc2626" />
                Active Emergencies
              </h2>
              <div className={styles.emergencyList}>
                {emergencyReports.results.slice(0, 5).map((r: any) => (
                  <Link key={r.id} to={`/reports/${r.id}`} className={styles.emergencyItem}>
                    <div className={`${styles.severityDot} severity-${r.severity}`} />
                    <div>
                      <p className={styles.emergencyTitle}>{r.title}</p>
                      <p className={styles.emergencyMeta}>
                        {r.category_display} · {r.city} · {new Date(r.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`${styles.badge} status-${r.status}`}>
                      {r.status_display}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Citizen view */}
      {!isAdmin && (
        <div className={styles.citizenSection}>
          <div className={styles.statsGrid}>
            <StatCard
              icon={<FileText size={22} />}
              label="My Reports"
              value={myReports?.count || 0}
              color="#2563eb"
            />
            <StatCard
              icon={<Clock size={22} />}
              label="Pending"
              value={myReports?.results?.filter((r: any) => r.status === 'pending').length || 0}
              color="#d97706"
            />
            <StatCard
              icon={<CheckCircle size={22} />}
              label="Resolved"
              value={myReports?.results?.filter((r: any) => r.status === 'resolved').length || 0}
              color="#16a34a"
            />
          </div>

          <div className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Reports</h2>
              <Link to="/reports" className={styles.viewAll}>View all</Link>
            </div>
            {myReports?.results?.length === 0 ? (
              <div className={styles.empty}>
                <FileText size={40} color="#94a3b8" />
                <p>No reports yet. <Link to="/reports/new">Report your first issue</Link></p>
              </div>
            ) : (
              <div className={styles.reportList}>
                {myReports?.results?.map((r: any) => (
                  <Link key={r.id} to={`/reports/${r.id}`} className={styles.reportItem}>
                    <div>
                      <p className={styles.reportTitle}>{r.title}</p>
                      <p className={styles.reportMeta}>
                        {r.category_display} · {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`${styles.badge} status-${r.status}`}>
                      {r.status_display}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link to="/reports/new" className={styles.actionCard}>
            <AlertTriangle size={24} color="#dc2626" />
            <span>Report Issue</span>
          </Link>
          <Link to="/map" className={styles.actionCard}>
            <MapPin size={24} color="#2563eb" />
            <span>View Map</span>
          </Link>
          <Link to="/reports" className={styles.actionCard}>
            <FileText size={24} color="#7c3aed" />
            <span>All Reports</span>
          </Link>
          {isAdmin && (
            <Link to="/admin" className={styles.actionCard}>
              <TrendingUp size={24} color="#16a34a" />
              <span>Analytics</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
