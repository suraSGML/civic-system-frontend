import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Clock, MapPin, Loader2, Wrench,
  AlertTriangle, FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { assignmentsApi } from '../../services/reports';
import styles from './WorkerDashboard.module.css';

const STATUS_FLOW: Record<string, string> = {
  pending: 'accepted',
  accepted: 'in_progress',
  in_progress: 'completed',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Accept Task',
  accepted: 'Start Work',
  in_progress: 'Mark Complete',
};

const PRIORITY_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'Normal',  color: '#16a34a' },
  2: { label: 'High',    color: '#d97706' },
  3: { label: 'Urgent',  color: '#dc2626' },
};

const WorkerDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notesMap, setNotesMap] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: assignmentsApi.myAssignments,
    refetchInterval: 30000,
  });

  // Handle both paginated { results: [] } and plain array responses
  const assignments: any[] = data?.results ?? (Array.isArray(data) ? data : []);

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      assignmentsApi.updateMy(id, { status, worker_notes: notes }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['my-assignments'] });
      const label = vars.status === 'completed' ? 'Task completed! 🎉' : 'Assignment updated!';
      toast.success(label);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.status?.[0] || 'Failed to update assignment.';
      toast.error(msg);
    },
  });

  const active    = assignments.filter((a) => ['pending', 'accepted', 'in_progress'].includes(a.status));
  const completed = assignments.filter((a) => a.status === 'completed');
  const cancelled = assignments.filter((a) => a.status === 'cancelled');

  const getStatusColor = (status: string) => ({
    pending:     '#d97706',
    accepted:    '#2563eb',
    in_progress: '#7c3aed',
    completed:   '#16a34a',
    cancelled:   '#dc2626',
  }[status] || '#64748b');

  const handleProgress = (assignment: any) => {
    const nextStatus = STATUS_FLOW[assignment.status];
    if (!nextStatus) return;
    updateMutation.mutate({
      id: assignment.id,
      status: nextStatus,
      notes: notesMap[assignment.id] || '',
    });
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}><Loader2 size={28} className="spin" /></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>My Tasks</h1>
          <p>Field worker assignment dashboard</p>
        </div>
        <div className={styles.statsRow}>
          <span className={styles.statPill} style={{ background: 'rgba(217,119,6,0.2)', borderColor: 'rgba(217,119,6,0.3)' }}>
            <Clock size={14} /> {active.filter(a => a.status === 'pending').length} Pending
          </span>
          <span className={styles.statPill} style={{ background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.3)' }}>
            <Wrench size={14} /> {active.filter(a => a.status === 'in_progress').length} In Progress
          </span>
          <span className={styles.statPill} style={{ background: 'rgba(22,163,74,0.2)', borderColor: 'rgba(22,163,74,0.3)' }}>
            <CheckCircle size={14} /> {completed.length} Done
          </span>
        </div>
      </div>

      {/* Active assignments */}
      {active.length === 0 ? (
        <div className={styles.empty}>
          <Wrench size={52} color="#94a3b8" />
          <p>No active assignments</p>
          <span>You'll be notified when new tasks are assigned to you.</span>
        </div>
      ) : (
        <div className={styles.assignmentList}>
          <h2 className={styles.sectionTitle}>
            <AlertTriangle size={18} color="#d97706" /> Active Tasks ({active.length})
          </h2>
          {active.map((assignment: any) => {
            const priority = PRIORITY_LABEL[assignment.priority] || PRIORITY_LABEL[1];
            const isExpanded = expandedId === assignment.id;
            const nextStatus = STATUS_FLOW[assignment.status];

            return (
              <div key={assignment.id} className={styles.assignmentCard}>
                {/* Priority stripe */}
                <div
                  className={styles.priorityStripe}
                  style={{ background: priority.color }}
                />

                <div className={styles.cardInner}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleRow}>
                      <h3>{assignment.report_title || `Report #${assignment.report}`}</h3>
                      <div className={styles.cardBadges}>
                        <span
                          className={styles.priorityBadge}
                          style={{ background: priority.color + '18', color: priority.color, border: `1px solid ${priority.color}30` }}
                        >
                          {priority.label}
                        </span>
                        <span
                          className={styles.statusBadge}
                          style={{ background: getStatusColor(assignment.status) + '18', color: getStatusColor(assignment.status) }}
                        >
                          {assignment.status_display || assignment.status}
                        </span>
                      </div>
                    </div>
                    <p className={styles.assignedAt}>
                      Assigned {new Date(assignment.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {assignment.estimated_completion && (
                        <span className={styles.dueDate}>
                          · Due {new Date(assignment.estimated_completion).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>

                  {assignment.instructions && (
                    <div className={styles.instructions}>
                      <strong>📋 Instructions:</strong> {assignment.instructions}
                    </div>
                  )}

                  {/* Expandable notes */}
                  {nextStatus && (
                    <div className={styles.notesToggle}>
                      <button
                        className={styles.toggleBtn}
                        onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Hide notes' : 'Add completion notes'}
                      </button>
                      {isExpanded && (
                        <textarea
                          className={styles.notesInput}
                          placeholder="Optional notes about this task..."
                          value={notesMap[assignment.id] || ''}
                          onChange={(e) => setNotesMap({ ...notesMap, [assignment.id]: e.target.value })}
                          rows={3}
                        />
                      )}
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <Link to={`/reports/${assignment.report}`} className={styles.viewBtn}>
                      <MapPin size={14} /> View Report
                    </Link>
                    {nextStatus && (
                      <button
                        className={`${styles.progressBtn} ${assignment.status === 'in_progress' ? styles.completeBtn : ''}`}
                        onClick={() => handleProgress(assignment)}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 size={14} className="spin" />
                        ) : assignment.status === 'in_progress' ? (
                          <><CheckCircle size={14} /> Mark Complete</>
                        ) : assignment.status === 'pending' ? (
                          <><CheckCircle size={14} /> Accept Task</>
                        ) : (
                          <><Wrench size={14} /> Start Work</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div className={styles.completedSection}>
          <h2 className={styles.sectionTitle}>
            <CheckCircle size={18} color="#16a34a" /> Completed Tasks ({completed.length})
          </h2>
          <div className={styles.completedList}>
            {completed.slice(0, 15).map((a: any) => (
              <div key={a.id} className={styles.completedItem}>
                <CheckCircle size={16} color="#16a34a" />
                <div className={styles.completedInfo}>
                  <p>{a.report_title || `Report #${a.report}`}</p>
                  <span>
                    Completed {a.completed_at
                      ? new Date(a.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
                <Link to={`/reports/${a.report}`} className={styles.viewSmallBtn}>
                  <FileText size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled tasks */}
      {cancelled.length > 0 && (
        <div className={styles.cancelledSection}>
          <h2 className={styles.sectionTitle} style={{ color: '#64748b' }}>
            Cancelled ({cancelled.length})
          </h2>
          <div className={styles.completedList}>
            {cancelled.slice(0, 5).map((a: any) => (
              <div key={a.id} className={`${styles.completedItem} ${styles.cancelledItem}`}>
                <span style={{ color: '#dc2626', fontSize: 16 }}>✕</span>
                <div className={styles.completedInfo}>
                  <p>{a.report_title || `Report #${a.report}`}</p>
                  {a.cancellation_reason && <span>{a.cancellation_reason}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
