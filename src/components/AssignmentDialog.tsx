import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AssignmentDialog.module.css';

interface Worker {
  worker_id: number;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  specialization: string;
  active_count: number;
  completion_rate: number;
  specialization_match: number;
}

interface AssignmentDialogProps {
  reportId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const AssignmentDialog: React.FC<AssignmentDialogProps> = ({ reportId, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [instructions, setInstructions] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['assignment-suggestions', reportId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/assignments/report/${reportId}/suggestions/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
  });

  const { data: allWorkers, isLoading: workersLoading } = useQuery({
    queryKey: ['all-workers'],
    queryFn: async () => {
      const response = await fetch('/api/v1/accounts/workers/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch workers');
      return response.json();
    },
    enabled: manualMode,
  });

  const assignMutation = useMutation({
    mutationFn: async (workerId: number) => {
      const response = await fetch('/api/v1/assignments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          report_id: reportId,
          worker_id: workerId,
          instructions,
        }),
      });
      if (!response.ok) throw new Error('Assignment failed');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Worker assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
      onSuccess?.();
      onClose();
    },
    onError: () => {
      toast.error('Failed to assign worker');
    },
  });

  const handleAssign = (workerId: number) => {
    if (!workerId) {
      toast.error('Please select a worker');
      return;
    }
    assignMutation.mutate(workerId);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Assign Worker</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Mode toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${!manualMode ? styles.active : ''}`}
              onClick={() => setManualMode(false)}
            >
              Recommended
            </button>
            <button
              className={`${styles.modeBtn} ${manualMode ? styles.active : ''}`}
              onClick={() => setManualMode(true)}
            >
              Manual
            </button>
          </div>

          {/* Recommended workers */}
          {!manualMode && (
            <div className={styles.section}>
              <h3>Recommended Workers</h3>
              {suggestionsLoading ? (
                <div className={styles.loading}>
                  <Loader2 size={20} className="spin" />
                  <span>Loading suggestions...</span>
                </div>
              ) : suggestions?.suggestions?.length > 0 ? (
                <div className={styles.workersList}>
                  {suggestions.suggestions.map((worker: Worker) => (
                    <div
                      key={worker.worker_id}
                      className={`${styles.workerCard} ${selectedWorker === worker.worker_id ? styles.selected : ''}`}
                      onClick={() => setSelectedWorker(worker.worker_id)}
                    >
                      <div className={styles.workerHeader}>
                        <div>
                          <h4>{worker.name}</h4>
                          <p className={styles.dept}>{worker.department}</p>
                        </div>
                        {selectedWorker === worker.worker_id && (
                          <Check size={20} color="#16a34a" />
                        )}
                      </div>

                      <div className={styles.workerDetails}>
                        <div className={styles.detail}>
                          <span className={styles.label}>Specialization</span>
                          <span className={styles.value}>{worker.specialization}</span>
                        </div>
                        <div className={styles.detail}>
                          <span className={styles.label}>Active Tasks</span>
                          <span className={styles.value}>{worker.active_count}</span>
                        </div>
                        <div className={styles.detail}>
                          <span className={styles.label}>Completion Rate</span>
                          <span className={styles.value}>{worker.completion_rate}%</span>
                        </div>
                        <div className={styles.detail}>
                          <span className={styles.label}>Match Score</span>
                          <span className={`${styles.value} ${styles.match}`}>
                            {worker.specialization_match}%
                          </span>
                        </div>
                      </div>

                      {worker.phone && (
                        <p className={styles.contact}>📞 {worker.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <AlertCircle size={24} />
                  <p>No suitable workers found</p>
                </div>
              )}
            </div>
          )}

          {/* Manual selection */}
          {manualMode && (
            <div className={styles.section}>
              <h3>Select Worker</h3>
              {workersLoading ? (
                <div className={styles.loading}>
                  <Loader2 size={20} className="spin" />
                  <span>Loading workers...</span>
                </div>
              ) : (
                <select
                  value={selectedWorker || ''}
                  onChange={(e) => setSelectedWorker(parseInt(e.target.value))}
                  className={styles.select}
                >
                  <option value="">Choose a worker...</option>
                  {allWorkers?.results?.map((worker: any) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.full_name} - {worker.department}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className={styles.section}>
            <h3>Instructions (Optional)</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add any special instructions for the worker..."
              className={styles.textarea}
              rows={4}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.assignBtn}
            onClick={() => selectedWorker && handleAssign(selectedWorker)}
            disabled={!selectedWorker || assignMutation.isPending}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 size={16} className="spin" />
                Assigning...
              </>
            ) : (
              'Assign Worker'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDialog;
