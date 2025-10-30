// src/lib/mirage.ts - UPDATED WITH DRAFT/PUBLISHED STATUS
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
                jobId() {
                    return "";
                },
                stage() {
                    return faker.helpers.arrayElement([
                        "applied",
                        "screen",
                        "tech",
                        "offer",
                        "hired",
                        "rejected",
                    ]);
                },
                appliedAt() {
                    return faker.date.past();
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
                        await db.candidates.put({
                            id: candidate.id,
                            name: candidate.name,
                            email: candidate.email,
                            jobId: candidate.jobId,
                            stage: candidate.stage as any,
                            appliedAt: new Date(candidate.appliedAt),
                        });
                    }
                }

                // Create assessments with draft/published status and time limits
                const sampleJobs = jobs.slice(0, 5);
                for (const job of sampleJobs) {
                    const hasTimeLimit = faker.datatype.boolean();
                    await db.assessments.add({
                        jobId: job.id,
                        status: faker.helpers.arrayElement([
                            "draft",
                            "published",
                        ]),
                        timeLimit: hasTimeLimit
                            ? faker.number.int({ min: 15, max: 120 })
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
                                ],
                            },
                        ],
                        updatedAt: new Date(),
                    });
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

            // Jobs endpoints
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

                console.log(
                    `🔄 Reordering job ${jobId} from order ${fromOrder} to order ${toOrder}`
                );

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

                        console.log("✅ Reorder complete");
                    });

                    return { success: true };
                } catch (error) {
                    console.error("❌ Reorder failed:", error);
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

            this.get("/candidates/:id/timeline", async (schema, request) => {
                const id = request.params.id;
                const changes = await db.statusChanges
                    .where("candidateId")
                    .equals(id)
                    .sortBy("timestamp");

                return { data: changes };
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
