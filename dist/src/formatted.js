"use strict";
var FormattedServer = (function () {
    function FormattedServer(server) {
        this.date = server.date;
        this.totalRent = server.totalRent.toString();
        this.baseRent = server.baseRent.portionsToString();
        this.mates = server.baseRent.getMates();
    }
    return FormattedServer;
}());
var FormattedLedger = (function () {
    function FormattedLedger(ledger, rent) {
        this.balancedRent = rent.portionsToString();
        this.list = ledger.formatExpenses();
    }
    return FormattedLedger;
}());
var FormattedExpense = (function () {
    function FormattedExpense(expense) {
        this.date = expense.date;
        this.category = expense.category;
        this.whoPaid = expense.whoPaid.toString();
        this.whoPays = expense.whoPays;
        this.amount = expense.amount.toString();
        this.portions = expense.portions.portionsToString();
    }
    return FormattedExpense;
}());
