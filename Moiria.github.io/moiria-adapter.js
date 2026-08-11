/*
  Moiria Specialist Adapter
  Version: 0.1.0
  Architecture: Noema -> NAIB -> Moiria -> The Refrain

  Moiria is a music mentor and Refrain navigator.
  This adapter is intentionally handoff-only.
  It does not grant permissions, perform remote execution,
  claim that a performance or recording occurred,
  or take authorship away from the musician.
*/

const MODES = Object.freeze([
  "learn",
  "compose",
  "songwrite",
  "arrange",
  "practice",
  "perform",
  "produce",
  "research"
]);

const MUSICAL_DOMAINS = Object.freeze([
  {
    id: "melody",
    label: "Melody",
    terms: ["melody","motif","theme","tune","melodic","phrase"]
  },
  {
    id: "harmony",
    label: "Harmony",
    terms: ["harmony","chord","chords","progression","voicing","harmonic","key"]
  },
  {
    id: "rhythm",
    label: "Rhythm & Meter",
    terms: ["rhythm","meter","tempo","beat","groove","time signature","syncopation"]
  },
  {
    id: "songwriting",
    label: "Songwriting",
    terms: ["song","songwriting","verse","chorus","bridge","hook","lyrics"]
  },
  {
    id: "composition",
    label: "Composition",
    terms: ["compose","composition","piece","score","form","movement","counterpoint"]
  },
  {
    id: "arrangement",
    label: "Arrangement & Instrumentation",
    terms: ["arrange","arrangement","instrument","instrumentation","orchestration","ensemble"]
  },
  {
    id: "theory",
    label: "Music Theory",
    terms: ["theory","scale","interval","mode","notation","cadence","analysis"]
  },
  {
    id: "ear-training",
    label: "Ear Training",
    terms: ["ear training","interval recognition","dictation","aural","listen","listening"]
  },
  {
    id: "practice",
    label: "Practice",
    terms: ["practice","rehearse","rehearsal","technique","warmup","warm-up","routine"]
  },
  {
    id: "performance",
    label: "Performance Preparation",
    terms: ["perform","performance","stage","recital","audition","concert","setlist"]
  },
  {
    id: "production",
    label: "Recording & Production",
    terms: ["record","recording","production","mix","mixing","master","mastering","track","studio","audio"]
  },
  {
    id: "research",
    label: "Music Research",
    terms: ["research","history","composer","genre","style","reference","source"]
  }
]);

const RESOURCE_HINTS = Object.freeze([
  {
    id: "the-refrain",
    label: "The Refrain",
    domains: [
      "melody","harmony","rhythm","songwriting","composition",
      "arrangement","theory","ear-training","practice",
      "performance","production","research"
    ]
  },
  {
    id: "eiren",
    label: "Eiren",
    domains: ["songwriting","composition"]
  },
  {
    id: "zelle",
    label: "Zelle",
    domains: ["composition","arrangement","songwriting"]
  },
  {
    id: "archaemenes",
    label: "Archaemenes",
    domains: ["theory","research","ear-training","practice"]
  },
  {
    id: "arshif",
    label: "ARSHIF",
    domains: ["research"]
  }
]);

const BOUNDARIES = Object.freeze([
  "no-administrative-authority",
  "no-permission-elevation",
  "no-resource-ownership",
  "no-impersonation",
  "no-silent-long-term-memory",
  "no-remote-execution-claims",
  "preserve-user-authorship",
  "preserve-musician-authorship",
  "no-false-performance-or-recording-claims",
  "no-false-copyright-ownership-claims"
]);

