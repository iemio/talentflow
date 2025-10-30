import { redirect } from "react-router";

export function loader() {
    return redirect("/dashboard/overview");
}

// Optional: You can export a component too, but it won't render due to redirect
export default function DashboardRedirect() {
    return null;
}
