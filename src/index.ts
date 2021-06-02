import express from 'express';
const app = express();
const port = process.env.PORT || 3000;
import path from 'path';
import bodyParser from 'body-parser';
import _ from 'lodash';
import fs from 'fs';


app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/archive', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    
});

app.listen(port, () => console.log(`Ledger listening on port ${port}!`));