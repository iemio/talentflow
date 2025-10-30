import Dexie, { type EntityTable } from "dexie";

export interface Job {
    id: string;
    title: string;
    slug: string;
    status: "active" | "archived";
    tags: string[];
    order: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Candidate {
    id: string;
    name: string;
    email: string;
    phone: string;
    jobId: string;
    stage:
        | "applied"
        | "screen"
        | "interview"
        | "tech"
        | "offer"
        | "hired"
        | "rejected";
    appliedAt: Date;
    resumeUrl: string;
}

export interface StatusChange {
    id?: number;
    candidateId: string;
    from: string;
    to: string;
    timestamp: Date;
    note?: string;
}

export interface Note {
    id?: number;
    candidateId: string;
    content: string;
    mentions: string[]; // Array of mentioned user names/ids
    createdAt: Date;
    createdBy: string; // User who created the note
}

export interface Interview {
    id?: number;
    candidateId: string;
    type: "phone" | "video" | "onsite" | "technical" | "behavioral";
    title: string;
    interviewers: string[];
    date: Date;
    duration: number; // in minutes
    notes?: string;
    status: "scheduled" | "completed" | "cancelled";
    createdAt: Date;
}

export interface Assessment {
    id?: number;
    jobId: string;
    sections: AssessmentSection[];
    status: "draft" | "published";
    timeLimit?: number;
    updatedAt: Date;
}

export interface AssessmentSection {
    id: string;
    title: string;
    questions: Question[];
}

export interface Question {
    id: string;
    type: "single" | "multi" | "text" | "longtext" | "number" | "file";
    text: string;
    required: boolean;
    options?: string[];
    minValue?: number;
    maxValue?: number;
    maxLength?: number;
    conditionalOn?: { questionId: string; value: string };
}

export interface AssessmentResponse {
    id?: number;
    candidateId: string;
    jobId: string;
    responses: Record<string, any>;
    submittedAt: Date;
    completionTime?: number; // in minutes
    score?: number; // percentage score
}

const db = new Dexie("TalentFlowDB") as Dexie & {
    jobs: EntityTable<Job, "id">;
    candidates: EntityTable<Candidate, "id">;
    statusChanges: EntityTable<StatusChange, "id">;
    notes: EntityTable<Note, "id">;
    interviews: EntityTable<Interview, "id">;
    assessments: EntityTable<Assessment, "id">;
    assessmentResponses: EntityTable<AssessmentResponse, "id">;
};

db.version(2).stores({
    jobs: "id, status, order, slug, *tags",
    candidates: "id, jobId, stage, name, email, phone",
    statusChanges: "++id, candidateId, timestamp",
    notes: "++id, candidateId, createdAt",
    interviews: "++id, candidateId, date, status",
    assessments: "++id, jobId, updatedAt",
    assessmentResponses: "++id, candidateId, jobId, submittedAt",
});

export { db };
