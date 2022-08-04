const express = require('express');
const router = express.Router();
const posterDataLayer = require('../../dal/posters');
const { Poster } = require('../../models');
const { createPosterForm } = require('../../forms');


router.get('/', async (req, res) => {
    res.send(await posterDataLayer.getAllPosters())
})

router.post('/', async (req, res) => {
    const allCategories = await posterDataLayer.getAllCategories();
    const allTags = await posterDataLayer.getAllTags();
    const posterForm = createPosterForm(allCategories, allTags);

    posterForm.handle(req, {
        'success': async (form) => {
            let { tags, ...posterData} = form.data;
            const poster = new Poster(posterData);
            await poster.save();

            if (tags) {
                await poster.tags().attach(tags.split(","));
            }
            res.send(poster);
        },
        'error': async (form) => {
            let errors = {};
            for (let key in form.fields) {
                if (form.fields[key].error) {
                    errors[key] = form.fields[key].error;
                }
            }
            res.send(JSON.stringify(errors));
        }
    })
})


module.exports = router;