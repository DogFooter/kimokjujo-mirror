var router = require('express').Router();
var sessionAdapter = require('../adapters/sessiondb-adapter');
var planMovieAdapter = require('../adapters/plan-moviedb-adapter');
var resultMovieAdapter = require('../adapters/result-moviedb-adapter');
var planMovieActorAdapter = require('../adapters/plan-movie-actordb-adapter');
var viewsAdapter = require('../adapters/views-adapter');
var likeAdapter = require('../adapters/like-it-adapter');

const dbResultCode = require('../status-codes/db-result');

// host/history : return histories data 
router.get('/', function (req, res, next) {

    var sessionKey = req.cookies.sessionkey;

    var returnJSON = { success: false };

    sessionAdapter.search(sessionKey, null, function (resultCode, rows) {

        if (resultCode == dbResultCode.OK) {
            if (rows.length != 0) {
                var userId = rows[0].userId;

                var result = [];

                resultMovieAdapter.searchFundList(function (resultCode, rows) {
                    if (resultCode == dbResultCode.OK) {
                        console.log(rows);
                        for (var i in rows) {
                            var row = rows[i];
                            var planMovie = {};
                            var planMovieResult = {};

                            // var actors = row.actorIds.split(',');
                            var actors = rows[i].actors.split(',');
                            var likeCount = rows[i].likeCount;
                            var views = rows[i].views;

                            delete row.actorId;
                            delete row.audience;
                            delete row.breakEvenPoint;
                            delete row.contract;

                            planMovie = row;
                            planMovie.id = planMovie.planMovieId;

                            delete planMovie.planMovieId;

                            planMovieResult = { 'date': rows[i].date, 'scenario': rows[i].scenario, 'audience': rows[i].audience, 'breakEvenPoint': rows[i].breakEvenPoint, 'contract': rows[i].contract, 'views': views };
                            //planMovieResult: {date:날짜, scenario:시나리오, audience:관객수,breakEvenPoint:손익분기 달성여부, contract:체결여부}


                            result.push({ 'planMovie': planMovie, 'actors': actors, 'planMovieResult': planMovieResult, 'likeCount': likeCount });

                        }

                        returnJSON.success = true;
                        returnJSON.planMovies = result;

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
        }
        else {
            res.json(returnJSON);
        }
    });
});
router.get('/:planMovieId', function (req, res, next) {

    // 여기서 플랜무비 찾고 리절트 찾고 액터 찾고 다 해야 보낼 수 있음

    console.log(req.cookies);

    var planMovieId = req.params.planMovieId;
    var sessionKey = req.cookies.sessionkey;

    sessionAdapter.search(sessionKey, null, function (resultCode, rows) {

        if (resultCode == dbResultCode.OK) {
            if (rows.length != 0) {
                var userId = rows[0].userId;

                planMovieAdapter.search(planMovieId, [], function (resultCode, planMovie) {

                    if (resultCode == dbResultCode.OK) {
                        resultMovieAdapter.searchByPlanMovieId(planMovieId, [], function (resultCode, resultMoive) {
                            if (resultCode == dbResultCode.OK) {
                                planMovieActorAdapter.searchByPlanMovieId(planMovieId, [], function (resultCode, actors) {
                                    if (resultCode == dbResultCode.OK) {

                                        var returnJSON = { success: true };
                                        try {
                                            returnJSON.planMovie = planMovie[0];
                                            returnJSON.planMovieResult = resultMoive[0];
                                            returnJSON.actors = [];
                                            for (var i in actors) {
                                                returnJSON.actors.push(actors[i].actorId);
                                            }
                                        }
                                        catch (e) {
                                            returnJSON.success = false;
                                        }

                                        if (returnJSON.success == true) {
                                            viewsAdapter.increaseViews(planMovieId, function (resultCode) {
                                                if (resultCode == dbResultCode.OK) {
                                                    
                                                    likeAdapter.countLike(planMovieId, function(resultCode, rows){
                                                        if (resultCode == dbResultCode.OK) {
                                                            returnJSON.likeCount = rows[0].cnt;
                                                            if(rows[0].cnt != 0 ){
                                                                likeAdapter.searchMine(userId, planMovieId, function(resultCode, rows){
                                                                    if(resultCode == dbResultCode.OK && rows.length != 0){
                                                                        returnJSON.myLike = true;
                                                                        console.log('myLike:true');
                                                                        res.json(returnJSON);
                                                                    }
                                                                    else if(resultCode == dbResultCode.OK && rows.length == 0){
                                                                        returnJSON.myLike = false;
                                                                        console.log('myLike:false');
                                                                        res.json(returnJSON);
                                                                    }
                                                                    else{
                                                                        res.json({success : false});
                                                                    }
                                                                });   
                                                            }
                                                            else {
                                                                returnJSON.mylike = false;
                                                                console.log('myLike:false');
                                                                res.json(returnJSON);
                                                            }
                                                        }
                                                        else {
                                                            res.json({success: false});
                                                        }
                                                    });
                                                    // 여기서 라이크 숫자랑 내가 좋아하는지 여부 출력하면 된다
                                                }
                                                else {
                                                    res.json({success:false});
                                                }
                                            });
                                        }
                                        else {
                                            res.json({success: false});
                                        }
                                    }
                                    else {
                                        res.json({ success: false });
                                    }
                                });
                            }
                            else {
                                res.json({ success: false });
                            }
                        });
                    }
                    else {
                        res.json({ success: false });
                    }

                });
            }
            else {
                next();
            }
        }
        else {
            next();
        }
    });

});
module.exports = router;
