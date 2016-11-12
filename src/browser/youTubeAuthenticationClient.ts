
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

namespace PricklyThistle.Auth.YouTube.Client {

	//TODO: I wish I could figure out how to use the contacts in teh shared folder that are used by node
	export interface IAuthUrl{
		authUrl: string;
	}

	export interface IAuthTokens{
		"access_token" : string;
		"token_type" : string;
		"expires_in" : number;
		"refresh_token" : string;
		error?: string;
		error_description?: string;
	}

	interface IHeader{
		header: string;
		value: string;
	}

	export class YouTubeAuthenticationClient{

		constructor(private _baseUrl: string = "" ){
		}

		static youTubeBaseUrl = "https://www.googleapis.com/youtube/v3/";
		static codeRegularExpression = /[?&]code=([^&]+)/

		createTokensStream(): Rx.Observable<IAuthTokens>{
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
			const requestUrl = this._baseUrl + "/api/tokenRequestUrl/redirect/" + encodeURIComponent(redirectUri);

			this.loadJson<IAuthUrl>( requestUrl )
				.subscribe( data => {
					window.location.href = data.authUrl;
				});
		}

		makeRequest<T>(path: string, tokens: IAuthTokens): Rx.Observable<T>{
			const url = YouTubeAuthenticationClient.youTubeBaseUrl + path;

			const headers = [{header: "Authorization", value: "Bearer " + tokens.access_token}];

			return this.loadJson<T>(url,headers);
		}

		private exchangeTokens(code: string): Rx.Observable<IAuthTokens>{
			const redirectUri = window.location.origin;
			const requestUrl = this._baseUrl + "/api/exchangeTokens/code/" + encodeURIComponent(code) + "/redirect/" + encodeURIComponent(redirectUri);

			return this.loadJson<IAuthTokens>( requestUrl )
				.do( tokens => {
					if(tokens.error){
						throw new Error("Error exchanging tokens: " + tokens.error + ": " + tokens.error_description)
					}
				} );
		}

		private loadJson<T>(url: string, headers?: IHeader[]): Rx.Observable<T>{

			return Rx.Observable.defer(() => {

				const subject = new Rx.Subject<T>();
				const request = new XMLHttpRequest();
				request.open("GET", url);

				if(headers){
					headers.forEach( header => {
						request.setRequestHeader(header.header, header.value);
					});
				}

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
