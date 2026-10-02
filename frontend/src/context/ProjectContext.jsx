import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const refreshProjects = useCallback(async (preferredId = null) => {
    if (!isAuthenticated) {
      setProjects([]);
      setActiveProject(null);
      return;
    }

    try {
      setLoadingProjects(true);
      const res = await projectAPI.list();
      const list = res.data || [];
      setProjects(list);

      const savedId = preferredId || localStorage.getItem('assetforge_active_project_id');
      const found = list.find((p) => p.id === savedId);

      if (found) {
        setActiveProject(found);
      } else if (list.length > 0) {
        setActiveProject(list[0]);
        localStorage.setItem('assetforge_active_project_id', list[0].id);
      } else {
        setActiveProject(null);
        localStorage.removeItem('assetforge_active_project_id');
      }
    } catch (err) {
      console.error('Failed to load projects:', err.message);
    } finally {
      setLoadingProjects(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const selectProject = (projectOrId) => {
    if (!projectOrId) {
      setActiveProject(null);
      localStorage.removeItem('assetforge_active_project_id');
      return;
    }

    const id = typeof projectOrId === 'object' ? projectOrId.id : projectOrId;
    const project = projects.find((p) => p.id === id);
    if (project) {
      setActiveProject(project);
      localStorage.setItem('assetforge_active_project_id', project.id);
    } else if (typeof projectOrId === 'object') {
      setActiveProject(projectOrId);
      localStorage.setItem('assetforge_active_project_id', projectOrId.id);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loadingProjects,
        selectProject,
        refreshProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
