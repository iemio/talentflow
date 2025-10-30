// src/lib/mirage.ts - UPDATED WITH ALL NEW FEATURES
import { createServer, Model, Factory, Response } from "miragejs";
import { db, type Job } from "./db";
import { faker } from "@faker-js/faker";

export function makeServer({ environment = "development" } = {}) {
    return createServer({
        environment,

        models: {
            job: Model,
            candidate: Model,
            assessment: Model,
        },

        factories: {
            job: Factory.extend<Job>({
                id() {
                    return faker.string.uuid();
                },
                title() {
                    return faker.person.jobTitle();
                },
                slug: "",
                status() {
                    return faker.helpers.arrayElement(["active", "archived"]);
                },
                tags() {
                    return faker.helpers.arrayElements(
                        [
                            "remote",
                            "full-time",
                            "senior",
                            "mid-level",
                            "junior",
                        ],
                        2
                    );
                },
                order(i: number) {
                    return i;
                },
                description() {
                    return faker.lorem.paragraph();
                },
                createdAt() {
                    return faker.date.past();
                },
                updatedAt() {
                    return new Date();
                },
                afterCreate(job: any) {
                    job.update({
                        slug: faker.helpers.slugify(job.title).toLowerCase(),
                    });
                },
            } as any),

            candidate: Factory.extend({
                id() {
                    return faker.string.uuid();
                },
                name() {
                    return faker.person.fullName();
                },
                email() {
                    return faker.internet.email();
                },
                phone() {
                    return faker.phone.number();
                },
                jobId() {
                    return "";
                },
                stage() {
                    return faker.helpers.arrayElement([
                        "applied",
                        "screen",
                        "interview",
                        "tech",
                        "offer",
                        "hired",
                        "rejected",
                    ]);
                },
                appliedAt() {
                    return faker.date.past();
                },
                resumeUrl() {
                    // All candidates use the same resume URL
                    return "https://drive.google.com/file/d/1Lh-Aw3ZeFVPQxNMPLtWWAougB3eDxJvy/view?usp=sharing";
                },
            }),
        },

        seeds: async (server) => {
            const existingJobs = await db.jobs.toArray();

            if (existingJobs.length === 0) {
                const jobs = server.createList("job", 25);

                for (let i = 0; i < jobs.length; i++) {
                    const job = jobs[i];
                    await db.jobs.put({
                        id: job.id,
                        title: job.title,
                        slug: job.slug,
                        status: job.status as "active" | "archived",
                        tags: job.tags,
                        order: i,
                        description: job.description,
                        createdAt: new Date(job.createdAt),
                        updatedAt: new Date(job.updatedAt),
                    });
                }

                for (const job of jobs) {
                    const candidateCount = faker.number.int({
                        min: 30,
                        max: 50,
                    });
                    const candidates = server.createList(
                        "candidate",
                        candidateCount,
                        {
                            jobId: job.id,
                        }
                    );

                    for (const candidate of candidates) {
                        const candidateId = candidate.id;
                        const stage = candidate.stage;

                        await db.candidates.put({
                            id: candidateId,
                            name: candidate.name,
                            email: candidate.email,
                            phone: candidate.phone,
                            jobId: candidate.jobId,
                            stage: stage as any,
                            appliedAt: new Date(candidate.appliedAt),
                            resumeUrl: candidate.resumeUrl,
                        });

                        // Logical seeding based on stage progression
                        const stageProgression = [
                            "applied",
                            "screen",
                            "interview",
                            "tech",
                            "offer",
                            "hired",
                            "rejected",
                        ];
                        const currentStageIndex =
                            stageProgression.indexOf(stage);

                        // Add notes for candidates who have progressed (screen and beyond)
                        if (currentStageIndex >= 1) {
                            const noteCount = faker.number.int({
                                min: 1,
                                max: 3,
                            });
                            for (let i = 0; i < noteCount; i++) {
                                await db.notes.add({
                                    candidateId,
                                    content: faker.helpers.arrayElement([
                                        "Strong technical background, good fit for the role.",
                                        "Impressive communication skills during initial screening.",
                                        "Has relevant experience with our tech stack.",
                                        "Culture fit looks promising, team would like them.",
                                        "Salary expectations align with our budget.",
                                        "References checked out well. cc @Sarah",
                                        "Follow up needed on availability. @Mike please check",
                                    ]),
                                    mentions: faker.datatype.boolean()
                                        ? [faker.person.firstName()]
                                        : [],
                                    createdAt: faker.date.recent({ days: 20 }),
                                    createdBy: faker.person.fullName(),
                                });
                            }
                        }

                        // Add interviews for candidates in interview stage or beyond (but not rejected)
                        if (currentStageIndex >= 2 && stage !== "rejected") {
                            const interviewCount = Math.min(
                                currentStageIndex - 1,
                                3
                            );

                            for (let i = 0; i < interviewCount; i++) {
                                const interviewTypes = [
                                    "phone",
                                    "video",
                                    "technical",
                                    "behavioral",
                                    "onsite",
                                ];
                                const interviewType =
                                    interviewTypes[
                                        Math.min(i, interviewTypes.length - 1)
                                    ];

                                const isPastInterview =
                                    i < interviewCount - 1 ||
                                    currentStageIndex > 2;

                                await db.interviews.add({
                                    candidateId,
                                    type: interviewType as any,
                                    title: faker.helpers.arrayElement([
                                        "Initial Screening",
                                        "Technical Round " + (i + 1),
                                        "Behavioral Interview",
                                        "System Design Discussion",
                                        "Final Interview with CTO",
                                    ]),
                                    interviewers: faker.helpers.arrayElements(
                                        [
                                            "John Smith",
                                            "Sarah Johnson",
                                            "Mike Chen",
                                            "Emily Davis",
                                            "Alex Kumar",
                                        ],
                                        faker.number.int({ min: 1, max: 3 })
                                    ),
                                    date: isPastInterview
                                        ? faker.date.recent({ days: 30 })
                                        : faker.date.soon({ days: 14 }),
                                    duration: faker.helpers.arrayElement([
                                        30, 45, 60, 90,
                                    ]),
                                    notes: isPastInterview
                                        ? faker.helpers.arrayElement([
                                              "Candidate demonstrated strong problem-solving skills",
                                              "Good cultural fit, team rapport was excellent",
                                              "Technical knowledge is solid, some areas need work",
                                              "Communication skills are outstanding",
                                              "Would recommend moving forward",
                                          ])
                                        : faker.datatype.boolean()
                                        ? "Please prepare coding questions on data structures"
                                        : undefined,
                                    status: isPastInterview
                                        ? "completed"
                                        : "scheduled",
                                    createdAt: faker.date.recent({ days: 35 }),
                                });
                            }
                        }
                    }
                }

                // Create assessments with responses
                const sampleJobs = jobs.slice(0, 8);
                for (const job of sampleJobs) {
                    const hasTimeLimit = faker.datatype.boolean();
                    await db.assessments.add({
                        jobId: job.id,
                        status: "published",
                        timeLimit: hasTimeLimit
                            ? faker.number.int({ min: 30, max: 120 })
                            : undefined,
                        sections: [
                            {
                                id: faker.string.uuid(),
                                title: "Technical Skills",
                                questions: [
                                    {
                                        id: faker.string.uuid(),
                                        type: "single",
                                        text: "What is your primary programming language?",
                                        required: true,
                                        options: [
                                            "JavaScript",
                                            "Python",
                                            "Java",
                                            "C++",
                                            "Other",
                                        ],
                                    },
                                    {
                                        id: faker.string.uuid(),
                                        type: "multi",
                                        text: "Which frameworks have you worked with?",
                                        required: true,
                                        options: [
                                            "React",
                                            "Vue",
                                            "Angular",
                                            "Svelte",
                                            "Next.js",
                                        ],
                                    },
                                    {
                                        id: faker.string.uuid(),
                                        type: "text",
                                        text: "Describe your experience with databases",
                                        required: true,
                                    },
                                ],
                            },
                            {
                                id: faker.string.uuid(),
                                title: "Problem Solving",
                                questions: [
                                    {
                                        id: faker.string.uuid(),
                                        type: "longtext",
                                        text: "Describe a challenging problem you solved recently",
                                        required: true,
                                        maxLength: 1000,
                                    },
                                ],
                            },
                        ],
                        updatedAt: new Date(),
                    });

                    // Add assessment responses for candidates who reached tech stage or beyond
                    const jobCandidates = await db.candidates
                        .where("jobId")
                        .equals(job.id)
                        .toArray();

                    for (const candidate of jobCandidates) {
                        const stageProgression = [
                            "applied",
                            "screen",
                            "interview",
                            "tech",
                            "offer",
                            "hired",
                            "rejected",
                        ];
                        const currentStageIndex = stageProgression.indexOf(
                            candidate.stage
                        );

                        // Only candidates who reached tech stage or beyond have assessment responses
                        // (excluding rejected at earlier stages)
                        if (
                            currentStageIndex >= 3 ||
                            (candidate.stage === "rejected" &&
                                currentStageIndex >= 2)
                        ) {
                            const timeLimit = hasTimeLimit
                                ? faker.number.int({ min: 30, max: 120 })
                                : 90;
                            const completionTime = faker.number.int({
                                min: Math.floor(timeLimit * 0.4),
                                max: Math.floor(timeLimit * 0.95),
                            });

                            // Better candidates (offer, hired) get higher scores
                            let score;
                            if (["offer", "hired"].includes(candidate.stage)) {
                                score = faker.number.int({ min: 75, max: 98 });
                            } else if (candidate.stage === "tech") {
                                score = faker.number.int({ min: 65, max: 85 });
                            } else if (candidate.stage === "rejected") {
                                score = faker.number.int({ min: 40, max: 70 });
                            } else {
                                score = faker.number.int({ min: 60, max: 90 });
                            }

                            await db.assessmentResponses.add({
                                candidateId: candidate.id,
                                jobId: job.id,
                                responses: {
                                    q1: faker.helpers.arrayElement([
                                        "JavaScript",
                                        "Python",
                                        "Java",
                                    ]),
                                    q2: faker.helpers.arrayElements(
                                        ["React", "Vue", "Angular", "Next.js"],
                                        2
                                    ),
                                    q3: "Extensive experience with PostgreSQL and MongoDB...",
                                    q4: "Recently optimized a database query that reduced load time by 60%...",
                                },
                                submittedAt: faker.date.recent({ days: 25 }),
                                completionTime,
                                score,
                            });
                        }
                    }
                }
            } else {
                console.log("🟢 Mirage: existing data found, skipping reseed");
            }
        },

        routes() {
            this.namespace = "api";

            this.passthrough("/__manifest");
            this.passthrough((request) => {
                return (
                    request.url.includes("/@") ||
                    request.url.includes("/__") ||
                    request.url.includes("/node_modules") ||
                    request.url.includes(".js") ||
                    request.url.includes(".css") ||
                    request.url.includes(".svg") ||
                    request.url.includes(".png")
                );
            });

            this.timing = faker.number.int({ min: 200, max: 1200 });

            // Jobs endpoints (keeping existing)
            this.get("/jobs", async (schema, request) => {
                const {
                    search,
                    status,
                    page = "1",
                    pageSize = "10",
                    sort,
                } = request.queryParams;

                if (Math.random() < 0.05) {
                    return new Response(
                        500,
                        {},
                        { error: "Internal Server Error" }
                    );
                }

                let query = db.jobs.toCollection();

                if (status && status !== "all") {
                    query = db.jobs.where("status").equals(status);
                }

                let jobs = await query.toArray();

                if (search) {
                    jobs = jobs.filter((job) =>
                        job.title
                            .toLowerCase()
                            .includes((search as string).toLowerCase())
                    );
                }

                jobs.sort((a, b) => a.order - b.order);

                const total = jobs.length;
                const pageNum = parseInt(page as string);
                const pageSizeNum = parseInt(pageSize as string);
                const start = (pageNum - 1) * pageSizeNum;
                const paginatedJobs = jobs.slice(start, start + pageSizeNum);

                return {
                    data: paginatedJobs,
                    meta: {
                        total,
                        page: pageNum,
                        pageSize: pageSizeNum,
                        totalPages: Math.ceil(total / pageSizeNum),
                    },
                };
            });

            this.post("/jobs", async (schema, request) => {
                const attrs = JSON.parse(request.requestBody);
                const job = {
                    ...attrs,
                    id: faker.string.uuid(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                await db.jobs.add(job);
                return job;
            });

            this.patch("/jobs/:id", async (schema, request) => {
                const id = request.params.id;
                const attrs = JSON.parse(request.requestBody);

                await db.jobs.update(id, { ...attrs, updatedAt: new Date() });
                return db.jobs.get(id);
            });

            this.patch("/jobs/:id/reorder", async (schema, request) => {
                if (Math.random() < 0.1) {
                    return new Response(500, {}, { error: "Reorder failed" });
                }

                const jobId = request.params.id;
                const { fromOrder, toOrder } = JSON.parse(request.requestBody);

                try {
                    await db.transaction("rw", db.jobs, async () => {
                        const allJobs = await db.jobs
                            .orderBy("order")
                            .toArray();

                        const fromIndex = allJobs.findIndex(
                            (j) => j.order === fromOrder
                        );
                        const toIndex = allJobs.findIndex(
                            (j) => j.order === toOrder
                        );

                        if (fromIndex === -1 || toIndex === -1) {
                            throw new Error("Invalid order values");
                        }

                        const reorderedJobs = [...allJobs];
                        const [movedJob] = reorderedJobs.splice(fromIndex, 1);
                        reorderedJobs.splice(toIndex, 0, movedJob);

                        for (let i = 0; i < reorderedJobs.length; i++) {
                            await db.jobs.update(reorderedJobs[i].id, {
                                order: i,
                                updatedAt: new Date(),
                            });
                        }
                    });

                    return { success: true };
                } catch (error) {
                    return new Response(500, {}, { error: "Reorder failed" });
                }
            });

            // Candidates endpoints
            this.get("/candidates", async (schema, request) => {
                const {
                    search,
                    stage,
                    page = "1",
                    pageSize = "20",
                } = request.queryParams;

                let query = db.candidates.toCollection();

                if (stage && stage !== "all") {
                    query = db.candidates.where("stage").equals(stage);
                }

                let candidates = await query.toArray();

                if (search) {
                    const searchLower = (search as string).toLowerCase();
                    candidates = candidates.filter(
                        (c) =>
                            c.name.toLowerCase().includes(searchLower) ||
                            c.email.toLowerCase().includes(searchLower)
                    );
                }

                const total = candidates.length;
                const pageNum = parseInt(page as string);
                const pageSizeNum = parseInt(pageSize as string);
                const start = (pageNum - 1) * pageSizeNum;
                const paginatedCandidates = candidates.slice(
                    start,
                    start + pageSizeNum
                );

                return {
                    data: paginatedCandidates,
                    meta: { total, page: pageNum, pageSize: pageSizeNum },
                };
            });

            this.patch("/candidates/:id", async (schema, request) => {
                const id = request.params.id;
                const attrs = JSON.parse(request.requestBody);

                const candidate = await db.candidates.get(id);
                if (
                    candidate &&
                    attrs.stage &&
                    attrs.stage !== candidate.stage
                ) {
                    await db.statusChanges.add({
                        candidateId: id,
                        from: candidate.stage,
                        to: attrs.stage,
                        timestamp: new Date(),
                    });
                }

                await db.candidates.update(id, attrs);
                return db.candidates.get(id);
            });

            // Notes endpoints
            this.get("/candidates/:id/notes", async (schema, request) => {
                const notes = await db.notes
                    .where("candidateId")
                    .equals(request.params.id)
                    .reverse()
                    .sortBy("createdAt");

                return { data: notes };
            });

            this.post("/candidates/:id/notes", async (schema, request) => {
                const data = JSON.parse(request.requestBody);
                const noteId = await db.notes.add({
                    candidateId: request.params.id,
                    content: data.content,
                    mentions: data.mentions || [],
                    createdAt: new Date(),
                    createdBy: "Current User", // In real app, get from auth
                });

                return db.notes.get(noteId);
            });

            // Interviews endpoints
            this.get("/candidates/:id/interviews", async (schema, request) => {
                const interviews = await db.interviews
                    .where("candidateId")
                    .equals(request.params.id)
                    .sortBy("date");

                return { data: interviews };
            });

            this.post("/candidates/:id/interviews", async (schema, request) => {
                const data = JSON.parse(request.requestBody);
                const interviewId = await db.interviews.add({
                    candidateId: request.params.id,
                    ...data,
                    createdAt: new Date(),
                });

                return db.interviews.get(interviewId);
            });

            this.patch("/interviews/:id", async (schema, request) => {
                const id = parseInt(request.params.id);
                const attrs = JSON.parse(request.requestBody);

                await db.interviews.update(id, attrs);
                return db.interviews.get(id);
            });

            this.delete("/interviews/:id", async (schema, request) => {
                const id = parseInt(request.params.id);
                await db.interviews.delete(id);
                return { success: true };
            });

            // Assessment endpoints
            this.get("/assessments/:jobId", async (schema, request) => {
                const assessment = await db.assessments
                    .where("jobId")
                    .equals(request.params.jobId)
                    .first();

                return assessment || null;
            });

            this.put("/assessments/:jobId", async (schema, request) => {
                const jobId = request.params.jobId;
                const data = JSON.parse(request.requestBody);

                const existing = await db.assessments
                    .where("jobId")
                    .equals(jobId)
                    .first();

                if (existing && existing.id) {
                    await db.assessments.update(existing.id, {
                        ...data,
                        updatedAt: new Date(),
                    });
                } else {
                    await db.assessments.add({
                        jobId,
                        ...data,
                        updatedAt: new Date(),
                    });
                }

                return { success: true };
            });

            this.post("/assessments/:jobId/submit", async (schema, request) => {
                const jobId = request.params.jobId;
                const data = JSON.parse(request.requestBody);

                await db.assessmentResponses.add({
                    ...data,
                    jobId,
                    submittedAt: new Date(),
                });

                return { success: true };
            });
        },
    });
}
