
import Rx = require('rx');
import mongodb = require('mongodb');

import {IRefreshToken} from "../common/contracts";
import {IAuthToken} from "../common/contracts";
import {IUserToken} from "../common/contracts";

export class DataBaseConnection{

	static tokenCollectionName = "tokens";

	private _dbConnection: mongodb.Db;

	public createConnection(): Rx.Observable<boolean>{
		console.log(`connecting to database ${process.env.MONGODB_URI}`);
		var createConnection = Rx.Observable.fromNodeCallback<mongodb.Db>(mongodb.MongoClient.connect);

		return createConnection(process.env.MONGODB_URI)
			.doOnError(error => this.handleConnectionError(error))
			.do(db => {
				console.log("Database connection ready");
				this._dbConnection = db;
			})
			.map(() => true);
	}

	public storeRefreshToken(token: IUserToken): Rx.Observable<IAuthToken>{
		const refreshToken: IRefreshToken = <any>token;

		const returnToken: IAuthToken = { 	access_token: token.access_token,
											token_type: token.token_type,
											expires_in: token.expires_in};

		if( refreshToken.refresh_token != null ){
			const collection = this._dbConnection.collection(DataBaseConnection.tokenCollectionName);
			const insertRow = Rx.Observable.fromNodeCallback<mongodb.InsertOneWriteOpResult>(collection.insertOne.bind(collection));

			return insertRow(token)
				.map( insertionResult  => {
					returnToken._id = insertionResult.insertedId.toHexString();
					return returnToken;
				})
		}
		else {
			return Rx.Observable.return(returnToken);
		}
	}

	private getRowForUser(userID: string): Rx.Observable<IRefreshToken>{
		const collection = this._dbConnection.collection(DataBaseConnection.tokenCollectionName);
		const findOne = Rx.Observable.fromNodeCallback<IRefreshToken>(
			collection.find({ _id: new mongodb.ObjectID(userID) }).limit(1).next.bind(collection));

		return findOne();
	}

	private handleConnectionError(error: mongodb.MongoError){
		console.log(error);
		process.exit(1);
	}
}
