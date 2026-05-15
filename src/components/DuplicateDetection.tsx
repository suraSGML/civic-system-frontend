import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Link2, Merge, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './DuplicateDetection.module.css';

interface Duplicate {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  status_display: string;
  created_at: string;
  reporter_name: string;
  similarity: number;
  upvote_count: number;
}

interface DuplicateDetectionProps {
  reportId: number;
  onMerge?: () => void;
}

const DuplicateDetection: React.FC<DuplicateDetectionProps> = ({ reportId, onMerge }) => {
  const queryClient = useQueryClient();
  const [selectedDuplicate, setSelectedDuplicate] = useState<number | null>(null);
  const [action, setAction] = useState<'merge' | 'link' | null>(null);

  const { data: duplicates, isLoading } = useQuery({
    queryKey: ['duplicates', reportId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/reports/${reportId}/duplicates/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch duplicates');
      return response.json();
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async (duplicateId: number) => {
      const response = await fetch('/api/v1/reports/bulk/merge/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          primary_id: reportId,
          duplicate_id: duplicateId,
        }),
      });
      if (!response.ok) throw new Error('Merge failed');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Reports merged successfully');
      setSelectedDuplicate(null);
      setAction(null);
      queryClient.invalidateQueries({ queryKey: ['duplicates', reportId] });
      onMerge?.();
    },
    onError: () => {
      toast.error('Failed to merge reports');
    },
  });

  const linkMutation = useMutation({
    mutationFn: async (duplicateId: number) => {
      const response = await fetch('/api/v1/reports/bulk/link/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          report_id_1: reportId,
          report_id_2: duplicateId,
        }),
      });
      if (!response.ok) throw new Error('Link failed');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Reports linked successfully');
      setSelectedDuplicate(null);
      setAction(null);
    },
    onError: () => {
      toast.error('Failed to link reports');
    },
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={20} className="spin" />
        <span>Checking for duplicates...</span>
      </div>
    );
  }

  if (!duplicates?.duplicates || duplicates.duplicates.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <AlertTriangle size={20} />
        <div>
          <h3>Potential Duplicates Found</h3>
          <p>{duplicates.count} similar report(s) in this area</p>
        </div>
      </div>

      <div className={styles.duplicatesList}>
        {duplicates.duplicates.map((dup: Duplicate) => (
          <div
            key={dup.id}
            className={`${styles.duplicateItem} ${selectedDuplicate === dup.id ? styles.selected : ''}`}
            onClick={() => setSelectedDuplicate(selectedDuplicate === dup.id ? null : dup.id)}
          >
            <div className={styles.itemHeader}>
              <div className={styles.itemInfo}>
                <h4>{dup.title}</h4>
                <p className={styles.similarity}>
                  {dup.similarity}% match
                </p>
              </div>
              <span className={`${styles.badge} status-${dup.status}`}>
                {dup.status_display}
              </span>
            </div>

            {selectedDuplicate === dup.id && (
              <>
                <div className={styles.itemDetails}>
                  <p className={styles.description}>{dup.description}</p>
                  <div className={styles.meta}>
                    <span>📍 {dup.category}</span>
                    <span>👤 {dup.reporter_name}</span>
                    <span>👍 {dup.upvote_count}</span>
                    <span>📅 {new Date(dup.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    className={`${styles.actionBtn} ${styles.merge}`}
                    onClick={() => setAction(action === 'merge' ? null : 'merge')}
                  >
                    <Merge size={16} />
                    Merge
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.link}`}
                    onClick={() => setAction(action === 'link' ? null : 'link')}
                  >
                    <Link2 size={16} />
                    Link
                  </button>
                </div>

                {action === 'merge' && (
                  <div className={styles.confirmation}>
                    <p>Merge this report into the current one?</p>
                    <p className={styles.note}>
                      The duplicate will be marked as merged, and upvotes will be combined.
                    </p>
                    <div className={styles.confirmButtons}>
                      <button
                        className={styles.confirmBtn}
                        onClick={() => mergeMutation.mutate(dup.id)}
                        disabled={mergeMutation.isPending}
                      >
                        {mergeMutation.isPending ? <Loader2 size={14} className="spin" /> : 'Confirm Merge'}
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setAction(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {action === 'link' && (
                  <div className={styles.confirmation}>
                    <p>Link these reports as related?</p>
                    <p className={styles.note}>
                      Both reports will remain active but marked as related.
                    </p>
                    <div className={styles.confirmButtons}>
                      <button
                        className={styles.confirmBtn}
                        onClick={() => linkMutation.mutate(dup.id)}
                        disabled={linkMutation.isPending}
                      >
                        {linkMutation.isPending ? <Loader2 size={14} className="spin" /> : 'Confirm Link'}
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setAction(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DuplicateDetection;
