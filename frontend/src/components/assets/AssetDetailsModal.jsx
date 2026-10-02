import React, { useState } from 'react';
import Modal from '../common/Modal';
import { formatBytes } from './AssetCard';
import { FormatBadge } from '../common/Badge';
import {
  Copy,
  Check,
  SlidersHorizontal,
  Trash2,
  ExternalLink,
  Lock,
  Globe,
  KeyRound
} from 'lucide-react';
import { assetAPI } from '../../services/api';

export default function AssetDetailsModal({
  isOpen,
  onClose,
  asset,
  projectId,
  onTransform,
  onDelete
}) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [signedUrl, setSignedUrl] = useState('');
  const [signedLoading, setSignedLoading] = useState(false);
  const [expiresIn, setExpiresIn] = useState(3600);

  if (!asset) return null;

  const copyToClipboard = (text, keyName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateSignedUrl = async (variant = 'original') => {
    try {
      setSignedLoading(true);
      const res = await assetAPI.getSignedUrl(projectId, asset.id, {
        variant,
        expiresIn
      });
      if (res.data?.url) {
        setSignedUrl(res.data.url);
      }
    } catch (err) {
      alert('Failed to generate signed URL: ' + err.message);
    } finally {
      setSignedLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asset Details"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-slate-900">
        {/* Preview Image */}
        <div className="relative aspect-16/9 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
          <img
            src={asset.original?.url || asset.webp?.url}
            alt={asset.originalName}
            className="w-full h-full object-contain"
          />
          <a
            href={asset.original?.url || asset.webp?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 p-2 rounded bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Core Metadata Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 truncate pr-2">
              {asset.originalName}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <FormatBadge format={asset.format} />
              {asset.visibility === 'private' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3 h-3" /> Private
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Globe className="w-3 h-3" /> Public
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Dimensions</span>
              <span className="font-mono font-semibold text-slate-800">
                {asset.original?.width} × {asset.original?.height}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">MIME Type</span>
              <span className="font-mono font-semibold text-slate-800">{asset.mimeType}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">File Size</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatBytes(asset.size)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Uploaded</span>
              <span className="font-semibold text-slate-800">
                {new Date(asset.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Folder & Tags */}
          <div className="mt-3.5 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Folder:</span>
              <span className="font-mono font-medium text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {asset.folder || 'root (none)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 mr-1">Tags:</span>
              {asset.tags && asset.tags.length > 0 ? (
                asset.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium"
                  >
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">None</span>
              )}
            </div>
          </div>
        </div>

        {/* Generated Variants Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Generated Variants (Sharp Engine)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* WebP */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">WebP Variant</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {asset.webp?.width} × {asset.webp?.height}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">High-efficiency web format</p>
              </div>
              <button
                onClick={() => copyToClipboard(asset.webp?.url, 'webp')}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              >
                {copiedKey === 'webp' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>

            {/* AVIF */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">AVIF Variant</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {asset.avif?.width} × {asset.avif?.height}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Next-gen AV1 compression</p>
              </div>
              <button
                onClick={() => copyToClipboard(asset.avif?.url, 'avif')}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              >
                {copiedKey === 'avif' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Thumbnail */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Thumbnail</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {asset.thumbnail?.width} × {asset.thumbnail?.height}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">300x300 cover crop</p>
              </div>
              <button
                onClick={() => copyToClipboard(asset.thumbnail?.url, 'thumbnail')}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              >
                {copiedKey === 'thumbnail' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Signed URL Section */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#ec7211]" />
              Generate Temporary AWS S3 Pre-Signed URL
            </span>
            <div className="flex items-center gap-2">
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 shadow-2xs"
              >
                <option value={900}>15 min</option>
                <option value={3600}>1 hour</option>
                <option value={86400}>24 hours</option>
                <option value={604800}>7 days</option>
              </select>
              <button
                onClick={() => handleGenerateSignedUrl('original')}
                disabled={signedLoading}
                className="px-2.5 py-1 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-medium transition-colors shadow-2xs"
              >
                {signedLoading ? 'Signing...' : 'Generate URL'}
              </button>
            </div>
          </div>

          {signedUrl && (
            <div className="mt-2.5 p-2 rounded bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
              <input
                type="text"
                readOnly
                value={signedUrl}
                className="w-full bg-transparent text-[11px] font-mono text-slate-800 truncate focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(signedUrl, 'signed')}
                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
              >
                {copiedKey === 'signed' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => onDelete(asset)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Asset</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onTransform(asset);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Transform Image</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
