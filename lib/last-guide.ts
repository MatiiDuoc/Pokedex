import {
  GUIDE_TABS,
  type GuideTabId,
  type LastGuideData,
} from '@/types/last-guide';
import { isValidSlug } from './validation';

const MAX_SHORT_TEXT = 120;
const MAX_NEXT_STEP_TITLE = 200;
const MAX_COUNT = 1000;

function isTab(value: unknown): value is GuideTabId {
  return (
    typeof value === 'string' &&
    GUIDE_TABS.includes(value as GuideTabId)
  );
}

function isCount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_COUNT
  );
}

export function validateLastGuideData(value: unknown): LastGuideData | null {
  if (typeof value !== 'object' || value === null) return null;

  const candidate = value as Partial<LastGuideData>;

  if (
    typeof candidate.slug !== 'string' ||
    !isValidSlug(candidate.slug) ||
    typeof candidate.title !== 'string' ||
    candidate.title.length === 0 ||
    candidate.title.length > MAX_SHORT_TEXT ||
    typeof candidate.region !== 'string' ||
    candidate.region.length > MAX_SHORT_TEXT ||
    typeof candidate.accent !== 'string' ||
    candidate.accent.length === 0 ||
    candidate.accent.length > MAX_SHORT_TEXT ||
    !isTab(candidate.tab) ||
    !isCount(candidate.checklistTotal) ||
    !isCount(candidate.stepsTotal) ||
    !isCount(candidate.challengesTotal) ||
    typeof candidate.nextStep !== 'number' ||
    !Number.isInteger(candidate.nextStep) ||
    candidate.nextStep < -1 ||
    candidate.nextStep > MAX_COUNT ||
    (candidate.nextStepTitle !== null &&
      (typeof candidate.nextStepTitle !== 'string' ||
        candidate.nextStepTitle.length > MAX_NEXT_STEP_TITLE)) ||
    typeof candidate.updatedAt !== 'number' ||
    !Number.isFinite(candidate.updatedAt)
  ) {
    return null;
  }

  return {
    slug: candidate.slug,
    title: candidate.title,
    region: candidate.region,
    accent: candidate.accent,
    tab: candidate.tab,
    checklistTotal: candidate.checklistTotal,
    stepsTotal: candidate.stepsTotal,
    challengesTotal: candidate.challengesTotal,
    nextStep: candidate.nextStep,
    nextStepTitle: candidate.nextStepTitle,
    updatedAt: candidate.updatedAt,
  };
}
