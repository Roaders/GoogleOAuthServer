
/// <reference path="./typings/index.d.ts" />

var packageJson = require("./package.json");
var env = require('node-env-file');
import http = require('http');
import fs = require('fs');
import path = require('path');
import express = require('express');
import youTubeAuthServer = require("./src/node/youTubeAuthenticationServer");

if (fs.existsSync(__dirname + '/devEnvironment.env' )) {
	env(__dirname + '/devEnvironment.env')
}

const authServer = new youTubeAuthServer.YouTubeAuthenticationServer();

var app = express();

app.use(express.static('src/testHarness'));

app.get( "/api/tokenRequestUrl", (req: express.Request, res: express.Response) => {
	console.log(`Api request: ${req.url}`);
	res.send(JSON.stringify(authServer.getTokenRequestUrl()));
});

app.get( "/version", (req, res) => {
	res.send(`Server version is ${packageJson.version}`);
});

const port = process.env.PORT;
app.listen(port);

console.log(`Server version ${packageJson.version} running on port ${port}`);
