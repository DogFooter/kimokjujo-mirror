var router = require('express').Router();
var sessionAdapter = require('../adapters/sessiondb-adapter');
var dbResultCode = require('../status-codes/db-result');
var PlanMovie = require('../models/plan-movie');
var ResultMovie = require('../models/result-movie');
var PlanMovieActor = require('../models/plan-movie-actor');
var PlanMovieUser = require('../models/plan-movie-user');
var planMovieAdapter = require('../adapters/plan-moviedb-adapter');
var planMovieActorAdapter = require('../adapters/plan-movie-actordb-adapter');
var planMovieUserAdapter = require('../adapters/plan-movie-userdb-adapter');
var resultMovieAdapter = require('../adapters/result-moviedb-adapter');
var listActorPowerAdapter = require('../adapters/list-actorpowerdb-adapter');
var engineAdapter = require('../adapters/engine-adapter');
var sendHTML = require('../adapters/send-html').sendHTML;

router.route('/').get(function (req, res, next) {

    var sessionKey = req.cookies.sessionkey;

    sessionAdapter.typeCheck(sessionKey, function (userType) {
        if (userType == 1) {
            sendHTML('plan-movie', res, next);
        }
        else if (userType == 2) { 
            sendHTML('plan-movie', res, next);
        }
        else {
            next();
        }
    });
});

router.route('/').post(function(req, res, next){
    var returnJSON = {success: false};

    var sessionKey; 
    var userId;

    if (req.cookies.userType == undefined || req.cookies.sessionkey == undefined || req.cookies.userId == undefined) {
        console.log('hello')
        return res.json(returnJSON);
    }
    else {
        sessionKey = req.cookies.sessionkey;
        userId = req.cookies.userId;
        console.log(userId)
    }

    if (req.cookies.userType == 1) {
        if (req.body.title == undefined || req.body.original == undefined || req.body.budget == undefined || req.body._3words == undefined || req.body.releaseMonth == undefined
            || req.body.genre == undefined || req.body.contentRate == undefined || req.body.directorId == undefined || req.body.makerId == undefined) {
            return res.json(returnJSON);
        }
        else {

        }
    }
    else {
        if (req.body.title == undefined || req.body.original == undefined || req.body.budget == undefined || req.body._3words == undefined || req.body.releaseMonth == undefined
            || req.body.genre == undefined || req.body.contentRate == undefined || req.body.directorId == undefined || req.body.makerId == undefined || req.body.scenario == undefined) {
            return res.json(returnJSON);
        }
        else {

        }
    }
    sessionAdapter.typeCheck(sessionKey, function (userType) {
        if (userType) {

            var original_;
            var originalVisible_;


            var originalChunk = req.body.original.split('/');
            if (originalChunk.length == 2) {
                original_ = originalChunk[1];
                originalVisible_ = originalChunk[0];
            }
            else {
                return res.json(returnJSON);
            }

            var planMovie = new PlanMovie(1,
                req.body.title,
                original_,
                originalVisible_,
                req.body.budget,
                req.body._3words,
                req.body.releaseMonth,
                req.body.genre,
                req.body.contentRate,
                req.body.directorId,
                req.body.makerId
            );
            planMovieAdapter.write(planMovie, function(resultCode, planMovieId){
                if (resultCode == dbResultCode.OK) {
                    var planMovieActor1 = new PlanMovieActor(1, planMovieId, req.body.actor1Id);
                    var planMovieActor2 = new PlanMovieActor(1, planMovieId, req.body.actor2Id);
                    planMovieActorAdapter.writeActors([planMovieActor1, planMovieActor2], function(resultCode) {
                        if (resultCode == dbResultCode.OK) {
                            var planMovieUser = new PlanMovieUser(1, planMovieId, userId);
                            planMovieUserAdapter.write(planMovieUser, function(resultCode) {
                                if (resultCode == dbResultCode.OK) {
                                    engineAdapter.runEngine(planMovieId, req.body.actor1Id, req.body.actor2Id, function(err, engineResult) {
                                        if (err) {
                                            res.json(returnJSON);
                                        }
                                        else {
                                            listActorPowerAdapter.getList([req.body.actor1Id, req.body.actor2Id], function(resultCode, similarActorList) {
                                                if (resultCode == dbResultCode.OK) {

                                                    returnJSON.planMovie = planMovie;
                                                    delete returnJSON.planMovie.id;
                                                    returnJSON.actors = [req.body.actor1Id, req.body.actor2Id];
                                                    returnJSON.similarActors = similarActorList;
                                                    
                                                    var resultMovie = new ResultMovie(1, planMovieId, (new Date()).toISOString().substring(0, 10), '', engineResult[0], engineResult[1], '');
                                                    // if user is user2 add scenario
                                                    if (userType == 2) {
                                                        returnJSON.scenario = req.body.scenario;
                                                        resultMovie.scenario = req.body.scenario;
                                                    }
                                                    returnJSON.planMovieResult = resultMovie;

                                                    resultMovieAdapter.write(resultMovie, function(resultCode) {
                                                        if (resultCode == dbResultCode.OK) {
                                                            returnJSON.success = true;
                                                            res.json(returnJSON); 
                                                        }
                                                        else {
                                                            res.json(returnJSON);
                                                        }
                                                    }); 
                                                }
                                                else {
                                                    res.json(returnJSON);
                                                }
                                            });
                                        }
                                    });
                                }
                                else {
                                    res.json(returnJSON);
                                }
                            });
                        }
                        else {
                            res.json(returnJSON);
                        }
                    });
                }
                else {
                    res.json(returnJSON);
                }
            });
        }
        else{
            res.json(returnJSON);
        }
    });
});


module.exports = router; 
