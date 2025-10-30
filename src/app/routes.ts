import {
    type RouteConfig,
    index,
    route,
    layout,
} from "@react-router/dev/routes";
import { redirect } from "react-router";

// import { flatRoutes } from "@react-router/fs-routes";

// export default [index("routes/home.tsx")] satisfies RouteConfig;

// export default flatRoutes() satisfies RouteConfig;

export default [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard.redirect.tsx"),
    layout("layouts/main.tsx", [
        route("dashboard/overview", "routes/_index.tsx"),
        route("dashboard/jobs", "routes/jobs._index.tsx"),
        route("dashboard/jobs/:jobId", "routes/jobs.$jobId.tsx"),
        route("dashboard/jobs/:jobId/edit", "routes/jobs.$jobId.edit.tsx"),
        route("dashboard/candidates", "routes/candidates._index.tsx"),
        route("dashboard/candidates/kanban", "routes/candidates.kanban.tsx"),
        route("dashboard/candidates/:id", "routes/candidates.$id.tsx"),
        route("dashboard/assessments", "routes/assessments._index.tsx"),
        route("dashboard/assessments/:jobId", "routes/assessments.$jobId.tsx"),
        route(
            "dashboard/assessments/:jobId/preview",
            "routes/assessments.$jobId.preview.tsx"
        ),
    ]),
] satisfies RouteConfig;
