clean:
	rm -rf node_modules

install: clean
	npm install

start:
	touch ~/log/estrack.fvr
	rm ~/log/estrack.fvr
	forever start -a -l ~/log/estrack.fvr app.js

run:
	node app.js

.PHONY: clean install start run 
