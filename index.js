const express = require('express');
const app = express();
const port = process.env.PORT || 3000;;
const path = require('path');
const bodyParser = require("body-parser");
const _ = require('lodash');
const fs = require('fs');

// TODO: date displayed is wrong (11/17 vs 11/16)
// TODO: delete/edit rows: will probably mean changing from post, since this is special
//    https://www.tutorialrepublic.com/snippets/preview.php?topic=bootstrap&file=table-with-add-and-delete-row-feature
// TODO: auto-backup daily? incase accidentally deleting stuff
// TODO: datatable for floating header and responsive to the bottom of screen
//    https://datatables.net/download/
//    https://mdbootstrap.com/docs/jquery/tables/scroll/
// TODO: cleanup formatLedger()
// TODO: color rents (green and red or whatever)
// TODO: server json file that has rent state (paying/not paying)
//  and base rents (maybe even constants for tenant names)
// TODO: prevent new expense from being added from pages that haven't refreshed
//  before "Pay rent" has started

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//init pug
app.set('views', './views');
app.set('view engine', 'pug');

//server state can be active (adding expenses) or disabled
//  (everyone pays before starting a new month)
let server = JSON.parse(fs.readFileSync('server.json'));

let getLedgerJson = function(date = 'active') {
  //for the future: if you want to be able to view old months expenses
  if (date != 'active') {}

  return JSON.parse(fs.readFileSync('ledger/active.json'));
}

//computes the balanced rent values
let computeLedger = function(ledger) {
  let newLedger = _.cloneDeep(ledger);
  newLedger.baseRent = {};
  newLedger.balancedRent = {};
  let sum = 0;
  for (let i = 0; i < server.mates.length; i++) {
    let mate = server.mates[i];
    newLedger.baseRent[mate.name] = mate.rent;
    sum += mate.rent;
  }
  newLedger.totalRent = sum;
  newLedger.balancedRent = _.clone(newLedger.baseRent);

  let rent = newLedger.balancedRent;
  for (let i = 0; i < newLedger.list.length; i++) {
    if (newLedger.list[i].deleted)
      continue;
    let expense = newLedger.list[i];
    let whoPaid = expense.whoPaid;
    let whoPays = expense.whoPays;
    let amount = expense.amount;
    let portions = expense.portions;

    console.log(expense.portions);
    rent[whoPaid] -= amount;
    for (let i = 0; i < server.mates.length; i++) {
      let mate = server.mates[i].name;
      rent[mate] += expense.portions[i];
    }
  }

  return newLedger;
}

//converts convert from data in json to formatted strings ($'s, .00's, etc.)
let formatLedger = function(ledger) {
  ledger.totalRent = "$" + ledger.totalRent.toFixed(0);
  for (let person in ledger.baseRent) {
    ledger.baseRent[person] = "$" + ledger.baseRent[person].toFixed(2);
  }
  for (let person in ledger.balancedRent) {
    ledger.balancedRent[person] = "$" + ledger.balancedRent[person].toFixed(2);
  }

  //convert 'yyyy-mm' to 'mmm yyyy'
  const dateObjectMonth = new Date(ledger.date);
  dateObjectMonth.setDate(dateObjectMonth.getDate() + 1); //dates are 0 indexed
  const dateOptionsMonth = {year: 'numeric', month: 'short', timeZone: 'UTC'};
  const dateFormatMonth = new Intl.DateTimeFormat('en-US', dateOptionsMonth);
  const dateFormatDay = new Intl.DateTimeFormat('en-US', {timeZone: 'UTC'});
  ledger.date = dateFormatMonth.format(dateObjectMonth);

  let index = -1;
  for (let i = 0; i < ledger.list.length; i++) {
    index++;
    expense = ledger.list[i];
    if (expense.deleted) {
      ledger.list.splice(i, 1);
      i--;
      continue;
    }
    expense.index = index;
    expense.amount = "$" + expense.amount.toFixed(2);
    expense.date = new Date(expense.date);
    expense.date.setHours(expense.date.getHours());
    expense.date = dateFormatDay.format(expense.date);
  }

  ledger.list.sort((a, b) => new Date(b.date) - new Date(a.date));

}

let updateClient = function(res, ledger) {
  //compute rent values and format for pug
  let ledgerComputed = computeLedger(ledger);
  formatLedger(ledgerComputed);

  let mates = JSON.stringify(server.mates.map(mate => mate.name));
  //send to client
  if (server.state == 'active') {
    res.render('index', {ledger: ledgerComputed, server: server, mates: mates});
  }
  else {
    res.render('disabled', {ledger: ledgerComputed});
  }

}

let updateJson = function(path, ledger) {
  let ledgerJson = JSON.stringify(ledger, null, 2);
  fs.writeFileSync(path, ledgerJson, (err)={});
}

app.get('/', function(req, res) {
  let ledger = getLedgerJson();

  updateClient(res, ledger);
});

app.get('/disabled', function(req, res) {
  console.log('disable');
  let ledger = getLedgerJson();

  server.state = 'disabled';
  let serverJson = JSON.stringify(server, null, 2);
  fs.writeFileSync('server.json', serverJson, (err)={});

  updateClient(res, ledger);
});

app.get('/reset', function(req, res) {
  console.log('reset');
  //if (server.state == 'active') {}
  let ledger = getLedgerJson();

  server.state = 'active';
  let serverJson = JSON.stringify(server, null, 2);
  fs.writeFileSync('server.json', serverJson, (err)={});

  let oldPath = 'ledger/archive/' + ledger.date + '.json';
  fs.copyFileSync('ledger/active.json', oldPath);

  let template = JSON.parse(fs.readFileSync('ledger/template.json'));
  let newDate = new Date(ledger.date);
  newDate.setUTCMonth(newDate.getUTCMonth() + 1);
  let year = newDate.getUTCFullYear();
  let month = newDate.getUTCMonth() + 1;
  if (month < 10)
    month = '0' + month;
  template.date = year + '-' + month;

  let ledgerJson = JSON.stringify(template, null, 2);
  fs.writeFileSync('ledger/active.json', ledgerJson, (err)={});

  updateClient(res, ledger);
});

app.post('/refresh', function(req, res) {
  let ledger = getLedgerJson();

  updateClient(res, ledger);
});

app.post('/submit', function(req, res) {
  console.log('Entry received:\n', req.body);

  //add new expense to ledger list
  let ledger = getLedgerJson();
  req.body.portions = JSON.parse('[' + req.body.portions + ']');
  req.body.amount = parseFloat(req.body.amount);
  let newIndex = Object.keys(ledger.list).length;
  ledger.list[newIndex] = req.body;
  ledger.list[newIndex].deleted = false;

  updateClient(res, ledger);
  updateJson('ledger/active.json', ledger);
});

app.post('/delete', function(req, res) {
  console.log('Deleted index: ', req.body.index);

  //delete expense
  let ledger = getLedgerJson();
  ledger.list[parseInt(req.body.index)].deleted = true;

  updateClient(res, ledger);
  updateJson('ledger/active.json', ledger);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
