'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const expect = chai.expect;


const {
    BlogPost
} = require('../models');
const {
    app,
    runServer,
    closeServer
} = require('../server');
const {
    DATABASE_URL
} = require('../config');

chai.use(chaiHttp);

function seedBlogPostData() {
    console.log('seeding blog post data');
    const seedData = [];

    for (let i = 1; i <= 10; i++) {
        seedData.push(generateBlogPostData());
    }
    return BlogPost.insertMany(seedData);
}

function generateBlogPostData() {
    return {
        title: faker.lorem.word(),
        content: faker.lorem.paragraph(),
        author: faker.fake("{{name.firstName}} {{name.lastName}}")
    }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}


//tests
describe('Blog Posts API resource', function () {

    before(function () {
        return runServer(DATABASE_URL);
    });

    beforeEach(function () {
        return seedBlogPostData();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });


    describe('GET endpoint', function () {

        it('should return all existing blog posts', function () {
            let res;
            return chai.request(app)
                .get('/posts')
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res.body.posts).to.have.lengthOf.at.least(1);
                    return BlogPost.count();
                })
                .then(function (count) {
                    expect(res.body.posts).to.have.lengthOf(count);
                });
        });

        it('should return blog posts with right fields', function () {
            let resPost;
            return chai.request(app)
                .get('/posts')
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body.posts).to.be.a('array');
                    expect(res.body.posts).to.have.lengthOf.at.least(1);

                    res.body.posts.forEach(function (post) {
                        expect(post).to.be.a('object');
                        expect(post).to.include.keys('title', 'content', 'author');
                    });

                    resPost = res.body.posts[0];
                    return BlogPost.findById(resPost.id); //seeing if resPost is in DB
                })
                .then(function (post) {
                    expect(resPost.id).to.equal(post.id);
                    expect(resPost.title).to.equal(post.title);
                    expect(resPost.content).to.equal(post.content);
                    expect(resPost.author).to.equal(post.author);
                });
        });
    });

    describe('POST endpoint', function () {

        it('should add a new blog post', function () {

            const newPost = generateBlogPostData();

            return chai.request(app)
                .post('/posts')
                .send(newPost)
                .then(function (res) {
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys('title', 'author', 'content');
                    expect(res.body.author).to.equal(newPost.author);
                    expect(res.body.title).to.equal(newPost.title);
                    expect(res.body.content).to.equal(newPost.content);
                    expect(res.body.id).to.not.be.null;

                    return BlogPost.findById(res.body.id);
                })
                .then(function (post) {
                    expect(post.title).to.equal(newPost.title);
                    expect(post.author).to.equal(newPost.author);
                    expect(post.content).to.equal(newPost.content);
                });
        });
    });

    describe('PUT endpoint', function () {
        it('should update fields you send over', function () {
            const updateData = {
                content: 'blah blah blah'
            };

            return BlogPost
                .findOne()
                .then(function (post) {
                    updateData.id = post.id;

                    return chai.request(app)
                        .put(`/posts/${post.id}`)
                        .send(updateData);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);

                    return BlogPost.findById(updateData.id);
                })
                .then(function (post) {
                    expect(post.content).to.equal(updateData.content);
                });
        });

        describe('DELETE endpoint', function () {
            it('should delete a blog post by id', function () {
                let post;

                return BlogPost
                    .findOne()
                    .then(function (_post) {
                        post = _post;
                        return chai.request(app).delete(`/posts/${post.id}`);
                    })
                    .then(function (res) {
                        expect(res).to.have.status(204);
                        return BlogPost.findById(post.id);
                    })
                    .then(function (_post) {
                        expect(_post).to.be.null;
                    });
            });
        });
    });







});