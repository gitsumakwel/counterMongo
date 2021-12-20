const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const validator = require('validator')
const bodyParser = require('body-parser')
//const { format, parseISO } = require('date-fns')
const { connector } = require('./src/database')
const { decode } = require('./src/obfs')
const fsLibrary  = require('fs')
const { randomkey } = require('./src/randomkey')

const {
  //check for keys in an object
  //return null for non keys or obj
  objOrNull,

  //{date:date} | {to:date, from:date}
  //result: {date: {$gte:fromDate, $lte:toDate}} | {date: date}
  criteriaDate,

  //_from => date | undefined
  //_to => date | undefined
  //{_from,_to}
  //result: {$gte:fromDate, $lte:toDate}
  toFromDate,

  //sort => {field:1|-1}, {field:'asc'|'desc'}, {field:'ascending'|'descending'}
  //limit => Number
  //skip => Number
  //{sort,limit,skip}
  queryOptions,

  //only use for multiple find and delete
  //"string"
  //result: /string/g
  regex,
  //incase sensitive
  //result: /string/gi
  regexi,
} = require('./src/model/mongtools')

let storedData = {}
let storedPage = 0
let storedCategory = []

//a class with mongoose functionality to create, to query, and to remove
//need to pass a mongoose model
const { Query } = require('./src/model/generic')
//{title,desc,summary,content,author,thumb,like,dislike,lastupdate,created}
const { Blogs } = require('./src/model/blogs')
//{blog,name,email,message,lastupdate,created}
const { Comments } = require('./src/model/comments')
//{title,desc,url,thumb,lastupdate,created}
const { Works } = require('./src/model/works')
//{title,desc,summary,thumb,url,lastupdate,created}
const { Projects } = require('./src/model/projects')
//{wpid,context}
const { Categories } = require('./src/model/categories')
//{name,email,message}
const { Messages } = require('./src/model/messages')

//use for testing
const populateDB = async() => {
  Categories.collection.drop();
  Comments.collection.drop();
  Works.collection.drop();
  Blogs.collection.drop();
  Projects.collection.drop();
  const category = ['html5','css3','javascript','jquery','Google Cloud','ReactJS','NodeJs','AWS','firebase','express']
  const MAX = 6
  //Work
  const queryCategory = new Query(Categories);
  const queryWork = new Query(Works);
  //{title,desc,summary,url,thumb,lastupdate,created}
  for (let i=1;i<=Math.floor(MAX/3);i++) {
    let work;
    work = await queryWork.createsave({title:'google '+i,desc:'googlewebpage '+i,summary:'summary for google web '+i,thumb:'imagegoogle'+i+'.jpg',url:'https://www.google.com'})
      await queryCategory.createsave({wpid:work.id,context:'html5'})
      await queryCategory.createsave({wpid:work.id,context:'css3'})
      await queryCategory.createsave({wpid:work.id,context:'javascript'})
      await queryCategory.createsave({wpid:work.id,context:'jquery'})
      await queryCategory.createsave({wpid:work.id,context:'Google Cloud'})
    work = await queryWork.createsave({title:'youtube '+i,desc:'youtubewebpage '+i,summary:'summary for youtube web '+i,thumb:'imageyoutube'+i+'.jpg',url:'https://www.youtube.com'})
      await queryCategory.createsave({wpid:work.id,context:'html5'})
      await queryCategory.createsave({wpid:work.id,context:'css3'})
      await queryCategory.createsave({wpid:work.id,context:'javascript'})
      await queryCategory.createsave({wpid:work.id,context:'jquery'})
      await queryCategory.createsave({wpid:work.id,context:'Google Cloud'})
      await queryCategory.createsave({wpid:work.id,context:'firebase'})
    work = await queryWork.createsave({title:'facebook '+i,desc:'facebookwebpage '+i,summary:'summary for facebook web '+i,thumb:'imagefacebook'+i+'.jpg',url:'https://www.facebook.com'})
      await queryCategory.createsave({wpid:work.id,context:'html5'})
      await queryCategory.createsave({wpid:work.id,context:'css3'})
      await queryCategory.createsave({wpid:work.id,context:'javascript'})
      await queryCategory.createsave({wpid:work.id,context:'jquery'})
      await queryCategory.createsave({wpid:work.id,context:'ReactJs'})
      await queryCategory.createsave({wpid:work.id,context:'Redux'})
  }
  //Blog
  const queryBlog = new Query(Blogs);
  //{title,desc,summary,content,author,thumb,like,dislike,lastupdate,created}
  const newblog = [];
  for (let i=0;i<MAX;i++)  {
    const blog = await queryBlog.createsave({title:'sample blog '+i,desc:'description for blog '+i,summary:'summary for blog '+i,content:'content sample blog '+i,author:'brill',thumb:'image'+i+'.jpg'})
    const number = Math.floor(Math.random()*(4))+1;
    for (let ind=0;ind<number;ind++) {
      const item = category[ Math.floor(Math.random()*(category.length-1))+1 ];
      const found = await queryCategory.findByCriteria({wpid:blog.id,context:item})
      if (found.length===0) {
        await queryCategory.createsave({wpid:blog.id,context:item})
      }else console.log('found:',blog.id,'item:',item )
    }
    newblog.push( blog )
  }

  //console.log(newblog[0]);
  //Comment
  const queryComment = new Query(Comments);
  //{blog,name,email,message,lastupdate,created}
    for (let i = 0;i<MAX;i++) {
      //randomkey true is alphanum; false is withcharacters
      const user = 'User.'+randomkey(8,true).join('')
      await queryComment.createsave({blog:newblog[i].id,name:user,email:user+'@mail.com',message:'hi test from '+user+' for blog '+newblog[i].id})
    }

  //Project
  const queryProject = new Query(Projects);
  //{title,desc,summary,thumb,url,lastupdate,created}
  for (let i=0;i<MAX;i++) {
    const project = await queryProject.createsave({title:'sample project '+i,desc:'description for project '+i,summary:'summary for project '+i,thumb:'image'+i+'.jpg',url:'https://project'+i+'url.com'})
    const number = Math.floor(Math.random()*category.length)+3;
    for (let ind=0;ind<number;ind++) {
      const item = category[ Math.floor(Math.random()*(category.length-1))+1 ];
      const found = await queryCategory.findByCriteria({wpid:project.id,context:item})
      if (found.length===0) {
        await queryCategory.createsave({wpid:project.id,context:item})
      }
    }
  }
}

