import React, { useState } from 'react';
import { Copy, Check, Eye, Trash2, SlidersHorizontal, Lock, Globe } from 'lucide-react';
import { FormatBadge } from '../common/Badge';

export function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function AssetCard({ asset, onSelect, onTransform, onDelete }) {
  const [copied, setCopied] = useState(false);

  // Best preview URL: prefer thumbnail or webp, fallback to original
  const previewUrl =
    asset.thumbnail?.url || asset.webp?.url || asset.original?.url || '';

  const handleCopyUrl = (e) => {
    e.stopPropagation();
    const urlToCopy = asset.webp?.url || asset.original?.url || previewUrl;
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(asset)}
      className="group relative bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-[#ec7211]/50 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-4/3 w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-200">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={asset.originalName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-slate-400 font-mono">No Preview</span>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <FormatBadge format={asset.format} />
          {asset.visibility === 'private' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <Globe className="w-2.5 h-2.5" /> Public
            </span>
          )}
        </div>

        {/* Hover Quick Action Buttons */}
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(asset);
            }}
            className="p-2 rounded bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyUrl}
            className="p-2 rounded bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTransform(asset);
            }}
            className="p-2 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors shadow"
            title="Transform Image"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(asset);
            }}
            className="p-2 rounded bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow"
            title="Delete Asset"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 truncate" title={asset.originalName}>
            {asset.originalName}
          </h4>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span className="font-mono">
              {asset.original?.width} × {asset.original?.height}
            </span>
            <span className="font-mono">{formatBytes(asset.size)}</span>
          </div>
        </div>

        {/* Folder / Tags */}
        {(asset.folder || (asset.tags && asset.tags.length > 0)) && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
            {asset.folder && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                📁 {asset.folder}
              </span>
            )}
            {asset.tags?.slice(0, 2).map((t, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
              >
                #{t}
              </span>
            ))}
            {asset.tags?.length > 2 && (
              <span className="text-[10px] text-slate-400">+{asset.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
