import React from 'react';
import { FileText, Clock, User, Wrench, CheckCircle, XCircle } from 'lucide-react';
import styles from './ReportProgress.module.css';

interface ReportProgressProps {
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

const ReportProgress: React.FC<ReportProgressProps> = ({ status, createdAt, resolvedAt }) => {
  const stages = [
    { status: 'pending', label: 'Submitted', icon: FileText, color: '#94a3b8' },
    { status: 'under_review', label: 'Under Review', icon: Clock, color: '#f59e0b' },
    { status: 'assigned', label: 'Assigned', icon: User, color: '#3b82f6' },
    { status: 'in_progress', label: 'In Progress', icon: Wrench, color: '#8b5cf6' },
    { status: 'resolved', label: 'Resolved', icon: CheckCircle, color: '#10b981' },
  ];

  const terminalStages = [
    { status: 'rejected', label: 'Rejected', icon: XCircle, color: '#ef4444' },
    { status: 'duplicate', label: 'Duplicate', icon: XCircle, color: '#6b7280' },
  ];

  // Check if status is terminal
  const isTerminal = ['resolved', 'rejected', 'duplicate'].includes(status);
  const currentStages = isTerminal && status !== 'resolved' ? terminalStages : stages;
  const currentIndex = currentStages.findIndex(s => s.status === status);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.progress}>
      <div className={styles.timeline}>
        {currentStages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;

          return (
            <div key={stage.status} className={styles.stageWrapper}>
              <div
                className={`${styles.stage} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
                style={{
                  borderColor: isActive || isCompleted ? stage.color : '#e5e7eb',
                  backgroundColor: isActive ? stage.color + '15' : isCompleted ? stage.color + '10' : 'transparent',
                }}
              >
                <Icon
                  size={20}
                  style={{
                    color: isActive || isCompleted ? stage.color : '#9ca3af',
                  }}
                />
              </div>
              <span className={styles.label}>{stage.label}</span>
              {isCompleted && <span className={styles.checkmark}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Timeline info */}
      <div className={styles.info}>
        <p className={styles.created}>
          <strong>Submitted:</strong> {formatDate(createdAt)}
        </p>
        {resolvedAt && (
          <p className={styles.resolved}>
            <strong>Resolved:</strong> {formatDate(resolvedAt)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReportProgress;