//populateDB();

class Final extends Object{
  constructor(){
    super();
    this.result = undefined;
  }
}


//log all request
//request object, response object, next function
const posthandler = (req,res,next) => {
    //log the request
    console.log(`${req.method} ${req.path} - ${req.ip}`);
    // you need to declare, coz your server will get stuck
    next();
}
//report result (callback)
const done = (error,result) => {
    console.log(result);
}
const doneresult = (error, result) => {
  return result;
}

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(posthandler);

const index = (req, res) => {
  res.sendFile(__dirname + '/src/views/dummy/index.html')
}

const sendData = async (req,res) => {
  //req.body:
  // {serial:auth,type:encrypteddata}

  //req.query:
  //req.query.page
  const serial = req.body.serial;
  let type = req.body.type;
  type = await decode(type,serial);
  console.log(type)

  switch (type) {
    case 'home':
      res.json(JSON.parse(req.fdata));
      break;
    case 'blog':
      res.json(JSON.parse(req.fdata).blogs);
      break;
    case 'project':
      res.json(JSON.parse(req.fdata).projects);
      break;
    case 'work':
      res.json(JSON.parse(req.fdata).works);
      break;
    case 'category':
      res.json(req.fdata.category);
      break;
    default:
      res.json({ message:"server is busy at the moment" });
      break;
  }
}

//called from checkData
//if cache (storedData) data do not exist
//or storedPage is less than page requested
const fetchData = async (page) =>{
  const SKIP = 4;
  let fdata = {};
  //set options for find
  const options = queryOptions({created: "descending"},SKIP,SKIP * page)

  let query = new Query(Blogs);
    fdata.blogs = await query.findByOptions({},options);
  query = new Query(Works);
    fdata.works = await query.findByOptions({},options);
  query = new Query(Projects);
    fdata.projects = await query.findByOptions({},options);
  query = new Query(Comments);
    const comments = [];
    for (let i = 0; i < fdata.blogs.length; i++) {
      comments.push( {
        blog:fdata.blogs[i].id,
        comments: await query.findByCriteria({blog:fdata.blogs[i].id})});
    }
    fdata.comments = comments;

  //store in a variable for server use
  if (page === 0)storedData = JSON.stringify(Object.assign({},fdata))

  //should append if page is > storedPage
  else if (page > storedPage) {
    const xstoredData = Object.assign({},JSON.parse(storedData));
      xstoredData.blogs = [...xstoredData.blogs,...fdata.blogs]
      xstoredData.works = [...xstoredData.works,...fdata.works];
      xstoredData.projects = [...xstoredData.projects,...fdata.projects];
      xstoredData.comments = [...xstoredData.comments,...fdata.comments];
      storedData = JSON.stringify(xstoredData);
      storedPage = page;
  }

  //store in a file for reference in case of a problem

  await fsLibrary.writeFile(__dirname + '/data.txt', storedData, (error) => {
    // In case of a error throw err exception.
    if (error) throw err;
  })
  //read the file
  //await fsLibrary.readFile(__dirname + '/data.txt',callback)

  return storedData
}

//first action for '/api/page/latest'
const checkData = async (req,res,next) => {
  const page = Number.parseInt(req.query.page);
  if (objOrNull(storedData)===null || page > storedPage){
    req.fdata = await fetchData(page)
    next()
  } else {
    req.fdata = storedData
    next()
  }
}

const fetchCategory = async (id) => {
  let fdata = {}
  let query = new Query(Categories);
  let category = await query.findByCriteria({wpid:id});

  //no category for wpid
  if (category === []) return null

  category = await category.map(category => `${category.context}`)
  storedCategory.push({wpid:id, context:category})
  fdata.category = {wpid:id, context:category}
  return fdata
}

const checkCategory = async (req,res,next) => {
    //decode id from request query
    const id = await decode(req.query.context,req.body.serial)
    //check for cached categories
    if (storedCategory.length === 0) {
      //fetch if no cache category exists
      req.fdata = await fetchCategory(id)
    } else {
        //cache category exists: see if a category exists for a certain id
        let category = await storedCategory.filter(item => item.wpid===id);

        //id is in the cache category
        if (category.length > 0) {
          req.fdata = {category: category[0]}
        } else {
          //id is not yet fetched
          //fetch the category for the id
          req.fdata = await fetchCategory(id)
        }
    }
      next() // will move to sendData
}

const sendMessage = async (req,res) => {
  const query = new Query(Messages);
  const serial = req.body.serial;
  const name = await decode(req.body.name,serial);
  const email = await decode(req.body.email,serial);
  const message = await decode(req.body.message,serial);
  const result = await query.createsave({name:name,email:email,message:message});
  console.log('received message')
  res.json({status:await objOrNull(result)!==null?'success':'error'})
}

app.route('/api/page/latest').post(checkData).post(sendData);
app.route('/api/page/category').post(checkCategory).post(sendData);
app.route('/api/message').post(sendMessage);
app.route('*').get(index).post(index);

const listener = app.listen(process.env.PORT || 5000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
