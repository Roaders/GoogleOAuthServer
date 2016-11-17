
export interface IAuthUrl{
	authUrl: string;
}

export interface IAuthToken{
	"access_token": string;
	"token_type": string;
	"expires_in": number;
	"user_id": string;
}

export interface IRefreshToken extends IAuthToken
{
	"refresh_token": string;
}

export interface ITokenError{
	"error": string;
	"error_description": string;
}
