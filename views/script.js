$(document).ready(function() {
  Date.prototype.toDateInputValue = (function() {
    let local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
  });

  function updateBody(data) {
    // this can probably be simplified by sending returning different data from server
    let parser = new DOMParser();
    $('body').html(parser.parseFromString(data, 'text/html').body.outerHTML);
    init();
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

  function calculateRanges(rawValues) {
    let values = JSON.parse(JSON.stringify(rawValues)).sort((a, b) => a - b);
    values.unshift(0);
    values.push(100);
    let ranges = values.map((e, i, a) => a[i + 1] - e);
    ranges.pop();
    return ranges;
  }

  let mates = JSON.parse(document.getElementById('addExpense').dataset.mates);
  function updateLabels(rawValues) {
    let ranges = calculateRanges(rawValues);

    //set tag widths
    let tags = $('.sliderTagRow').children();
    for (let i = 0; i < ranges.length; i++) {
      $(tags[i]).css('width', ranges[i] + '%');
      $(tags[i + ranges.length]).css('width', ranges[i] + '%');
    }

    //set tag values
    tags = $('#mateVals').children();
    if ($('#slider').data('valType') == 'percent') {
      let percents = round(ranges, 0);
      for (let i = 0; i < percents.length; i++) {
        $(tags[i]).html(percents[i] + '%');
      }
    }
    else {
      let amount = $('#slider').data('valAmt');
      let dollars = round(ranges.map(x => x / 100 * amount), 2);
      for (let i = 0; i < dollars.length; i++) {
        $(tags[i]).html('$' + dollars[i]);
      }
    }
  }

  function initCustomPayment() {
    //keep track of what kind of value we have
    let amountVal = document.getElementById('amountInput').value;
    let labelDataType = amountVal ? 'money' : 'percent';
    $('#slider').data('valAmt', amountVal);
    $('#slider').data('valType', labelDataType);

    $('#slider').slider(sliderOptions);

    $('#amountInput').on('input', function(e) {
      if (e.target.value) {
        $('#slider').data('valType', 'money');
        $('#slider').data('valAmt', e.target.value);
      }
      else {
        $('#slider').data('valType', 'percent');
        $('#slider').data('valAmt', 0);
      }
      updateLabels($('#slider').slider('option', 'values'));
    });

    $('#whoPays').on('change', function(e) {
      let vals = [];
      vals.length = mates.length - 1;
      if (e.target.value == 'Everyone') {
        for (let i = 1; i < mates.length; i++) {
          vals[i - 1] = 100 / mates.length * i;
        }
      }
      else {
        let index = mates.indexOf(e.target.value);
        vals.fill(100);
        vals.fill(0, 0, index);
      }

      $('#slider').slider('option', 'values', vals);
      updateLabels(vals);
    });

    updateLabels($('#slider').slider('option', 'values'));
  }

  let valuesArray = [];
  for (let i = 1; i < mates.length; i++) {
    valuesArray.push(100 / mates.length * i);
  }

  function stopHandler(ev, ui) {
    slideHandler(ev, ui);

    //check if we have a "who pays" preset
    if (ui.values.every((x, i) => x == 100 / mates.length * (i + 1))) { //Everyone
      $('#whoPays').prop('selectedIndex', 1);
    }
    else if (ui.values.every(x => x == 0 || x == 100)) { //Individuals
      let handlesOnLeft = ui.values.filter(x => x == 0).length;
      $('#whoPays').prop('selectedIndex', handlesOnLeft + 2);
    }
  }

  function slideHandler(ev, ui) {
    $('#whoPays').prop('selectedIndex', 0);
    updateLabels(ui.values);
  }

  let sliderOptions = {
    min: 0,
    max: 100,
    step: 1,
    values: valuesArray,
    slide: slideHandler,
    stop: stopHandler
  }

  function init() {
    $('#datePicker').val(new Date().toDateInputValue()); // default date to today

    initCustomPayment();

    $('#expenseForm').on('submit', function(e) {
      e.preventDefault();

      //get ranges and convert to dollar portions
      let ranges = calculateRanges($('#slider').slider('option', 'values'));
      let amount = $('#slider').data('valAmt');
      ranges = round(ranges.map(x => x / 100 * amount), 2);

      //serialize array and attach mate portions
      let formData = $('#expenseForm').serializeArray();
      formData[formData.length] = {name: 'portions', value: ranges};

      $.post('/submit', formData).done(updateBody);
    });

    $('#refreshButton').on('click', function(e) {
      $.post('/refresh').done(updateBody);
    });

    $('.deleteButton').on('click', function(e) {
      console.log('delete...', e.currentTarget.parentElement.parentElement.getAttribute('data-row-index'));
      $.post('/delete', {index: e.currentTarget.parentElement.parentElement.getAttribute('data-row-index')}).done(updateBody);
    });

    $('#rentButton').on('click', function(e) {
      $.get('/disabled').done(updateBody);
    });
  }

  init();

  //for datadable thing
  // $('#dtDynamicVerticalScrollExample').DataTable({
  //   "scrollY": "200px",
  //   "scrollCollapse": true,
  //   "paging": false,
  //   "searching": false
  // });
  // $('.dataTables_length').addClass('bs-select');

  // $('[data-toggle="popover"]').popover();
  // $('.popover-dismiss').popover({
  //   trigger: 'hover',
  //   placement: 'top'
  // });
});
