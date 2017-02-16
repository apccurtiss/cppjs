all:
	browserify src/c.js -o docs/cjs-web.js

coffee:
	coffee -o src/final -c src/coffee/
	node src\final\test.js
