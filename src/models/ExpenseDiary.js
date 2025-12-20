const mongoose = require('mongoose');

/**
 * Expense Diary Model (Optional but powerful)
 * 
 * Advocates must maintain:
 * - Filing fees
 * - Drafting fees
 * - Clerk expenses
 * - Typing charges
 * - Printing charges
 * 
 * Auto-generate Expense Ledger per Case.
 */
const expenseDiarySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    
    // CASE INFORMATION
    caseNumber: {
      type: String,
      required: true,
    },
    caseTitle: {
      type: String,
      required: true,
    },
    
    // EXPENSE DETAILS
    expenseTitle: {
      type: String,
      required: [true, 'Expense title is required'],
    },
    
    // EXPENSE TYPE
    expenseType: {
      type: String,
      required: [true, 'Expense type is required'],
      enum: ['filing_fee', 'drafting_fee', 'clerk_expense', 'typing_charge', 'printing_charge', 'court_fees', 'travel', 'consultation_fee', 'expert_fees', 'process_server_fees', 'bailiff_fees', 'stamp_duty', 'photocopying', 'documentation', 'other'],
    },
    
    // AMOUNT
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP'],
    },
    
    // TAX
    taxApplicable: {
      type: Boolean,
      default: false,
    },
    taxType: {
      type: String,
      enum: ['GST', 'VAT', 'None'],
      default: 'GST',
    },
    taxPercentage: {
      type: Number,
      default: 0,
    },
    taxAmount: Number,
    
    totalAmount: {
      type: Number,
      required: true,
    },
    
    // DATE & TIMING
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      index: true,
    },
    invoiceDate: Date,
    
    // PAYMENT INFORMATION
    paymentMode: {
      type: String,
      required: true,
      enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'credit_card', 'debit_card', 'online_payment'],
    },
    
    paymentDetails: {
      chequeNumber: String,
      chequeDate: Date,
      bankName: String,
      bankAccount: String,
      transactionId: String,
      upiId: String,
      cardLast4Digits: String,
    },
    
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'refunded'],
      default: 'paid',
    },
    paidDate: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // BILLED TO CLIENT (OR ADVOCATE'S OWN EXPENSE)
    billedToClient: {
      type: Boolean,
      default: false,
    },
    
    billableTo: {
      name: String,
      type: {
        type: String,
        enum: ['client', 'advocate', 'other_party'],
      },
    },
    
    invoiceNumber: String,
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    
    // VENDOR/SUPPLIER INFORMATION
    vendorDetails: {
      vendorName: String,
      vendorType: String,
      vendorPhone: String,
      vendorEmail: String,
      vendorAddress: String,
      gstNumber: String,
      panNumber: String,
    },
    
    // DESCRIPTION & JUSTIFICATION
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    justification: String,
    purpose: String, // e.g., "Filing petition" or "Court appearance"
    
    // ATTACHMENTS
    documents: [
      {
        documentType: {
          type: String,
          enum: ['invoice', 'receipt', 'bill', 'estimate', 'proof_of_payment', 'permit', 'other'],
        },
        fileName: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // APPROVAL & VERIFICATION
    verificationRequired: {
      type: Boolean,
      default: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationDate: Date,
    verificationNotes: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'needs_review'],
      default: 'pending',
    },
    
    // REIMBURSEMENT
    reimbursable: {
      type: Boolean,
      default: false,
    },
    reimbursementAmount: Number,
    reimbursementStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'reimbursed'],
    },
    reimbursementDate: Date,
    reimbursedTo: String,
    
    // BUDGET TRACKING
    budgetCategory: String,
    allocatedBudget: Number,
    usedAmount: Number,
    
    // TAX & ACCOUNTING
    gstCompliant: {
      type: Boolean,
      default: true,
    },
    taxDeductible: {
      type: Boolean,
      default: true,
    },
    accountingCode: String, // For accounting system integration
    journal: String,
    
    // METADATA
    tags: [String],
    status: {
      type: String,
      enum: ['recorded', 'billed', 'paid', 'settled', 'archived'],
      default: 'recorded',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
expenseDiarySchema.index({ tenantId: 1, caseId: 1 });
expenseDiarySchema.index({ caseId: 1 });
expenseDiarySchema.index({ expenseDate: 1 });
expenseDiarySchema.index({ expenseType: 1 });
expenseDiarySchema.index({ paymentStatus: 1 });
expenseDiarySchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('ExpenseDiary', expenseDiarySchema);
