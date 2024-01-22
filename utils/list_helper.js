const _ = require('lodash')

const array = require('lodash/array')
const object = require('lodash/object')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, item) => sum + item.likes
    return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    const favorite = blogs.reduce((favorite, current) =>
        favorite.likes > current.likes ? favorite : current, 0)

    return favorite
        ? {
            title: favorite.title,
            author: favorite.author,
            likes: favorite.likes
        }
        : favorite
}

const mostBlogs = (blogs) => {
    const blogsByAuthor = _.groupBy(blogs, 'author')

    const blogsCount = _.map(blogsByAuthor, (blogs, author) => ({ author, blogs: blogs.length }))

    const mostBlogs = _.maxBy(blogsCount, 'blogs')

    return mostBlogs ? mostBlogs : 0
}

const mostLikes = (blogs) => {
    const blogsByAuthor = _.groupBy(blogs, 'author')

    const likesCount = _.map(blogsByAuthor, (blogs, author) =>
    ({
        author,
        likes: _.sumBy(blogs, (b) => b.likes)
    }))

    const mostLikes = _.maxBy(likesCount, 'likes')

    return mostLikes ? mostLikes : 0
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}