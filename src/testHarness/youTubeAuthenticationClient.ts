

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

			const redirectUri = window.location.origin;

			const requestUrl = "/api/exchangeTokens/code/" + encodeURIComponent(code) + "/redirect/" + encodeURIComponent(redirectUri);

			Rx.Observable.fromPromise<IAuthTokens>( $.getJSON( requestUrl) )
				.subscribe( data => {
					console.log(`tokens loaded: ${data.access_token}`);
				});
		}

		requestTokens(){
			const redirectUri = window.location.origin;
			const requestUrl = "/api/tokenRequestUrl/redirect/" + encodeURIComponent(redirectUri);

			Rx.Observable.fromPromise<IAuthUrl>( $.getJSON( requestUrl ) )
				.subscribe( data => {
					console.log(`url loaded: ${data.authUrl}`);

					window.location.href = data.authUrl;
				});
		}
	}
}

const authClient = new PricklyThistle.Auth.YouTube.Client.YouTubeAuthenticationClient();
