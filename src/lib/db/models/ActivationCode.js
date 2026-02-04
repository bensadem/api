const mongoose = require('mongoose');

const activationCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  maxDevices: {
    type: Number,
    default: 1,
  },
  activatedDevices: [{
    deviceId: String,
    deviceName: String,
    activatedAt: Date,
  }],
  expiresAt: {
    type: Date,
    default: null, // null means never expires
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Check if code is valid
activationCodeSchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.activatedDevices.length >= this.maxDevices) return false;
  return true;
};

// Activate device
activationCodeSchema.methods.activateDevice = function(deviceId, deviceName) {
  if (!this.isValid()) {
    throw new Error('Activation code is not valid');
  }
  
  // Check if device already activated
  const existing = this.activatedDevices.find(d => d.deviceId === deviceId);
  if (existing) {
    return { success: true, message: 'Device already activated' };
  }
  
  this.activatedDevices.push({
    deviceId,
    deviceName: deviceName || 'Unknown Device',
    activatedAt: new Date(),
  });
  
  return { success: true, message: 'Device activated successfully' };
};

// Generate random activation code
activationCodeSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = mongoose.models.ActivationCode || mongoose.model('ActivationCode', activationCodeSchema);

