### DaTtSs: Realtime Server Statistics Aggregation Service

DaTtSs helps aggregating and displaying server-side statistics in realtime to better track
servers and infrastructure behaviours. It is inspired by the idea that 
"You Can't Fix what you Can't Track".

Building a server-side statistics aggregation service is not that easy since the service 
must not overhelm the servers that are being tracked. For that reason, pre-aggregation must 
happen client-side and partial-aggregates only should be transmitted over the network with the
right amount of aggregation so that it is well compressed but not too much so that global
aggregated values can also be infered (approximatively but easily) from these partial aggregates.

#### Features

- Counter, Timers, Gauges aggregation and display (val, 1mn mvg avg)
- Daily against Week average plot
- Errors and Warnings Streaming and reporting
- Process statistics (uptime, mem, cpu, errors & warnings counts)
- Alerts Email, SMS, Phone (Above/Below Limits, Stopped Working, Stopped Responding) 

#### Inspiration

DaTtSs is an acronym for `statsd`: the whole project is inpsired by the work proposed by 
Flickr (perl + RDDTool) https://github.com/iamcal/Flickr-StatsD and later on Etsy (nodeJS + Graphite) 
https://github.com/etsy/statsd 

see also: 
- http://code.flickr.com/blog/2008/10/27/counting-timing/
- http://codeascraft.etsy.com/2011/02/15/measure-anything-measure-everything/

#### Example Usage

```
 var dts = require('dattss').process({ name: 'api',
                                       auth: '0_1ba...' });
 // or (if auth is passed through env or command line)
 var dts = require('dattss').process('api');

 //...

 dts.agg('new', '1c');
 dts.agg('merge', '2c');
 dts.agg('query', '153ms');
 dts.agg('live', '23g');
```

#### Technical Notes

##### Storage

- `USER/WEEK_DAY/PROC/CTYPE_CNAME.prt` countains max 1440 lines (one for each minute of the day).
Each line represents the `SUM, CNT, MAX, MIN, BOT, TOP` values for that minute. Each
of these lines is what we call a "partial aggregate".
- `USER/current/PROC.cur` countains the latest state of all the live counters. 
- `USER/errors` last 100 errors.
- `USER/warnings` last 100 warnings.

##### Architecture

Client side code, generates 5s-partial aggregates that are kept in a rolling 1mn array serer side.
Each minute, an approximate 1m-partial aggregate is calculated from this array and stored to disk.
Additionally, a current state is kept in memory and a 1mn mvg average calculated for each counter
from the 5s-partial aggregates array as well.

This means that memory must be big enough to handle all live data for all current
users of DaTtSs. This infrastructure can be easily scaled by splitting data servers with a
sharding solution based on user ids. 

