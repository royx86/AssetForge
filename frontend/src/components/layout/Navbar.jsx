import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  ChevronDown,
  FolderKanban,
  Plus,
  LogOut,
  Settings as SettingsIcon,
  Check,
  Globe2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { projects, activeProject, selectProject } = useProject();
  const navigate = useNavigate();

  const [projectOpen, setProjectOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const projectRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (projectRef.current && !projectRef.current.contains(event.target)) {
        setProjectOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-[#161e2e] text-white border-b border-[#232f3e] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Hamburger button + Project Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#232f3e] lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Selector Dropdown */}
        <div className="relative" ref={projectRef}>
          <button
            onClick={() => setProjectOpen(!projectOpen)}
            className="flex items-center gap-2 px-3 py-1 rounded bg-[#232f3e] border border-slate-700/80 hover:bg-[#2d3a4d] text-xs sm:text-sm font-medium text-slate-100 transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#ec7211]" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate font-medium">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {projectOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-md bg-white border border-slate-200 shadow-xl py-1 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 bg-slate-50">
                Active Projects
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No projects found</div>
                ) : (
                  projects.map((p) => {
                    const isSelected = activeProject && activeProject.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          selectProject(p);
                          setProjectOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-amber-50 text-[#ec7211] font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#ec7211] shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="border-t border-slate-100 p-1 bg-slate-50/50">
                <Link
                  to="/projects"
                  onClick={() => setProjectOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold text-[#ec7211] hover:bg-amber-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manage Projects</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Region indicator + User Dropdown */}
      <div className="flex items-center gap-3">
        {/* AWS Region Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#232f3e] text-[11px] text-slate-300 font-mono border border-slate-700/60">
          <Globe2 className="w-3 h-3 text-[#ec7211]" />
          <span>ap-south-1</span>
        </div>

        {/* User Account */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 p-1 rounded hover:bg-[#232f3e] transition-colors"
          >
            <div className="w-7 h-7 rounded bg-[#ec7211] flex items-center justify-center text-white text-xs font-bold uppercase shadow-2xs">
              {user?.name ? user.name.slice(0, 2) : 'AF'}
            </div>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-200">
              {user?.name || 'Developer'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-md bg-white border border-slate-200 shadow-xl py-1 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Account & Project Settings</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1 bg-slate-50/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
