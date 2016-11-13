
/// <reference path="../browser/googleoAuthClient.ts" />

import GoogleOAuthClient = PricklyThistle.Auth.Google.Client.GoogleOAuthClient;
import IAuthTokens = PricklyThistle.Auth.Google.Client.IAuthTokens;

var tokens: IAuthTokens;
var channelId: string;
var authClient = new GoogleOAuthClient();

function revokeTokens(){
	authClient.revokeTokens(tokens).subscribe();
}

function reloadVideos(){

	if(!tokens){
		const tokenTextArea = <HTMLTextAreaElement>document.getElementById('tokenResult');
		tokens = JSON.parse(tokenTextArea.value);
	}

	clearVideoResults();

	startLoad();
}

function handleTokens( result: IAuthTokens ){
	(<any>result).loadedAt = new Date();
	const tokenTextArea = <HTMLTextAreaElement>document.getElementById('tokenResult');
	tokenTextArea.value = JSON.stringify(result,null,4);

	tokens = result;

	console.log(`Tokens recieved: ${tokens.access_token}`);
	console.log(`Loading videos...`);

	startLoad();
}

function startLoad(){
	loadChannels()
		.map( result => handleChannels(result) )
		.flatMap( channelId => loadVideos(channelId))
		.subscribe( result => handleVideo(result) );
}

function loadChannels(): Rx.Observable<any>{
	return authClient.makeRequest("channels?part=id&mine=true", tokens);
}

function handleChannels( channels ): string{
	channelId = channels.items[0].id;

	console.log(`channel loaded: ${channelId}`);

	return channelId;
}

function clearVideoResults(){
	const videoParent = document.getElementById('videoResults');

	while(videoParent.lastChild){
		videoParent.removeChild(videoParent.lastChild);
	}
}

function loadVideos(channelId: string, pageToken?: string): Rx.Observable<any>{
	let url = "search?part=id,snippet&type=video&maxResults=50&channelId=" + channelId;

	if(pageToken){
		url += "&pageToken=" + pageToken;
	}

	return authClient.makeRequest<any>(url, tokens)
		.flatMap( videoResult => {
			var videoList = Rx.Observable.from(videoResult.items);

			if( videoResult.nextPageToken ) {
				const nextObservable = this.loadVideos( channelId, videoResult.nextPageToken );
				return Rx.Observable.merge( videoList, nextObservable );
			}

			return videoList;
		});
}

function handleVideo(video){
	const title = video.snippet.title;
	const id = video.id.videoId;
	const thumbnail = video.snippet.thumbnails.default.url;

	console.log(`video: ${id} ${title} ${thumbnail}`);

	var videoDiv = document.createElement('div');

	var anchor = document.createElement('a');
	anchor.href = "https://www.youtube.com/watch?v=" + id;

	var image = document.createElement('img');
	image.src = thumbnail;

	var titleDiv = document.createElement('div');
	titleDiv.innerText = title;

	videoDiv.appendChild(anchor);
	anchor.appendChild(image);
	anchor.appendChild(titleDiv);
	document.getElementById('videoResults').appendChild(videoDiv);
}

authClient.createTokensStream().subscribe( result => handleTokens(result) );
