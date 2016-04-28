/**
 * Connections
 * (sails.config.connections)
 *
 * `Connections` are like "saved settings" for your adapters.  What's the difference between
 * a connection and an adapter, you might ask?  An adapter (e.g. `sails-mysql`) is generic--
 * it needs some additional information to work (e.g. your database host, password, user, etc.)
 * A `connection` is that additional information.
 *
 * Each model must have a `connection` property (a string) which is references the name of one
 * of these connections.  If it doesn't, the default `connection` configured in `config/models.js`
 * will be applied.  Of course, a connection can (and usually is) shared by multiple models.
 * .
 * Note: If you're using version control, you should put your passwords/api keys
 * in `config/local.js`, environment variables, or use another strategy.
 * (this is to prevent you inadvertently sensitive credentials up to your repository.)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.connections.html
 */

function generateConnectionsConfiguration(conf) {

  var config = Object.create(null);

  if (conf != null && conf.database != null) {
    config['default'] = {
      adapter: 'sails-mysql',
      host: conf.database.host,
      user: conf.database.user,
      password: conf.database.password,
      database: conf.database.name
    };
  }
  else {
    config['default'] = {
      adapter: 'sails-disk'
    };
  }

  return config;

}

var local = null;

try {
  local = require('./local.js');
}
catch (e) {
}

module.exports.connections = generateConnectionsConfiguration(local);
