"use strict";
var Expense = (function () {
    function Expense() {
    }
    Expense.prototype.formatExpense = function () {
        return new FormattedExpense(this);
    };
    return Expense;
}());
