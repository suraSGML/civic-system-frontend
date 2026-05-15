import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, ClipboardList, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { assignmentsApi } from '../../services/reports';
import styles from './AdminAssignmentsPage.module.css';

const STATUS_COLORS: Record<string, string> = {
  pending: '#d97706',
  accepted: '#2563eb',
  in_progress: '#7c3aed',
  completed: '#16a34a',
  cancelled: '#dc2626',
};

const AdminAssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    report: '',
    worker: '',
    priority: '1',
    instructions: '',
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['admin-assignments'],
    queryFn: assignmentsApi.list,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/auth/workers/').then((r) => r.data),
  });

  const { data: reports } = useQuery({
    queryKey: ['reports-for-assign'],
    queryFn: () =>
      api.get('/reports/', { params: { status: 'pending', page_size: 50 } }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => assignmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      toast.success('Assignment created!');
      setShowCreate(false);
      setForm({ report: '', worker: '', priority: '1', instructions: '' });
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.report?.[0] ||
        err.response?.data?.worker?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        'Failed to create assignment.';
      toast.error(msg);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => assignmentsApi.cancel(id, 'Cancelled by admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
      toast.success('Assignment cancelled.');
    },
    onError: () => toast.error('Failed to cancel.'),
  });

  const items = (assignments as any)?.results || assignments;
  const reportList = reports?.results || [];
  const workerList = (workers as any)?.results || workers;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Assignments</h1>
          <p>{items.length} total assignments</p>
        </div>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}><Loader2 size={24} className="spin" /></div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <ClipboardList size={48} color="#94a3b8" />
          <p>No assignments yet</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Report</th>
                <th>Worker</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <a href={`/reports/${a.report}`} className={styles.reportLink}>
                      {a.report_title || `Report #${a.report}`}
                    </a>
                  </td>
                  <td>{a.worker_name || '—'}</td>
                  <td>
                    <span className={styles.priority}>
                      {a.priority === 3 ? '🔴 Urgent' : a.priority === 2 ? '🟡 High' : '🟢 Normal'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: (STATUS_COLORS[a.status] || '#64748b') + '15',
                        color: STATUS_COLORS[a.status] || '#64748b',
                      }}
                    >
                      {a.status_display}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(a.assigned_at).toLocaleDateString()}
                  </td>
                  <td>
                    {['pending', 'accepted', 'in_progress'].includes(a.status) && (
                      <button
                        className={styles.cancelBtn}
                        onClick={() => cancelMutation.mutate(a.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <X size={12} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>New Assignment</h2>
              <button onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>

            <div className={styles.form}>
              <div className={styles.field}>
                <label>Report *</label>
                <select value={form.report} onChange={(e) => setForm({ ...form, report: e.target.value })}>
                  <option value="">Select a report...</option>
                  {reportList.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} — {r.title.slice(0, 60)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Field Worker *</label>
                <select value={form.worker} onChange={(e) => setForm({ ...form, worker: e.target.value })}>
                  <option value="">Select a worker...</option>
                  {workerList.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} {w.department ? `(${w.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="1">Normal</option>
                  <option value="2">High</option>
                  <option value="3">Urgent</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  rows={3}
                  placeholder="Instructions for the worker..."
                />
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelModalBtn} onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button
                  className={styles.submitBtn}
                  disabled={!form.report || !form.worker || createMutation.isPending}
                  onClick={() =>
                    createMutation.mutate({
                      report: Number(form.report),
                      worker: Number(form.worker),
                      priority: Number(form.priority),
                      instructions: form.instructions,
                    })
                  }
                >
                  {createMutation.isPending ? <Loader2 size={14} className="spin" /> : null}
                  Create Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignmentsPage;
