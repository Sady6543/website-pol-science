export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  key_points: string[];
  body: string;
  category: {
    slug: string;
    name: string;
    icon: string;
  };
  importance: 1 | 2 | 3; // 1 = low (gray), 2 = medium (amber), 3 = high (red)
  reading_time_minutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  source_name: string;
  source_url: string;
  published_at: string;
  entities: {
    type: "person" | "country" | "organization";
    name: string;
  }[];
  tags: string[];
  related_slugs: string[];
}

export interface TrendingTopic {
  slug: string;
  label: string;
  mention_count: number;
  sparkline: number[];
}

export interface DailyBriefItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  importance: 1 | 2 | 3;
  source: string;
}

export interface DailyBrief {
  morning: {
    headlines: DailyBriefItem[];
    sections: { title: string; items: DailyBriefItem[] }[];
    facts: string[];
    quote: { text: string; author: string; context: string };
    word: { word: string; pronunciation: string; definition: string; usage: string };
  };
  afternoon: {
    headlines: DailyBriefItem[];
    sections: { title: string; items: DailyBriefItem[] }[];
    facts: string[];
    quote: { text: string; author: string; context: string };
    word: { word: string; pronunciation: string; definition: string; usage: string };
  };
  evening: {
    headlines: DailyBriefItem[];
    sections: { title: string; items: DailyBriefItem[] }[];
    facts: string[];
    quote: { text: string; author: string; context: string };
    word: { word: string; pronunciation: string; definition: string; usage: string };
  };
}

export const CATEGORIES = [
  { slug: "politics", name: "Politics", icon: "🏛️", count: 14 },
  { slug: "international-affairs", name: "International Affairs", icon: "🌐", count: 22 },
  { slug: "india", name: "India", icon: "🇮🇳", count: 18 },
  { slug: "ai", name: "AI", icon: "🤖", count: 29 },
  { slug: "technology", name: "Technology", icon: "💻", count: 25 },
  { slug: "economy", name: "Economy", icon: "📈", count: 15 },
  { slug: "science", name: "Science", icon: "🧪", count: 11 },
  { slug: "gaming", name: "Gaming", icon: "🎮", count: 9 },
  { slug: "editing-creative", name: "Editing & Creative", icon: "🎨", count: 8 },
  { slug: "learning", name: "Learning", icon: "📚", count: 12 },
];

