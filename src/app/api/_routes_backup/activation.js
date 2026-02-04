const express = require('express');
const router = express.Router();
const ActivationCode = require('../models/ActivationCode');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Verify activation code (public)
router.post('/verify', async (req, res) => {
  try {
    const { code, deviceId, deviceName } = req.body;

    if (!code || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Code and device ID are required',
      });
    }

    // Find activation code
    const activationCode = await ActivationCode.findOne({ 
      code: code.toUpperCase().trim() 
    });

    if (!activationCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid activation code',
      });
    }

    // Check if already activated by this device
    const existingDevice = activationCode.activatedDevices.find(
      d => d.deviceId === deviceId
    );

    if (existingDevice) {
      return res.json({
        success: true,
        message: 'Device already activated',
        data: {
          activatedAt: existingDevice.activatedAt,
          expiresAt: activationCode.expiresAt,
        },
      });
    }

    // Check if code is valid
    if (!activationCode.isValid()) {
      let message = 'Activation code is not valid';
      if (!activationCode.isActive) message = 'Activation code is deactivated';
      else if (activationCode.expiresAt && activationCode.expiresAt < new Date()) {
        message = 'Activation code has expired';
      }
      else if (activationCode.activatedDevices.length >= activationCode.maxDevices) {
        message = 'Maximum devices limit reached for this code';
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Activate device
    const result = activationCode.activateDevice(deviceId, deviceName);
    await activationCode.save();

    res.json({
      success: true,
      message: result.message,
      data: {
        activatedAt: new Date(),
        expiresAt: activationCode.expiresAt,
      },
    });
  } catch (error) {
    console.error('Activation verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify activation code',
    });
  }
});

// Check device activation status (public)
router.get('/status/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const activationCode = await ActivationCode.findOne({
      'activatedDevices.deviceId': deviceId,
      isActive: true,
    });

    if (!activationCode) {
      return res.json({
        success: true,
        data: {
          isActivated: false,
        },
      });
    }

    const device = activationCode.activatedDevices.find(d => d.deviceId === deviceId);
    const isExpired = activationCode.expiresAt && activationCode.expiresAt < new Date();

    res.json({
      success: true,
      data: {
        isActivated: !isExpired,
        activatedAt: device.activatedAt,
        expiresAt: activationCode.expiresAt,
      },
    });
  } catch (error) {
    console.error('Activation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check activation status',
    });
  }
});

// Admin: Get all activation codes
router.get('/admin/codes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, active } = req.query;
    const query = {};
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const codes = await ActivationCode.find(query)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivationCode.countDocuments(query);

    res.json({
      success: true,
      data: {
        codes,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get activation codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activation codes',
    });
  }
});

// Admin: Create activation code
router.post('/admin/codes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { maxDevices = 1, expiresInDays = null, notes = '', customCode = '' } = req.body;

    let code;
    
    // Use custom code if provided
    if (customCode && customCode.trim()) {
      code = customCode.toUpperCase().trim();
      
      // Check if custom code already exists
      const exists = await ActivationCode.findOne({ code });
      if (exists) {
        return res.status(400).json({
          success: false,
          message: 'This activation code already exists',
        });
      }
    } else {
      // Generate unique code
      let exists = true;
      let attempts = 0;

      while (exists && attempts < 10) {
        code = ActivationCode.generateCode();
        exists = await ActivationCode.findOne({ code });
        attempts++;
      }

      if (exists) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate unique code',
        });
      }
    }

    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const activationCode = new ActivationCode({
      code,
      maxDevices,
      expiresAt,
      notes,
      createdBy: req.user.id,
    });

    await activationCode.save();

    res.status(201).json({
      success: true,
      data: activationCode,
    });
  } catch (error) {
    console.error('Create activation code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activation code',
    });
  }
});

// Admin: Update activation code
router.put('/admin/codes/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, maxDevices, expiresAt, notes } = req.body;

    const activationCode = await ActivationCode.findById(id);
    if (!activationCode) {
      return res.status(404).json({
        success: false,
        message: 'Activation code not found',
      });
    }

    if (isActive !== undefined) activationCode.isActive = isActive;
    if (maxDevices !== undefined) activationCode.maxDevices = maxDevices;
    if (expiresAt !== undefined) activationCode.expiresAt = expiresAt;
    if (notes !== undefined) activationCode.notes = notes;

    await activationCode.save();

    res.json({
      success: true,
      data: activationCode,
    });
  } catch (error) {
    console.error('Update activation code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activation code',
    });
  }
});

// Admin: Delete activation code
router.delete('/admin/codes/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const activationCode = await ActivationCode.findByIdAndDelete(id);
    if (!activationCode) {
      return res.status(404).json({
        success: false,
        message: 'Activation code not found',
      });
    }

    res.json({
      success: true,
      message: 'Activation code deleted successfully',
    });
  } catch (error) {
    console.error('Delete activation code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activation code',
    });
  }
});

module.exports = router;
