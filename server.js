const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const validator = require('validator')
const bodyParser = require('body-parser')
//const { format, parseISO } = require('date-fns')
const { connector } = require('./src/database')


//a class with mongoose functionality to create, to query, and to remove
//need to pass a mongoose model
const { Query } = require('./src/model/generic')
const { Counter } = require('./src/model/counter')
const { objOrNull,cirteriaDate,toFromDate,queryOptions,regex } = require('./src/model/mongtools')

//log all request
//request object, response object, next function
const posthandler = (req,res,next) => {
    //log the request
    console.log(`${req.method} ${req.path} - ${req.ip}`);
    // you need to declare, coz your server will get stuck
    next();
}
//status 404
const index = (req, res) => {
  res.json({counter:0})
}

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(posthandler);


//will get the count from the db
const checkData = async (req,res,next) => {
  //attach functions of generic to our MongoDB Model
  const modelcounter = new Query(Counter);
  //get the counter document from db
  const counter = await modelcounter.findByOptions({value:regex('\\d')},queryOptions("descending",1,0))
  //for debug
  /*console.log(counter)*/
  //default count to zero
  req.count = 0;
  //check if we got something from our query
  if (counter.length > 0 ){
    //check what we got
    //is this a Number
    const count = counter[0].count

    if (!isNaN(count)) {
      req.count = count
      req.id = counter[0].id
    }
  } else {
    await modelcounter.createsave({count:0})
  }

  next()
}

//will return the count
const sendData = (req,res)=>{
  res.json({count:req.count});
}

const addCount = async (req,res,next) => {
    const modelcounter = new Query(Counter);
    //validate params
    let count = 0;
    //get 'add' 'sub' or 'reset'
    const addsub = req.params.add
    // will validate if our param is 'add' 'sub' or 'reset'
    const isValidOperator = validator.matches(addsub,new RegExp('(add|sub|reset)','i'))
    if (isValidOperator) {
      let value = req.count
      //logic whether we will add subtract or reset
      if (addsub==='add') value+=1
      else if (addsub==='sub') value-=1
      else value = 0

      const condition = {id: req.id}
      const update = {count: value}
      //update our db
      const changes = await modelcounter.findOneAndUpdate(condition, update)
      //check whether we actually updated
      if (objOrNull(changes)){
        req.count = value
        next() //move on
      }
    }else res.json({counter:0}) //zero will be given to non valid request
}


app.route('/api/counter/latest').get(checkData).get(sendData);
app.route('/api/counter/:add').get(checkData).get(addCount).get(sendData);
app.route('*').get(index).post(index);

const listener = app.listen(process.env.PORT || 5000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
