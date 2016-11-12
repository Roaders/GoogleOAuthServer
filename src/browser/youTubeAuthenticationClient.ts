
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />



namespace PricklyThistle.Auth.YouTube.Client {
	
	export interface IAuthUrl{
		authUrl: string;
	}

	export interface IAuthTokens{
		"access_token" : string,
		"token_type" : string,
		"expires_in" : number,
		"refresh_token" : string
	}


	export class YouTubeAuthenticationClient{

		static codeRegularExpression = /[?&]code=([^&]+)/

		createLoadTokensObservable(): Rx.Observable<IAuthTokens>{
			const regExResults = YouTubeAuthenticationClient.codeRegularExpression.exec(window.location.href)

			if(regExResults){
				const code = regExResults[1];

				console.log(`YouTubeAuthenticationClient: auth code found, attempting to exchange for tokens`);

				return this.exchangeTokens(code);
			}
			else{
				return Rx.Observable.empty<IAuthTokens>();
			}
		}

 		requestTokens(){
			const redirectUri = window.location.origin;
			const requestUrl = "/api/tokenRequestUrl/redirect/" + encodeURIComponent(redirectUri);

			this.loadJson<IAuthUrl>( requestUrl )
				.subscribe( data => {
					window.location.href = data.authUrl;
				});
		}

		private exchangeTokens(code: string): Rx.Observable<IAuthTokens>{
			const redirectUri = window.location.origin;
			const requestUrl = "/api/exchangeTokens/code/" + encodeURIComponent(code) + "/redirect/" + encodeURIComponent(redirectUri);

			return this.loadJson<IAuthTokens>( requestUrl );
		}

		private loadJson<T>(url: string): Rx.Observable<T>{

			return Rx.Observable.defer(() => {

				const subject = new Rx.Subject<T>();
				const request = new XMLHttpRequest();
				request.open("GET", url);

				request.onload = function() {
					if (request.status == 200) {
						subject.onNext(JSON.parse(request.response));
					}
					else {
						subject.onError(request.statusText);
					}
					subject.onCompleted();
				};

				request.onerror = function(error) {
					subject.onError(error);
					subject.onCompleted();
				};

				request.send()

				return subject;
			});

		}
	}
}
