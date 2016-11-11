
/// <reference path="./typings/index.d.ts" />

// Load the http module to create an http server.
var http = require('http');
var fs = require('fs');
var path = require('path');
var env = require('node-env-file');
var packageJson = require("./package.json");
import youTubeAuthServer = require("./src/node/youTubeAuthenticationServer");

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

function handleError(error, response, filePath){
	if(error.code == 'ENOENT'){
		response.writeHead(404);
		response.end(`Copuld not find file: ${filePath}`);
	} else {
		response.writeHead(500);
		response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
	}
}

function serveFile(requestUrl: string, response){

	var filePath = '.' + requestUrl;
    if (filePath === './')
	{
        filePath = './src/testHarness/index.html';
	}

	const contentType = getMimeType(filePath);

	fs.readFile(filePath, function(error, content) {

		if (error) {
			console.log(`Error serving ${filePath}: ${error}`);
			handleError(error, response, filePath);
		}
		else {
			response.writeHead(200, { 'Content-Type': contentType });
			response.end(content, 'utf-8');
		}
	});
}

const authServer = new youTubeAuthServer.YouTubeAuthenticationServer();

const server = http.createServer((request, response) => {

	switch(request.url){

		case "/api":
			response.writeHead(200, {"Content-Type": "application/json"});
			response.end(JSON.stringify(authServer.getTokenRequestUrl()));
			break;

		case "/version":
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.end(`Server version is ${packageJson.version}`);
			break;

		default:
			serveFile(request.url, response);
	}


});

const port = process.env.PORT;
server.listen(port);

console.log(`Server version ${packageJson.version} running on port ${port}`);
