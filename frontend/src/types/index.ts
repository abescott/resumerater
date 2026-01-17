export interface Job {
    _id: string;
    bambooId: number;
    title: string;
    department: string;
    location: string;
    division: string;
    status: string;
    dateOpened: string;
    description?: string;
    descriptionManuallyUpdated?: boolean;
    ratingEnabled?: boolean;
}

export interface Application {
    _id: string;
    bambooId: number;
    jobId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateApplied: string;
    status: string;
    rating?: number;
    resumeText?: string;
    aiSummary?: string;
    aiRating?: number;
}
