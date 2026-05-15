import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import styles from './AuthPage.module.css';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <Shield size={32} color="#2563eb" />
          </div>
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: '#16a34a', fontWeight: 600, marginBottom: 8 }}>
              ✅ Reset link sent!
            </p>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Check your email for the password reset link. It expires in 2 hours.
            </p>
            <Link to="/login" className={styles.link} style={{ display: 'block', marginTop: 16 }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className={styles.switchText}>
          <Link to="/login" className={styles.link}>
            <ArrowLeft size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
