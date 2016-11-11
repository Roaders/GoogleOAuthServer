
/// <reference path="./typings/index.d.ts" />

// Load the http module to create an http server.
var http = require('http');
var fs = require('fs');
var path = require('path');
var env = require('node-env-file');
var package = require("./package.json");

if (fs.existsSync(__dirname + '/devEnvironment.env' )) {
	env(__dirname + '/devEnvironment.env')
}

function getMimeType(filePath: string): string{
	var extname = path.extname(filePath);
	var contentType = 'text/html';

	switch (extname) {
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
		case '.json':
			contentType = 'application/json';
			break;
		case '.png':
			contentType = 'image/png';
			break;
		case '.jpg':
			contentType = 'image/jpg';
			break;
	}

	return contentType;
}

function handleError(error, response){
	response.writeHead(500);
	response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
}

function serveFile(requestUrl: string, response){

	var filePath = '.' + requestUrl;
    if (filePath === './')
	{
        filePath = './testHarness/index.html';
	}

	const contentType = getMimeType(filePath);

	fs.readFile(filePath, function(error, content) {

		if (error) {
			console.log(`Error serving ${filePath}: ${error}`);
			handleError(error, response);
		}
		else {
			response.writeHead(200, { 'Content-Type': contentType });
			response.end(content, 'utf-8');
		}
	});
}

var server = http.createServer((request, response) => {

	switch(request.url){
		case "/version":
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.end(`Server version is ${package.version}`);
			break;

		default:
			serveFile(request.url, response);
	}


});

const port = process.env.PORT;
server.listen(port);

console.log(`Server version ${package.version} running on port ${port}`);
