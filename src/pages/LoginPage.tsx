import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import styles from './AuthPage.module.css';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.non_field_errors?.[0] ||
                  err.response?.data?.detail ||
                  'Login failed. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <Shield size={32} color="#2563eb" />
          </div>
          <h1>CivicSystem Ethiopia</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className={errors.email ? styles.inputError : ''}
            />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Password</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? styles.inputError : ''}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          <div className={styles.forgotWrap}>
            <Link to="/forgot-password" className={styles.link}>Forgot password?</Link>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <Loader2 size={18} className="spin" /> : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
