import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { authAPI, projectAPI } from '../services/api';
import Modal from '../components/common/Modal';
import {
  User,
  Shield,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { activeProject, refreshProjects } = useProject();
  const navigate = useNavigate();

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Project Settings State
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projLoading, setProjLoading] = useState(false);
  const [projSuccess, setProjSuccess] = useState('');
  const [projError, setProjError] = useState('');

  // Danger Zone Delete Modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.name || '');
      setProjectDesc(activeProject.description || '');
    }
  }, [activeProject]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long');
      return;
    }

    try {
      setPwdLoading(true);
      await authAPI.changePassword({ currentPassword, newPassword });
      setPwdSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.message || 'Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!activeProject?.id) return;
    setProjSuccess('');
    setProjError('');

    try {
      setProjLoading(true);
      await projectAPI.update(activeProject.id, {
        name: projectName.trim(),
        description: projectDesc.trim()
      });
      setProjSuccess('Project settings saved successfully');
      await refreshProjects(activeProject.id);
    } catch (err) {
      setProjError(err.message || 'Failed to update project settings');
    } finally {
      setProjLoading(false);
    }
  };

  const handleDeleteProject = async (e) => {
    e.preventDefault();
    if (!activeProject?.id) return;

    if (confirmDeleteInput.trim() !== activeProject.name.trim()) {
      alert('Project name does not match');
      return;
    }

    try {
      setDeleteLoading(true);
      await projectAPI.delete(activeProject.id);
      await refreshProjects();
      setDeleteOpen(false);
      navigate('/projects');
    } catch (err) {
      alert('Failed to delete project: ' + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your developer profile, IAM security credentials, and active project configuration
        </p>
      </div>

      {/* 1. Profile Section */}
      <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <User className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">User Identity & Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={user?.name || ''}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm text-slate-700 focus:outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-sm text-slate-700 focus:outline-none cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 2. Security Section */}
      <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Shield className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">Security & Authentication</h2>
        </div>

        {pwdSuccess && (
          <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{pwdSuccess}</span>
          </div>
        )}

        {pwdError && (
          <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{pwdError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full sm:max-w-md px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwdLoading}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-sm"
          >
            {pwdLoading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* 3. Project Settings */}
      {activeProject && (
        <div className="p-6 rounded-lg bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FolderKanban className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Active Project Configuration: <span className="text-[#ec7211]">{activeProject.name}</span>
            </h2>
          </div>

          {projSuccess && (
            <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{projSuccess}</span>
            </div>
          )}

          {projError && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{projError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full sm:max-w-md px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#ec7211] focus:ring-1 focus:ring-[#ec7211]"
              />
            </div>

            <button
              type="submit"
              disabled={projLoading}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{projLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. Danger Zone */}
      {activeProject && (
        <div className="p-6 rounded-lg bg-red-50/60 border border-red-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Delete Project Environment</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Permanently deletes <strong>{activeProject.name}</strong>, including all managed image assets,
                S3 storage variant objects, API access keys, and logs. This action cannot be reversed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmDeleteInput('');
                setDeleteOpen(true);
              }}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shrink-0 shadow-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Project</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteOpen && (
        <Modal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete Project Confirmation"
        >
          <form onSubmit={handleDeleteProject} className="space-y-4">
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs">
              <span className="font-bold block mb-1">Warning: Irreversible Deletion</span>
              <span>
                All assets in this project will be deleted permanently from MongoDB metadata and Amazon S3.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Please type <strong className="text-slate-900 select-all font-mono">{activeProject.name}</strong> to confirm:
              </label>
              <input
                type="text"
                required
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                placeholder={activeProject.name}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  deleteLoading ||
                  confirmDeleteInput.trim() !== activeProject.name.trim()
                }
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'I understand, delete this project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
