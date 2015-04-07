var http      = require('http');
var httpProxy = require('http-proxy');
var exec = require('child_process').exec;
var request = require("request");
var redis = require("redis")

var GREEN = 'http://127.0.0.1:5060';
var BLUE  = 'http://127.0.0.1:9090';

var blue = redis.createClient(6379, '127.0.0.1', {}) 
var green = redis.createClient(6380, '127.0.0.1', {})

var flag = process.argv.slice(2)[0];

var TARGET = BLUE;

var infrastructure =
{
  setup: function()
  {
    // Proxy.
    var options = {};
    var proxy   = httpProxy.createProxyServer(options);

    var server  = http.createServer(function(req, res)
    {
      console.log(req.url);
      if (req.url == '/switch')
      {
        if (TARGET == BLUE)
        {
          TARGET = GREEN;
          console.log(TARGET);
          blue.lrange("images",0,-1,function(err,value)
          {
            value.forEach(function(data)
            {
              green.lpush("images",data);
            });
          });
        }
        else
        {
          TARGET = BLUE;
          console.log(TARGET);
          green.lrange("images",0,-1,function(err,value)
          {
            value.forEach(function(data)
            {
              blue.lpush("images",data);
            });
          });
        }
        res.statusCode=200;
        // res.write("Switched!");
        res.end();
      }
      else{
              if(flag == 1)
              {
                if(req.url == '/upload')
                {
                    var route = '';
                    if(TARGET == BLUE)
                    {
                      route = GREEN
                    }
                    else
                    {
                      route = BLUE
                    }
                    req.pipe(request.post(route+'/upload'));
                    proxy.web( req, res, {target: TARGET } );
                  }
              }
              else
              {
                proxy.web( req, res, {target: TARGET } );
              }
      }
    });
    server.listen(8080);

    // Launch green slice
    exec('forever -w --watchDirectory=/home/ha/Deployment/deploy/blue-www start deploy/blue-www/blue_server.js 9090');
    console.log("blue slice");

    // Launch blue slice
    exec('forever -w --watchDirectory=/home/ha/Deployment/deploy/green-www start deploy/green-www/green_server.js 5060');
    console.log("green slice");

//setTimeout
//var options = 
//{
//  url: "http://localhost:8080",
//};
//request(options, function (error, res, body) {

  },

  teardown: function()
  {
    exec('forever stopall', function()
    {
      console.log("infrastructure shutdown");
      process.exit();
    });
  },
}

infrastructure.setup();

// Make sure to clean up.
process.on('exit', function(){infrastructure.teardown();} );
process.on('SIGINT', function(){infrastructure.teardown();} );
process.on('uncaughtException', function(err){
  console.log(err);
  infrastructure.teardown();} );