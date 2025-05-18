const User = require("../models/userModel");
const { JWT_SECRET } = process.env;
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return next(new AppError("Email already in use", 400));
      }

      // Create new user
      const userId = await User.create({ name, email, password, phone });

      // Get the user data
      const user = await User.findById(userId);

      // Generate tokens
      const { token, refreshToken } = await User.generateAuthToken(user);

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Remove password from response
      delete user.password;

      res.status(201).json({
        status: "success",
        data: {
          user,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1) Check if email and password exist
      if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
      }

      // 2) Check if user exists and password is correct
      const user = await User.findByEmail(email);

      if (!user || !(await User.comparePassword(password, user.password))) {
        // Increment failed login attempts
        await User.incrementFailedLoginAttempts(email);

        // Check if account should be locked
        const updatedUser = await User.findByEmail(email);
        if (updatedUser.failed_login_attempts >= 5) {
          await User.lockAccount(email);
          return next(
            new AppError(
              "Account locked due to too many failed attempts. Try again later.",
              401
            )
          );
        }

        return next(new AppError("Incorrect email or password", 401));
      }

      // 3) Check if account is locked
      if (user.lockout_time && new Date(user.lockout_time) > new Date()) {
        return next(
          new AppError("Account is temporarily locked. Try again later.", 401)
        );
      }

      // 4) If everything ok, reset failed attempts and send token
      await User.resetFailedLoginAttempts(email);

      const { token, refreshToken } = await User.generateAuthToken(user);

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Remove password from response
      delete user.password;

      res.status(200).json({
        status: "success",
        data: {
          user,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        // Invalidate the refresh token
        await User.invalidateRefreshToken(refreshToken);
      }

      // Clear the cookie
      res.clearCookie("refreshToken");

      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return next(new AppError("No refresh token provided", 401));
      }

      // Verify the refresh token
      const decoded = await User.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return next(new AppError("Invalid or expired refresh token", 401));
      }

      // Get the user
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new AppError("User not found", 404));
      }

      // Generate new access token
      const token = jwt.sign(
        { id: user.user_id, role: user.role },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
      );

      res.status(200).json({
        status: "success",
        data: {
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.user_id);

      if (!user) {
        return next(new AppError("User not found", 404));
      }

      // Remove password from response
      delete user.password;

      res.status(200).json({
        status: "success",
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMe(req, res, next) {
    try {
      const { name, phone } = req.body;

      // Filter out fields that shouldn't be updated
      const filteredBody = { name, phone };

      // Update user
      await User.update(req.user.id, filteredBody);

      // Get updated user
      const updatedUser = await User.findById(req.user.id);

      // Remove password from response
      delete updatedUser.password;

      res.status(200).json({
        status: "success",
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      // 1) Get user from collection
      const user = await User.findById(req.user.id);

      // 2) Check if current password is correct
      if (!(await User.comparePassword(currentPassword, user.password))) {
        return next(new AppError("Your current password is wrong", 401));
      }

      // 3) Update password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await User.update(req.user.id, { password: hashedPassword });

      // 4) Log user in, send JWT
      const { token, refreshToken } = await User.generateAuthToken(user);

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: "success",
        data: {
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
