const DiaryEntry = require('../models/DiaryEntry');

/**
 * CREATE Diary Entry
 * @route POST /api/diaries/entries
 * @access ADVOCATE
 */
exports.createDiaryEntry = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { date, time, title, description, relatedCaseId, tags } = req.body;

    if (!time || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Time, title, and description are required',
      });
    }

    const entryDate = date ? new Date(date) : new Date();
    entryDate.setHours(0, 0, 0, 0);

    const diaryEntry = new DiaryEntry({
      tenantId,
      userId,
      date: entryDate,
      time,
      title,
      description,
      relatedCaseId,
      tags: tags || [],
    });

    await diaryEntry.save();

    res.status(201).json({
      success: true,
      message: 'Diary entry created successfully',
      data: diaryEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating diary entry',
      error: error.message,
    });
  }
};

/**
 * GET Diary Entries by Date
 * @route GET /api/diaries/entries/:date
 * @access ADVOCATE
 */
exports.getDiaryEntriesByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { tenantId, userId } = req.user;

    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    const entries = await DiaryEntry.find({
      tenantId,
      userId,
      date: entryDate,
      isActive: true,
    })
      .populate('relatedCaseId', 'caseNumber title')
      .sort({ time: 1, createdAt: 1 });

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching diary entries',
      error: error.message,
    });
  }
};

/**
 * GET Diary Entry by ID
 * @route GET /api/diaries/entries/detail/:id
 * @access ADVOCATE
 */
exports.getDiaryEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const entry = await DiaryEntry.findOne({
      _id: id,
      tenantId,
      isActive: true,
    }).populate('relatedCaseId', 'caseNumber title');

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Diary entry not found',
      });
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching diary entry',
      error: error.message,
    });
  }
};

/**
 * UPDATE Diary Entry
 * @route PUT /api/diaries/entries/:id
 * @access ADVOCATE
 */
exports.updateDiaryEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;
    const { time, title, description, relatedCaseId, tags } = req.body;

    const entry = await DiaryEntry.findOne({
      _id: id,
      tenantId,
      userId,
      isActive: true,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Diary entry not found',
      });
    }

    if (time) entry.time = time;
    if (title) entry.title = title;
    if (description) entry.description = description;
    if (relatedCaseId !== undefined) entry.relatedCaseId = relatedCaseId;
    if (tags) entry.tags = tags;

    await entry.save();

    res.json({
      success: true,
      message: 'Diary entry updated successfully',
      data: entry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating diary entry',
      error: error.message,
    });
  }
};

/**
 * DELETE Diary Entry
 * @route DELETE /api/diaries/entries/:id
 * @access ADVOCATE
 */
exports.deleteDiaryEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId, userId } = req.user;

    const entry = await DiaryEntry.findOne({
      _id: id,
      tenantId,
      userId,
      isActive: true,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Diary entry not found',
      });
    }

    // Soft delete
    entry.isActive = false;
    await entry.save();

    res.json({
      success: true,
      message: 'Diary entry deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting diary entry',
      error: error.message,
    });
  }
};

/**
 * GET Diary Entries by Date Range
 * @route GET /api/diaries/entries/range/:startDate/:endDate
 * @access ADVOCATE
 */
exports.getDiaryEntriesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const { tenantId, userId } = req.user;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const entries = await DiaryEntry.find({
      tenantId,
      userId,
      date: { $gte: start, $lte: end },
      isActive: true,
    })
      .populate('relatedCaseId', 'caseNumber title')
      .sort({ date: -1, time: 1 });

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching diary entries',
      error: error.message,
    });
  }
};
