const assets = `${import.meta.env.BASE_URL}assets/planets`;

// Shared by the scrolling portfolio, planet previews, and project panels.
export const projects = [
  {
    id: 1, sequence: '01', projectInfo: 'Distributed Checkout',
    category: 'Distributed systems', kind: 'University project', year: '2026',
    summary: 'Keeping orders, stock, and payments in sync—even when a service fails.',
    description: 'Implemented asynchronous checkout orchestration with two-phase commit and sagas across order, stock, and payment services. Added recovery workers, idempotent checkout handling, and tests for duplicate requests and compensation after failed payments.',
    role: 'Software development', technologies: ['Python', 'FastAPI', 'Redis'],
    takeaway: 'Coordination · Recovery · Idempotency', visual: 'checkout',
    accent: '#edb684', featured: true,
    orbitalRadius: 10, orbitalSpeed: 0.5, visualRadius: 1.8,
    modelPath: `${assets}/p-c7b5e103.planet`,
  },
  {
    id: 2, sequence: '02', projectInfo: 'Modelling Chord',
    category: 'Formal verification', kind: 'University research project', year: '2026',
    summary: 'Exploring what it takes for a distributed ring to find the right answer.',
    description: 'A research project modelling the Chord protocol in TLA+. The models describe lookup routing and node joins, with checks for lookup correctness, successor reachability, and eventual stabilisation after joins. The evaluation compares finger-table routing with successor-only baselines.',
    role: 'Research project', technologies: ['TLA+', 'TLC', 'Chord'],
    takeaway: 'Correctness · Routing · Model checking', visual: 'chord',
    accent: '#99c9df', featured: false,
    orbitalRadius: 16, orbitalSpeed: 0.3, visualRadius: 1.45,
    modelPath: `${assets}/p-a91f2d4c.planet`,
  },
  {
    id: 3, sequence: '03', projectInfo: 'Making Cost Visible',
    category: 'Production engineering', kind: 'Booking.com internship', year: '2026',
    summary: 'Connecting resource usage to the features and teams behind it.',
    description: 'Built and deployed Java instrumentation attributing CPU time and heap allocation to business features in a shared pricing service. Extended coverage across execution paths with deterministic tests and safeguards against double counting. Developed Grafana dashboards and a cost model reporting resource use and estimated monthly infrastructure cost by feature and team.',
    role: 'Software engineering intern', technologies: ['Java', 'Grafana', 'Instrumentation'],
    takeaway: 'Performance · Observability · Cost attribution', visual: 'metrics',
    accent: '#aaa0e6', featured: false,
    orbitalRadius: 22, orbitalSpeed: 0.2, visualRadius: 1.2,
    modelPath: `${assets}/p-e48279ad.planet`,
  },
  {
    id: 4, sequence: '04', projectInfo: 'Aperture',
    category: 'Developer tooling', kind: 'University project', year: '2025',
    summary: 'A shared workspace for building software, wherever the team is.',
    description: 'Developed role-specific views in a React/Tauri desktop client for a collaborative remote IDE prototype. The team prototype supported remote builds in Docker/Nix sessions and preserved both users’ edits in a two-client concurrent typing experiment.',
    role: 'Frontend development', technologies: ['React', 'Tauri', 'Docker'],
    takeaway: 'Collaboration · Remote builds · Developer experience', visual: 'editor',
    accent: '#96c9c2', featured: false,
    orbitalRadius: 28, orbitalSpeed: 0.15, visualRadius: 1.5,
    modelPath: `${assets}/p-a91f2d4c.planet`,
  },
];

export const experience = [
  { company: 'Codehive', role: 'Junior Software Engineer · Part-time', dates: 'Sep 2026 — Present', description: 'Continuing my software engineering work alongside my master’s studies.' },
  { company: 'Booking.com', role: 'Software Engineering Intern', dates: 'Jul — Aug 2026', description: 'Built production instrumentation and dashboards to connect feature-level resource usage with infrastructure cost.' },
  { company: 'Codehive', role: 'Junior Software Engineer · Part-time', dates: 'Oct 2024 — Jun 2026', description: 'Led development of ResumAI, an AI-assisted CV platform used by three companies. Built its frontend and document-processing workflows, and designed an evaluation approach for AI-generated clinical notes.' },
  { company: 'Boskalis', role: 'Software Engineering Intern', dates: 'Apr — Jun 2024', description: 'Led a five-person student team building a Python SDK for internal developers, including Azure/Databricks integrations, API clients, and OAuth2 flows.' },
];

export const technicalStack = [
  { title: 'Languages', items: [
    ['Java', 'Services / instrumentation'],
    ['Python', 'APIs / tooling'],
    ['TypeScript', 'Frontend / web apps'],
  ] },
  { title: 'Frameworks & Data', items: [
    ['React', 'Interfaces'],
    ['Django / FastAPI', 'Backend services'],
    ['Redis / Celery', 'Queues / orchestration'],
    ['PostgreSQL', 'Relational data'],
  ] },
  { title: 'Infrastructure & Tools', items: [
    ['Docker', 'Containers'],
    ['Azure', 'Cloud integrations'],
    ['Grafana', 'Observability'],
    ['Git / CI/CD', 'Delivery workflows'],
  ] },
];
