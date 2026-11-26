// Valid example records shared by the tests. Not a test file (no .test. in the name).
import { SCHEMA_VERSION } from '../src/core/version.js';

export const PID = 'P-0000-00000'; // check character of an all-zero body is 0

export function participant(over = {}) {
  return {
    type: 'participant',
    schemaVersion: SCHEMA_VERSION,
    id: PID,
    createdAt: '2026-11-26T09:00:00.000Z',
    consent: { noticeVersion: 'test', givenAt: '2026-11-26T09:00:00.000Z', programmeEvaluation: true, languageBackground: false },
    ...over,
  };
}

export function sitting(over = {}) {
  return {
    type: 'sitting',
    schemaVersion: SCHEMA_VERSION,
    id: 'S-0123456789ABCDEF',
    participantId: PID,
    mode: 'assessment',
    formId: 'A',
    seed: 42,
    appVersion: '0.2.0',
    scoringVersion: '0.2.0',
    startedAt: '2026-11-26T09:00:00.000Z',
    completedAt: null,
    ...over,
  };
}

export function attempt(over = {}) {
  return {
    type: 'taskAttempt',
    schemaVersion: SCHEMA_VERSION,
    id: 'A-0123456789ABCDEF',
    sittingId: 'S-0123456789ABCDEF',
    skillId: '_example',
    taskId: 'pick',
    itemResponses: [{ itemId: 'EX-PICK-A01', response: { choice: 1 }, rtMs: 1200, shownAt: '2026-11-26T09:00:01.000Z' }],
    rawScore: 1,
    score: { EX1: 0.5 },
    scoringVersion: '0.2.0',
    ...over,
  };
}

export function selfReport(over = {}) {
  return {
    type: 'selfReport',
    schemaVersion: SCHEMA_VERSION,
    id: 'R-0123456789ABCDEF',
    sittingId: 'S-0123456789ABCDEF',
    skillId: '_example',
    responses: [{ itemId: 'EX-SR-01', response: 4, rtMs: 900, shownAt: '2026-11-26T09:00:01.000Z' }],
    score: null,
    scoringVersion: '0.2.0',
    ...over,
  };
}
