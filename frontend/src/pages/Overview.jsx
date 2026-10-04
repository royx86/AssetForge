import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { usageAPI, assetAPI, logAPI } from '../services/api';
import { formatBytes } from '../components/assets/AssetCard';
import { MethodBadge, StatusBadge } from '../components/common/Badge';
import AssetDetailsModal from '../components/assets/AssetDetailsModal';
import TransformModal from '../components/assets/TransformModal';
import {
  Image as ImageIcon,
  HardDrive,
  SlidersHorizontal,
  Activity,
  ArrowUpRight,
  UploadCloud,
  FileCode2
} from 'lucide-react';

export default function Overview() {
  const { activeProject } = useProject();

  const [usage, setUsage] = useState({
    assets: 0,
    storageBytes: 0,
    transformations: 0,
    apiRequests: 0
  });
  const [recentAssets, setRecentAssets] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  // Modals
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [transformAsset, setTransformAsset] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!activeProject?.id) return;
      try {
        const [usageRes, assetsRes, logsRes] = await Promise.all([
          usageAPI.get(activeProject.id).catch(() => ({ data: {} })),
          assetAPI.list(activeProject.id, { limit: 6 }).catch(() => ({ data: [] })),
          logAPI.list(activeProject.id, { limit: 5 }).catch(() => ({ data: [] }))
        ]);

        if (usageRes.data) {
          setUsage(usageRes.data);
        }
        if (assetsRes.data) {
          setRecentAssets(assetsRes.data);
        }
        if (logsRes.data) {
          setRecentLogs(logsRes.data);
        }
      } catch (err) {
        console.error('Failed to load overview data:', err.message);
      }
    }

    loadDashboardData();
  }, [activeProject?.id]);

  if (!activeProject) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Please select or create a project to view overview metrics.
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Assets',
      value: (usage.assets || 0).toLocaleString(),
      subtext: 'Cataloged in S3 & MongoDB',
      icon: ImageIcon,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      label: 'Storage Used',
      value: formatBytes(usage.storageBytes || 0),
      subtext: 'Originals & Sharp variants',
      icon: HardDrive,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      label: 'Transformations',
      value: (usage.transformations || 0).toLocaleString(),
      subtext: 'Dynamic Sharp operations',
      icon: SlidersHorizontal,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      label: 'API Requests',
      value: (usage.apiRequests || 0).toLocaleString(),
      subtext: 'External v1 API key calls',
      icon: Activity,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  ];

  return (
    <div className="space-y-6 text-slate-900">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {activeProject.name}
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              project-id: {activeProject.id}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeProject.description || 'AWS S3 image infrastructure project metrics and live activity'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/docs"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors shadow-2xs"
          >
            <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Developer Docs</span>
          </Link>
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded border ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {card.value}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">{card.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Recent Assets & Recent API Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Assets */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Storage Assets</h2>
            </div>
            <Link
              to="/assets"
              className="text-xs font-semibold text-[#0972d3] hover:underline flex items-center gap-1"
            >
              <span>View all assets</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAssets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No assets uploaded yet in this project.{' '}
              <Link to="/upload" className="text-[#0972d3] font-semibold hover:underline">
                Upload your first image
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className="group relative aspect-4/3 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-[#ec7211]/60 cursor-pointer transition-all shadow-2xs"
                >
                  <img
                    src={asset.thumbnail?.url || asset.webp?.url}
                    alt={asset.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[11px] font-semibold text-white truncate w-full">
                      {asset.originalName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Recent API Logs */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent API Activity</h2>
            </div>
            <Link
              to="/logs"
              className="text-xs font-semibold text-[#0972d3] hover:underline flex items-center gap-1"
            >
              <span>Full audit log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No API requests recorded yet. Make an API call using your project API key to see activity here!
            </div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <MethodBadge method={log.method} />
                    <span className="font-mono text-slate-800 truncate text-[11px]">
                      {log.endpoint}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={log.statusCode} />
                    <span className="font-mono text-slate-500 text-[10px]">
                      {log.responseTime}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Asset Details & Transform Modals */}
      {selectedAsset && (
        <AssetDetailsModal
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          asset={selectedAsset}
          projectId={activeProject.id}
          onTransform={(a) => {
            setSelectedAsset(null);
            setTransformAsset(a);
          }}
          onDelete={async (a) => {
            if (confirm(`Delete ${a.originalName}?`)) {
              await assetAPI.delete(activeProject.id, a.id);
              setSelectedAsset(null);
              setRecentAssets((prev) => prev.filter((item) => item.id !== a.id));
            }
          }}
        />
      )}

      {transformAsset && (
        <TransformModal
          isOpen={!!transformAsset}
          onClose={() => setTransformAsset(null)}
          asset={transformAsset}
          projectId={activeProject.id}
        />
      )}
    </div>
  );
}
