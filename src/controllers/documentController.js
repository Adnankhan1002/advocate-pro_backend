const Joi = require('joi');
const Document = require('../models/Document');
const Case = require('../models/Case');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { generateLegalDocumentStream, generateDocumentTitle } = require('../services/documentGeneratorService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, JPG, JPEG, and PNG files are allowed'));
    }
  }
}).single('document');

/**
 * Validation schemas
 */
const generateDocumentSchema = Joi.object({
  tenantId: Joi.string().required(),
  caseId: Joi.string().required(),
  documentType: Joi.string()
    .valid('bail_application', 'legal_notice', 'petition')
    .required(),
  facts: Joi.string().required(),
  fir: Joi.string().required(),
  clientDetails: Joi.string().required(),
  additionalInfo: Joi.string().optional(),
});

const updateDocumentSchema = Joi.object({
  content: Joi.string().optional(),
  status: Joi.string().valid('draft', 'finalized', 'archived').optional(),
  notes: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

/**
 * Generate document using AI with streaming
 */
const generateDocument = async (req, res) => {
  try {
    const { error, value } = generateDocumentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    // Find case by ID first
    const caseData = await Case.findById(value.caseId);
    
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    // Verify case belongs to the tenant sending the request
    if (caseData.tenantId.toString() !== value.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Case does not belong to your tenant',
      });
    }

    // Verify the tenant in payload matches the authenticated user's tenant
    if (req.tenantId !== value.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Tenant ID mismatch',
      });
    }

    // Set up streaming response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Buffer to collect document content
    let documentContent = '';
    let totalChunks = 0;

    // Generate document content using Gemini API with streaming
    console.log(`📄 Generating ${value.documentType} document for case ${caseData.caseNumber}...`);
    
    try {
      documentContent = await generateLegalDocumentStream(
        value.documentType,
        {
          facts: value.facts,
          fir: value.fir,
          clientDetails: value.clientDetails,
          additionalInfo: value.additionalInfo || '',
        },
        (chunk) => {
          // Optional: Can stream progress to client
          totalChunks++;
          console.log(`📝 Chunk ${totalChunks} received`);
        }
      );

      if (!documentContent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate document content',
        });
      }

      // Generate title
      const title = generateDocumentTitle(
        value.documentType,
        caseData.caseNumber,
        caseData.title
      );

      // Create document record in database
      const newDocument = new Document({
        tenantId: value.tenantId,
        caseId: value.caseId,
        documentType: value.documentType,
        title,
        content: documentContent,
        generatedByAI: true,
        inputData: {
          facts: value.facts,
          fir: value.fir,
          clientDetails: value.clientDetails,
          additionalInfo: value.additionalInfo,
        },
        metadata: {
          generatedAt: new Date(),
          model: 'gemini-2.5-flash',
          promptVersion: '2.0',
        },
        createdBy: req.user.userId,
      });

      await newDocument.save();

      console.log(`✓ Document generated and saved: ${newDocument._id}`);

      return res.status(201).json({
        success: true,
        message: 'Document generated successfully',
        data: {
          _id: newDocument._id,
          tenantId: newDocument.tenantId.toString(),
          caseId: newDocument.caseId.toString(),
          title: newDocument.title,
          documentType: newDocument.documentType,
          status: newDocument.status,
          generatedByAI: newDocument.generatedByAI,
          content: newDocument.content,
          createdAt: newDocument.createdAt,
        },
      });
    } catch (genError) {
      console.error('❌ Document generation error:', genError.message);
      return res.status(500).json({
        success: false,
        message: genError.message || 'Failed to generate document',
      });
    }
  } catch (error) {
    console.error('Generate document error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate document',
    });
  }
};

/**
 * Get documents grouped by case
 */
