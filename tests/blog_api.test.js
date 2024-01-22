const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const bcrypt = require('bcrypt')

const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
    // const blogObject = helper.initialBlogs
    //     .map(blog => new Blog(blog))
    // const promisesArray = blogObject
    //     .map(blog => blog.save())
    // await Promise.all(promisesArray)
})

describe('when there are some blogs initially saved', () => {
    test('blogs have a unique property named id', async () => {
        const response = await api.get('/api/blogs')
        response.body.map(b => expect(b.id).toBeDefined())
    })

    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs')

        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })
})

describe('addition of a blog', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordhash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', name: 'root', passwordhash })
        await user.save()
    })

    test('succeeds with valid data', async () => {
        const newBlog = {
            title: "Garen",
            author: "Riot Games",
            url: "https://www.leagueoflegends.com/en-us/champions/garen/",
            likes: 999999999,
            __v: 0
        }

        const user = await User.findOne({})

        const authResponse = await api
            .post('/api/login')
            .send({
                username: user.username,
                password: 'sekret'
            })

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${authResponse.body.token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const titles = blogsAtEnd.map(b => b.title)
        expect(titles).toContain(newBlog.title)
    })

    test('with missing likes property will defaults it to 0', async () => {
        const newBlog = {
            title: "Darius",
            author: "Riot Games",
            url: "https://www.leagueoflegends.com/en-us/champions/darius/",
            __v: 0
        }

        const user = await User.findOne({})

        const authResponse = await api
            .post('/api/login')
            .send({
                username: user.username,
                password: 'sekret'
            })

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${authResponse.body.token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const addedBlog = blogsAtEnd.find(b => b.title === newBlog.title)
        expect(addedBlog.likes).toBe(0)
    })


    test('without title fails', async () => {
        const newBlog = {
            author: "Riot Games",
            url: "https://www.leagueoflegends.com/en-us/champions/vayne/",
            likes: -999999999,
            __v: 0
        }

        const user = await User.findOne({})
        
        const authResponse = await api
            .post('/api/login')
            .send({
                username: user.username,
                password: 'sekret'
            })

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${authResponse.body.token}`)
            .send(newBlog)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })

    test('without url fails', async () => {
        const newBlog = {
            title: "Vayne",
            author: "Riot Games",
            likes: -999999999,
            __v: 0
        }

        const user = await User.findOne({})
        
        const authResponse = await api
            .post('/api/login')
            .send({
                username: user.username,
                password: 'sekret'
            })

        await api
            .post('/api/blogs')
            .set('Authorization', `Bearer ${authResponse.body.token}`)
            .send(newBlog)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })

    test('fails if no token is provided', async () => {
        const newBlog = {
            title: "Vayne",
            author: "Riot Games",
            likes: -999999999,
            __v: 0
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
})

describe('deletion of a note', () => {
    test('succeeds with status code 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

        const titles = blogsAtEnd.map(b => b.title)
        expect(titles).not.toContain(blogToDelete.title)
    })
})

describe('updating a blog', () => {
    test('succeeds with valid data', async () => {
        const blogsAtStart = helper.initialBlogs
        const blogToUpdate = {
            ...blogsAtStart[0],
            likes: 999999
        }

        await api
            .put(`/api/blogs/${blogToUpdate._id}`)
            .send(blogToUpdate)
            .expect(200)

        const blogsAtEnd = await helper.blogsInDb()
        const likes = blogsAtEnd.map(b => b.likes)

        expect(likes).toContain(blogToUpdate.likes)
    })

    test('fails with invalid data', async () => {
        const blogToUpdate = helper.notExistingBlog

        await api
            .put(`/api/blogs/${blogToUpdate._id}`)
            .send(blogToUpdate)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()
        const likes = blogsAtEnd.map(b => b.likes)

        expect(likes).toContain(blogToUpdate.likes)
    })
})

afterAll(async () => {
    await mongoose.connection.close()
})