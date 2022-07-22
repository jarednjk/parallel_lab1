const bookshelf = require("../bookshelf");

// a bookshelf model represents one table

// the name of the model (t)
const Poster = bookshelf.model('Poster', {
    tableName: 'posters'
})

module.exports = { Poster };