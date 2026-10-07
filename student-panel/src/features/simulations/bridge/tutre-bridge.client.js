/* Tutre Simulation Bridge client, protocol 1.
 *
 * Not imported by the app. Simulations cannot load external files, so a
 * Bridge-ready simulation pastes this whole file inside a script tag of its own.
 * (This comment deliberately never spells out an HTML script tag: a closing
 * script tag inside pasted code would end the simulation's script early.)
 *
 * The simulation also declares what it can report, in a script tag with
 * type="application/json" and id="tutre-manifest", containing for example:
 *
 *   { "protocol": 1,
 *     "checkpoints": ["first-conversion", "all-bases"],
 *     "challenges": ["to-binary", "to-hex"],
 *     "practice": { "attempts": 3 },
 *     "mastery": { "correct": 5, "challengeTypes": 2 } }
 *
 * Then, in the simulation's own code:
 *   Tutre.checkpoint('first-conversion');     // a step was reached
 *   Tutre.challenge('to-hex', answerIsRight); // a challenge was answered
 *   Tutre.onLanguage(function (lang) { ... });// 'en' or 'ur', now and on change
 *
 * Ids are lower-case letters, digits and hyphens, and must be in the manifest.
 * Outside Tutre (opened as a plain file) every call is a harmless no-op.
 * Written in ES5 so it runs in any browser the simulations support.
 */
(function () {
  var PROTOCOL = 1;
  var language = 'en';
  var listeners = [];

  function send(message) {
    if (window.parent === window) return;
    message.tutre = PROTOCOL;
    try {
      window.parent.postMessage(message, '*');
    } catch (ignored) {
      void ignored; /* the host is gone; nothing to do */
    }
  }

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) return;
    var data = event.data;
    if (!data || data.tutre !== PROTOCOL) return;
    if (data.type === 'init' || data.type === 'language') {
      language = data.language === 'ur' ? 'ur' : 'en';
      for (var i = 0; i < listeners.length; i++) {
        try { listeners[i](language); } catch (ignored) { void ignored; /* one listener must not stop the rest */ }
      }
    }
  });

  window.Tutre = {
    checkpoint: function (id) { send({ type: 'checkpoint', id: String(id) }); },
    challenge: function (id, correct) { send({ type: 'challenge', id: String(id), correct: !!correct }); },
    state: function (summary) { send({ type: 'state', summary: String(summary).slice(0, 500) }); },
    onLanguage: function (fn) { listeners.push(fn); fn(language); },
    language: function () { return language; }
  };

  send({ type: 'ready' });
})();
