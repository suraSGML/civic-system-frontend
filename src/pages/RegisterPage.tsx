import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import styles from './AuthPage.module.css';

const schema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((pwd) => /[A-Z]/.test(pwd), 'Password must contain at least one uppercase letter')
    .refine((pwd) => /[a-z]/.test(pwd), 'Password must contain at least one lowercase letter')
    .refine((pwd) => /[0-9]/.test(pwd), 'Password must contain at least one number')
    .refine((pwd) => !/^\d+$/.test(pwd), 'Password cannot be entirely numeric'),
  password_confirm: z.string(),
}).refine((d) => d.password === d.password_confirm, {
  message: 'Passwords do not match',
  path: ['password_confirm'],
});

type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { city: 'Bahir Dar' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
      toast.success('Account created! Welcome to CivicSystem.');
      navigate('/dashboard');
    } catch (err: any) {
      const errors = err.response?.data;
      if (errors?.email) {
        toast.error(`Email: ${Array.isArray(errors.email) ? errors.email[0] : errors.email}`);
      } else if (errors?.password) {
        const passwordErrors = Array.isArray(errors.password) ? errors.password : [errors.password];
        toast.error(`Password: ${passwordErrors.join(', ')}`);
      } else if (errors?.non_field_errors) {
        const fieldErrors = Array.isArray(errors.non_field_errors) ? errors.non_field_errors : [errors.non_field_errors];
        toast.error(fieldErrors[0]);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 480 }}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <Shield size={32} color="#2563eb" />
          </div>
          <h1>Create Account</h1>
          <p>Join CivicSystem Ethiopia</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className={styles.field}>
              <label>First Name</label>
              <input placeholder="Abebe" {...register('first_name')} />
              {errors.first_name && <span className={styles.error}>{errors.first_name.message}</span>}
            </div>
            <div className={styles.field}>
              <label>Last Name</label>
              <input placeholder="Kebede" {...register('last_name')} />
              {errors.last_name && <span className={styles.error}>{errors.last_name.message}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" {...register('email')} />
            {errors.email && <span className={styles.error}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Phone Number (optional)</label>
            <input type="tel" placeholder="+251 91 234 5678" {...register('phone')} />
          </div>

          <div className={styles.field}>
            <label>City</label>
            <input placeholder="Bahir Dar" {...register('city')} />
          </div>

          <div className={styles.field}>
            <label>Region (optional)</label>
            <input placeholder="Amhara" {...register('region')} />
          </div>

          <div className={styles.field}>
            <label>Password</label>
            <input type="password" placeholder="Min. 8 characters" {...register('password')} />
            {errors.password && <span className={styles.error}>{errors.password.message}</span>}
          </div>

          <div className={styles.field}>
            <label>Confirm Password</label>
            <input type="password" placeholder="Repeat password" {...register('password_confirm')} />
            {errors.password_confirm && <span className={styles.error}>{errors.password_confirm.message}</span>}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? <Loader2 size={18} className="spin" /> : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
