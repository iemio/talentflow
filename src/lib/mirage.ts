// src/lib/mirage.ts
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
                    // safely generate slug from title after creation
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

        seeds(server) {
            // Create 25 jobs
            const jobs = server.createList("job", 25);

            // Sync to IndexedDB
            jobs.forEach((job) => {
                db.jobs.put({
                    id: job.id,
                    title: job.title,
                    slug: job.slug,
                    status: job.status as "active" | "archived",
                    tags: job.tags,
                    order: job.order,
                    description: job.description,
                    createdAt: new Date(job.createdAt),
                    updatedAt: new Date(job.updatedAt),
                });
            });

            // Create 1000 candidates
            jobs.forEach((job) => {
                const candidateCount = faker.number.int({ min: 30, max: 50 });
                const candidates = server.createList(
                    "candidate",
                    candidateCount,
                    {
                        jobId: job.id,
                    }
                );

                // Sync to IndexedDB
                candidates.forEach((candidate) => {
                    db.candidates.put({
                        id: candidate.id,
                        name: candidate.name,
                        email: candidate.email,
                        jobId: candidate.jobId,
                        stage: candidate.stage as any,
                        appliedAt: new Date(candidate.appliedAt),
                    });
                });
            });

            // Create 3 sample assessments
            const sampleJobs = jobs.slice(0, 3);
            sampleJobs.forEach((job, idx) => {
                db.assessments.add({
                    jobId: job.id,
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
                                    type: "number",
                                    text: "Years of professional experience?",
                                    required: true,
                                    minValue: 0,
                                    maxValue: 50,
                                },
                            ],
                        },
                        {
                            id: faker.string.uuid(),
                            title: "Personal Information",
                            questions: [
                                {
                                    id: faker.string.uuid(),
                                    type: "text",
                                    text: "Where are you based?",
                                    required: true,
                                    maxLength: 100,
                                },
                                {
                                    id: faker.string.uuid(),
                                    type: "longtext",
                                    text: "Tell us about yourself",
                                    required: false,
                                    maxLength: 500,
                                },
                            ],
                        },
                    ],
                    updatedAt: new Date(),
                });
            });
        },

        routes() {
            this.namespace = "api";

            // IMPORTANT: Pass through requests that shouldn't be intercepted
            this.passthrough("/__manifest");
            this.passthrough((request) => {
                // Pass through Vite HMR and dev server requests
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

                let searchParam: string | undefined;

                if (search && Array.isArray(search)) {
                    searchParam = search[0]; // take first value if multiple
                } else if (search) {
                    searchParam = search;
                }

                const pageParam = Array.isArray(page)
                    ? parseInt(page[0])
                    : parseInt(page || "1");
                const pageSizeParam = Array.isArray(pageSize)
                    ? parseInt(pageSize[0])
                    : parseInt(pageSize || "10");

                // Simulate 5-10% error rate
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

                if (searchParam) {
                    jobs = jobs.filter((job) =>
                        job.title
                            .toLowerCase()
                            .includes(searchParam.toLowerCase())
                    );
                }

                if (sort === "order") {
                    jobs.sort((a, b) => a.order - b.order);
                }

                const total = jobs.length;
                const start = (pageParam - 1) * pageSizeParam;
                const paginatedJobs = jobs.slice(start, start + pageSizeParam);

                return {
                    data: paginatedJobs,
                    meta: {
                        total,
                        page: page,
                        pageSize: pageSize,
                        totalPages: Math.ceil(total / pageSizeParam),
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
                // Simulate occasional failures for rollback testing
                if (Math.random() < 0.1) {
                    return new Response(500, {}, { error: "Reorder failed" });
                }

                const { fromOrder, toOrder } = JSON.parse(request.requestBody);
                const jobs = await db.jobs.orderBy("order").toArray();

                const jobToMove = jobs.find((j) => j.order === fromOrder);
                if (!jobToMove)
                    return new Response(404, {}, { error: "Job not found" });

                // Reorder logic
                await db.transaction("rw", db.jobs, async () => {
                    if (fromOrder < toOrder) {
                        await Promise.all(
                            jobs
                                .filter(
                                    (j) =>
                                        j.order > fromOrder &&
                                        j.order <= toOrder
                                )
                                .map((j) =>
                                    db.jobs.update(j.id, { order: j.order - 1 })
                                )
                        );
                    } else {
                        await Promise.all(
                            jobs
                                .filter(
                                    (j) =>
                                        j.order >= toOrder &&
                                        j.order < fromOrder
                                )
                                .map((j) =>
                                    db.jobs.update(j.id, { order: j.order + 1 })
                                )
                        );
                    }
                    await db.jobs.update(jobToMove.id, { order: toOrder });
                });

                return { success: true };
            });

            // Candidates endpoints
            this.get("/candidates", async (schema, request) => {
                const {
                    search,
                    stage,
                    page = "1",
                    pageSize = "20",
                } = request.queryParams;

                let searchParam: string | undefined;

                if (search && Array.isArray(search)) {
                    searchParam = search[0]; // take first value if multiple
                } else if (search) {
                    searchParam = search;
                }

                const pageParam = Array.isArray(page)
                    ? parseInt(page[0])
                    : parseInt(page || "1");
                const pageSizeParam = Array.isArray(pageSize)
                    ? parseInt(pageSize[0])
                    : parseInt(pageSize || "10");

                let query = db.candidates.toCollection();

                if (stage && stage !== "all") {
                    query = db.candidates.where("stage").equals(stage);
                }

                let candidates = await query.toArray();

                if (searchParam) {
                    const searchLower = searchParam.toLowerCase();
                    candidates = candidates.filter(
                        (c) =>
                            c.name.toLowerCase().includes(searchLower) ||
                            c.email.toLowerCase().includes(searchLower)
                    );
                }

                const total = candidates.length;
                const start = (pageParam - 1) * pageSizeParam;
                const paginatedCandidates = candidates.slice(
                    start,
                    start + pageSizeParam
                );

                return {
                    data: paginatedCandidates,
                    meta: {
                        total,
                        page: page,
                        pageSize: pageSize,
                    },
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
                    // Record status change
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
