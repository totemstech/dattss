### DaTtSs: Realtime Server Statistics Aggregation as a Service

DaTtSs helps aggregating and displaying server-side statistics in realtime to better track
servers and infrastructure behaviours. It is inspired by the idea that 
"You Can't Fix what you Can' Track".

#### Features

- Counter, Timers, Gauges aggregation and display (val, 1mn mvg avg)
- Process statistics (uptime, mem, cpu, errors & warnings counts)
- Daily against Week plot of MIN, MAX, AVG, BOT10, TOP90, COUNT, SUM
- Errors and Warnings Streaming and reporting
- Alerts [Email, SMS, Phone] (Above/Below Limits, Stopped Working, Stopped Responding) 

#### Inspiration

DaTtSs is an acronym for `statsd`: the whole project is inpsired by the work proposed by 
Flickr (perl + RDDTool) [https://github.com/iamcal/Flickr-StatsD] and later on Etsy (nodeJS + Graphite) 
[https://github.com/etsy/statsd] 

see also: 
- http://code.flickr.com/blog/2008/10/27/counting-timing/
- http://codeascraft.etsy.com/2011/02/15/measure-anything-measure-everything/

#### Example Usage

```
 var dt = require('dattss').init('post');

 //...

 dt.agg('new', '1c',  true);
 dt.agg('merge', '2c');
 dt.agg('query', '153ms');
 dt.agg('live', '23g');
```

#### Technical Notes

##### Storage

`EMAIL/WEEK_DAY/APP:COUNTER` countains max 1440 lines (one for each minute of the day).
Each line represents the `SUM, COUNT, MAX, MIN, BOT10, TOP90` values for that minute. Each
of these lines is what we call a "partial aggregate"

`EMAIL/current` countains the latest state of all the live counters. 

`EMAIL/errors` last 100 errors
`EMAIL/warnings` last 100 warnings

##### Architecture

All current state and partial (minute) aggregates are kept in memory and written back to disk
every minute. Which means that memory must be big enough to handle all live data for all current
users of DaTtSs. This infrastructure can be easily scaled by splitting data servers with a
sharding solution based on user emails. 

