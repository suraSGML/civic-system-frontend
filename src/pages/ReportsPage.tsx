import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, ChevronRight, X, SlidersHorizontal, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../services/reports';
import { useAuthStore } from '../store/authStore';
import styles from './ReportsPage.module.css';

// ── Debounce hook ──────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const CATEGORIES = [
  { value: 'damaged_road',      label: '🛣️ Damaged Road' },
  { value: 'broken_streetlight',label: '💡 Broken Streetlight' },
  { value: 'water_supply',      label: '💧 Water Supply' },
  { value: 'electricity',       label: '⚡ Electricity' },
  { value: 'waste',             label: '🗑️ Waste' },
  { value: 'sewage',            label: '🚰 Sewage' },
  { value: 'public_property',   label: '🏛️ Public Property' },
  { value: 'crime',             label: '🚨 Crime' },
  { value: 'accident',          label: '🚗 Accident' },
  { value: 'fire',              label: '🔥 Fire' },
  { value: 'flood',             label: '🌊 Flood' },
  { value: 'medical',           label: '🏥 Medical' },
  { value: 'noise',             label: '🔊 Noise' },
  { value: 'other',             label: '📌 Other' },
];

const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'authority' || user?.role === 'super_admin';

  const [searchInput, setSearchInput]   = useState('');
  const [selectedIds, setSelectedIds]   = useState<number[]>([]);
  const [bulkStatus, setBulkStatus]     = useState('');
  const [showBulk, setShowBulk]         = useState(false);
  const [isExporting, setIsExporting]   = useState(false);
  const [filters, setFilters] = useState({
    category: '', severity: '', status: '', page: 1,
  });

  const debouncedSearch = useDebounce(searchInput, 350);
  const searchRef = useRef<HTMLInputElement>(null);

  // Autocomplete suggestions from current results
  const [showSuggestions, setShowSuggestions] = useState(false);

  const queryFilters = { ...filters, search: debouncedSearch };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['reports', queryFilters],
    queryFn: () => reportsApi.list(queryFilters),
  });

  const reports    = data?.results || [];
  const totalPages = data?.total_pages || 1;
  const totalCount = data?.count || 0;

  // Suggestions: titles from current results matching the typed text
  const suggestions = searchInput.length > 1
    ? reports
        .map((r: any) => r.title)
        .filter((t: string) => t.toLowerCase().includes(searchInput.toLowerCase()))
        .slice(0, 5)
    : [];

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ category: '', severity: '', status: '', page: 1 });
  };

  const hasFilters = searchInput || filters.category || filters.severity || filters.status;

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === reports.length ? [] : reports.map((r: any) => r.id));

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => reportsApi.updateStatus(id, bulkStatus)));
      setSelectedIds([]);
      setBulkStatus('');
      setShowBulk(false);
      // Refetch
      window.location.reload();
    } catch {
      alert('Some updates failed.');
    }
  };

  const handleBulkExport = async (format: 'csv' | 'pdf') => {
    if (selectedIds.length === 0) {
      toast.error('Please select reports to export');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/v1/reports/bulk/export/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          report_ids: selectedIds,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedIds.length} reports as ${format.toUpperCase()}`);
      setSelectedIds([]);
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>All Reports</h1>
          {totalCount > 0 && <p className={styles.subtitle}>{totalCount} reports found</p>}
        </div>
        <div className={styles.headerActions}>
          {isAdmin && (
            <button
              className={`${styles.bulkToggleBtn} ${showBulk ? styles.active : ''}`}
              onClick={() => { setShowBulk(!showBulk); setSelectedIds([]); }}
            >
              <SlidersHorizontal size={15} />
              Bulk Update
            </button>
          )}
          <Link to="/reports/new" className={styles.newBtn}>
            <AlertTriangle size={15} /> New Report
          </Link>
        </div>
      </div>

      {/* Bulk action bar */}
      {showBulk && isAdmin && (
        <div className={styles.bulkBar}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectedIds.length === reports.length && reports.length > 0}
              onChange={toggleSelectAll}
            />
            Select all ({selectedIds.length} selected)
          </label>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className={styles.bulkSelect}
          >
            <option value="">Set status...</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            className={styles.bulkApplyBtn}
            disabled={!bulkStatus || selectedIds.length === 0}
            onClick={handleBulkUpdate}
          >
            Apply to {selectedIds.length} report{selectedIds.length !== 1 ? 's' : ''}
          </button>
          
          {selectedIds.length > 0 && (
            <div className={styles.bulkExportButtons}>
              <button
                className={styles.exportBtn}
                disabled={isExporting}
                onClick={() => handleBulkExport('csv')}
                title="Export as CSV"
              >
                {isExporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
                CSV
              </button>
              <button
                className={styles.exportBtn}
                disabled={isExporting}
                onClick={() => handleBulkExport('pdf')}
                title="Export as PDF"
              >
                {isExporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
                PDF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        {/* Search with autocomplete */}
        <div className={styles.searchContainer} ref={searchRef as any}>
          <div className={`${styles.searchWrap} ${isFetching ? styles.searching : ''}`}>
            <Search size={16} color="#94a3b8" />
            <input
              placeholder="Search reports..."
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {searchInput && (
              <button className={styles.clearSearch} onClick={() => setSearchInput('')}>
                <X size={14} />
              </button>
            )}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((s: string, i: number) => (
                <button
                  key={i}
                  className={styles.suggestion}
                  onMouseDown={() => { setSearchInput(s); setShowSuggestions(false); }}
                >
                  <Search size={13} color="#94a3b8" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value, page: 1 })}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value, page: 1 })}>
          <option value="">All Severities</option>
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🔴 High</option>
          <option value="critical">🟣 Critical</option>
        </select>

        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>

        {hasFilters && (
          <button className={styles.clearBtn} onClick={clearFilters}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className={styles.loadingGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} style={{ width: '60%', height: 14 }} />
              <div className={styles.skeletonLine} style={{ width: '90%', height: 20, marginTop: 10 }} />
              <div className={styles.skeletonLine} style={{ width: '40%', height: 12, marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className={styles.empty}>
          <Search size={48} color="#cbd5e1" />
          <p>No reports found</p>
          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.reportGrid}>
            {reports.map((r: any) => (
              <div key={r.id} className={styles.cardWrapper}>
                {showBulk && isAdmin && (
                  <input
                    type="checkbox"
                    className={styles.cardCheckbox}
                    checked={selectedIds.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                  />
                )}
                <Link
                  to={`/reports/${r.id}`}
                  className={`${styles.reportCard} ${selectedIds.includes(r.id) ? styles.selected : ''}`}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.cardMeta}>
                      <span className={`${styles.badge} severity-${r.severity}`}>{r.severity_display}</span>
                      {r.is_emergency && (
                        <span className={styles.emergencyTag}>
                          <AlertTriangle size={10} /> Emergency
                        </span>
                      )}
                    </div>
                    <span className={`${styles.badge} status-${r.status}`}>{r.status_display}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{r.title}</h3>
                  <p className={styles.cardCategory}>{r.category_display}</p>
                  <div className={styles.cardFooter}>
                    <span>📍 {r.city}</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    <span>👍 {r.upvote_count}</span>
                    <ChevronRight size={14} color="#94a3b8" />
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button disabled={!data?.previous} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>
                ← Previous
              </button>
              <span>Page {filters.page} of {totalPages}</span>
              <button disabled={!data?.next} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
