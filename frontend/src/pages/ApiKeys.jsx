import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import { apiKeyAPI } from '../services/api';
import Modal from '../components/common/Modal';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  Calendar,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

export default function ApiKeys() {
  const { activeProject } = useProject();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Key Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdRawKey, setCreatedRawKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!activeProject?.id) return;
    try {
      setLoading(true);
      const res = await apiKeyAPI.list(activeProject.id);
      setKeys(res.data || []);
    } catch (err) {
      console.error('Failed to load API keys:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      setError('');
      const res = await apiKeyAPI.create(activeProject.id, { name: name.trim() });
      setCreatedRawKey(res.data?.rawKey);
      fetchKeys();
    } catch (err) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyItem) => {
    if (!confirm(`Are you sure you want to revoke key "${keyItem.name}"? External requests using this key will immediately be rejected with 401 Unauthorized.`)) {
      return;
    }

    try {
      await apiKeyAPI.delete(activeProject.id, keyItem.id);
      setKeys((prev) => prev.filter((k) => k.id !== keyItem.id));
    } catch (err) {
      alert('Failed to revoke key: ' + err.message);
    }
  };

  const handleCopyRawKey = () => {
    if (!createdRawKey) return;
    navigator.clipboard.writeText(createdRawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setName('');
    setCreatedRawKey(null);
    setCopied(false);
    setError('');
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            API Keys
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Project-scoped API keys for programmatic integration via HTTP headers
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create API Key</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3 shadow-2xs">
        <KeyRound className="w-4 h-4 text-[#ec7211] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900">
            Project-Scoped Authentication
          </span>
          <p>
            API keys allow external microservices or backend daemons to upload and transform assets
            directly via <code className="text-slate-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">/api/v1/assets</code> using the HTTP header{' '}
            <code className="text-slate-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">Authorization: Bearer ak_live_...</code>.
          </p>
        </div>
      </div>

      {/* Keys List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <div className="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-semibold">Loading API keys...</span>
        </div>
      ) : keys.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl bg-white shadow-2xs">
          <KeyRound className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No API keys generated yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Create an API key to allow external applications to access this project's asset pipeline.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create API Key</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div
              key={k.id}
              className="p-4 sm:p-5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold text-slate-900">{k.name}</h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <div>
                  <span className="font-mono text-xs text-slate-800 tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {k.maskedKey}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Created {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRevokeKey(k)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke Key</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Key Modal */}
      <Modal
        isOpen={createOpen}
        onClose={closeCreateModal}
        title={createdRawKey ? 'API Key Generated' : 'Create API Key'}
      >
        {!createdRawKey ? (
          <form onSubmit={handleCreateKey} className="space-y-4 text-slate-900">
            {error && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Key Label / Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production Backend, Staging Worker, Mobile App"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                A memorable label identifying where this key is deployed.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCreateModal}
                className="px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="px-4 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                {creating ? 'Generating Key...' : 'Create Key'}
              </button>
            </div>
          </form>
        ) : (
          /* One-time Key Display */
          <div className="space-y-4 text-slate-900">
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Save this API key now</span>
                <span>It will never be displayed again. If lost, you will need to generate a new key.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Secret API Key
              </label>
              <div className="p-3 rounded-md bg-[#0f172a] border border-slate-800 font-mono text-xs text-[#ff9900] break-all select-all flex items-center justify-between gap-3 shadow-inner">
                <span>{createdRawKey}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyRawKey}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to clipboard!' : 'Copy Key'}</span>
              </button>

              <button
                type="button"
                onClick={closeCreateModal}
                className="px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
