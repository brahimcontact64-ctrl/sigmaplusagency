import type { LocalizedServiceContentMap } from "@/domain/service";

export const servicesDe: LocalizedServiceContentMap = {
  "web-development": {
    slug: "webentwicklung",
    title: "Webentwicklung",
    positioning: "Maßgeschneiderte Websites und Web-Apps — schnell und auf Conversion ausgelegt.",
    description:
      "Wir konzipieren und entwickeln Websites, Business-Plattformen und Webanwendungen mit Next.js und React — vom ersten Wireframe bis zur Produktion, wobei Performance und SEO von Anfang an technische Entscheidungen sind, nicht nachträgliche Ergänzungen.",
    problems: [
      "Eine langsame oder veraltete Website, die Ihr Unternehmen nicht mehr widerspiegelt",
      "Ein generisches Theme, das sich nicht weiterentwickeln lässt",
      "Eine Website, die bei Google mangels solider technischer Basis unauffindbar ist",
    ],
    deliverables: [
      "Maßgeschneiderte Website oder Web-App, Quellcode inklusive",
      "Responsives Design, optimiert für Mobile und Desktop",
      "SEO-taugliche technische Struktur",
      "Formulare und Integrationen, verbunden mit Ihren Tools",
    ],
    capabilities: [
      "Websites und Business-Plattformen",
      "Interne Webanwendungen (Dashboards, Tools)",
      "API- und Drittanbieter-Integration",
      "Migration von einer alten Website oder einem CMS",
    ],
    industries: ["Dienstleistungen", "Immobilien", "Gesundheitswesen", "Bildung"],
    faq: [
      {
        question: "Wie lange dauert der Bau einer Website?",
        answer:
          "Eine einfache Website dauert in der Regel 2 bis 4 Wochen. Eine komplexere Plattform hängt vom gemeinsam definierten Umfang ab.",
      },
      {
        question: "Wird die Website für SEO optimiert?",
        answer: "Ja — technische Struktur, Metadaten und Performance werden von Anfang an mitgedacht, nicht nachträglich ergänzt.",
      },
      {
        question: "Kann ich die Inhalte nach dem Launch selbst bearbeiten?",
        answer:
          "Je nach Projekt richten wir eine einfache Bearbeitungsoberfläche ein oder übernehmen Updates im Rahmen eines Wartungspakets.",
      },
    ],
  },
  "mobile-applications": {
    slug: "mobile-apps",
    title: "Mobile Apps",
    positioning: "iOS- und Android-Apps, gestaltet für Ihre Nutzer — vom Prototyp bis in den Store.",
    description:
      "Wir entwickeln native oder plattformübergreifende Apps mit React Native, vom ersten Nutzerflow bis zur Veröffentlichung im App Store und bei Google Play.",
    problems: [
      "Eine App-Idee ohne Klarheit über Machbarkeit oder Kosten",
      "Der Bedarf, iOS und Android abzudecken, ohne das Budget zu verdoppeln",
      "Eine bestehende App, die langsam, fehlerhaft oder schwer weiterzuentwickeln ist",
    ],
    deliverables: [
      "iOS- und Android-App aus einer einzigen Codebasis",
      "Nutzerflow und Interface für den mobilen Einsatz gestaltet",
      "Veröffentlichung und Konfiguration in den Stores",
      "Anbindung an Ihr bestehendes Backend oder Ihre API",
    ],
    capabilities: [
      "Consumer-Apps und Business-Apps",
      "Push-Benachrichtigungen und Offline-Funktionalität",
      "Authentifizierung und Nutzerkontenverwaltung",
      "Integration von Zahlung, Standort und Kamera",
    ],
    industries: ["Lieferung & Marktplätze", "Einzelhandel", "Lokale Dienstleistungen"],
    faq: [
      {
        question: "Brauche ich separate Apps für iOS und Android?",
        answer:
          "Nein — wir nutzen React Native für eine einzige Codebasis, die beide Plattformen abdeckt, außer ein konkreter technischer Grund spricht für natives Coding.",
      },
      {
        question: "Was kostet eine mobile App?",
        answer: "Das hängt von Anzahl der Screens, Funktionen und benötigten Integrationen ab. Ein Angebot folgt nach der gemeinsamen Scope-Definition.",
      },
      {
        question: "Übernehmen Sie die Einreichung in den Stores?",
        answer: "Ja, wir kümmern uns um Konfiguration und Einreichung im App Store und bei Google Play.",
      },
    ],
  },
  ecommerce: {
    slug: "e-commerce",
    title: "E-Commerce",
    positioning: "Komplette Onlineshops, vom Katalog bis zur Kasse — gebaut, um zu verkaufen.",
    description:
      "Wir bauen maßgeschneiderte Onlineshops: Produktkatalog, Warenkorb, sichere Kasse und Lagerverwaltung — mit besonderem Augenmerk auf Ladegeschwindigkeit und Kaufprozess.",
    problems: [
      "Ein generisches E-Commerce-Theme, das nicht zu Ihrem Katalog passt",
      "Ein Checkout-Prozess, der lang genug ist, um Verkäufe zu verlieren",
      "Manuelle, fehleranfällige Lagerverwaltung",
    ],
    deliverables: [
      "Maßgeschneiderter Onlineshop mit sicherer Kasse",
      "Lager- und Bestellverwaltung",
      "Produktseiten optimiert für Conversion und SEO",
      "Dashboard zur Verkaufsübersicht",
    ],
    capabilities: [
      "Online-Zahlung und Nachnahme",
      "Verwaltung mehrerer Produkte und Varianten",
      "Logistik- und Lieferintegration",
      "Kundenkonten und Bestellhistorie",
    ],
    industries: ["Mode & Accessoires", "Beauty", "Ausrüstung", "Lebensmittel"],
    faq: [
      {
        question: "Ist Nachnahme möglich?",
        answer: "Ja, wir können Nachnahme zusätzlich zur Online-Zahlung integrieren, passend zum algerischen Markt.",
      },
      {
        question: "Kann ich meinen Produktkatalog selbst verwalten?",
        answer: "Ja — Sie erhalten eine Oberfläche, um Produkte hinzuzufügen, zu bearbeiten und zu organisieren, ohne auf einen Entwickler angewiesen zu sein.",
      },
      {
        question: "Funktioniert der Shop gut auf Mobilgeräten?",
        answer: "Ja — da die meisten Käufer über das Smartphone einkaufen, wird jeder Shop von Anfang an mobile-first gestaltet.",
      },
    ],
  },
  "saas-platforms": {
    slug: "saas-plattformen",
    title: "SaaS & Plattformen",
    positioning: "SaaS-Produkte und Business-Tools, die mit Ihrem Unternehmen wachsen.",
    description:
      "Wir entwickeln SaaS-Plattformen und maßgeschneiderte Business-Tools — Abonnements, Multi-User-Bereiche, Dashboards — mit einer von Anfang an wachstumsfähigen Architektur.",
    problems: [
      "Ein Geschäftsprozess, der noch manuell über Excel-Tabellen läuft",
      "Eine SaaS-Produktidee ohne klare technische Architektur",
      "Ein internes Tool, das für das Team zu unflexibel geworden ist",
    ],
    deliverables: [
      "Web-Plattform mit Nutzerkonten und Rollen",
      "Dokumentierte, skalierbare technische Architektur",
      "Admin-Dashboard",
      "Abonnement- oder Abrechnungssystem bei Bedarf",
    ],
    capabilities: [
      "Multi-Tenant-Fähigkeit und Rechteverwaltung",
      "Dashboards und Reporting",
      "Wiederkehrende Abrechnung und Abonnements",
      "API zur Anbindung weiterer Tools",
    ],
    industries: ["Interne Business-Tools", "Marktplätze", "Buchung & Verwaltung"],
    faq: [
      {
        question: "Was unterscheidet ein SaaS-Produkt von einer normalen Website?",
        answer:
          "Ein SaaS-Produkt verwaltet Nutzerkonten, Rollen und oft eine Abrechnung und muss eine wachsende Nutzerzahl unterstützen — die technische Architektur ist von Anfang an entscheidender.",
      },
      {
        question: "Können Sie mit einer Minimalversion (MVP) starten?",
        answer: "Ja, das empfehlen wir, um das Produkt zu validieren, bevor in erweiterte Funktionen investiert wird.",
      },
      {
        question: "Kann das Produkt später wachsen?",
        answer: "Ja — die Architektur ist dokumentiert und modular, sodass Funktionen ergänzt werden können, ohne alles neu zu bauen.",
      },
    ],
  },
  "ai-agents": {
    slug: "ki-agenten",
    title: "KI-Agenten",
    positioning: "KI-Agenten und Assistenten, die Ihre Kunden verstehen und Anfragen qualifizieren.",
    description:
      "Wir entwickeln KI-Agenten, die Kundenanfragen beantworten, qualifizieren oder Besucher zur richtigen Lösung führen — auf Französisch, Arabisch oder Englisch — verbunden mit Ihren echten Daten und Business-Tools.",
    problems: [
      "Ein Team, das von sich wiederholenden Fragen überlastet ist",
      "Besucher, die ohne Antwort wieder gehen",
      "Der Bedarf, eingehende Anfragen vor der Weiterleitung an einen Menschen zu qualifizieren",
    ],
    deliverables: [
      "Konversationsagent, verbunden mit Ihren Inhalten und Tools",
      "Mehrsprachiger Support (Französisch, Arabisch, Englisch)",
      "Automatische Qualifizierung eingehender Anfragen",
      "Architektur unabhängig von einem einzelnen KI-Anbieter",
    ],
    capabilities: [
      "Beratender Assistent auf der Website",
      "Lead-Qualifizierung vor menschlicher Übergabe",
      "Antworten basierend auf Ihren echten Dokumenten und Daten",
      "Reibungslose Übergabe an WhatsApp oder einen Menschen",
    ],
    industries: ["Kundenservice", "Immobilien", "Tourismus & Reisen"],
    faq: [
      {
        question: "Ersetzt der KI-Agent mein Team?",
        answer:
          "Nein — er übernimmt wiederkehrende Fragen und qualifiziert Anfragen, damit sich Ihr Team auf Gespräche mit echtem Mehrwert konzentrieren kann.",
      },
      {
        question: "Kann die KI Fehler machen?",
        answer: "Ja, wie jedes KI-System. Wir gestalten Agenten so, dass sie ihre Grenzen ehrlich kommunizieren und bei Bedarf an einen Menschen übergeben.",
      },
      {
        question: "Kann ich später den KI-Anbieter wechseln?",
        answer: "Ja, die Architektur ist so gestaltet, dass keine Abhängigkeit von einem einzigen Modellanbieter entsteht.",
      },
    ],
  },
  "voice-ai": {
    slug: "voice-ai",
    title: "Voice AI",
    positioning: "Sprachassistenten, die Ihre Anrufer natürlich verstehen und beantworten.",
    description:
      "Wir entwickeln Voice-AI-Lösungen für eingehende Anrufe, Terminbuchungen oder häufige Fragen — mit natürlichem Verständnis von Französisch, Arabisch oder Englisch.",
    problems: [
      "Verpasste Anrufe außerhalb der Geschäftszeiten",
      "Eine Telefonleitung, die von wiederkehrenden Fragen überlastet ist",
      "Der Bedarf an automatisierter Terminbuchung",
    ],
    deliverables: [
      "Sprachassistent, verbunden mit Ihrer Telefonleitung",
      "Automatisierte Buchung oder Bestellannahme",
      "Anruftranskription und Zusammenfassungen",
      "Übergabe an einen Menschen bei Bedarf",
    ],
    capabilities: [
      "Beantwortung häufiger Fragen am Telefon",
      "Terminbuchung und Erinnerungen",
      "Mehrsprachiges Sprachverständnis",
      "Integration mit Ihrem Kalender oder Buchungssystem",
    ],
    industries: ["Restaurants & Reservierungen", "Gesundheitswesen", "Dienstleistungen zu Hause"],
    faq: [
      {
        question: "Versteht der Sprachassistent algerisches Darija?",
        answer:
          "Das Verständnis von Darija hängt vom gewählten Sprachanbieter und dem Projektumfang ab — wir besprechen das vorab, um realistische Erwartungen zu setzen.",
      },
      {
        question: "Kann ein Anruf an eine echte Person weitergeleitet werden?",
        answer: "Ja, die Übergabe an einen Menschen ist von Anfang an für Fälle vorgesehen, die der Assistent nicht allein lösen kann.",
      },
    ],
  },
  automation: {
    slug: "automatisierung",
    title: "Automatisierung",
    positioning: "Automatisierungen, die Ihrem Team wiederkehrende Arbeit abnehmen.",
    description:
      "Wir automatisieren manuelle, sich wiederholende Aufgaben zwischen Ihren Tools — Bestellungen, Benachrichtigungen, Datenaktualisierungen —, damit Ihr Team weniger Zeit mit Dateneingabe verbringt.",
    problems: [
      "Daten, die manuell zwischen mehreren Tools erneut eingegeben werden",
      "Benachrichtigungen oder Nachfassaktionen, die von Hand erledigt werden",
      "Ein Geschäftsprozess, der von einer einzigen Person abhängt",
    ],
    deliverables: [
      "Automatisierung, die Ihre bestehenden Tools verbindet",
      "Automatische Benachrichtigungen und Alarme",
      "Klare Dokumentation der Funktionsweise",
      "Fehler- und Ausführungsverfolgung",
    ],
    capabilities: [
      "Synchronisation zwischen Apps (CRM, Tabellen, WhatsApp)",
      "Automatische E-Mail- oder WhatsApp-Benachrichtigungen",
      "Automatische Dokumentenerstellung",
      "Individuelle Geschäftsworkflows",
    ],
    industries: ["Handel", "Verwaltungsdienste", "Logistik"],
    faq: [
      {
        question: "Müssen wir unsere aktuellen Tools ersetzen?",
        answer: "In der Regel nicht — Automatisierung verbindet die Tools, die Sie bereits nutzen, statt sie zu ersetzen.",
      },
      {
        question: "Was passiert, wenn eine Automatisierung fehlschlägt?",
        answer: "Wir richten eine Fehlerverfolgung ein, damit ein Fehlschlag sichtbar wird und schnell behoben werden kann, statt unbemerkt zu bleiben.",
      },
    ],
  },
  "ui-ux-design": {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    positioning: "Klare Interfaces, die Vertrauen schaffen und zum Handeln anleiten.",
    description:
      "Wir gestalten Interfaces um Ihre echten Nutzer herum — klare Abläufe, visuelle Hierarchie und ein konsistentes Designsystem — noch bevor eine Zeile Code geschrieben wird.",
    problems: [
      "Ein verwirrendes Interface, das Besucher abschreckt",
      "Eine visuelle Identität, die von Seite zu Seite inkonsistent ist",
      "Ein Produkt, das funktioniert, das aber niemand leicht versteht",
    ],
    deliverables: [
      "Hochauflösende Mockups der Kernbildschirme",
      "Wiederverwendbares Designsystem (Farben, Typografie, Komponenten)",
      "Vor der Entwicklung geklärte Nutzerabläufe",
      "Organisierte, übergebene Figma-Dateien",
    ],
    capabilities: [
      "Web- und Mobile-Interface-Design",
      "Designsysteme für Produktteams",
      "Neugestaltung bestehender Interfaces",
      "Interaktive Prototypen für Nutzertests",
    ],
    industries: ["SaaS-Produkte", "Mobile Apps", "E-Commerce-Websites"],
    faq: [
      {
        question: "Kommt Design immer vor der Entwicklung?",
        answer: "In den meisten Projekten ja — das vermeidet teure Nacharbeit, nachdem bereits Code geschrieben wurde.",
      },
      {
        question: "Stellen Sie die Quelldateien bereit?",
        answer: "Ja, Sie erhalten organisierte Figma-Dateien, nicht nur exportierte Bilder.",
      },
    ],
  },
  "seo-growth": {
    slug: "seo-wachstum",
    title: "SEO & Wachstum",
    positioning: "Eine solide technische Grundlage, um gefunden zu werden — ohne unrealistische Rankingversprechen.",
    description:
      "Wir bauen die technischen Grundlagen für SEO auf — Struktur, Metadaten, Performance, strukturierte Daten — und ein ehrliches Ergebnis-Tracking, ohne Praktiken, die Ihre Website gefährden.",
    problems: [
      "Eine Website, die bei Suchen zu Ihrem Geschäft unsichtbar ist",
      "Fehlende oder doppelte Metadaten",
      "Eine langsame Website, die Ranking und Nutzererfahrung beeinträchtigt",
    ],
    deliverables: [
      "Vollständiges technisches SEO-Audit",
      "Korrekte Metadaten, strukturierte Daten und Sitemap",
      "Performance-Optimierung (Core Web Vitals)",
      "Reporting auf Basis echter Daten",
    ],
    capabilities: [
      "Technisches SEO (Struktur, Geschwindigkeit, Indexierung)",
      "Für Suchintention optimierte Inhalte",
      "Ranking- und Traffic-Tracking",
      "Mehrsprachiges SEO (hreflang, lokalisierte Inhalte)",
    ],
    industries: ["Websites", "E-Commerce", "Content-Plattformen"],
    faq: [
      {
        question: "Können Sie Platz 1 bei Google garantieren?",
        answer: "Nein, und wir wären skeptisch gegenüber jedem, der das verspricht. Wir schaffen eine gesunde technische Grundlage und tracken Ergebnisse ehrlich.",
      },
      {
        question: "Wie lange dauert es, bis ich Ergebnisse sehe?",
        answer: "SEO ist langfristige Arbeit — technische Effekte zeigen sich schnell, nachhaltiges Wachstum braucht mehrere Monate.",
      },
    ],
  },
  "backend-api": {
    slug: "backend-api",
    title: "Backend & API",
    positioning: "Solide, sichere Server-Grundlagen, bereit zu skalieren.",
    description:
      "Wir entwickeln die Serverlogik, Datenbanken und APIs, die Ihre Anwendungen zuverlässig laufen lassen — mit besonderem Fokus auf Sicherheit und Datenqualität.",
    problems: [
      "Eine Frontend-Anwendung ohne solide Serverlogik dahinter",
      "Schlecht strukturierte Daten, die jede Änderung erschweren",
      "Der Bedarf, Ihre Daten sicher für andere Systeme bereitzustellen",
    ],
    deliverables: [
      "Sichere, dokumentierte API",
      "Strukturierte, optimierte Datenbank",
      "Datenvalidierung an jedem Eingabepunkt",
      "Logging und Fehlerbehandlung",
    ],
    capabilities: [
      "Datenbankdesign",
      "REST- und GraphQL-APIs",
      "Authentifizierung und Rechteverwaltung",
      "Integration von Drittanbieter-Diensten",
    ],
    industries: ["SaaS-Plattformen", "Mobile Apps", "Interne Systeme"],
    faq: [
      {
        question: "Können Sie mit einer bestehenden Datenbank arbeiten?",
        answer: "Ja, wir können eine bestehende Datenbank nach einem Audit übernehmen oder je nach Projekt eine neue entwerfen.",
      },
      {
        question: "Wie wird Sicherheit berücksichtigt?",
        answer: "Eingabevalidierung, Authentifizierung und Rechte werden in die Architektur eingeplant, nicht am Ende ergänzt.",
      },
    ],
  },
  "cloud-infrastructure": {
    slug: "cloud-infrastruktur",
    title: "Cloud & Infrastruktur",
    positioning: "Zuverlässige Infrastruktur, die Sie nicht an einen einzigen Anbieter bindet.",
    description:
      "Wir richten Hosting, Continuous Deployment und Monitoring für Ihre Anwendungen ein — mit einer Architektur, die portabel bleibt, statt an einen Anbieter gebunden zu sein.",
    problems: [
      "Manuelles Deployment, das fehleranfällig ist und Ausfallzeiten verursacht",
      "Infrastruktur, die zu stark von einem einzigen Anbieter abhängt",
      "Keine Sichtbarkeit bei einem Ausfall oder einer Verlangsamung",
    ],
    deliverables: [
      "Automatisiertes, sicheres Deployment",
      "Monitoring und Vorfallsbenachrichtigungen",
      "Automatische Datensicherungen",
      "Infrastrukturdokumentation",
    ],
    capabilities: [
      "Hosting und Continuous Deployment",
      "Performance- und Fehler-Monitoring",
      "Portable Architektur (nicht an eine Cloud gebunden)",
      "Backups und Wiederherstellungspläne",
    ],
    industries: ["SaaS-Plattformen", "Anwendungen mit hohem Traffic", "Kritische Systeme"],
    faq: [
      {
        question: "Sind wir an einen bestimmten Cloud-Anbieter gebunden?",
        answer: "Nein, wir gestalten die Architektur portabel, um eine Bindung an einen einzigen Anbieter zu vermeiden.",
      },
      {
        question: "Was passiert bei einem Ausfall?",
        answer: "Das eingerichtete Monitoring erkennt einen Vorfall schnell, sodass er behoben werden kann, bevor er Ihre Nutzer dauerhaft beeinträchtigt.",
      },
    ],
  },
  "maintenance-support": {
    slug: "wartung-support",
    title: "Wartung & Support",
    positioning: "Eine Website oder App, die dauerhaft zuverlässig, sicher und aktuell bleibt.",
    description:
      "Wir übernehmen die technische Wartung Ihrer Website oder App nach dem Launch — Sicherheitsupdates, Fehlerbehebungen, kleine Weiterentwicklungen —, damit das Ergebnis langfristig zuverlässig bleibt.",
    problems: [
      "Eine Website, die nach dem Launch sich selbst überlassen bleibt",
      "Sicherheitsupdates, die nie eingespielt werden",
      "Kein technischer Ansprechpartner bei einem Problem",
    ],
    deliverables: [
      "Regelmäßige Sicherheitsupdates",
      "Fehlerbehebungen und kleine Weiterentwicklungen",
      "Verfügbarkeitsüberwachung",
      "Regelmäßiger Aktivitätsbericht",
    ],
    capabilities: [
      "Korrektive und weiterentwickelnde Wartung",
      "Sicherheits- und Performance-Monitoring",
      "Regelmäßige Backups",
      "Reaktionsschneller technischer Support",
    ],
    industries: ["Websites", "E-Commerce", "Business-Anwendungen"],
    faq: [
      {
        question: "Ist Wartung nach einem Projekt verpflichtend?",
        answer: "Nein, aber für alles öffentlich Zugängliche dringend empfohlen, um ungepatchte Sicherheitslücken zu vermeiden.",
      },
      {
        question: "Kann ich im Rahmen der Wartung kleine Weiterentwicklungen anfragen?",
        answer: "Ja, Wartungspakete beinhalten in der Regel ein Kontingent kleinerer Änderungen — die Details legen wir gemeinsam fest.",
      },
    ],
  },
};
