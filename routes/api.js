/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const fetch = require('node-fetch');
var mongo = require('mongodb').MongoClient;
const mongoose = require('mongoose');
// Stock api
const STOCK_API = process.env.STOCK_API;
// Connect to mongoDB
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
// Make schemas
const stockSchema = {
  stock: {
    type: String,
    unique: true,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Number,
    default: 0
  },
  liked_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  }]
};
const userSchema = {
  user_ip: {
    type: String,
    unique: true
  },
  liked_stocks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stocks'
  }],
  last_accessed: {
    type: Date,
    default: Date.now
  }
}
// Make models
const Stock = new mongoose.model('Stock', stockSchema);
const User = new mongoose.model('User', userSchema);

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      // Set variables
      let ip = req.ip;
      let uri;
      let liked = req.query.like;
      // Check to see if more than one stock is submitted
      if(typeof req.query.stock === "string") {
        uri = `${process.env.STOCK_API}${req.query.stock}`;
      } else if(Array.isArray(req.query.stock)){
        uri = `${process.env.STOCK_API}${req.query.stock[0]}`;
        for(let i = 1; i < req.query.stock.length; i++) {
          uri += `,${req.query.stock[i]}`;
        };
      }      
      // Make sure they have added a stock to check
      if(!uri)
        return res.json({error: "You didn't specify a stock to check"});
      // Fetch the data from the API
      fetch(uri)
      .then(reply => reply.json())
      .then(returnData => {
        // Make sure it exists
        if(!returnData[0])
          return res.json({error: `Error: ${req.query.stock.join(' ')} is not a recognised stock symbol.`});
        // Find stock document query function - This will return a mongoose query
        const findStock = (stockSymbol) => Stock.findOne({stock: stockSymbol.toLowerCase()}, {__v: 0});
        // Find user document query function - same as above
        const findUser = (userIp) => User.findOne({user_ip: userIp});
        // function to get a stock document if it exists
        const getStock = async (stock) => await findStock(stock).exec();
        // function to get user if they exist
        const getUser = async (user) => await findUser(user).exec();
        // Fucntion to create stock object
        const createStock = (stock) => {
          let newStock = new Stock({
            stock: stock.symbol.toLowerCase(),
            price: parseFloat(stock.price)
          });
          return newStock;
        }
        // Function to create user object
        const createUser = (ip) => {
          let newUser = new User({
            user_ip: ip
          });
          return newUser;
        }
        // Like handler
        const likeHandler = (user, stock) => {
          if(!user.liked_stocks.includes(stock._id)) {
            ++stock.likes;
            stock.last_updated = new Date();
            stock.liked_by.push(user);
            stock.save();
            user.liked_stocks.push(stock);
            user.save();
          } else {
            stock.last_updated = new Date();
            stock.save();
          }
        }
        // Function to handle DB logic and update
        const dataHandler = async () => {
          // Make empty variable to push to
          let temp = [];
          // Try get a user and stock object from the DB. If neither exists create them. Update both accordingly and validate.
          try {
            // Get a user object
            let user = await getUser(ip);
            // If it is null, create it
            if(!user){
              user = await createUser(ip);
            }
            // Cycle returned stock objects
            for(const stock of returnData) {
              // populate a variable with the return of mongodb
              let doc = await getStock(stock.symbol);
              // Check if it is null
              if(!doc){
                // If so create a new stock object
                let newStock = await createStock(stock);
                // See if the user liked the stock
                if (liked) {
                  await likeHandler(user,newStock);
                  // Turn the doc to a proper object
                  let returnObj = newStock.toObject();
                  // Delete undesired fields
                  delete returnObj.liked_by;
                  delete returnObj._id;
                  temp.push(returnObj);
                } else {
                  // Save the stock;
                  newStock.save();
                  // Turn the doc to a proper object
                  let returnObj = newStock.toObject();
                  // Delete undesired fields
                  delete returnObj.liked_by;
                  delete returnObj._id;
                  temp.push(returnObj);
                }
              // if it already exists
              } else {
                // Update it
                doc.price = stock.price;
                // See if the user liked the stock
                if (liked) {
                  await likeHandler(user,doc);
                  // Turn the doc to a proper object
                  let returnObj = doc.toObject();
                  // Delete undesired fields
                  delete returnObj.liked_by;
                  delete returnObj._id;
                  // Push it to the array.
                  temp.push(returnObj);
                } else {
                  doc.last_updated = new Date();
                  doc.save();
                  // Turn the doc to a proper object
                  let returnObj = doc.toObject();
                  // Delete undesired fields
                  delete returnObj.liked_by;
                  delete returnObj._id;
                  // Push it to the array.
                  temp.push(returnObj);
                }
              }
            }
          // Catch any errors
          } catch (err) {
            // Need to fill.
            console.log(err);
          }
          // Check to see whether more than one stock returned & show relative likes if so.
          if(temp.length === 2) {
            let a = temp[0].likes, b = temp[1].likes;
            if(a > b){
              delete temp[0].likes;
              temp[0].rel_likes = a - b;
              delete temp[1].likes;
              temp[1].rel_likes = `-${a - b}`;
            } 
            if(a < b){
              delete temp[0].likes;
              temp[0].rel_likes = `-${b - a}`;
              delete temp[1].likes;
              temp[1].rel_likes = b - a;              
            }
          }
          // Return a JSON object if no problems.
          return res.json({ stockData: temp });
        }
        // Execute the data handler
        dataHandler();
      })
      .catch(err => console.log(err));
    });
};
