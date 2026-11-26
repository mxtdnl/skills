// Regenerates docs/data-schema.json from src/core/schema.js.
// Usage: npm run schema
import { writeFileSync } from 'node:fs';
import { toJsonSchema } from '../src/core/schema.js';

const out = new URL('../docs/data-schema.json', import.meta.url);
writeFileSync(out, JSON.stringify(toJsonSchema(), null, 2) + '\n');
console.log('Wrote docs/data-schema.json');
