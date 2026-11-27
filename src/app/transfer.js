// Export and import, as seen by the application shell. Stubs: the student-facing export
// (download, PDF and CSV) and import flow are built in Session 12 (audit/BUILD-PLAN.md). The
// store already provides exportAll() and importAll() (src/core/store.js); S12 replaces these two
// functions and the Settings page picks the change up without other edits.

export const TRANSFER_AVAILABLE = false;
export const TRANSFER_NOTICE = 'Exporting and importing your data will be available in a later release. Until then, your data stays in this browser.';

/**
 * Export the participant's data. Stub until S12.
 * @param {object} _store  storage adapter
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function exportData(_store) {
  return { ok: false, message: TRANSFER_NOTICE };
}

/**
 * Import a previously exported file. Stub until S12.
 * @param {object} _store
 * @param {File} _file
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function importData(_store, _file) {
  return { ok: false, message: TRANSFER_NOTICE };
}
