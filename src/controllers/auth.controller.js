const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const result = await authService.registerUser({ name, email, password });
      return successResponse(res, 201, result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser({ email, password });
      return successResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      return successResponse(res, 200, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      return successResponse(res, 200, {
        user: {
          id: req.user._id.toString(),
          name: req.user.name,
          email: req.user.email,
          createdAt: req.user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user._id, {
        currentPassword,
        newPassword
      });
      return successResponse(res, 200, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
