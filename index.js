const express = require('express');
const app = express();
const port = process.env.PORT || 3000;;
const path = require('path');
const bodyParser = require("body-parser");
const _ = require('lodash');
const fs = require('fs');

const serverJsonPath = 'server.json';
const activeJsonPath = 'ledger/active.json';

app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/archive', express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//init pug
app.set('views', './views');
app.set('view engine', 'pug');

//server state can be active (adding expenses) or disabled (everyone
//  pays before starting a new month)
let server = JSON.parse(fs.readFileSync(serverJsonPath));

let print = function() {
  let obj = {};
  Error.captureStackTrace(obj, print);
  let stackTop = obj.stack.split('\n')[1];
  console.log('\x1b[36m%s\x1b[0m', path.basename(stackTop).slice(0, -1));
  Object.values(arguments).forEach(el => console.log(JSON.stringify(el, null, '\t')));
}

let objectMap = function(object, mapFcn) {
  return Object.keys(object).reduce((result, key) => {
    result[key] = mapFcn(object[key]);
    return result;
  }, {});
}

//round such that total remains correct
function round(arr, precision) {
  let roundedArr = arr.map(x => parseFloat(x.toFixed(precision)));
  let errorArr = arr.map((x, i) => ({
    index: i,
    value: x - roundedArr[i]
  }));
  let errorSum = errorArr.reduce((a, b) => ({value: a.value + b.value})).value;
  let totalRoundingError = parseFloat(errorSum.toFixed(precision));
  //console.log(roundedArr, errorArr, errorSum, totalRoundingError);
  errorArr.sort((a, b) => (Math.abs(a.value) < Math.abs(b.value)) ? 1 : -1);
  for (let i = 0; i < Math.abs(totalRoundingError) * Math.pow(10, precision); i++) {
    roundedArr[errorArr[i].index] += Math.sign(totalRoundingError) * Math.pow(10, -precision);
  }
  return roundedArr.map(x => x.toFixed(precision));
}

let getLedgerJson = function(fileName = 'active') {
  //for the future: if you want to be able to view old months expenses
  if (fileName != 'active') {
    return JSON.parse(fs.readFileSync(`ledger/archive/${fileName}.json`));
  }

  return JSON.parse(fs.readFileSync(activeJsonPath));
}

