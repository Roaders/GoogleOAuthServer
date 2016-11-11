

/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/globals/jquery/index.d.ts" />

import contracts = require("../common/contracts");
import IAuthUrl = contracts.IAuthUrl;
import IAuthTokens = contracts.IAuthTokens;

namespace PricklyThistle.Auth.YouTube.Client {

	export class YouTubeAuthenticationClient{

		static codeSnippet = "?code=";

		constructor(){
			const codeIndex = window.location.href.indexOf(YouTubeAuthenticationClient.codeSnippet);

			if(codeIndex > 0 ){
				const code = window.location.href.substr(codeIndex + YouTubeAuthenticationClient.codeSnippet.length);

				console.log(`Code found: ${code}`);

				this.exchangeTokens(code);
			}
		}

		private exchangeTokens(code: string){

			Rx.Observable.fromPromise<IAuthTokens>( $.getJSON( "/api/exchangeTokens/code/" + encodeURIComponent(code) ) )
				.subscribe( data => {
					console.log(`tokens loaded: ${data.access_token}`);
				});
		}

		requestTokens(){
			Rx.Observable.fromPromise<IAuthUrl>( $.getJSON( "/api/tokenRequestUrl" ) )
				.subscribe( data => {
					console.log(`url loaded: ${data.authUrl}`);

					window.location.href = data.authUrl;
				});
		}
	}
}

const authClient = new PricklyThistle.Auth.YouTube.Client.YouTubeAuthenticationClient();
