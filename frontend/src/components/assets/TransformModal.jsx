import React, { useState } from 'react';
import Modal from '../common/Modal';
import { formatBytes } from './AssetCard';
import { assetAPI } from '../../services/api';
import { Copy, Check, ExternalLink, Cpu, AlertCircle } from 'lucide-react';

export default function TransformModal({ isOpen, onClose, asset, projectId }) {
  const [width, setWidth] = useState('800');
  const [height, setHeight] = useState('600');
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(80);
  const [fit, setFit] = useState('cover');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!asset) return null;

  const handleTransform = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const options = {
      format,
      quality: parseInt(quality, 10),
      fit
    };

    if (width && parseInt(width, 10) > 0) {
      options.width = parseInt(width, 10);
    }
    if (height && parseInt(height, 10) > 0) {
      options.height = parseInt(height, 10);
    }

    try {
      setLoading(true);
      const res = await assetAPI.transform(projectId, asset.id, options);
      if (res.data) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.message || 'Image transformation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (!result?.url) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dynamic Image Transformation"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-slate-900">
        {/* Source Asset Banner */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <img
            src={asset.thumbnail?.url || asset.webp?.url}
            alt=""
            className="w-12 h-12 object-cover rounded border border-slate-200 bg-white"
          />
          <div className="flex-1 truncate">
            <h4 className="text-xs font-bold text-slate-900 truncate">{asset.originalName}</h4>
            <p className="text-[11px] text-slate-500 font-mono">
              Source: {asset.original?.width} × {asset.original?.height} ({asset.format.toUpperCase()})
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transformation Form */}
        <form onSubmit={handleTransform} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                min="10"
                max="8000"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="800"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                min="10"
                max="8000"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="600"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3]"
              >
                <option value="webp">WebP (Recommended)</option>
                <option value="avif">AVIF (Ultra compressed)</option>
                <option value="png">PNG (Lossless)</option>
                <option value="jpeg">JPEG (Universal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fit Mode
              </label>
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3]"
              >
                <option value="cover">Cover (Crop to fill)</option>
                <option value="contain">Contain (Preserve ratio)</option>
                <option value="fill">Fill (Stretch)</option>
                <option value="inside">Inside (Fit bounds)</option>
                <option value="outside">Outside (Cover bounds)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Quality ({quality}%)
                </label>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full mt-2 accent-[#ec7211]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 text-white font-medium text-xs sm:text-sm transition-colors shadow-2xs"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing in Sharp Engine...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Execute Transformation</span>
              </>
            )}
          </button>
        </form>

        {/* Result Preview & URL */}
        {result && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Output Variant Generated
            </h4>

            <div className="relative aspect-16/9 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
              <img
                src={result.url}
                alt="Transformed"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
              <span>
                Dimensions: <strong className="text-slate-800">{result.width} × {result.height}</strong>
              </span>
              <span>
                Format: <strong className="text-slate-800 uppercase">{result.format}</strong>
              </span>
              <span>
                Size: <strong className="text-slate-800">{formatBytes(result.size)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={result.url}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-800 truncate focus:outline-none"
              />
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-medium transition-colors shrink-0 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy URL'}</span>
              </button>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shrink-0 shadow-2xs"
                title="Open image in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
