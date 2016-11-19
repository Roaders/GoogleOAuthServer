
/// <reference path="./typings/index.d.ts" />
/// <reference path="./node_modules/rx/ts/rx.all.d.ts" />

const packageJson = require("./package.json");
const env = require('node-env-file');

import fs = require('fs');
import path = require('path');
import express = require('express');
import server = require("./src/node/googleOAuthServer");
import db = require("./src/node/databaseConnection");

if (fs.existsSync(__dirname + '/devEnvironment.env' )) {
	env(__dirname + '/devEnvironment.env')
}

const dbConnection = new db.DataBaseConnection();
const authServer = new server.GoogleOAuthServer(dbConnection);

var app = express();

app.use(express.static('src/testHarness'));
app.use('/browser', express.static('src/browser'))

app.get( "/api/*", (req: express.Request, res: express.Response) => {

	authServer.handleExpressRequest(req)
		.subscribe(
			result => {
				res.send(result);
			},
			error => {
				console.log(`Error: ${error}`);
				res.status(500).send(`{"error": "${error}"}`);
			}
		);
});

app.get( "/version", (req, res) => {
	res.send(`Server version is ${packageJson.version}`);
});

const port = process.env.PORT;

dbConnection.createConnection().subscribe(_ => {
	app.listen(port);
	console.log(`Server version ${packageJson.version} running on port ${port}`);
});
