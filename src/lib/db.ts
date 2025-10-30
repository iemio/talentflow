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
    jobId: string;
    stage: "applied" | "screen" | "tech" | "offer" | "hired" | "rejected";
    appliedAt: Date;
    notes?: string;
}

export interface StatusChange {
    id?: number;
    candidateId: string;
    from: string;
    to: string;
    timestamp: Date;
    note?: string;
}

export interface Assessment {
    id?: number;
    jobId: string;
    sections: AssessmentSection[];
    status: "draft" | "published";
    timeLimit?: number; // in minutes, undefined means no limit
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
}

const db = new Dexie("TalentFlowDB") as Dexie & {
    jobs: EntityTable<Job, "id">;
    candidates: EntityTable<Candidate, "id">;
    statusChanges: EntityTable<StatusChange, "id">;
    assessments: EntityTable<Assessment, "id">;
    assessmentResponses: EntityTable<AssessmentResponse, "id">;
};

db.version(1).stores({
    jobs: "id, status, order, slug, *tags",
    candidates: "id, jobId, stage, name, email",
    statusChanges: "++id, candidateId, timestamp",
    assessments: "++id, jobId, updatedAt",
    assessmentResponses: "++id, candidateId, jobId, submittedAt",
});

export { db };
