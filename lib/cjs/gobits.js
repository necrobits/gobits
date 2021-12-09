"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gobits = void 0;
var lodash_1 = __importDefault(require("lodash"));
var queryString = __importStar(require("query-string"));
var middlewares_1 = require("./middlewares");
var Gobits = /** @class */ (function () {
    function Gobits(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.baseUrl, baseUrl = _c === void 0 ? "" : _c, _d = _b.timeout, timeout = _d === void 0 ? 5000 : _d, _e = _b.useDefaultMiddlewares, useDefaultMiddlewares = _e === void 0 ? true : _e, _f = _b.type, type = _f === void 0 ? 'json' : _f;
        this.middlewares = [];
        this.middlewares = [];
        this.config = {
            timeout: timeout,
            baseUrl: baseUrl,
            useDefaultMiddlewares: useDefaultMiddlewares,
            type: type
        };
        if (this.config.useDefaultMiddlewares) {
            this.middlewares.push((0, middlewares_1.autoUrlEncodedForm)());
            this.middlewares.push((0, middlewares_1.autoJson)());
        }
    }
    Gobits.prototype.use = function (middleware) {
        this.middlewares.push(middleware);
        return this;
    };
    Gobits.prototype.get = function (url, opts) {
        if (opts === void 0) { opts = {}; }
        return this._request(url, 'GET', opts);
    };
    Gobits.prototype.post = function (url, opts) {
        if (opts === void 0) { opts = {}; }
        return this._request(url, 'POST', opts);
    };
    Gobits.prototype.put = function (url, opts) {
        if (opts === void 0) { opts = {}; }
        return this._request(url, 'PUT', opts);
    };
    Gobits.prototype.patch = function (url, opts) {
        if (opts === void 0) { opts = {}; }
        return this._request(url, 'PATCH', opts);
    };
    Gobits.prototype.delete = function (url, opts) {
        if (opts === void 0) { opts = {}; }
        return this._request(url, 'DELETE', opts);
    };
    Gobits.prototype._request = function (url, method, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _b, queryInUrl, endpoint, queryParams, targetUrl, req, res, next, controller_1, promise, timeout_1, responseParser, fetchResponse, _c;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _b = queryString.parseUrl(url), queryInUrl = _b.query, endpoint = _b.url;
                        queryParams = lodash_1.default.merge(queryInUrl, options.query || {});
                        targetUrl = queryString.stringifyUrl({
                            url: endpoint,
                            query: queryParams,
                        });
                        req = {
                            url: targetUrl,
                            headers: options.headers || {},
                            query: queryParams,
                            body: options.body || null,
                            opts: lodash_1.default.merge(this.config, options),
                            method: method
                        };
                        res = {
                            headers: {},
                            status: 0,
                            ok: false,
                            body: null,
                            responded: false,
                            completed: false,
                            _nativeResponse: null
                        };
                        next = lodash_1.default.reduceRight(this.middlewares, function (n, middleware) { return function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, chain(middleware, req, res, n, false)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); }; }, function () { return Promise.resolve({}); });
                        return [4 /*yield*/, next()];
                    case 1:
                        _d.sent();
                        if (!!res.responded) return [3 /*break*/, 4];
                        controller_1 = new AbortController();
                        promise = fetch(url, __assign({ signal: controller_1.signal }, req));
                        timeout_1 = setTimeout(function () { return controller_1.abort(); }, options.timeout || this.config.timeout);
                        promise.finally(function () { return clearTimeout(timeout_1); });
                        responseParser = ((_a = options.responseParser) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'text';
                        return [4 /*yield*/, promise];
                    case 2:
                        fetchResponse = _d.sent();
                        res._nativeResponse = fetchResponse;
                        res.status = fetchResponse.status;
                        res.headers = transformFetchHeaders(fetchResponse.headers);
                        _c = res;
                        return [4 /*yield*/, ResponseParsers[responseParser](fetchResponse)];
                    case 3:
                        _c.body = _d.sent();
                        res.ok = fetchResponse.ok;
                        res.responded = true;
                        _d.label = 4;
                    case 4:
                        if (!!res.completed) return [3 /*break*/, 6];
                        next = lodash_1.default.reduce(this.middlewares, function (n, middleware) { return function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, chain(middleware, req, res, n, true)];
                                case 1: return [2 /*return*/, _a.sent()];
                            }
                        }); }); }; }, function () { return Promise.resolve({}); });
                        return [4 /*yield*/, next()];
                    case 5:
                        _d.sent();
                        res.completed = true;
                        _d.label = 6;
                    case 6:
                        res.ok = res.status >= 200 && res.status < 300;
                        // At this stage, we believe that some middlewares have transformed the response body into type T
                        return [2 /*return*/, res];
                }
            });
        });
    };
    return Gobits;
}());
exports.Gobits = Gobits;
function chain(middleware, req, res, next, responding) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ((!responding && res.responded) || (responding && res.completed)) {
                        console.warn("Calling next() when response is already marked as done.");
                        return [2 /*return*/, Promise.resolve({})];
                    }
                    return [4 /*yield*/, middleware(req, res, next, responding)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function transformFetchHeaders(fetchHeaders) {
    var headers = {};
    fetchHeaders.forEach(function (v, k) {
        headers[k.toLowerCase()] = v;
    });
    return headers;
}
var ResponseParsers = {
    'text': function (r) { return r.text(); },
    'blob': function (r) { return r.blob(); },
};
