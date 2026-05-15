import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import styles from './AuthPage.module.css';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password/', { token, new_password: password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid or expired reset link.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p style={{ textAlign: 'center', color: '#dc2626' }}>Invalid reset link.</p>
          <Link to="/forgot-password" className={styles.link} style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <Shield size={32} color="#2563eb" />
          </div>
          <h1>Reset Password</h1>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>New Password</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 size={18} className="spin" /> : 'Reset Password'}
          </button>
        </form>

        <p className={styles.switchText}>
          <Link to="/login" className={styles.link}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
