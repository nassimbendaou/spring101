"use client";

import { useEffect, useMemo, useState } from "react";

type Quiz = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type CourseModule = {
  id: number;
  phase: string;
  title: string;
  duration: string;
  tag: string;
  summary: string;
  objectives: string[];
  mentalModel: string;
  code: string;
  task: string;
  deliverable: string;
  quiz: Quiz;
};

const STORAGE_KEY = "spring-boot-lab-progress";
const STUDY_DAYS_KEY = "spring-boot-lab-study-days";

const modules: CourseModule[] = [
  {
    id: 1,
    phase: "Fondations",
    title: "Remise à niveau Java moderne",
    duration: "35 min",
    tag: "Java 21",
    summary:
      "Révisez uniquement les fonctionnalités Java réellement utiles dans une application Spring moderne.",
    objectives: [
      "Utiliser les records pour des modèles de requête et de réponse immuables.",
      "Comprendre les expressions switch, le pattern matching et les hiérarchies sealed.",
      "Employer Optional et les streams sans masquer la logique métier.",
    ],
    mentalModel:
      "Java moderne réduit le code cérémoniel. Utilisez ses nouveaux outils pour rendre l’intention explicite, pas pour compresser chaque opération en une seule expression.",
    code: `public record CreateTicketRequest(
    @NotBlank String title,
    @NotNull Priority priority
) {}

sealed interface SyncResult
    permits Synced, Rejected {}

String label = switch (priority) {
    case HIGH -> "urgent";
    case MEDIUM, LOW -> "standard";
};`,
    task:
      "Remplacez un DTO de ticket mutable par un record. Ajoutez les annotations de validation et mappez-le vers une commande métier.",
    deliverable: "Un modèle d’entrée immuable validé et un mapper propre.",
    quiz: {
      question: "Quel est le meilleur cas d’usage d’un record Java dans une API Spring ?",
      options: [
        "Une entité JPA avec des relations chargées paresseusement",
        "Une valeur immuable de requête ou de réponse",
        "Un service mutable avec des dépendances injectées",
      ],
      answer: 1,
      explanation:
        "Les records sont parfaits pour transporter des valeurs. Les entités JPA ont généralement besoin d’une identité liée au cycle de vie, de proxies et d’une mutabilité contrôlée.",
    },
  },
  {
    id: 2,
    phase: "Fondations",
    title: "Le modèle mental de Spring",
    duration: "30 min",
    tag: "Core",
    summary:
      "Comprenez le conteneur, les beans, l’injection de dépendances et l’intérêt de l’injection par constructeur.",
    objectives: [
      "Expliquer l’IoC sans se limiter au vocabulaire des annotations.",
      "Distinguer la détection de composants de la configuration explicite des beans.",
      "Repérer les dépendances circulaires et le pattern Service Locator.",
    ],
    mentalModel:
      "Votre code déclare un graphe d’objets ; le conteneur Spring le construit et le gère. L’injection par constructeur rend chaque dépendance requise visible et testable.",
    code: `@Service
final class TicketSyncService {
    private final TicketRepository tickets;
    private final AcnClient acn;

    TicketSyncService(
        TicketRepository tickets,
        AcnClient acn
    ) {
        this.tickets = tickets;
        this.acn = acn;
    }
}`,
    task:
      "Dessinez le graphe Controller → Service → Repository + client d’API externe. Instanciez ensuite le service dans un test unitaire sans Spring.",
    deliverable: "Un graphe de dépendances sans injection par champ ni variable globale cachée.",
    quiz: {
      question: "Pourquoi préférer l’injection par constructeur à l’injection par champ ?",
      options: [
        "Elle rend les dépendances explicites et les objets testables sans conteneur",
        "Elle crée moins de beans Spring à l’exécution",
        "Elle rend automatiquement toutes les dépendances optionnelles",
      ],
      answer: 0,
      explanation:
        "L’injection par constructeur expose les collaborateurs requis, favorise l’immuabilité et permet aux tests de créer directement l’objet.",
    },
  },
  {
    id: 3,
    phase: "Boot",
    title: "Comment Spring Boot démarre réellement",
    duration: "35 min",
    tag: "Boot 4.1",
    summary:
      "Démystifiez les starters, l’auto-configuration, les conditions et la séquence de démarrage.",
    objectives: [
      "Décomposer ce que regroupe @SpringBootApplication.",
      "Expliquer l’auto-configuration conditionnelle et son mécanisme de retrait.",
      "Choisir des starters ciblés plutôt qu’un ensemble de dépendances inutile.",
    ],
    mentalModel:
      "Spring Boot est un assemblage conventionné, pas de la magie. Il observe le classpath, la configuration et les beans existants, puis applique des valeurs par défaut conditionnelles que vos beans peuvent remplacer.",
    code: `@SpringBootApplication
public class TicketApplication {
    public static void main(String[] args) {
        SpringApplication.run(
            TicketApplication.class, args
        );
    }
}

// Boot 4.1 : utiliser le starter MVC ciblé
// org.springframework.boot:
// spring-boot-starter-webmvc`,
    task:
      "Générez un projet avec Spring Initializr en utilisant Web MVC, Validation et Actuator. Lancez-le avec --debug et analysez le rapport d’évaluation des conditions.",
    deliverable: "Une application fonctionnelle et trois auto-configurations que vous savez expliquer.",
    quiz: {
      question: "Quand une auto-configuration se désactive-t-elle généralement ?",
      options: [
        "Dès qu’un profil est actif",
        "Quand l’application fournit son propre bean correspondant",
        "Uniquement quand @EnableAutoConfiguration est retirée",
      ],
      answer: 1,
      explanation:
        "De nombreux réglages Boot utilisent des conditions comme @ConditionalOnMissingBean : votre configuration explicite reste donc prioritaire.",
    },
  },
  {
    id: 4,
    phase: "Web",
    title: "API REST prêtes pour la production",
    duration: "50 min",
    tag: "MVC",
    summary:
      "Construisez des contrôleurs fins avec validation, contrats d’erreur stables et sémantique HTTP correcte.",
    objectives: [
      "Séparer les DTO de transport des modèles métier.",
      "Valider les entrées et mapper les exceptions de manière centralisée.",
      "Utiliser délibérément les statuts HTTP, l’idempotence et la pagination.",
    ],
    mentalModel:
      "Le contrôleur est un adaptateur. Il traduit HTTP en cas d’usage applicatif, puis restitue le résultat ; les règles métier restent ailleurs.",
    code: `@RestController
@RequestMapping("/api/tickets")
class TicketController {
    private final CreateTicket createTicket;

    @PostMapping
    ResponseEntity<TicketView> create(
        @Valid @RequestBody CreateTicketRequest body
    ) {
        var ticket = createTicket.handle(body);
        return ResponseEntity
            .created(URI.create("/api/tickets/" + ticket.id()))
            .body(TicketView.from(ticket));
    }
}`,
    task:
      "Créez POST /api/tickets et GET /api/tickets/{id}. Retournez ProblemDetail pour les erreurs de validation et de ressource introuvable.",
    deliverable: "Deux endpoints, un format d’erreur stable et des exemples curl.",
    quiz: {
      question: "Où doit vivre la règle « un ticket fermé ne peut pas être réaffecté » ?",
      options: [
        "Dans le client React",
        "Dans le contrôleur",
        "Dans le domaine ou le service applicatif",
      ],
      answer: 2,
      explanation:
        "C’est un invariant métier qui doit rester vrai que l’appelant soit HTTP, un consommateur de messages ou un test.",
    },
  },
  {
    id: 5,
    phase: "Données",
    title: "PostgreSQL et transactions",
    duration: "55 min",
    tag: "JPA",
    summary:
      "Modélisez les frontières de persistance, les transactions et le comportement des requêtes sans tomber dans les pièges de l’ORM.",
    objectives: [
      "Définir les frontières transactionnelles dans la couche service.",
      "Détecter les requêtes N+1 et les chargements paresseux risqués.",
      "Utiliser les migrations Flyway et les contraintes de base de données.",
    ],
    mentalModel:
      "JPA est une abstraction Unit of Work au-dessus de SQL, pas un remplacement de la compréhension de SQL. La base reste la garante finale de la cohérence.",
    code: `@Transactional
public Ticket assign(UUID id, UUID engineerId) {
    var ticket = tickets.findByIdForUpdate(id)
        .orElseThrow(TicketNotFound::new);

    ticket.assignTo(engineerId);
    return ticket;
}

// La migration porte la contrainte réelle :
// alter table ticket
// add constraint ticket_title_not_blank ...`,
    task:
      "Persistez les tickets dans PostgreSQL, ajoutez une migration Flyway et démontrez le rollback lorsque l’écriture du mapping externe échoue.",
    deliverable: "Une migration de schéma, une requête repository et un test transactionnel.",
    quiz: {
      question: "Que définit principalement @Transactional ?",
      options: [
        "Une entrée de cache",
        "Une frontière atomique de cohérence",
        "Une politique de retry REST",
      ],
      answer: 1,
      explanation:
        "Elle regroupe les opérations de base de données dans une frontière transactionnelle. Elle ne rend pas les appels d’API distants atomiques avec votre base.",
    },
  },
  {
    id: 6,
    phase: "Qualité",
    title: "Des tests qui inspirent confiance",
    duration: "50 min",
    tag: "JUnit 5",
    summary:
      "Utilisez des tests unitaires rapides, des slices Spring ciblées et des tests d’intégration réalistes avec Testcontainers.",
    objectives: [
      "Savoir quand ne pas utiliser @SpringBootTest.",
      "Tester MVC, la persistance et la logique métier dans la bonne couche.",
      "Exécuter des tests d’intégration PostgreSQL avec Testcontainers.",
    ],
    mentalModel:
      "Choisissez le plus petit environnement de test capable d’invalider le comportement. Un contexte complet n’est utile que lorsque le câblage Spring fait partie du risque.",
    code: `@WebMvcTest(TicketController.class)
class TicketControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean CreateTicket createTicket;

    @Test
    void rejects_blank_title() throws Exception {
        mvc.perform(post("/api/tickets")
            .contentType(APPLICATION_JSON)
            .content("""{"title":""}"""))
            .andExpect(status().isBadRequest());
    }
}`,
    task:
      "Écrivez un test unitaire pur, un @WebMvcTest et un test PostgreSQL avec Testcontainers pour le même parcours de ticket.",
    deliverable: "Une suite de tests en trois couches avec une responsabilité d’échec claire.",
    quiz: {
      question: "Quel est le meilleur test par défaut pour une règle tarifaire pure ?",
      options: [
        "Un test JUnit simple sans contexte Spring",
        "Un @SpringBootTest avec un vrai serveur web",
        "@DataJpaTest",
      ],
      answer: 0,
      explanation:
        "La logique métier pure doit être testée comme un objet normal. Démarrer Spring ajouterait du temps sans augmenter la confiance.",
    },
  },
  {
    id: 7,
    phase: "Exploitation",
    title: "Une configuration sans surprise",
    duration: "35 min",
    tag: "Config",
    summary:
      "Gérez en sécurité les profils, propriétés typées, secrets et différences entre environnements.",
    objectives: [
      "Regrouper les réglages avec @ConfigurationProperties.",
      "Utiliser les profils avec parcimonie et garder les secrets hors de Git.",
      "Valider la configuration obligatoire au démarrage.",
    ],
    mentalModel:
      "La configuration est une entrée de votre application. Analysez-la et validez-la à la frontière, comme une requête HTTP.",
    code: `@ConfigurationProperties("acn.client")
@Validated
public record AcnClientProperties(
    @NotBlank URI baseUrl,
    @NotNull Duration timeout,
    @Min(0) int maxRetries
) {}

# application.yaml
acn.client.timeout: 2s`,
    task:
      "Créez des propriétés typées pour un client d’API externe. Faites échouer le démarrage avec une erreur lisible lorsque baseUrl est absente.",
    deliverable: "Une configuration validée avec des exemples locaux et de production.",
    quiz: {
      question: "Où doit être stocké le secret d’une API de production ?",
      options: [
        "Dans application-prod.yaml versionné",
        "Dans un gestionnaire de secrets externe ou injecté par l’environnement",
        "Dans une constante Java",
      ],
      answer: 1,
      explanation:
        "Les secrets doivent être fournis à l’exécution via une gestion contrôlée, jamais versionnés avec le code source.",
    },
  },
  {
    id: 8,
    phase: "Sécurité",
    title: "Sécurité et JWT",
    duration: "55 min",
    tag: "OAuth2",
    summary:
      "Sécurisez une API stateless avec une chaîne de filtres explicite et des règles d’autorisation.",
    objectives: [
      "Séparer l’authentification de l’autorisation.",
      "Configurer un resource server JWT.",
      "Appliquer l’autorisation sur les méthodes et endpoints sans propager les claims partout.",
    ],
    mentalModel:
      "L’authentification prouve l’identité ; l’autorisation décide des permissions. Gardez l’analyse du token à la frontière de sécurité et transmettez une identité utile aux cas d’usage.",
    code: `@Bean
SecurityFilterChain api(HttpSecurity http)
    throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth -> oauth.jwt())
        .build();
}`,
    task:
      "Protégez les endpoints de tickets avec JWT tout en gardant les health checks publics. Ajoutez un test d’autorisation.",
    deliverable: "Une SecurityFilterChain et des tests de cas authentifié et interdit.",
    quiz: {
      question: "Que doit retourner une API pour un utilisateur authentifié mais non autorisé ?",
      options: ["401 Unauthorized", "403 Forbidden", "Toujours 404"],
      answer: 1,
      explanation:
        "401 indique une authentification absente ou invalide. 403 signifie que l’identité est connue mais que l’action n’est pas autorisée.",
    },
  },
  {
    id: 9,
    phase: "Intégration",
    title: "Systèmes externes et événements",
    duration: "60 min",
    tag: "Résilience",
    summary:
      "Intégrez REST et la messagerie avec timeouts, idempotence et frontières conscientes des pannes.",
    objectives: [
      "Configurer explicitement les timeouts de connexion et de lecture.",
      "Rendre les consommateurs et les commandes idempotents.",
      "Utiliser une outbox lorsque l’état de la base et les événements doivent rester cohérents.",
    ],
    mentalModel:
      "Le réseau est une frontière de panne partielle. Chaque appel distant exige un budget temps, une décision de retry et une stratégie de gestion des doublons.",
    code: `@Service
class AcnTicketGateway {
    private final RestClient client;

    SyncResponse send(SyncCommand command) {
        return client.post()
            .uri("/tickets")
            .header("Idempotency-Key", command.id().toString())
            .body(command)
            .retrieve()
            .body(SyncResponse.class);
    }
}`,
    task:
      "Ajoutez une commande idempotente de synchronisation de ticket. Simulez un timeout après le succès du système distant et prouvez que le retry ne duplique pas le ticket.",
    deliverable: "Un contrat de gateway, une politique de timeout et un test résistant aux doublons.",
    quiz: {
      question: "Quelle panne est dangereuse à traiter avec un retry inconditionnel ?",
      options: [
        "Une connexion refusée avant l’envoi des octets",
        "Un POST expiré dont le résultat distant est inconnu",
        "Une erreur de validation locale",
      ],
      answer: 1,
      explanation:
        "Le système distant a peut-être déjà validé le POST. Ne réessayez qu’avec de l’idempotence ou une stratégie de réconciliation.",
    },
  },
  {
    id: 10,
    phase: "Exploitation",
    title: "Observabilité avec Actuator",
    duration: "45 min",
    tag: "Micrometer",
    summary:
      "Exposez des informations de santé, métriques et traces qui répondent aux questions opérationnelles sans produire de bruit.",
    objectives: [
      "Utiliser correctement les notions de liveness et readiness.",
      "Créer des métriques métier à faible cardinalité.",
      "Connecter les métriques Micrometer à Prometheus.",
    ],
    mentalModel:
      "Les logs expliquent les événements, les métriques montrent les tendances et les traces relient une requête entre les services. Concevez les trois autour des questions de l’exploitant.",
    code: `@Component
class SyncMetrics {
    private final Counter synced;

    SyncMetrics(MeterRegistry registry) {
        synced = Counter.builder("tickets.synced")
            .description("Tickets synchronisés avec succès")
            .register(registry);
    }

    void success() { synced.increment(); }
}`,
    task:
      "Ajoutez Actuator et les métriques Prometheus. Construisez une requête de dashboard pour le taux de synchronisation et un contrôle de readiness PostgreSQL.",
    deliverable: "Des groupes de santé, une métrique utile et une condition d’alerte.",
    quiz: {
      question: "Pourquoi les identifiants de tickets ne doivent-ils pas être des tags de métrique ?",
      options: [
        "Ils créent une cardinalité non bornée",
        "Micrometer ne gère pas les chaînes",
        "Les tags ne sont disponibles qu’en développement",
      ],
      answer: 0,
      explanation:
        "Les identifiants uniques créent une série temporelle par valeur, ce qui peut saturer le backend de métriques et augmenter les coûts.",
    },
  },
  {
    id: 11,
    phase: "Déploiement",
    title: "Docker et Kubernetes",
    duration: "55 min",
    tag: "Cloud",
    summary:
      "Construisez des images efficaces et exécutez Spring Boot dans Kubernetes avec un comportement observable et maîtrisé.",
    objectives: [
      "Construire des images OCI en couches avec des buildpacks ou un Dockerfile.",
      "Séparer les probes de liveness et de readiness.",
      "Configurer les ressources, l’arrêt gracieux et les limites JVM.",
    ],
    mentalModel:
      "Un conteneur est un contrat de processus. Kubernetes a besoin de probes sincères, d’un arrêt prévisible et de ressources réalistes, pas seulement d’une image qui démarre.",
    code: `management:
  endpoint.health.probes.enabled: true
  server.port: 8081

# Kubernetes
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8081
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8081`,
    task:
      "Conteneurisez le service, ajoutez les probes et vérifiez que la readiness échoue avant que l’application puisse recevoir du trafic.",
    deliverable: "Une image en couches, un manifeste de déploiement et un arrêt gracieux vérifié.",
    quiz: {
      question: "Une panne temporaire de PostgreSQL doit-elle faire échouer la liveness ?",
      options: [
        "Oui, il faut toujours redémarrer la JVM",
        "Non, elle doit normalement affecter la readiness",
        "Uniquement lorsque le pod n’a pas de limite CPU",
      ],
      answer: 1,
      explanation:
        "Redémarrer une JVM saine répare rarement une base externe. Retirez le pod du trafic grâce à la readiness pendant sa récupération.",
    },
  },
  {
    id: 12,
    phase: "Projet final",
    title: "Service de synchronisation de tickets",
    duration: "2–3 h",
    tag: "Projet",
    summary:
      "Réunissez tout le cours dans un service proche de la production, inspiré d’une intégration d’entreprise réelle.",
    objectives: [
      "Concevoir des frontières propres pour HTTP, la persistance et la synchronisation externe.",
      "Garantir la création idempotente des incidents et le traitement des suivis.",
      "Livrer les tests, métriques, conteneurisation et documentation d’exploitation.",
    ],
    mentalModel:
      "Un service de production est un ensemble de contrats explicites : invariants métier, frontières de persistance, garanties d’intégration et signaux opérationnels.",
    code: `POST /api/incidents
Idempotency-Key: 8b7f...

{
  "title": "Latence de la base de données",
  "impact": "HIGH",
  "serviceId": "billing"
}

Flux :
Controller → CreateIncident
           → PostgreSQL + outbox
           → Worker de synchronisation → API externe`,
    task:
      "Construisez le service complet : création d’incidents, synchronisation avec un système externe, stockage des mappings, retries sécurisés et métriques opérationnelles.",
    deliverable:
      "Un dépôt déployable avec notes d’architecture, exemples d’API, tests, fichiers Docker/Kubernetes et démonstration de cinq minutes.",
    quiz: {
      question: "Quel est le principal avantage d’une outbox dans ce service ?",
      options: [
        "Elle accélère les requêtes HTTP",
        "Elle enregistre atomiquement l’état et l’intention de publier",
        "Elle supprime le besoin de retries",
      ],
      answer: 1,
      explanation:
        "La modification en base et l’intention de sortie sont validées ensemble. Un worker peut ensuite publier de manière fiable et réessayer indépendamment.",
    },
  },
];

