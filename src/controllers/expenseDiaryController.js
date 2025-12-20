const ExpenseDiary = require('../models/ExpenseDiary');
const Case = require('../models/Case');
const { sendEmail } = require('../utils/helpers');

/**
 * EXPENSE DIARY CONTROLLER
 */

/**
 * CREATE Expense Entry
 * @route POST /api/diary/expense
 * @access ADVOCATE
 */
exports.createExpense = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      caseId,
      clientId,
      expenseTitle,
      expenseType,
      amount,
      taxApplicable,
      taxPercentage,
      expenseDate,
      paymentMode,
      paymentDetails,
      description,
      vendorDetails,
      billedToClient,
    } = req.body;

    if (!caseId || !expenseTitle || !expenseType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get case details
    const caseRecord = await Case.findById(caseId);
    if (!caseRecord || caseRecord.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    // Calculate tax
    let taxAmount = 0;
    if (taxApplicable && taxPercentage) {
      taxAmount = (amount * taxPercentage) / 100;
    }

    const totalAmount = amount + taxAmount;

    const expense = new ExpenseDiary({
      tenantId,
      caseId,
      clientId,
      caseNumber: caseRecord.caseNumber,
      caseTitle: caseRecord.title,
      expenseTitle,
      expenseType,
      amount,
      taxApplicable,
      taxPercentage: taxApplicable ? taxPercentage : 0,
      taxAmount: taxApplicable ? taxAmount : 0,
      totalAmount,
      expenseDate,
      paymentMode,
      paymentDetails,
      description,
      vendorDetails,
      billedToClient: billedToClient || false,
      createdBy: userId,
      status: 'recorded',
    });

    await expense.save();

    // Update case spent amount
    if (!billedToClient) {
      caseRecord.spentAmount = (caseRecord.spentAmount || 0) + totalAmount;
      await caseRecord.save();
    }

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating expense',
      error: error.message,
    });
  }
};

/**
 * GET Expense by ID
 * @route GET /api/diary/expense/:id
 * @access ADVOCATE
 */
exports.getExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const expense = await ExpenseDiary.findById(id)
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!expense || expense.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expense',
      error: error.message,
    });
  }
};

/**
 * GET All Expenses for a Case
 * @route GET /api/diary/expense/case/:caseId
 * @access ADVOCATE
 */
exports.getExpensesByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { tenantId } = req.user;

    const expenses = await ExpenseDiary.find({
      tenantId,
      caseId,
      isActive: true,
    })
      .sort({ expenseDate: -1 });

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
    const billableExpenses = expenses
      .filter((exp) => exp.billedToClient)
      .reduce((sum, exp) => sum + exp.totalAmount, 0);
    const nonBillableExpenses = expenses
      .filter((exp) => !exp.billedToClient)
      .reduce((sum, exp) => sum + exp.totalAmount, 0);

    res.json({
      success: true,
      count: expenses.length,
      summary: {
        totalExpenses,
        billableExpenses,
        nonBillableExpenses,
      },
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
      error: error.message,
    });
  }
};

/**
 * UPDATE Expense
 * @route PUT /api/diary/expense/:id
 * @access ADVOCATE
 */
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;
    const updates = req.body;

    const expense = await ExpenseDiary.findById(id);

    if (!expense || expense.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Recalculate tax if amount or taxPercentage changes
    if (updates.amount || updates.taxPercentage) {
      const newAmount = updates.amount || expense.amount;
      const newTaxPercentage = updates.taxPercentage || expense.taxPercentage;

      let taxAmount = 0;
      if (expense.taxApplicable && newTaxPercentage) {
        taxAmount = (newAmount * newTaxPercentage) / 100;
      }

      expense.totalAmount = newAmount + taxAmount;
      expense.taxAmount = taxAmount;
    }

    const allowedUpdates = [
      'expenseTitle',
      'expenseType',
      'amount',
      'taxPercentage',
      'expenseDate',
      'paymentMode',
      'paymentDetails',
      'description',
      'vendorDetails',
      'status',
      'paymentStatus',
      'verificationStatus',
      'verificationNotes',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        expense[field] = updates[field];
      }
    });

    await expense.save();

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating expense',
      error: error.message,
    });
  }
};

/**
 * VERIFY EXPENSE
 * @route POST /api/diary/expense/:id/verify
 * @access ADMIN/ADVOCATE
 */
exports.verifyExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const { status, notes } = req.body;

    const expense = await ExpenseDiary.findById(id);

    if (!expense || expense.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    expense.verificationStatus = status; // approved, rejected, needs_review
    expense.verificationNotes = notes;
    expense.verifiedBy = userId;
    expense.verificationDate = new Date();

    if (status === 'approved') {
      expense.status = 'verified';
    }

    await expense.save();

    res.json({
      success: true,
      message: 'Expense verified successfully',
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying expense',
      error: error.message,
    });
  }
};

/**
 * GENERATE EXPENSE LEDGER FOR CASE
 * @route GET /api/diary/expense/case/:caseId/ledger
 * @access ADVOCATE
 */
exports.getExpenseLedger = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { tenantId } = req.user;

    const caseRecord = await Case.findById(caseId);

    if (!caseRecord || caseRecord.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    const expenses = await ExpenseDiary.find({
      tenantId,
      caseId,
      isActive: true,
    }).sort({ expenseDate: 1 });

    // Group by expense type
    const ledgerByType = {};
    const ledgerByDate = {};

    expenses.forEach((exp) => {
      if (!ledgerByType[exp.expenseType]) {
        ledgerByType[exp.expenseType] = [];
      }
      ledgerByType[exp.expenseType].push(exp);

      const monthYear = exp.expenseDate.toISOString().substring(0, 7);
      if (!ledgerByDate[monthYear]) {
        ledgerByDate[monthYear] = [];
      }
      ledgerByDate[monthYear].push(exp);
    });

    // Calculate summaries
    const summary = {
      caseNumber: caseRecord.caseNumber,
      caseTitle: caseRecord.title,
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.totalAmount, 0),
      billableExpenses: expenses
        .filter((exp) => exp.billedToClient)
        .reduce((sum, exp) => sum + exp.totalAmount, 0),
      nonBillableExpenses: expenses
        .filter((exp) => !exp.billedToClient)
        .reduce((sum, exp) => sum + exp.totalAmount, 0),
      expenseCount: expenses.length,
      averageExpense: expenses.length ? expenses.reduce((sum, exp) => sum + exp.totalAmount, 0) / expenses.length : 0,
    };

    res.json({
      success: true,
      summary,
      ledgerByType,
      ledgerByDate,
      expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating expense ledger',
      error: error.message,
    });
  }
};

/**
 * DELETE Expense (Soft Delete)
 * @route DELETE /api/diary/expense/:id
 * @access ADVOCATE
 */
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const expense = await ExpenseDiary.findById(id);

    if (!expense || expense.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    expense.isActive = false;
    await expense.save();

    // Update case spent amount
    const caseRecord = await Case.findById(expense.caseId);
    if (caseRecord) {
      caseRecord.spentAmount = Math.max(0, (caseRecord.spentAmount || 0) - expense.totalAmount);
      await caseRecord.save();
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message,
    });
  }
};

module.exports = exports;
