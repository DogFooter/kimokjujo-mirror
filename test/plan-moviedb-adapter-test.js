var hi = require('../adapters/plan-moviedb-adapter');
var PlanMovie = require('../models/plan-movie');
var planMovie = new PlanMovie(1,'title','original','originalVisible',1000000,1,9,'genre','contentRate','directorId','makerId');

hi.write(planMovie,function(resultCode) {
    console.log("result:"+resultCode);
    console.log('min_kinggod ^^7');
});