const express = require('express');
const router = express.Router();
const CartServices = require('../services/cart_services');

router.get('/', async (req, res) => {
    let cart = new CartServices(req.session.user.id);
    res.render('carts/index', {
        'shoppingCart': (await cart.getCart()).toJSON()
    })
})

router.get('/:poster_id/add', async (req, res) => {
    let cart = new CartServices(req.session.user.id);
    await cart.addToCart(req.params.poster_id, 1);
    req.flash('success_messages', 'Yay! Successfully added to cart');
    res.redirect('/posters');
})

router.get('/:poster_id/remove', async (req, res) => {
    let cart = new CartServices(req.session.user.id);
    await cart.remove(req.params.poster_id);
    req.flash('success_messages', 'Item has been removed');
    res.redirect('/cart/');
})

router.post('/:poster_id/quantity/update', async (req, res) => {
    let cart = new CartServices(req.session.user.id);
    await cart.setQuantity(req.params.poster_id, req.body.newQuantity);
    req.flash('success_messages', 'Quantity updated');
    res.redirect('/cart/');
})

module.exports = router;