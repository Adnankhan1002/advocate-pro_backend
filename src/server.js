require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const connectDB = require('./config/database');
const swaggerSpec = require('./config/swagger');
const { initializeCronJobs } = require('./services/cronService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const clientRoutes = require('./routes/clientRoutes');
const caseRoutes = require('./routes/caseRoutes');
const hearingRoutes = require('./routes/hearingRoutes');
const dailyDiaryRoutes = require('./routes/dailyDiaryRoutes');
const diaryEntryRoutes = require('./routes/diaryEntryRoutes');
const caseNotesDiaryRoutes = require('./routes/caseNotesDiaryRoutes');
const confidentialLawyerDiaryRoutes = require('./routes/confidentialLawyerDiaryRoutes');
const courtHearingDiaryRoutes = require('./routes/courtHearingDiaryRoutes');
const expenseDiaryRoutes = require('./routes/expenseDiaryRoutes');
const followUpDiaryRoutes = require('./routes/followUpDiaryRoutes');
const documentDiaryRoutes = require('./routes/documentDiaryRoutes');
const taskToDoDiaryRoutes = require('./routes/taskToDoDiaryRoutes');
const meetingDiaryRoutes = require('./routes/meetingDiaryRoutes');
const documentRoutes = require('./routes/documentRoutes');
const articleRoutes = require('./routes/articleRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware
 */
app.use(helmet()); // Security headers
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Database Connection Middleware for Serverless
 * Ensures connection is established before handling requests
 */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/hearings', hearingRoutes);
app.use('/api/diaries/daily', dailyDiaryRoutes);
app.use('/api/diaries/entries', diaryEntryRoutes);
app.use('/api/diaries/case-notes', caseNotesDiaryRoutes);
app.use('/api/diaries/confidential', confidentialLawyerDiaryRoutes);
app.use('/api/diaries/court-hearing', courtHearingDiaryRoutes);
app.use('/api/diaries/expenses', expenseDiaryRoutes);
app.use('/api/diaries/follow-up', followUpDiaryRoutes);
app.use('/api/diaries/documents', documentDiaryRoutes);
app.use('/api/diaries/tasks', taskToDoDiaryRoutes);
app.use('/api/diaries/meetings', meetingDiaryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/articles', articleRoutes);

/**
 * Swagger Documentation
 */
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api-docs/swagger.json',
  },
}));

/**
 * Swagger JSON endpoint
 */
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

/**
 * Error Handler Middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB with caching for serverless
    await connectDB();

    // Initialize background jobs only if not in serverless environment
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      initializeCronJobs();
    } else {
      console.log('⚠️  Skipping cron jobs in serverless environment');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n✓ Server is running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV}`);
      console.log(`✓ API Base URL: http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Don't exit in serverless - let it retry
    if (process.env.VERCEL) {
      console.error('⚠️  Server starting without database - will retry on requests');
    } else {
      process.exit(1);
    }
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
