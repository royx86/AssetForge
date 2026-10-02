import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { FolderPlus } from 'lucide-react';

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const { projects, loadingProjects } = useProject();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">
            Initializing AssetForge Console...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user has no projects and isn't on the projects page or settings, guide them to create one
  const hasNoProjects = !loadingProjects && projects.length === 0;
  const isProjectsOrSettingsPage =
    location.pathname === '/projects' || location.pathname === '/settings' || location.pathname === '/docs';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {hasNoProjects && !isProjectsOrSettingsPage ? (
            <div className="border border-slate-200 bg-white shadow-xs rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-12">
              <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-200 text-[#ec7211] flex items-center justify-center mx-auto mb-4">
                <FolderPlus className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to AssetForge</h2>
              <p className="text-sm text-slate-600 mb-6">
                To start uploading images, transforming assets, and generating API keys, create your first project.
              </p>
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#ec7211] hover:bg-[#eb5f07] text-white font-medium text-xs sm:text-sm transition-colors shadow-2xs"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create Project</span>
              </Link>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