function normalize(value = "") {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeMode(value = "learn") {
  const mode = normalize(value);
  return MODES.includes(mode) ? mode : "learn";
}

function scoreDomain(domain, text) {
  return domain.terms.reduce(
    (score, term) => score + (text.includes(term) ? 1 : 0),
    0
  );
}

function detectDomains(message = "") {
  const text = normalize(message);

  return MUSICAL_DOMAINS
    .map(domain => ({
      id: domain.id,
      label: domain.label,
      score: scoreDomain(domain, text)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

function rankResourceHints(domains = []) {
  const ids = new Set(domains.map(item => item.id));

  return RESOURCE_HINTS
    .map(resource => ({
      id: resource.id,
      label: resource.label,
      score: resource.domains.reduce(
        (score, domain) => score + (ids.has(domain) ? 1 : 0),
        0
      )
    }))
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
}

function chooseResourceHints(domains = [], limit = 4) {
  const ranked = rankResourceHints(domains);
  const positive = ranked.filter(item => item.score > 0);
  return (positive.length ? positive : ranked).slice(0, limit);
}

function buildMusicalFrame(message, mode, domains) {
  const principles = {
    learn:
      "Explain the musical idea clearly, connect it to sound, and give one approachable next step.",
    compose:
      "Help shape musical material while keeping the composer's intention and authorship central.",
    songwrite:
      "Support the relationship between lyric, melody, harmony, rhythm and form without taking the song away from its writer.",
    arrange:
      "Explore texture, instrumentation, register, voicing, dynamics and form as options rather than prescriptions.",
    practice:
      "Turn the musical goal into a focused, repeatable practice sequence with a manageable first step.",
    perform:
      "Prepare interpretation, consistency, pacing and rehearsal without claiming an actual performance occurred.",
    produce:
      "Organize recording and production choices without claiming that recording, mixing, mastering or publishing was executed.",
    research:
      "Clarify the research question and route factual or current claims through approved evidence and source pathways."
  };

  return {
    mode,
    principle: principles[mode],
    detectedDomains: domains,
    sourceText: message
  };
}

export const MoiriaAdapter = Object.freeze({
  id: "moiria",
  name: "Moiria",
  version: "0.1.0",

  capabilities: Object.freeze([
    "music-learning-guidance",
    "melody-development",
    "harmony-and-chord-exploration",
    "rhythm-and-meter-guidance",
    "songwriting-development",
    "composition-guidance",
    "arrangement-guidance",
    "instrumentation-guidance",
    "ear-training-guidance",
    "music-theory-guidance",
    "practice-planning",
    "performance-preparation",
    "recording-and-production-pathway-guidance",
    "music-research-pathways",
    "age-adaptive-music-mentoring",
    "refrain-resource-navigation",
    "structured-specialist-handoff"
  ]),

  availability: "handoff-ready",
  authority: "music-mentoring-and-refrain-resource-handoff",
  boundaries: BOUNDARIES,

  canExecute() {
    return {
      allowed: false,
      reason: "handoff-ready-specialist",
      note:
        "Moiria can prepare musical guidance and Refrain handoffs, but cannot claim that an external performance, recording, publishing action or studio process was executed."
    };
  },

  prepare(context = {}) {
    const message = String(context.message ?? context.query ?? "");
    const mode = normalizeMode(context.mode);
    const domains = detectDomains(message);
    const resourceHints = chooseResourceHints(domains);

    return {
      specialist: "moiria",
      version: "0.1.0",
      status: "prepared",
      mode,
      principle: "Flow · Create · Connect",
      musicalFrame: buildMusicalFrame(message, mode, domains),
      resourceHints,
      requiresUserAction: true,
      requiresFederationResolution: true,
      authority: this.authority,
      boundaries: [...BOUNDARIES],
      memory: {
        persistent: false,
        note:
          "This adapter does not silently store conversation history or long-term personal memory."
      },
      authorship: {
        owner: "user",
        principle:
          "Moiria helps the musician develop the work without claiming authorship, copyright ownership or creative identity."
      },
      executionClaims: {
        performanceOccurred: false,
        recordingOccurred: false,
        mixingOccurred: false,
        masteringOccurred: false,
        publishingOccurred: false
      },
      resourceRelationship: {
        primaryHome: "the-refrain",
        role: "mentor-and-navigator",
        ownsResources: false,
        controlsResources: false,
        note:
          "The Refrain remains its own resource ecosystem. Noema's approved federation resolves authoritative destinations."
      }
    };
  },

  async execute(context = {}) {
    return {
      specialist: "moiria",
      version: "0.1.0",
      status: "handoff-required",
      executed: false,
      prepared: this.prepare(context),
      note:
        "No remote performance, recording, production, publishing or external resource action was executed."
    };
  }
});

export function getMoiriaDomains(message = "") {
  return detectDomains(message);
}

export function getMoiriaResourceHints(message = "", limit = 4) {
  const domains = detectDomains(message);
  const safeLimit = Math.max(
    1,
    Math.min(Number(limit) || 4, RESOURCE_HINTS.length)
  );
  return chooseResourceHints(domains, safeLimit);
}

export function getMoiriaModes() {
  return [...MODES];
}

export default MoiriaAdapter;