//creates new ledger object and computes balanced rent
//old ledger object will be modified for saving in json
let computeLedger = function(ledger) {
  //TODO: don't clone entire ledger, choose just what we need to avoid bringing irrelevant bug-causing stuff
  let newLedger = _.cloneDeep(ledger);

  //copy server mate/rent information to new ledger and calculate total
  newLedger.baseRent = new Map();
  let sum = 0;
  for (let i = 0; i < server.mates.length; i++) {
    let mate = server.mates[i];
    newLedger.baseRent.set(mate.name, mate.rent);
    sum += mate.rent;
  }
  newLedger.totalRent = sum;

  //remove deleted expenses
  //TODO: list removes deleted here and in formatLedger. remove repetition?
  let list = [];
  for (let i = 0; i < newLedger.list.length; i++) {
    newLedger.list[i].index = i;  //id each expense for client-side deleting
    if (!newLedger.list[i].deleted) {
      list.push(newLedger.list[i]);
    }
  }
  //add (last month) rollover expenses
  for (let i = 0; newLedger.rollovers && i < newLedger.rollovers.length; i++) {
    list.push(newLedger.rollovers[i]);
  }

  let sumPortions = function(rent, portions) {
    let rentEntries = Object.entries(rent);
    let summedRent = rentEntries.map(([mate, val]) => [mate, val + portions[mate]]);
    return Object.fromEntries(summedRent);
  }

  //calculate balanced rent from expenses
  let rent = _.clone(newLedger.baseRent);
  for (let i = 0; i < list.length; i++) {
    let expense = list[i];

    rent.set(expense.whoPaid, rent.get(expense.whoPaid) - expense.amount);  //person who paid is compensated
    //rent = sumPortions(rent, expense.portions);      //everyone else coughs up
    rent.forEach((val, mate) => rent.set(mate, val + expense.portions[mate]));
  }


  //rollover
  let underflow = !Array.from(rent.values()).every(x => x >= 0);
  if (underflow) {
    //TODO: see if we can move away from indexes, seems real jank
    let underflowIdxs = Array.from(rent.values())
      .reduce((a, e, i) => {if (e < 0) a.push(i); return a;}, []);

    let rollovers = [];
    for (let underflowIdx of underflowIdxs) { //add a rollover expense for each underflowed roommate
      let underflowMate = Array.from(rent.keys())[underflowIdx];
      let underflowAmount = rent.get(underflowMate);
      
      //sum portions of all expenses that put current underflowed roommate negative
      let underflowList = list.filter(x => x.whoPaid == underflowMate);
      let portions = new Array(server.mates.length).fill(0);
      for (let i = 0; i < underflowList.length; i++) {
        portions = portions.map((n, j) => n + Object.values(underflowList[i].portions)[j]);
      }

      let createRolloverPortions = function(portions, underflowIdxs, underflowAmount) {
        //set underflowed mate portions to 0 (we will not subtract any more from them)
        let rolloverPortions = portions.map((n, i) => underflowIdxs.includes(i) ? 0 : n);
        //sum remaining positive mates to figure out how to scale the portions to get the whole again
        let subTotal = rolloverPortions.reduce((a, e, i) => underflowIdxs.includes(i) ? a : a + e, 0);
        //scale portions to make the total equal to underflowAmount
        rolloverPortions = rolloverPortions.map(n => n * underflowAmount / subTotal);
        //include amount for underflowed mate (this resolves the underflow)
        rolloverPortions[underflowIdx] = -underflowAmount;

        return rolloverPortions;
      }

      let rolloverPortions = createRolloverPortions(portions, underflowIdxs, underflowAmount);

      //sum portions with rent to check if this rollover will set other mates negative
      rolloverRent = rolloverPortions.map((n, i) => n + Object.values(rent)[i]);
      let tempUnderflowIdxs = underflowIdxs.slice(); //array with indices of mates that would be set under with added portions
      let i = 0;
      while (!rolloverRent.every(x => x >= 0) && i < 1000) { //loop until no roommates are negative
        tempUnderflowIdxs = tempUnderflowIdxs.concat(rolloverRent.reduce((a, e, i) => {if (e < 0) a.push(i); return a}, []));
        rolloverPortions = createRolloverPortions(portions, tempUnderflowIdxs, underflowAmount);
        rolloverRent = rolloverPortions.map((n, i) => n + Object.values(rent)[i]);
        i++;
      }

      let rolloverExpense = {};
      //rolloverExpense.category = 'Rollover';
      rolloverExpense.type = 'This month';
      rolloverExpense.amount = 0;
      //rolloverExpense.portions = round(rolloverPortions, 2).map(x => parseFloat(x));
      rolloverPortions = round(rolloverPortions, 2).map(x => parseFloat(x));
      rolloverExpense.portions = {};
      server.mates.forEach((key, i) => rolloverExpense.portions[key.name] = rolloverPortions[i]);
      rolloverExpense.whoPaid = underflowMate;

      rollovers.push(rolloverExpense);
    }

    newLedger.rollovers = newLedger.rollovers.concat(rollovers);
    list = list.concat(rollovers);

    //recalculate balanced rent from expenses
    rent = _.clone(newLedger.baseRent);
    for (let i = 0; i < list.length; i++) {
      let expense = list[i];

      rent.set(expense.whoPaid, rent.get(expense.whoPaid) - expense.amount);  //person who paid is compensated
      //rent[mate] += expense.portions[i];      //everyone else coughs up
      rent.forEach((val, mate) => rent.set(mate, val + expense.portions[mate]));
    }

  }

  newLedger.balancedRent = rent;

  return newLedger;
}

let formatDollars = function(amount, precision = 2) {
  let prefix = x => x >= 0 ? "$" : "-$";
  if (amount instanceof Array) {
    return amount.map(x => prefix(x) + Math.abs(x).toFixed(precision));
  }
  else {
    return prefix(amount) + Math.abs(amount).toFixed(precision);
  }
}

