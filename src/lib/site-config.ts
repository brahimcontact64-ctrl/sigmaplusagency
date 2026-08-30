/**
 * Central, environment-driven business configuration.
 * Never hardcode contact details or the WhatsApp number in components —
 * read them from here so a single env change updates the whole site.
 */
export const siteConfig = {
  name: "SIGMA+",
  legalName: "SIGMA+ Agency",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sigmaplus.agency",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "436602313221",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+213 550 47 52 48",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "brahimcontact64@gmail.com",
} as const;
