const express = require('express');
const router = express.Router();
const {bootstrapField, createPosterForm} = require('../forms')

const {Poster, Category, Tag} = require('../models')

router.get('/', async (req, res) => {
    let posters = await Poster.collection().fetch({
        withRelated: ['category', 'tags']
    });
    res.render('posters/index', {
        posters: posters.toJSON()
    })
})

router.get('/create', async(req, res) => {
    const categories = await Category.fetchAll().map((category) => {
        return [category.get('id'), category.get('name')];
    })

    const tags = await Tag.fetchAll().map(tag => [tag.get('id'), tag.get('name')])

    const posterForm = createPosterForm(categories, tags);
    res.render('posters/create', {
        'form': posterForm.toHTML(bootstrapField)
    })
})

router.post('/create', async (req,res) => {
    const categories = await Category.fetchAll().map((category) => {
        return [category.get('id'), category.get('name')];
    })

    const posterForm = createPosterForm(categories);
    posterForm.handle(req, {
        'success': async (form) => {
            let {tags, ...posterData} = form.data
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

router.get('/:poster_id/update', async (req, res) => {
    const poster = await Poster.where({
        'id': req.params.poster_id
    }).fetch({
        require: true,
        withRelated:['tags']
    });

    const tags = await Tag.fetchAll().map( tag => [tag.get('id'), tag.get('name')]);

    const categories = await Category.fetchAll().map((category) => {
        return [category.get('id'), category.get('name')];
    })

    const posterForm = createPosterForm(categories, tags);

    posterForm.fields.name.value = poster.get('name');
    posterForm.fields.cost.value = poster.get('cost');
    posterForm.fields.description.value = poster.get('description');
    posterForm.fields.category_id.value = poster.get('category_id');

    let selectedTags = await poster.related('tags').pluck('id');
    posterForm.fields.tags.value = selectedTags;

    res.render('posters/update', {
        'form': posterForm.toHTML(bootstrapField),
        'poster': poster.toJSON()
    })

})

router.post('/:poster_id/update', async (req, res) => {
    const categories = await Category.fetchAll().map((category) => {
        return [category.get('id'), category.get('name')];
    })
    
    const poster = await Poster.where({
        'id': req.params.poster_id
    }).fetch({
        require: true,
        withRelated: ['tags']
    });

    const posterForm = createPosterForm(categories);
    posterForm.handle(req, {
        'success': async (form) => {
            let { tags, ...posterData} = form.data;
            poster.set(posterData);
            poster.save();

            // update tags
            let tagIds = tags.split(',');
            let existingTagIds = await poster.related('tags').pluck('id');

            // remove all tags that aren't selected anymore
            let toRemove = existingTagIds.filter( id => tagIds.includes(id) === false);
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
    const poster = await Poster.where({
        'id': req.params.poster_id
    }).fetch({
        require: true
    });

    res.render('posters/delete', {
        'poster': poster.toJSON()
    })
})

router.post('/:poster_id/delete', async (req, res) => {
    const poster = await Poster.where({
        'id': req.params.poster_id
    }).fetch({
        require: true
    });
    await poster.destroy();
    res.redirect('/posters')
})

module.exports = router;