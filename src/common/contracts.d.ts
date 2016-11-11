
export interface IAuthUrl{
	authUrl: string;
}

export interface IAuthTokens{
	"access_token" : string,
	"token_type" : string,
	"expires_in" : number,
	"refresh_token" : string
}
