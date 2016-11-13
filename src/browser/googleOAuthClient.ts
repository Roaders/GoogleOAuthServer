
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

namespace PricklyThistle.Auth.Google.Client {

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

	export class GoogleOAuthClient{

		constructor(private _baseUrl: string = "" ){
		}

		static authBaseUrl = "https://accounts.google.com/o/oauth2/";
		static youTubeBaseUrl = "https://www.googleapis.com/youtube/v3/";
		static codeRegularExpression = /[?&]code=([^&]+)/

		private _authTokensStream: Rx.Subject<IAuthTokens>;

		createTokensStream(): Rx.Observable<IAuthTokens>{
			const regExResults = GoogleOAuthClient.codeRegularExpression.exec(window.location.href)

			this._authTokensStream = new Rx.Subject<IAuthTokens>();

			if(regExResults){
				const code = regExResults[1];

				console.log(`GoogleOAuthClient: auth code found, attempting to exchange for tokens`);

				return this.exchangeTokens(code)
					.merge(this._authTokensStream);
			}

			return this._authTokensStream;
		}

 		requestTokens(){
			const redirectUri = window.location.origin;
			const requestUrl = this._baseUrl + "/api/tokenRequestUrl/redirect/" + encodeURIComponent(redirectUri);

			this.loadJson<IAuthUrl>( requestUrl )
				.subscribe( data => {
					window.location.href = data.authUrl;
				});
		}

		revokeTokens(tokens: IAuthTokens): Rx.Observable<string>{
			const url = GoogleOAuthClient.authBaseUrl + "revoke?token=" + tokens.access_token;

			return this.loadJson<string>(url);
		}

		makeRequest<T>(path: string, tokens: IAuthTokens): Rx.Observable<T>{
			const url = GoogleOAuthClient.youTubeBaseUrl + path;

			const authorizationHeader: IHeader = {header: "Authorization", value: "Bearer " + tokens.access_token};
			const headers = [authorizationHeader];

			return this.loadJson<T>(url,headers)
				.retryWhen(errors => {

					var tokensRefreshed: boolean;

					return errors.flatMap((error) => {

						if(error.status === 401 && !tokensRefreshed){
							console.log(`Tokens expired, attempting to refresh`);

							tokensRefreshed = true;
							return this.refreshtokens(tokens)
								.do(newTokens => authorizationHeader.value = "Bearer " + newTokens.access_token );
						} else {
							throw error;
						}
					});
				});
		}

		private refreshtokens(oldTokens: IAuthTokens): Rx.Observable<IAuthTokens>{
			const requestUrl = this._baseUrl + "/api/refreshToken/" + encodeURIComponent(oldTokens.refresh_token);

			return this.loadJson<IAuthTokens>( requestUrl )
				.do( refreshedTokens => {
					refreshedTokens.refresh_token = oldTokens.refresh_token;

					this._authTokensStream.onNext(refreshedTokens);
				});
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

				url += url.indexOf("?") > 0 ? "&ts=" : "?ts=";
				url+= new Date().getTime();

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
						const error = {
							status: request.status,
							statusText: request.statusText,
							details: JSON.parse(request.response)
						};
						subject.onError(error);
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
