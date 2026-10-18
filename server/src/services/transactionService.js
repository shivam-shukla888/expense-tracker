import { getDatabase } from '../db/database.js';
import { rupeesToPaise, paiseToRupees, formatINR } from '../utils/currency.js';

export class TransactionService {
  /**
   * Helper to format a transaction row for client consumption
   */
  static formatTransaction(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      category: row.category,
      amountPaise: row.amount_paise,
      amount: paiseToRupees(row.amount_paise),
      formattedAmount: formatINR(row.amount_paise),
      description: row.description,
      date: row.date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Create a new transaction for the authenticated user
   */
  static createTransaction(userId, { type, category, amount, description, date }) {
    const db = getDatabase();
    const amountPaise = rupeesToPaise(amount);

    const stmt = db.prepare(
      `INSERT INTO transactions (user_id, type, category, amount_paise, description, date)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const result = stmt.run(userId, type, category.trim(), amountPaise, description.trim(), date);
    const created = this.getTransactionById(userId, result.lastInsertRowid);
    return created;
  }

  /**
   * Get single transaction by ID, strictly enforcing user ownership
   */
  static getTransactionById(userId, transactionId) {
    const db = getDatabase();
    const row = db.prepare(
      `SELECT * FROM transactions WHERE id = ? AND user_id = ?`
    ).get(transactionId, userId);

    if (!row) return null;
    return this.formatTransaction(row);
  }

  /**
   * Update transaction with ownership check
   */
  static updateTransaction(userId, transactionId, updates) {
    const db = getDatabase();
    const existing = db.prepare(
      `SELECT id FROM transactions WHERE id = ? AND user_id = ?`
    ).get(transactionId, userId);

    if (!existing) {
      const error = new Error('Transaction not found or unauthorized');
      error.status = 404;
      throw error;
    }

    const setClauses = [];
    const values = [];

    if (updates.type !== undefined) {
      setClauses.push('type = ?');
      values.push(updates.type);
    }
    if (updates.category !== undefined) {
      setClauses.push('category = ?');
      values.push(updates.category.trim());
    }
    if (updates.amount !== undefined) {
      setClauses.push('amount_paise = ?');
      values.push(rupeesToPaise(updates.amount));
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      values.push(updates.description.trim());
    }
    if (updates.date !== undefined) {
      setClauses.push('date = ?');
      values.push(updates.date);
    }

    setClauses.push("updated_at = datetime('now')");

    values.push(transactionId);
    values.push(userId);

    const sql = `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`;
    db.prepare(sql).run(...values);

    return this.getTransactionById(userId, transactionId);
  }

  /**
   * Delete transaction with ownership check
   */
  static deleteTransaction(userId, transactionId) {
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM transactions WHERE id = ? AND user_id = ?`);
    const result = stmt.run(transactionId, userId);

    if (result.changes === 0) {
      const error = new Error('Transaction not found or unauthorized');
      error.status = 404;
      throw error;
    }

    return { success: true, id: transactionId };
  }

  /**
   * List transactions with parameterized filters, pagination, and sorting
   */
  static listTransactions(userId, filters = {}) {
    const db = getDatabase();
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 15,
      sortBy = 'date',
      sortOrder = 'desc'
    } = filters;

    const conditions = ['user_id = ?'];
    const params = [userId];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }

    if (search) {
      conditions.push('description LIKE ?');
      params.push(`%${search}%`);
    }

    const whereClause = conditions.join(' AND ');

    // Count total matching records
    const countSql = `SELECT COUNT(*) as total FROM transactions WHERE ${whereClause}`;
    const { total } = db.prepare(countSql).get(...params);

    // Sorting column mapping
    const sortColumns = {
      date: 'date',
      amount: 'amount_paise',
      category: 'category',
      created_at: 'created_at'
    };
    const sortColumn = sortColumns[sortBy] || 'date';
    const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Pagination
    const offset = (page - 1) * limit;

    const listSql = `
      SELECT * FROM transactions
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${direction}, id DESC
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(listSql).all(...params, limit, offset);

    return {
      transactions: rows.map(r => this.formatTransaction(r)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Get all distinct categories used or available
   */
  static getCategories(userId) {
    const db = getDatabase();
    const rows = db.prepare(
      `SELECT DISTINCT name, type FROM categories WHERE is_default = 1 OR user_id = ?
       ORDER BY type, name ASC`
    ).all(userId);
    return rows;
  }
}