type StudyUnit = {
  moduleId: number;
  title: string;
  minutes: number;
};

type StudyDay = {
  day: number;
  units: StudyUnit[];
  minutes: number;
};

const moduleMinutes = [35, 30, 35, 50, 55, 50, 35, 55, 60, 45, 55];

const studyUnits: StudyUnit[] = [
  ...modules.slice(0, 11).map((module, index) => ({
    moduleId: module.id,
    title: module.title,
    minutes: moduleMinutes[index],
  })),
  { moduleId: 12, title: "Projet final : architecture", minutes: 45 },
  { moduleId: 12, title: "Projet final : implémentation", minutes: 60 },
  { moduleId: 12, title: "Projet final : tests et livraison", minutes: 45 },
];

const totalCourseMinutes = studyUnits.reduce(
  (total, unit) => total + unit.minutes,
  0,
);

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}

function buildStudyPlan(days: number): StudyDay[] {
  let cursor = 0;
  let remainingMinutes = totalCourseMinutes;

  return Array.from({ length: days }, (_, dayIndex) => {
    const daysLeft = days - dayIndex;
    const target = remainingMinutes / daysLeft;
    const units: StudyUnit[] = [];
    let minutes = 0;

    while (cursor < studyUnits.length) {
      const unitsStillAvailable = studyUnits.length - cursor;
      const mustLeave = daysLeft - 1;
      if (unitsStillAvailable <= mustLeave && units.length > 0) break;

      const next = studyUnits[cursor];
      const currentDifference = Math.abs(target - minutes);
      const nextDifference = Math.abs(target - (minutes + next.minutes));

      if (
        units.length > 0 &&
        minutes >= target * 0.72 &&
        nextDifference > currentDifference
      ) {
        break;
      }

      units.push(next);
      minutes += next.minutes;
      cursor += 1;

      if (minutes >= target && studyUnits.length - cursor >= mustLeave) break;
    }

    if (units.length === 0 && cursor < studyUnits.length) {
      const next = studyUnits[cursor];
      units.push(next);
      minutes += next.minutes;
      cursor += 1;
    }

    remainingMinutes -= minutes;
    return { day: dayIndex + 1, units, minutes };
  });
}

