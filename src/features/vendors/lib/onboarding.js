import { ONBOARDING_STEPS } from '../constants';

const KEYS = ONBOARDING_STEPS.map((s) => s.key);

/** Index of the furthest step the vendor may open. A submitted (rejected) store opens at review. */
export function reachedIndex(serverStep) {
  if (serverStep === 'submitted') return KEYS.length - 1;
  return Math.max(0, KEYS.indexOf(serverStep));
}

export const stepIndex = (key) => KEYS.indexOf(key);
export const nextStep = (key) => KEYS[Math.min(KEYS.indexOf(key) + 1, KEYS.length - 1)];
export const prevStep = (key) => KEYS[Math.max(KEYS.indexOf(key) - 1, 0)];

/** Required documents the vendor has not uploaded yet. */
export const missingDocuments = (onboarding) =>
  (onboarding?.requiredDocuments ?? []).filter(
    (d) => !onboarding.documents.some((x) => x.type === d.type),
  );
