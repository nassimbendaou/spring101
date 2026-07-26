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
    phase: "Foundation",
    title: "Modern Java reset",
    duration: "35 min",
    tag: "Java 21",
    summary:
      "Refresh only the Java features you will actually use in a modern Spring codebase.",
    objectives: [
      "Use records for immutable request and response models.",
      "Read switch expressions, pattern matching and sealed hierarchies.",
      "Choose Optional and streams without hiding business logic.",
    ],
    mentalModel:
      "Modern Java reduces accidental ceremony. Use the new language tools to make intent explicit—not to compress every operation into one expression.",
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
      "Replace a mutable ticket DTO with a record. Add validation annotations and map it to a domain command.",
    deliverable: "A validated immutable input model and a clean mapper.",
    quiz: {
      question: "What is the strongest use case for a Java record in a Spring API?",
      options: [
        "A JPA entity with lazy-loaded relations",
        "An immutable request or response value",
        "A mutable service with injected dependencies",
      ],
      answer: 1,
      explanation:
        "Records are ideal value carriers. JPA entities usually need lifecycle-aware identity, proxies and controlled mutability.",
    },
  },
  {
    id: 2,
    phase: "Foundation",
    title: "Spring mental model",
    duration: "30 min",
    tag: "Core",
    summary:
      "Understand the container, beans, dependency injection and why constructor injection wins.",
    objectives: [
      "Explain IoC without relying on annotation vocabulary.",
      "Distinguish component discovery from explicit bean configuration.",
      "Spot circular dependencies and service-locator design.",
    ],
    mentalModel:
      "Your code declares an object graph; the Spring container builds and owns that graph. Constructor injection makes every required edge visible and testable.",
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
      "Draw the object graph for Controller → Service → Repository + external API client. Then instantiate the service in a unit test without Spring.",
    deliverable: "A dependency graph with no field injection and no hidden globals.",
    quiz: {
      question: "Why prefer constructor injection over field injection?",
      options: [
        "It makes dependencies explicit and objects testable without the container",
        "It creates fewer Spring beans at runtime",
        "It automatically makes every dependency optional",
      ],
      answer: 0,
      explanation:
        "Constructor injection exposes required collaborators, supports immutability and lets a test create the object directly.",
    },
  },
  {
    id: 3,
    phase: "Boot",
    title: "How Boot actually boots",
    duration: "35 min",
    tag: "Boot 4.1",
    summary:
      "Demystify starters, auto-configuration, conditions and the application startup sequence.",
    objectives: [
      "Expand what @SpringBootApplication combines.",
      "Explain conditional auto-configuration and back-off.",
      "Choose focused starters instead of a dependency grab bag.",
    ],
    mentalModel:
      "Spring Boot is opinionated assembly, not magic. It observes the classpath, configuration and existing beans, then applies conditional defaults that your own beans can override.",
    code: `@SpringBootApplication
public class TicketApplication {
    public static void main(String[] args) {
        SpringApplication.run(
            TicketApplication.class, args
        );
    }
}

// Boot 4.1: use the focused MVC starter
// org.springframework.boot:
// spring-boot-starter-webmvc`,
    task:
      "Generate a project with Spring Initializr using Web MVC, Validation and Actuator. Run with --debug and inspect the condition evaluation report.",
    deliverable: "A running app plus three auto-configurations you can explain.",
    quiz: {
      question: "When does an auto-configuration usually back off?",
      options: [
        "Whenever a profile is active",
        "When the application provides its own matching bean",
        "Only when @EnableAutoConfiguration is removed",
      ],
      answer: 1,
      explanation:
        "Many Boot defaults use conditions such as @ConditionalOnMissingBean, so your explicit configuration takes precedence.",
    },
  },
  {
    id: 4,
    phase: "Web",
    title: "Production REST APIs",
    duration: "50 min",
    tag: "MVC",
    summary:
      "Build thin controllers with validation, stable error contracts and correct HTTP semantics.",
    objectives: [
      "Separate transport DTOs from domain models.",
      "Validate inputs and map exceptions centrally.",
      "Use status codes, idempotency and pagination deliberately.",
    ],
    mentalModel:
      "The controller is an adapter. It translates HTTP into an application use case and translates the result back—business rules stay elsewhere.",
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
      "Create POST /api/tickets and GET /api/tickets/{id}. Return ProblemDetail for validation and not-found errors.",
    deliverable: "Two endpoints, a stable error shape and curl examples.",
    quiz: {
      question: "Where should the rule “a closed ticket cannot be reassigned” live?",
      options: [
        "Inside the React client",
        "Inside the controller",
        "Inside the domain or application service",
      ],
      answer: 2,
      explanation:
        "It is a business invariant and must hold regardless of whether the caller is HTTP, a message consumer or a test.",
    },
  },
  {
    id: 5,
    phase: "Data",
    title: "PostgreSQL & transactions",
    duration: "55 min",
    tag: "JPA",
    summary:
      "Model persistence boundaries, transactions and query behavior without falling into ORM traps.",
    objectives: [
      "Define transaction boundaries in the service layer.",
      "Detect N+1 queries and unsafe lazy loading.",
      "Use Flyway migrations and database constraints.",
    ],
    mentalModel:
      "JPA is a unit-of-work abstraction over SQL, not a replacement for understanding SQL. The database remains the final guardian of consistency.",
    code: `@Transactional
public Ticket assign(UUID id, UUID engineerId) {
    var ticket = tickets.findByIdForUpdate(id)
        .orElseThrow(TicketNotFound::new);

    ticket.assignTo(engineerId);
    return ticket;
}

// Migration owns the real constraint:
// alter table ticket
// add constraint ticket_title_not_blank ...`,
    task:
      "Persist tickets in PostgreSQL, add a Flyway migration and prove rollback when the external mapping write fails.",
    deliverable: "Schema migration, repository query and transactional test.",
    quiz: {
      question: "What does @Transactional primarily define?",
      options: [
        "A cache entry",
        "An atomic consistency boundary",
        "A REST retry policy",
      ],
      answer: 1,
      explanation:
        "It groups database work into a transaction boundary. It does not make remote API calls atomic with your database.",
    },
  },
  {
    id: 6,
    phase: "Quality",
    title: "Tests that earn trust",
    duration: "50 min",
    tag: "JUnit 5",
    summary:
      "Use fast unit tests, focused Spring slices and realistic integration tests with Testcontainers.",
    objectives: [
      "Know when not to use @SpringBootTest.",
      "Test MVC, persistence and business logic at the right layer.",
      "Run PostgreSQL integration tests with Testcontainers.",
    ],
    mentalModel:
      "Choose the smallest test environment that can disprove the behavior. A full context test is valuable only when context wiring is part of the risk.",
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
      "Write one pure unit test, one @WebMvcTest and one PostgreSQL Testcontainers test for the same ticket flow.",
    deliverable: "A three-layer test suite with clear failure ownership.",
    quiz: {
      question: "What is the best default test for a pure pricing rule?",
      options: [
        "A plain JUnit test with no Spring context",
        "@SpringBootTest with a real web server",
        "@DataJpaTest",
      ],
      answer: 0,
      explanation:
        "Pure business logic should be tested as a normal object. Starting Spring would add time without increasing confidence.",
    },
  },
  {
    id: 7,
    phase: "Operations",
    title: "Configuration without surprises",
    duration: "35 min",
    tag: "Config",
    summary:
      "Handle profiles, typed properties, secrets and environment differences safely.",
    objectives: [
      "Bind grouped settings with @ConfigurationProperties.",
      "Use profiles sparingly and keep secrets outside Git.",
      "Validate required configuration at startup.",
    ],
    mentalModel:
      "Configuration is an input to your application. Parse and validate it at the boundary just like an HTTP request.",
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
      "Create typed properties for an external API client. Make startup fail with a readable error when baseUrl is absent.",
    deliverable: "Validated configuration with local and production examples.",
    quiz: {
      question: "Where should a production API secret live?",
      options: [
        "Committed in application-prod.yaml",
        "In an external secret store or injected environment",
        "Inside a Java constant",
      ],
      answer: 1,
      explanation:
        "Secrets must be supplied at runtime through controlled secret management, not committed with source.",
    },
  },
  {
    id: 8,
    phase: "Security",
    title: "Security & JWT",
    duration: "55 min",
    tag: "OAuth2",
    summary:
      "Secure a stateless API with an explicit filter chain and authorization rules.",
    objectives: [
      "Separate authentication from authorization.",
      "Configure a JWT resource server.",
      "Apply method and endpoint authorization without leaking claims everywhere.",
    ],
    mentalModel:
      "Authentication proves identity; authorization decides permission. Keep token parsing at the security boundary and pass useful identity into use cases.",
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
      "Protect ticket endpoints with JWT while keeping health checks public. Add one authorization test.",
    deliverable: "SecurityFilterChain plus authenticated and forbidden test cases.",
    quiz: {
      question: "What should an API return for an authenticated user without permission?",
      options: ["401 Unauthorized", "403 Forbidden", "404 Always"],
      answer: 1,
      explanation:
        "401 means authentication is missing or invalid. 403 means identity is known but the action is not allowed.",
    },
  },
  {
    id: 9,
    phase: "Integration",
    title: "External systems & events",
    duration: "60 min",
    tag: "Resilience",
    summary:
      "Integrate REST and messaging with timeouts, idempotency and failure-aware boundaries.",
    objectives: [
      "Configure explicit connect and read timeouts.",
      "Make consumers and commands idempotent.",
      "Use an outbox when database state and events must agree.",
    ],
    mentalModel:
      "The network is a partial-failure boundary. Every remote call needs a time budget, a retry decision and a duplicate-handling strategy.",
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
      "Add an idempotent ticket-sync command. Simulate a timeout after the remote system succeeds and prove that retry does not duplicate the ticket.",
    deliverable: "Gateway contract, timeout policy and duplicate-safe test.",
    quiz: {
      question: "Which failure is unsafe to solve with an unconditional retry?",
      options: [
        "A connection refused before sending bytes",
        "A timed-out POST with an unknown remote outcome",
        "A local validation error",
      ],
      answer: 1,
      explanation:
        "The remote side may already have committed the POST. Retry safely only with idempotency or a reconciliation strategy.",
    },
  },
  {
    id: 10,
    phase: "Operations",
    title: "Observability with Actuator",
    duration: "45 min",
    tag: "Micrometer",
    summary:
      "Expose health, metrics and traces that answer operational questions instead of producing noise.",
    objectives: [
      "Use liveness and readiness with the right semantics.",
      "Create low-cardinality business metrics.",
      "Connect Micrometer metrics to Prometheus.",
    ],
    mentalModel:
      "Logs explain events, metrics show trends and traces connect a request across boundaries. Design all three around questions an operator will ask.",
    code: `@Component
class SyncMetrics {
    private final Counter synced;

    SyncMetrics(MeterRegistry registry) {
        synced = Counter.builder("tickets.synced")
            .description("Successfully synced tickets")
            .register(registry);
    }

    void success() { synced.increment(); }
}`,
    task:
      "Add Actuator and Prometheus metrics. Build a dashboard query for sync success rate and a readiness check for PostgreSQL.",
    deliverable: "Health groups, one useful metric and one alert condition.",
    quiz: {
      question: "Why should ticket IDs not be metric tags?",
      options: [
        "They create unbounded cardinality",
        "Micrometer cannot handle strings",
        "Tags are only available in development",
      ],
      answer: 0,
      explanation:
        "Unique IDs create a time series per value, which can overwhelm the metrics backend and increase cost.",
    },
  },
  {
    id: 11,
    phase: "Delivery",
    title: "Docker & Kubernetes",
    duration: "55 min",
    tag: "Cloud",
    summary:
      "Package efficient images and run Spring Boot with graceful, observable Kubernetes behavior.",
    objectives: [
      "Build layered OCI images with buildpacks or a Dockerfile.",
      "Separate liveness from readiness probes.",
      "Set resource requests, graceful shutdown and JVM limits.",
    ],
    mentalModel:
      "A container is a process contract. Kubernetes needs truthful probes, predictable shutdown and realistic resource signals—not just an image that starts.",
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
      "Containerize the service, add probes and verify that readiness fails before the application can serve traffic.",
    deliverable: "Layered image, deployment manifest and verified shutdown behavior.",
    quiz: {
      question: "Should a temporary PostgreSQL outage fail liveness?",
      options: [
        "Yes, always restart the JVM",
        "No, it should normally affect readiness instead",
        "Only when the pod has no CPU limit",
      ],
      answer: 1,
      explanation:
        "Restarting a healthy JVM rarely repairs an external database. Remove the pod from traffic through readiness while it recovers.",
    },
  },
  {
    id: 12,
    phase: "Capstone",
    title: "Ticket Sync service",
    duration: "2–3 h",
    tag: "Project",
    summary:
      "Combine the course into a production-minded service inspired by a real enterprise integration.",
    objectives: [
      "Design clean boundaries for HTTP, persistence and external sync.",
      "Guarantee idempotent incident creation and follow-up processing.",
      "Ship tests, metrics, containerization and operational documentation.",
    ],
    mentalModel:
      "A production service is a set of explicit contracts: domain invariants, persistence boundaries, integration guarantees and operational signals.",
    code: `POST /api/incidents
Idempotency-Key: 8b7f...

{
  "title": "Database latency",
  "impact": "HIGH",
  "serviceId": "billing"
}

Flow:
Controller → CreateIncident
           → PostgreSQL + outbox
           → Sync worker → external API`,
    task:
      "Build the complete service: create incidents, synchronize them to an external system, store mappings, retry safely and expose operational metrics.",
    deliverable:
      "A deployable repository with architecture notes, API examples, tests, Docker/Kubernetes files and a five-minute demo.",
    quiz: {
      question: "What is the key benefit of an outbox in this service?",
      options: [
        "It makes HTTP requests faster",
        "It atomically records state and the intent to publish",
        "It removes the need for retries",
      ],
      answer: 1,
      explanation:
        "The database change and outbound intent commit together. A worker can later publish reliably and retry independently.",
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
  { moduleId: 12, title: "Capstone: architecture", minutes: 45 },
  { moduleId: 12, title: "Capstone: implementation", minutes: 60 },
  { moduleId: 12, title: "Capstone: tests & delivery", minutes: 45 },
];

const totalCourseMinutes = studyUnits.reduce(
  (total, unit) => total + unit.minutes,
  0,
);

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
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
        <a className="brand" href="#top" aria-label="Spring Boot Lab home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>Spring Boot Lab</span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#path">Path</a>
          <a href="#planner">Pace</a>
          <a href="#modules">Modules</a>
          <a href="#playground">Playground</a>
        </nav>

        <div className="header-actions">
          <button
            className="progress-pill"
            type="button"
            onClick={() => scrollTo("path")}
          >
            <span>{completed.length}</span> of {modules.length} modules
          </button>
          <span className="avatar" aria-label="Nassim profile">
            N
          </span>
        </div>
      </header>

      <div className="page-shell" id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Spring Boot, reintroduced</p>
            <h1 id="hero-title">Rebuild your Spring instincts.</h1>
            <p className="hero-text">
              A hands-on path from modern Java to production-ready Spring Boot.
              No beginner filler—just the mental models and patterns that matter.
            </p>

            <button
              className="primary-cta"
              type="button"
              onClick={() => scrollTo("planner")}
            >
              <span>
                Build my {studyDays}-day plan
              </span>
              <span className="cta-arrow" aria-hidden="true">
                →
              </span>
            </button>

            <p className="hero-note">
              Finish in {studyDays} {studyDays === 1 ? "day" : "days"}
              <span aria-hidden="true">•</span>
              About {formatMinutes(dailyAverage)} per day
              <span aria-hidden="true">•</span>
              Choose from 1 to 14 days
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
                    {"\n"}    <span className="code-muted">{"// business logic"}</span>
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

        <section className="dashboard-row" id="path" aria-label="Learning path summary">
          <article className="path-card">
            <div className="card-heading">
              <span className="heading-icon path-icon" aria-hidden="true">
                ↝
              </span>
              <h2>Your path</h2>
            </div>

            <div
              className="module-rail"
              aria-label={`${completed.length} of ${modules.length} modules complete`}
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
                  aria-label={`Open module ${module.id}: ${module.title}`}
                  onClick={() => openModule(module.id)}
                >
                  {completed.includes(module.id) ? "✓" : module.id}
                </button>
              ))}
            </div>

            <div className="path-progress">
              <strong>{completed.length}</strong> of {modules.length} modules
              <span>{progress}%</span>
            </div>
          </article>

          <article className="today-card">
            <div className="today-copy">
              <div className="card-heading">
                <span className="heading-icon" aria-hidden="true">
                  ◫
                </span>
                <h2>Up next</h2>
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
                <span aria-hidden="true">▤</span> Open lesson
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
              <p className="section-kicker">Choose your pace</p>
              <h2>How many days do you have?</h2>
              <p>
                Pick anything from one intensive day to a two-week learning
                sprint. Your modules and estimated workload update instantly.
              </p>
            </div>

            <div className="planner-summary" aria-live="polite">
              <span>
                <small>Your sprint</small>
                <strong>
                  {studyDays} {studyDays === 1 ? "day" : "days"}
                </strong>
              </span>
              <span>
                <small>Daily average</small>
                <strong>{formatMinutes(dailyAverage)}</strong>
              </span>
              <span>
                <small>Total course</small>
                <strong>{formatMinutes(totalCourseMinutes)}</strong>
              </span>
            </div>
          </div>

          <div className="pace-controls">
            <div className="pace-presets" aria-label="Popular study durations">
              {[1, 3, 5, 7, 14].map((days) => (
                <button
                  className={studyDays === days ? "is-active" : ""}
                  key={days}
                  type="button"
                  aria-pressed={studyDays === days}
                  onClick={() => chooseStudyDays(days)}
                >
                  {days} {days === 1 ? "day" : "days"}
                </button>
              ))}
            </div>

            <label className="pace-range">
              <span>
                Custom duration
                <output>{studyDays} days</output>
              </span>
              <input
                type="range"
                min="1"
                max="14"
                step="1"
                value={studyDays}
                aria-label="Number of study days"
                onChange={(event) => chooseStudyDays(Number(event.target.value))}
              />
              <span className="range-labels" aria-hidden="true">
                <i>1 intensive day</i>
                <i>14-day sprint</i>
              </span>
            </label>
          </div>

          <div className="study-plan-grid">
            {studyPlan.map((planDay) => (
              <article className="study-day-card" key={planDay.day}>
                <div className="study-day-heading">
                  <span>Day {planDay.day}</span>
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
              <p className="section-kicker">The curriculum</p>
              <h2>12 modules. One production service.</h2>
            </div>
            <p>
              Each module ends with code, a practical deliverable and a focused
              knowledge check.
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
            <p className="section-kicker">Lesson playground</p>
            <h2>Your workbench</h2>
            <p>
              Select a module, read the mental model, implement the task and
              validate your understanding.
            </p>

            <div className="sidebar-progress" aria-label={`${progress}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <strong className="sidebar-progress-label">{progress}% complete</strong>

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
                Reset progress
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
              <span className="block-label">Mental model</span>
              <p>{selectedModule.mentalModel}</p>
            </div>

            <div className="lesson-columns">
              <div className="lesson-block">
                <span className="block-label">You will be able to</span>
                <ul className="objective-list">
                  {selectedModule.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </div>

              <div className="lesson-block task-block">
                <span className="block-label">Hands-on task</span>
                <p>{selectedModule.task}</p>
                <small>Deliverable</small>
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
                  {copied ? "Copied ✓" : "Copy code"}
                </button>
              </div>
              <pre>
                <code>{selectedModule.code}</code>
              </pre>
            </div>

            <div className="quiz-card">
              <div className="quiz-heading">
                <div>
                  <span className="block-label">Knowledge check</span>
                  <h3>{selectedModule.quiz.question}</h3>
                </div>
                <span className="quiz-count">1 question</span>
              </div>

              <div className="quiz-options" role="radiogroup" aria-label="Quiz answers">
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
                      : "Not quite."}
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
                  Check answer
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
                    ? "Completed ✓"
                    : "Mark module complete"}
                </button>
              </div>
            </div>

            <div className="lesson-navigation">
              <span>
                {completed.includes(selectedId)
                  ? "Progress saved on this device."
                  : "Finish the task before marking this module complete."}
              </span>
              {nextModule ? (
                <button type="button" onClick={() => openModule(nextModule.id)}>
                  Next: {nextModule.title} →
                </button>
              ) : (
                <button type="button" onClick={() => openModule(1)}>
                  Review from the start →
                </button>
              )}
            </div>
          </article>
        </section>

        <section className="capstone-section">
          <div>
            <p className="section-kicker">Capstone architecture</p>
            <h2>Build something close to production.</h2>
            <p>
              The final Ticket Sync service ties REST, PostgreSQL, async
              integration, observability and Kubernetes into one coherent
              system you can explain in an interview.
            </p>
            <button type="button" onClick={() => openModule(12)}>
              Open the capstone <span>→</span>
            </button>
          </div>

          <div className="architecture-flow" aria-label="Capstone service flow">
            <div>
              <span>01</span>
              <strong>REST API</strong>
              <small>Validate + authorize</small>
            </div>
            <i>→</i>
            <div>
              <span>02</span>
              <strong>Application</strong>
              <small>Rules + transaction</small>
            </div>
            <i>→</i>
            <div>
              <span>03</span>
              <strong>Outbox worker</strong>
              <small>Idempotent sync</small>
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
            <p>A focused learning path for working software engineers.</p>
          </div>
          <div className="footer-links">
            <a
              href="https://docs.spring.io/spring-boot/reference/"
              target="_blank"
              rel="noreferrer"
            >
              Official reference ↗
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
            Updated for Spring Boot 4.1 · Java 17+ required · Java 21 used in
            examples
          </p>
        </footer>
      </div>
    </main>
  );
}
