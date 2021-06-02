export interface Currency extends Number {
    toString(): string;
}

export class Dollar extends Number implements Currency {

    constructor(amount: number) {
        super(amount);
    }

    toString(): string {
        let prefix = this.valueOf() >= 0 ? "$" : "-$";

        return prefix + Math.abs(this.valueOf()).toFixed(2);
    }
}