"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoJson = exports.autoUrlEncodedForm = void 0;
var lodash_1 = __importDefault(require("lodash"));
function autoUrlEncodedForm() {
    return (function (req, _, next, responding) {
        var _a;
        if (!responding && ((_a = req.opts.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'form') {
            req.headers['content-type'] = 'application/x-www-form-urlencoded';
        }
        return next();
    });
}
exports.autoUrlEncodedForm = autoUrlEncodedForm;
function autoJson() {
    return (function (req, res, next, responding) {
        var _a, _b;
        if (!responding && ((_a = req.opts.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'json' && req.body && !lodash_1.default.isString(req.body)) {
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
exports.autoJson = autoJson;
