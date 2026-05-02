import mongoose from 'mongoose';

export interface IDailyEntry extends mongoose.Document {
  date: string; // YYYY-MM-DD
  happiness?: number;
  highlight?: string;
  kadai?: string;
  activities?: string;
  customColumns: Array<{
    category: string;
    content: string;
  }>;
}

const DailyEntrySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },
  happiness: {
    type: Number,
    min: 1,
    max: 10,
  },
  highlight: {
    type: String,
  },
  kadai: {
    type: String,
  },
  activities: {
    type: String,
  },
  customColumns: [
    {
      category: String,
      content: String,
    },
  ],
}, { timestamps: true });

export default mongoose.models.DailyEntry || mongoose.model<IDailyEntry>('DailyEntry', DailyEntrySchema);
