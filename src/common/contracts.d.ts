
export interface IAuthUrl{
	authUrl: string;
}

export interface IAuthToken{
	"access_token": string;
	"token_type": string;
	"expires_in": number;
	"_id"?: string;
}

export interface IRawToken extends IAuthToken{
	"id_token": string;
}

export interface IUserToken extends IAuthToken{
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
