# GoogleOAuthServer
OAuth server to allow authentication with google

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

Install dependencies. This will also compile the typescript files

`npm install`
