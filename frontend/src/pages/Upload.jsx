import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { assetAPI } from '../services/api';
import { formatBytes } from '../components/assets/AssetCard';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Folder,
  Tag,
  Lock,
  Globe,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function Upload() {
  const { activeProject } = useProject();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [folder, setFolder] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    setError('');
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, WebP, or AVIF image.');
      return;
    }
    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file first.');
      return;
    }
    if (!activeProject?.id) {
      setError('No active project selected.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setProgress(10);

      const formData = new FormData();
      formData.append('file', file);
      if (folder.trim()) formData.append('folder', folder.trim());
      if (tags.trim()) formData.append('tags', tags.trim());
      formData.append('visibility', visibility);

      const res = await assetAPI.upload(activeProject.id, formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 90) / progressEvent.total);
          setProgress(percent);
        }
      });

      setProgress(100);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Image upload and processing failed.');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = (url, key) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(0);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-900">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Upload Image
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload images to AWS S3 with automated Sharp WebP, AVIF, and thumbnail generation
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result ? (
        <form onSubmit={handleUpload} className="space-y-5">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-[#ec7211] bg-amber-50/50'
                : 'border-slate-300 hover:border-[#ec7211] bg-white shadow-2xs'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              <div className="flex flex-col items-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-contain mb-3 border border-slate-200 shadow-sm"
                />
                <span className="text-xs font-bold text-slate-900">{file?.name}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {formatBytes(file?.size)} &bull; Click or drop another image to replace
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 text-[#ec7211] flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Drop image here, or browse files
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Supports JPEG, PNG, WebP, AVIF up to 25MB
                </p>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300 transition-colors pointer-events-none shadow-2xs"
                >
                  Select File
                </button>
              </div>
            )}
          </div>

          {/* Metadata inputs */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-2xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-slate-400" />
                Folder (Optional)
              </label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="e.g. products, banners"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. hero, landing, sale"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                {visibility === 'private' ? (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                )}
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#0972d3]"
              >
                <option value="public">Public (Direct URL access)</option>
                <option value="private">Private (Pre-signed URL access)</option>
              </select>
            </div>
          </div>

          {/* Upload Button & Progress */}
          <div>
            {uploading && (
              <div className="mb-3 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Uploading to S3 & Running Sharp Variants...</span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-[#ec7211] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-2xs cursor-pointer"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Image Pipeline...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Generate Variants</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Result Screen */
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Upload and Variant Processing Complete</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Original image and 3 Sharp variants (WebP, AVIF, Thumbnail) are stored in AWS S3 and indexed in MongoDB.
              </p>
            </div>
          </div>

          {/* 4 Cards for Original, WebP, AVIF, and Thumbnail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Original */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Original</span>
                  <span className="text-emerald-600 font-bold">✓</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 font-mono">
                  <p>Dimensions: {result.original?.width} × {result.original?.height}</p>
                  <p>Size: {formatBytes(result.size)}</p>
                  <p>Format: {result.format?.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => copyUrl(result.original?.url, 'original')}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              >
                {copiedKey === 'original' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedKey === 'original' ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            {/* WebP */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>WebP Variant</span>
                  <span className="text-emerald-600 font-bold">✓</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 font-mono">
                  <p>Dimensions: {result.webp?.width} × {result.webp?.height}</p>
                  <p>Format: WEBP (q=80)</p>
                  <p>Optimized for web</p>
                </div>
              </div>
              <button
                onClick={() => copyUrl(result.webp?.url, 'webp')}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              >
                {copiedKey === 'webp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedKey === 'webp' ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            {/* AVIF */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>AVIF Variant</span>
                  <span className="text-emerald-600 font-bold">✓</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 font-mono">
                  <p>Dimensions: {result.avif?.width} × {result.avif?.height}</p>
                  <p>Format: AVIF (q=65)</p>
                  <p>Next-gen compression</p>
                </div>
              </div>
              <button
                onClick={() => copyUrl(result.avif?.url, 'avif')}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              >
                {copiedKey === 'avif' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedKey === 'avif' ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            {/* Thumbnail */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Thumbnail</span>
                  <span className="text-emerald-600 font-bold">✓</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 font-mono">
                  <p>Dimensions: {result.thumbnail?.width} × {result.thumbnail?.height}</p>
                  <p>Format: WEBP</p>
                  <p>300 × 300 cover crop</p>
                </div>
              </div>
              <button
                onClick={() => copyUrl(result.thumbnail?.url, 'thumbnail')}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
              >
                {copiedKey === 'thumbnail' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedKey === 'thumbnail' ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={resetUpload}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Upload Another Image</span>
            </button>

            <Link
              to="/assets"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-xs font-semibold text-white transition-colors shadow-2xs"
            >
              <span>View in Assets Gallery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
