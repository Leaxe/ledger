class Ledger {
    expenses: Expense[];
    balancedRent: Portions;

    computeLedger(): void {

    }

    formatLedger(): FormattedLedger {
        return new FormattedLedger(this, this.balancedRent);
    }

    formatExpenses(): FormattedExpense[] {
        return this.expenses.map(x => x.formatExpense());
    }
}