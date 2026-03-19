import React, { useEffect, useState, useCallback } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { Save, Trash2, Plus, RefreshCw, X, ChevronDown } from 'lucide-react';

interface Segment {
  segmentId: string;
  orgId: string;
  segmentName: string;
  segmentDescription: string;
  segmentType: 'system' | 'custom';
  color: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrgOption {
  orgId: string;
  orgName: string;
}

interface BackfillResult {
  orgId: string;
  totalPersons: number;
  reassigned: number;
  segmentDistribution: Record<string, number>;
}

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)',
};

const SegmentsPage: React.FC = () => {
  const { apiFetch, baseApiFetch } = useWorldData();

  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ segmentName: '', segmentDescription: '', color: '' });
  const [saving, setSaving] = useState(false);

  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ segmentName: '', segmentDescription: '', color: '#6b7280' });
  const [creating, setCreating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Backfill state
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null);

  // Fetch orgs on mount
  useEffect(() => {
    apiFetch('/clients')
      .then((data: OrgOption[]) => {
        const sorted = data.sort((a, b) => (a.orgName || '').localeCompare(b.orgName || ''));
        setOrgs(sorted);
        if (sorted.length > 0 && !selectedOrg) {
          setSelectedOrg(sorted[0].orgId);
        }
      })
      .catch(() => {});
  }, [apiFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch segments when org changes
  const fetchSegments = useCallback(async () => {
    if (!selectedOrg) return;
    setLoading(true);
    setError(null);
    setBackfillResult(null);
    try {
      const data = await baseApiFetch('/segments', {
        headers: { 'X-Internal-Org-Id': selectedOrg },
      });
      setSegments(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedOrg, baseApiFetch]);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  // Edit
  const startEdit = (seg: Segment) => {
    setEditingId(seg.segmentId);
    setEditForm({
      segmentName: seg.segmentName,
      segmentDescription: seg.segmentDescription,
      color: seg.color,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !selectedOrg) return;
    setSaving(true);
    try {
      const updated = await baseApiFetch(`/segments/${encodeURIComponent(editingId)}`, {
        method: 'PUT',
        headers: { 'X-Internal-Org-Id': selectedOrg },
        body: JSON.stringify(editForm),
      });
      setSegments(prev => prev.map(s => s.segmentId === editingId ? { ...s, ...updated } : s));
      setEditingId(null);
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Create
  const handleCreate = async () => {
    if (!selectedOrg || !createForm.segmentName.trim()) return;
    setCreating(true);
    try {
      const created = await baseApiFetch('/segments', {
        method: 'POST',
        headers: { 'X-Internal-Org-Id': selectedOrg },
        body: JSON.stringify(createForm),
      });
      setSegments(prev => [...prev, created]);
      setShowCreate(false);
      setCreateForm({ segmentName: '', segmentDescription: '', color: '#6b7280' });
    } catch (e: any) {
      alert('Failed to create: ' + e.message);
    } finally {
      setCreating(false);
    }
  };

  // Delete
  const handleDelete = async (segmentId: string) => {
    if (!selectedOrg) return;
    setDeletingId(segmentId);
    try {
      await baseApiFetch(`/segments/${encodeURIComponent(segmentId)}`, {
        method: 'DELETE',
        headers: { 'X-Internal-Org-Id': selectedOrg },
      });
      setSegments(prev => prev.filter(s => s.segmentId !== segmentId));
    } catch (e: any) {
      alert('Failed to delete: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Backfill
  const handleBackfill = async () => {
    if (!selectedOrg) return;
    if (!window.confirm(`Re-classify all users for ${orgs.find(o => o.orgId === selectedOrg)?.orgName || selectedOrg}? This will update segment assignments based on current user attributes.`)) return;
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const result = await baseApiFetch('/segments/backfill', {
        method: 'POST',
        headers: { 'X-Internal-Org-Id': selectedOrg },
        body: JSON.stringify({}),
      });
      setBackfillResult(result);
      // Refresh segments to get updated counts
      await fetchSegments();
    } catch (e: any) {
      alert('Backfill failed: ' + e.message);
    } finally {
      setBackfilling(false);
    }
  };

  // Backfill all orgs
  const handleBackfillAll = async () => {
    if (!window.confirm('Re-classify users for ALL organizations? This may take a while.')) return;
    setBackfilling(true);
    setBackfillResult(null);
    const results: BackfillResult[] = [];
    for (const org of orgs) {
      try {
        const result = await baseApiFetch('/segments/backfill', {
          method: 'POST',
          headers: { 'X-Internal-Org-Id': org.orgId },
          body: JSON.stringify({}),
        });
        results.push(result);
      } catch (e: any) {
        console.error(`Backfill failed for ${org.orgName}:`, e);
      }
    }
    const totalPersons = results.reduce((s, r) => s + r.totalPersons, 0);
    const totalReassigned = results.reduce((s, r) => s + r.reassigned, 0);
    setBackfillResult({
      orgId: 'ALL',
      totalPersons,
      reassigned: totalReassigned,
      segmentDistribution: {},
    });
    await fetchSegments();
    setBackfilling(false);
  };

  const selectedOrgName = orgs.find(o => o.orgId === selectedOrg)?.orgName || '';

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Segments</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleBackfill}
            disabled={backfilling || !selectedOrg}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)', borderRadius: 8,
              fontSize: 12, fontWeight: 500, cursor: backfilling ? 'wait' : 'pointer',
              fontFamily: 'var(--font-primary)', color: 'var(--color-text-primary)',
              opacity: backfilling ? 0.6 : 1,
            }}
          >
            <RefreshCw size={12} style={{ animation: backfilling ? 'spin 1s linear infinite' : 'none' }} />
            {backfilling ? 'Re-classifying...' : 'Re-classify org'}
          </button>
          <button
            onClick={handleBackfillAll}
            disabled={backfilling}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', background: 'var(--color-accent)',
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 500, cursor: backfilling ? 'wait' : 'pointer',
              fontFamily: 'var(--font-primary)', color: '#FFFFFF',
              opacity: backfilling ? 0.6 : 1,
            }}
          >
            <RefreshCw size={12} />
            Re-classify all orgs
          </button>
        </div>
      </div>

      {/* Org selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Organization
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            style={{
              appearance: 'none', padding: '8px 32px 8px 12px',
              background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
              borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-input)',
              color: 'var(--color-text-primary)', cursor: 'pointer', minWidth: 220,
            }}
          >
            {orgs.map(org => (
              <option key={org.orgId} value={org.orgId}>
                {org.orgName || org.orgId}
              </option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
        </div>
      </div>

      {/* Backfill result banner */}
      {backfillResult && (
        <div style={{
          ...card, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(74, 108, 111, 0.08)', borderColor: 'var(--color-accent)',
        }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
            <strong>{backfillResult.reassigned}</strong> of {backfillResult.totalPersons} users re-classified
            {backfillResult.orgId === 'ALL' ? ' across all orgs' : ` for ${selectedOrgName}`}.
            {backfillResult.segmentDistribution && Object.keys(backfillResult.segmentDistribution).length > 0 && (
              <span style={{ marginLeft: 12, color: 'var(--color-text-muted)', fontSize: 12 }}>
                {Object.entries(backfillResult.segmentDistribution).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </span>
            )}
          </div>
          <button onClick={() => setBackfillResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Loading / Error */}
      {loading && <div style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 13 }}>Loading segments...</div>}
      {error && <div style={{ padding: 16, color: 'var(--color-negative)', fontSize: 13 }}>{error}</div>}

      {/* Segments list */}
      {!loading && !error && segments.map(seg => {
        const isEditing = editingId === seg.segmentId;

        return (
          <div key={seg.segmentId} style={card}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {/* Color swatch */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: seg.color,
                marginTop: 5, flexShrink: 0,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input
                        value={editForm.segmentName}
                        onChange={e => setEditForm(f => ({ ...f, segmentName: e.target.value }))}
                        style={{
                          flex: 1, padding: '6px 10px', background: 'var(--color-bg-primary)',
                          border: '1px solid var(--color-border)', borderRadius: 6,
                          fontSize: 13, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)',
                        }}
                        placeholder="Segment name"
                      />
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))}
                        style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
                      />
                    </div>
                    <textarea
                      value={editForm.segmentDescription}
                      onChange={e => setEditForm(f => ({ ...f, segmentDescription: e.target.value }))}
                      rows={2}
                      style={{
                        width: '100%', padding: '6px 10px', background: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border)', borderRadius: 6,
                        fontSize: 12, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)',
                        resize: 'vertical', boxSizing: 'border-box',
                      }}
                      placeholder="Segment description"
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '6px 12px', background: 'none', border: '1px solid var(--color-border)',
                          borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-primary)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving || !editForm.segmentName.trim()}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px', background: 'var(--color-accent)', color: '#FFFFFF',
                          border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'var(--font-primary)',
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        <Save size={12} />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{seg.segmentName}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: seg.segmentType === 'system' ? 'var(--color-accent-muted)' : 'rgba(168,89,81,0.08)',
                        color: seg.segmentType === 'system' ? 'var(--color-accent)' : '#A85951',
                      }}>
                        {seg.segmentType}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontFamily: 'var(--font-input)' }}>{seg.segmentId}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{seg.segmentDescription}</div>
                  </>
                )}
              </div>

              {/* Count + Actions */}
              {!isEditing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {seg.memberCount} <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>
                      {seg.memberCount === 1 ? 'person' : 'people'}
                    </span>
                  </span>
                  <button
                    onClick={() => startEdit(seg)}
                    style={{
                      padding: '4px 8px', background: 'none', border: '1px solid var(--color-border)',
                      borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-primary)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Edit
                  </button>
                  {seg.segmentType === 'custom' && (
                    <button
                      onClick={() => handleDelete(seg.segmentId)}
                      disabled={deletingId === seg.segmentId}
                      style={{
                        padding: '4px 8px', background: 'none', border: '1px solid rgba(168,89,81,0.3)',
                        borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-primary)',
                        color: '#A85951', opacity: deletingId === seg.segmentId ? 0.5 : 1,
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Create new segment */}
      {showCreate ? (
        <div style={card}>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>New Custom Segment</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={createForm.segmentName}
                onChange={e => setCreateForm(f => ({ ...f, segmentName: e.target.value }))}
                placeholder="Segment name"
                style={{
                  flex: 1, padding: '6px 10px', background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)', borderRadius: 6,
                  fontSize: 13, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)',
                }}
              />
              <input
                type="color"
                value={createForm.color}
                onChange={e => setCreateForm(f => ({ ...f, color: e.target.value }))}
                style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
              />
            </div>
            <textarea
              value={createForm.segmentDescription}
              onChange={e => setCreateForm(f => ({ ...f, segmentDescription: e.target.value }))}
              rows={2}
              placeholder="Description — used by the LLM to classify customers"
              style={{
                width: '100%', padding: '6px 10px', background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)', borderRadius: 6,
                fontSize: 12, fontFamily: 'var(--font-input)', color: 'var(--color-text-primary)',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowCreate(false); setCreateForm({ segmentName: '', segmentDescription: '', color: '#6b7280' }); }}
                style={{
                  padding: '6px 12px', background: 'none', border: '1px solid var(--color-border)',
                  borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-primary)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createForm.segmentName.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 12px', background: 'var(--color-accent)', color: '#FFFFFF',
                  border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'var(--font-primary)',
                  opacity: creating ? 0.6 : 1,
                }}
              >
                <Plus size={12} />
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          disabled={!selectedOrg}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '12px 20px', background: 'none',
            border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-tile)',
            fontSize: 13, color: 'var(--color-text-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-primary)', transition: 'border-color 0.15s',
          }}
        >
          <Plus size={14} />
          Add custom segment
        </button>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SegmentsPage;