export const TRENDING_TOPICS: TrendingTopic[] = [
  { slug: "middle-east", label: "Middle East", mention_count: 142, sparkline: [10, 20, 15, 30, 45, 60, 55, 80] },
  { slug: "semiconductor-wars", label: "Semiconductor Trade", mention_count: 98, sparkline: [40, 38, 45, 50, 42, 60, 75, 90] },
  { slug: "openai-gpt5", label: "OpenAI GPT-5", mention_count: 210, sparkline: [90, 80, 70, 120, 150, 190, 180, 210] },
  { slug: "india-digital-rupee", label: "India Digital Rupee", mention_count: 64, sparkline: [20, 25, 22, 35, 40, 38, 55, 64] },
  { slug: "fusion-ignition", label: "Fusion Ignition", mention_count: 51, sparkline: [5, 12, 8, 15, 30, 28, 40, 51] },
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: "art-1",
    slug: "geopolitical-shifts-east-asia-chips",
    title: "Geopolitical Shifts in East Asian Semiconductor Supply Chains",
    summary: "As unilateral export restrictions tighten, Taiwan, Japan, and South Korea are reforming security alliances to protect lithography expertise and silicon manufacturing capabilities.",
    key_points: [
      "New multilateral agreements aim to establish joint research centers for sub-2nm lithography.",
      "Industrial policy subsidies in Japan have triggered a rapid expansion of local foundries in Kumamoto.",
      "Export controls on chemical precursors are forcing South Korean manufacturers to diversify raw material sourcing."
    ],
    body: `The global semiconductor landscape is undergoing its most significant structural shift since the dawn of the silicon age. A series of unilateral export controls and strategic security alliances are redrawing the map of chip manufacturing, with profound implications for East Asian economies.

For decades, the division of labor was highly optimized: American design houses, Dutch lithography systems, Taiwanese precision foundries, Japanese chemical suppliers, and South Korean memory giants worked in a highly integrated global web. Today, that web is being deliberately untangled.

### The Rise of the Kumamoto Silicon Cluster
Japan's Ministry of Economy, Trade and Industry (METI) has pioneered a massive subsidy program, bringing TSMC to Kumamoto and funding the local venture Rapidus. This represents a strategic attempt to reclaim Japan's historical dominance in fabrication, backed by solid local chemical and tool suppliers like Tokyo Electron.

### Taiwan's Defense Strategy
Taiwan remains the undisputed hub for advanced foundry services. However, Taiwan is utilizing "silicon diplomacy" to entrench its global position. By building satellite fabs in Germany and the United States, TSMC ensures that international powers remain deeply invested in the defense of Taiwan's logistical integrity.

Meanwhile, South Korea's Samsung and SK Hynix are navigatng complex waivers. They are building new gigafabs within their domestic borders while attempting to sustain legacy operations elsewhere, requiring a massive retooling of supply pipelines.`,
    category: { slug: "international-affairs", name: "International Affairs", icon: "🌐" },
    importance: 3,
    reading_time_minutes: 5,
    difficulty: "advanced",
    source_name: "Foreign Policy Review",
    source_url: "https://example.com/east-asia-chips",
    published_at: "2026-07-03T08:00:00Z",
    entities: [
      { type: "country", name: "Taiwan" },
      { type: "country", name: "Japan" },
      { type: "country", name: "South Korea" },
      { type: "organization", name: "TSMC" }
    ],
    tags: ["Semiconductors", "Supply Chains", "Geopolitics", "Asia-Pacific"],
    related_slugs: ["openai-scaling-frontiers-gpt5", "india-semiconductor-mission-2026"]
  },
  {
    id: "art-2",
    slug: "openai-scaling-frontiers-gpt5",
    title: "OpenAI Details 'Frontier-V' Architecture and Scaling Milestones",
    summary: "Leaked internal specifications confirm OpenAI's upcoming model relies on hybrid mixture-of-experts (MoE) and localized planning steps to overcome traditional scaling laws.",
    key_points: [
      "Frontier-V introduces a multi-step reasoning overlay that optimizes computation at inference time.",
      "The model uses dynamic routing across 256 specialized sub-networks.",
      "System achieves significant energy efficiency improvements compared to GPT-4o."
    ],
    body: `OpenAI has internally circulated technical documentation detailing their next-generation reasoning engine, codenamed "Frontier-V" (commonly referred to as GPT-5). The paper reveals how the organization bypassed the traditional compute bottlenecks that have slowed LLM progress over the last 18 months.

### Inference-Time Compute
Rather than simply scaling parameters during pre-training, Frontier-V shifts the computational weight to the inference phase. By introducing a 'System 2' planning mechanism, the model halts generation to evaluate intermediate reasoning steps before emitting tokens. This allows it to solve complex scientific and mathematical proofs that stump current architectures.

### Sparse MoE Architectures
The hardware requirements are optimized through a sparse Mixture of Experts (MoE) routing layer. With 256 routing paths, only a fraction of the total parameters are activated for any single token. This reduces latency and mitigates the massive thermal demands previously associated with frontier AI models.

Industry analysts suggest that the deployment of Frontier-V will reshape cloud infrastructure demands, forcing hyper-scalers to rapidly build out localized edge clusters capable of managing specialized inference routines close to users.`,
    category: { slug: "ai", name: "AI", icon: "🤖" },
    importance: 3,
    reading_time_minutes: 4,
    difficulty: "advanced",
    source_name: "MIT Technology Archive",
    source_url: "https://example.com/openai-frontier-v",
    published_at: "2026-07-03T10:30:00Z",
    entities: [
      { type: "organization", name: "OpenAI" },
      { type: "person", name: "Sam Altman" }
    ],
    tags: ["AI", "LLMs", "Inference Compute", "Machine Learning"],
    related_slugs: ["geopolitical-shifts-east-asia-chips", "quantum-entanglement-silicon-nodes"]
  },
  {
    id: "art-3",
    slug: "india-semiconductor-mission-2026",
    title: "India Semiconductor Mission Expands Guarantees to Fabrication Projects",
    summary: "The Indian Cabinet approved an additional $5 billion in fiscal support, widening incentives to cover compound semiconductor fabrication facilities and advanced packaging hubs.",
    key_points: [
      "Incentives now cover up to 50% of project costs for silicon carbide and gallium nitride fabs.",
      "Three new assembly and testing (OSAT) projects were cleared for construction in Gujarat and Assam.",
      "Domestic talent creation program will fund chip design labs in 100 universities."
    ],
    body: `India is raising the stakes in the global semiconductor race. The Union Cabinet today approved a major expansion of the India Semiconductor Mission (ISM), adding $5 billion in capital funding and easing joint-venture requirements for global technology groups.

### Compound Semiconductor Push
Recognizing the high barriers to entry for advanced sub-5nm silicon nodes, India's strategy shifts focus slightly toward compound semiconductors. These materials—specifically silicon carbide (SiC) and gallium nitride (GaN)—are vital for electric vehicles, solar inverters, and high-frequency defense telecommunications.

### Geopolitical Realignment
By offering robust fiscal stability guarantees, India is positioning itself as a reliable secondary sourcing destination in the 'China+1' supply chain strategy. Partnerships with players in Taiwan, Japan, and the EU are expected to accelerate tech transfers over the next three years.

Critics note that the availability of high-purity water, stable electricity, and logistical infrastructure remains a challenge in rural industrial zones. However, fast-tracked construction in Dholera, Gujarat, demonstrates the government's resolve to bypass bureaucratic bottlenecks.`,
    category: { slug: "india", name: "India", icon: "🇮🇳" },
    importance: 2,
    reading_time_minutes: 3,
    difficulty: "intermediate",
    source_name: "Economic Times",
    source_url: "https://example.com/ism-expansion",
    published_at: "2026-07-03T05:15:00Z",
    entities: [
      { type: "country", name: "India" },
      { type: "organization", name: "Ministry of Electronics" }
    ],
    tags: ["Semiconductors", "India", "Cabinet Decisions", "Manufacturing"],
    related_slugs: ["geopolitical-shifts-east-asia-chips", "global-inflation-macro-outlook"]
  },
  {
    id: "art-4",
    slug: "global-inflation-macro-outlook",
    title: "Federal Reserve Signals Sustained Neutral Rates Amid Structural Changes",
    summary: "Chairman reports that structural labor shortages and green transition capital demands are locking the neutral interest rate (r-star) higher than pre-pandemic levels.",
    key_points: [
      "The estimated long-run neutral interest rate has been revised upward to 3.25%.",
      "Supply-side structural changes, including near-shoring, are keeping base costs sticky.",
      "Central banks globally are forced to adjust their 10-year yield targets upward."
    ],
    body: `In a landmark address at the Jackson Hole symposium, the Federal Reserve Chair confirmed what economists have suspected for years: the era of near-zero interest rates is permanently behind us. The neutral rate of interest (known to economists as r-star) has drifted structurally higher.

### The Dynamics of High r-star
Several key global trends are keeping the cost of capital elevated:
1. **The Green Transition:** Decarbonization requires trillions of dollars in upfront capital investments, driving up loan demand.
2. **De-Globalization:** Reshoring manufacturing lines to friendly nations requires duplicate infrastructure, reducing global supply chain efficiencies.
3. **Demographics:** Aging workforces in developed markets are reducing the pool of national savings while driving up health-care costs.

### Market Implications
For equity markets, a structurally higher r-star forces a reassessment of valuations. Technology companies relying on distant future cash flows must operate under tighter capital discipline. Meanwhile, fixed-income yields are locked into a range that makes bonds a highly competitive asset class once again.`,
    category: { slug: "economy", name: "Economy", icon: "📈" },
    importance: 2,
    reading_time_minutes: 4,
    difficulty: "intermediate",
    source_name: "Bloomberg Economics",
    source_url: "https://example.com/fed-neutral-rates",
    published_at: "2026-07-02T14:20:00Z",
    entities: [
      { type: "organization", name: "Federal Reserve" },
      { type: "country", name: "United States" }
    ],
    tags: ["Inflation", "Federal Reserve", "Macroeconomics", "Interest Rates"],
    related_slugs: ["india-semiconductor-mission-2026", "eu-carbon-border-adjustment-mechanism"]
  },
  {
    id: "art-5",
    slug: "eu-carbon-border-adjustment-mechanism",
    title: "EU Carbon Border Adjustment Mechanism (CBAM) Enters Critical Enforcement Phase",
    summary: "Importers must now acquire carbon certificates matching the weekly emissions price of domestic industrial materials, raising tensions with major developing trading partners.",
    key_points: [
      "The transition phase ends; actual tariffs are now applied to steel, cement, aluminum, and fertilizers.",
      "Tensions rise with India and China, who label the regulation a unilateral trade barrier.",
      "European manufacturers warn of raw material price volatility during the adjustment period."
    ],
    body: `The European Union has commenced full enforcement of its pioneering Carbon Border Adjustment Mechanism (CBAM). As of this month, importers must purchase digital carbon certificates that match the carbon price that domestic EU manufacturers pay under the Emission Trading System (ETS).

This represents the world's first carbon border tax, designed to prevent 'carbon leakage'—where European firms outsource high-emission manufacturing to countries with looser environmental laws.

### Trade Friction
Developing nations, led by India, Brazil, and China, are preparing a formal challenge at the World Trade Organization. They argue that CBAM violates the principle of 'Common but Differentiated Responsibilities' (CBDR) established in international climate treaties, effectively penalizing developing industrial bases.

EU officials maintain that CBAM is a non-discriminatory environmental policy, arguing that any country that establishes its own domestic carbon pricing mechanism can deduct those costs from the CBAM requirements at the border.`,
    category: { slug: "politics", name: "Politics", icon: "🏛️" },
    importance: 2,
    reading_time_minutes: 5,
    difficulty: "advanced",
    source_name: "Financial Times",
    source_url: "https://example.com/cbam-enforcement",
    published_at: "2026-07-02T09:00:00Z",
    entities: [
      { type: "organization", name: "European Union" },
      { type: "country", name: "India" },
      { type: "country", name: "China" }
    ],
    tags: ["Climate Policy", "Trade", "European Union", "Carbon Tax"],
    related_slugs: ["global-inflation-macro-outlook", "geopolitical-shifts-east-asia-chips"]
  },
  {
    id: "art-6",
    slug: "fusion-energy-breakthrough-ignition",
    title: "National Ignition Facility Exceeds 5 Megajoules of Fusion Yield",
    summary: "Physicists achieve a new record yield in laser-driven inertial confinement fusion, outputting more than double the electrical energy directed at the target fuel pellet.",
    key_points: [
      "The experiment yielded approximately 5.4 MJ of fusion energy using a 2.1 MJ laser pulse.",
      "Improvements in diamond fuel capsule symmetry helped prevent early plasma cooling.",
      "Engineering challenges remain in scaling this single-shot mechanism to a continuous power plant."
    ],
    body: `Physicists at the Lawrence Livermore National Laboratory have announced a major milestone in the quest for clean, limitless energy. For the second time this year, the National Ignition Facility (NIF) has achieved 'scientific breakeven' (ignition), this time yielding a record 5.4 megajoules of energy from a 2.1 megajoule laser target pulse.

### Inertial Confinement Fusion
NIF utilizes a process called inertial confinement fusion. A tiny capsule containing deuterium and tritium is placed inside a gold cylinder (hohlraum). 192 intense laser beams hit the inner walls of the cylinder, generating X-rays that cause the capsule to compress violently, heating the fuel to stellar core temperatures.

### The Engineering Challenge
While the energy yield at the target represents a gain of 2.5x, the lasers themselves consume over 300 megajoules of electricity from the grid to charge and fire. To make fusion commercial, the efficiency of the laser systems must improve by orders of magnitude, and the system must fire at a rate of 10 times per second, rather than once per day.`,
    category: { slug: "science", name: "Science", icon: "🧪" },
    importance: 3,
    reading_time_minutes: 4,
    difficulty: "advanced",
    source_name: "Scientific American",
    source_url: "https://example.com/nif-5mj-yield",
    published_at: "2026-07-01T16:45:00Z",
    entities: [
      { type: "organization", name: "National Ignition Facility" },
      { type: "country", name: "United States" }
    ],
    tags: ["Physics", "Fusion", "Clean Energy", "Science Breakthrough"],
    related_slugs: ["quantum-entanglement-silicon-nodes", "openai-scaling-frontiers-gpt5"]
  },
  {
    id: "art-7",
    slug: "quantum-entanglement-silicon-nodes",
    title: "Researchers Map Remote Entanglement Across Silicon-Spin Qubits",
    summary: "A joint research group successfully established quantum entanglement between two silicon-spin qubits spaced 10 centimeters apart, demonstrating scalable microchip integration paths.",
    key_points: [
      "Silicon spin qubits maintain coherence longer than superconducting equivalents when cooled.",
      "An integrated microwave resonator acted as the quantum bridge between remote nodes.",
      "The design uses standard CMOS manufacturing, easing potential industrial mass production."
    ],
    body: `A consortium of physicists at Delft University and Princeton has cleared a major hurdle in quantum processor design. They demonstrated remote entanglement between two spin qubits housed on distinct silicon chips separated by 10 centimeters of fiber interface.

### Silicon Spin Qubits
Most public quantum computers today (IBM, Google) use superconducting qubits, which require huge dilution refrigerators and are highly sensitive to thermal noise. Silicon spin qubits, on the other hand, utilize the spin of a single electron trapped in a silicon quantum dot. They are extremely compact—about the size of a standard transistor—and can be fabricated using standard silicon microchip processes.

### The Microwave Bridge
By routing a superconducting microwave resonator between the two quantum dots, researchers created a channel that allows the qubits to share state information over macro distances. This enables a modular architecture where smaller quantum processors can be linked together like nodes in a server rack, bypassing the physical constraints of placing thousands of qubits on a single wafer.`,
    category: { slug: "science", name: "Science", icon: "🧪" },
    importance: 2,
    reading_time_minutes: 5,
    difficulty: "advanced",
    source_name: "Nature Physics Journal",
    source_url: "https://example.com/silicon-spin-entanglement",
    published_at: "2026-07-01T11:00:00Z",
    entities: [
      { type: "organization", name: "Delft University" },
      { type: "organization", name: "Princeton University" }
    ],
    tags: ["Quantum Computing", "Silicon", "Physics", "Nanotechnology"],
    related_slugs: ["fusion-energy-breakthrough-ignition", "geopolitical-shifts-east-asia-chips"]
  },
  {
    id: "art-8",
    slug: "indias-foreign-policy-multi-alignment",
    title: "Navigating Multi-Alignment: India's Geopolitics in a Multipolar World",
    summary: "By strengthening ties with the Quad while maintaining active participation in BRICS, India is implementing a pragmatic foreign policy focused on strategic autonomy and national development.",
    key_points: [
      "India continues bilateral defense co-production deals with France and the US.",
      "Simultaneously, energy purchases and logistical agreements with Russia remain stable.",
      "Strategic autonomy is leveraged to secure domestic industrial growth and tech transfers."
    ],
    body: `India's contemporary foreign policy is a masterclass in pragmatic diplomacy. Rejecting the rigid alliance systems of the Cold War, New Delhi has pioneered a doctrine of 'multi-alignment'—engaging with multiple competing centers of global power to secure its own national interest.

### The Quad vs. BRICS Balance
To the West, India is a vital pillar of the Quadrilateral Security Dialogue (alongside the US, Japan, and Australia), serving as a democratic counterbalance in the Indo-Pacific. To the East, India remains a founding member of BRICS and the Shanghai Cooperation Organisation (SCO), ensuring its voice is heard in forums that seek to reform global governance structures.

### Defense and Energy Autonomy
This multi-layered approach is highly apparent in India's defense procurements. While importing advanced Rafale jets from France and co-producing jet engines with GE in the United States, New Delhi continues to acquire defense hardware and crude oil from Russia, resisting Western pressure to isolate Moscow.

According to Indian diplomats, this policy is not opportunistic; it is a necessity driven by India's developmental imperatives and its complex neighborhood borders.`,
    category: { slug: "politics", name: "Politics", icon: "🏛️" },
    importance: 3,
    reading_time_minutes: 6,
    difficulty: "intermediate",
    source_name: "Indian Council on World Affairs",
    source_url: "https://example.com/india-multi-alignment",
    published_at: "2026-06-30T09:30:00Z",
    entities: [
      { type: "country", name: "India" },
      { type: "organization", name: "Quad" },
      { type: "organization", name: "BRICS" }
    ],
    tags: ["Foreign Policy", "Geopolitics", "India", "Strategic Autonomy"],
    related_slugs: ["india-semiconductor-mission-2026", "eu-carbon-border-adjustment-mechanism"]
  },
  {
    id: "art-9",
    slug: "nextjs-app-router-performance-2026",
    title: "Next.js 16 App Router Optimizes Server Actions for Edge Runtime",
    summary: "The latest Next.js release optimizes edge-side data hydration, slashing first-input delay on lightweight Server Component routes by up to 35%.",
    key_points: [
      "Data payload serialization is now handled concurrently during regional streaming.",
      "Edge-rendered Server Actions bypass cold-start delays through pre-warmed lambdas.",
      "Devs get improved tooling to visualize Client vs Server bundle sizes in real-time."
    ],
    body: `Vercel has released Next.js 16, introducing a series of internal architectural optimizations designed to reduce cold starts and speed up regional serverless functions.

### Edge Hydration Optimizations
In Next.js 16, the App Router serializes server-component payloads during the streaming phase. This allows the client browser to start parsing interactive layout elements before the full HTML document has finished downloading, preventing page lag.

### Cold-Start Bypass
For Edge functions utilizing Server Actions, Next.js now coordinates with Vercel's regional router to keep pre-warmed isolates active based on real-time client traffic patterns. This effectively removes the 150ms cold-start latency that previously degraded search and form submittals in remote regions.`,
    category: { slug: "technology", name: "Technology", icon: "💻" },
    importance: 1,
    reading_time_minutes: 3,
    difficulty: "intermediate",
    source_name: "Vercel Engineering",
    source_url: "https://example.com/nextjs16-performance",
    published_at: "2026-06-29T17:00:00Z",
    entities: [
      { type: "organization", name: "Vercel" }
    ],
    tags: ["Next.js", "Web Dev", "Performance", "React"],
    related_slugs: ["openai-scaling-frontiers-gpt5", "rust-compiler-cargo-speedup"]
  },
  {
    id: "art-10",
    slug: "spacex-starship-payload-milestones",
    title: "SpaceX Starship Achieves Rapid Reusability Flight Cadence",
    summary: "SpaceX successfully caught both the Super Heavy booster and the Starship upper stage in consecutive test launches, paving the way for immediate commercial operations.",
    key_points: [
      "Both stages were caught by the launch tower mechanical arms ('chopsticks') at Starbase, Texas.",
      "Turnaround time between booster inspections was reduced to under 48 hours.",
      "The system is now cleared for its first operational satellite deployment payload."
    ],
    body: `SpaceX has achieved a major milestone in space exploration. For two consecutive launches, the spaceflight company successfully launched, recovered, and inspected both stages of its massive Starship launch vehicle in under two days.

### Chopstick Recovery System
The recovery technique relies on the launch tower's mechanical arms, affectionately nicknamed 'chopsticks.' As the Super Heavy booster descends, it decelerates to a hover directly beside the tower, which closes its arms to catch the booster by its grid fins. The upper Starship stage performed a similar landing maneuver over the Gulf of Mexico before returning to the pad.

### Mars Logistical Infrastructure
With rapid reusability proved, the marginal cost per launch is projected to fall below $5 million. This shifts the economics of space access, enabling the heavy logistics required for NASA's Artemis program and Elon Musk's long-term goal of building a permanent colony on Mars.`,
    category: { slug: "technology", name: "Technology", icon: "💻" },
    importance: 2,
    reading_time_minutes: 4,
    difficulty: "intermediate",
    source_name: "SpaceFlight Now",
    source_url: "https://example.com/starship-reusability",
    published_at: "2026-06-29T06:00:00Z",
    entities: [
      { type: "organization", name: "SpaceX" },
      { type: "person", name: "Elon Musk" }
    ],
    tags: ["Space", "SpaceX", "Engineering", "Aerospace"],
    related_slugs: ["fusion-energy-breakthrough-ignition", "nextjs-app-router-performance-2026"]
  },
  {
    id: "art-11",
    slug: "rust-compiler-cargo-speedup",
    title: "Rust Compiler Team Integrates Parallel Frontend by Default",
    summary: "Rust's package manager, Cargo, now compiles multi-crate workspace projects up to 40% faster by executing code validation checks on multiple cores.",
    key_points: [
      "Parallel compiler frontend is now enabled for all stable rustc toolchains.",
      "Memory footprint during compilation of large codebases was reduced by 15%.",
      "Developers can configure thread pool sizes directly in their cargo configs."
    ],
    body: `The Rust compiler team has merged a long-awaited optimization that enables a parallelized frontend by default in stable releases. This change dramatically improves compilation speeds, especially on high-core-count workstation processors.

### Parallel Frontend Architecture
Previously, while rustc could parallelize code generation (via LLVM), the frontend phase—responsible for parsing, name resolution, and type checking—ran in a single thread. The new architecture introduces a concurrent query system that checks independent functions and modules across all available CPU cores.

### Impact on Developer Workflows
For massive projects like the Linux kernel or Web browsers, local compile-and-test loops will feel significantly faster, removing a major source of friction in Rust development.`,
    category: { slug: "technology", name: "Technology", icon: "💻" },
    importance: 1,
    reading_time_minutes: 3,
    difficulty: "advanced",
    source_name: "Rust Lang Blog",
    source_url: "https://example.com/rust-parallel-compiler",
    published_at: "2026-06-28T14:00:00Z",
    entities: [
      { type: "organization", name: "Rust Foundation" }
    ],
    tags: ["Rust", "Compilers", "Software Engineering", "Systems Programming"],
    related_slugs: ["nextjs-app-router-performance-2026", "openai-scaling-frontiers-gpt5"]
  },
  {
    id: "art-12",
    slug: "grand-theft-auto-vi-rendering-engine",
    title: "GTA VI Technical Leaks Reveal Advanced AI-Driven Animation Engine",
    summary: "Rockstar Games' upcoming title uses localized neural networks to synthesize realistic human movement and reaction behaviors based on environmental stimuli.",
    key_points: [
      "Dynamic muscle deformation and facial reactions are rendered in real-time.",
      "The engine integrates weather physics, matching pedestrian gaits to wind and surface wetness.",
      "Network requirements are optimized via a custom local GPU shader pipeline."
    ],
    body: `Technical documentation leaked from Rockstar Games reveals how their upcoming title, Grand Theft Auto VI, leverages machine learning to power pedestrian behaviors.

### Neural Motion Synthesis
Traditionally, game characters rely on pre-recorded motion-capture files blended together. GTA VI introduces an animation engine that uses a lightweight neural network to synthesize locomotion in real-time. This allows a pedestrian to adjust their posture, weight distribution, and stride when walking on sand, dodging vehicles, or walking through high winds, avoiding unnatural animations.

### System Optimization
To run this without bottlenecking the CPU, Rockstar developers offloaded the neural network calculations directly onto GPU shaders, co-opting standard ray-tracing hardware to process motion queries.`,
    category: { slug: "gaming", name: "Gaming", icon: "🎮" },
    importance: 1,
    reading_time_minutes: 4,
    difficulty: "beginner",
    source_name: "Eurogamer Tech",
    source_url: "https://example.com/gta-vi-tech-leak",
    published_at: "2026-06-27T11:30:00Z",
    entities: [
      { type: "organization", name: "Rockstar Games" }
    ],
    tags: ["Gaming", "AI in Games", "Rendering", "Game Tech"],
    related_slugs: ["openai-scaling-frontiers-gpt5", "nextjs-app-router-performance-2026"]
  },
  {
    id: "art-13",
    slug: "davinci-resolve-ai-color-grading",
    title: "DaVinci Resolve 19.5 Introduces Neural Color Harmony Panels",
    summary: "Blackmagic Design integrates spatial-temporal color matching models, allowing editors to match exposure and tone across complex multi-camera shoots in seconds.",
    key_points: [
      "AI model matches shots across different camera sensors (ARRI, RED, Sony) automatically.",
      "Neural engine corrects skin tones while leaving ambient environmental lighting untouched.",
      "Optimized for Apple Silicon M4 Ultra and Nvidia Blackwell platforms."
    ],
    body: `Blackmagic Design has announced DaVinci Resolve 19.5, centering its update on new AI-assisted color grading workflows. The feature set aims to eliminate the tedious manual matching previously required for multi-cam shoots.

### Spatial-Temporal Match
The core engine analyzes the high-dynamic-range (HDR) distribution of a reference shot and maps its aesthetic profile to target clips. By recognizing objects and environmental lighting, the model ensures that skin tones remain natural, adjusting only the secondary lighting and color shifts to match the reference look.

### Platform Optimization
Resolve 19.5 is built to run locally, utilizing the dedicated tensor cores of modern GPUs to process high-resolution 8K ProRes files without requiring cloud connectivity.`,
    category: { slug: "editing-creative", name: "Editing & Creative", icon: "🎨" },
    importance: 1,
    reading_time_minutes: 3,
    difficulty: "intermediate",
    source_name: "Post Magazine",
    source_url: "https://example.com/resolve-neural-color",
    published_at: "2026-06-26T09:00:00Z",
    entities: [
      { type: "organization", name: "Blackmagic Design" }
    ],
    tags: ["Video Editing", "Color Grading", "DaVinci Resolve", "AI"],
    related_slugs: ["nextjs-app-router-performance-2026", "rust-compiler-cargo-speedup"]
  },
  {
    id: "art-14",
    slug: "spaced-repetition-cognitive-science",
    title: "Neuroscience Confirms Spaced Repetition Triggers Dendritic Spine Growth",
    summary: "A new study maps the structural changes in mouse brains during learning, proving that distributed review sessions trigger long-term synaptic connections.",
    key_points: [
      "Spaced review intervals trigger repeated localized protein synthesis in synapses.",
      "Cramming shows high initial activation but leads to rapid synaptic pruning within 72 hours.",
      "The optimal revision intervals are mathematically linked to neural recovery rates."
    ],
    body: `A groundbreaking study published in the journal Neuron provides physical evidence of what cognitive scientists have argued for decades: spaced repetition is the most effective way to store information in the human brain.

### The Synaptic Mechanism
Using advanced live-imaging microscopes, researchers tracked dendritic spine growth—the physical sites of connections between neurons—in mice learning complex maze paths. They found that when review sessions were spaced out, dendritic spines grew larger and more stable, cementing the memory.

### The Problem with Cramming
Conversely, when mice were trained in a single, prolonged session (cramming), dendritic spines showed rapid initial growth but collapsed and were pruned within three days. Without periods of rest, the brain does not trigger the protein synthesis required to stabilize the new connection.

These findings validate the algorithms used in spaced repetition software like Anki and KnowledgeOS's Study Mode.`,
    category: { slug: "learning", name: "Learning", icon: "📚" },
    importance: 2,
    reading_time_minutes: 4,
    difficulty: "intermediate",
    source_name: "Neuron Research Journal",
    source_url: "https://example.com/synaptic-spaced-repetition",
    published_at: "2026-06-25T15:00:00Z",
    entities: [
      { type: "organization", name: "Max Planck Institute" }
    ],
    tags: ["Learning", "Neuroscience", "Study Tips", "Cognitive Science"],
    related_slugs: ["rust-compiler-cargo-speedup", "fusion-energy-breakthrough-ignition"]
  },
  {
    id: "art-15",
    slug: "political-realism-modern-conflicts",
    title: "Re-evaluating Political Realism in 21st Century Hegemonic Rivalries",
    summary: "International relations scholars argue that classic realism, emphasizing security dilemmas and national interests, best explains the current multipolar tensions in Europe and Asia.",
    key_points: [
      "Thucydides' trap remains a relevant framework for analyzing the US-China relationship.",
      "The decline of multilateral treaties points to a return of raw power politics.",
      "Middle powers are increasingly forming shifting, task-oriented partnerships."
    ],
    body: `In the post-Cold War era, many theorists claimed that international trade, international law, and global institutions would render classic power politics obsolete. Today, as geopolitical conflicts flare across continents, scholars are returning to the cold logic of Political Realism.

### The Security Dilemma
Realism posits that because the international system is anarchic (lacking a global government), states must secure their own survival. This leads to the 'security dilemma': actions one nation takes to defend itself are perceived as threats by neighbors, leading to an arms race.

### Middle Power Pragmatism
Unlike the bipolar era of the Cold War, modern realism is characterized by the pragmatism of middle powers (like India, Turkey, and Brazil). These nations refuse to align with single blocs, choosing instead to negotiate issue-by-issue, maximizing their strategic leverage.

For students of political science, understanding these realist dynamics is vital for analyzing the actions of major powers in today's landscape.`,
    category: { slug: "politics", name: "Politics", icon: "🏛️" },
    importance: 3,
    reading_time_minutes: 5,
    difficulty: "advanced",
    source_name: "Geopolitical Quarterly",
    source_url: "https://example.com/realism-modern-conflict",
    published_at: "2026-06-24T10:00:00Z",
    entities: [
      { type: "country", name: "United States" },
      { type: "country", name: "China" },
      { type: "country", name: "India" }
    ],
    tags: ["Political Science", "International Relations", "Realism", "Geopolitics"],
    related_slugs: ["indias-foreign-policy-multi-alignment", "eu-carbon-border-adjustment-mechanism"]
  }
];

