"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Readiness = 0 | 1 | 2;
type ReviewMode = "express" | "technique" | "complet";

type InterviewDomain = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  level: "MAÎTRISER" | "RAPPELER";
  accent: string;
  mustKnow: string[];
  sayIt: string;
  likelyQuestions: string[];
  proof: string;
  trap: string;
};

const STORAGE_KEY = "spring-lab-interview-readiness";

const domains: InterviewDomain[] = [
  {
    id: "spring",
    number: "01",
    title: "Java & Spring Boot",
    subtitle: "Le socle sur lequel on va te challenger",
    level: "MAÎTRISER",
    accent: "Core",
    mustKnow: [
      "IoC, cycle de vie des beans, injection par constructeur et auto-configuration Spring Boot.",
      "Architecture Controller → Application Service → Domain → Repository, avec des frontières claires.",
      "REST : validation, ProblemDetail, pagination, idempotence, versionnement et statuts HTTP.",
      "JPA : transactions, lazy loading, N+1, verrous, migrations Flyway et tests Testcontainers.",
      "Sécurité JWT/OAuth2, Actuator, métriques Micrometer et résilience des appels distants.",
    ],
    sayIt:
      "Spring Boot assemble des composants conditionnellement à partir du classpath, de la configuration et des beans déjà déclarés. Je garde les contrôleurs fins, les règles dans le domaine ou les services applicatifs, et les transactions aux frontières des cas d’usage.",
    likelyQuestions: [
      "Que fait réellement @SpringBootApplication ?",
      "Où places-tu @Transactional et pourquoi ?",
      "Comment évites-tu un N+1 ou un double traitement ?",
    ],
    proof:
      "Relie chaque réponse au service de synchronisation de tickets : responsabilité métier, API, file de messages, tests et observabilité.",
    trap:
      "Ne récite pas les annotations. Explique le modèle mental, les compromis et comment tu vérifies le comportement.",
  },
  {
    id: "architecture",
    number: "02",
    title: "Architecture & systèmes distribués",
    subtitle: "Prouver que tu sais choisir, pas seulement construire",
    level: "MAÎTRISER",
    accent: "Senior",
    mustKnow: [
      "Monolithe modulaire d’abord ; microservices quand les frontières, l’autonomie ou la charge le justifient.",
      "REST pour une réponse immédiate ; messaging pour découpler, absorber la charge et reprendre après incident.",
      "Timeout, retry avec backoff, circuit breaker, idempotency key, DLQ et réconciliation.",
      "Outbox pour aligner transaction métier et intention de publier un événement.",
      "ADR, C4, SLO et critères mesurables pour rendre un choix d’architecture vérifiable.",
    ],
    sayIt:
      "Je ne choisis pas les microservices pour la scalabilité par réflexe. Je vérifie d’abord les domaines, les équipes, les profils de charge et le coût opérationnel. Je migre progressivement, avec observabilité et possibilité de rollback.",
    likelyQuestions: [
      "Pourquoi avoir quitté le monolithe ?",
      "REST ou événement : comment décides-tu ?",
      "Comment gères-tu une livraison de message en double ?",
    ],
    proof:
      "Ton exemple ACSP est fort si tu précises ton rôle, le découpage, le chemin de migration et un résultat observable.",
    trap:
      "« Chaque service est indépendant » ne suffit pas : parle ownership des données, cohérence éventuelle et pannes partielles.",
  },
  {
    id: "react",
    number: "03",
    title: "React & TypeScript",
    subtitle: "Rendre le frontend prévisible et maintenable",
    level: "MAÎTRISER",
    accent: "Web",
    mustKnow: [
      "Rendu, reconciliation, état local vs serveur, hooks et dépendances d’effets.",
      "Composition des composants, séparation UI/logique et gestion des formulaires.",
      "TypeScript strict : unions discriminées, generics, unknown plutôt que any.",
      "Performance mesurée : memoization ciblée, virtualisation, code splitting et Web Vitals.",
      "Tests de comportement avec Testing Library et parcours critiques en E2E.",
    ],
    sayIt:
      "Je garde l’état au plus près de son usage, je dérive ce qui peut l’être et je réserve les effets à la synchronisation avec un système externe. J’optimise après mesure, pas par réflexe.",
    likelyQuestions: [
      "Quand un composant se re-render ?",
      "useMemo et useCallback : quand sont-ils utiles ?",
      "Comment types-tu un état avec plusieurs variantes ?",
    ],
    proof:
      "Prépare un écran React réel : besoin produit, découpage, gestion d’état, tests, performance et résultat.",
    trap:
      "Ne dis pas « je maîtrise React » sans montrer une décision précise et son effet sur le produit.",
  },
  {
    id: "mobile",
    number: "04",
    title: "React Native",
    subtitle: "La zone à consolider avant l’entretien",
    level: "MAÎTRISER",
    accent: "Mobile",
    mustKnow: [
      "React calcule l’arbre ; React Native rend des vues natives, pas un DOM HTML.",
      "Nouvelle architecture : JSI, Fabric pour le rendu et TurboModules pour les modules natifs.",
      "JS thread, UI thread, animations, listes virtualisées et sources de blocage.",
      "Expo/EAS, builds signés, permissions, deep links, crash reporting et publication stores.",
      "Performance : FlatList bien configurée, images, navigation, re-renders et profiling.",
    ],
    sayIt:
      "Mon expérience est surtout sur la réalisation de vues TypeScript et la livraison via Expo/EAS. Je connais les contraintes mobiles — threads, rendu natif, permissions et stores — et je suis prêt à approfondir les modules natifs selon le produit.",
    likelyQuestions: [
      "Quelle différence entre React Web et React Native ?",
      "À quoi servent Fabric et JSI ?",
      "Comment diagnostiques-tu une liste qui saccade ?",
    ],
    proof:
      "Cite précisément ce que tu as livré : écrans, navigation, intégration API, build Expo et niveau d’implication sur les stores.",
    trap:
      "Ne confonds pas Virtual DOM et Shadow Tree, et ne sur-vends pas ton niveau natif. Une réponse calibrée inspire plus confiance.",
  },
  {
    id: "data",
    number: "05",
    title: "PostgreSQL & data",
    subtitle: "Faire parler ta migration MSSQL → PostgreSQL",
    level: "MAÎTRISER",
    accent: "Data",
    mustKnow: [
      "Index B-tree/composite/partiel, ordre des colonnes et lecture d’un EXPLAIN ANALYZE.",
      "ACID, niveaux d’isolation, verrous optimistes/pessimistes et deadlocks.",
      "Migration progressive : inventaire, mapping de types, double validation et cutover réversible.",
      "Contraintes en base, migrations versionnées, sauvegardes et stratégie de rollback.",
      "Connection pooling, requêtes lentes, N+1 et métriques utiles.",
    ],
    sayIt:
      "La migration ne se limite pas à changer le moteur : je sécurise la compatibilité des types et requêtes, je mesure les écarts, je répète le cutover et je garde un plan de retour.",
    likelyQuestions: [
      "Comment as-tu évité une interruption pendant la migration ?",
      "Pourquoi un index composite n’est-il pas toujours utilisé ?",
      "Comment enquêtes-tu sur une requête lente ?",
    ],
    proof:
      "Prépare les volumes, la durée, le temps d’arrêt, les incidents évités et le gain réel. Utilise uniquement tes vrais chiffres.",
    trap:
      "« PostgreSQL est open source avec une grande communauté » n’est pas une justification d’architecture suffisante.",
  },
  {
    id: "delivery",
    number: "06",
    title: "Docker, Kubernetes & CI/CD",
    subtitle: "Montrer que tu sais opérer ce que tu livres",
    level: "RAPPELER",
    accent: "Platform",
    mustKnow: [
      "Image multi-stage, utilisateur non-root, petite surface d’attaque et configuration externe.",
      "Readiness ≠ liveness ; requests/limits, graceful shutdown et rolling update.",
      "ConfigMap vs Secret, Deployment, Service, Ingress et autoscaling.",
      "Pipeline GitLab : lint, tests, SAST, build immuable, scan, déploiement et smoke tests.",
      "Rollback, progressive delivery, métriques de déploiement et séparation des environnements.",
    ],
    sayIt:
      "Le pipeline produit une fois un artefact immuable, le qualifie, puis promeut ce même artefact. Kubernetes ne répare pas une mauvaise application : je lui fournis des probes sincères, des ressources réalistes et un arrêt gracieux.",
    likelyQuestions: [
      "Pourquoi séparer readiness et liveness ?",
      "Que se passe-t-il si un déploiement échoue ?",
      "Comment sécurises-tu la chaîne CI/CD ?",
    ],
    proof:
      "Ta MCO est différenciante : raconte un incident, le signal reçu, le diagnostic, la mitigation et la prévention.",
    trap:
      "Prometheus collecte des métriques. Pour les logs, parle plutôt d’ELK/OpenSearch ou Loki ; Grafana visualise les sources.",
  },
  {
    id: "ai",
    number: "07",
    title: "AI-Driven Engineering",
    subtitle: "Passer de l’assistant de code à un système maîtrisé",
    level: "MAÎTRISER",
    accent: "AI",
    mustKnow: [
      "Cas d’usage borné, contexte minimal, sortie structurée et validation déterministe.",
      "Tests, lint, revue humaine et politique d’autorisation avant toute mutation sensible.",
      "Évaluations sur un jeu de cas versionné : qualité, régression, latence et coût.",
      "RAG pour les connaissances privées/à jour ; fine-tuning pour un comportement répétitif spécialisé.",
      "Protection des données, prompt injection, traçabilité, fallback et budget de tokens.",
    ],
    sayIt:
      "J’utilise l’IA comme un accélérateur sous contrôle : le modèle propose, les outils déterministes vérifient et l’humain reste responsable. En production, je mesure la qualité sur des cas réels et je limite explicitement les permissions.",
    likelyQuestions: [
      "Comment prouves-tu qu’un agent améliore la qualité ?",
      "Comment empêches-tu une action dangereuse ?",
      "Quand choisis-tu RAG plutôt que fine-tuning ?",
    ],
    proof:
      "V-A-I-D-E peut devenir ton meilleur exemple : précise l’orchestration, les garde-fous, les évaluations et un gain mesuré — sans inventer.",
    trap:
      "« Je relis chaque ligne » est utile mais insuffisant : ajoute sandbox, tests, limites d’outils, logs et critères d’acceptation.",
  },
  {
    id: "leadership",
    number: "08",
    title: "Posture de confirmé",
    subtitle: "Produit, design, revue et accompagnement",
    level: "RAPPELER",
    accent: "Impact",
    mustKnow: [
      "Transformer un besoin flou en hypothèses, parcours, critères d’acceptation et incréments livrables.",
      "Arbitrer valeur, délai, risque, performance et dette avec des critères explicites.",
      "Faire une revue de code qui protège le produit et fait progresser l’auteur.",
      "Accompagner un junior par contexte, questions, pairing et feedback actionnable.",
      "Documenter les décisions et s’engager sur la décision collective.",
    ],
    sayIt:
      "Mon rôle n’est pas seulement de produire du code. Je réduis l’incertitude, j’explicite les compromis et je crée les conditions pour que l’équipe livre vite sans rendre la suite plus lente.",
    likelyQuestions: [
      "Comment gères-tu un désaccord technique ?",
      "Comment fais-tu progresser un junior ?",
      "Que sacrifies-tu pour sortir un MVP ?",
    ],
    proof:
      "L’exemple ServiceNow ↔ ERP montre bien les ateliers métier, le mapping, l’architecture et la mise en production.",
    trap:
      "Ne reste pas dans les principes. Donne une décision, ce que tu as changé et l’impact pour l’équipe ou l’utilisateur.",
  },
];

