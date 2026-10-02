const projectService = require('../services/project.service');
const { successResponse } = require('../utils/response');

class ProjectController {
  async createProject(req, res, next) {
    try {
      const { name, description } = req.body;
      const project = await projectService.createProject(req.user._id, { name, description });
      return successResponse(res, 201, project);
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req, res, next) {
    try {
      const projects = await projectService.getProjectsByUser(req.user._id);
      return successResponse(res, 200, projects);
    } catch (error) {
      next(error);
    }
  }

  async getProject(req, res, next) {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(req.user._id, id);
      return successResponse(res, 200, project);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const project = await projectService.updateProject(req.user._id, id, { name, description });
      return successResponse(res, 200, project);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      const result = await projectService.deleteProject(req.user._id, id);
      return successResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
