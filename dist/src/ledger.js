"use strict";
var Ledger = (function () {
    function Ledger() {
    }
    Ledger.prototype.computeLedger = function () {
    };
    Ledger.prototype.formatLedger = function () {
        return new FormattedLedger(this, this.balancedRent);
    };
    Ledger.prototype.formatExpenses = function () {
        return this.expenses.map(function (x) { return x.formatExpense(); });
    };
    return Ledger;
}());
