import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { notificationsApi } from '../services/reports';
import styles from './NotificationsPage.module.css';

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success('All notifications marked as read.');
    },
  });

  const items = (notifications as any)?.results || notifications;
  const unreadCount = items.filter((n: any) => !n.is_read).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Notifications</h1>
          {unreadCount > 0 && <p>{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button
            className={styles.markAllBtn}
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {markAllMutation.isPending ? <Loader2 size={14} className="spin" /> : <CheckCheck size={14} />}
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loading}><Loader2 size={24} className="spin" /></div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <Bell size={48} color="#94a3b8" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((n: any) => (
            <div
              key={n.id}
              className={`${styles.item} ${!n.is_read ? styles.unread : ''}`}
              onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
            >
              <div className={styles.dot} style={{ opacity: n.is_read ? 0 : 1 }} />
              <div className={styles.content}>
                <p className={styles.title}>{n.title}</p>
                <p className={styles.message}>{n.message}</p>
                <p className={styles.time}>{new Date(n.created_at).toLocaleString()}</p>
                {n.data?.report_id && (
                  <Link
                    to={`/reports/${n.data.report_id}`}
                    className={styles.viewLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Report →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
