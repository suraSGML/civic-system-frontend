import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, AlertTriangle, CheckCircle, Loader2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './WorkerDashboard.module.css';

interface Assignment {
  id: number;
  report_id: number;
  report: {
    id: number;
    title: string;
    category: string;
    severity: string;
    address: string;
    latitude: string;
    longitude: string;
  };
  status: string;
  status_display: string;
  instructions: string;
  created_at: string;
  estimated_completion: string | null;
  priority: number;
}

const WorkerDashboard: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-assignments', filter],
    queryFn: async () => {
      const response = await fetch('/api/v1/assignments/my/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    },
  });

  const priorityColors = {
    1: '#94a3b8', // normal - gray
    2: '#f59e0b', // high - amber
    3: '#ef4444', // urgent - red
  };

  const priorityLabels = {
    1: 'Normal',
    2: 'High',
    3: 'Urgent',
  };

  const severityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
    critical: '🟣',
  };

  const filteredAssignments = assignments?.filter((a: Assignment) => {
    if (filter === 'all') return true;
    return a.status === filter;
  }) || [];

  const stats = {
    pending: assignments?.filter((a: Assignment) => a.status === 'pending').length || 0,
    in_progress: assignments?.filter((a: Assignment) => a.status === 'in_progress').length || 0,
    completed: assignments?.filter((a: Assignment) => a.status === 'completed').length || 0,
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>My Tasks</h1>
          <p className={styles.subtitle}>Manage your assigned reports</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
            <Clock size={24} color="#f59e0b" />
          </div>
          <div>
            <p className={styles.statLabel}>Pending</p>
            <p className={styles.statValue}>{stats.pending}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
            <AlertTriangle size={24} color="#2563eb" />
          </div>
          <div>
            <p className={styles.statLabel}>In Progress</p>
            <p className={styles.statValue}>{stats.in_progress}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
            <CheckCircle size={24} color="#16a34a" />
          </div>
          <div>
            <p className={styles.statLabel}>Completed</p>
            <p className={styles.statValue}>{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filterBar}>
        <Filter size={16} />
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All Tasks
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'in_progress' ? styles.active : ''}`}
          onClick={() => setFilter('in_progress')}
        >
          In Progress
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className={styles.loading}>
          <Loader2 size={32} className="spin" />
          <p>Loading tasks...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className={styles.empty}>
          <CheckCircle size={48} color="#cbd5e1" />
          <p>No tasks {filter !== 'all' ? `in ${filter} status` : 'assigned'}</p>
        </div>
      ) : (
        <div className={styles.tasksList}>
          {filteredAssignments.map((assignment: Assignment) => (
            <Link
              key={assignment.id}
              to={`/reports/${assignment.report_id}`}
              className={styles.taskCard}
              style={{ borderLeftColor: priorityColors[assignment.priority as keyof typeof priorityColors] }}
            >
              <div className={styles.taskHeader}>
                <div>
                  <h3>{assignment.report.title}</h3>
                  <p className={styles.category}>
                    {severityIcons[assignment.report.severity as keyof typeof severityIcons]} {assignment.report.category}
                  </p>
                </div>
                <span className={`${styles.priority} priority-${assignment.priority}`}>
                  {priorityLabels[assignment.priority as keyof typeof priorityLabels]}
                </span>
              </div>

              <div className={styles.taskDetails}>
                <div className={styles.detailRow}>
                  <MapPin size={14} />
                  <span>{assignment.report.address}</span>
                </div>
                <div className={styles.detailRow}>
                  <Clock size={14} />
                  <span>Assigned {new Date(assignment.created_at).toLocaleDateString()}</span>
                </div>
                {assignment.estimated_completion && (
                  <div className={styles.detailRow}>
                    <AlertTriangle size={14} />
                    <span>Due {new Date(assignment.estimated_completion).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {assignment.instructions && (
                <div className={styles.instructions}>
                  <p className={styles.instructionsLabel}>Instructions:</p>
                  <p className={styles.instructionsText}>{assignment.instructions}</p>
                </div>
              )}

              <div className={styles.taskFooter}>
                <span className={`${styles.status} status-${assignment.status}`}>
                  {assignment.status_display}
                </span>
                <span className={styles.arrow}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
