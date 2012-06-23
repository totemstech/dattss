```
 var dt = require('dattss').init('post');

 //...

 dt.agg('post', '1c',  true);
```

- receive counter, push them to redis
- clean up redis

==> agg 1c, ...
~ pick up redis db and add data


<== pubsub counters
==> plot: 10m today and historic aggregate -> 240
==> counters: aggregate, average,  
==> gauge: average, last
==> latencies: average, max, min, distribution

type: COUNTER
'name:live|past:max|min|avg|val' -> 1: x, 2: y, ..., 240: x 

type: TIMES 
'name:live|past:max|min|avg|dst'
