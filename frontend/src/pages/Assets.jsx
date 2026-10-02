import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { assetAPI } from '../services/api';
import AssetCard from '../components/assets/AssetCard';
import AssetDetailsModal from '../components/assets/AssetDetailsModal';
import TransformModal from '../components/assets/TransformModal';
import EmptyState from '../components/common/EmptyState';
import {
  Search,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

export default function Assets() {
  const { activeProject } = useProject();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const [tag, setTag] = useState('');
  const [visibility, setVisibility] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [transformAsset, setTransformAsset] = useState(null);

  const fetchAssets = useCallback(async () => {
    if (!activeProject?.id) return;
    try {
      setLoading(true);
      const res = await assetAPI.list(activeProject.id, {
        page,
        limit: 20,
        search,
        folder,
        tag,
        visibility
      });
      setAssets(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id, page, search, folder, tag, visibility]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDelete = async (asset) => {
    if (!confirm(`Delete ${asset.originalName}? This removes the original file and all generated Sharp variants from S3.`)) {
      return;
    }
    try {
      await assetAPI.delete(activeProject.id, asset.id);
      setSelectedAsset(null);
      fetchAssets();
    } catch (err) {
      alert('Failed to delete asset: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Storage Assets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse, preview, filter, and dynamically transform images stored in AWS S3
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Image</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by filename..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3] transition-colors"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={folder}
              onChange={(e) => {
                setFolder(e.target.value);
                setPage(1);
              }}
              placeholder="Folder..."
              className="w-28 sm:w-36 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0972d3]"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setPage(1);
              }}
              placeholder="Tag..."
              className="w-24 sm:w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0972d3]"
            />
          </div>

          <select
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0972d3]"
          >
            <option value="">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          {(search || folder || tag || visibility) && (
            <button
              onClick={() => {
                setSearch('');
                setFolder('');
                setTag('');
                setVisibility('');
                setPage(1);
              }}
              className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded hover:bg-slate-100 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <div className="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-semibold">Loading assets from S3...</span>
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No assets found"
          description={
            search || folder || tag || visibility
              ? 'No assets match your search filters. Try clearing your search parameters.'
              : 'You have not uploaded any image assets to this project yet.'
          }
          action={
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload First Image</span>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onSelect={(a) => setSelectedAsset(a)}
              onTransform={(a) => setTransformAsset(a)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
            <strong className="text-slate-800">{pagination.pages}</strong> ({pagination.total} total assets)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-700 px-2">
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="p-1.5 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedAsset && (
        <AssetDetailsModal
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          asset={selectedAsset}
          projectId={activeProject?.id}
          onTransform={(a) => {
            setSelectedAsset(null);
            setTransformAsset(a);
          }}
          onDelete={handleDelete}
        />
      )}

      {transformAsset && (
        <TransformModal
          isOpen={!!transformAsset}
          onClose={() => setTransformAsset(null)}
          asset={transformAsset}
          projectId={activeProject?.id}
        />
      )}
    </div>
  );
}
