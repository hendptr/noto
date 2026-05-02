import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'Uncategorized' },
  date: { type: Date, default: Date.now },
  source: { type: String, enum: ['manual', 'whatsapp-ai'], default: 'manual' }
});

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
