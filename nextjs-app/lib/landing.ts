import { defaultLanding, type LandingContent } from "@/content/landing";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** Merge editable defaults with optional env overrides for white-label buyers. */
export function getLanding(): LandingContent {
  const brandName = env("LANDING_BRAND_NAME") ?? defaultLanding.brandName;
  const brandMark =
    env("LANDING_BRAND_MARK") ?? brandName.slice(0, 1).toUpperCase() ?? defaultLanding.brandMark;

  return {
    ...defaultLanding,
    brandName,
    brandMark,
    tagline: env("LANDING_TAGLINE") ?? defaultLanding.tagline,
    headline: env("LANDING_HEADLINE") ?? defaultLanding.headline,
    lede: env("LANDING_LEDE") ?? defaultLanding.lede,
    primaryCta: {
      label: env("LANDING_PRIMARY_CTA_LABEL") ?? defaultLanding.primaryCta.label,
      href: env("LANDING_PRIMARY_CTA_HREF") ?? defaultLanding.primaryCta.href,
    },
    secondaryCta: {
      label: env("LANDING_SECONDARY_CTA_LABEL") ?? defaultLanding.secondaryCta.label,
      href: env("LANDING_SECONDARY_CTA_HREF") ?? defaultLanding.secondaryCta.href,
    },
    closingTitle: env("LANDING_CLOSING_TITLE") ?? defaultLanding.closingTitle,
    closingLede: env("LANDING_CLOSING_LEDE") ?? defaultLanding.closingLede,
    footerNote: env("LANDING_FOOTER_NOTE") ?? defaultLanding.footerNote,
    company: env("LANDING_COMPANY") ?? brandName,
  };
}
