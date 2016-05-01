/**
 * Created by Thog9 on 01/05/2016.
 */
var dns = require("dns");

function getHostName(url) {
  var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
  if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
    return match[2];
  }
  else {
    return null;
  }
}

function resolveDNS(toResolve, callback) {
  dns.lookup(toResolve, callback)
}
module.exports = {
  resolveDNS: resolveDNS
}

var domain = getHostName(sails.config.authenticationHost);
if (domain == null)
  throw new Error('Auth server URL invalid!');

sails.log.info("Loockup " + domain + " (auth server)...")

resolveDNS(domain, function (err, ip) {
  sails.authentificationIP = ip;
  sails.log.info(domain + " <=> " + sails.authentificationIP);
})
