import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'global', unique: true },
  whatsappNumber: { type: String, default: '' },
  whatsappQr: { type: String, default: '' },
  whatsappStatus: { type: String, default: 'disconnected' },
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
