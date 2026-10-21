'use strict';
// Shared env allowlist for SWE-bench runners: tool vars pass through,
// key-bearing vars never reach task containers or child agents.
const KEEP=/^(path|pathext|systemroot|windir|temp|tmp|comspec|localappdata|appdata|userprofile|python.*|docker.*|http_proxy|https_proxy|no_proxy|chode_.*)$/i;
const DROP=/(secret|key|token|password|credential)/i;
function filterEnv(env){
  return Object.fromEntries(Object.entries(env).filter(([k])=>KEEP.test(k)&&!DROP.test(k)));
}
module.exports={filterEnv};
