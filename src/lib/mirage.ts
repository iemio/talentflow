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
                        ["remote", "full-time", "senior", "mid-level"],
                        2
                    );
                },
                order(i: number) {
                    return i;
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
                }, // Set manually
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
            Promise.all(
                jobs.map((job) =>
                    db.jobs.put({
                        ...job.attrs,
                        createdAt: new Date(job.attrs.createdAt),
                        updatedAt: new Date(job.attrs.updatedAt),
                    })
                )
            );

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
                Promise.all(
                    candidates.map((candidate) =>
                        db.candidates.put({
                            ...candidate.attrs,
                            appliedAt: new Date(candidate.attrs.appliedAt),
                        })
                    )
                );
            });
        },

        routes() {
            this.namespace = "api";
            this.timing = faker.number.int({ min: 200, max: 1200 });

            // Jobs endpoints
            this.get("/jobs", async (schema, request) => {
                const {
                    searchParam,
                    status,
                    pageParam = "1",
                    pageSizeParam = "10",
                    sort,
                } = request.queryParams;

                let search: string | undefined;

                if (searchParam && Array.isArray(searchParam)) {
                    search = searchParam[0]; // take first value if multiple
                } else if (searchParam) {
                    search = searchParam;
                }

                const page = Array.isArray(pageParam)
                    ? parseInt(pageParam[0])
                    : parseInt(pageParam || "1");
                const pageSize = Array.isArray(pageSizeParam)
                    ? parseInt(pageSizeParam[0])
                    : parseInt(pageSizeParam || "10");

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

                if (search) {
                    jobs = jobs.filter((job) =>
                        job.title.toLowerCase().includes(search.toLowerCase())
                    );
                }

                if (sort === "order") {
                    jobs.sort((a, b) => a.order - b.order);
                }

                const total = jobs.length;
                const start = (page - 1) * pageSize;
                const paginatedJobs = jobs.slice(start, start + pageSize);

                return {
                    data: paginatedJobs,
                    meta: {
                        total,
                        page: page,
                        pageSize: pageSize,
                        totalPages: Math.ceil(total / pageSize),
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
                    searchParam,
                    stage,
                    pageParam = "1",
                    pageSizeParam = "20",
                } = request.queryParams;

                let search: string | undefined;

                if (searchParam && Array.isArray(searchParam)) {
                    search = searchParam[0]; // take first value if multiple
                } else if (searchParam) {
                    search = searchParam;
                }

                const page = Array.isArray(pageParam)
                    ? parseInt(pageParam[0])
                    : parseInt(pageParam || "1");
                const pageSize = Array.isArray(pageSizeParam)
                    ? parseInt(pageSizeParam[0])
                    : parseInt(pageSizeParam || "10");

                let query = db.candidates.toCollection();

                if (stage && stage !== "all") {
                    query = db.candidates.where("stage").equals(stage);
                }

                let candidates = await query.toArray();

                if (search) {
                    const searchLower = search.toLowerCase();
                    candidates = candidates.filter(
                        (c) =>
                            c.name.toLowerCase().includes(searchLower) ||
                            c.email.toLowerCase().includes(searchLower)
                    );
                }

                const total = candidates.length;
                const start = (page - 1) * pageSize;
                const paginatedCandidates = candidates.slice(
                    start,
                    start + pageSize
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

            this.post("/candidates", async (schema, request) => {
                const attrs = JSON.parse(request.requestBody);

                // Basic validation
                const allowedStages = [
                    "applied",
                    "screen",
                    "tech",
                    "offer",
                    "hired",
                    "rejected",
                ];
                if (!attrs.name || !attrs.email) {
                    return new Response(
                        400,
                        {},
                        { error: "Name and email are required." }
                    );
                }
                if (attrs.stage && !allowedStages.includes(attrs.stage)) {
                    return new Response(
                        400,
                        {},
                        { error: "Invalid stage value." }
                    );
                }

                // Create candidate object
                const candidate = {
                    id: faker.string.uuid(),
                    name: attrs.name,
                    email: attrs.email,
                    stage: attrs.stage || "applied",
                    jobId: attrs.jobId || "",
                    appliedAt: new Date(),
                };

                // Save to IndexedDB
                await db.candidates.add(candidate);

                return candidate;
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

                if (existing) {
                    await db.assessments.update(existing.id!, {
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
