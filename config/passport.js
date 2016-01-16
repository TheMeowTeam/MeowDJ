/**
 * Passport configuration
 *
 * This is the configuration for your Passport.js setup and where you
 * define the authentication strategies you want your application to employ.
 *
 * I have tested the service with all of the providers listed below - if you
 * come across a provider that for some reason doesn't work, feel free to open
 * an issue on GitHub.
 *
 * Also, authentication scopes can be set through the `scope` property.
 *
 * For more information on the available providers, check out:
 * http://passportjs.org/guide/providers/
 */

function generatePassportConfig(conf) {
  var config = Object.create(null);

  console.log("Local Passport loaded");

  config["local"] = {
    strategy: require('passport-local').Strategy
  };

  if (conf == null || conf.passport == null)
    return config;

  if (conf.passport["twitter"] != null) {
    config["twitter"] = {
      name: 'Twitter',
      protocol: 'oauth',
      strategy: require('passport-twitter').Strategy,
      options: {
        consumerKey: local.passport.twitter.key,
        consumerSecret: local.passport.twitter.secret
      }
    };

    console.log("Twitter Passport loaded")
  } else if (conf.passport["facebook"] != null) {
    config["facebook"] = {
      name: 'Facebook',
      protocol: 'oauth2',
      strategy: require('passport-facebook').Strategy,
      options: {
        clientID: local.passport.facebook.key,
        clientSecret: local.passport.facebook.secret,
        scope: ['email'] /* email is necessary for login behavior */
      }
    };

    console.log("Facebook Passport loaded")
  } else if (conf.passport["google"] != null) {
    config["google"] = {
      name: 'Google',
      protocol: 'oauth2',
      strategy: require('passport-google-oauth').OAuth2Strategy,
      options: {
        clientID: local.passport.google.key,
        clientSecret: local.passport.google.secret
      }
    };

    console.log("Google Passport loaded")
  }

  return config;
}

var local = null;

try
{
  local = require("./local.js");
}
catch (e) {}

module.exports.passport = generatePassportConfig(local);
