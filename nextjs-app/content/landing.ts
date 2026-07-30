/**
 * Microservice Starter Kit — Community Edition landing content.
 * Edit this file (or set LANDING_* env vars) to rebrand without rewriting the UI.
 */

export type LandingPillar = {
  title: string;
  description: string;
};

export type LandingModule = {
  name: string;
  blurb: string;
};

export type LandingStep = {
  label: string;
  title: string;
  description: string;
};

export type LandingPlan = {
  code: string;
  name: string;
  priceLabel: string;
  priceNote: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
};

export type LandingContent = {
  brandName: string;
  brandMark: string;
  tagline: string;
  headline: string;
  lede: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  pillars: LandingPillar[];
  modules: LandingModule[];
  plans: LandingPlan[];
  steps: LandingStep[];
  closingTitle: string;
  closingLede: string;
  footerNote: string;
  company: string;
};

export const defaultLanding: LandingContent = {
  brandName: "Starter Kit",
  brandMark: "M",
  tagline: "Microservice Starter Kit · Community Edition",
  headline: "Learn, demo, and ship a full stack with gateway, SSO, and checkout",
  lede:
    "API Gateway, Keycloak identity, catalog, orders, notifications, Stripe payments, and an Angular admin console — wired together with Docker Compose for a great local developer experience.",
  primaryCta: { label: "Sign in", href: "/products" },
  secondaryCta: { label: "Sign in", href: "/products" },
  pillars: [
    {
      title: "API Gateway in front",
      description:
        "One public edge for catalog, orders, and notifications — JWT admission, CORS, and rate limits already in place.",
    },
    {
      title: "Keycloak SSO & roles",
      description:
        "Lattice-styled login, forgot password, and customer vs manager roles so the storefront and Admin Console share one identity story.",
    },
    {
      title: "Event-driven orders",
      description:
        "Place an order, publish to RabbitMQ, and watch the notification service record delivery — with optional real SMTP.",
    },
    {
      title: "Docker Compose first",
      description:
        "Bring the full stack up locally in minutes. Premium editions add Kubernetes, Terraform, Helm, and production CI/CD.",
    },
  ],
  modules: [
    {
      name: "Catalog service",
      blurb: "Product APIs behind the gateway — browse and add to cart from the Next.js storefront.",
    },
    {
      name: "Order service",
      blurb: "Checkout creates orders after Stripe Payment Element succeeds.",
    },
    {
      name: "Notification service",
      blurb: "Consumes order events and sends confirmation email when SMTP is enabled.",
    },
    {
      name: "Admin Console",
      blurb: "Angular manager console for catalog operations on a separate port.",
    },
    {
      name: "Observability",
      blurb: "Optional OpenTelemetry export to Grafana Cloud across Nest services and Next.js.",
    },
  ],
  plans: [
    {
      code: "compose",
      name: "Docker Compose",
      priceLabel: "Local",
      priceNote: "day-to-day",
      description: "Spin up the full Community Edition stack on your laptop in minutes.",
      features: [
        "Postgres, Redis, RabbitMQ, Keycloak",
        "Gateway + Nest services",
        "Next.js storefront + Angular admin",
        "Hot path for demos & learning",
      ],
      ctaLabel: "Sign in to explore",
      ctaHref: "/products",
      highlighted: true,
    },
    {
      code: "swagger",
      name: "Swagger & health",
      priceLabel: "APIs",
      priceNote: "per service",
      description: "Explore NestJS APIs with Swagger UI and health checks while developing locally.",
      features: [
        "OpenAPI docs on each Nest service",
        "Validation + structured logging",
        "JWT-protected gateway routes",
        "Clean service boundaries",
      ],
      ctaLabel: "Sign in to explore",
      ctaHref: "/products",
    },
    {
      code: "premium",
      name: "Premium editions",
      priceLabel: "Upgrade",
      priceNote: "CyberInfoware",
      description: "Kubernetes, Terraform, Helm, CI/CD, and enterprise docs when you are ready to ship.",
      features: [
        "Kubernetes + Helm charts",
        "Terraform cloud provisioning",
        "Production CI/CD pipelines",
        "Enterprise documentation & support",
      ],
      ctaLabel: "View Premium",
      ctaHref: "https://www.cyberinfoware.com/products",
    },
  ],
  steps: [
    {
      label: "01",
      title: "Bring the stack up",
      description: "Copy .env.example → .env, then run docker compose up --build -d.",
    },
    {
      label: "02",
      title: "Sign in with Keycloak",
      description: "Use demo users (customer / manager) on the Lattice-styled login page to open the storefront.",
    },
    {
      label: "03",
      title: "Shop and operate",
      description: "Add products to cart, pay with Stripe test cards, and manage catalog from the Angular Admin Console.",
    },
  ],
  closingTitle: "Your microservice lab, already assembled",
  closingLede:
    "Sign in with Keycloak to open the storefront. Connect Stripe and SMTP when you are ready, then operate the catalog from the Angular Admin Console as a manager.",
  footerNote:
    "Community Edition · customize brand via content/landing.ts or LANDING_* env · Premium at cyberinfoware.com",
  company: "CyberInfoware · Microservice Starter Kit",
};
