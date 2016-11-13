
import express = require('express');
import Rx = require('rx');
import RxNode = require('rx-node');
import http = require('http');
import https = require('https');
import url = require('url');

import {IAuthUrl} from "../common/contracts";
import {IAuthTokens} from "../common/contracts";

export class GoogleOAuthServer{

	static baseUrl = "https://accounts.google.com/o/oauth2/";

	static tokenRequestUrlRegularExpression = /\/api\/tokenRequestUrl\/redirect\/([^\/?&]+)/;
	static tokenExchangeRegularExpression = /\/api\/exchangeTokens\/code\/([^\/]+)\/redirect\/([^\/?&]+)/;
	static refreshTokenRegularExpression = /\/api\/refreshToken\/([^\/?&]+)/;

	static scopes: string = "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/youtube.force-ssl";

	handleExpressRequest(request: express.Request): Rx.Observable<string>{
		let response: Rx.Observable<any>;

		if(GoogleOAuthServer.tokenRequestUrlRegularExpression.test(request.url)){
			response = this.getTokenRequestUrl(request.url);
		}
		else if(GoogleOAuthServer.refreshTokenRegularExpression.test(request.url)){
			response = this.refreshTokens(request.url);
		}
		else if(GoogleOAuthServer.tokenExchangeRegularExpression.test(request.url)){
			response = this.exchangeTokens(request.url);
		}
		else{
			const warning = `api method not found for ${request.url}`;
			console.warn(warning);
			return Rx.Observable.return(warning);
		}

		return response.map( data => JSON.stringify(data));
	}

	private getTokenRequestUrl(requestUrl: string): Rx.Observable<IAuthUrl> {
		const urlMatches = GoogleOAuthServer.tokenRequestUrlRegularExpression.exec(requestUrl);
		const redirectUri = decodeURIComponent(urlMatches[1]);

		let url = GoogleOAuthServer.baseUrl + "auth";

		url += "?client_id=" + encodeURIComponent(process.env.CLIENT_ID);
		url += "&redirect_uri=" + encodeURIComponent(redirectUri);
		url += "&scope=" + encodeURIComponent(GoogleOAuthServer.scopes);
		url += "&access_type=offline";
		url += "&response_type=code";

		return Rx.Observable.just({authUrl: url});
	}

	private exchangeTokens(requestUrl: string): Rx.Observable<IAuthTokens>{
		const urlMatches = GoogleOAuthServer.tokenExchangeRegularExpression.exec(requestUrl);
		const code = decodeURIComponent(urlMatches[1]);
		const redirectUri = decodeURIComponent(urlMatches[2]);

		let url = GoogleOAuthServer.baseUrl + "token";

		var postData= "code=" + encodeURIComponent(code);
		postData += "&redirect_uri=" + encodeURIComponent(redirectUri);
		postData += "&client_id=" + encodeURIComponent(process.env.CLIENT_ID);
		postData += "&client_secret=" + encodeURIComponent(process.env.CLIENT_SECRET);
		postData += "&grant_type=authorization_code";

		return this.makePostRequest<IAuthTokens>(url,postData);
	}

	private refreshTokens(requestUrl: string): Rx.Observable<IAuthTokens>{

		const urlMatches = GoogleOAuthServer.refreshTokenRegularExpression.exec(requestUrl);
		const token = decodeURIComponent(urlMatches[1]);

		let url = GoogleOAuthServer.baseUrl + "token";

		var postData= "refresh_token=" + encodeURIComponent(token);
		postData += "&client_id=" + encodeURIComponent(process.env.CLIENT_ID);
		postData += "&client_secret=" + encodeURIComponent(process.env.CLIENT_SECRET);
		postData += "&grant_type=refresh_token";

		return this.makePostRequest<IAuthTokens>(url,postData);
	}

	private makePostRequest<T>(targetUrl:string, data: string): Rx.Observable<T>{
		var urlObject = url.parse(targetUrl);

		var options: http.RequestOptions = {
			hostname: urlObject.hostname,
			port: Number(urlObject.port),
			path: urlObject.path,
			protocol: "https:",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		};

		return Rx.Observable.defer(() => {
			const request = https.request(options);
			const Observable = Rx.Observable.fromEvent(<any>request, "response")
				.take(1);

				request.write(data);
				request.end();

			return Observable;
			})
			.flatMap( response => RxNode.fromReadableStream(<any>response))
			.toArray()
			.map(function(allData){
				return JSON.parse(allData.join("")) as T;
			});
	}
}
