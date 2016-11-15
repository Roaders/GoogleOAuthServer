
/// <reference path="./typings/index.d.ts" />

var packageJson = require("./package.json");
var env = require('node-env-file');
import fs = require('fs');
import path = require('path');
import express = require('express');
import server = require("./src/node/googleOAuthServer");

if (fs.existsSync(__dirname + '/devEnvironment.env' )) {
	env(__dirname + '/devEnvironment.env')
}

const authServer = new server.GoogleOAuthServer();

var app = express();

app.use(express.static('src/testHarness'));
app.use('/browser', express.static('src/browser'))

app.get( "/api/*", (req: express.Request, res: express.Response) => {

	authServer.handleExpressRequest(req)
		.subscribe(
			result => {
				res.send(result);
			},
			error => console.log(`Error: ${error}`)
		);
});

app.get( "/version", (req, res) => {
	res.send(`Server version is ${packageJson.version} at ${new Date().getTime()}`);
});

const port = process.env.PORT;
app.listen(port);

console.log(`Server version ${packageJson.version} running on port ${port}`);
