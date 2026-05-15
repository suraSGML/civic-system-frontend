import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, MapPin, Bell, User,
  LogOut, Menu, X, AlertTriangle, ClipboardList,
  BarChart3, Shield, Wrench, Users, Moon, Sun,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import NotificationBell from '../notifications/NotificationBell';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { dark, toggle: toggleDark } = useThemeStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'authority' || user?.role === 'super_admin';

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/reports/new', icon: AlertTriangle, label: 'Report Issue' },
    { to: '/map', icon: MapPin, label: 'Live Map' },
    ...(user?.role === 'field_worker' ? [
      { to: '/worker', icon: Wrench, label: 'My Tasks' },
    ] : []),
    ...(isAdmin ? [
      { to: '/admin', icon: BarChart3, label: 'Analytics' },
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/assignments', icon: ClipboardList, label: 'Assignments' },
    ] : []),
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Shield size={18} color="white" />
            </div>
            <span>CivicSystem</span>
          </div>
          <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className={styles.userText}>
            <p className={styles.userName}>{user?.full_name}</p>
            <p className={styles.userRole}>{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navSection}>Main</span>
          {navItems.slice(0, 4).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} className={styles.navIcon} />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.role === 'field_worker' && (
            <>
              <span className={styles.navSection}>Work</span>
              <NavLink
                to="/worker"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Wrench size={17} className={styles.navIcon} />
                <span>My Tasks</span>
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <span className={styles.navSection}>Admin</span>
              {navItems.filter(n => n.to.startsWith('/admin')).map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin'}
                  className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={17} className={styles.navIcon} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}

          <span className={styles.navSection}>Account</span>
          {navItems.filter(n => n.to === '/notifications' || n.to === '/profile').map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} className={styles.navIcon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className={styles.headerRight}>
            <button
              onClick={toggleDark}
              className={styles.iconBtn}
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <NotificationBell />
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
