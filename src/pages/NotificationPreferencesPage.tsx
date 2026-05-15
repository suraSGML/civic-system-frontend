import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Mail, MessageSquare, Clock, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './NotificationPreferencesPage.module.css';

interface Preferences {
  new_report: boolean;
  status_update: boolean;
  assignment: boolean;
  emergency: boolean;
  comment: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  digest_mode: boolean;
  digest_frequency: 'daily' | 'weekly';
  dnd_enabled: boolean;
  dnd_start: string;
  dnd_end: string;
  category_preferences: Record<string, boolean>;
}

const NotificationPreferencesPage: React.FC = () => {
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  const { isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/v1/notifications/preferences/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      setPrefs(data);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Preferences>) => {
      const response = await fetch('/api/v1/notifications/preferences/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update preferences');
      return response.json();
    },
    onSuccess: (data) => {
      setPrefs(data);
      toast.success('Preferences updated');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  const handleToggle = (key: keyof Preferences) => {
    if (!prefs) return;
    const newValue = !prefs[key];
    setPrefs({ ...prefs, [key]: newValue });
    updateMutation.mutate({ [key]: newValue } as any);
  };

  const handleChange = (key: keyof Preferences, value: any) => {
    if (!prefs) return;
    setPrefs({ ...prefs, [key]: value });
    updateMutation.mutate({ [key]: value } as any);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader2 size={32} className="spin" />
        <p>Loading preferences...</p>
      </div>
    );
  }

  if (!prefs) return <div>Failed to load preferences</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Notification Preferences</h1>
        <p>Customize how and when you receive notifications</p>
      </div>

      <div className={styles.sections}>
        {/* Notification Types */}
        <section className={styles.section}>
          <h2>
            <Bell size={20} />
            Notification Types
          </h2>
          <div className={styles.options}>
            <label className={styles.option}>
              <input
                type="checkbox"
                checked={prefs.new_report}
                onChange={() => handleToggle('new_report')}
              />
              <div>
                <span className={styles.label}>New Reports</span>
                <p>Get notified when new reports are submitted</p>
              </div>
            </label>

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={prefs.status_update}
                onChange={() => handleToggle('status_update')}
              />
              <div>
                <span className={styles.label}>Status Updates</span>
                <p>Get notified when report status changes</p>
              </div>
            </label>

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={prefs.assignment}
                onChange={() => handleToggle('assignment')}
              />
              <div>
                <span className={styles.label}>Assignments</span>
                <p>Get notified when you're assigned a task</p>
              </div>
            </label>

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={prefs.emergency}
                onChange={() => handleToggle('emergency')}
              />
              <div>
                <span className={styles.label}>Emergency Alerts</span>
                <p>Get notified about emergency reports</p>
              </div>
            </label>

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={prefs.comment}
                onChange={() => handleToggle('comment')}
              />
              <div>
                <span className={styles.label}>Comments</span>
                <p>Get notified when someone comments on your report</p>
              </div>
            </label>
          </div>
        </section>

        {/* Channels */}
        <section className={styles.section}>
          <h2>
            <Mail size={20} />
            Notification Channels
          </h2>
          <div className={styles.options}>
            <label className={styles.option}>
              <input
                type="checkbox"
                checked={prefs.push_enabled}
                onChange={() => handleToggle('push_enabled')}
              />
              <div>
                <span className={styles.label}>Push Notifications</span>
                <p>Receive notifications in the app</p>
              </div>
            </label>

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={prefs.email_enabled}
                onChange={() => handleToggle('email_enabled')}
              />
              <div>
                <span className={styles.label}>Email</span>
                <p>Receive notifications via email</p>
              </div>
            </label>

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={prefs.sms_enabled}
                onChange={() => handleToggle('sms_enabled')}
              />
              <div>
                <span className={styles.label}>SMS</span>
                <p>Receive notifications via text message</p>
              </div>
            </label>
          </div>
        </section>

        {/* Digest Mode */}
        <section className={styles.section}>
          <h2>
            <MessageSquare size={20} />
            Digest Mode
          </h2>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={prefs.digest_mode}
              onChange={() => handleToggle('digest_mode')}
            />
            <div>
              <span className={styles.label}>Enable Digest Mode</span>
              <p>Receive a summary of notifications instead of individual alerts</p>
            </div>
          </label>

          {prefs.digest_mode && (
            <div className={styles.subOption}>
              <label>
                <span>Digest Frequency</span>
                <select
                  value={prefs.digest_frequency}
                  onChange={(e) => handleChange('digest_frequency', e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
            </div>
          )}
        </section>

        {/* Do Not Disturb */}
        <section className={styles.section}>
          <h2>
            <Clock size={20} />
            Do Not Disturb
          </h2>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={prefs.dnd_enabled}
              onChange={() => handleToggle('dnd_enabled')}
            />
            <div>
              <span className={styles.label}>Enable Do Not Disturb</span>
              <p>Pause notifications during specific hours</p>
            </div>
          </label>

          {prefs.dnd_enabled && (
            <div className={styles.subOption}>
              <label>
                <span>Start Time</span>
                <input
                  type="time"
                  value={prefs.dnd_start}
                  onChange={(e) => handleChange('dnd_start', e.target.value)}
                />
              </label>
              <label>
                <span>End Time</span>
                <input
                  type="time"
                  value={prefs.dnd_end}
                  onChange={(e) => handleChange('dnd_end', e.target.value)}
                />
              </label>
            </div>
          )}
        </section>

        {/* Save Status */}
        {updateMutation.isPending && (
          <div className={styles.saving}>
            <Loader2 size={16} className="spin" />
            <span>Saving...</span>
          </div>
        )}

        {updateMutation.isSuccess && (
          <div className={styles.saved}>
            <Check size={16} />
            <span>Preferences saved</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;
