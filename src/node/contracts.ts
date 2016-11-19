
import {IAuthToken} from "../common/contracts";

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