import { Portions } from './portions';
import { Server } from './server';

export class FormattedServer {
    date: string;
    totalRent: string;
    baseRent: string[];
    mates: string[];

    constructor(server: Server) {
        this.date = server.date.toString();
        this.totalRent = server.totalRent.toString();
        this.baseRent = server.baseRent.portionsToString();
        this.mates = server.baseRent.getMates();
    }
}

class FormattedLedger {
    balancedRent: string[];
    list: FormattedExpense[];

    constructor(ledger: Ledger, rent: Portions) {
        this.balancedRent = rent.portionsToString();
        this.list = ledger.formatExpenses();
    }
}

class FormattedExpense {
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
        this.portions = expense.portions.portionsToString();
    }
}