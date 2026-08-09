/**
 * Guards against TechniqueRecommender case groups becoming unreachable.
 *
 * The recommender switches on problem categories, but only ProblemAnalyzer can
 * produce them. When a case group has no producing category, every technique
 * registered there is stranded — silently, with no type error and no test
 * failure. Four groups (decision, communication, cultural, biological) were
 * dead this way, which is why techniques registered under their most on-point
 * category were never recommended.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TechniqueRecommender } from '../../../layers/discovery/TechniqueRecommender.js';
import { ProblemAnalyzer } from '../../../layers/discovery/ProblemAnalyzer.js';
import { TechniqueRegistry } from '../../../techniques/TechniqueRegistry.js';

/**
 * Every category ProblemAnalyzer.categorizeProblem can return. If you add a
 * `return '<category>'` there, add it here too — this list is what proves the
 * recommender actually handles it.
 */
const PRODUCIBLE_CATEGORIES = [
  'adversarial',
  'behavioral',
  'biological',
  'cognitive',
  'communication',
  'computational',
  'creative',
  'cultural',
  'decision',
  'fundamental',
  'general',
  'implementation',
  'learning',
  'organizational',
  'paradoxical',
  'process',
  'retention',
  'strategic',
  'systems',
  'technical',
  'temporal',
  'user-centered',
  'validation',
] as const;

