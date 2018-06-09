'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/blog-posts';
exports.PORT = process.env.PORT || 8080;