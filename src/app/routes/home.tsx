import type { Route } from "./+types/home";
import JobsTest from "@/components/welcome/welcome";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Talentflow" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

export default function Home() {
    return <JobsTest />;
}
