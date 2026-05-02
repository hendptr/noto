import mongoose from 'mongoose';

export interface IPin extends mongoose.Document {
  pin: string;
}

const PinSchema = new mongoose.Schema({
  pin: {
    type: String,
    required: true,
  },
});

export default mongoose.models.Pin || mongoose.model<IPin>('Pin', PinSchema);
