const conn = require('./mysql');
const util = require('util');

const db = util.promisify(conn.query).bind(conn);

module.exports = db;