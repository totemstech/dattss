clean:
	rm -rf node_modules

install: clean
	npm install

start:
	touch ~/log/hwtrack.fvr
	rm ~/log/hwtrack.fvr
	forever start -a -l ~/log/hwtrack.fvr app.js

run:
	node app.js

.PHONY: clean install start run 
