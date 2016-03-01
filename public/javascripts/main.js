'use strict';

/*global Stripe:true*/
/*global $form:true*/

//set Public key for Stripe payments
Stripe.setPublishableKey( 'pk_test_OyogARV9IdUvtRV58JawJ5TP' );
var isSubmit = false;
$( document ).ready( function() {
    $( '#submittransaction' ).click( function() {
        console.log( 'ok' );
        if ( !isSubmit ) {
            Stripe.card.createToken( {
                number: $( '.card-number' ).val(),
                cvc: $( '.card-cvc' ).val(),
                exp_month: $( '.card-expiry-month' ).val(),
                exp_year: $( '.card-expiry-year' ).val()
            }, function( status, response ) {
                if ( response.error ) {
                    // Show the errors on the form
                    $( '.payment-errors' ).text( response.error.message );
                }
                else {
                    // response contains id and card, which contains additional card details
                    var token = response.id;
                    // Insert the token into the form so it gets submitted to the server
                    $("form.new").append( $( '<input type="hidden" name="stripeToken" />' ).val( token ) );
                    // and submit
                    $.ajax( {
                        url: '/createtransaction',
                        type: 'POST',
                        headers: {
                            'x-access-token': $( '#token' ).val()
                        },
                        data: {
                            amount: $( '#amount' ).val(),
                            currency: $( '#currency' ).val(),
                            exp_month: $( '.card-expiry-month' ).val(),
                            number: $( '.card-number' ).val(),
                            exp_year: $( '.card-expiry-year' ).val(),
                            token: token
                        }
                    } ).done( function( response ) {
                        if ( response.message ) {
                            $( '.payment-errors' ).text( response.message );
                        }
                    } );
                }

            } );
        }

    } );

    $( '#submitsaved' ).click( function() {
        $.ajax( {
            url: '/createtransaction',
            type: 'POST',
            headers: {
                'x-access-token': $( '#token' ).val()
            },
            data: {
                amount: $( '#amountS' ).val(),
                currency: $( '#currencyS' ).val(),
                card : $( '#card' ).val(),
                custId : $( '#cust' ).val()
            }
        } ).done( function( response ) {
            if ( response.message ) {
                $( '.payment-errors' ).text( response.message );
            }
        } );
    })
} );
