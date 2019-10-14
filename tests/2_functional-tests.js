/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          assert.isDefined(res.body.stockData[0].price);
          assert.isDefined(res.body.stockData[0].likes);
          assert.isDefined(res.body.stockData[0].last_updated);
          done();
        });
      });
      
      test('1 stock with like', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .end(function(err, res){
          assert.isDefined(res.body.stockData[0].price);
          assert.isDefined(res.body.stockData[0].likes);
          assert.isDefined(res.body.stockData[0].last_updated);
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog', like: true})
        .end(function(err, res){
          assert.isDefined(res.body.stockData[0].price);
          assert.isDefined(res.body.stockData[0].likes);
          assert.isDefined(res.body.stockData[0].last_updated);
          done();
        });
      });
      
      
      test('2 stocks', function(done) {
       chai.request(server)
        .get('/api/stock-prices?stock=goog&stock=fb')
        .end(function(err, res){
          assert.isDefined(res.body.stockData[0].price);
          assert.isDefined(res.body.stockData[0].last_updated);
          assert.isDefined(res.body.stockData[1].price);
          assert.isDefined(res.body.stockData[1].last_updated);
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
       chai.request(server)
        .get('/api/stock-prices?stock=goog&stock=fb')
        .end(function(err, res){
          assert.isDefined(res.body.stockData[0].price);
          assert.isDefined(res.body.stockData[0].last_updated);
          assert.isDefined(res.body.stockData[1].price);
          assert.isDefined(res.body.stockData[1].last_updated);
          done();
        });
      });
      
    });

});
