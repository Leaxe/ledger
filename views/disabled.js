$(document).ready(function() {

  function updateBody(data) {
    // this can probably be simplified by sending returning different data from server
    let parser = new DOMParser();
    $('body').html(parser.parseFromString(data, 'text/html').body.outerHTML);
    init();
  }

  function init() {
    $('#newMonthButton').on('click', function(e) {
      $.get('/reset').done(updateBody);
    });
  }

  init();
});
