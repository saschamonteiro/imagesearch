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
    console.info('search', req.params.search)
    console.info('offset', offset)
    optionsget.path = optionsget.path + '&q=' + req.params.search
    if(typeof offset == 'number') {
         optionsget.path = optionsget.path + '&start=' + offset
    }
    console.info('options', optionsget)
    var buf = '';
    var reqGet = https.request(optionsget, function(res) {
        console.log("statusCode: ", res.statusCode);
        // uncomment it for header details
    //  console.log("headers: ", res.headers);
     
     
        res.on('data', function(d) {
            buf += d
        });
        res.on('end', function () {
            var ret = JSON.parse(buf)
            var items = ret.items
            var returnObject = []
            items.forEach(function(data, idx){
                var item = {
                    url: data.pagemap.imageobject[0].url,
                    snippet: data.snippet,
                    thumbnail: data.pagemap.cse_thumbnail[0].src,
                    context: data.link
                }
                console.info('item', item)
                returnObject.push(item)
            })
            console.log('BODY: ' + ret);
            console.log('BODY: ' + ret.items.length);
            res1.send(returnObject)
          });
    });
     
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
    
    
})

app.listen(port, function() {
  console.log('Example app listening on port ' + port)
})