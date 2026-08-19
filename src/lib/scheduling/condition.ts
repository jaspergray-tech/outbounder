import type { Facts } from './facts'

// Matches the JSON rule shape documented on SequenceStep.condition, e.g.:
//   { all: [ { fact: "connection_accepted", equals: false }, ... ] }
type Clause = { fact: string; equals: boolean }
type ConditionRule = { all?: Clause[]; any?: Clause[] }

// A null/undefined condition means the step always fires.
export function evaluateCondition(condition: unknown, facts: Facts): boolean {
  if (!condition || typeof condition !== 'object') return true
  const rule = condition as ConditionRule

  if (Array.isArray(rule.all)) {
    return rule.all.every((clause) => facts[clause.fact] === clause.equals)
  }
  if (Array.isArray(rule.any)) {
    return rule.any.some((clause) => facts[clause.fact] === clause.equals)
  }
  return true
}
