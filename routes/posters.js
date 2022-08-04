const express = require('express');
const router = express.Router();
const { bootstrapField, createPosterForm, createSearchForm } = require('../forms');
const { Poster, Category, Tag } = require('../models');
const { checkIfAuthenticated } = require('../middlewares');
const dataLayer = require('../dal/posters');

router.get('/', async (req, res) => {
    const categories = await dataLayer.getAllCategories();
    categories.unshift([0, '----']);

    const tags = await dataLayer.getAllTags();

    let searchForm = createSearchForm(categories, tags);
    let q = Poster.collection();

    searchForm.handle(req, {
        'empty': async (form) => {
            let posters = await q.fetch({
                withRelated: ['category', 'tags']
            })
            res.render('posters/index', {
                'posters': posters.toJSON(),
                'form': form.toHTML(bootstrapField)
            })
        },
        'error': async (form) => {
            let posters = await q.fetch({
                withRelated: ['category', 'tags']
            })
            res.render('posters/index', {
                'posters': posters.toJSON(),
                'form': form.toHTML(bootstrapField)
            })

        },
        'success': async (form) => {
            if (form.data.name) {
                q = q.where('name', 'like', '%' + req.query.name + '%')
            }

            if (form.data.category_id && form.data.category_id != "0") {
                q = q.query('join', 'categories', 'category_id', 'categories_id').where('categories.name', 'like', '%' + req.query.category + '%')
            }

            if (form.data.min_cost) {
                q = q.where('cost', '>=', req.query.min_cost)
            }

            if (form.data.max_cost) {
                q = q.where('cost', '<=', req.query.max_cost)
            }

            if (form.data.tags) {
                q.query('join', 'posters_tags', 'posters.id', 'poster_id').where('tag_id', 'in', form.data.tags.split(','))
            }

            let posters = await q.fetch({
                withRelated: ['category', 'tags']
            })
            res.render('posters/index', {
                'posters': posters.toJSON(),
                'form': form.toHTML(bootstrapField)
            })
        }
    })

})

router.get('/create', checkIfAuthenticated, async (req, res) => {
    const categories = await dataLayer.getAllCategories();

    const tags = await dataLayer.getAllTags();

    const posterForm = createPosterForm(categories, tags);
    res.render('posters/create', {
        'form': posterForm.toHTML(bootstrapField),
        cloudinaryName: process.env.CLOUDINARY_NAME,
        cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
        cloudinaryPreset: process.env.CLOUDINARY_UPLOAD_PRESET
    })
})

router.post('/create', checkIfAuthenticated, async (req, res) => {
    const categories = await dataLayer.getAllCategories();
    const tags = await dataLayer.getAllTags();

    const posterForm = createPosterForm(categories, tags);
    posterForm.handle(req, {
        'success': async (form) => {
            let { tags, ...posterData } = form.data
            const poster = new Poster(posterData);
            await poster.save();

            if (tags) {
                await poster.tags().attach(tags.split(","));
            }
            req.flash("success_messages", `New Product ${poster.get('name')} has been created`)
            res.redirect('/posters')
        },
        'error': async (form) => {
            res.render('posters/create', {
                'form': form.toHTML(bootstrapField)
            })
        }
    })
})

router.get('/:poster_id/update', checkIfAuthenticated, async (req, res) => {
    const posterId = req.params.poster_id;
    const poster = await dataLayer.getPosterById(posterId);

    const tags = await dataLayer.getAllTags();

    const categories = await dataLayer.getAllCategories();

    const posterForm = createPosterForm(categories, tags);

    posterForm.fields.name.value = poster.get('name');
    posterForm.fields.cost.value = poster.get('cost');
    posterForm.fields.description.value = poster.get('description');
    posterForm.fields.category_id.value = poster.get('category_id');
    posterForm.fields.image_url.value = poster.get('image_url');

    let selectedTags = await poster.related('tags').pluck('id');
    posterForm.fields.tags.value = selectedTags;

    res.render('posters/update', {
        'form': posterForm.toHTML(bootstrapField),
        'poster': poster.toJSON(),
        cloudinaryName: process.env.CLOUDINARY_NAME,
        cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
        cloudinaryPreset: process.env.CLOUDINARY_UPLOAD_PRESET
    })

})

router.post('/:poster_id/update', checkIfAuthenticated, async (req, res) => {
    const categories = await dataLayer.getAllCategories();
    const tags = await dataLayer.getAllTags();

    const posterId = req.params.poster_id;
    const poster = await dataLayer.getPosterById(posterId);

    const posterForm = createPosterForm(categories, tags);
    posterForm.handle(req, {
        'success': async (form) => {
            let { tags, ...posterData } = form.data;
            poster.set(posterData);
            poster.save();

            // update tags
            let tagIds = tags.split(',');
            let existingTagIds = await poster.related('tags').pluck('id');

            // remove all tags that aren't selected anymore
            let toRemove = existingTagIds.filter(id => tagIds.includes(id) === false);
            await poster.tags().detach(toRemove);

            // add in all tags selected in the form
            await poster.tags().attach(tagIds);
            req.flash("success_messages", `${poster.get('name')} has been updated`)
            res.redirect('/posters')
        },
        'error': async (form) => {
            res.render('posters/update', {
                'form': form.toHTML(bootstrapField),
                'poster': poster.toJSON()
            })
        }
    })
})

router.get('/:poster_id/delete', async (req, res) => {
    const posterId = req.params.poster_id;

    const poster = await dataLayer.getPosterById(posterId);

    res.render('posters/delete', {
        'poster': poster.toJSON()
    })
})

router.post('/:poster_id/delete', async (req, res) => {
    const posterId = req.params.poster_id;

    const poster = await dataLayer.getPosterById(posterId);

    await poster.destroy();
    res.redirect('/posters')
})

module.exports = router;