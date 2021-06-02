"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var app = express_1["default"]();
var port = process.env.PORT || 3000;
var path_1 = __importDefault(require("path"));
app.use('/', express_1["default"].static(path_1["default"].join(__dirname, 'public')));
app.use('/archive', express_1["default"].static(path_1["default"].join(__dirname, 'public')));
app.get('/', function (req, res) {
});
app.listen(port, function () { return console.log("Ledger listening on port " + port + "!"); });
