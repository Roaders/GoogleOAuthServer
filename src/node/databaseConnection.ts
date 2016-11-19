
import Rx = require('rx');
import mongodb = require('mongodb');

import {IRefreshToken} from "../common/contracts";
import {IAuthToken} from "../common/contracts";
import {IUserToken} from "../common/contracts";

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

	public storeRefreshToken(token: IUserToken): Rx.Observable<IAuthToken>{
		const refreshToken: IRefreshToken = <any>token;

		if( refreshToken.refresh_token != null ){
			const collection = this._dbConnection.collection(DataBaseConnection.tokenCollectionName);
			const insertRow = Rx.Observable.fromNodeCallback<mongodb.InsertOneWriteOpResult>(collection.insertOne.bind(collection));

			return insertRow(token)
				.map( insertionResult  => {
					refreshToken._id = insertionResult.insertedId.toHexString();
					console.log(`DATABASE_CONNECTION: refresh token stored with id: '${refreshToken._id}'`);

					return refreshToken;
				})
		}
		else {
			console.log(`DATABASE_CONNECTION: no refresh token found. No database record update.`);
			return Rx.Observable.return(refreshToken);
		}
	}

	public getRefreshToken(id: string): Rx.Observable<IRefreshToken>{
		console.log(`DATABASE_CONNECTION: getting refresh token with id ${id}`);

		const collection = this._dbConnection.collection(DataBaseConnection.tokenCollectionName);

		const find = collection.find({ _id: new mongodb.ObjectID(id) });
		const limit = find.limit(1);
		const nextFunc = limit.next.bind(limit);
		const findOne = Rx.Observable.fromNodeCallback<IRefreshToken>(nextFunc);

		return findOne();
	}

	private handleConnectionError(error: mongodb.MongoError){
		console.log(error);
		process.exit(1);
	}
}
