import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import {
  ThumbsUp, Clock, MapPin, AlertTriangle, CheckCircle,
  Loader2, ArrowLeft, Share2, Copy, Check,
  FileText, Eye, Wrench, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../services/reports';
import { useAuthStore } from '../store/authStore';
import DuplicateDetection from '../components/DuplicateDetection';
import styles from './ReportDetailPage.module.css';

// ── Status timeline config ─────────────────────────────────
const TIMELINE_STEPS = [
  { key: 'pending',      label: 'Submitted',    icon: FileText,    color: '#d97706' },
  { key: 'under_review', label: 'Under Review', icon: Eye,         color: '#2563eb' },
  { key: 'assigned',     label: 'Assigned',     icon: Wrench,      color: '#0ea5e9' },
  { key: 'in_progress',  label: 'In Progress',  icon: Clock,       color: '#7c3aed' },
  { key: 'resolved',     label: 'Resolved',     icon: CheckCircle, color: '#16a34a' },
];

const STATUS_ORDER = ['pending', 'under_review', 'assigned', 'in_progress', 'resolved'];

const ReportTimeline: React.FC<{ currentStatus: string; history: any[] }> = ({ currentStatus, history }) => {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isRejected = currentStatus === 'rejected';

  return (
    <div className={styles.timeline}>
      {isRejected ? (
        <div className={styles.rejectedBanner}>
          <XCircle size={18} /> This report was rejected
        </div>
      ) : (
        TIMELINE_STEPS.map((step, i) => {
          const done    = i < currentIdx || currentStatus === step.key;
          const active  = currentStatus === step.key;
          const Icon    = step.icon;
          const histEntry = history?.find((h: any) => h.new_status === step.key);

          return (
            <div key={step.key} className={styles.timelineStep}>
              <div className={styles.timelineLeft}>
                <div
                  className={`${styles.timelineDot} ${done ? styles.dotDone : ''} ${active ? styles.dotActive : ''}`}
                  style={done || active ? { background: step.color, borderColor: step.color } : {}}
                >
                  {done ? <Check size={12} color="white" /> : <Icon size={12} color={done || active ? 'white' : '#94a3b8'} />}
                </div>
                {i < TIMELINE_STEPS.length - 1 && (
                  <div className={`${styles.timelineLine} ${i < currentIdx ? styles.lineDone : ''}`} />
                )}
              </div>
              <div className={styles.timelineContent}>
                <p className={`${styles.timelineLabel} ${active ? styles.labelActive : ''} ${done ? styles.labelDone : ''}`}>
                  {step.label}
                </p>
                {histEntry && (
                  <p className={styles.timelineMeta}>
                    {histEntry.changed_by_name} · {new Date(histEntry.changed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.detail(Number(id)),
  });

  const upvoteMutation = useMutation({
    mutationFn: () => reportsApi.upvote(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report', id] }),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => reportsApi.addComment(Number(id), content),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      toast.success('Comment added.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => reportsApi.updateStatus(Number(id), status),
    onSuccess: () => {
      setNewStatus('');
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      toast.success('Status updated.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update status.');
    },
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link.');
    }
  };

  if (isLoading) return (
    <div className={styles.loading}>
      <Loader2 size={32} className="spin" color="#2563eb" />
    </div>
  );
  if (!report) return <div className={styles.notFound}>Report not found.</div>;

  const isAdmin  = user?.role === 'authority' || user?.role === 'super_admin';
  const isWorker = user?.role === 'field_worker';

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className={`${styles.shareBtn} ${copied ? styles.shareCopied : ''}`} onClick={handleShare}>
          {copied ? <><Check size={15} /> Copied!</> : <><Share2 size={15} /> Share</>}
        </button>
      </div>

      <div className={styles.layout}>
        {/* ── Main ── */}
        <div className={styles.main}>
          {/* Header */}
          <div className={styles.reportHeader}>
            <div className={styles.badges}>
              <span className={`${styles.badge} severity-${report.severity}`}>
                {report.severity_display}
              </span>
              <span className={`${styles.badge} status-${report.status}`}>
                {report.status_display}
              </span>
              {report.is_emergency && (
                <span className={styles.emergencyBadge}>
                  <AlertTriangle size={13} /> Emergency
                </span>
              )}
            </div>
            <h1>{report.title}</h1>
            <div className={styles.meta}>
              <span><MapPin size={14} /> {report.address || report.city}</span>
              <span><Clock size={14} /> {new Date(report.created_at).toLocaleString()}</span>
              <span>By: {report.is_anonymous ? 'Anonymous' : report.reporter?.full_name}</span>
            </div>
          </div>

          {/* Duplicate detection */}
          {isAdmin && <DuplicateDetection reportId={Number(id)} />}

          {/* Progress timeline */}
          <div className={styles.card}>
            <h2>Progress</h2>
            <ReportTimeline
              currentStatus={report.status}
              history={report.status_history || []}
            />
          </div>

          {/* Description */}
          <div className={styles.card}>
            <h2>Description</h2>
            <p>{report.description}</p>
          </div>

          {/* Media */}
          {report.media_files?.length > 0 && (
            <div className={styles.card}>
              <h2>Evidence ({report.media_files.length} files)</h2>
              <div className={styles.mediaGrid}>
                {report.media_files.map((m: any) => (
                  <div key={m.id} className={styles.mediaItem}>
                    {m.media_type === 'image' ? (
                      <img src={m.file_url} alt="Evidence" />
                    ) : (
                      <video src={m.file_url} controls />
                    )}
                    {m.is_resolution_proof && (
                      <span className={styles.proofTag}>✓ Resolution Proof</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className={styles.card}>
            <h2>Location</h2>
            <div className={styles.mapWrap}>
              <MapContainer
                center={[parseFloat(report.latitude), parseFloat(report.longitude)]}
                zoom={15}
                style={{ height: '260px', borderRadius: '10px' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[parseFloat(report.latitude), parseFloat(report.longitude)]} />
              </MapContainer>
            </div>
          </div>

          {/* Comments */}
          <div className={styles.card}>
            <h2>Comments ({report.comments?.length || 0})</h2>
            <div className={styles.commentList}>
              {report.comments?.length === 0 && (
                <p className={styles.noComments}>No comments yet. Be the first to comment.</p>
              )}
              {report.comments?.map((c: any) => (
                <div key={c.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <div className={styles.commentAvatar}>
                      {c.author_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.commentMeta}>
                        <strong>{c.author_name}</strong>
                        <span className={styles.commentRole}>{c.author_role?.replace('_', ' ')}</span>
                      </div>
                      <span className={styles.commentTime}>
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
            <div className={styles.commentForm}>
              <textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <button
                onClick={() => comment.trim() && commentMutation.mutate(comment)}
                disabled={!comment.trim() || commentMutation.isPending}
              >
                {commentMutation.isPending ? <Loader2 size={14} className="spin" /> : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          {/* Upvote */}
          <div className={styles.card}>
            <h2>Community Verification</h2>
            <button
              className={`${styles.upvoteBtn} ${report.has_upvoted ? styles.upvoted : ''}`}
              onClick={() => upvoteMutation.mutate()}
            >
              <ThumbsUp size={17} />
              {report.has_upvoted ? 'Upvoted' : 'Upvote'} · {report.upvote_count}
            </button>
            <p className={styles.upvoteHint}>Upvote to confirm this issue exists in your area</p>
          </div>

          {/* Status update */}
          {(isAdmin || isWorker) && (
            <div className={styles.card}>
              <h2>Update Status</h2>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className={styles.statusSelect}
              >
                <option value="">Select new status...</option>
                {isAdmin && <>
                  <option value="under_review">Under Review</option>
                  <option value="assigned">Assigned</option>
                  <option value="rejected">Rejected</option>
                </>}
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <button
                className={styles.updateBtn}
                onClick={() => newStatus && statusMutation.mutate(newStatus)}
                disabled={!newStatus || statusMutation.isPending}
              >
                {statusMutation.isPending ? <Loader2 size={15} className="spin" /> : 'Update Status'}
              </button>
            </div>
          )}

          {/* Assignment info */}
          {report.assignment && (
            <div className={styles.card}>
              <h2>Assignment</h2>
              <div className={styles.assignmentInfo}>
                <div className={styles.infoRow}>
                  <span>Worker</span>
                  <strong>{report.assignment.worker_name}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Status</span>
                  <strong>{report.assignment.status_display}</strong>
                </div>
                {report.assignment.instructions && (
                  <div className={styles.infoRow} style={{ flexDirection: 'column', gap: 4 }}>
                    <span>Instructions</span>
                    <p style={{ fontSize: 13, color: '#374151' }}>{report.assignment.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Response time */}
          {report.response_time && (
            <div className={styles.card}>
              <h2>Response Time</h2>
              <p className={styles.responseTime}>
                <CheckCircle size={18} color="#16a34a" />
                {report.response_time < 60
                  ? `${report.response_time} min`
                  : `${Math.round(report.response_time / 60)} hrs`}
              </p>
            </div>
          )}

          {/* Report info */}
          <div className={styles.card}>
            <h2>Report Info</h2>
            <div className={styles.assignmentInfo}>
              <div className={styles.infoRow}>
                <span>Category</span>
                <strong>{report.category_display}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>City</span>
                <strong>{report.city}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>Region</span>
                <strong>{report.region}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>Report ID</span>
                <strong>#{report.id}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailPage;
