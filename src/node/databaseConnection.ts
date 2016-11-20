
import Rx = require('rx');
import mongodb = require('mongodb');

import {IAuthToken} from "../common/contracts";

import {IRefreshToken} from "./contracts";
import {IUserToken} from "./contracts";

export class DataBaseConnection{

	static tokenCollectionName = "tokens";

	private _dbConnection: mongodb.Db;

	public createConnection(): Rx.Observable<boolean>{
		console.log(`DATABASE_CONNECTION: connecting to database ${process.env.MONGODB_URI}`);
		var createConnection = Rx.Observable.fromNodeCallback<mongodb.Db>(mongodb.MongoClient.connect);

		return createConnection(process.env.MONGODB_URI)
			.doOnError(error => this.handleConnectionError(error))
			.do(db => {
				console.log("DATABASE_CONNECTION: Database connection ready");
				this._dbConnection = db;
			})
			.map(() => true);
	}

	public storeRefreshToken(tokens: IUserToken): Rx.Observable<IAuthToken>{
		const refreshTokens: IRefreshToken = <any>tokens;

		if( refreshTokens.refresh_token != null ){
			return this.removeExistingRowsForUser(tokens)
				.flatMap(() => this.insertRow(refreshTokens));
		}
		else {
			console.log(`DATABASE_CONNECTION: no refresh token found. No database record update.`);
			return this.getUserTokens(tokens)
		}
	}

	public getRefreshToken(id: string): Rx.Observable<IRefreshToken>{
		console.log(`DATABASE_CONNECTION: getting refresh token with id ${id}`);

		const collection = this._dbConnection.collection(DataBaseConnection.tokenCollectionName);

		const find = collection.find({ _id: new mongodb.ObjectID(id) });
		const limit = find.limit(1);
		const nextFunc = limit.next.bind(limit);
		const findOne = Rx.Observable.fromNodeCallback<IRefreshToken>(nextFunc);

		return findOne()
			.do(tokens => {
				if(!tokens){
					throw new Error("DATABASE_CONNECTION: No refresh token found, Please log out and log back in again.");
				}
			})
	}

	private getUserTokens(tokens: IUserToken): Rx.Observable<IAuthToken>{
		console.log(`DATABASE_CONNECTION: getting existing tokens for user ${tokens.user_id}`);
		const collection = this._dbConnection.collection(DataBaseConnection.tokenCollectionName);

		const find = collection.find({ user_id: tokens.user_id });
		const limit = find.limit(1);
		const nextFunc = limit.next.bind(limit);
		const findOne = Rx.Observable.fromNodeCallback<IAuthToken>(nextFunc);

		return findOne()
			.map(existingTokens => {
				if(!existingTokens){
					throw Error(`DATABASE_CONNECTION: no existing refresh token found`);
				}
				console.log(`DATABASE_CONNECTION: appending existing id '${existingTokens._id}' to token: ${tokens.access_token}` );
				tokens._id = existingTokens._id

				return tokens;
			});
	}

	private removeExistingRowsForUser(tokens: IUserToken): Rx.Observable<IUserToken>{
		console.log(`DATABASE_CONNECTION: removing rows for user '${tokens.user_id}'`);
		const collection = this._dbConnection.collection(DataBaseConnection.tokenCollectionName);
		const removeRows = Rx.Observable.fromNodeCallback<mongodb.DeleteWriteOpResultObject>(collection.deleteMany.bind(collection));
		const query = { user_id: tokens.user_id};

		return removeRows(query)
			.map(result => {
				console.log(`DATABASE_CONNECTION: Removed user rows: ${result.deletedCount}`);
				return tokens;
			})
	}

	private insertRow(tokens: IRefreshToken): Rx.Observable<IAuthToken>{
		const collection = this._dbConnection.collection(DataBaseConnection.tokenCollectionName);
		const insertRow = Rx.Observable.fromNodeCallback<mongodb.InsertOneWriteOpResult>(collection.insertOne.bind(collection));

		return insertRow(tokens)
			.map( insertionResult  => {
				tokens._id = insertionResult.insertedId.toHexString();
				console.log(`DATABASE_CONNECTION: refresh token stored with id: '${tokens._id}'`);

				return tokens;
			});
	}

	private handleConnectionError(error: mongodb.MongoError){
		console.log(error);
		process.exit(1);
	}
}
