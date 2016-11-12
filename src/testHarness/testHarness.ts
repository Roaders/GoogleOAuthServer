
/// <reference path="../browser/youTubeAuthenticationClient.ts" />

import YouTubeAuthenticationClient = PricklyThistle.Auth.YouTube.Client.YouTubeAuthenticationClient;
import IAuthTokens = PricklyThistle.Auth.YouTube.Client.IAuthTokens;

var tokens: IAuthTokens;

var authClient = new YouTubeAuthenticationClient();

function handleChannels( channels ): string{
	let channelId = channels.items[0].id;

	console.log(`channel loaded: ${channelId}`);

	return channelId;
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
	document.getElementById('results').appendChild(videoDiv);
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

function handleTokens( result: IAuthTokens ){
	tokens = result;

	console.log(`Tokens recieved: ${tokens.access_token}`);
	console.log(`Loading videos...`);

	authClient
		.makeRequest("channels?part=id&mine=true", tokens)
		.map( result => handleChannels(result) )
		.flatMap( channelId => loadVideos(channelId))
		.subscribe( result => handleVideo(result) );
}

authClient.createTokensStream().subscribe( result => handleTokens(result) );
