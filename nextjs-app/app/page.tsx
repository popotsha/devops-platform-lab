import Link from "next/link";
import { auth } from "@/auth";
import { getLanding } from "@/lib/landing";
import SignInCta from "./components/SignInCta";
import SiteHeader from "./components/SiteHeader";

export default async function HomePage() {
  const session = await auth();
  const landing = getLanding();
  const displayName = session?.user?.name ?? session?.user?.email ?? "Guest";
  const roles = session?.roles ?? [];
  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL?.trim() || "http://localhost:4200";

  return (
    <div className="site-shell">
      <SiteHeader
        brandName={landing.brandName}
        brandMark={landing.brandMark}
        authenticated={Boolean(session)}
        displayName={displayName}
        email={session?.user?.email}
        roles={roles}
      />

      <main>
        <section className="hero">
          <div className="hero-grid" aria-hidden />
          <div className="hero-glow" aria-hidden />
          <div className="hero-aurora" aria-hidden />
          <div className="hero-veil" aria-hidden />
          <div className="hero-orbs" aria-hidden>
            <span className="hero-orb hero-orb-1" />
            <span className="hero-orb hero-orb-2" />
            <span className="hero-orb hero-orb-3" />
          </div>
          <div className="hero-layout">
            <div className="hero-copy">
              <p className="hero-badge">{landing.tagline}</p>
              <p className="brand-hero">{landing.brandName}</p>
              <h1>{landing.headline}</h1>
              <p className="hero-lede">{landing.lede}</p>
              <div className="cta-row">
                {session ? (
                  <Link href="/products" className="btn btn-primary btn-lg">
                    Open storefront
                  </Link>
                ) : (
                  <SignInCta
                    label={landing.primaryCta.label}
                    className="btn btn-primary btn-lg"
                  />
                )}
              </div>
              {!session ? (
                <p className="hero-demo-hint">
                  Demo users: <code>customer / customer123</code> ·{" "}
                  <code>manager / manager123</code>
                </p>
              ) : null}
            </div>
            <div className="hero-visual" aria-hidden>
              <div className="hero-card hero-card-1">
                <span className="hero-card-label">Edge</span>
                <span className="hero-card-value">API Gateway</span>
              </div>
              <div className="hero-card hero-card-2">
                <span className="hero-card-label">Services</span>
                <span className="hero-card-value">Catalog · Orders · Notify</span>
              </div>
              <div className="hero-card hero-card-3">
                <span className="hero-card-label">Identity</span>
                <span className="hero-card-value">Keycloak SSO</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-platform" id="platform">
          <div className="landing-section-inner">
            <p className="section-kicker">{landing.tagline}</p>
            <h2 className="section-title">A complete microservices lab, not a single tutorial repo</h2>
            <p className="section-lede">
              Sign in to open the customer storefront. Behind it: NestJS services, messaging,
              payments, and an Angular admin console — ready for Docker Compose local development.
            </p>

            <div className="pillar-grid">
              {landing.pillars.map((pillar, index) => (
                <article
                  key={pillar.title}
                  className="pillar"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-pricing" id="deploy">
          <div className="landing-section-inner">
            <p className="section-kicker">How to run</p>
            <h2 className="section-title">Great local DX — upgrade when you need production DevOps</h2>
            <p className="section-lede">
              Community Edition is Docker Compose–first. Premium editions from CyberInfoware add
              Kubernetes, Terraform, Helm, and production CI/CD when you are ready to ship.
            </p>

            <div className="pricing-grid">
              {landing.plans.map((plan, index) => (
                <article
                  key={plan.code}
                  className={`pricing-card${plan.highlighted ? " pricing-card-featured" : ""}`}
                  style={{ animationDelay: `${100 + index * 80}ms` }}
                >
                  {plan.highlighted ? <p className="pricing-badge">Recommended</p> : null}
                  <h3>{plan.name}</h3>
                  <p className="pricing-amount">
                    <span className="pricing-price">{plan.priceLabel}</span>
                    <span className="pricing-note">{plan.priceNote}</span>
                  </p>
                  <p className="pricing-desc">{plan.description}</p>
                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  {session ? (
                    <Link
                      href="/products"
                      className={`btn btn-lg ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}
                    >
                      Open storefront
                    </Link>
                  ) : (
                    <SignInCta
                      label={plan.ctaLabel}
                      className={`btn btn-lg ${plan.highlighted ? "btn-primary" : "btn-secondary"}`}
                    />
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-modules" id="modules">
          <div className="landing-section-inner">
            <p className="section-kicker">Service map</p>
            <h2 className="section-title">Services that make the demo real</h2>
            <p className="section-lede">
              Each Nest service owns a database and a clear boundary. The gateway unifies the public
              API; Keycloak owns identity; Angular owns manager ops.
            </p>

            <ul className="module-rail">
              {landing.modules.map((mod, index) => (
                <li
                  key={mod.name}
                  className="module-rail-item"
                  style={{ animationDelay: `${80 + index * 70}ms` }}
                >
                  <span className="module-rail-name">{mod.name}</span>
                  <span className="module-rail-blurb">{mod.blurb}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="landing-section landing-steps" id="how">
          <div className="landing-section-inner">
            <p className="section-kicker">Path to live</p>
            <h2 className="section-title">From clone to first checkout</h2>
            <ol className="step-list">
              {landing.steps.map((step) => (
                <li key={step.label} className="step-item">
                  <span className="step-label">{step.label}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-closing">
          <div className="landing-closing-inner">
            <h2>{landing.closingTitle}</h2>
            <p>{landing.closingLede}</p>
            <div className="cta-row">
              {session ? (
                <>
                  <Link href="/products" className="btn btn-primary btn-lg">
                    Open storefront
                  </Link>
                  <a
                    href={adminUrl}
                    className="btn btn-secondary btn-lg"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Admin Console
                  </a>
                </>
              ) : (
                <SignInCta
                  label={landing.primaryCta.label}
                  className="btn btn-primary btn-lg"
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span className="site-footer-brand">
            <span className="brand-mark brand-mark-sm" aria-hidden>
              {landing.brandMark}
            </span>
            {landing.company}
          </span>
          <p>{landing.footerNote}</p>
        </div>
      </footer>
    </div>
  );
}
