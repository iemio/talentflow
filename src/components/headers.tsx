"use client";
import * as React from "react";
import { useMatches, Link, type UIMatch } from "react-router";

// Define the shape of your route handle
interface RouteHandle {
    crumb?: string | ((data: unknown) => string);
}

// Type the match with your handle shape
type RouteMatch = UIMatch<unknown, RouteHandle>;

export const Header = React.memo(() => {
    const matches = useMatches() as RouteMatch[];

    // Build breadcrumb items from route hierarchy
    const crumbs = matches
        .filter(
            (
                m
            ): m is RouteMatch & {
                handle: { crumb: NonNullable<RouteHandle["crumb"]> };
            } => Boolean(m.pathname && m.handle?.crumb)
        )
        .map((m) => ({
            name:
                typeof m.handle.crumb === "function"
                    ? m.handle.crumb(m.data)
                    : m.handle.crumb,
            path: m.pathname,
        }));

    if (crumbs.length === 0) return null;

    return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            {crumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                    <Link
                        to={crumb.path}
                        className="hover:text-foreground transition-colors"
                    >
                        {crumb.name}
                    </Link>
                    {index < crumbs.length - 1 && <span>/</span>}
                </React.Fragment>
            ))}
        </nav>
    );
});

Header.displayName = "Header";
