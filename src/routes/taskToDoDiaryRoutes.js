const express = require('express');
const router = express.Router();
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const taskController = require('../controllers/taskToDoDiaryController');

/**
 * TASK & TO-DO DIARY ROUTES
 */

// Create task
router.post('/', authMiddleware, tenantMiddleware, taskController.createTask);

// Get my tasks
router.get('/assigned/me', authMiddleware, tenantMiddleware, taskController.getMyTasks);

// Get task by ID
router.get('/:id', authMiddleware, tenantMiddleware, taskController.getTask);

// Update task
router.put('/:id', authMiddleware, tenantMiddleware, taskController.updateTask);

// Update subtask
router.put('/:taskId/subtask/:subtaskId', authMiddleware, tenantMiddleware, taskController.updateSubtask);

// Submit task
router.post('/:id/submit', authMiddleware, tenantMiddleware, taskController.submitTask);

// Review task
router.post('/:id/review', authMiddleware, tenantMiddleware, taskController.reviewTask);

// Delete task
router.delete('/:id', authMiddleware, tenantMiddleware, taskController.deleteTask);

module.exports = router;
