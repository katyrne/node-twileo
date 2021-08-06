var express = require('express');
var router = express.Router();
var csvtojson = require("csvtojson");
const reader = require('xlsx')
require('dotenv').config()
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
var app = express();

app.locals.myVar = 1;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('uploadcsv', {page:'uploadcsv',menuId:'contact',message:"",errMsg:"",percetage:"",errMsgLimit:"",Loader : false});
});

router.get('/about', function(req, res, next) {
  res.render('about', {page:'About Us', menuId:'about'});
});

router.get('/contact', function(req, res, next) {
  res.render('contact', {page:'Contact Us', menuId:'contact'});
});
router.get('/uploadfile',function(req, res, next) {
  res.render('uploadcsv', {page:'uploadcsv',menuId:'contact',message:"",errMsg:"",percetage:"",errMsgLimit:"",Loader : false});
})


router.post('/uploadfile',function(req, res, next) {
  
  var mainIndex = 0
  var arrayChunk=[];
  const getMachineAction = async () => {
  try {
    let data = []
    var message = ""
    const sheets = req.files
    if(sheets.files.name.split('.').pop() != 'csv'){
      var errMsg = "Upload csv file only";
      res.render('uploadcsv', {page:'uploadcsv',menuId:'contact',message,errMsgLimit:"",errMsg,Loader : false});
      return false;
    }

    for(let i = 0; i < sheets.length; i++)
    {
       const temp = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]])
      temp.forEach((res) => { data.push(res) })
    }
    let csvData = req.files.files.data.toString('utf8');
    
    csvtojson().fromString(csvData).then( async json => {
      //console.log("csvData--->",json)
      //json = json.filter(function (el) { return el != ""  });
      const result = json.map(data => data.phone)
      const body = process.env.MESSAGE;
      const numbers = result.filter(function (el) { return el != ""  });
      //const numbers = result;    

      const doChunk = (list, size) => list.reduce((r, v) =>
        (!r.length || r[r.length - 1].length === size ?
          r.push([v]) : r[r.length - 1].push(v)) && r
      , []);
    
      //console.log(doChunk(numbers, 5));
      arrayChunk =  doChunk(numbers, 5);
      
      var d = new Date();
      var n = d.getSeconds();
      console.log("secound----------->",n)

      await Promise.all(await arrayChunk[mainIndex].map( async (number,index) => {
        //console.log("number--->",number,mainIndex)
        const twileo_promise = await twilio.messages.create({
          to: 'whatsapp:+'+number,
          from: process.env.TWILIO_NUMBER,
          body: body
        });
       //console.log("twileo_promise------------->",twileo_promise)
        })).then(messages => {
        console.log('Messages sent!-->',messages);
        let timer = setTimeout(getMachineAction , 5000);
        mainIndex++
        if(mainIndex == arrayChunk.length){
            // console.log("arrayChunk-->",arrayChunk)
            clearTimeout(timer)    
            message = "Message sent successfully!";  
            res.render('uploadcsv', {page:'uploadcsv',menuId:'contact',message, errMsgLimit:"" ,errMsg:"",Loader : false});  
        }
      }).catch(err => { 

        let timer = setTimeout(getMachineAction , 5000);
        mainIndex++
        if(mainIndex == arrayChunk.length){
            clearTimeout(timer)    
        }
        console.log("error=====>",err) 
        if(err.code == 63018){
          res.render('uploadcsv', {page:'uploadcsv',menuId:'contact',message, errMsgLimit: "exceeded the 1rps rate limit", errMsg : "",Loader : false}); 
        }
      });
      
    })
      
  } catch (error) {
    console.log("error--->>",error)
  } finally {
       
  }
  

}
getMachineAction()
  //res.render('uploadcsv', {page:'uploadcsv',menuId:'contact',userdata:"daa"});

});

module.exports = router;