const stories = [
  {
    label: "Architecture",
    title: "Découper le legacy sans casser la production",
    situation:
      "Une plateforme très utilisée, un monolithe legacy et une base MSSQL devenue difficile à faire évoluer.",
    action:
      "J’ai clarifié les domaines, isolé progressivement les capacités, choisi REST pour les besoins synchrones et la messagerie pour les traitements longs. J’ai accompagné la migration PostgreSQL avec tests, observabilité et déploiement progressif.",
    result:
      "La réponse est crédible si tu ajoutes tes vrais chiffres : volume, disponibilité, délai de livraison ou baisse d’incidents.",
    followUp:
      "Prépare : première brique extraite, ownership des données, idempotence, rollback et principal compromis.",
  },
  {
    label: "Produit",
    title: "Synchroniser ServiceNow et l’ERP Axians",
    situation:
      "Les équipes avaient besoin de garder statuts, commentaires, pièces jointes et équipements cohérents entre deux systèmes.",
    action:
      "J’ai animé le cadrage du mapping, validé les scénarios particuliers avec le métier, conçu l’API et la synchronisation, puis ajouté tests, logs, métriques et mécanismes de reprise.",
    result:
      "La synchronisation a été mise en production sur plusieurs types de tickets avec un suivi opérationnel.",
    followUp:
      "Prépare : conflit de mise à jour, source de vérité, doublons, ordre des événements et données personnelles.",
  },
  {
    label: "IA",
    title: "Industrialiser l’IA avec V-A-I-D-E",
    situation:
      "Accélérer le développement sans déléguer aveuglément les décisions d’architecture ni exposer des données sensibles.",
    action:
      "Présente le flux réel : contexte donné au modèle, outils autorisés, sortie attendue, tests automatiques, revue humaine et journalisation. Ajoute un fallback seulement si tu l’as réellement implémenté.",
    result:
      "Mesure un résultat honnête : temps gagné sur une tâche, défauts détectés ou couverture ajoutée.",
    followUp:
      "Prépare : évaluation, confidentialité, coût, prompt injection, hallucination et décision de ne pas utiliser l’IA.",
  },
];

