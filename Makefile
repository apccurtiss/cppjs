all:
	browserify -r ./src/compiler.js:compiler -o docs/cpp.js

coffee:
	coffee -o src/final -c src/coffee/
	node src\final\test.js
