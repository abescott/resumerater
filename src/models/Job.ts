import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
    bambooId: number;
    title: string;
    department: string;
    location: string;
    division: string;
    status: string;
    dateOpened: Date;
    description?: string;
    descriptionManuallyUpdated?: boolean;
    ratingEnabled?: boolean;
}

const JobSchema: Schema = new Schema({
    bambooId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    department: { type: String },
    location: { type: String },
    division: { type: String },
    status: { type: String },
    dateOpened: { type: Date },
    description: { type: String },
    descriptionManuallyUpdated: { type: Boolean, default: false },
    ratingEnabled: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IJob>('Job', JobSchema);