const flashcards = [
  {
    question: "Un POST a réussi côté partenaire mais ta réponse a expiré. Tu fais quoi ?",
    answer:
      "Je ne retry pas aveuglément. J’utilise une clé d’idempotence et un identifiant métier stable, puis je réconcilie l’état si l’issue reste inconnue.",
  },
  {
    question: "Pourquoi @Transactional ne rend pas un appel REST atomique ?",
    answer:
      "La transaction couvre la ressource transactionnelle locale, typiquement PostgreSQL. L’appel distant peut réussir puis la DB rollback. Outbox, saga ou réconciliation gèrent cette frontière.",
  },
  {
    question: "Quand garder un monolithe modulaire ?",
    answer:
      "Quand l’équipe, la charge et le domaine ne justifient pas le coût distribué. Des modules et contrats clairs donnent déjà beaucoup d’autonomie.",
  },
  {
    question: "Readiness ou liveness si PostgreSQL est temporairement indisponible ?",
    answer:
      "Readiness : on retire le pod du trafic. Redémarrer la JVM via liveness ne réparera généralement pas la base externe.",
  },
  {
    question: "Que fait l’index PostgreSQL sur (tenant_id, created_at) ?",
    answer:
      "Il aide surtout les requêtes filtrant par tenant_id, éventuellement puis par date. L’ordre dépend des prédicats, de la sélectivité et du tri ; je confirme avec EXPLAIN ANALYZE.",
  },
  {
    question: "React Native utilise-t-il le DOM ?",
    answer:
      "Non. React produit un arbre de composants qui est rendu en vues natives. Fabric est le renderer de la nouvelle architecture ; JSI facilite les échanges directs avec le natif.",
  },
  {
    question: "Comment évaluer un workflow LLM ?",
    answer:
      "Avec un jeu de cas versionné et des critères métier : exactitude, taux de tâche réussie, régression, latence, coût et escalade humaine.",
  },
  {
    question: "Que regardes-tu en premier dans une code review ?",
    answer:
      "Le comportement et le risque : besoin couvert, cas limites, sécurité, données et tests. Puis lisibilité, conception et détails de style automatisables.",
  },
];