const getDocumentsGroupedByCase = async (req, res) => {
  try {
    const cases = await Case.find({ tenantId: req.tenantId, isActive: true })
      .populate('clientId', 'firstName lastName phoneNumber address city state pincode')
      .sort({ createdAt: -1 })
      .lean();

    const casesWithDocuments = await Promise.all(
      cases.map(async (caseItem) => {
        const documents = await Document.find({
          caseId: caseItem._id,
          tenantId: req.tenantId,
          isActive: true,
        })
          .populate('createdBy', 'firstName lastName')
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...caseItem,
          documents,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: casesWithDocuments,
    });
  } catch (error) {
    console.error('Get documents grouped by case error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all documents for tenant
 */
const getAllDocuments = async (req, res) => {
  try {
    const { caseId, documentType, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { tenantId: req.tenantId, isActive: true };

    if (caseId) filter.caseId = caseId;
    if (documentType) filter.documentType = documentType;
    if (status) filter.status = status;

    const total = await Document.countDocuments(filter);
    const documents = await Document.find(filter)
      .populate('caseId', 'caseNumber title')
      .populate('createdBy', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: documents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get document by ID
 */
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      tenantId: req.tenantId,
    })
      .populate('caseId')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Get document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update document
 */
const updateDocument = async (req, res) => {
  try {
    const { error, value } = updateDocumentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details,
      });
    }

    const updateData = { ...value };

    // If status is changing to finalized, mark approval details
    if (value.status === 'finalized') {
      updateData.approvedBy = req.user.userId;
      updateData.approvedAt = new Date();
    }

    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.documentId,
        tenantId: req.tenantId,
      },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('caseId')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: document,
    });
  } catch (error) {
    console.error('Update document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete document (soft delete)
 */
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndUpdate(
      {
        _id: req.params.documentId,
        tenantId: req.tenantId,
      },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get documents for a specific case
 */
const getDocumentsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    // Find case by ID first
    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found',
      });
    }

    // Verify case belongs to user's tenant
  

    const documents = await Document.find({
      caseId,
      tenantId: req.tenantId,
      isActive: true,
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Get case documents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Export document as text/PDF
 */
const exportDocument = async (req, res) => {
  try {
    const { format = 'txt' } = req.query;

    const document = await Document.findOne({
      _id: req.params.documentId,
      tenantId: req.tenantId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    if (format === 'txt') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${document.title}-${Date.now()}.txt"`
      );
      res.send(document.content);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported export format. Currently supports: txt',
      });
    }
  } catch (error) {
    console.error('Export document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Upload document from local system
 */
const uploadDocument = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.code === 'LIMIT_FILE_SIZE' ? 'File size exceeds 10MB limit' : err.message,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    try {
      const { caseId, title, documentType, notes } = req.body;

      // Validate required fields
      if (!caseId) {
        // Clean up uploaded file
        await fs.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Case ID is required',
        });
      }

      // Verify case exists
      const caseExists = await Case.findOne({
        _id: caseId,
        tenantId: req.tenantId,
      });

      if (!caseExists) {
        // Clean up uploaded file
        await fs.unlink(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Case not found',
        });
      }

      // Read file content (for text-based files)
      let content = '';
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      if (['.txt', '.doc', '.docx'].includes(fileExt)) {
        try {
          content = await fs.readFile(req.file.path, 'utf-8');
        } catch (readError) {
          // If reading fails, just leave content empty
          content = 'Binary or encrypted file content';
        }
      }

      // Create document record
      const document = await Document.create({
        tenantId: req.tenantId,
        caseId,
        title: title || req.file.originalname,
        documentType: documentType || 'Other',
        content,
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        generatedByAI: false,
        status: 'finalized',
        notes: notes || '',
        createdBy: req.userId,
        metadata: {
          uploadedAt: new Date(),
          originalName: req.file.originalname,
        },
      });

      const populatedDocument = await Document.findById(document._id)
        .populate('caseId', 'caseNumber title')
        .populate('createdBy', 'firstName lastName email');

      return res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: populatedDocument,
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      
      console.error('Upload document error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });
};

module.exports = {
  generateDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentsByCase,
  getDocumentsGroupedByCase,
  exportDocument,
  uploadDocument,
  upload,
};
