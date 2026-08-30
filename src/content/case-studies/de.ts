import type { LocalizedCaseStudyContentMap } from "@/domain/case-study";

export const caseStudiesDe: LocalizedCaseStudyContentMap = {
  saheat: {
    slug: "saheat",
    name: "SahEat",
    tag: "Marktplatz",
    tagline: "Essenslieferungs-Marktplatz",
    summary:
      "Ein Essenslieferungs-Marktplatz mit mobilen Apps für Endnutzer und einem Admin-Dashboard für den Betrieb.",
    whatItIs:
      "SahEat verbindet Restaurants und Endnutzer für Essensbestellung und -lieferung, mit einem Admin-Bereich zur Verwaltung von Bestellungen und Partnern.",
    coreFunctionality: [
      "Mobile App zur Essensbestellung",
      "Admin-Dashboard zur Bestellverwaltung",
      "Verwaltung der Partnerrestaurants",
    ],
    narrative: {},
  },
  "e-vizza": {
    slug: "e-vizza",
    name: "e-Vizza",
    tag: "SaaS · KI",
    tagline: "KI-gestützte SaaS-Plattform zur Visa-Automatisierung",
    summary: "Eine SaaS-Plattform, die einen Teil des Visumantragsprozesses mithilfe von KI automatisiert.",
    whatItIs: "e-Vizza ist ein SaaS-Produkt, das den Visumantragsprozess für seine Nutzer vereinfacht und automatisiert.",
    coreFunctionality: ["KI-gestützte Automatisierung des Antragsprozesses", "Web-Plattform für Endnutzer"],
    narrative: {},
  },
  "eleman-shoes": {
    slug: "eleman-shoes",
    name: "Eleman Shoes",
    tag: "E-Commerce",
    tagline: "E-Commerce-Shop mit Lagerverwaltung",
    summary: "Ein E-Commerce-Shop mit Echtzeit-Lagerverwaltung für den Online-Verkauf von Schuhen.",
    whatItIs: "Eleman Shoes ist ein Onlineshop für den Schuhverkauf mit integrierter Bestandsverfolgung.",
    coreFunctionality: ["Produktkatalog und Online-Verkauf", "Echtzeit-Lagerverwaltung"],
    narrative: {},
  },
  dzenix: {
    slug: "dzenix",
    name: "Dzenix",
    tag: "Website & Marke",
    tagline: "Website und Markenidentität",
    summary: "Eine Website und Markenidentität für eine Digitalagentur.",
    whatItIs: "Dzenix ist die Website und visuelle Identität einer Digitalagentur.",
    coreFunctionality: ["Website", "Markenidentität"],
    narrative: {},
  },
};
