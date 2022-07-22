const knex = require('knex')({
    client: 'mysql',
    connection: {
        user: 'foo',
        password: 'bar',
        database: 'posters'
    }
})

const bookshelf = require('bookshelf')(knex);

module.exports = bookshelf;