import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { MapPin, Upload, X, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import { reportsApi } from '../services/reports';
import styles from './CreateReportPage.module.css';

const CATEGORIES = [
  { value: 'damaged_road', label: '🛣️ Damaged Road', group: 'Infrastructure' },
  { value: 'broken_streetlight', label: '💡 Broken Street Light', group: 'Infrastructure' },
  { value: 'water_supply', label: '💧 Water Supply Problem', group: 'Infrastructure' },
  { value: 'electricity', label: '⚡ Electricity Outage', group: 'Infrastructure' },
  { value: 'waste', label: '🗑️ Waste Accumulation', group: 'Infrastructure' },
  { value: 'sewage', label: '🚰 Sewage Problem', group: 'Infrastructure' },
  { value: 'crime', label: '🚨 Crime Incident', group: 'Safety' },
  { value: 'accident', label: '🚗 Traffic Accident', group: 'Safety' },
  { value: 'fire', label: '🔥 Fire Emergency', group: 'Safety' },
  { value: 'flood', label: '🌊 Flood / Disaster', group: 'Safety' },
  { value: 'medical', label: '🏥 Medical Emergency', group: 'Safety' },
  { value: 'other', label: '📋 Other', group: 'Other' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low', color: '#16a34a', desc: 'Minor inconvenience' },
  { value: 'medium', label: 'Medium', color: '#d97706', desc: 'Needs attention' },
  { value: 'high', label: 'High', color: '#dc2626', desc: 'Urgent issue' },
  { value: 'critical', label: 'Critical', color: '#7c3aed', desc: 'Emergency!' },
];

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().min(20, 'Please provide more details (min 20 chars)'),
  category: z.string().min(1, 'Please select a category'),
  severity: z.string().min(1, 'Please select severity'),
  address: z.string().optional(),
  city: z.string().default('Bahir Dar'),
  is_anonymous: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

const CreateReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { severity: 'medium', city: 'Bahir Dar', is_anonymous: false },
  });

  const selectedCategory = watch('category');
  const selectedSeverity = watch('severity');
  const isEmergencyCategory = ['crime', 'accident', 'fire', 'flood', 'medical'].includes(selectedCategory);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles].slice(0, 5));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxSize: 50 * 1024 * 1024,
  });

  const getLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
        toast.success('Location captured!');
      },
      () => {
        setGettingLocation(false);
        toast.error('Could not get location. Please enter manually.');
      }
    );
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!location) throw new Error('Location is required');
      const report = await reportsApi.create({
        ...data,
        latitude: location.lat,
        longitude: location.lng,
      });
      // Upload media files
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('media_type', file.type.startsWith('video') ? 'video' : 'image');
        await reportsApi.uploadMedia(report.id, fd);
      }
      return report;
    },
    onSuccess: (report) => {
      toast.success('Report submitted successfully!');
      navigate(`/reports/${report.id}`);
    },
    onError: (err: any) => {
      const msg = err.message || err.response?.data?.detail || 'Failed to submit report.';
      toast.error(msg);
    },
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Report an Issue</h1>
        <p>Help improve your community by reporting civic problems</p>
      </div>

      {isEmergencyCategory && (
        <div className={styles.emergencyBanner}>
          <AlertTriangle size={20} />
          <div>
            <strong>Emergency Category Selected</strong>
            <p>This report will be flagged as an emergency and authorities will be notified immediately.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className={styles.form}>
        {/* Category */}
        <div className={styles.section}>
          <h2>Issue Category</h2>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`${styles.categoryBtn} ${selectedCategory === cat.value ? styles.selected : ''}`}
                onClick={() => setValue('category', cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {errors.category && <span className={styles.error}>{errors.category.message}</span>}
        </div>

        {/* Severity */}
        <div className={styles.section}>
          <h2>Severity Level</h2>
          <div className={styles.severityGrid}>
            {SEVERITIES.map((sev) => (
              <button
                key={sev.value}
                type="button"
                className={`${styles.severityBtn} ${selectedSeverity === sev.value ? styles.selected : ''}`}
                style={selectedSeverity === sev.value ? { borderColor: sev.color, background: sev.color + '15' } : {}}
                onClick={() => setValue('severity', sev.value)}
              >
                <span style={{ color: sev.color, fontWeight: 700 }}>{sev.label}</span>
                <span className={styles.sevDesc}>{sev.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className={styles.section}>
          <h2>Issue Details</h2>
          <div className={styles.field}>
            <label>Title *</label>
            <input
              placeholder="Brief description of the issue"
              {...register('title')}
              className={errors.title ? styles.inputError : ''}
            />
            {errors.title && <span className={styles.error}>{errors.title.message}</span>}
          </div>
          <div className={styles.field}>
            <label>Description *</label>
            <textarea
              rows={4}
              placeholder="Provide detailed information about the issue..."
              {...register('description')}
              className={errors.description ? styles.inputError : ''}
            />
            {errors.description && <span className={styles.error}>{errors.description.message}</span>}
          </div>
        </div>

        {/* Location */}
        <div className={styles.section}>
          <h2>Location</h2>
          <button type="button" className={styles.locationBtn} onClick={getLocation} disabled={gettingLocation}>
            {gettingLocation ? <Loader2 size={16} className="spin" /> : <MapPin size={16} />}
            {location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Get My Location'}
          </button>
          <div className={styles.field} style={{ marginTop: 12 }}>
            <label>Address (optional)</label>
            <input placeholder="Street address or landmark" {...register('address')} />
          </div>
          <div className={styles.field}>
            <label>City</label>
            <input placeholder="Bahir Dar" {...register('city')} />
          </div>
          {!location && <p className={styles.locationHint}>⚠️ Location is required to submit a report.</p>}
        </div>

        {/* Media */}
        <div className={styles.section}>
          <h2>Photos / Videos (optional)</h2>
          <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''}`}>
            <input {...getInputProps()} />
            <Upload size={32} color="#94a3b8" />
            <p>Drag & drop photos or videos here, or click to select</p>
            <span>Max 5 files · 50MB each</span>
          </div>
          {files.length > 0 && (
            <div className={styles.fileList}>
              {files.map((f, i) => (
                <div key={i} className={styles.fileItem}>
                  <span>{f.name}</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className={styles.section}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" {...register('is_anonymous')} />
            Submit anonymously (your name won't be shown publicly)
          </label>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={mutation.isPending || !location}
          >
            {mutation.isPending ? <Loader2 size={18} className="spin" /> : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateReportPage;
