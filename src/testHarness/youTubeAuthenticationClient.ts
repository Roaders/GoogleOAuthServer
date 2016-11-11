

/// <reference path="../../node_modules/rx/ts/rx.d.ts" />
/// <reference path="../../typings/globals/jquery/index.d.ts" />

import contracts = require("../common/contracts");
import IAuthUrl = contracts.IAuthUrl;

namespace PricklyThistle.Auth.YouTube.Client {

	export class YouTubeAuthenticationClient{

		requestTokens(){

			Rx.Observable.fromPromise<IAuthUrl>( $.getJSON( "/api" ) )
				.subscribe( data => {
					console.log(`url loaded: ${data.authUrl}`);

					window.location.href = data.authUrl;
				});
		}
	}
}

const authClient = new PricklyThistle.Auth.YouTube.Client.YouTubeAuthenticationClient();
