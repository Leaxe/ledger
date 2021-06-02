"use strict";
exports.__esModule = true;
exports.Portions = void 0;
var Portions = (function () {
    function Portions(type, entries) {
        this.type = type;
        this.portions = new Map(entries);
    }
    Portions.prototype.getPortion = function (mate) {
        var value;
        if (this.portions.has(mate)) {
            value = this.portions.get(mate);
        }
        else {
            throw new Error('bad bad badbad bad ');
        }
        return value;
    };
    Portions.prototype.getMates = function () {
        return Array.from(this.portions.keys());
    };
    Portions.prototype.getPortionsArray = function () {
        return Array.from(this.portions.values());
    };
    Portions.prototype.portionsToString = function () {
        return this.getPortionsArray().map(function (x) { return x.toFixed(2); });
    };
    return Portions;
}());
exports.Portions = Portions;
