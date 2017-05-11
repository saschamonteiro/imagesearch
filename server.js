var express = require('express')
var app = express()
var mongodb = require('mongodb')
var https = require('https')
var MongoClient = mongodb.MongoClient
var port = process.env.PORT || 8080
var mongodburl = process.env.MONGOLAB_URI
var collectionName = 'imagesearch'
var key = process.env.GOOGLE_API
var cx = process.env.GOOGLE_SE
var optionsget = {
    host : 'www.googleapis.com',
    port : 443,
    path : '/customsearch/v1?key='+ key +'&cx='+ cx,
    method : 'GET'
}
//https://www.googleapis.com/customsearch/v1?key=AIzaSyDEWyftPNTCNRD5J37zeTWnuRtGt-9ozWM&cx=005819915415754972069:kmyahl68k9k&q=funny%20cat
app.get('/api/imagesearch/:search', function(req, res1) {
    var offset = parseInt(req.query.offset, 10)
    var search = decodeURI(req.params.search)
    console.info('search', req.params.search)
    console.info('offset', offset)
    optionsget.path = optionsget.path + '&q=' + encodeURI(req.params.search)
    if(!isNaN(offset) && typeof offset == 'number') {
         optionsget.path = optionsget.path + '&start=' + offset
    }
    MongoClient.connect(mongodburl, function(err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server [' + mongodburl + ']. Error:', err)
    }
    else {
        var collection = db.collection(collectionName)
        collection.insert({
                term: search,
                when: new Date()
              }, function(err, records) {
                if (err) {
                  console.log('error', err)
                }
            
            db.close()
          })
    }})
    console.info('options', optionsget)
    var buf = '';
    var reqGet = https.request(optionsget, function(res) {
        res.on('data', function(d) {
            buf += d
        });
        res.on('end', function (err) {
            if(err){
                console.log('error', err)
            }else{
                console.log('buf', buf)
                var ret = JSON.parse(buf)
                var items = ret.items
                var returnObject = []
                items.forEach(function(data, idx){
                    var item = {
                        url: data.pagemap.imageobject ? data.pagemap.imageobject[0].url : data.pagemap.cse_thumbnail[0].src,
                        snippet: data.snippet,
                        thumbnail: data.pagemap.cse_thumbnail[0].src,
                        context: data.link
                    }
                    console.info('item', item)
                    returnObject.push(item)
                })
                res1.send(returnObject)
            }
          });
    });
     
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
    
    
})

app.get('/api/latest/imagesearch', function(req, res1) {
    console.info('latest')
    MongoClient.connect(mongodburl, function(err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server [' + mongodburl + ']. Error:', err)
      }
      else {
        var collection = db.collection(collectionName)
        
        
        
        collection
            .find({}, {"_id": 0, "term": 1, "when": 1}, {'limit': 10})
            .sort({'when': -1})
            .toArray( function(err, d) {
              if (err) {
                console.log('error', err)
              }
              else {
                console.log('doc', d)
                res1.send(JSON.stringify(d))
              }
              db.close()
            })
      }
    })
})

app.listen(port, function() {
  console.log('Example app listening on port ' + port)
})