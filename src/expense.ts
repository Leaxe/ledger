class Expense {
    date: string;
    category: string;
    whoPaid: Mate;
    whoPays: string;
    description: string;
    amount: Dollar;
    portions: Portions;
    deleted: boolean;

    formatExpense(): FormattedExpense {
        return new FormattedExpense(this);
    }
}