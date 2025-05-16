const db = require("../config/db");

class Category {
  static async findAll() {
    const [rows] = await db.query(
      "SELECT * FROM categories WHERE is_active = TRUE ORDER BY name"
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query(
      "SELECT * FROM categories WHERE category_id = ?",
      [id]
    );
    return rows[0];
  }

  static async create({ name, description, image_url }) {
    const [result] = await db.query(
      "INSERT INTO categories (name, description, image_url) VALUES (?, ?, ?)",
      [name, description, image_url]
    );
    return result.insertId;
  }

  static async update(id, { name, description, image_url, is_active }) {
    await db.query(
      `UPDATE categories 
       SET name = ?, description = ?, image_url = ?, is_active = ?
       WHERE category_id = ?`,
      [name, description, image_url, is_active, id]
    );
    return true;
  }

  static async delete(id) {
    await db.query(
      "UPDATE categories SET is_active = FALSE WHERE category_id = ?",
      [id]
    );
    return true;
  }

  static async countEvents(categoryId) {
    const [rows] = await db.query(
      "SELECT COUNT(*) as count FROM events WHERE category_id = ? AND is_active = TRUE",
      [categoryId]
    );
    return rows[0].count;
  }
}

module.exports = Category;
