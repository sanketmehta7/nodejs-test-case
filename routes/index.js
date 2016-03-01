'use strict';

var express = require( 'express' );
var router = express.Router();
var transactionController = require( '../api/transactionsController.js' );
var authController = require( '../api/authController.js' );
var User = require( '../models/user.model.js' );
var jwt = require( 'jsonwebtoken' );
var config = require( '../config' );


/* GET home page. */
/*Save transaction to database*/

router.get( '/', function( req, res ) {
    res.render( 'index', {
        title: 'User'
    } );
} );
router.get( '/logout', authController.logout );
router.post( '/authenticate', authController.index );
router.post( '/register', authController.register );

//login
router.get( '/login', function( req, res ) {
    res.render( 'login', {
        title: 'Login'
    } );
} );

function checkAuthBefore( req, res, next ) {
    // check header or url parameters or post parameters for token
    var token = req.headers[ 'x-access-token' ] || req.body.token || req.query.token  ;
    // decode token
    console.log(token);
    if ( token ) {
        // verifies secret and checks exp
        jwt.verify( token, config.secret, function( err, decoded ) {
            if ( err ) {
                return res.json( {
                    success: false,
                    message: 'Failed to authenticate token.'
                } );
            }
            else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        } );

    }
    else {

        // if there is no token
        // return an error
        return res.status( 200 ).send( {
            success: false,
            message: 'No token provided.'
        } );
    }
} ;


router.post( '/createtransaction',checkAuthBefore, transactionController.createTransaction );

module.exports = router;
