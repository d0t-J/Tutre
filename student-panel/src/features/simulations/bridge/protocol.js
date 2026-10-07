// The Simulation Bridge, protocol 1: messages between the student app and a
// simulation running in its sandboxed iframe (allow-scripts only, opaque origin).
//
// Simulation -> app (sent with parent.postMessage(message, '*')):
//   { tutre: 1, type: 'ready' }                          the simulation has loaded
//   { tutre: 1, type: 'checkpoint', id: 'convert' }      a step listed in its manifest
//   { tutre: 1, type: 'challenge', id: 'to-hex', correct: true }
//   { tutre: 1, type: 'state', summary: '...' }          short description of what
//                                                        the student is doing (reserved)
// App -> simulation (after 'ready', and whenever the language changes):
//   { tutre: 1, type: 'init' | 'language', language: 'en' | 'ur', dir: 'ltr' | 'rtl' }
//
// Ids must also appear in the simulation's manifest
//   <script type="application/json" id="tutre-manifest">{"protocol": 1, ...}</script>
// or the database refuses the report (record_learning_event). Messages come from
// untrusted code, so everything is validated here and again in the database.
// The helper simulations embed is tutre-bridge.client.js in this folder.

export const BRIDGE_PROTOCOL = 1;

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,59}$/;
const MAX_SUMMARY = 500;

// Returns a clean copy of a valid message, or null for anything else.
export function parseSimulationMessage(data) {
  if (!data || typeof data !== 'object' || data.tutre !== BRIDGE_PROTOCOL || typeof data.type !== 'string') {
    return null;
  }
  switch (data.type) {
    case 'ready':
      return { type: 'ready' };
    case 'checkpoint':
      return typeof data.id === 'string' && ID_PATTERN.test(data.id) ? { type: 'checkpoint', id: data.id } : null;
    case 'challenge':
      return typeof data.id === 'string' && ID_PATTERN.test(data.id) && typeof data.correct === 'boolean'
        ? { type: 'challenge', id: data.id, correct: data.correct }
        : null;
    case 'state':
      return typeof data.summary === 'string' ? { type: 'state', summary: data.summary.slice(0, MAX_SUMMARY) } : null;
    default:
      return null;
  }
}

export const languageMessage = (type, language) => ({
  tutre: BRIDGE_PROTOCOL,
  type,
  language: language === 'ur' ? 'ur' : 'en',
  dir: language === 'ur' ? 'rtl' : 'ltr',
});
