
import {IAuthUrl, IAuthToken, ITokenError} from "../common/contracts";

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

	private _authTokensStream: Rx.Subject<IAuthToken>;

	createTokensStream(): Rx.Observable<IAuthToken>{
		const regExResults = GoogleOAuthClient.codeRegularExpression.exec(window.location.href)

		this._authTokensStream = new Rx.Subject<IAuthToken>();

		if(regExResults){
			const code = regExResults[1];

			console.log(`AUTH_CLIENT: GoogleOAuthClient: auth code found, attempting to exchange for tokens`);

			return this.exchangeTokens(code)
				.merge(this._authTokensStream);
		}

		return this._authTokensStream;
	}

	requestTokens(){
		console.log(`AUTH_CLIENT: request tokens`);

		const redirectUri = window.location.origin;
		const requestUrl = this._baseUrl + "/api/tokenRequestUrl/redirect/" + encodeURIComponent(redirectUri);

		this.loadJson<IAuthUrl>( requestUrl )
			.subscribe( data => {
				console.log(`AUTH_CLIENT: token request url loaded: '${data.authUrl}'`);
				window.location.href = data.authUrl;
			});
	}

	revokeTokens(tokens: IAuthToken): Rx.Observable<string>{
		console.log(`AUTH_CLIENT: revoke tokens`);
		const url = GoogleOAuthClient.authBaseUrl + "revoke?token=" + tokens.access_token;

		return this.loadJson<string>(url, null, false);
	}

	makeRequest<T>(path: string, tokens: IAuthToken): Rx.Observable<T>{
		console.log(`AUTH_CLIENT: make request: '${path}'`);
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

	private refreshtokens(oldTokens: IAuthToken): Rx.Observable<IAuthToken>{
		console.log(`AUTH_CLIENT: refresh tokens`);
		const requestUrl = this._baseUrl + "/api/refreshToken/" + encodeURIComponent(oldTokens._id);

		return this.loadJson<IAuthToken>( requestUrl )
			.do( refreshedTokens => {
				console.log(`AUTH_CLIENT: tokens refreshed`);
				this._authTokensStream.onNext(refreshedTokens);
			});
	}

	private exchangeTokens(code: string): Rx.Observable<IAuthToken>{
		console.log(`AUTH_CLIENT: exchange code for token '${code}'`);
		const redirectUri = window.location.origin;
		const requestUrl = this._baseUrl + "/api/exchangeTokens/code/" + encodeURIComponent(code) + "/redirect/" + encodeURIComponent(redirectUri);

		return this.loadJson<IAuthToken>( requestUrl )
			.do( tokens => {
				const tokenError = <any>tokens as ITokenError;
				if(tokenError.error){
					throw new Error("Error exchanging tokens: " + tokenError.error + ": " + tokenError.error_description)
				} else{
					console.log(`AUTH_CLIENT: tokens exchanged`);
				}
			} );
	}

	private loadJson<T>(url: string, headers?: IHeader[], preventCache: boolean = true): Rx.Observable<T>{

		return Rx.Observable.defer(() => {

			const subject = new Rx.Subject<T>();
			const request = new XMLHttpRequest();
			request.open("GET", url);

			headers = headers ? headers : [];

			if(preventCache){
				headers.push({ header: "Cache-Control", value: "no-cache" });
			}

			headers.forEach( header => {
				request.setRequestHeader(header.header, header.value);
			});

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
