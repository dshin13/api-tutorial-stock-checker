'use strict';
var request = require('request');

function findStockPrice(doc, cb){
  request('https://api.iextrading.com/1.0/stock/' + doc.stock + '/price', (err, res, price) =>{
    if(err) return cb(err, null)
    else {
      doc['price'] = price;
      return cb(null, doc);
    }
  })
}

function findStockLikes(StockLikes, stock, like, ip, cb){
    StockLikes.findOne({stock: stock},
                       (err, doc) => {
      if(err)
        return cb(err, null);
      
      // if no entry exists, create a new entry
      if(doc == null) {
        doc = {stock,
               likes: like?1:0
              }
        if(like) doc.ip = [ip];
      }
      
      // if entry exists, only increment when liked and not previously liked from the same ip
      else {
        if(like && doc.ip.every(x=> x!=ip)) {
            doc.likes++;
            doc.ip.push(ip);
        }
      }
      
      var newStockLikes = new StockLikes(doc);
      
      newStockLikes.save((err, savedDoc)=>{
        return cb(err, savedDoc);
      })
    })
};


module.exports = function(StockLikes) {
  
  return function(req, res){
    var query = req.query;
    
    if (req.headers.hasOwnProperty('x-forwarded-for'))
      var clientIp = req.headers['x-forwarded-for'].split(',')[0];
    else
      var clientIp = 'unknown';
    
    if(Array.isArray(query.stock)) {
      var i = query.stock.length;
      let stockData = [];
      while(i--){
        findStockLikes(StockLikes, query.stock[i], query.like, clientIp, (err, doc)=>{
          if(err)
            console.error('Error at findStockLikes')
          else {
            findStockPrice(doc, (err, newDoc)=>{
              if(err)
                console.log('Error at findStockPrice');
              stockData.push({stock: newDoc.stock, price: newDoc.price, likes: newDoc.likes});
              if (stockData.length == query.stock.length){
                stockData[0].rel_likes = stockData[0].likes - stockData[1].likes;
                stockData[1].rel_likes = stockData[1].likes - stockData[0].likes;
                stockData = stockData.map(entry => {return {stock:entry.stock, price:entry.price, rel_likes:entry.rel_likes}})
                res.json({stockData: stockData});
              }
            })
          }
        });
      };
    }
    else
      findStockLikes(StockLikes, query.stock, query.like, clientIp, (err, doc)=>{
        if(err)
          console.error('Error at findStockLikes')
        else
          findStockPrice(doc, (err, newDoc)=>{
            if(err)
              console.error('Error at findStockPrice');
            res.json({stockData:{stock: newDoc.stock, price: newDoc.price, likes: newDoc.likes}});
          })
      });
  }
}