const statusLabels = ["À revoir", "Je peux l’expliquer", "Maîtrisé"] as const;

function readSavedReadiness(): Record<string, Readiness> {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!stored || typeof stored !== "object") return {};
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([key, value]) =>
          domains.some((domain) => domain.id === key) &&
          (value === 0 || value === 1 || value === 2),
      ),
    ) as Record<string, Readiness>;
  } catch {
    return {};
  }
}

function buildSummary(
  mode: ReviewMode,
  readiness: Record<string, Readiness>,
) {
  const weakDomains = domains
    .filter((domain) => (readiness[domain.id] ?? 0) < 2)
    .map((domain) => domain.title);

  const intro =
    "FULLSTACK CONFIRMÉ — RÉSUMÉ ENTRETIEN\n\n" +
    "Pitch : développeur fullstack avec plus de 5 ans d’expérience, orienté produit et production. Mes preuves fortes sont la modernisation d’une plateforme legacy, la synchronisation ServiceNow ↔ ERP et l’intégration pragmatique de l’IA dans le delivery.";

  const express =
    "\n\nMES 6 RAPPELS\n" +
    "1. Répondre en Contexte → Décision → Action → Résultat → Recul.\n" +
    "2. Donner mon rôle exact et un vrai chiffre ; ne jamais inventer.\n" +
    "3. Microservices seulement avec une raison mesurable et un coût assumé.\n" +
    "4. Prometheus = métriques ; ELK/Loki = logs ; Grafana = visualisation.\n" +
    "5. React Native rend des vues natives : Fabric, JSI, TurboModules.\n" +
    "6. IA : sortie structurée, permissions minimales, tests, evals et validation humaine.";

  if (mode === "express") return `${intro}${express}`;

  const technique =
    "\n\nCHECKLIST TECHNIQUE\n" +
    domains
      .map(
        (domain) =>
          `• ${domain.title} — ${domain.mustKnow.slice(0, 2).join(" ")}`,
      )
      .join("\n");

  if (mode === "technique") return `${intro}${express}${technique}`;

  const storiesSummary =
    "\n\nPREUVES À RACONTER\n" +
    stories
      .map(
        (story, index) =>
          `${index + 1}. ${story.title} — ${story.action} ${story.result}`,
      )
      .join("\n");
  const priorities =
    weakDomains.length > 0
      ? `\n\nPRIORITÉS RESTANTES\n${weakDomains.map((item) => `• ${item}`).join("\n")}`
      : "\n\nPRIORITÉS RESTANTES\nTous les domaines sont marqués comme maîtrisés. Fais une dernière répétition à voix haute.";

  return `${intro}${express}${technique}${storiesSummary}${priorities}`;
}

