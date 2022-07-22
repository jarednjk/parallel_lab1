const express = require('express');
const router = express.Router();
const {bootstrapField, createPosterForm} = require('../forms')

const {Poster} = require('../models')

router.get('/', async (req, res) => {
    let posters = await Poster.collection().fetch();
    console.log(posters.toJSON());
    res.render('posters/index', {
        posters: posters.toJSON()
    })
})

router.get('/', (req, res) => {
    res.render('posters/posters')
})

router.get('/create', async(req, res) => {
    const posterForm = createPosterForm();
    res.render('posters/create', {
        'form': posterForm.toHTML(bootstrapField)
    })
})

router.post('/create', async (req,res) => {
    const posterForm = createPosterForm();
    posterForm.handle(req, {
        'success': async (form) => {
            const poster = new Poster();
            poster.set('name', form.data.name);
            poster.set('cost', form.data.cost);
            poster.set('description', form.data.description);
            await poster.save();
            res.redirect('/posters')
        },
        'error': async (form) => {
            res.render('posters/create', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

module.exports = router;