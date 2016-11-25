
/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/rx/ts/rx.all.d.ts" />

const packageJson = require("../package.json");
const env = require('node-env-file');

import fs = require('fs');
import path = require('path');
import express = require('express');
import server = require("./node/googleOAuthServer");
import db = require("./node/databaseConnection");
var cors = require('cors');

const environmentFile = path.join(__dirname,'../devEnvironment.env' );

console.log(`Checking for environment file at ${environmentFile}`)

if (fs.existsSync(environmentFile)) {
	console.log(`Loading environment file`);
	env(environmentFile)
}

const dbConnection = new db.DataBaseConnection();
const authServer = new server.GoogleOAuthServer(dbConnection);

var app = express();

if(process.env.permittedOrigin){

	console.log(`Setting up CORS for ${process.env.permittedOrigin}`);

	app.use(cors({origin: process.env.permittedOrigin}));
}


if(process.env.NODE_ENV != "production"){
	console.log(`Setting up test harness`);
	app.use(express.static('src/testHarness'));
	app.use('/browser', express.static('dist/browser'));
	app.use('/testHarness', express.static('dist/testHarness'));
	app.use('/node_modules', express.static('node_modules'));
}

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

	console.log(`Server version ${packageJson.version} running on port ${port} in environment ${process.env.NODE_ENV}`);
});
