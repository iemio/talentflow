import Dexie, { type EntityTable } from "dexie";

export interface Job {
    id: string;
    title: string;
    slug: string;
    status: "active" | "archived";
    tags?: string[];
    order: number;
    description?: string;

    // Location & Work Type
    location?: string;
    locationType?: "onsite" | "hybrid" | "remote";
    department?: string;
    employmentType?:
        | "full-time"
        | "part-time"
        | "contract"
        | "temporary"
        | "internship";

    // Requirements & Qualifications
    requirements?: {
        required: string[]; // Must-have qualifications
        preferred: string[]; // Nice-to-have qualifications
        education?: string; // e.g., "Bachelor's degree in Computer Science"
        experience?: string; // e.g., "5+ years of experience"
        certifications?: string[];
        skills?: {
            technical: string[];
            soft: string[];
        };
    };

    // Compensation Package
    compensation?: {
        salaryMin?: number; // Required in many states
        salaryMax?: number; // Required in many states
        currency?: string;
        payPeriod?: "hourly" | "annual";
        bonusStructure?: string; // e.g., "Performance-based bonus up to 20%"
        equity?: string; // e.g., "Stock options available"
        commission?: string; // e.g., "Commission range: 10-15%"
    };

    // Benefits & Other Compensation
    benefits?: {
        health?: string[]; // e.g., ["Medical", "Dental", "Vision"]
        retirement?: string; // e.g., "401(k) with 5% match"
        pto?: string; // e.g., "20 days PTO + 10 holidays"
        other?: string[]; // e.g., ["Remote work stipend", "Professional development"]
    };

    // Application Sources (where candidates come from)
    applicationSources?: {
        enabled: string[]; // e.g., ["linkedin", "indeed", "company-website", "referral"]
        customSources?: string[]; // Custom source names
    };

    // Performance Metrics & KPIs
    metrics?: {
        targetHires?: number;
        timeToFillTarget?: number; // in days
        qualityOfHireScore?: number; // 0-100
        offerAcceptanceRate?: number; // percentage
        costPerHire?: number;
        sourceEffectiveness?: Record<string, number>; // source name -> conversion rate
    };

    // Hiring Process
    hiringProcess?: {
        stages?: string[]; // Custom stages for this job
        hiringManager?: string;
        recruiter?: string;
        interviewers?: string[];
        targetStartDate?: Date;
        positionsAvailable?: number;
    };

    // Legal & Compliance
    legal?: {
        eeocStatement?: string;
        visaSponsorshipAvailable?: boolean;
        securityClearanceRequired?: boolean;
        backgroundCheckRequired?: boolean;
        drugTestRequired?: boolean;
    };

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

    // Enhanced candidate fields
    source?: string; // Where they came from
    location?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    currentCompany?: string;
    currentTitle?: string;
    yearsOfExperience?: number;
    expectedSalary?: number;
    noticePeriod?: string;
    visaStatus?: string;
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
    mentions: string[];
    createdAt: Date;
    createdBy: string;
}

export interface Interview {
    id?: number;
    candidateId: string;
    type: "phone" | "video" | "onsite" | "technical" | "behavioral";
    title: string;
    interviewers: string[];
    date: Date;
    duration: number;
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
    completionTime?: number;
    score?: number;
}

// New: Analytics for tracking job performance
export interface JobAnalytics {
    id?: number;
    jobId: string;
    date: Date;
    totalApplications: number;
    applicationsBySource: Record<string, number>;
    viewCount: number;
    conversionRate: number;
    averageTimeToFill?: number;
    updatedAt: Date;
}

const db = new Dexie("TalentFlowDB") as Dexie & {
    jobs: EntityTable<Job, "id">;
    candidates: EntityTable<Candidate, "id">;
    statusChanges: EntityTable<StatusChange, "id">;
    notes: EntityTable<Note, "id">;
    interviews: EntityTable<Interview, "id">;
    assessments: EntityTable<Assessment, "id">;
    assessmentResponses: EntityTable<AssessmentResponse, "id">;
    jobAnalytics: EntityTable<JobAnalytics, "id">;
};

db.version(3).stores({
    jobs: "id, status, order, slug, *tags, department, employmentType, locationType",
    candidates: "id, jobId, stage, name, email, phone, source, appliedAt",
    statusChanges: "++id, candidateId, timestamp",
    notes: "++id, candidateId, createdAt",
    interviews: "++id, candidateId, date, status",
    assessments: "++id, jobId, updatedAt",
    assessmentResponses: "++id, candidateId, jobId, submittedAt",
    jobAnalytics: "++id, jobId, date",
});

export { db };
