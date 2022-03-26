import { FormattedExpense } from './formatted';
import { Dollar } from './basic';
import { Portions } from './portions';

export class Expense {

    constructor(
        public date: string,
        public category: string,
        public whoPaid: string,
        public whoPays: string,
        public description: string,
        public amount: Dollar,
        public portions: Portions,
        public deleted: boolean
    ) {}

    formatExpense(): FormattedExpense {
        return new FormattedExpense(this);
    }
}