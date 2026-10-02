import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { usageAPI } from '../services/api';
import { formatBytes } from '../components/assets/AssetCard';
import {
  HardDrive,
  ImageIcon,
  SlidersHorizontal,
  Activity,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export default function Usage() {
  const { activeProject } = useProject();

  const [usage, setUsage] = useState({
    assets: 0,
    storageBytes: 0,
    transformations: 0,
    apiRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      if (!activeProject?.id) return;
      try {
        setLoading(true);
        const res = await usageAPI.get(activeProject.id);
        if (res.data) setUsage(res.data);
      } catch (err) {
        console.error('Failed to load usage data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUsage();
  }, [activeProject?.id]);

  return (
    <div className="space-y-6 text-slate-900">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Usage & Resource Metrics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time resource utilization, AWS S3 storage footprint, and Sharp transformation statistics
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <div className="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-semibold">Calculating project usage...</span>
        </div>
      ) : (
        <>
          {/* Main 4 Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Storage */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Storage Footprint</span>
                <HardDrive className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
                  {formatBytes(usage.storageBytes || 0)}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">AWS S3 bucket total</p>
              </div>
            </div>

            {/* Assets */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Assets</span>
                <ImageIcon className="w-4 h-4 text-[#ec7211]" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
                  {(usage.assets || 0).toLocaleString()}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Original images cataloged</p>
              </div>
            </div>

            {/* Transformations */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Transformations</span>
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
                  {(usage.transformations || 0).toLocaleString()}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Sharp pipeline executions</p>
              </div>
            </div>

            {/* API Requests */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">API Requests</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900">
                  {(usage.apiRequests || 0).toLocaleString()}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Via developer v1 API keys</p>
              </div>
            </div>
          </div>

          {/* Infrastructure Health & Processing Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Cpu className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Image Pipeline Architecture</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">Automatic Sharp WebP Variant Generation</span>
                  <span className="text-emerald-700 font-mono font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">Automatic Sharp AVIF Variant Generation</span>
                  <span className="text-emerald-700 font-mono font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">Thumbnail Generation (300×300 Cover)</span>
                  <span className="text-emerald-700 font-mono font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">AWS S3 ap-south-1 Storage Integration</span>
                  <span className="text-emerald-700 font-mono font-semibold">Connected</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Rate Limiting & Safety Quotas</h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between text-slate-800 font-semibold">
                    <span>API Key Rate Limit</span>
                    <span className="font-mono text-[#ec7211]">100 req / min</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sliding window rate limit applied per API key. Returns HTTP 429 when exceeded.
                  </p>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between text-slate-800 font-semibold">
                    <span>Maximum Upload Size</span>
                    <span className="font-mono text-[#ec7211]">25 MB / file</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Enforced at Multer upload middleware before image memory parsing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
