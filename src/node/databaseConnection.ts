
import Rx = require('rx');
import mongodb = require('mongodb');

export class DataBaseConnection{

	private _dbConnection;

	public createConnection(): Rx.Observable<boolean>{

		console.log(`connecting to database ${process.env.MONGODB_URI}`);

		var createConnection = Rx.Observable.fromNodeCallback(mongodb.MongoClient.connect);

		return createConnection(process.env.MONGODB_URI)
			.doOnError(error => this.handleConnectionError(error))
			.do(db => {
				console.log("Database connection ready");
				this._dbConnection = db;
			})
			.map(() => true);
	}

	private handleConnectionError(error: mongodb.MongoError){
		console.log(error);
		process.exit(1);
	}
}
