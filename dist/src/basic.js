"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Dollar = exports.Mate = void 0;
var Mate = (function () {
    function Mate(name) {
        this.name = name;
    }
    Mate.prototype.toString = function () {
        return this.name;
    };
    return Mate;
}());
exports.Mate = Mate;
var Dollar = (function (_super) {
    __extends(Dollar, _super);
    function Dollar(amount) {
        return _super.call(this, amount) || this;
    }
    Dollar.prototype.toString = function () {
        var prefix = this.valueOf() >= 0 ? "$" : "-$";
        return prefix + Math.abs(this.valueOf()).toFixed(2);
    };
    return Dollar;
}(Number));
exports.Dollar = Dollar;
