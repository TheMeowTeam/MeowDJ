/**
 * finalizedAccount
 *
 * @module      :: Policy
 * @description :: Policy to allow only finalized accounts
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {

  // User is allowed, proceed to the next policy,
  // or if this is the last policy, the controller
  if (req.session.user.tos == true) {
    return next();
  }

  // User is not allowed
  // (default res.forbidden() behavior can be overridden in `config/403.js`)
  return res.redirect('/welcome');
};
