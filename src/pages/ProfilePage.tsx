import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Save, Loader2, CheckCircle, Eye, EyeOff, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import styles from './ProfilePage.module.css';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  bio: z.string().optional(),
});

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Required'),
  new_password: z.string().min(8, 'At least 8 characters'),
  new_password_confirm: z.string().min(1, 'Required'),
}).refine((d) => d.new_password === d.new_password_confirm, {
  message: 'Passwords do not match',
  path: ['new_password_confirm'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen',
  field_worker: 'Field Worker',
  authority: 'Authority',
  super_admin: 'Super Admin',
};

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    notify_email: (user as any)?.notify_email ?? true,
    notify_sms:   (user as any)?.notify_sms   ?? false,
    notify_push:  (user as any)?.notify_push  ?? true,
    digest: (user as any)?.digest || 'none',
  });

  const notifMutation = useMutation({
    mutationFn: (data: object) => api.patch('/auth/profile/', data).then(r => r.data),
    onSuccess: (data) => { updateUser(data); toast.success('Notification preferences saved!'); },
    onError: () => toast.error('Failed to save preferences.'),
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: (user as any)?.phone || '',
      city: user?.city || '',
      region: (user as any)?.region || '',
      bio: (user as any)?.bio || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      api.patch('/auth/profile/', data).then((r) => r.data),
    onSuccess: (data) => {
      updateUser(data);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile.'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.post('/auth/change-password/', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Password changed!');
      passwordForm.reset();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.old_password?.[0] || 'Failed to change password.';
      toast.error(msg);
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatarLarge}>
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
        <div>
          <h1>{user?.first_name} {user?.last_name}</h1>
          <p className={styles.roleTag}>{ROLE_LABELS[user?.role || ''] || user?.role}</p>
          <p className={styles.emailText}>{user?.email}</p>
          {user?.is_verified && (
            <span className={styles.verifiedBadge}>
              <CheckCircle size={13} /> Verified
            </span>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'profile' ? styles.activeTab : ''}`}
          onClick={() => setTab('profile')}
        >
          <User size={15} /> Edit Profile
        </button>
        <button
          className={`${styles.tab} ${tab === 'password' ? styles.activeTab : ''}`}
          onClick={() => setTab('password')}
        >
          <Lock size={15} /> Change Password
        </button>
        <button
          className={`${styles.tab} ${tab === 'notifications' ? styles.activeTab : ''}`}
          onClick={() => setTab('notifications')}
        >
          <Bell size={15} /> Notifications
        </button>
      </div>

      {tab === 'profile' && (
        <div className={styles.card}>
          <form
            onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
            className={styles.form}
          >
            <div className={styles.row}>
              <div className={styles.field}>
                <label>First Name</label>
                <input {...profileForm.register('first_name')} />
                {profileForm.formState.errors.first_name && (
                  <span className={styles.error}>{profileForm.formState.errors.first_name.message}</span>
                )}
              </div>
              <div className={styles.field}>
                <label>Last Name</label>
                <input {...profileForm.register('last_name')} />
                {profileForm.formState.errors.last_name && (
                  <span className={styles.error}>{profileForm.formState.errors.last_name.message}</span>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label>Phone Number</label>
              <input {...profileForm.register('phone')} placeholder="+251..." />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>City</label>
                <input {...profileForm.register('city')} placeholder="Bahir Dar" />
              </div>
              <div className={styles.field}>
                <label>Region</label>
                <input {...profileForm.register('region')} placeholder="Amhara" />
              </div>
            </div>

            <div className={styles.field}>
              <label>Bio</label>
              <textarea {...profileForm.register('bio')} rows={3} placeholder="Tell us about yourself..." />
            </div>

            <button type="submit" className={styles.saveBtn} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className={styles.card}>
          <form
            onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
            className={styles.form}
          >
            <div className={styles.field}>
              <label>Current Password</label>
              <div className={styles.pwWrap}>
                <input
                  type={showOld ? 'text' : 'password'}
                  {...passwordForm.register('old_password')}
                />
                <button type="button" onClick={() => setShowOld(!showOld)}>
                  {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordForm.formState.errors.old_password && (
                <span className={styles.error}>{passwordForm.formState.errors.old_password.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>New Password</label>
              <div className={styles.pwWrap}>
                <input
                  type={showNew ? 'text' : 'password'}
                  {...passwordForm.register('new_password')}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <span className={styles.error}>{passwordForm.formState.errors.new_password.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Confirm New Password</label>
              <input type="password" {...passwordForm.register('new_password_confirm')} />
              {passwordForm.formState.errors.new_password_confirm && (
                <span className={styles.error}>{passwordForm.formState.errors.new_password_confirm.message}</span>
              )}
            </div>

            <button type="submit" className={styles.saveBtn} disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
              Change Password
            </button>
          </form>
        </div>
      )}
      {tab === 'notifications' && (
        <div className={styles.card}>
          <div className={styles.form}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Alert Channels</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Choose how you want to receive notifications.</p>

            {[
              { key: 'notify_email', label: 'Email Notifications', desc: 'Receive updates via email' },
              { key: 'notify_sms',   label: 'SMS Notifications',   desc: 'Receive SMS alerts for emergencies' },
              { key: 'notify_push',  label: 'Push Notifications',  desc: 'In-app real-time alerts' },
            ].map(({ key, label, desc }) => (
              <label key={key} className={styles.toggleRow}>
                <div>
                  <p className={styles.toggleLabel}>{label}</p>
                  <p className={styles.toggleDesc}>{desc}</p>
                </div>
                <div
                  className={`${styles.toggle} ${(notifPrefs as any)[key] ? styles.toggleOn : ''}`}
                  onClick={() => setNotifPrefs({ ...notifPrefs, [key]: !(notifPrefs as any)[key] })}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </label>
            ))}

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20, marginTop: 4 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Email Digest</h3>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 14 }}>Get a summary of activity in your area.</p>
              <div className={styles.digestOptions}>
                {[
                  { value: 'none',    label: 'None',    desc: 'No digest' },
                  { value: 'daily',   label: 'Daily',   desc: 'Every morning' },
                  { value: 'weekly',  label: 'Weekly',  desc: 'Every Monday' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`${styles.digestOption} ${notifPrefs.digest === opt.value ? styles.digestSelected : ''}`}
                  >
                    <input
                      type="radio"
                      name="digest"
                      value={opt.value}
                      checked={notifPrefs.digest === opt.value}
                      onChange={() => setNotifPrefs({ ...notifPrefs, digest: opt.value })}
                    />
                    <div>
                      <p className={styles.digestLabel}>{opt.label}</p>
                      <p className={styles.digestDesc}>{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              className={styles.saveBtn}
              onClick={() => notifMutation.mutate({
                notify_email: notifPrefs.notify_email,
                notify_sms:   notifPrefs.notify_sms,
                notify_push:  notifPrefs.notify_push,
              })}
              disabled={notifMutation.isPending}
            >
              {notifMutation.isPending ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