export const MOCK_DAILY_BRIEFS: DailyBrief = {
  morning: {
    headlines: [
      { id: "h-m1", title: "US and China Agree to Establish De-escalation Communication Line", summary: "A new direct hotline between defense ministries aims to prevent accidents in the South China Sea.", category: "politics", importance: 3, source: "Reuters" },
      { id: "h-m2", title: "Tokyo Stock Exchange Hits Record Highs on Tech Earnings", summary: "Strong earnings from domestic semiconductor suppliers lead Nikkei 225 index up 2.4%.", category: "economy", importance: 2, source: "Nikkei Asia" },
      { id: "h-m3", title: "OpenAI Launches Live Video Mode for Premium Accounts", summary: "The new feature allows real-time interactive computer-vision analysis with sub-100ms latency.", category: "ai", importance: 2, source: "TechCrunch" }
    ],
    sections: [
      {
        title: "World Affairs & Politics",
        items: [
          { id: "sec-m1", title: "UK Prime Minister Announces Major Clean Energy Grid Initiative", summary: "Government pledges £10 billion to upgrade North Sea wind farm connections to the main grid.", category: "politics", importance: 2, source: "BBC News" },
          { id: "sec-m2", title: "UN Security Council Convenes Emergency Session on Trade Corridors", summary: "Members debate maritime security resolutions to protect commercial shipping in shipping lanes.", category: "international-affairs", importance: 3, source: "UN News" }
        ]
      },
      {
        title: "Technology & AI",
        items: [
          { id: "sec-m3", title: "Meta Releases Open-Source Llama-4-Lite Weights", summary: "The 8-billion parameter model matches GPT-4o performance in reasoning while running locally on mobile hardware.", category: "ai", importance: 2, source: "Meta AI Blog" },
          { id: "sec-m4", title: "Global Foundries Announces Upgraded German Fabrication Facility", summary: "Expansion targets automotive microcontrollers, adding capacity for 50,000 wafer starts monthly.", category: "technology", importance: 1, source: "EE Times" }
        ]
      }
    ],
    facts: [
      "Semiconductor capital investments globally are projected to top $150 billion in 2026.",
      "The r-star neutral rate estimate has risen by 75 basis points over the last 24 months.",
      "Fusion energy ignition experiments at NIF now regularly yield more than 5 MJ of thermal energy."
    ],
    quote: {
      text: "Strategic autonomy is not isolation; it is the freedom to choose your partners based on shared interests rather than historical obligations.",
      author: "Dr. S. Jaishankar",
      context: "Address at the Raisina Dialogue"
    },
    word: {
      word: "Thucydides' Trap",
      pronunciation: "/θuːˈsɪdɪdiːz træp/",
      definition: "The apparent tendency toward war when an emerging power threatens to displace an existing hegemon.",
      usage: "Political scientists reference Thucydides' Trap when analyzing the strategic competition between the US and China."
    }
  },
  afternoon: {
    headlines: [
      { id: "h-a1", title: "India Digital Rupee Exceeds 10 Million Daily Transactions", summary: "Reserve Bank reports digital currency merchant adoption has tripled over the last quarter.", category: "india", importance: 2, source: "Press Trust of India" },
      { id: "h-a2", title: "European Central Bank Holds Rates, Notes Sticky Service Inflation", summary: "President signals that rate cuts are paused until core inflation dips below 2.5%.", category: "economy", importance: 2, source: "Eurostat" },
      { id: "h-a3", title: "SpaceX Starship Booster Receives Clearance for Immediate Catch Attempt", summary: "FAA issues license for Starship Flight 6, approving Chopstick recovery at Starbase, Texas.", category: "technology", importance: 2, source: "NASA Spaceflight" }
    ],
    sections: [
      {
        title: "Politics & International Affairs",
        items: [
          { id: "sec-a1", title: "Germany Approves Joint Naval Patrols with Baltic Allies", summary: "Patrols aim to monitor subsea critical infrastructure (gas lines and internet cables) for anomalies.", category: "international-affairs", importance: 2, source: "Deutsche Welle" },
          { id: "sec-a2", title: "India and France Agree to Co-Develop Defense Satellite Cluster", summary: "ISRO and CNES will co-produce low-earth-orbit imagery systems for maritime monitoring.", category: "india", importance: 2, source: "Hindustan Times" }
        ]
      },
      {
        title: "Science & Gaming",
        items: [
          { id: "sec-a3", title: "NASA's James Webb Detects Water Vapor in Rocky Exoplanet Atmosphere", summary: "The telescope detects water signatures in the atmosphere of a planet orbiting a red dwarf star 40 light-years away.", category: "science", importance: 3, source: "NASA Press" },
          { id: "sec-a4", title: "Nintendo Announces Switch 2 Release Date and Launch Lineup", summary: "The console will launch in October, featuring upgraded hardware ray-tracing and full backward compatibility.", category: "gaming", importance: 1, source: "IGN" }
        ]
      }
    ],
    facts: [
      "India's UPI system now processes over 12 billion transactions monthly.",
      "The James Webb space telescope operates in an orbit around the second Lagrange point (L2).",
      "Over 90% of advanced semiconductor logic production remains concentrated in the Hsinchu Science Park, Taiwan."
    ],
    quote: {
      text: "The supreme art of war is to subdue the enemy without fighting.",
      author: "Sun Tzu",
      context: "The Art of War"
    },
    word: {
      word: "Strategic Autonomy",
      pronunciation: "/strəˈtiːdʒɪk ɔːˈtɒnəmi/",
      definition: "The ability of a state to pursue its national interests and adopt foreign policy choices without relying heavily on other nations.",
      usage: "India's foreign policy relies heavily on strategic autonomy to balance relations between Russia and the West."
    }
  },
  evening: {
    headlines: [
      { id: "h-e1", title: "COP31 Summit Location Confirmed for New Delhi, India", summary: "UN Climate Change announces India will host the major global climate negotiations in late 2026.", category: "india", importance: 3, source: "UNFCCC Press" },
      { id: "h-e2", title: "Microsoft Integrates Local Reasoning Models Directly in Windows 12", summary: "New OS updates run 7B parameters locally, enabling offline contextual indexing and assistant capabilities.", category: "technology", importance: 2, source: "Windows Central" },
      { id: "h-e3", title: "Global Oil Prices Slide 3% on Increased US Production Metrics", summary: "West Texas Intermediate falls to $68.50 per barrel following weekly inventory surplus reports.", category: "economy", importance: 2, source: "Reuters Business" }
    ],
    sections: [
      {
        title: "World Affairs & Politics",
        items: [
          { id: "sec-e1", title: "Brazil President Proposes New Common Currency for South America", summary: "Proposed digital currency 'Sur' is intended for cross-border trade settlements to reduce dollar dependency.", category: "international-affairs", importance: 2, source: "El País" },
          { id: "sec-e2", title: "India's Supreme Court Mandates Strict Data Anonymization in Public Health Systems", summary: "Unanimous bench rules that health registries must enforce differential privacy before data sharing.", category: "india", importance: 2, source: "LiveLaw" }
        ]
      },
      {
        title: "Creative & Learning",
        items: [
          { id: "sec-e3", title: "Adobe Premiere Pro Launches Generative Video Fill Feature", summary: "New tool allows editors to extend clips and change lighting using text descriptions inside timelines.", category: "editing-creative", importance: 1, source: "Variety" },
          { id: "sec-e4", title: "Stanford Study Shows Online Spaced Repetition Triples Vocabulary Retention", summary: "A controlled trial shows users of digital flashcards retained three times more language vocabulary over six months.", category: "learning", importance: 2, source: "Stanford Education" }
        ]
      }
    ],
    facts: [
      "India will host the UN Climate Change Conference (COP) for the second time (first was COP8 in 2002).",
      "Differential privacy adds mathematical noise to datasets to protect individual records while maintaining aggregate value.",
      "The crude oil benchmark Brent Crude is extracted from the North Sea between Scotland and Norway."
    ],
    quote: {
      text: "The state is a relation of men dominating men, a relation supported by means of legitimate violence.",
      author: "Max Weber",
      context: "Politics as a Vocation"
    },
    word: {
      word: "Hegemony",
      pronunciation: "/hɪˈdʒɛməni/",
      definition: "The political, economic, or military predominance or control of one state over others.",
      usage: "Political realists analyze the shifts in global hegemony as the United States navigates relations in Asia."
    }
  }
};