//converts convert from data in json to formatted strings ($'s, .00's, etc.)
let formatLedger = function(ledger) {
  ledger.totalRent = formatDollars(ledger.totalRent, 0);
  ledger.baseRent.forEach((rent, mate) => 
    ledger.baseRent.set(mate, formatDollars(rent)));
  ledger.balancedRent.forEach((rent, mate) =>
    ledger.balancedRent.set(mate, formatDollars(rent)));

  //convert 'yyyy-mm' to 'mmm yyyy'
  const dateObjectMonth = new Date(ledger.date);
  dateObjectMonth.setDate(dateObjectMonth.getDate() + 1); //dates are 0 indexed
  const dateOptionsMonth = {year: 'numeric', month: 'short', timeZone: 'UTC'};
  const dateFormatMonth = new Intl.DateTimeFormat('en-US', dateOptionsMonth);
  const dateFormatDay = new Intl.DateTimeFormat('en-US', {timeZone: 'UTC'});
  ledger.date = dateFormatMonth.format(dateObjectMonth);

  //excludes deleted expenses and formats date and number for others
  for (let i = 0; i < ledger.list.length; i++) {
    let expense = ledger.list[i];
    if (expense.deleted) {
      ledger.list.splice(i, 1);
      i--;
      continue;
    }
    expense.amount = formatDollars(expense.amount);
    expense.date = new Date(expense.date);
    expense.date.setHours(expense.date.getHours());
    expense.date = dateFormatDay.format(expense.date);
    expense.portions = formatDollars(Object.values(expense.portions));
  }

  //sort for most recent at the top
  ledger.list.reverse(); //if there are repeat dates, last added expense is at the top
  ledger.list.sort((a, b) => new Date(b.date) - new Date(a.date));

  //format rollover portions
  //TODO: figure out why there are separate rollovers that need to be summed here
  if (ledger.rollovers) {
    let lastRollover = {};
    lastRollover.type = 'Last month';
    //sum the portions of all 'Last month' expenses
    lastRollover.portions = ledger.rollovers.filter(r => r.type == 'Last month')
      .reduce((portions, e) => {
        return portions.map((p, i) => p + Object.values(e.portions)[i]);
      }, new Array(server.mates.length).fill(0));
    let thisRollover = {};
    thisRollover.type = 'This month';
    //sum the portions of all 'Next month' expenses
    thisRollover.portions = ledger.rollovers.filter(r => r.type == 'This month')
      .reduce((portions, e) => {
        return portions.map((p, i) => p + Object.values(e.portions)[i]);
      }, new Array(server.mates.length).fill(0));
    ledger.rollovers = [];
    //only add the rollover if it does something
    if (!Object.values(lastRollover.portions).every(x => x == 0)) ledger.rollovers.push(lastRollover);
    if (!Object.values(thisRollover.portions).every(x => x == 0)) ledger.rollovers.push(thisRollover);
    for (rollover of ledger.rollovers) {
      rollover.portions.forEach((portion, mate) =>
        rollover.portions[mate] = formatDollars(portion));
      //rollover.portions = rollover.portions.map(p => formatDollars(p));
    }
  }
}

//update ledger object and send rendered page to client
let updateClient = function(path, res, ledger) {
  //compute rent values and format for pug
  let ledgerComputed = computeLedger(ledger);
  formatLedger(ledgerComputed);

  let requests = {};
  requests.update = ['/refresh'];
  requests.expense = ['/submit', '/delete', '/undo'];
  // disabled and reset dont need alerts since the user won't know they didnt activate it.

  let mates = JSON.stringify(server.mates.map(mate => mate.name));
  //send to client
  // use nested res.renders with callbacks to append pug files and server alerts
  if (path.slice(1, 8) === 'archive') {
    res.render('archive', {ledger: ledgerComputed, server: server, mates: mates});
  }
  else if (server.state == 'active') {
    res.render('index', {ledger: ledgerComputed, server: server, mates: mates});
  }
  else {
    if (requests.update.includes(path)) {
      console.log('update');
      let alert = 'It is time to pay rent.';
      res.render('alert', {alert: alert, ledger: ledgerComputed, server: server, mates: mates});
    }
    else if (requests.expense.includes(path)) {
      let alert = 'It is time to pay rent. Submit your expense on the next month once rent has been paid.';
      res.render('alert', {alert: alert, ledger: ledgerComputed, server: server, mates: mates});
    }
    else {
      res.render('disabled', {ledger: ledgerComputed, server: server, mates: mates});
    }
  }
}

//update active.json with current ledger object
let updateActiveJson = function(ledger) {
  let ledgerJson = JSON.stringify(ledger, null, 2);
  fs.writeFileSync(activeJsonPath, ledgerJson, (err)={});
}

let updateServerJson = function(server) {
  let serverJson = JSON.stringify(server, null, 2);
  fs.writeFileSync(serverJsonPath, serverJson, (err)={});
}

//initial request
app.get('/', function(req, res) {
  let ledger = getLedgerJson();

  updateClient(req.path, res, ledger);
});

