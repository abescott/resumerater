import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
    bambooId: number;
    jobId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateApplied: Date;
    status: string;
    rating?: number;
    rawResponse?: any;
    details?: any;
    resumeText?: string;
    aiSummary?: string;
    aiRating?: number;
}

const ApplicationSchema: Schema = new Schema({
    bambooId: { type: Number, required: true, unique: true },
    jobId: { type: Number, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    dateApplied: { type: Date },
    status: { type: String },
    rating: { type: Number },
    rawResponse: { type: Schema.Types.Mixed },
    details: { type: Schema.Types.Mixed },
    resumeText: { type: String },
    aiSummary: { type: String },
    aiRating: { type: Number },
}, { timestamps: true });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
