// Hash-based routing. Hash routes work on any static host, including GitHub Pages, with no
// server configuration.
//
//   #/hub                       skill hub (also '', '#' and '#/')
//   #/skill/<skillId>           one skill's overview
//   #/task/<skillId>/<taskId>   run a task
//   #/results/<skillId>         one skill's results
//   #/profile                   participant code, data export and import
//   #/start                     first-run flow (also #/start/<step>)
//   #/run/<sittingId>/<stepId>  run one step (self-report or task) of a sitting; resumable
//   #/settings                  extended time, reduced motion, data reset, export and import

const SEG = '[a-z0-9_][a-z0-9_-]*';
const SITTING = 'S-[0-9A-HJKMNP-TV-Z]{16}';

const ROUTES = [
  { name: 'hub', pattern: new RegExp('^/hub$'), keys: [] },
  { name: 'skill', pattern: new RegExp(`^/skill/(${SEG})$`), keys: ['skillId'] },
  { name: 'task', pattern: new RegExp(`^/task/(${SEG})/(${SEG})$`), keys: ['skillId', 'taskId'] },
  { name: 'results', pattern: new RegExp(`^/results/(${SEG})$`), keys: ['skillId'] },
  { name: 'profile', pattern: new RegExp('^/profile$'), keys: [] },
  { name: 'start', pattern: new RegExp(`^/start(?:/(${SEG}))?$`), keys: ['step'] },
  { name: 'run', pattern: new RegExp(`^/run/(${SITTING})/(${SEG})$`), keys: ['sittingId', 'stepId'] },
  { name: 'settings', pattern: new RegExp('^/settings$'), keys: [] },
];

export const ROUTE_NAMES = Object.freeze(ROUTES.map((r) => r.name));

/**
 * @typedef {{ name: string, params: Object<string, string> }} Route
 */

/**
 * Parse a location hash. Unknown hashes give { name: 'notFound', params: { hash } }.
 * @param {string} hash
 * @returns {Route}
 */
export function parseHash(hash) {
  let path = String(hash || '').replace(/^#/, '');
  if (path === '' || path === '/') return { name: 'hub', params: {} };
  path = path.replace(/\/+$/, '');
  for (const r of ROUTES) {
    const m = r.pattern.exec(path);
    if (m) return { name: r.name, params: Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]).filter(([, v]) => v !== undefined)) };
  }
  return { name: 'notFound', params: { hash: String(hash) } };
}

/**
 * Build a hash for a route.
 * @param {string} name
 * @param {Object<string, string>} [params]
 * @returns {string}
 */
export function toHash(name, params = {}) {
  const need = (k, seg = SEG) => {
    const v = params[k];
    if (typeof v !== 'string' || !new RegExp(`^${seg}$`).test(v)) throw new RangeError(`toHash: invalid ${k} "${v}"`);
    return v;
  };
  switch (name) {
    case 'hub': return '#/hub';
    case 'skill': return `#/skill/${need('skillId')}`;
    case 'task': return `#/task/${need('skillId')}/${need('taskId')}`;
    case 'results': return `#/results/${need('skillId')}`;
    case 'profile': return '#/profile';
    case 'start': return params.step === undefined ? '#/start' : `#/start/${need('step')}`;
    case 'run': return `#/run/${need('sittingId', SITTING)}/${need('stepId')}`;
    case 'settings': return '#/settings';
    default: throw new RangeError(`toHash: unknown route "${name}"`);
  }
}

/**
 * Listen for hash changes and call onRoute(route). Calls it once immediately.
 * @param {(route: Route) => void} onRoute
 * @param {{ window?: Window }} [options]
 * @returns {{ navigate: (name: string, params?: object) => void, current: () => Route, stop: () => void }}
 */
export function createRouter(onRoute, { window: win = globalThis.window } = {}) {
  const handler = () => onRoute(parseHash(win.location.hash));
  win.addEventListener('hashchange', handler);
  handler();
  return {
    navigate(name, params) {
      const h = toHash(name, params);
      if (win.location.hash === h) handler();
      else win.location.hash = h;
    },
    current: () => parseHash(win.location.hash),
    stop: () => win.removeEventListener('hashchange', handler),
  };
}