function readProgress(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter(
          (item): item is number =>
            Number.isInteger(item) && item >= 1 && item <= modules.length,
        )
      : [];
  } catch {
    return [];
  }
}

function readStudyDays() {
  if (typeof window === "undefined") return 14;
  const value = Number(window.localStorage.getItem(STUDY_DAYS_KEY));
  return Number.isInteger(value) && value >= 1 && value <= 14 ? value : 14;
}

function scrollTo(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [completed, setCompleted] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [studyDays, setStudyDays] = useState(14);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = readProgress();
      setCompleted(saved);
      setSelectedId(
        modules.find((module) => !saved.includes(module.id))?.id ?? 12,
      );
      setStudyDays(readStudyDays());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedId) ?? modules[0],
    [selectedId],
  );

  const progress = Math.round((completed.length / modules.length) * 100);
  const nextModule = modules.find((module) => module.id === selectedId + 1);
  const studyPlan = useMemo(() => buildStudyPlan(studyDays), [studyDays]);
  const dailyAverage = Math.ceil(totalCourseMinutes / studyDays);

  function openModule(id: number) {
    setSelectedId(id);
    setSelectedAnswer(null);
    setChecked(false);
    setCopied(false);
    window.requestAnimationFrame(() => scrollTo("playground"));
  }

  function updateCompleted(next: number[]) {
    const sorted = [...next].sort((a, b) => a - b);
    setCompleted(sorted);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  }

  function toggleComplete() {
    updateCompleted(
      completed.includes(selectedId)
        ? completed.filter((id) => id !== selectedId)
        : [...completed, selectedId],
    );
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(selectedModule.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function resetProgress() {
    setCompleted([]);
    setSelectedId(1);
    setSelectedAnswer(null);
    setChecked(false);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function chooseStudyDays(value: number) {
    const next = Math.min(14, Math.max(1, Math.round(value)));
    setStudyDays(next);
    window.localStorage.setItem(STUDY_DAYS_KEY, String(next));
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Accueil Spring Boot Lab">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>Spring Boot Lab</span>
        </a>

        <nav className="main-nav" aria-label="Navigation principale">
          <a href="#path">Parcours</a>
          <a href="#planner">Rythme</a>
          <a href="#modules">Modules</a>
          <a href="#playground">Atelier</a>
          <a href="/interview-101">Entretien 101</a>
        </nav>

        <div className="header-actions">
          <a className="interview-nav-cta" href="/interview-101">
            Entretien 101 <span aria-hidden="true">→</span>
          </a>
          <button
            className="progress-pill"
            type="button"
            onClick={() => scrollTo("path")}
          >
            <span>{completed.length}</span> module{completed.length > 1 ? "s" : ""} sur {modules.length}
          </button>
          <span className="avatar" aria-label="Nassim profile">
            N
          </span>
        </div>
      </header>

      <div className="page-shell" id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Redécouvrir Spring Boot</p>
            <h1 id="hero-title">Retrouvez vos réflexes Spring.</h1>
            <p className="hero-text">
              Un parcours pratique, de Java moderne à une application Spring
              Boot prête pour la production. Aucun remplissage : uniquement les
              modèles mentaux et patterns qui comptent.
            </p>

            <button
              className="primary-cta"
              type="button"
              onClick={() => scrollTo("planner")}
            >
              <span>
                Construire mon programme sur {studyDays} jour{studyDays > 1 ? "s" : ""}
              </span>
              <span className="cta-arrow" aria-hidden="true">
                →
              </span>
            </button>

            <p className="hero-note">
              Terminer en {studyDays} jour{studyDays > 1 ? "s" : ""}
              <span aria-hidden="true">•</span>
              Environ {formatMinutes(dailyAverage)} par jour
              <span aria-hidden="true">•</span>
              Choisissez de 1 à 14 jours
            </p>
          </div>

          <div className="architecture-card" aria-label="Spring application layers">
            <div className="version-chip">
              <span>Java</span>
              <strong>21</strong>
            </div>

            <div className="code-stack">
              <article className="code-window code-window-one">
                <div className="window-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <pre>
                  <code>
                    <span className="code-green">@SpringBootApplication</span>
                    {"\n"}public class Application {"{"}
                    {"\n"}  public static void main(...) {"{"} {"}"}
                    {"\n"}
                    {"}"}
                  </code>
                </pre>
              </article>

              <article className="code-window code-window-two">
                <div className="window-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <pre>
                  <code>
                    <span className="code-green">@RestController</span>
                    {"\n"}class TicketController {"{"}
                    {"\n"}  <span className="code-green">@GetMapping</span>(&quot;/tickets&quot;)
                    {"\n"}  List&lt;Ticket&gt; tickets() {"{"} ... {"}"}
                    {"\n"}
                    {"}"}
                  </code>
                </pre>
              </article>

              <article className="code-window code-window-three">
                <div className="window-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <pre>
                  <code>
                    <span className="code-green">@Service</span>
                    {"\n"}class TicketSyncService {"{"}
                    {"\n"}  Ticket sync(TicketRequest request) {"{"}
                    {"\n"}    <span className="code-muted">{"// logique métier"}</span>
                    {"\n"}  {"}"}
                    {"\n"}
                    {"}"}
                  </code>
                </pre>
              </article>
            </div>

            <div className="spring-core" aria-hidden="true">
              <span>✦</span>
            </div>
          </div>
        </section>

        <section className="dashboard-row" id="path" aria-label="Résumé du parcours d’apprentissage">
          <article className="path-card">
            <div className="card-heading">
              <span className="heading-icon path-icon" aria-hidden="true">
                ↝
              </span>
              <h2>Votre parcours</h2>
            </div>

            <div
              className="module-rail"
              aria-label={`${completed.length} module(s) terminé(s) sur ${modules.length}`}
            >
              {modules.map((module) => (
                <button
                  className={
                    completed.includes(module.id)
                      ? "module-node is-complete"
                      : module.id === selectedId
                        ? "module-node is-current"
                        : "module-node"
                  }
                  key={module.id}
                  type="button"
                  aria-label={`Ouvrir le module ${module.id} : ${module.title}`}
                  onClick={() => openModule(module.id)}
                >
                  {completed.includes(module.id) ? "✓" : module.id}
                </button>
              ))}
            </div>

            <div className="path-progress">
              <strong>{completed.length}</strong> module{completed.length > 1 ? "s" : ""} sur {modules.length}
              <span>{progress}%</span>
            </div>
          </article>

          <article className="today-card">
            <div className="today-copy">
              <div className="card-heading">
                <span className="heading-icon" aria-hidden="true">
                  ◫
                </span>
                <h2>À suivre</h2>
              </div>
              <h3>{selectedModule.title}</h3>
              <p className="lesson-meta">
                <span>◷ {selectedModule.duration}</span>
                <span>▥ {selectedModule.tag}</span>
              </p>
              <button
                className="secondary-cta"
                type="button"
                onClick={() => openModule(selectedModule.id)}
              >
                <span aria-hidden="true">▤</span> Ouvrir la leçon
              </button>
            </div>

            <pre className="today-code">
              <code>{selectedModule.code.split("\n").slice(0, 6).join("\n")}</code>
            </pre>
          </article>
        </section>

        <section className="planner-section" id="planner">
          <div className="planner-heading">
            <div>
              <p className="section-kicker">Choisissez votre rythme</p>
              <h2>Combien de jours avez-vous ?</h2>
              <p>
                Choisissez entre une journée intensive et un sprint de deux
                semaines. Les modules et la charge estimée s’adaptent immédiatement.
              </p>
            </div>

            <div className="planner-summary" aria-live="polite">
              <span>
                <small>Votre sprint</small>
                <strong>
                  {studyDays} jour{studyDays > 1 ? "s" : ""}
                </strong>
              </span>
              <span>
                <small>Moyenne quotidienne</small>
                <strong>{formatMinutes(dailyAverage)}</strong>
              </span>
              <span>
                <small>Durée totale</small>
                <strong>{formatMinutes(totalCourseMinutes)}</strong>
              </span>
            </div>
          </div>

          <div className="pace-controls">
            <div className="pace-presets" aria-label="Durées d’apprentissage populaires">
              {[1, 3, 5, 7, 14].map((days) => (
                <button
                  className={studyDays === days ? "is-active" : ""}
                  key={days}
                  type="button"
                  aria-pressed={studyDays === days}
                  onClick={() => chooseStudyDays(days)}
                >
                  {days} jour{days > 1 ? "s" : ""}
                </button>
              ))}
            </div>

            <label className="pace-range">
              <span>
                Durée personnalisée
                <output>{studyDays} jour{studyDays > 1 ? "s" : ""}</output>
              </span>
              <input
                type="range"
                min="1"
                max="14"
                step="1"
                value={studyDays}
                aria-label="Nombre de jours d’apprentissage"
                onChange={(event) => chooseStudyDays(Number(event.target.value))}
              />
              <span className="range-labels" aria-hidden="true">
                <i>1 journée intensive</i>
                <i>Sprint de 14 jours</i>
              </span>
            </label>
          </div>

          <div className="study-plan-grid">
            {studyPlan.map((planDay) => (
              <article className="study-day-card" key={planDay.day}>
                <div className="study-day-heading">
                  <span>Jour {planDay.day}</span>
                  <strong>{formatMinutes(planDay.minutes)}</strong>
                </div>
                <div className="study-day-units">
                  {planDay.units.map((unit, index) => (
                    <button
                      key={`${planDay.day}-${unit.moduleId}-${index}`}
                      type="button"
                      onClick={() => openModule(unit.moduleId)}
                    >
                      <span>{String(unit.moduleId).padStart(2, "0")}</span>
                      <span>
                        <strong>{unit.title}</strong>
                        <small>{formatMinutes(unit.minutes)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="curriculum-section" id="modules">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Le programme</p>
              <h2>12 modules. Un service de production.</h2>
            </div>
            <p>
              Chaque module se termine par du code, un livrable pratique et une
              vérification ciblée des connaissances.
            </p>
          </div>

          <div className="module-grid">
            {modules.map((module) => {
              const isDone = completed.includes(module.id);
              return (
                <button
                  className={
                    selectedId === module.id
                      ? "module-card is-selected"
                      : "module-card"
                  }
                  key={module.id}
                  type="button"
                  onClick={() => openModule(module.id)}
                >
                  <span className="module-card-number">
                    {isDone ? "✓" : String(module.id).padStart(2, "0")}
                  </span>
                  <span className="module-card-copy">
                    <span className="module-card-meta">
                      {module.phase} <i /> {module.duration}
                    </span>
                    <strong>{module.title}</strong>
                    <span>{module.summary}</span>
                  </span>
                  <span className="module-card-tag">{module.tag}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lesson-section" id="playground">
          <aside className="lesson-sidebar">
            <p className="section-kicker">Atelier de leçon</p>
            <h2>Votre établi</h2>
            <p>
              Sélectionnez un module, comprenez son modèle mental, réalisez
              l’exercice et validez vos connaissances.
            </p>

            <div className="sidebar-progress" aria-label={`${progress}% terminé`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <strong className="sidebar-progress-label">{progress}% terminé</strong>

            <div className="sidebar-module-list">
              {modules.map((module) => (
                <button
                  className={
                    module.id === selectedId
                      ? "sidebar-module is-active"
                      : "sidebar-module"
                  }
                  type="button"
                  key={module.id}
                  onClick={() => openModule(module.id)}
                >
                  <span>{completed.includes(module.id) ? "✓" : module.id}</span>
                  {module.title}
                </button>
              ))}
            </div>

            {completed.length > 0 && (
              <button className="reset-button" type="button" onClick={resetProgress}>
                Réinitialiser la progression
              </button>
            )}
          </aside>

          <article className="lesson-workspace">
            <div className="lesson-topline">
              <span>
                Module {String(selectedModule.id).padStart(2, "0")} ·{" "}
                {selectedModule.phase}
              </span>
              <span>{selectedModule.duration}</span>
            </div>

            <h2>{selectedModule.title}</h2>
            <p className="lesson-summary">{selectedModule.summary}</p>

            <div className="lesson-block mental-model">
              <span className="block-label">Modèle mental</span>
              <p>{selectedModule.mentalModel}</p>
            </div>

            <div className="lesson-columns">
              <div className="lesson-block">
                <span className="block-label">Vous saurez</span>
                <ul className="objective-list">
                  {selectedModule.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>

              <div className="lesson-block task-block">
                <span className="block-label">Exercice pratique</span>
                <p>{selectedModule.task}</p>
                <small>Livrable</small>
                <strong>{selectedModule.deliverable}</strong>
              </div>
            </div>

            <div className="code-lab">
              <div className="code-lab-header">
                <span>
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  lab.java
                </span>
                <button type="button" onClick={copyCode}>
                  {copied ? "Copié ✓" : "Copier le code"}
                </button>
              </div>
              <pre>
                <code>{selectedModule.code}</code>
              </pre>
            </div>

            <div className="quiz-card">
              <div className="quiz-heading">
                <div>
                  <span className="block-label">Vérification des connaissances</span>
                  <h3>{selectedModule.quiz.question}</h3>
                </div>
                <span className="quiz-count">1 question</span>
              </div>

              <div className="quiz-options" role="radiogroup" aria-label="Réponses au quiz">
                {selectedModule.quiz.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = checked && index === selectedModule.quiz.answer;
                  const isWrong = checked && isSelected && !isCorrect;
                  return (
                    <button
                      className={[
                        "quiz-option",
                        isSelected ? "is-selected" : "",
                        isCorrect ? "is-correct" : "",
                        isWrong ? "is-wrong" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        setSelectedAnswer(index);
                        setChecked(false);
                      }}
                    >
                      <span>{String.fromCharCode(65 + index)}</span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {checked && selectedAnswer !== null && (
                <p
                  className={
                    selectedAnswer === selectedModule.quiz.answer
                      ? "quiz-feedback is-success"
                      : "quiz-feedback"
                  }
                  role="status"
                >
                  <strong>
                    {selectedAnswer === selectedModule.quiz.answer
                      ? "Correct."
                      : "Pas tout à fait."}
                  </strong>{" "}
                  {selectedModule.quiz.explanation}
                </p>
              )}

              <div className="quiz-actions">
                <button
                  className="check-answer"
                  type="button"
                  disabled={selectedAnswer === null}
                  onClick={() => setChecked(true)}
                >
                  Vérifier la réponse
                </button>
                <button
                  className={
                    completed.includes(selectedId)
                      ? "complete-button is-complete"
                      : "complete-button"
                  }
                  type="button"
                  onClick={toggleComplete}
                >
                  {completed.includes(selectedId)
                    ? "Terminé ✓"
                    : "Marquer comme terminé"}
                </button>
              </div>
            </div>

            <div className="lesson-navigation">
              <span>
                {completed.includes(selectedId)
                  ? "Progression enregistrée sur cet appareil."
                  : "Terminez l’exercice avant de valider ce module."}
              </span>
              {nextModule ? (
                <button type="button" onClick={() => openModule(nextModule.id)}>
                  Suivant : {nextModule.title} →
                </button>
              ) : (
                <button type="button" onClick={() => openModule(1)}>
                  Revoir depuis le début →
                </button>
              )}
            </div>
          </article>
        </section>

        <section className="capstone-section">
          <div>
            <p className="section-kicker">Architecture du projet final</p>
            <h2>Construisez un système proche de la production.</h2>
            <p>
              Le service final de synchronisation de tickets réunit REST,
              PostgreSQL, intégration asynchrone, observabilité et Kubernetes
              dans un système cohérent que vous saurez expliquer en entretien.
            </p>
            <button type="button" onClick={() => openModule(12)}>
              Ouvrir le projet final <span>→</span>
            </button>
          </div>

          <div className="architecture-flow" aria-label="Flux du service final">
            <div>
              <span>01</span>
              <strong>REST API</strong>
              <small>Valider + autoriser</small>
            </div>
            <i>→</i>
            <div>
              <span>02</span>
              <strong>Application</strong>
              <small>Règles + transaction</small>
            </div>
            <i>→</i>
            <div>
              <span>03</span>
              <strong>Worker outbox</strong>
              <small>Synchronisation idempotente</small>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div>
            <a className="brand footer-brand" href="#top">
              <span className="brand-mark" aria-hidden="true">
                <span />
              </span>
              <span>Spring Boot Lab</span>
            </a>
            <p>Un parcours ciblé pour les ingénieurs logiciels en activité.</p>
          </div>
          <div className="footer-links">
            <a
              href="https://docs.spring.io/spring-boot/reference/"
              target="_blank"
              rel="noreferrer"
            >
              Documentation officielle ↗
            </a>
            <a
              href="https://start.spring.io/"
              target="_blank"
              rel="noreferrer"
            >
              Spring Initializr ↗
            </a>
          </div>
          <p className="version-note">
            Mis à jour pour Spring Boot 4.1 · Java 17+ requis · Java 21 utilisé
            dans les exemples
          </p>
        </footer>
      </div>
    </main>
  );
}
