# Technique Selection Improvements Plan

## Current Issues Found

### 1. Missing Techniques in Wildcard Selection

The wildcard selection (lines 514-531 in TechniqueRecommender.ts) only includes 16 out of 28
techniques. Missing:

- `paradoxical_problem`
- `meta_learning`
- `biomimetic_path`
- `first_principles`
- `neuro_computational`
- `criteria_based_analysis`
- `linguistic_forensics`
- `competing_hypotheses`
- `reverse_benchmarking`
- `context_reframing`
- `perception_optimization`
- `anecdotal_signal`

### 2. Underutilized Techniques

Several techniques are not mapped to any problem categories:

- `first_principles` - Should be in: technical, systems, process
- `neuro_computational` - Should be in: technical, cognitive, creative
- `perception_optimization` - Should be in: user-centered, strategic, communication
- `context_reframing` - Should be in: organizational, strategic, communication
- `meta_learning` - Should be in: adaptive, learning, systems

### 3. Category Gaps

Some problem types could benefit from additional technique mappings:

#### Technical Problems

- Add: `first_principles` (deconstruct to fundamentals)
- Add: `neuro_computational` (computational modeling)
- Add: `biomimetic_path` (nature-inspired solutions)

#### Creative Problems

- Add: `perception_optimization` (subjective experience design)
- Add: `anecdotal_signal` (outlier inspiration)
- Add: `context_reframing` (environmental creativity boost)

#### Process Problems

- Add: `first_principles` (rebuild from basics)
- Add: `temporal_work` (time management optimization)
- Add: `nine_windows` (systematic analysis)

#### Strategic Problems

- Add: `first_principles` (fundamental strategy)
- Add: `context_reframing` (change decision environment)
- Add: `perception_optimization` (value perception)

## Improvement Recommendations

### 1. Complete Wildcard Technique List

Update the `allTechniques` array in `selectWildcardTechnique` to include all 28 techniques.

### 2. Add New Problem Categories

```typescript
case 'fundamental':
case 'first-principles':
  - first_principles (primary)
  - triz (systematic innovation)
  - concept_extraction (pattern extraction)

case 'behavioral':
case 'psychology':
  - perception_optimization (subjective value)
  - context_reframing (environment design)
  - anecdotal_signal (behavioral signals)
  - reverse_benchmarking (anti-mimetic)

case 'learning':
case 'adaptive':
  - meta_learning (pattern synthesis)
  - biomimetic_path (evolutionary learning)
  - temporal_creativity (learning from history)

case 'computational':
case 'algorithmic':
  - neuro_computational (neural synthesis)
  - quantum_superposition (parallel processing)
  - first_principles (algorithmic decomposition)
```

### 3. Enhanced Technique Selection Algorithm

#### A. Multi-Factor Scoring

Instead of just category matching, score techniques on:

- Category fit (0.4 weight)
- Complexity match (0.2 weight)
- Constraint compatibility (0.2 weight)
- Outcome alignment (0.2 weight)

#### B. Technique Complementarity

Track which techniques work well together:

- `first_principles` + `scamper` (deconstruct then modify)
- `criteria_based_analysis` + `competing_hypotheses` (verification combo)
- `perception_optimization` + `context_reframing` (behavioral duo)
- `anecdotal_signal` + `reverse_benchmarking` (outlier insights)

#### C. Problem Complexity Mapping

- **Low Complexity**: Prefer single-technique solutions (3-4 steps)
- **Medium Complexity**: Combine 2-3 complementary techniques
- **High Complexity**: Full suite including verification techniques

### 4. Dynamic Technique Discovery

Add problem analysis that detects keywords/patterns:

- "truth", "verify", "authentic" → Analytical verification techniques
- "behavior", "perception", "value" → Behavioral economics techniques
- "fundamental", "basic", "core" → first_principles
- "nature", "biological", "evolution" → biomimetic_path
- "learn", "pattern", "synthesize" → meta_learning

### 5. Technique Usage Analytics

Track and learn from:

- Which techniques are selected but not used
- Which combinations produce best results
- User feedback on technique effectiveness

## Implementation Priority

1. **HIGH**: Add all 28 techniques to wildcard selection
2. **HIGH**: Map underutilized techniques to appropriate categories
3. **MEDIUM**: Add new problem categories for behavioral/fundamental/computational
4. **MEDIUM**: Implement multi-factor scoring
5. **LOW**: Add complementarity tracking
6. **LOW**: Implement usage analytics

## Code Changes Required

### File: `src/layers/discovery/TechniqueRecommender.ts`

1. Update `allTechniques` array (lines 514-531)
2. Add new case statements for problem categories
3. Fix duplicate cultural_integration in organizational
4. Add keyword detection for problem analysis
5. Implement multi-factor scoring function

### File: `src/types/index.ts`

1. Ensure all 28 techniques are in `LateralTechnique` type
2. Add new problem category types if needed

### Testing Required

1. Verify all 28 techniques can be recommended
2. Test new problem categories
3. Validate multi-factor scoring improves selection
4. Ensure no techniques are orphaned
