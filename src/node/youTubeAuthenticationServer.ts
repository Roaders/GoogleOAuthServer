
import contracts = require("../common/contracts");
import IAuthUrl = contracts.IAuthUrl;

export class YouTubeAuthenticationServer{

	static baseUrl = "https://accounts.google.com/o/oauth2/auth";

	getTokenRequestUrl(): IAuthUrl {

		let authUrl = YouTubeAuthenticationServer.baseUrl;

		const redirectUri = "http://localhost:8080";
		const scope = "https://www.googleapis.com/auth/youtube.readonly";

		authUrl += "?client_id=" + process.env.CLIENT_ID;
		authUrl += "&response_type=code";
		authUrl += "&redirect_uri=" + redirectUri;
		authUrl += "&scope=" + scope;

		return {authUrl: authUrl};
	}
}
