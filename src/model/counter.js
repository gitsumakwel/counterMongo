let mongoose = require('mongoose');

const counter = new mongoose.Schema({
  count: {type:Number, default:0},
  created: { type:Date, default:Date.now }
});

const Counter = mongoose.model("counter",counter);

module.exports = {Counter};
