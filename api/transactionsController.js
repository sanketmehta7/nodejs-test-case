'use strict';

var Transactions = require( '../models/transactions.model.js' );
var config = require( '../config' );
var Stripe = require( 'stripe' )( config.secret );
var User = require( '../models/user.model.js' );

exports.index = function( req, res, next ) {
    if ( req.body ) {
        var transaction = new Transactions( {
            name: req.body.name
        } );
        transaction.save( function( err, trans ) {
            if ( err ) {
                return console.log( err );
            }
            res.status( 200 ).end();
        } );
    }
};

function createCard(user,cName,token){
    Stripe.customers.createSource(
      cName,
      {source: token},
      function(err, card) {
        // asynchronously called
        console.log(err);
        console.log(card);
        if(err ==null && typeof card.id !="undefined"){
            console.log(card);
            var flagCheck = 0;
            User.findOne( {
                name: user.name
            }, function( err, user ) {
                if(err) return next(err);
                user.stripeCust  = cName;
                if(typeof user.cards =="undefined"){
                    user.cards = [card.id];
                    flagCheck=1;
                }
                if(user.cards.indexOf(card.id)==-1){
                    user.cards.push(card.id);
                    flagCheck=1;
                }
                if(flagCheck){
                    user.save(function( err ) {
                        if ( err ) {
                            console.log(err.message)
                        }
                    });
                }
            })
        }
      }
    );
}

exports.createTransaction = function( req, res, next ) {
    console.log(111);
    console.log(req.body);
    
    if(typeof req.body.custId !="undefined" && req.body.custId!=null && req.body.custId!=""){
        var chargeSource = {
            amount: req.body.amount,
            currency: req.body.currency,
            source: req.body.card,
            customer: req.body.custId,
            description: 'Charge for test@example.com'
        };
    }else{
        var chargeSource = {
            amount: req.body.amount,
            currency: req.body.currency,
            source: req.body.token,
            description: 'Charge for test@example.com'
        };

        var tSource = {object:"card",exp_month:req.body.exp_month,exp_year:req.body.exp_year,number:req.body.number};
        if(typeof req.session.user.stripeCust == "undefined" || req.session.user.stripeCust == null || req.session.user.stripeCust ==""){
            Stripe.customers.create({
              description: 'Customer for test@example.com',
              source: tSource
            }, function(err, customer) {
              // asynchronously called
              if(err ==null && typeof customer.id !="undefined"){
                createCard(req.session.user,customer.id,tSource);
              }
            });
        }else{
            createCard(req.session.user,req.session.user.stripeCust,tSource);
        }
    }

    console.log(chargeSource);

    Stripe.charges.create( chargeSource, function( err, charge ) {
        console.log(charge);
        if ( err ) {
            console.log( err );
            return res.json( {
                success: false,
                message: err.message
            } );

        }
        var transaction = new Transactions( {
            transactionId: charge.id,
            amount: charge.amount,
            created: charge.created,
            currency: charge.currency,
            description: charge.description,
            paid: charge.paid,
            sourceId: charge.source.id
        } );

        transaction.save( function( err ) {
                if ( err ) {
                    return res.status( 500 ).json({
                        success: false,
                        message: err.message
                    });
                }
                else {
                    res.status( 200 ).json( {
                        message: 'Payment is created.'
                    } );
                }
            } );
            // asynchronously called
    } );
};
