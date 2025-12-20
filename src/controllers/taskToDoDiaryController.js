const TaskToDoDiary = require('../models/TaskToDoDiary');
const User = require('../models/User');
const { sendEmail, sendNotification } = require('../utils/helpers');

/**
 * TASK & TO-DO DIARY CONTROLLER
 */

/**
 * CREATE Task
 * @route POST /api/diary/task
 * @access ADVOCATE
 */
exports.createTask = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      title,
      description,
      taskType,
      caseId,
      clientId,
      assignedTo,
      deadline,
      priority,
      estimatedTime,
      subtasks,
    } = req.body;

    if (!title || !taskType || !assignedTo || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Verify assignee exists
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: 'Assignee not found',
      });
    }

    const task = new TaskToDoDiary({
      tenantId,
      createdBy: userId,
      title,
      description,
      taskType,
      caseId,
      clientId,
      assignedTo,
      assignedToDetails: {
        name: assignee.firstName + ' ' + assignee.lastName,
        email: assignee.email,
        role: assignee.role,
      },
      deadline,
      priority: priority || 'medium',
      estimatedTime,
      subtasks: subtasks || [],
      status: 'pending',
    });

    await task.save();

    // Send notification to assignee
    await sendEmail(
      assignee.email,
      `New Task: ${title}`,
      `A new task has been assigned to you: ${title}\n\nDeadline: ${new Date(deadline).toDateString()}`
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message,
    });
  }
};

/**
 * GET Task by ID
 * @route GET /api/diary/task/:id
 * @access ADVOCATE
 */
exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const task = await TaskToDoDiary.findById(id)
      .populate('caseId', 'title caseNumber')
      .populate('clientId', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    if (!task || task.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message,
    });
  }
};

/**
 * GET Tasks assigned to current user
 * @route GET /api/diary/task/assigned/me
 * @access ADVOCATE
 */
exports.getMyTasks = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { status, priority } = req.query;

    const query = {
      tenantId,
      assignedTo: userId,
      isActive: true,
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await TaskToDoDiary.find(query)
      .sort({ deadline: 1 })
      .populate('caseId', 'title caseNumber')
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message,
    });
  }
};

/**
 * UPDATE Task
 * @route PUT /api/diary/task/:id
 * @access ADVOCATE
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const updates = req.body;

    const task = await TaskToDoDiary.findById(id);

    if (!task || task.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Track status changes
    if (updates.status && updates.status !== task.status) {
      task.statusHistory.push({
        status: updates.status,
        changedAt: new Date(),
        changedBy: userId,
        notes: updates.statusChangeNotes || '',
      });
    }

    // Update progress
    if (updates.progressPercentage !== undefined) {
      task.progressPercentage = updates.progressPercentage;
    }

    const allowedUpdates = [
      'title',
      'description',
      'status',
      'progressPercentage',
      'deadline',
      'priority',
      'estimatedTime',
      'reviewRequired',
      'reviewStatus',
      'reviewComments',
      'subtasks',
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined && field !== 'status') {
        task[field] = updates[field];
      }
    });

    if (updates.status) task.status = updates.status;

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message,
    });
  }
};

/**
 * UPDATE SUBTASK
 * @route PUT /api/diary/task/:taskId/subtask/:subtaskId
 * @access ADVOCATE
 */
exports.updateSubtask = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.params;
    const { tenantId, userId } = req.user;
    const { title, completed } = req.body;

    const task = await TaskToDoDiary.findById(taskId);

    if (!task || task.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const subtask = task.subtasks.id(subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found',
      });
    }

    if (title) subtask.title = title;
    if (completed !== undefined) {
      subtask.completed = completed;
      if (completed) {
        subtask.completedAt = new Date();
        subtask.completedBy = userId;
      }
    }

    await task.save();

    res.json({
      success: true,
      message: 'Subtask updated successfully',
      data: subtask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating subtask',
      error: error.message,
    });
  }
};

/**
 * SUBMIT TASK
 * @route POST /api/diary/task/:id/submit
 * @access ADVOCATE
 */
exports.submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const { submissionNotes } = req.body;

    const task = await TaskToDoDiary.findById(id);

    if (!task || task.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Only assignee or creator can submit
    if (task.assignedTo.toString() !== userId && task.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only assignee or creator can submit task',
      });
    }

    task.submissionDetails = {
      submittedDate: new Date(),
      submittedBy: userId,
      submissionNotes,
    };

    task.status = 'in_progress'; // Change to pending review if review required
    if (task.reviewRequired) {
      task.reviewStatus = 'pending_review';
    }

    await task.save();

    // Notify creator
    const creator = await User.findById(task.createdBy);
    if (creator) {
      await sendEmail(
        creator.email,
        `Task Submitted: ${task.title}`,
        `Task "${task.title}" has been submitted for review`
      );
    }

    res.json({
      success: true,
      message: 'Task submitted successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting task',
      error: error.message,
    });
  }
};

/**
 * REVIEW TASK
 * @route POST /api/diary/task/:id/review
 * @access ADVOCATE
 */
exports.reviewTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const { status, comments } = req.body;

    const task = await TaskToDoDiary.findById(id);

    if (!task || task.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    // Only creator or reviewer can review
    if (task.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only task creator can review',
      });
    }

    task.reviewedBy = userId;
    task.reviewDate = new Date();
    task.reviewStatus = status; // approved, needs_revision, rejected
    task.reviewComments = comments;

    if (status === 'approved') {
      task.status = 'completed';
      task.statusHistory.push({
        status: 'completed',
        changedAt: new Date(),
        changedBy: userId,
        notes: 'Approved after review',
      });
    }

    await task.save();

    // Notify assignee
    const assignee = await User.findById(task.assignedTo);
    if (assignee) {
      await sendEmail(
        assignee.email,
        `Task Review: ${task.title}`,
        `Your task "${task.title}" has been reviewed: ${status}`
      );
    }

    res.json({
      success: true,
      message: 'Task reviewed successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reviewing task',
      error: error.message,
    });
  }
};

/**
 * DELETE Task (Soft Delete)
 * @route DELETE /api/diary/task/:id
 * @access ADVOCATE
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const task = await TaskToDoDiary.findById(id);

    if (!task || task.tenantId.toString() !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    task.isActive = false;
    await task.save();

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message,
    });
  }
};

module.exports = exports;
