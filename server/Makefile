REPORTER = dot
TIMEOUT = 20000

clean:
	rm -rf node_modules

install: clean
	npm install

start:
	rm -f ~/log/dattss_v2.fvr
	forever start -a -l ~/log/dattss_v2.fvr dattss.js

run:
	node dattss.js

.PHONY: clean install start run
