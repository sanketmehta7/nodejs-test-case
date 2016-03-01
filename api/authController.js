'use strict';

var User = require( '../models/user.model.js' );
var jwt = require( 'jsonwebtoken' );
var config = require( '../config' );
var Stripe = require( 'stripe' )( config.secret );

exports.index = function( req, res,next ) {

    // find the user
    User.findOne( {
        name: req.body.name
    }, function( err, user ) {

        if(err) return next(err);

        if ( !user ) {
            res.json( {
                success: false,
                message: 'Authentication failed. User not found.'
            } );
        }
        else if ( user ) {
            user.comparePassword( req.body.password, function( err, isMatch ) {
                if(err) return next(err);

                if(!isMatch) {
                    return res.status( 401 ).json( {
                        success: false,
                        message: 'Authentication failed. Wrong password.'
                    } );
                }

                // if user is found and password is right
                // create a token
                 //req.session = {};
                 delete req.session.user;
                req.session.user = user;
                var token = jwt.sign( user, config.secret, {
                    expiresIn: 1440 // expires in 24 hours
                } );
                if(user.stripeCust!="" && user.cards.length){

                    Stripe.customers.retrieveCard(
                      user.stripeCust,
                      user.cards[0],
                      function(err, card) {
                        if(err ==null && typeof card.id !="undefined"){
                            res.render( 'transactions', {
                                token: token,
                                cards:[card],
                                cust:typeof user.stripeCust!="undefined" && user.stripeCust!=null && user.stripeCust!=""?user.stripeCust:"",
                                title: 'Transactions Page'
                              }); 
                        }else{
                          res.render( 'transactions', {
                            token: token,
                            cards:[],
                            cust:typeof user.stripeCust!="undefined" && user.stripeCust!=null && user.stripeCust!=""?user.stripeCust:"",
                            title: 'Transactions Page'
                          }); 
                        }
                      }
                    );

                }else{
                    res.render( 'transactions', {
                        token: token,
                        cards:[],
                        cust:"",
                        title: 'Transactions Page'
                    } );
                }
                // return the information including token as JSON
                

            } );
        }

    } );
};

exports.register = function( req, res,next ) {

    // find the user
    User.findOne( {
        name: req.body.name
    }, function( err, user ) {

        if(err) return next(err);

        if ( user ) {
            res.json( {
                success: false,
                message: 'Register failed. Username is not free'
            } );
        }
        else {
            user = new User( {
                name: req.body.name,
                password: req.body.password,
                cards:[],
                stripeCust:""
            } );
            user.save( function( err ) {
                if ( err ) {
                    return res.status( 500 ).json( {
                        success: false,
                        message: 'Registration failed'
                    } );
                }

                // if user is found and password is right
                // create a token
                var token = jwt.sign( user, config.secret, {
                    expiresIn: 1440 // expires in 24 hours
                } );

                // return the information including token as JSON
                res.render( 'transactions', {
                    token: token,
                    title: 'Transactions Page',
                    cards:[],
                    cust:""
                } );
            } );
        }

    } );
};

exports.logout = function( req, res,next ) {
  delete req.session.user;
  res.redirect('/login');
}
