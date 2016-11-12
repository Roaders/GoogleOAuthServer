
/// <reference path="../browser/youTubeAuthenticationClient.ts" />

import YouTubeAuthenticationClient = PricklyThistle.Auth.YouTube.Client.YouTubeAuthenticationClient;

var authClient = new YouTubeAuthenticationClient();
authClient.createLoadTokensObservable().subscribe( result => console.log( `token loaded: ${result.access_token}` ) );
