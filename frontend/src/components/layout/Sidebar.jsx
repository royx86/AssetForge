import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../common/Logo';
import {
  LayoutDashboard,
  Image as ImageIcon,
  UploadCloud,
  FolderKanban,
  KeyRound,
  BarChart3,
  ScrollText,
  FileCode2,
  Settings,
  Server
} from 'lucide-react';

const navItems = [
  { name: 'Overview', to: '/', icon: LayoutDashboard },
  { name: 'Assets', to: '/assets', icon: ImageIcon },
  { name: 'Upload', to: '/upload', icon: UploadCloud },
  { name: 'Projects', to: '/projects', icon: FolderKanban },
  { name: 'API Keys', to: '/api-keys', icon: KeyRound },
  { name: 'Usage', to: '/usage', icon: BarChart3 },
  { name: 'API Logs', to: '/logs', icon: ScrollText },
  { name: 'API Docs', to: '/docs', icon: FileCode2 },
  { name: 'Settings', to: '/settings', icon: Settings }
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-200">
          <Logo size="md" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Infrastructure Console
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-[#ec7211] font-semibold border-l-3 border-[#ec7211]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* AWS Pipeline Status Indicator */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-800 font-semibold">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" /> Storage Engine
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Sharp + AWS S3 ap-south-1
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
