import { Currency } from './basic';

export class Portions {
    portions: Map<string, Currency>;

    constructor(public type: string, entries: (readonly [string, Currency])[]) {
        this.portions = new Map<string, Currency>(entries);
    }

    getPortion(mate: string): Currency {
        let value: Currency;

        if (this.portions.has(mate)) {
            value = <Currency>this.portions.get(mate);
        } else {
            throw new Error('Could not find mate in portions');
        }

        return value;
    }

    getMates(): string[] {
        return Array.from(this.portions.keys());
    }

    getPortionsArray(): Currency[] {
        return Array.from(this.portions.values());
    }

    portionsToString(): string[] {
        return this.getPortionsArray().map((x) => x.toFixed(2));
    }
}
