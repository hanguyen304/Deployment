# DevOps HW 4: Deployment

### Git/hook set up

Create Post-Receive Hook in blue and repeat for green
```
#!/bin/sh
GIT_WORK_TREE=/home/ha/Deployment/deploy/blue-www/ git checkout -f

```

### Create blue/green infrastructure

Clone the [app repo](https://github.com/CSC-DevOps/App), and set the following remotes.  S

    git remote add blue file:///home/ha/Deployment/deploy/blue.git
    git remote add green file:///home/ha/Deployment/deploy/green.git

Create `blue_server.js` in `blue-www` and `green_server.js` in `green-www` similar to HW3.
In `infrastructure.js` create redis client:
```
var redis = require("redis")

var GREEN = 'http://127.0.0.1:5060';
var BLUE  = 'http://127.0.0.1:9090';

var blue = redis.createClient(6379, '127.0.0.1', {}) 
var green = redis.createClient(6380, '127.0.0.1', {})
```
and launch blue and green:
```
// Launch green slice
    exec('forever -w --watchDirectory=/home/ha/Deployment/deploy/blue-www start deploy/blue-www/blue_server.js 9090');
    console.log("blue slice");

// Launch blue slice
    exec('forever -w --watchDirectory=/home/ha/Deployment/deploy/green-www start deploy/green-www/green_server.js 5060');
    console.log("green slice");
```

### Demonstrate `/switch` route and migration of data on switch
The traffic is default to BLUE (`var TARGET = BLUE;`), route `/switch` will trigger a switch from BLUE to GREEN and vice versa and also migrating data between the two instances.

### Demonstrate mirroring
Create a variable flag (`var flag = process.argv.slice(2)[0];`). When set to 1 (turn on mirroring) will forward information added to the picture list, to the other slice. 
