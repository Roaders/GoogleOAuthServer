
/// <reference path="typings/index.d.ts" />

// Load the http module to create an http server.
var http = require('http');
var fs = require('fs');
var env = require('node-env-file');
var package = require("./package.json");

if (fs.existsSync(__dirname + '/devEnvironment.env' )) {
  env(__dirname + '/devEnvironment.env')
}

// Configure our HTTP server to respond with Hello World to all requests.
var server = http.createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end(`Hello World... Server version is ${package.version}`);
});

const port = process.env.PORT;

server.listen(port);

// Put a friendly message on the terminal
console.log(`Server version ${package.version} running on port ${port}`);
