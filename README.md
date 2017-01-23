# GoogleOAuthServer

[![Known Vulnerabilities](https://snyk.io/test/github/roaders/googleoauthserver/badge.svg)](https://snyk.io/test/github/roaders/googleoauthserver)

OAuth server to allow authentication with google

This node server in this project provides the following:

- builds a url that will open the Google auth page that a user logs into Google with
- exchanges the code provided from the step above for a valid `access_token`
- stores a `refresh_token` in a database so that it is available for the account no matter what device the user is on.
- refreshes the `access_token` when it expires using the `refresh_token` stored in the database.

The client provides the following:

- navigates to the Google Authorisation page using the url provided by the server
- exchanges the code for a valid `access_token`
- uses the `access_token` to make authorised requests to a Google api
- automatically refreshes tokens as part of a request if the token has expired
- revokes tokens to support log out

The client does NOT store the tokens between sessions. It is up to the developer to do this - it is suggested to use local storage and not cookies.

## Usage

### As standalone server

You can check this project out and run it as a standalone server that will provide authenticated keys for a client application.

#### Prerequisites

To run this project you will need:

- Credentials from the [Google Developers Console](https://console.developers.google.com/) (client_id and client_secret)
- a mongoDB instance - used for storing refresh tokens

#### Installation

Clone the github repo

`git clone https://github.com/Roaders/GoogleOAuthServer.git`

Install dependencies. This will also compile the typescript files.

`npm install`

Set environment variables or update devDependencies.env (this will set environment variables).

You will need to enter your `CLIENT_ID` and `CLIENT_SECRET` from the Google Developers Console. Enter any required authorisation `SCOPES` that your application will use and you will need to enter the `MONGODB_URI` of your mongoDB.

Other environmental variables are:

- `TOKEN_COLLECTION_NAME` to specify the name of the collection to store the tokens in in the mongoDB
- `permittedOrigin` optionally specify this to allow applications on another domain to access the server

Start the server

`npm start`

In non-prod environments (anything where the environment variable `NODE_ENV` is not `production`) there will be a test harness app available at `http://localhost:8080` (assuming you are still running on port `8080`). For this test app to work you must add the scope `https://www.googleapis.com/auth/youtube.readonly` to the SCOPES environment variable. This app will load a list of YouTube videos for a channel that belongs to the account that you authenticate.

### Installing via npm

The project can be installed as a dependency in another project. An external project may wish to use the client code to make authorised requests or it may use the server code to embed the authorisation server in an existing express app.

Install the project as a dependency using npm:

`npm install google-oauth-server --save`

#### Server

Import the package:

`import googleOAuth = require("google-oauth-server");`

Instantiate server:

```
var dbConnection = new googleOAuth.DataBaseConnection();
var authServer = new googleOAuth.GoogleOAuthServer(dbConnection);
```

Set up express routes to handle authorisation requests:

```
var app = express();

app.get( "/auth/*", (req: express.Request, res: express.Response) => {

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
```

#### Client

Import client:

`import {GoogleOAuthClient, IAuthToken} from "google-oauth-server/dist/browser";`

Store tokens when they are created or refreshed:

```
var tokens: IAuthToken;
var authClient = new GoogleOAuthClient("http://urlOfMyServer.com/routeToServer");

authClient.createTokensStream()
	.do( result => tokens = result)
	.subscribe();
```

Make a request:

`authClient.makeRequest("channels?part=id&mine=true", tokens);`
