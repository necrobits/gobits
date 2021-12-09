"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formParser = exports.jsonParser = exports.Gobits = void 0;
var gobits_1 = require("./gobits");
Object.defineProperty(exports, "Gobits", { enumerable: true, get: function () { return gobits_1.Gobits; } });
var middlewares_1 = require("./middlewares");
Object.defineProperty(exports, "jsonParser", { enumerable: true, get: function () { return middlewares_1.autoJson; } });
Object.defineProperty(exports, "formParser", { enumerable: true, get: function () { return middlewares_1.autoUrlEncodedForm; } });
