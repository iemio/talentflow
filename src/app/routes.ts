import {
    type RouteConfig,
    index,
    route,
    layout,
} from "@react-router/dev/routes";

// import { flatRoutes } from "@react-router/fs-routes";

// export default [index("routes/home.tsx")] satisfies RouteConfig;

// export default flatRoutes() satisfies RouteConfig;

export default [
    index("routes/home.tsx"),
    layout("layouts/main.tsx", [
        route("dashboard", "routes/_index.tsx"),
        route("jobs", "routes/jobs._index.tsx"),
        route("jobs/:jobId", "routes/jobs.$jobId.tsx"),
        route("jobs/:jobId/edit", "routes/jobs.$jobId.edit.tsx"),
        route("candidates", "routes/candidates._index.tsx"),
        route("candidates/kanban", "routes/candidates.kanban.tsx"),
        route("candidates/:id", "routes/candidates.$id.tsx"),
        route("assessments", "routes/assessments._index.tsx"),
        route("assessments/:jobId", "routes/assessments.$jobId.tsx"),
        route(
            "assessments/:jobId/preview",
            "routes/assessments.$jobId.preview.tsx"
        ),
    ]),
] satisfies RouteConfig;
