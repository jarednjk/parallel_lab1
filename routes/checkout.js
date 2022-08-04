const express = require('express');
const router = express.Router();
const CartServices = require('../services/cart_services');
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


router.get('/', async (req, res) => {
    const cart = new CartServices(req.session.user.id);
    let items = await cart.getCart();

    // step 1: create line items
    let lineItems = [];
    let meta = [];
    for (let item of items) {
        const lineItem = {
            'name': item.related('poster').get('name'),
            'amount': item.related('poster').get('cost'),
            'quantity': item.get('quantity'),
            'currency': 'SGD'
        }

        if (item.related('poster').get('image_url')) {
            lineItem['images'] = [item.related('poster').get('image_url')]
        }

        lineItems.push(lineItem);
        meta.push({
            'poster_id': item.get('poster_id'),
            'quantity': item.get('quantity')
        })
    }

    // step 2: create stripe payment
    let metaData = JSON.stringify(meta);
    const payment = {
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: process.env.STRIPE_SUCCESS_URL + '?sessionId={CHECKOUT_SESSION_ID}',
        cancel_url: process.env.STRIPE_ERROR_URL,
        metadata: {
            'orders': metaData
        }
    }

    // step 3: register the session
    let stripeSession = await Stripe.checkout.sessions.create(payment);
    res.render('checkout/checkout', {
        'sessionId': stripeSession.id,
        'publishableKey': process.env.STRIPE_PUBLISHABLE_KEY
    })
})

router.get('/success', function(req,res){
    res.send('Payment success')
})

router.get('/error', function(req,res){
    res.send('Payment error')
})

router.post('/process_payment', express.raw({ type: 'application/json'}), async (req, res) => {
    let payload = req.body;
    let endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
    let sigHeader = req.headers["stripe-signature"];
    let event;
    try {
        event = Stripe.webhooks.constructEvent(payload, endpointSecret, sigHeader);
    } catch (e) {
        res.send({
            'error': e.message
        })
        console.log(e.message);
    }

    if (event.type == 'checkout.session.completed') {
        let stripeSession = event.data.object;
        console.log(stripeSession)
    }
    res.send({ received: true })
})

module.exports = router;