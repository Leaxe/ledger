import { Ledger } from './ledger';
import { Server } from './server';
import { Expense } from './expense';

export class FormattedServer {
    date: string;
    totalRent: string;
    baseRent: string[];
    mates: string[];

    constructor(server: Server) {
        this.date = server.date.toString();
        this.totalRent = server.getTotalRent().toString();
        this.baseRent = server.baseRent.toString();
        this.mates = server.baseRent.getMates();
    }
}

export class FormattedLedger {
    balancedRent: string[];
    list: FormattedExpense[];

    constructor(ledger: Ledger) {
        this.balancedRent = ledger.balancedRent.toString();
        this.list = ledger.formatExpenses();
    }
}

export class FormattedExpense {
    date: string;
    category: string;
    whoPaid: string;
    whoPays: string;
    amount: string;
    portions: string[];

    constructor(expense: Expense) {
        this.date = expense.date;
        this.category = expense.category;
        this.whoPaid = expense.whoPaid.toString();
        this.whoPays = expense.whoPays;
        this.amount = expense.amount.toString();
        this.portions = expense.portions.toString();
    }
}