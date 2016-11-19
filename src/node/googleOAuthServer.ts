
import express = require('express');
import Rx = require('rx');
import RxNode = require('rx-node');
import http = require('http');
import https = require('https');
import url = require('url');

import {IAuthUrl} from "../common/contracts";
import {IAuthToken} from "../common/contracts";
import {IRefreshToken} from "../common/contracts";
import {IRawToken} from "../common/contracts";
import {IUserToken} from "../common/contracts";

import {DataBaseConnection} from "./databaseConnection";

export class GoogleOAuthServer{

	constructor(private _db: DataBaseConnection){}

	static baseUrl = "https://accounts.google.com/o/oauth2/";

	static userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo?fields=id"

	static tokenRequestUrlRegularExpression = /\/api\/tokenRequestUrl\/redirect\/([^\/?&]+)/;
	static tokenExchangeRegularExpression = /\/api\/exchangeTokens\/code\/([^\/]+)\/redirect\/([^\/?&]+)/;
	static refreshTokenRegularExpression = /\/api\/refreshToken\/([^\/?&]+)/;

	static userInfoScope = "https://www.googleapis.com/auth/userinfo.profile";

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
		console.log(`AUTH_SERVER: creating token request url`);

		const urlMatches = GoogleOAuthServer.tokenRequestUrlRegularExpression.exec(requestUrl);
		const redirectUri = decodeURIComponent(urlMatches[1]);

		let url = GoogleOAuthServer.baseUrl + "auth";

		let scopes = process.env.SCOPES;
		if(scopes.indexOf( GoogleOAuthServer.userInfoScope ) < 0){
			scopes += " " + GoogleOAuthServer.userInfoScope
		}

		url += "?client_id=" + encodeURIComponent(process.env.CLIENT_ID);
		url += "&redirect_uri=" + encodeURIComponent(redirectUri);
		url += "&scope=" + encodeURIComponent(scopes);
		url += "&access_type=offline";
		url += "&response_type=code";

		return Rx.Observable.just({authUrl: url});
	}

	private exchangeTokens(requestUrl: string): Rx.Observable<IAuthToken>{
		const urlMatches = GoogleOAuthServer.tokenExchangeRegularExpression.exec(requestUrl);
		const code = decodeURIComponent(urlMatches[1]);
		const redirectUri = decodeURIComponent(urlMatches[2]);

		console.log(`AUTH_SERVER: exchanging tokens for code '${code}'`);

		let url = GoogleOAuthServer.baseUrl + "token";

		var postData= "code=" + encodeURIComponent(code);
		postData += "&redirect_uri=" + encodeURIComponent(redirectUri);
		postData += "&client_id=" + encodeURIComponent(process.env.CLIENT_ID);
		postData += "&client_secret=" + encodeURIComponent(process.env.CLIENT_SECRET);
		postData += "&grant_type=authorization_code";

		return this.makePostRequest<IRawToken>(url,postData)
			.do(token => console.log(`Token loaded: ${token.access_token}`))
			.flatMap(tokens => this.getUserInfo(tokens))
			.flatMap(tokens => this._db.storeRefreshToken(tokens))
			.map(tokens => this.createAuthToken(tokens));
	}

	private getUserInfo(tokens: IRawToken): Rx.Observable<IUserToken>{
		console.log(`AUTH_SERVER: getting user info for token ${tokens.access_token}`);

		const urlObject = url.parse(GoogleOAuthServer.userInfoUrl);

		var options: http.RequestOptions = {
			hostname: urlObject.hostname,
			port: Number(urlObject.port),
			path: urlObject.path,
			protocol: "https:",
			method: "GET",
			headers: {
				"Authorization": "Bearer " + tokens.access_token
			}
		};

		return this.makeHttpRequest<any>(options)
			.map<string>(result => result.id)
			.map<IUserToken>(userId => {
				console.log(`AUTH_SERVER: Userid ${userId} loaded for token ${tokens.access_token}`);

				const userToken: IUserToken = <any>tokens;
				userToken.user_id = userId;

				return userToken;
			});
	}

	private refreshTokens(requestUrl: string): Rx.Observable<IAuthToken>{
		const urlMatches = GoogleOAuthServer.refreshTokenRegularExpression.exec(requestUrl);
		const id = decodeURIComponent(urlMatches[1]);

		console.log(`AUTH_SERVER: refreshTokens for id: ${id}`);

		return this._db.getRefreshToken(id)
			.flatMap( refreshToken => this.makeRefreshTokenCall(refreshToken));
	}

	private makeRefreshTokenCall(refreshToken: IRefreshToken): Rx.Observable<IAuthToken>{
		console.log(`AUTH_SERVER: making refresh token call for ${refreshToken.refresh_token}`);

		let url = GoogleOAuthServer.baseUrl + "token";

		var postData= "refresh_token=" + encodeURIComponent(refreshToken.refresh_token);
		postData += "&client_id=" + encodeURIComponent(process.env.CLIENT_ID);
		postData += "&client_secret=" + encodeURIComponent(process.env.CLIENT_SECRET);
		postData += "&grant_type=refresh_token";

		return this.makePostRequest<IAuthToken>(url,postData)
			.do( tokens => console.log(`AUTH_SERVER: token refreshed: ${tokens.access_token}`) )
			.map(token => this.createAuthToken(token,refreshToken._id))
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

		return this.makeHttpRequest<T>(options,data);
	}

	private makeHttpRequest<T>(options: http.RequestOptions, data?: any): Rx.Observable<T>{

		return Rx.Observable.defer(() => {
			const request = https.request(options);
			const Observable = Rx.Observable.fromEvent(<any>request, "response")
				.take(1);

				if(data){
					request.write(data);
				}

				request.end();

			return Observable;
			})
			.flatMap( response => RxNode.fromReadableStream(<any>response))
			.toArray()
			.map(function(allData){
				return JSON.parse(allData.join("")) as T;
			});
	}

	private createAuthToken(refreshToken: IRefreshToken | IAuthToken, id?: string): IAuthToken{
		return { 	access_token: refreshToken.access_token,
					token_type: refreshToken.token_type,
					expires_in: refreshToken.expires_in,
					_id: id ? id : refreshToken._id};
	}
}
