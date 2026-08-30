import type { LocalizedServiceContentMap } from "@/domain/service";

export const servicesFr: LocalizedServiceContentMap = {
  "web-development": {
    slug: "developpement-web",
    title: "Développement web",
    positioning: "Des sites et applications web sur mesure, rapides et pensés pour convertir.",
    description:
      "Nous concevons et développons des sites vitrines, plateformes métier et applications web avec Next.js et React — de la première maquette à la mise en production, en gardant la performance et le référencement au cœur des décisions techniques.",
    problems: [
      "Un site lent ou vieillissant qui ne reflète plus votre activité",
      "Un thème générique impossible à faire évoluer",
      "Un site invisible sur Google faute de base technique solide",
    ],
    deliverables: [
      "Site ou application web sur mesure, code source inclus",
      "Design responsive optimisé mobile et desktop",
      "Structure technique prête pour le référencement",
      "Formulaires et intégrations connectés à vos outils",
    ],
    capabilities: [
      "Sites vitrines et plateformes métier",
      "Applications web internes (tableaux de bord, outils)",
      "Intégration d'API et de services tiers",
      "Migration depuis un ancien site ou CMS",
    ],
    industries: ["Services professionnels", "Immobilier", "Santé", "Éducation"],
    faq: [
      {
        question: "Combien de temps prend la création d'un site web ?",
        answer:
          "Un site vitrine prend généralement 2 à 4 semaines. Une plateforme plus complexe dépend du périmètre défini ensemble en amont.",
      },
      {
        question: "Le site sera-t-il optimisé pour le référencement ?",
        answer:
          "Oui — structure technique, métadonnées et performance sont pensées dès la conception, pas ajoutées après coup.",
      },
      {
        question: "Puis-je modifier le contenu moi-même après la livraison ?",
        answer:
          "Selon le projet, nous mettons en place une interface d'édition simple ou nous prenons en charge les mises à jour via un forfait de maintenance.",
      },
    ],
  },
  "mobile-applications": {
    slug: "applications-mobiles",
    title: "Applications mobiles",
    positioning: "Des applications iOS et Android pensées pour vos utilisateurs, du prototype au store.",
    description:
      "Nous développons des applications mobiles natives ou multiplateformes avec React Native, du premier parcours utilisateur jusqu'à la publication sur l'App Store et Google Play.",
    problems: [
      "Une idée d'application sans certitude sur la faisabilité ou le coût",
      "Un besoin de couvrir iOS et Android sans doubler le budget",
      "Une app existante lente, buguée ou difficile à faire évoluer",
    ],
    deliverables: [
      "Application mobile iOS et Android à partir d'une seule base de code",
      "Parcours utilisateur et interface conçus pour l'usage mobile",
      "Publication et configuration sur les stores",
      "Connexion à votre backend ou API existante",
    ],
    capabilities: [
      "Applications grand public et applications métier",
      "Notifications push et fonctionnalités hors-ligne",
      "Authentification et gestion de comptes utilisateurs",
      "Intégration paiement, géolocalisation, caméra",
    ],
    industries: ["Livraison & marketplace", "Commerce de détail", "Services de proximité"],
    faq: [
      {
        question: "Faut-il une application différente pour iOS et Android ?",
        answer:
          "Non — nous utilisons React Native pour livrer une seule base de code qui couvre les deux plateformes, sauf besoin technique spécifique justifiant du natif pur.",
      },
      {
        question: "Combien coûte une application mobile ?",
        answer:
          "Cela dépend du nombre d'écrans, des fonctionnalités et des intégrations nécessaires. Nous établissons un chiffrage après avoir cadré le projet avec vous.",
      },
      {
        question: "Prenez-vous en charge la publication sur les stores ?",
        answer: "Oui, nous gérons la configuration et la soumission sur l'App Store et Google Play.",
      },
    ],
  },
  ecommerce: {
    slug: "e-commerce",
    title: "E-commerce",
    positioning: "Des boutiques en ligne complètes, du catalogue au paiement, pensées pour vendre.",
    description:
      "Nous construisons des boutiques en ligne sur mesure : catalogue produits, panier, paiement sécurisé et gestion des stocks, avec une attention particulière portée à la vitesse de chargement et au tunnel d'achat.",
    problems: [
      "Un thème e-commerce générique qui ne correspond pas à votre catalogue",
      "Un tunnel d'achat trop long qui fait perdre des ventes",
      "Une gestion des stocks manuelle et source d'erreurs",
    ],
    deliverables: [
      "Boutique en ligne sur mesure avec paiement sécurisé",
      "Gestion des stocks et des commandes",
      "Fiches produits optimisées pour la conversion et le référencement",
      "Tableau de bord de suivi des ventes",
    ],
    capabilities: [
      "Paiement en ligne et paiement à la livraison",
      "Gestion multi-produits et variantes",
      "Intégration logistique et livraison",
      "Comptes clients et historique de commandes",
    ],
    industries: ["Mode & accessoires", "Beauté", "Équipement", "Alimentation"],
    faq: [
      {
        question: "Le paiement à la livraison est-il possible ?",
        answer:
          "Oui, nous pouvons intégrer le paiement à la livraison en complément du paiement en ligne selon les besoins du marché algérien.",
      },
      {
        question: "Puis-je gérer moi-même mon catalogue produits ?",
        answer: "Oui — vous disposez d'une interface pour ajouter, modifier et organiser vos produits sans dépendre d'un développeur.",
      },
      {
        question: "La boutique fonctionnera-t-elle bien sur mobile ?",
        answer:
          "Oui, la majorité des acheteurs naviguant depuis un téléphone, chaque boutique est conçue mobile-first dès le départ.",
      },
    ],
  },
  "saas-platforms": {
    slug: "saas-et-plateformes",
    title: "SaaS & Plateformes",
    positioning: "Des produits SaaS et outils métier conçus pour évoluer avec votre entreprise.",
    description:
      "Nous concevons des plateformes SaaS et des outils métier sur mesure — abonnements, espaces multi-utilisateurs, tableaux de bord — avec une architecture pensée pour la montée en charge dès le premier jour.",
    problems: [
      "Un processus métier géré manuellement via des fichiers Excel",
      "Une idée de produit SaaS sans architecture technique claire",
      "Un outil interne devenu trop rigide pour l'équipe",
    ],
    deliverables: [
      "Plateforme web avec comptes utilisateurs et rôles",
      "Architecture technique documentée et évolutive",
      "Tableau de bord d'administration",
      "Système d'abonnement ou de facturation si nécessaire",
    ],
    capabilities: [
      "Multi-tenant et gestion des permissions",
      "Tableaux de bord et reporting",
      "Facturation et abonnements récurrents",
      "API pour connecter d'autres outils",
    ],
    industries: ["Outils métier internes", "Marketplaces", "Gestion & réservation"],
    faq: [
      {
        question: "Qu'est-ce qui différencie un SaaS d'un site web classique ?",
        answer:
          "Un SaaS gère des comptes utilisateurs, des rôles, souvent un abonnement, et doit être pensé pour supporter la croissance du nombre d'utilisateurs — l'architecture technique est plus structurante dès le départ.",
      },
      {
        question: "Pouvez-vous démarrer par une version minimale (MVP) ?",
        answer: "Oui, c'est l'approche que nous recommandons pour valider le produit avant d'investir dans des fonctionnalités avancées.",
      },
      {
        question: "Le produit pourra-t-il évoluer plus tard ?",
        answer: "Oui — l'architecture est documentée et modulaire pour permettre d'ajouter des fonctionnalités sans tout reconstruire.",
      },
    ],
  },
  "ai-agents": {
    slug: "agents-ia",
    title: "Agents IA",
    positioning: "Des agents et assistants IA qui comprennent vos clients et qualifient vos demandes.",
    description:
      "Nous concevons des agents IA capables de répondre à vos clients, qualifier une demande ou orienter un visiteur vers la bonne solution — en français, en arabe ou en anglais — connectés à vos données et à vos outils métier.",
    problems: [
      "Une équipe submergée par des questions répétitives",
      "Des visiteurs qui repartent sans avoir trouvé de réponse",
      "Un besoin de qualifier les demandes avant transfert à un humain",
    ],
    deliverables: [
      "Agent conversationnel connecté à votre contenu et vos outils",
      "Support multilingue (français, arabe, anglais)",
      "Qualification automatique des demandes entrantes",
      "Architecture indépendante du fournisseur d'IA sous-jacent",
    ],
    capabilities: [
      "Assistant conseil sur site web",
      "Qualification de leads avant transfert humain",
      "Réponses basées sur vos documents et données réels",
      "Passage de relais fluide vers WhatsApp ou un humain",
    ],
    industries: ["Service client", "Immobilier", "Tourisme & voyage"],
    faq: [
      {
        question: "L'agent IA remplace-t-il mon équipe ?",
        answer:
          "Non — il traite les questions répétitives et qualifie les demandes, pour que votre équipe se concentre sur les échanges à réelle valeur ajoutée.",
      },
      {
        question: "L'IA peut-elle se tromper ?",
        answer:
          "Oui, comme tout système IA. Nous concevons les agents pour rester honnêtes sur leurs limites et transmettre à un humain quand c'est nécessaire.",
      },
      {
        question: "Puis-je changer de fournisseur d'IA plus tard ?",
        answer: "Oui, l'architecture est conçue pour ne pas dépendre d'un seul fournisseur de modèle IA.",
      },
    ],
  },
  "voice-ai": {
    slug: "ia-vocale",
    title: "IA vocale",
    positioning: "Des assistants vocaux capables de comprendre et répondre naturellement à vos appelants.",
    description:
      "Nous concevons des solutions d'IA vocale pour traiter les appels entrants, prendre des réservations ou répondre aux questions fréquentes, avec une compréhension naturelle du français, de l'arabe ou de l'anglais.",
    problems: [
      "Des appels manqués en dehors des heures d'ouverture",
      "Une ligne téléphonique saturée par des questions répétitives",
      "Un besoin de prise de rendez-vous automatisée",
    ],
    deliverables: [
      "Assistant vocal connecté à votre ligne téléphonique",
      "Prise de rendez-vous ou de commande automatisée",
      "Transcription et résumé des appels",
      "Transfert vers un humain quand nécessaire",
    ],
    capabilities: [
      "Réponse aux questions fréquentes par téléphone",
      "Prise de rendez-vous et rappels",
      "Compréhension multilingue de la voix",
      "Intégration à votre agenda ou système de réservation",
    ],
    industries: ["Restauration & réservation", "Santé", "Services à domicile"],
    faq: [
      {
        question: "L'assistant vocal comprend-il l'arabe dialectal ?",
        answer:
          "La compréhension de la darija dépend du fournisseur vocal choisi et du périmètre du projet — nous en discutons au cadrage pour fixer des attentes réalistes.",
      },
      {
        question: "Peut-on transférer l'appel à une personne réelle ?",
        answer: "Oui, le transfert vers un humain est prévu dès la conception pour les cas que l'assistant ne peut pas traiter seul.",
      },
    ],
  },
  automation: {
    slug: "automatisation",
    title: "Automatisation",
    positioning: "Des automatisations qui suppriment les tâches répétitives de vos équipes.",
    description:
      "Nous automatisons les tâches manuelles et répétitives entre vos outils — commandes, notifications, mises à jour de données — pour que votre équipe passe moins de temps sur la saisie et plus sur l'essentiel.",
    problems: [
      "Des données ressaisies manuellement entre plusieurs outils",
      "Des notifications ou relances gérées à la main",
      "Un processus métier qui dépend d'une seule personne",
    ],
    deliverables: [
      "Automatisation connectant vos outils existants",
      "Notifications et alertes automatiques",
      "Documentation claire du fonctionnement mis en place",
      "Suivi des erreurs et des exécutions",
    ],
    capabilities: [
      "Synchronisation entre applications (CRM, feuilles de calcul, WhatsApp)",
      "Notifications automatiques par email ou WhatsApp",
      "Génération automatique de documents",
      "Workflows métier personnalisés",
    ],
    industries: ["Commerce", "Services administratifs", "Logistique"],
    faq: [
      {
        question: "Faut-il changer nos outils actuels ?",
        answer: "Généralement non — l'automatisation vient connecter les outils que vous utilisez déjà plutôt que les remplacer.",
      },
      {
        question: "Que se passe-t-il si une automatisation échoue ?",
        answer: "Nous mettons en place un suivi des erreurs afin qu'un échec soit visible et traité rapidement, pas silencieux.",
      },
    ],
  },
  "ui-ux-design": {
    slug: "design-ui-ux",
    title: "Design UI/UX",
    positioning: "Des interfaces claires qui donnent confiance et guident vers l'action.",
    description:
      "Nous concevons des interfaces pensées pour vos utilisateurs réels — parcours clairs, hiérarchie visuelle et système de design cohérent — avant même d'écrire une ligne de code.",
    problems: [
      "Une interface confuse qui décourage les visiteurs",
      "Une identité visuelle incohérente d'une page à l'autre",
      "Un produit qui fonctionne mais que personne ne comprend facilement",
    ],
    deliverables: [
      "Maquettes des écrans clés en haute fidélité",
      "Système de design réutilisable (couleurs, typographie, composants)",
      "Parcours utilisateur clarifié avant développement",
      "Fichiers Figma organisés et transmis",
    ],
    capabilities: [
      "Design d'interfaces web et mobile",
      "Systèmes de design pour équipes produit",
      "Refonte d'interfaces existantes",
      "Prototypes interactifs pour tests utilisateurs",
    ],
    industries: ["Produits SaaS", "Applications mobiles", "Sites e-commerce"],
    faq: [
      {
        question: "Le design précède-t-il toujours le développement ?",
        answer: "Dans la majorité des projets, oui — cela évite des allers-retours coûteux une fois le code écrit.",
      },
      {
        question: "Fournissez-vous les fichiers source ?",
        answer: "Oui, vous recevez les fichiers Figma organisés, pas seulement des exports d'images.",
      },
    ],
  },
  "seo-growth": {
    slug: "seo-et-croissance",
    title: "SEO & Croissance",
    positioning: "Une fondation technique solide pour être trouvé, sans promesses de classement irréalistes.",
    description:
      "Nous mettons en place les fondations techniques du référencement — structure, métadonnées, performance, données structurées — et un suivi honnête des résultats, sans recourir à des pratiques qui mettent votre site en danger.",
    problems: [
      "Un site invisible sur les recherches liées à votre activité",
      "Des métadonnées manquantes ou dupliquées",
      "Un site lent qui pénalise le classement et l'expérience utilisateur",
    ],
    deliverables: [
      "Audit technique SEO complet",
      "Métadonnées, données structurées et sitemap corrects",
      "Optimisation des performances (Core Web Vitals)",
      "Rapport de suivi basé sur des données réelles",
    ],
    capabilities: [
      "SEO technique (structure, vitesse, indexation)",
      "Contenu optimisé pour l'intention de recherche",
      "Suivi de positionnement et de trafic",
      "SEO multilingue (hreflang, contenu localisé)",
    ],
    industries: ["Sites vitrines", "E-commerce", "Plateformes de contenu"],
    faq: [
      {
        question: "Pouvez-vous garantir la première position sur Google ?",
        answer:
          "Non, et nous nous méfions de quiconque le promet. Nous mettons en place une base technique saine et un suivi honnête des résultats.",
      },
      {
        question: "Combien de temps avant de voir des résultats ?",
        answer: "Le référencement est un travail de fond — les premiers effets techniques sont rapides, la progression durable prend plusieurs mois.",
      },
    ],
  },
  "backend-api": {
    slug: "backend-et-api",
    title: "Backend & API",
    positioning: "Des fondations serveur solides, sécurisées et prêtes à monter en charge.",
    description:
      "Nous concevons la logique serveur, les bases de données et les API qui font fonctionner vos applications de façon fiable — avec une attention particulière portée à la sécurité et à la qualité des données.",
    problems: [
      "Une application front-end sans logique serveur solide derrière",
      "Des données mal structurées qui compliquent chaque évolution",
      "Un besoin d'exposer vos données à d'autres systèmes de façon sécurisée",
    ],
    deliverables: [
      "API sécurisée et documentée",
      "Base de données structurée et optimisée",
      "Validation des données à chaque point d'entrée",
      "Journalisation et gestion des erreurs",
    ],
    capabilities: [
      "Conception de base de données",
      "API REST et GraphQL",
      "Authentification et gestion des permissions",
      "Intégration avec des services tiers",
    ],
    industries: ["Plateformes SaaS", "Applications mobiles", "Systèmes internes"],
    faq: [
      {
        question: "Travaillez-vous avec une base de données existante ?",
        answer: "Oui, nous pouvons reprendre une base existante après audit, ou en concevoir une nouvelle selon le projet.",
      },
      {
        question: "Comment la sécurité est-elle prise en compte ?",
        answer: "La validation des entrées, l'authentification et les permissions sont conçues dès l'architecture, pas ajoutées en fin de projet.",
      },
    ],
  },
  "cloud-infrastructure": {
    slug: "cloud-et-infrastructure",
    title: "Cloud & Infrastructure",
    positioning: "Une infrastructure fiable qui ne vous enferme pas chez un seul fournisseur.",
    description:
      "Nous mettons en place l'hébergement, le déploiement continu et la surveillance de vos applications, avec une architecture qui reste portable plutôt que dépendante d'un seul prestataire.",
    problems: [
      "Un déploiement manuel source d'erreurs et de temps d'arrêt",
      "Une infrastructure trop dépendante d'un seul fournisseur",
      "Aucune visibilité en cas de panne ou de ralentissement",
    ],
    deliverables: [
      "Déploiement automatisé et sécurisé",
      "Surveillance et alertes en cas d'incident",
      "Sauvegardes automatiques des données",
      "Documentation de l'infrastructure",
    ],
    capabilities: [
      "Hébergement et déploiement continu",
      "Surveillance des performances et des erreurs",
      "Architecture portable (non dépendante d'un seul cloud)",
      "Sauvegardes et plans de reprise",
    ],
    industries: ["Plateformes SaaS", "Applications à fort trafic", "Systèmes critiques"],
    faq: [
      {
        question: "Sommes-nous dépendants d'un fournisseur cloud spécifique ?",
        answer: "Non, nous concevons l'architecture pour rester portable et éviter la dépendance à un seul prestataire.",
      },
      {
        question: "Que se passe-t-il en cas de panne ?",
        answer: "La surveillance en place permet de détecter un incident rapidement et d'agir avant qu'il n'affecte durablement vos utilisateurs.",
      },
    ],
  },
  "maintenance-support": {
    slug: "maintenance-et-support",
    title: "Maintenance & Support",
    positioning: "Un site ou une application qui reste fiable, sécurisée et à jour dans la durée.",
    description:
      "Nous assurons la maintenance technique de votre site ou application après le lancement — mises à jour de sécurité, corrections, petites évolutions — pour que le produit livré reste fiable dans le temps.",
    problems: [
      "Un site laissé à l'abandon après sa mise en ligne",
      "Des mises à jour de sécurité jamais appliquées",
      "Aucun interlocuteur technique en cas de problème",
    ],
    deliverables: [
      "Mises à jour de sécurité régulières",
      "Corrections de bugs et petites évolutions",
      "Surveillance de la disponibilité",
      "Rapport d'activité périodique",
    ],
    capabilities: [
      "Maintenance corrective et évolutive",
      "Surveillance de la sécurité et des performances",
      "Sauvegardes régulières",
      "Support technique réactif",
    ],
    industries: ["Sites vitrines", "E-commerce", "Applications métier"],
    faq: [
      {
        question: "La maintenance est-elle obligatoire après un projet ?",
        answer: "Non, mais elle est fortement recommandée pour tout produit exposé publiquement afin d'éviter les failles de sécurité non corrigées.",
      },
      {
        question: "Puis-je demander de petites évolutions dans le cadre de la maintenance ?",
        answer: "Oui, les forfaits de maintenance incluent généralement un volume d'évolutions mineures — le détail est défini ensemble.",
      },
    ],
  },
};
