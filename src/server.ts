import { Portions } from './portions';
import { Currency } from './basic';

export enum ServerState {
    Active,
    Disabled,
}

export class Server {
    private totalRent: number;

    constructor(
        public state: ServerState,
        public date: Date,
        public baseRent: Portions,
        public categories: string[]
    ) {
        this.totalRent = baseRent
            .getPortionsArray()
            .reduce(
                (sum: Currency, value: Currency) =>
                    sum.valueOf() + value.valueOf()
            )
            .valueOf();
    }

    getTotalRent(): Currency {
        return this.totalRent;
    }

    getMates(): String[] {
        return this.baseRent.getMates();
    }

    formatServer(): FormattedServer {
        return new FormattedServer(this);
    }
}
