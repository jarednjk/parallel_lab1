const bookshelf = require("../bookshelf");

// a bookshelf model represents one table

// the name of the model (t)
const Poster = bookshelf.model('Poster', {
    tableName: 'posters',
    category() {
        return this.belongsTo('Category')
    },
    tags() {
        return this.belongsToMany('Tag');
    }
})

const Category = bookshelf.model('Category', {
    tableName: 'categories',
    posters() {
        return this.hasMany('Poster')
    }
})

const Tag = bookshelf.model('Tag', {
    tableName: 'tags',
    posters() {
        return this.belongsToMany('Poster')
    }
})

module.exports = { Poster, Category, Tag };