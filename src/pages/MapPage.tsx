import React, { useState, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { reportsApi } from '../services/reports';
import styles from './MapPage.module.css';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SEVERITY_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
  critical: '#7c3aed',
};

const createIcon = (color: string, isEmergency: boolean) =>
  L.divIcon({
    className: isEmergency ? styles.emergencyMarker : '',
    html: `<div style="
      width: ${isEmergency ? 18 : 14}px;
      height: ${isEmergency ? 18 : 14}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [isEmergency ? 18 : 14, isEmergency ? 18 : 14],
    iconAnchor: [isEmergency ? 9 : 7, isEmergency ? 9 : 7],
  });

const CATEGORIES = [
  'All', 'damaged_road', 'broken_streetlight', 'water_supply',
  'electricity', 'waste', 'crime', 'accident', 'fire', 'flood', 'medical',
];

const MapPage: React.FC = () => {
  const [filters, setFilters] = useState({ category: '', severity: '' });

  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['map-reports', filters],
    queryFn: () => reportsApi.mapData(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    ),
    refetchInterval: 30000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Show error toast if query fails
  React.useEffect(() => {
    if (error) {
      toast.error('Failed to load map data. Please try again.');
      console.error('Map data error:', error);
    }
  }, [error]);

  // Bahir Dar, Ethiopia center
  const center: [number, number] = [11.5936, 37.3906];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Live Issue Map</h1>
        <p>{reports.length} active reports</p>
      </div>

      <div className={styles.controls}>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className={styles.select}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c === 'All' ? '' : c}>
              {c === 'All' ? 'All Categories' : c.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          className={styles.select}
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <div className={styles.legend}>
          {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
            <span key={sev} className={styles.legendItem}>
              <span style={{ background: color }} className={styles.dot} />
              {sev}
            </span>
          ))}
          <span className={styles.legendItem}>
            <span style={{ background: '#dc2626', animation: 'pulse-emergency 1.5s infinite' }} className={styles.dot} />
            emergency
          </span>
        </div>
      </div>

      <div className={styles.mapWrap}>
        {isLoading && <div className={styles.loading}>Loading map data...</div>}
        {error && <div className={styles.error}>Failed to load map. Please refresh.</div>}
        {!isLoading && reports.length === 0 && (
          <div className={styles.empty}>No reports found in this area.</div>
        )}
        <MapContainer center={center} zoom={13} className={styles.map}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((report: any) => {
            // Validate coordinates
            const lat = parseFloat(report.latitude);
            const lng = parseFloat(report.longitude);
            
            if (isNaN(lat) || isNaN(lng)) {
              console.warn(`Invalid coordinates for report ${report.id}`);
              return null;
            }

            return (
              <Marker
                key={report.id}
                position={[lat, lng]}
                icon={createIcon(
                  SEVERITY_COLORS[report.severity] || '#64748b',
                  report.is_emergency,
                )}
              >
                <Popup>
                  <div className={styles.popup}>
                    <p className={styles.popupTitle}>{report.title}</p>
                    <p className={styles.popupMeta}>
                      <span className={`severity-${report.severity}`} style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>
                        {report.severity}
                      </span>
                      <span className={`status-${report.status}`} style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>
                        {report.status}
                      </span>
                    </p>
                    <Link to={`/reports/${report.id}`} className={styles.popupLink}>
                      View Details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
