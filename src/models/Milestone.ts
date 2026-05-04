import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, default: '' },
  reminders: {
    type: [Number], // Days before to remind (e.g., [1, 2, 3])
    default: [1]
  },
  lastReminded: { type: Map, of: Boolean, default: {} } // Map of "daysBefore": true
}, { timestamps: true });

export default mongoose.models.Milestone || mongoose.model('Milestone', MilestoneSchema);
