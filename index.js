const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
let mongoose = require('mongoose');
const shortId = require('shortid')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
         console.log('Database connection successful')
       })
       .catch(err => {
         console.error('Database connection error')
       });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({extended: false}))

//Create userSchema and Model
let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  _id: {
    type: String,
    required: true
  },
  log: []
})

let USER = new mongoose.model("USER", userSchema);


app.post("/api/users", async (req,res) => {
  try {
    let findOne = await USER.findOne({username: req.body.username})
    if(findOne){
      res.json({
        username: findOne.username,
        _id: findOne._id
      })
    }
    else {
      findOne = new USER({username: req.body.username, _id: shortId.generate()})
      await findOne.save()
      res.json({
        username: findOne.username,
        _id: findOne._id
      })
    }
  } catch(err) {
    console.error(err);
    res.status(500).json({error: "Server error..."})
  }
})

app.post("/api/users/:_id/exercises", async (req,res) => {
  try {
    let findById = await USER.findOne({_id: req.params._id})
    let date = new Date(req.body.date).toDateString()
    if(!req.body.date) date = new Date().toDateString()
    findById.log.push({description: req.body.description, duration: Number(req.body.duration), date: date})
    await findById.save()
    res.json({
      _id: findById._id,
      username: findById.username,
      date: date,
      duration: Number(req.body.duration),
      description: req.body.description
    })
  } catch(err) {
    console.error(err);
    res.status(500).json({error: "Server error..."})
  }
})

app.get("/api/users", async (req,res) => {
  try {
    let findAll = USER.find({}, (err, data) => {
      if(err) console.error(err);
      res.json(data)
    })
  } catch(err) {
    console.error(err);
    res.status(500).json({error: "Server error..."})
  }
})

app.get("/api/users/:_id/logs?", async (req,res) => {
  try {
    let showLogs = await USER.findOne({_id: req.params._id})
    if(showLogs) {
      let fromTime = new Date(-8640000000000000), toTime = new Date(8640000000000000);
      if(req.query.from) {
        fromTime = new Date(req.query.from).getTime()
      }
      if(req.query.to){
        toTime = new Date(req.query.to).getTime()    
      } 
      res.json({
        _id: showLogs._id,
        username: showLogs.username,
        count: showLogs.log.slice(0,req.query.limit).length,
        log: showLogs.log.map(item => item).filter(item => new Date(item.date).getTime() >= fromTime && new Date(item.date).getTime() <= toTime).slice(0,req.query.limit)
        
      })  
    } 
    else {
      res.json({error: "Invalid _id"})
    }   
  } catch(err) {
    console.error(err);
    res.status(500).json({error: "Server error..."})
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
