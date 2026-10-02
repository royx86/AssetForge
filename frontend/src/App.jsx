import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Overview from './pages/Overview';
import Assets from './pages/Assets';
import Upload from './pages/Upload';
import Projects from './pages/Projects';
import ApiKeys from './pages/ApiKeys';
import Usage from './pages/Usage';
import ApiLogs from './pages/ApiLogs';
import ApiDocs from './pages/ApiDocs';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Dashboard Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Overview />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/usage" element={<Usage />} />
              <Route path="/logs" element={<ApiLogs />} />
              <Route path="/docs" element={<ApiDocs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
