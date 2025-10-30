import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    CheckCircle2,
    Briefcase,
    Users,
    ClipboardList,
    BarChart3,
    Zap,
    Shield,
    ArrowRight,
    Menu,
    X,
    Star,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function TalentFlowLanding() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const features = [
        {
            icon: <Briefcase className="h-10 w-10" />,
            title: "Smart Job Management",
            description:
                "Create, edit, and organize job postings with drag-and-drop reordering. Archive positions and maintain a clean, organized workflow.",
            color: "bg-primary",
        },
        {
            icon: <Users className="h-10 w-10" />,
            title: "Candidate Pipeline",
            description:
                "Manage 1000+ candidates efficiently with virtualized lists, powerful search, and intuitive kanban boards to track progress.",
            color: "bg-secondary",
        },
        {
            icon: <ClipboardList className="h-10 w-10" />,
            title: "Custom Assessments",
            description:
                "Build job-specific assessments with multiple question types, conditional logic, and validation rules in real-time.",
            color: "bg-accent",
        },
        {
            icon: <BarChart3 className="h-10 w-10" />,
            title: "Analytics Dashboard",
            description:
                "Track candidate progress, view timelines, and gain insights into your hiring funnel with detailed analytics.",
            color: "bg-chart-4",
        },
        {
            icon: <Zap className="h-10 w-10" />,
            title: "Lightning Fast",
            description:
                "Optimistic updates and local-first architecture ensure your team experiences blazing-fast performance.",
            color: "bg-chart-5",
        },
        {
            icon: <Shield className="h-10 w-10" />,
            title: "Reliable & Resilient",
            description:
                "Automatic rollback on failures, offline support, and persistent state ensure your data is always safe.",
            color: "bg-primary",
        },
    ];

    const testimonials = [
        {
            name: "Sarah Chen",
            role: "Head of Talent",
            company: "TechCorp",
            content:
                "TalentFlow transformed our hiring process. We've reduced time-to-hire by 40% and our team loves the intuitive interface.",
            rating: 5,
        },
        {
            name: "Michael Rodriguez",
            role: "HR Manager",
            company: "StartupXYZ",
            content:
                "The assessment builder is a game-changer. We can create custom evaluations for each role in minutes, not hours.",
            rating: 5,
        },
        {
            name: "Emily Watson",
            role: "Recruiter",
            company: "InnovateLabs",
            content:
                "Managing 500+ candidates used to be overwhelming. TalentFlow's kanban board and search make it effortless.",
            rating: 5,
        },
    ];

    const pricingPlans = [
        {
            name: "Starter",
            price: "$49",
            period: "/month",
            description: "Perfect for small teams",
            features: [
                "Up to 5 active jobs",
                "500 candidate profiles",
                "Basic assessments",
                "Email support",
                "7-day data retention",
            ],
            highlighted: false,
        },
        {
            name: "Professional",
            price: "$149",
            period: "/month",
            description: "For growing companies",
            features: [
                "Unlimited jobs",
                "5,000 candidate profiles",
                "Advanced assessments",
                "Priority support",
                "90-day data retention",
                "Custom branding",
                "Analytics dashboard",
            ],
            highlighted: true,
        },
        {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "For large organizations",
            features: [
                "Everything in Professional",
                "Unlimited candidates",
                "Dedicated account manager",
                "24/7 phone support",
                "Custom integrations",
                "SLA guarantee",
                "Advanced security",
            ],
            highlighted: false,
        },
    ];
    const navigate = useNavigate();
    const handleDemoLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        // Use navigate with replace to avoid adding to history
        navigate("/dashboard/overview", { replace: false });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                                <Briefcase className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <span className="text-2xl font-bold text-foreground">
                                TalentFlow
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <a
                                href="#features"
                                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                            >
                                Features
                            </a>
                            <a
                                href="#testimonials"
                                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                            >
                                Testimonials
                            </a>
                            <a
                                href="#pricing"
                                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                            >
                                Pricing
                            </a>
                            <Button
                                variant="outline"
                                onClick={handleDemoLogin}
                                className="rounded-2xl"
                            >
                                Try Demo
                            </Button>
                            <Button
                                onClick={handleDemoLogin}
                                className="rounded-2xl bg-primary hover:bg-primary/90"
                            >
                                Get Started
                            </Button>
                        </div>

                        <button
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>

                    {mobileMenuOpen && (
                        <div className="md:hidden py-6 space-y-4 border-t border-border">
                            <a
                                href="#features"
                                className="block text-muted-foreground hover:text-foreground font-medium"
                            >
                                Features
                            </a>
                            <a
                                href="#testimonials"
                                className="block text-muted-foreground hover:text-foreground font-medium"
                            >
                                Testimonials
                            </a>
                            <a
                                href="#pricing"
                                className="block text-muted-foreground hover:text-foreground font-medium"
                            >
                                Pricing
                            </a>
                            <Button
                                variant="outline"
                                className="w-full rounded-2xl"
                                onClick={handleDemoLogin}
                            >
                                Try Demo
                            </Button>
                            <Button
                                className="w-full rounded-2xl bg-primary hover:bg-primary/90"
                                onClick={handleDemoLogin}
                            >
                                Get Started
                            </Button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-32">
                <div className="text-center">
                    <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-6 py-2 rounded-full text-base">
                        <Sparkles className="h-4 w-4 mr-2 inline" />
                        Now with AI-powered candidate matching
                    </Badge>
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
                        <span className="text-foreground">Hiring Made</span>
                        <br />
                        <span className="text-primary">Simple & Fast</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                        TalentFlow streamlines your entire hiring process.
                        Manage jobs, track candidates, and create custom
                        assessments—all in one beautiful, lightning-fast
                        platform.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button
                            size="lg"
                            className="text-lg px-10 py-7 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl"
                            onClick={handleDemoLogin}
                        >
                            Try Demo Account{" "}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-10 py-7 rounded-2xl"
                        >
                            Watch Demo Video
                        </Button>
                    </div>
                    <p className="mt-6 text-sm text-muted-foreground">
                        No credit card required • Full access to demo
                        environment
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="text-foreground">
                                Everything You Need
                            </span>
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                            From posting jobs to making offers, TalentFlow
                            provides all the toolsyour HR team needs to succeed.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card
                                key={index}
                                className="border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl rounded-3xl overflow-hidden group"
                            >
                                <CardHeader className="pb-4">
                                    <div
                                        className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300`}
                                    >
                                        {feature.icon}
                                    </div>
                                    <CardTitle className="text-2xl font-bold">
                                        {feature.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="text-foreground">
                                Loved by HR Teams
                            </span>
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                            Join hundreds of companies that have transformed
                            their hiring process with TalentFlow.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card
                                key={index}
                                className="border-border rounded-3xl hover:border-primary/50 transition-all duration-300 hover:shadow-2xl"
                            >
                                <CardHeader className="pb-4">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(testimonial.rating)].map(
                                            (_, i) => (
                                                <Star
                                                    key={i}
                                                    className="h-5 w-5 fill-accent text-accent"
                                                />
                                            )
                                        )}
                                    </div>
                                    <CardDescription className="text-base text-foreground/80 leading-relaxed italic">
                                        "{testimonial.content}"
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="font-bold text-lg">
                                        {testimonial.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {testimonial.role} @{" "}
                                        {testimonial.company}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl md:text-6xl font-bold mb-6">
                            <span className="text-foreground">
                                Simple Pricing
                            </span>
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                            Choose the plan that fits your team. Upgrade or
                            downgrade anytime.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {pricingPlans.map((plan, index) => (
                            <Card
                                key={index}
                                className={`border-border rounded-3xl transition-all duration-300 ${
                                    plan.highlighted
                                        ? "ring-2 ring-primary shadow-2xl scale-105 bg-card"
                                        : "hover:shadow-xl"
                                }`}
                            >
                                <CardHeader className="pb-4">
                                    {plan.highlighted && (
                                        <Badge className="w-fit mb-4 bg-primary text-primary-foreground border-0 rounded-full px-4 py-1">
                                            Most Popular
                                        </Badge>
                                    )}
                                    <CardTitle className="text-3xl font-bold">
                                        {plan.name}
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        {plan.description}
                                    </CardDescription>
                                    <div className="mt-6">
                                        <span className="text-5xl font-bold text-primary">
                                            {plan.price}
                                        </span>
                                        <span className="text-muted-foreground text-lg">
                                            {plan.period}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map(
                                            (feature, featureIndex) => (
                                                <li
                                                    key={featureIndex}
                                                    className="flex items-start gap-3"
                                                >
                                                    <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                                                    <span className="text-foreground/90">
                                                        {feature}
                                                    </span>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                    <Button
                                        className={`w-full rounded-2xl py-6 text-base ${
                                            plan.highlighted
                                                ? "bg-primary hover:bg-primary/90"
                                                : "bg-foreground text-background hover:bg-foreground/90"
                                        }`}
                                        onClick={handleDemoLogin}
                                    >
                                        {plan.name === "Enterprise"
                                            ? "Contact Sales"
                                            : "Get Started"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
                    <div className="bg-primary/10 rounded-3xl p-12 md:p-16 border border-primary/20">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            <span className="text-foreground">
                                Ready to Transform Your Hiring?
                            </span>
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            Try TalentFlow today with our fully-featured demo
                            account. No signup required.
                        </p>
                        <Button
                            size="lg"
                            className="text-lg px-10 py-7 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl"
                            onClick={handleDemoLogin}
                        >
                            Launch Demo Account{" "}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center">
                                    <Briefcase className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <span className="text-xl font-bold text-foreground">
                                    TalentFlow
                                </span>
                            </div>
                            <p className="text-muted-foreground">
                                Modern hiring platform for forward-thinking
                                teams.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-bold text-foreground mb-4 text-lg">
                                Product
                            </h3>
                            <ul className="space-y-3 text-muted-foreground">
                                <li>
                                    <a
                                        href="#features"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#pricing"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Pricing
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Roadmap
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Changelog
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-foreground mb-4 text-lg">
                                Company
                            </h3>
                            <ul className="space-y-3 text-muted-foreground">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        About
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Blog
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Careers
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Contact
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-foreground mb-4 text-lg">
                                Legal
                            </h3>
                            <ul className="space-y-3 text-muted-foreground">
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Privacy
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Terms
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Security
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="hover:text-foreground transition-colors"
                                    >
                                        Compliance
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-border pt-8 text-center text-muted-foreground">
                        <p>&copy; 2025 TalentFlow. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
