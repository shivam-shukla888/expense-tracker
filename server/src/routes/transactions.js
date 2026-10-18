import { Router } from 'express';
import { TransactionService } from '../services/transactionService.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  validate,
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionQuerySchema
} from '../middleware/validation.js';

const router = Router();

// Protect all transaction routes
router.use(requireAuth);

// GET /api/transactions/categories - available categories
router.get('/categories', (req, res, next) => {
  try {
    const categories = TransactionService.getCategories(req.user.id);
    res.status(200).json({
      success: true,
      categories
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions - list with filters & pagination
router.get(
  '/',
  validate(transactionQuerySchema, 'query'),
  (req, res, next) => {
    try {
      const result = TransactionService.listTransactions(req.user.id, req.query);
      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/transactions/:id - get single transaction
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID'
      });
    }

    const transaction = TransactionService.getTransactionById(req.user.id, id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/transactions - create transaction
router.post(
  '/',
  verifyCsrf,
  validate(transactionCreateSchema, 'body'),
  (req, res, next) => {
    try {
      const transaction = TransactionService.createTransaction(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        transaction
      });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/transactions/:id - update transaction
router.put(
  '/:id',
  verifyCsrf,
  validate(transactionUpdateSchema, 'body'),
  (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid transaction ID'
        });
      }

      const updated = TransactionService.updateTransaction(req.user.id, id, req.body);
      res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        transaction: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/transactions/:id - delete transaction
router.delete('/:id', verifyCsrf, (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID'
      });
    }

    TransactionService.deleteTransaction(req.user.id, id);
    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      id
    });
  } catch (err) {
    next(err);
  }
});

export default router;
