// Version constants recorded on every stored record (CLAUDE.md, Technical conventions 8; audit D-6).
//
// SCHEMA_VERSION  integer; bumped when the shape of stored records changes. Also the <N> in the
//                 storage key prefix skills5c:v<N>:. A bump needs a migration in migrate.js.
// APP_VERSION     the application release; matches package.json "version".
// SCORING_VERSION bumped on every change to any scoring function; documented in docs/SCORING.md.

export const SCHEMA_VERSION = 3;
export const APP_VERSION = '0.5.0';
export const SCORING_VERSION = '1.1.0-draft';