describe('Discovery category reachability', () => {
  let recommender: TechniqueRecommender;
  let analyzer: ProblemAnalyzer;
  let registry: TechniqueRegistry;

  beforeEach(() => {
    recommender = new TechniqueRecommender();
    analyzer = new ProblemAnalyzer();
    registry = TechniqueRegistry.getInstance();
  });

  it('recommends at least one technique for every producible category', () => {
    for (const category of PRODUCIBLE_CATEGORIES) {
      const recommendations = recommender.recommendTechniques(
        category,
        undefined,
        undefined,
        'medium',
        registry
      );
      expect(
        recommendations.length,
        `category "${category}" produced no recommendations — its case group may be missing`
      ).toBeGreaterThan(0);
    }
  });

  describe('rescue categories reclaim problems that used to fall through to general', () => {
    const cases: Array<{ category: string; problems: string[] }> = [
      {
        category: 'decision',
        problems: [
          'Should we acquire this competitor? I really want to do this deal',
          'Which vendor should we pick for observability?',
          'What are the pros and cons of rewriting the billing service?',
        ],
      },
      {
        category: 'communication',
        problems: ['Explain to the board why the migration slipped'],
      },
      {
        category: 'cultural',
        problems: [
          'How do we handle localization for new markets?',
          'Our culture rewards the wrong things',
        ],
      },
      {
        category: 'retention',
        problems: [
          'Do we still need the QA task group?',
          'Is the design review process still earning its keep?',
          'We built an internal dashboard nobody opens',
          'Keep or cut the quarterly offsite?',
          // These reach retention only via the early end-of-life pass. Without
          // it they are claimed by technical, organizational and decision
          // respectively, on what the subject is rather than what is asked
          // about it — which is how latticework ended up invisible.
          'Can we decommission the staging cluster?',
          'Time to retire the old Jenkins pipeline?',
          'Should we sunset the v1 public API?',
          'Should I cancel my Adobe subscription?',
          'Nobody uses the legacy reporting service any more',
        ],
      },
      {
        category: 'biological',
        problems: [
          'What can biomimicry teach us here?',
          'How would a swarm solve this?',
          'Look for symbiosis between the two products',
        ],
      },
      {
        category: 'adversarial',
        problems: [
          // Reachable via the broad detector, at the end of the chain.
          'What could go wrong with the rollout?',
          'What are the failure modes of this design?',
          'Sanity check my reasoning on the pricing tiers',
          // These reach adversarial only via the early explicit pass. Without
          // it they are claimed by technical, validation and general on what
          // the problem is about, rather than on what is being asked of it.
          'Red team our incident response process',
          'Steelman the case for staying multi-vendor',
          "Play devil's advocate on the hiring freeze",
          'Prove me wrong about dropping the mobile app',
          "Convince me I'm wrong about consolidating vendors",
          'Poke holes in our migration plan',
          'Tear apart my proposal for the new pricing model',
          'Talk me out of signing the three-year contract',
          'Challenge my assumptions about the roadmap',
          'Run a pre-mortem on the Q3 launch',
          'What am I missing here?',
          'Argue the other side of this',
          'The strongest case against rewriting in Rust',
          // The explicit pass sits above the temporal check on purpose: a
          // deadline in the sentence is context, not the ask. This routed
          // temporal on 'before' alone until the pass was moved up.
          'Stress test the plan before we commit',
        ],
      },
    ];

    for (const { category, problems } of cases) {
      for (const problem of problems) {
        it(`routes "${problem.slice(0, 45)}..." to ${category}`, () => {
          expect(analyzer.categorizeProblem(problem)).toBe(category);
        });
      }
    }
  });

  describe('retention routing stays high-precision', () => {
    // The end-of-life pass runs ahead of every topic detector, so a loose term
    // reroutes unrelated problems. These are near-misses of the retention
    // vocabulary — each contains a substring of a term it matches on. The
    // cancellation case is why bare 'cancel' was removed from both lists.
    const mustNotBeRetention = [
      // Substring near-misses of the vocabulary.
      'How do we restructure the employee retirement plan?',
      'The deprecated API is throwing warnings in production logs',
      'Write a cancellation policy for the billing flow',
      'How do we keep the p99 latency under 100ms?',
      'Plan the migration so the team can renew focus on the roadmap',
      'Draft marketing copy for the sunset-themed campaign',
      'Customers keep asking about seats pricing on the contract page',
      // Constructive asks that merely mention an incumbent. The end-of-life
      // pass must yield to the topic detectors on these — the ask is to build
      // or repair the thing, not to decide whether to keep it.
      'Nobody reads our documentation — how do we fix it?',
      'We need an end of life support page for customers',
      'Build a license key validation service',
      // A service that shuts down on its own is an outage, not a decision.
      'Our service will shut down if memory pressure keeps climbing',
      'The database shut down unexpectedly during peak traffic',
    ];

    for (const problem of mustNotBeRetention) {
      it(`leaves "${problem.slice(0, 40)}..." alone`, () => {
        expect(analyzer.categorizeProblem(problem)).not.toBe('retention');
      });
    }
  });

  describe('adversarial routing stays high-precision', () => {
    // The explicit pass runs ahead of every topic detector and even ahead of
    // the temporal check, so a loose term here reroutes a lot. Each of these
    // contains vocabulary the detectors match on, in a sense that is not a
    // request to be argued with.
    const mustNotBeAdversarial = [
      // 'stress test' in its engineering sense. It counts only next to the
      // thing being argued with, which is why the position-noun allowlist
      // exists rather than a blocklist of load vocabulary.
      'Stress test the database at 10k requests per second',
      'Stress test the checkout service and record p99 latency',
      // 'holes' as a noun is a defect report, not a request for opposition.
      'There are holes in the coverage report',
      // Authoring a document *about* red teaming is a writing task. This is
      // the one veto the explicit pass carries, and it needs both an authoring
      // verb and a document noun so that 'red team the design before we build
      // it' still survives.
      'Write the red team engagement report template',
      'Draft the pre-mortem checklist for the onboarding docs',
      // Broad-detector vocabulary in its performance sense.
      'What is the worst case latency under load?',
      'Reduce worst case throughput variance on the ingest path',
      // Broad-detector vocabulary under a constructive ask. The verb has to be
      // in verb position: 'what are the failure modes of this design' must
      // still route adversarial, and did not while the veto matched any
      // occurrence of the word.
      'Fix the blind spot in the rear camera UI',
      'Redesign the critique widget',
      'Build a dashboard that surfaces failure modes to on-call',
    ];

    for (const problem of mustNotBeAdversarial) {
      it(`leaves "${problem.slice(0, 40)}..." alone`, () => {
        expect(analyzer.categorizeProblem(problem)).not.toBe('adversarial');
      });
    }
  });

  describe('adversarial asks survive a constructive verb in the same sentence', () => {
    // The retention detector's general constructive-ask veto cannot be reused
    // in the explicit pass: these are the natural phrasings of a genuine
    // request, and every one of them contains a constructive verb. Applying
    // the veto there cost recall immediately.
    const mustStayAdversarial = [
      'Red team the design before we build it',
      'Poke holes in this before we ship',
      'Steelman the case for rewriting it',
      'Red team our plan to sunset the v1 API',
    ];

    for (const problem of mustStayAdversarial) {
      it(`keeps "${problem.slice(0, 40)}..."`, () => {
        expect(analyzer.categorizeProblem(problem)).toBe('adversarial');
      });
    }
  });

  describe('a stated alternative does not disqualify a retention decision', () => {
    // The constructive-ask veto above must not reach the decisive verbs. The
    // most natural way to ask a keep-or-cut question states the alternative as
    // the other arm — "sunset it or migrate?" — and an earlier version of the
    // veto read that alternative as the ask and rejected all of these.
    const mustBeRetention = [
      'Should we sunset the v1 API or migrate users to v2?',
      'Do we decommission the staging cluster or fix it?',
      'Should we retire the old pipeline or improve it?',
      'Do we drop support for Java 11 or build a compatibility shim?',
      'Phase out manual QA or improve the existing process?',
      'Nobody uses the dashboard we built — keep it or drop it?',
    ];

    for (const problem of mustBeRetention) {
      it(`keeps "${problem.slice(0, 40)}..." in retention`, () => {
        expect(analyzer.categorizeProblem(problem)).toBe('retention');
      });
    }
  });

  it('surfaces the keeper test for retention problems', () => {
    // Appearing in the case group is not enough: low-complexity problems get
    // three slots, which is why latticework is invisible in the crowded
    // `decision` group. Assert on the truncated output, not the raw group.
    const recommendations = recommender.recommendTechniques(
      'retention',
      undefined,
      undefined,
      'low',
      registry
    );
    expect(recommendations.map(r => r.technique)).toContain('keeper_test');
  });

  it('surfaces the steelman and red team for adversarial problems', () => {
    // Same guard as above, and the same reason: routing to `adversarial` while
    // being truncated out of the three low-complexity slots would look like a
    // pass and deliver nothing.
    const recommendations = recommender.recommendTechniques(
      'adversarial',
      undefined,
      undefined,
      'low',
      registry
    );
    expect(recommendations.map(r => r.technique)).toContain('steelman_red_team');
  });

  it('surfaces the cognitive bias audit for decision problems', () => {
    const recommendations = recommender.recommendTechniques(
      'decision',
      undefined,
      undefined,
      'medium',
      registry
    );
    expect(recommendations.map(r => r.technique)).toContain('cognitive_bias_audit');
  });
});
