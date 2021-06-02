"use strict";
exports.__esModule = true;
exports.DB = void 0;
var basic_1 = require("./basic");
var portions_1 = require("./portions");
var server_1 = require("./server");
var DB = (function () {
    function DB() {
    }
    DB.prototype.getServer = function () {
        var server;
        server = new server_1.Server(server_1.ServerState.Active, new Date(2021, 1), new portions_1.Portions('base', [['Big Bird', new basic_1.Dollar(10)], ['Bert', new basic_1.Dollar(50)], ['Ernie', new basic_1.Dollar(30)]]), ['Groceries',]);
        return server;
    };
    DB.prototype.setServer = function (server) {
    };
    DB.prototype.getActiveLedger = function () {
        var ledger;
        return ledger;
    };
    DB.prototype.setActiveLedger = function (ledger) {
    };
    DB.prototype.archiveLedger = function () {
    };
    DB.prototype.getArchivedLedger = function (date) {
        var ledger;
        return ledger;
    };
    return DB;
}());
exports.DB = DB;