//set the server to disabled state
// (payment is in progress, step required to progress to next month)
app.get('/disabled', function(req, res) {
  let ledger = getLedgerJson();

  if (server.state == 'active') {
    console.log('disable');
    server.state = 'disabled';
    updateServerJson(server);
  }

  updateClient(req.path, res, ledger);
});

//set the server back to active state
app.get('/back', function(req, res) {
  console.log('back');
  let ledger = getLedgerJson();

  server.state = 'active';
  updateServerJson(server);

  updateClient(req.path, res, ledger);
});

//progress to next month and set server back to active state
app.get('/reset', function(req, res) {
  let ledger = getLedgerJson();
  let template;

  //if /reset is received when server isnt disabled, we have already been reset. do nothing
  if (server.state == 'disabled') {
    console.log('reset');

    //set server back to active
    server.state = 'active';
    updateServerJson(server);

    //add in mate and rent information for archival
    ledger = computeLedger(ledger);
    updateActiveJson(ledger);

    //save rollover expenses
    if (ledger.rollovers) {
      ledger.rollovers = ledger.rollovers.filter(e => e.type == 'This month');
      ledger.rollovers.forEach(e => {
        e.category = 'Rollover';
        e.type = 'Last month';
        Object.keys(e.portions).forEach(p => e.portions[p] = -e.portions[p]);
      });
    }

    //copy ledger to archive
    let newPath = 'ledger/archive/' + ledger.date + '.json';
    fs.copyFileSync(activeJsonPath, newPath);

    //create new active.json
    template = JSON.parse(fs.readFileSync('ledger/template.json'));

    let newDate = new Date(ledger.date);
    newDate.setUTCMonth(newDate.getUTCMonth() + 1);
    let year = newDate.getUTCFullYear();
    let month = newDate.getUTCMonth() + 1;
    if (month < 10)
      month = '0' + month;
    template.date = year + '-' + month;

    template.rollovers = ledger.rollovers;
  }

  updateClient(req.path, res, template);
  updateActiveJson(template);
});

//archived ledger menu
app.get('/archive', function(req, res) {
  let fileNames = fs.readdirSync('./ledger/archive/').map(str => path.parse(str).name);
  let files = fileNames.map(function(fileName) {
    let ledger = getLedgerJson(fileName);
    formatLedger(ledger);
    return {
      name: fileName,
      balancedRent: ledger.balancedRent
    }
  });
  res.render('archiveMenu', {files: files, server: server});
})

//read archived ledgers
app.get('/archive/:fileName', function(req, res) {
  let ledger = getLedgerJson(req.params.fileName);

  updateClient(req.path, res, ledger);
});

app.get('/options', function(req, res) {
  res.render('options');
});

//refresh button on ledger table
app.post('/refresh', function(req, res) {
  let ledger = getLedgerJson();

  updateClient(req.path, res, ledger);
});

//expense form submit
app.post('/submit', function(req, res) {
  let ledger = getLedgerJson();

  if (server.state == 'active') {
    console.log('Entry received:\n', req.body);

    //add new expense to ledger list
    newExpense = req.body;
    portions = JSON.parse(newExpense.portions);
    vals = Object.values(portions);
    Object.keys(portions).forEach((e, i) => portions[e] = parseFloat(vals[i]));
    newExpense.portions = portions;
    newExpense.amount = parseFloat(newExpense.amount);
    let newIndex = Object.keys(ledger.list).length;
    ledger.list[newIndex] = newExpense;
    ledger.list[newIndex].deleted = false;
  }

  updateClient(req.path, res, ledger);
  updateActiveJson(ledger);
});

//delete individual expense (trash can on each row)
app.post('/delete', function(req, res) {
  let ledger = getLedgerJson();

  if (server.state == 'active') {
    console.log('Deleted index: ', req.body.index);

    ledger.list[parseInt(req.body.index)].deleted = true;
  }

  updateClient(req.path, res, ledger);
  updateActiveJson(ledger);
});

//undo individual expense deletion
app.post('/undo', function(req, res) {
  let ledger = getLedgerJson();

  if (server.state == 'active') {
    console.log('Undone index: ', req.body.index);

    ledger.list[parseInt(req.body.index)].deleted = false;
  }

  updateClient(req.path, res, ledger);
  updateActiveJson(ledger);
});

app.listen(port, () => console.log(`Ledger listening on port ${port}!`));
