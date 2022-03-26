import { Dollar } from './basic';
import { Portions } from './portions';
import { Server, ServerState } from './server';
import { Ledger } from './ledger';
import * as fs from 'fs';

const activeJsonPath: fs.PathLike = './ledger/active.json';
const serverJsonPath: fs.PathLike = './server.json';

interface DB {
    createServer(): Server;
    getServer(): Server;
    setServer(server: Server): void;
    getActiveLedger(): Ledger;
    setActiveLedger(ledger: Ledger): void;
    getArchivedLedger(date: Date): Ledger;
    archiveLedger(ledger: Ledger, date: Date): void;
}

export class FileDB implements DB {
    createServer(): Server {
        let server: Server;

        server = new Server(
            ServerState.Active,
            new Date(2021, 1),
            new Portions('base', [['Big Bird', new Dollar(10)], ['Bert', new Dollar(50)], ['Ernie', new Dollar(30)]]),
            ['Groceries', ]
        );

        return server;
    }

    getServer(): Server {
        return JSON.parse(fs.readFileSync(serverJsonPath, 'utf8'));
    }

    setServer(server: Server): void {
        let serverJson = JSON.stringify(server, null, 2);
        fs.writeFileSync(serverJsonPath, serverJson);
    }

    getActiveLedger(): Ledger {
        return JSON.parse(fs.readFileSync(activeJsonPath, 'utf8'));
    }

    setActiveLedger(ledger: Ledger): void {
        let ledgerJson = JSON.stringify(ledger, null, 2);
        fs.writeFileSync(activeJsonPath, ledgerJson);
    }

    getArchivedLedger(date: Date): Ledger {
        return JSON.parse(fs.readFileSync(date.toISOString(), 'utf8'));
    }

    archiveLedger(ledger: Ledger, date: Date): void {
        let archiveJson = JSON.stringify(ledger, null, 2);
        fs.writeFileSync(`ledger/archive/${date.toISOString()}.json`, archiveJson);
    }
}