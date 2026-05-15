import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserX, UserCheck, Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import styles from './AdminUsersPage.module.css';

const ROLE_COLORS: Record<string, string> = {
  citizen: '#2563eb',
  field_worker: '#7c3aed',
  authority: '#d97706',
  super_admin: '#dc2626',
};

const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [banModal, setBanModal] = useState<{ user: any; action: 'ban' | 'unban' } | null>(null);
  const [banReason, setBanReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () =>
      api.get('/auth/admin/users/', { params: { search, role: roleFilter } }).then((r) => r.data),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: string; reason?: string }) =>
      api.post(`/auth/admin/users/${id}/ban/`, { action, reason }).then((r) => r.data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(vars.action === 'ban' ? 'User banned.' : 'User unbanned.');
      setBanModal(null);
      setBanReason('');
    },
    onError: () => toast.error('Action failed.'),
  });

  const users = data?.results || data || [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>User Management</h1>
          <p>{data?.count ?? users.length} users total</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={15} color="#94a3b8" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="citizen">Citizen</option>
          <option value="field_worker">Field Worker</option>
          <option value="authority">Authority</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {isLoading ? (
        <div className={styles.loading}><Loader2 size={24} className="spin" /></div>
      ) : users.length === 0 ? (
        <div className={styles.empty}>
          <Users size={48} color="#94a3b8" />
          <p>No users found</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>City</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className={u.is_banned ? styles.bannedRow : ''}>
                  <td>
                    <div className={styles.userCell}>
                      <div
                        className={styles.avatar}
                        style={{ background: ROLE_COLORS[u.role] + '20', color: ROLE_COLORS[u.role] }}
                      >
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <div>
                        <p className={styles.userName}>{u.first_name} {u.last_name}</p>
                        <p className={styles.userEmail}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={styles.roleBadge}
                      style={{ background: ROLE_COLORS[u.role] + '15', color: ROLE_COLORS[u.role] }}
                    >
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={styles.cityCell}>{u.city || '—'}</td>
                  <td className={styles.dateCell}>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td>
                    {u.is_banned ? (
                      <span className={styles.bannedBadge}>Banned</span>
                    ) : u.is_verified ? (
                      <span className={styles.verifiedBadge}>Verified</span>
                    ) : (
                      <span className={styles.pendingBadge}>Unverified</span>
                    )}
                  </td>
                  <td>
                    {u.is_banned ? (
                      <button
                        className={styles.unbanBtn}
                        onClick={() => setBanModal({ user: u, action: 'unban' })}
                      >
                        <UserCheck size={13} /> Unban
                      </button>
                    ) : (
                      <button
                        className={styles.banBtn}
                        onClick={() => setBanModal({ user: u, action: 'ban' })}
                      >
                        <UserX size={13} /> Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ban/Unban Modal */}
      {banModal && (
        <div className={styles.modalOverlay} onClick={() => setBanModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{banModal.action === 'ban' ? 'Ban User' : 'Unban User'}</h2>
            <p>
              {banModal.action === 'ban'
                ? `Are you sure you want to ban ${banModal.user.first_name} ${banModal.user.last_name}?`
                : `Unban ${banModal.user.first_name} ${banModal.user.last_name}?`}
            </p>
            {banModal.action === 'ban' && (
              <div className={styles.field}>
                <label>Reason (optional)</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for ban..."
                />
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setBanModal(null)}>Cancel</button>
              <button
                className={banModal.action === 'ban' ? styles.banBtn : styles.unbanBtn}
                disabled={banMutation.isPending}
                onClick={() =>
                  banMutation.mutate({
                    id: banModal.user.id,
                    action: banModal.action,
                    reason: banReason,
                  })
                }
              >
                {banMutation.isPending ? <Loader2 size={14} className="spin" /> : null}
                Confirm {banModal.action === 'ban' ? 'Ban' : 'Unban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
