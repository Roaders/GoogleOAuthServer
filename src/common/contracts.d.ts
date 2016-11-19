
export interface IAuthUrl{
	authUrl: string;
}

export interface IAuthToken{
	"access_token": string;
	"token_type": string;
	"expires_in": number;
	"_id"?: string;
}



export interface ITokenError{
	"error": string;
	"error_description": string;
}
