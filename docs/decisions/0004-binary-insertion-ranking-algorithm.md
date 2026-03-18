# ADR-0004: Binary Insertion Ranking Algorithm

- **Status:** Accepted
- **Date:** 2025-01-01
- **Deciders:** Project lead

## Context and Problem Statement

Users need to rank movies by personal preference. We need an algorithm that determines where a new movie fits in an existing ranked list. The input is pairwise human comparisons ("which movie do you prefer?"), so minimizing the number of comparisons is critical for UX.

## Decision Drivers

- Minimize user effort (number of comparisons per movie)
- Deterministic — same choices produce same result
- Support re-ranking (remove and re-insert)
- Simple to implement and test

## Considered Options

1. **Binary insertion** — Binary search via pairwise comparisons, O(log n)
2. **Sequential comparison** — Compare against every ranked movie, O(n)
3. **Elo rating** — Statistical rating system (chess-style)
4. **Drag-and-drop** — Manual reordering

## Decision Outcome

**Chosen option: "Binary insertion"**, because it minimizes comparisons to ⌈log₂(n+1)⌉ per movie while producing a definitive ranked position. For a list of 100 movies, that's ~7 comparisons instead of up to 100.

### Consequences

- **Good:** Logarithmic comparisons — ranking a movie in a list of 500 takes only ~9 comparisons.
- **Good:** Immutable state machine design makes the flow testable and predictable.
- **Good:** Re-ranking reuses the same algorithm (remove, then re-insert).
- **Bad:** Assumes transitive preferences (if A > B and B > C, then A > C). Human preferences aren't always transitive.
- **Neutral:** Result is a total ordering, which may feel overly precise for subjective rankings.

## Implementation

The algorithm is implemented as an immutable state machine in `lib/binaryInsertion.ts`:

```typescript
const state = resolveInsertionPosition(rankedMovies, movieToRank);
// state.isComplete === false
// state.comparisonMovie → movie to compare against
// state.pick(preferredId) → next state
// ... repeat until state.isComplete === true
// state.insertionPosition → final rank (1-indexed)
```

Each `pick()` call returns a new state object — no mutation. The comparison screen renders the current state and calls `pick()` with the user's choice.

## Pros and Cons of the Options

### Binary Insertion

- ✅ O(log n) comparisons per movie
- ✅ Deterministic total ordering
- ✅ Simple state machine, easy to test
- ❌ Assumes transitive preferences
- ❌ No way to express "I can't decide" or "they're equal"

### Sequential Comparison

- ✅ Very simple to implement
- ✅ Can stop early if user finds the right spot
- ❌ O(n) comparisons — tedious for large lists
- ❌ Poor UX at scale

### Elo Rating

- ✅ Handles non-transitive preferences
- ✅ Ratings converge over time
- ❌ No definitive ordering — rankings are probabilistic
- ❌ Requires many comparisons for stable ratings
- ❌ More complex to implement and explain to users

### Drag-and-Drop

- ✅ Most intuitive for small lists
- ✅ User has full control
- ❌ Doesn't scale — impractical above ~20 items
- ❌ No guidance on where a movie should go

## Links

- [Binary insertion implementation](../../lib/binaryInsertion.ts)
- [Architecture Overview](../architecture/overview.md)
