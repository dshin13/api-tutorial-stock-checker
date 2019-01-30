/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

var mongoose = require('mongoose');

const CONNECTION_STRING = process.env.DB;

var db = mongoose.connect(CONNECTION_STRING, (err)=>{
  if(err) console.log("Database error: "+ err)
  else console.log("Database connection established")
});

var stockLikesSchema = new mongoose.Schema({
  stock: String,
  likes: {type:Number, default: 0},
  ip: {type: [String], default: []}
}, {versionKey: false});

var StockLikes = mongoose.model('stockLikes', stockLikesSchema);

var stockHandler = require('../controllers/stockHandler.js')(StockLikes);


module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(stockHandler);

};
