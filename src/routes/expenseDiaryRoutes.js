const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const expenseController = require('../controllers/expenseDiaryController');

/**
 * EXPENSE DIARY ROUTES
 */

// Create expense
router.post('/', authMiddleware, tenantMiddleware, expenseController.createExpense);

// Get expense by ID
router.get('/:id', authMiddleware, tenantMiddleware, expenseController.getExpense);

// Get expenses by case
router.get('/case/:caseId', authMiddleware, tenantMiddleware, expenseController.getExpensesByCase);

// Get expense ledger for case
router.get('/case/:caseId/ledger', authMiddleware, tenantMiddleware, expenseController.getExpenseLedger);

// Update expense
router.put('/:id', authMiddleware, tenantMiddleware, expenseController.updateExpense);

// Verify expense
router.post('/:id/verify', authMiddleware, tenantMiddleware, expenseController.verifyExpense);

// Delete expense
router.delete('/:id', authMiddleware, tenantMiddleware, expenseController.deleteExpense);

module.exports = router;
