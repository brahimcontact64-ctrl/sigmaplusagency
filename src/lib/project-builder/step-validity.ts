import type { BuilderFormData, StepId } from "@/components/project-builder/types";

/**
 * Pure, dependency-free validity check for each of the 4 Project
 * Builder v2 steps — extracted out of the client component so it can
 * be unit-tested directly (the component itself imports `next/
 * navigation` and `motion/react`, which — like `next-intl/server` or
 * `next/headers` elsewhere in this codebase — can't be imported by
 * Vitest outside the real Next.js runtime; this is the same
 * extraction pattern already used for rbac.ts, jwt.ts, and
 * resolve-currency.ts).
 */
export const REQUIRED_NAME_MIN = 2;
export const REQUIRED_MESSAGE_MIN = 10;
export const REQUIRED_PHONE_MIN = 6;

export function isStepValid(stepId: StepId, data: BuilderFormData): boolean {
  switch (stepId) {
    case "whatToBuild":
      return !!data.projectType;
    case "idea":
      return data.message.trim().length >= REQUIRED_MESSAGE_MIN && !!data.businessState;
    case "budgetTiming":
      return !!data.timeline && !!data.budgetRange;
    case "contact":
      return (
        data.name.trim().length >= REQUIRED_NAME_MIN &&
        data.phone.trim().length >= REQUIRED_PHONE_MIN &&
        /\S+@\S+\.\S+/.test(data.email)
      );
  }
}