export default function InterviewPage() {
  const [readiness, setReadiness] = useState<Record<string, Readiness>>({});
  const [filter, setFilter] = useState<"TOUT" | InterviewDomain["level"]>(
    "TOUT",
  );
  const [summaryMode, setSummaryMode] = useState<ReviewMode>("express");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setReadiness(readSavedReadiness());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const points = domains.reduce(
    (total, domain) => total + (readiness[domain.id] ?? 0),
    0,
  );
  const progress = Math.round((points / (domains.length * 2)) * 100);
  const visibleDomains = domains.filter(
    (domain) => filter === "TOUT" || domain.level === filter,
  );
  const summary = buildSummary(summaryMode, readiness);

  function updateReadiness(id: string, value: Readiness) {
    const next = { ...readiness, [id]: value };
    setReadiness(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="interview-page">
      <header className="interview-header">
        <Link className="brand" href="/" aria-label="Retour à Spring Boot Lab">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>Spring Boot Lab</span>
        </Link>

        <nav className="interview-nav" aria-label="Navigation entretien">
          <a href="#diagnostic">Diagnostic</a>
          <a href="#mastery">Maîtrise</a>
          <a href="#stories">Preuves</a>
          <a href="#summary">Résumé</a>
        </nav>

        <Link className="back-to-lab" href="/">
          Lab Spring <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <div className="interview-shell">
        <section className="interview-hero" id="top">
          <div className="interview-hero-copy">
            <p className="interview-eyebrow">
              Entretien 2 <span>•</span> Fullstack confirmé
            </p>
            <h1>
              Arrive avec des <em>preuves.</em>
              <br />
              Repartez avec le poste.
            </h1>
            <p className="interview-lead">
              Ta fiche de révision construite à partir de la fiche de poste et
              de ton premier entretien IA. Maîtrise les décisions, rappelle-toi
              les détails, puis entraîne-toi à les dire clairement.
            </p>

            <div className="interview-actions">
              <a className="interview-primary" href="#mastery">
                Commencer la révision <span aria-hidden="true">→</span>
              </a>
              <a className="interview-secondary" href="#summary">
                Résumé 5 minutes
              </a>
            </div>

            <div className="interview-stats" aria-label="Contenu de la révision">
              <span>
                <strong>08</strong>
                domaines
              </span>
              <span>
                <strong>03</strong>
                preuves STAR
              </span>
              <span>
                <strong>08</strong>
                flashcards
              </span>
            </div>
          </div>

          <aside className="signal-card" id="diagnostic">
            <div className="signal-card-topline">
              <span>Analyse du 1er entretien</span>
              <i>LIVE</i>
            </div>
            <h2>Ton signal est bon. Rends-le incontestable.</h2>

            <div className="signal-list">
              <div>
                <span className="signal-icon is-positive">+</span>
                <p>
                  <strong>Crédibilité senior</strong>
                  Architecture, migration, MCO et collaboration métier donnent
                  de vraies preuves.
                </p>
              </div>
              <div>
                <span className="signal-icon is-warning">!</span>
                <p>
                  <strong>Réponses trop générales</strong>
                  Remplace « je maîtrise très bien » par rôle, décision, résultat
                  et chiffre.
                </p>
              </div>
              <div>
                <span className="signal-icon is-warning">!</span>
                <p>
                  <strong>Deux imprécisions à corriger</strong>
                  Prometheus ne stocke pas les logs. React Native ne rend pas un
                  DOM web.
                </p>
              </div>
            </div>

            <div className="readiness-meter">
              <div>
                <span>Préparation déclarée</span>
                <strong>{progress}%</strong>
              </div>
              <span className="readiness-track">
                <i style={{ width: `${progress}%` }} />
              </span>
              <small>Mets à jour chaque domaine après une réponse à voix haute.</small>
            </div>
          </aside>
        </section>

        <section className="mastery-section" id="mastery">
          <div className="interview-section-heading">
            <div>
              <p className="interview-kicker">Matrice de préparation</p>
              <h2>Ce que tu dois maîtriser. Ce qu’il suffit de rappeler.</h2>
            </div>
            <p>
              Ouvre un domaine, réponds aux questions sans lire, puis évalue ton
              niveau honnêtement.
            </p>
          </div>

          <div className="mastery-toolbar">
            <div className="mastery-filters" aria-label="Filtrer les domaines">
              {(["TOUT", "MAÎTRISER", "RAPPELER"] as const).map((item) => (
                <button
                  className={filter === item ? "is-active" : ""}
                  key={item}
                  type="button"
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item === "TOUT" ? "Tout voir" : item.toLowerCase()}
                </button>
              ))}
            </div>
            <span>{visibleDomains.length} domaines affichés</span>
          </div>

          <div className="mastery-grid">
            {visibleDomains.map((domain, index) => {
              const currentLevel = readiness[domain.id] ?? 0;
              return (
                <details className="mastery-card" key={domain.id} open={index === 0}>
                  <summary>
                    <span className="mastery-number">{domain.number}</span>
                    <span className="mastery-title">
                      <span>
                        <i>{domain.level}</i>
                        <small>{domain.accent}</small>
                      </span>
                      <strong>{domain.title}</strong>
                      <em>{domain.subtitle}</em>
                    </span>
                    <span
                      className={`mastery-status level-${currentLevel}`}
                      aria-label={`Niveau : ${statusLabels[currentLevel]}`}
                    >
                      {currentLevel === 2 ? "✓" : currentLevel === 1 ? "◐" : "○"}
                    </span>
                  </summary>

                  <div className="mastery-content">
                    <div className="mastery-columns">
                      <div>
                        <h3>À savoir expliquer</h3>
                        <ul>
                          {domain.mustKnow.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <aside>
                        <span>Ta réponse en 30 secondes</span>
                        <p>« {domain.sayIt} »</p>
                      </aside>
                    </div>

                    <div className="question-strip">
                      <div>
                        <span>Questions probables</span>
                        {domain.likelyQuestions.map((question) => (
                          <p key={question}>{question}</p>
                        ))}
                      </div>
                      <div>
                        <span>Preuve à utiliser</span>
                        <p>{domain.proof}</p>
                      </div>
                      <div className="trap-box">
                        <span>Piège à éviter</span>
                        <p>{domain.trap}</p>
                      </div>
                    </div>

                    <div className="level-picker">
                      <span>Après une répétition à voix haute :</span>
                      <div>
                        {statusLabels.map((label, value) => (
                          <button
                            className={currentLevel === value ? "is-selected" : ""}
                            key={label}
                            type="button"
                            aria-pressed={currentLevel === value}
                            onClick={() =>
                              updateReadiness(domain.id, value as Readiness)
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="answer-method">
          <div>
            <p className="interview-kicker">Cadre de réponse</p>
            <h2>Une réponse senior tient en cinq mouvements.</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <strong>Contexte</strong>
              <p>Le problème, l’échelle et la contrainte.</p>
            </li>
            <li>
              <span>02</span>
              <strong>Décision</strong>
              <p>Ton choix et les options écartées.</p>
            </li>
            <li>
              <span>03</span>
              <strong>Action</strong>
              <p>Ce que toi, précisément, tu as fait.</p>
            </li>
            <li>
              <span>04</span>
              <strong>Résultat</strong>
              <p>Un chiffre réel ou un effet observable.</p>
            </li>
            <li>
              <span>05</span>
              <strong>Recul</strong>
              <p>Le compromis et ce que tu améliorerais.</p>
            </li>
          </ol>
        </section>

        <section className="stories-section" id="stories">
          <div className="interview-section-heading">
            <div>
              <p className="interview-kicker">Tes preuves</p>
              <h2>Trois histoires à savoir raconter sans notes.</h2>
            </div>
            <p>
              N’invente aucun KPI. Note tes vrais chiffres avant l’entretien :
              utilisateurs, volume, délai, disponibilité ou incidents.
            </p>
          </div>

          <div className="story-grid">
            {stories.map((story, index) => (
              <article className="story-card" key={story.title}>
                <div className="story-topline">
                  <span>0{index + 1}</span>
                  <i>{story.label}</i>
                </div>
                <h3>{story.title}</h3>
                <dl>
                  <div>
                    <dt>Situation</dt>
                    <dd>{story.situation}</dd>
                  </div>
                  <div>
                    <dt>Action</dt>
                    <dd>{story.action}</dd>
                  </div>
                  <div>
                    <dt>Résultat</dt>
                    <dd>{story.result}</dd>
                  </div>
                </dl>
                <p className="story-follow-up">
                  <span>Relance probable</span>
                  {story.followUp}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="flashcard-section">
          <div className="flashcard-intro">
            <p className="interview-kicker">Test de rappel</p>
            <h2>Réponds avant d’ouvrir.</h2>
            <p>
              Si tu bloques plus de 30 secondes, retourne au domaine associé et
              reformule avec tes propres mots.
            </p>
          </div>
          <div className="flashcard-list">
            {flashcards.map((card, index) => (
              <details key={card.question}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{card.question}</strong>
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{card.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="summary-section" id="summary">
          <div className="summary-copy">
            <p className="interview-kicker">Résumé dynamique</p>
            <h2>Ta fiche juste avant d’entrer.</h2>
            <p>
              Choisis la profondeur, copie la fiche dans tes notes ou imprime-la.
              Le résumé complet ajoute automatiquement tes domaines encore
              fragiles.
            </p>

            <div className="summary-modes" aria-label="Profondeur du résumé">
              {(
                [
                  ["express", "5 min"],
                  ["technique", "15 min"],
                  ["complet", "Complet"],
                ] as const
              ).map(([value, label]) => (
                <button
                  className={summaryMode === value ? "is-active" : ""}
                  key={value}
                  type="button"
                  aria-pressed={summaryMode === value}
                  onClick={() => setSummaryMode(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="summary-actions">
              <button type="button" onClick={copySummary}>
                {copied ? "Copié ✓" : "Copier le résumé"}
              </button>
              <button type="button" onClick={() => window.print()}>
                Imprimer
              </button>
            </div>
          </div>

          <article className="summary-paper" aria-live="polite">
            <div className="paper-topline">
              <span>SPRING BOOT LAB / INTERVIEW 101</span>
              <span>{summaryMode.toUpperCase()}</span>
            </div>
            <pre>{summary}</pre>
          </article>
        </section>

        <footer className="interview-footer">
          <p>
            <strong>Dernier rappel :</strong> ralentis, réponds à la question
            exacte, puis arrête-toi. La précision paraît plus senior que la
            quantité.
          </p>
          <a href="#top">Revenir en haut ↑</a>
        </footer>
      </div>
    </main>
  );
}
