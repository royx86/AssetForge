import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { projectAPI } from '../services/api';
import { formatBytes } from '../components/assets/AssetCard';
import Modal from '../components/common/Modal';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  HardDrive,
  ImageIcon,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function Projects() {
  const { projects, activeProject, selectProject, refreshProjects, loadingProjects } = useProject();
  const navigate = useNavigate();

  // Create Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit Modal state
  const [editProject, setEditProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreateLoading(true);
      setCreateError('');
      const res = await projectAPI.create({
        name: newName.trim(),
        description: newDesc.trim()
      });
      await refreshProjects(res.data?.id);
      setNewName('');
      setNewDesc('');
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (proj) => {
    setEditProject(proj);
    setEditName(proj.name);
    setEditDesc(proj.description || '');
    setEditError('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editProject) return;

    try {
      setEditLoading(true);
      setEditError('');
      await projectAPI.update(editProject.id, {
        name: editName.trim(),
        description: editDesc.trim()
      });
      await refreshProjects(editProject.id);
      setEditProject(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update project');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (proj) => {
    if (
      !confirm(
        `Are you sure you want to delete "${proj.name}"? This will permanently delete all ${proj.assetsCount || 0} assets, S3 files, API keys, and logs!`
      )
    ) {
      return;
    }

    try {
      await projectAPI.delete(proj.id);
      await refreshProjects();
    } catch (err) {
      alert('Failed to delete project: ' + err.message);
    }
  };

  const handleSelectAndOpen = (proj) => {
    selectProject(proj);
    navigate('/');
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your project workspaces and project-scoped AWS S3 image infrastructure
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs sm:text-sm font-semibold transition-colors shadow-2xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loadingProjects ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <div className="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-semibold">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-300 rounded-xl bg-white shadow-2xs">
          <FolderKanban className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No projects found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Create your first project to start organizing your images and generating API keys.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isActive = activeProject && activeProject.id === proj.id;
            return (
              <div
                key={proj.id}
                className={`p-5 rounded-lg bg-white border transition-all duration-200 flex flex-col justify-between shadow-2xs ${
                  isActive
                    ? 'border-[#ec7211] ring-1 ring-[#ec7211]/30 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-amber-50 text-[#ec7211] border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span className="truncate max-w-[160px] sm:max-w-[200px]">
                            {proj.name}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Active
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(proj)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(proj)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 min-h-[32px] line-clamp-2 mt-1">
                    {proj.description || 'No description provided'}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                      <div>
                        <span className="font-mono font-bold block text-slate-900">
                          {(proj.assetsCount || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">assets</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                      <div>
                        <span className="font-mono font-bold block text-slate-900">
                          {formatBytes(proj.storageBytes || 0)}
                        </span>
                        <span className="text-[10px] text-slate-500">storage</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(proj.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleSelectAndOpen(proj)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#ec7211] text-white hover:bg-[#eb5f07] shadow-2xs'
                        : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <span>{isActive ? 'Open Project' : 'Select'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-slate-900">
          {createError && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. E-commerce Website, Mobile App"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief description of the project or application..."
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || !newName.trim()}
              className="px-4 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-2xs"
            >
              {createLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      {editProject && (
        <Modal
          isOpen={!!editProject}
          onClose={() => setEditProject(null)}
          title="Edit Project"
        >
          <form onSubmit={handleUpdate} className="space-y-4 text-slate-900">
            {editError && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#0972d3] focus:ring-1 focus:ring-[#0972d3]"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditProject(null)}
                className="px-3.5 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading || !editName.trim()}
                className="px-4 py-1.5 rounded bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
