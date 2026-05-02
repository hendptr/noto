import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
  time: { type: Date, required: true },
  sent: { type: Boolean, default: false }
});

const TodoSchema = new mongoose.Schema({
  task: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  reminders: [ReminderSchema],
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'mon-fri'], default: 'none' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
