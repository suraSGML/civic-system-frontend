import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../services/reports';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30000,
  });

  const count = data?.unread_count || 0;

  return (
    <button
      onClick={() => navigate('/notifications')}
      title="Notifications"
      style={{
        position: 'relative',
        cursor: 'pointer',
        padding: '8px',
        background: count > 0 ? '#eff6ff' : 'transparent',
        border: count > 0 ? '1.5px solid #bfdbfe' : '1.5px solid transparent',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        color: count > 0 ? '#2563eb' : '#64748b',
      }}
    >
      <Bell
        size={20}
        style={{
          animation: count > 0 ? 'bellRing 1s ease-in-out' : 'none',
        }}
      />
      {count > 0 && (
        <span style={{
          position: 'absolute',
          top: 2,
          right: 2,
          background: '#dc2626',
          color: 'white',
          borderRadius: '50%',
          width: 18,
          height: 18,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          border: '2px solid white',
          lineHeight: 1,
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0); }
          20%       { transform: rotate(15deg); }
          40%       { transform: rotate(-12deg); }
          60%       { transform: rotate(8deg); }
          80%       { transform: rotate(-5deg); }
        }
      `}</style>
    </button>
  );
};

export default NotificationBell;
