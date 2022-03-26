import { Expense } from './expense';
import { Portions } from './portions';
import { FormattedLedger, FormattedExpense } from './formatted';

export class Ledger {
    public balancedRent: Portions;

    constructor(public expenses: Expense[] = []){
        this.balancedRent = this.computeRent(this.expenses);
    }

    computeRent(expenses: Expense[]): Portions {

        return new Portions('balanced', []);
    }

    formatLedger(): FormattedLedger {
        return new FormattedLedger(this);
    }

    formatExpenses(): FormattedExpense[] {
        return this.expenses.map(x => x.formatExpense());
    }

    
}