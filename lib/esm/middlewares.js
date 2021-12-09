import _ from 'lodash';
export function autoUrlEncodedForm() {
    return (function (req, _, next, responding) {
        var _a;
        if (!responding && ((_a = req.opts.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'form') {
            req.headers['content-type'] = 'application/x-www-form-urlencoded';
        }
        return next();
    });
}
export function autoJson() {
    return (function (req, res, next, responding) {
        var _a, _b;
        if (!responding && ((_a = req.opts.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'json' && req.body && !_.isString(req.body)) {
            req.body = JSON.stringify(req.body);
            if (!req.headers.hasOwnProperty('content-type')) {
                req.headers['content-type'] = 'application/json';
            }
            if (!req.headers.hasOwnProperty('accept')) {
                req.headers['accept'] = 'application/json';
            }
        }
        if (responding && ((_b = res.headers['content-type']) === null || _b === void 0 ? void 0 : _b.includes('application/json')) && res.body) {
            res.body = JSON.parse(res.body);
        }
        return next();
    });
}
