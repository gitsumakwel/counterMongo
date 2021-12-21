let mongoose = require('mongoose');

const obj = new mongoose.Schema({
  //_id: { type:mongoose.Schema.Types.ObjectId, default:new ObjectId() },
});

const Obj = mongoose.model("obj",obj);


class Query extends Object {
  constructor(model = Obj){
    super()
    this.model = model
  }

  createsave = async (data)=> await this.model.create(data)
  //id
  findById = async (id) => await this.model.findOne({ _id:id }).exec()
  //criteria => {field:value}
  findByCriteria = async (criteria) => await this.model.find(criteria).exec()
  //sort => {field:1|-1}, {field:'asc'|'desc'}, {field:'ascending'|'descending'}
  //limit => Number
  //skip => Number
  //{sort,limit,skip}
  findByOptions = async (criteria, options) => await this.model.find(criteria,null,options).exec()
  findOneAndUpdate = async (criteria,update) => await this.model.findOneAndUpdate(criteria,update).exec()
  findAll = async () => await this.model.find({}).exec();
  //id
  deleteById = async (id) => await this.model.findOneAndRemove({ _id:id }).exec()
  //criteria => {field:value}
  deleteByCriteria = async criteria => await this.model.deleteMany(criteria).exec()
  deleteAll = async (done) => await this.model.collection.drop(done)
}


module.exports = {Query};
