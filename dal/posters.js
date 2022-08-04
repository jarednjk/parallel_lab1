const { Poster, Category, Tag } = require('../models');

const getAllCategories = async () => {
    return await Category.fetchAll().map((category) => {
        return [category.get('id'), category.get('name')];
    })
}

const getAllTags = async () => {
    return await Tag.fetchAll().map(tag => [tag.get('id'), tag.get('name')]);
}

const getPosterById = async (posterId) => {
    return await Poster.where({
        'id': parseInt(posterId)
    }).fetch({
        require: true,
        withRelated: ['tags', 'category']
    });
}

const getAllPosters = async () => {
    return await Poster.fetchAll();
}

module.exports = {
    getAllCategories, getAllTags, getPosterById, getAllPosters
}