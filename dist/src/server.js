"use strict";
exports.__esModule = true;
exports.Server = exports.ServerState = void 0;
var ServerState;
(function (ServerState) {
    ServerState[ServerState["Active"] = 0] = "Active";
    ServerState[ServerState["Disabled"] = 1] = "Disabled";
})(ServerState = exports.ServerState || (exports.ServerState = {}));
var Server = (function () {
    function Server(state, date, baseRent, categories) {
        this.state = state;
        this.date = date;
        this.baseRent = baseRent;
        this.categories = categories;
        this.totalRent =
            this.mates = baseRent.getMates();
    }
    Server.prototype.calculateTotal = function () {
        var total;
        return total;
    };
    Server.prototype.getMates = function () {
        var mates;
        return mates;
    };
    Server.prototype.formatServer = function () {
        return new FormattedServer(this);
    };
    return Server;
}());
exports.Server = Server;
