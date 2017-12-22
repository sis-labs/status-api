module.exports = {
    authenticate
}

/**
 * Only checks for HTTP Basic Authenticaion
 *
 * Some handler before is expected to set the accepted user/pass combo
 * on req as:
 *
 * req.allow = { user: '', pass: '' };
 *
 * Or this will be skipped.
 */
function authenticate(req, res, next) {
    if (!req.allow) {
        req.log.debug('skipping authentication');
        next();
        return;
    }

    var authz = req.authorization.basic;

    if (!authz) {
        res.setHeader('WWW-Authenticate', 'Basic realm="todoapp"');
        next(new errors.UnauthorizedError('authentication required'));
        return;
    }

    if (authz.username !== req.allow.user ||
        authz.password !== req.allow.pass ) {
        next(new errors.ForbiddenError('invalid credentials'));
        return;
    }

    next();
}
