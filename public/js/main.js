if($.cookie('userType') == 1) {
    $('#newMovie').show();
    $('#fundList').show();
    $('#history').show();
    $('#logout').show();
} else if($.cookie('userType') == 2) {
    $('#newMovie').show();
    $('#history').show();
    $('#logout').show();
} else {
    $('#login').show();
}