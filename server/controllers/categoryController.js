const AppError = require("../utils/appError");

class CategoryController {
  static async getAllCategories(req, res, next) {
    try {
      const [categories] = await req.db.query(
        "SELECT * FROM categories WHERE is_active = TRUE ORDER BY name"
      );

      res.status(200).json({
        status: "success",
        data: {
          categories,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCategory(req, res, next) {
    try {
      const [categories] = await req.db.query(
        "SELECT * FROM categories WHERE category_id = ? AND is_active = TRUE",
        [req.params.id]
      );

      if (!categories.length) {
        return next(new AppError("No category found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          category: categories[0],
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const { name, description, image_url } = req.body;

      // Check if category with same name exists
      const [existing] = await req.db.query(
        "SELECT category_id FROM categories WHERE name = ?",
        [name]
      );

      if (existing.length) {
        return next(
          new AppError("Category with this name already exists", 400)
        );
      }

      const [result] = await req.db.query(
        "INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)",
        [name, description, image_url]
      );

      res.status(201).json({
        status: "success",
        data: {
          category_id: result.insertId,
          name,
          description,
          image_url,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const { name, description, image_url, is_active } = req.body;

      // Check if category exists
      const [existing] = await req.db.query(
        "SELECT category_id FROM categories WHERE category_id = ?",
        [req.params.id]
      );

      if (!existing.length) {
        return next(new AppError("No category found with that ID", 404));
      }

      // Check if new name conflicts with existing category
      if (name) {
        const [nameCheck] = await req.db.query(
          "SELECT category_id FROM categories WHERE name = ? AND category_id != ?",
          [name, req.params.id]
        );

        if (nameCheck.length) {
          return next(
            new AppError("Category with this name already exists", 400)
          );
        }
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      if (name) {
        updates.push("name = ?");
        values.push(name);
      }
      if (description !== undefined) {
        updates.push("description = ?");
        values.push(description);
      }
      if (image_url !== undefined) {
        updates.push("image_url = ?");
        values.push(image_url);
      }
      if (is_active !== undefined) {
        updates.push("is_active = ?");
        values.push(is_active);
      }

      if (updates.length === 0) {
        return next(new AppError("No fields to update", 400));
      }

      values.push(req.params.id);

      await req.db.query(
        `UPDATE categories SET ${updates.join(", ")} WHERE category_id = ?`,
        values
      );

      res.status(200).json({
        status: "success",
        message: "Category updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      // Check if category exists
      const [existing] = await req.db.query(
        "SELECT category_id FROM categories WHERE category_id = ?",
        [req.params.id]
      );

      if (!existing.length) {
        return next(new AppError("No category found with that ID", 404));
      }

      // Soft delete by setting is_active to false
      await req.db.query(
        "UPDATE categories SET is_active = FALSE WHERE category_id = ?",
        [req.params.id]
      );

      res.status(200).json({
        status: "success",
        message: "Category deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CategoryController;
