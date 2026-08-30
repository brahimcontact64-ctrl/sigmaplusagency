import type { LocalizedCaseStudyContentMap } from "@/domain/case-study";

/**
 * Narrative fields (challenge/strategy/implementation/qualitativeOutcome)
 * are intentionally left unset where the source material doesn't support
 * them — see docs/CASE_STUDY_OWNER_INPUT.md. Nothing here is invented.
 */
export const caseStudiesFr: LocalizedCaseStudyContentMap = {
  saheat: {
    slug: "saheat",
    name: "SahEat",
    tag: "Marketplace",
    tagline: "Marketplace de livraison de repas",
    summary:
      "Une marketplace de livraison de repas construite avec des applications mobiles pour les utilisateurs et un tableau de bord d'administration pour la gestion des opérations.",
    whatItIs:
      "SahEat connecte des restaurants et des utilisateurs finaux pour la commande et la livraison de repas, avec un espace d'administration pour piloter les commandes et les partenaires.",
    coreFunctionality: [
      "Application mobile pour la commande de repas",
      "Tableau de bord d'administration pour la gestion des commandes",
      "Gestion des restaurants partenaires",
    ],
    narrative: {},
  },
  "e-vizza": {
    slug: "e-vizza",
    name: "e-Vizza",
    tag: "SaaS · IA",
    tagline: "Plateforme SaaS d'automatisation de visa, assistée par IA",
    summary:
      "Une plateforme SaaS qui automatise une partie du processus de demande de visa à l'aide de l'intelligence artificielle.",
    whatItIs:
      "e-Vizza est un produit SaaS orienté vers la simplification et l'automatisation des démarches de demande de visa pour ses utilisateurs.",
    coreFunctionality: [
      "Automatisation assistée par IA du processus de demande",
      "Plateforme web accessible aux utilisateurs finaux",
    ],
    narrative: {},
  },
  "eleman-shoes": {
    slug: "eleman-shoes",
    name: "Eleman Shoes",
    tag: "E-commerce",
    tagline: "Boutique e-commerce avec gestion des stocks",
    summary: "Une boutique e-commerce avec gestion des stocks en temps réel pour la vente de chaussures en ligne.",
    whatItIs: "Eleman Shoes est une boutique en ligne dédiée à la vente de chaussures, avec suivi des stocks intégré.",
    coreFunctionality: ["Catalogue produits et vente en ligne", "Gestion des stocks en temps réel"],
    narrative: {},
  },
  dzenix: {
    slug: "dzenix",
    name: "Dzenix",
    tag: "Site & marque",
    tagline: "Site web et identité de marque",
    summary: "Un site web et une identité de marque conçus pour une agence digitale.",
    whatItIs: "Dzenix est le site web et l'identité visuelle d'une agence digitale.",
    coreFunctionality: ["Site web de présentation", "Identité de marque"],
    narrative: {},
  },
};
