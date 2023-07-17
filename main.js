// Options
const CLIENT_ID = process.env.CLIENT_ID_GOOGLE;

const DISCOVERY_DOCS = [ 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest' ];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

// DOM ELEMENTS
const authorizeButton = document.getElementById('authorize-button');
const signoutButton = document.getElementById('signout-button');
const content = document.querySelector('#content');
const channelForm = document.querySelector('#channel-form');
const channelInput = document.querySelector('#channel-input');
const videos = document.querySelector('#video-container');
const defaultChannel = 'techguyweb';

channelForm.addEventListener('submit', (e) => {
	e.preventDefault();

	const channelName = channelInput.value;
	getChannel(channelName);
});

// Auth2 Library

function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

function initClient() {
	gapi.client
		.init({
			discoveryDocs: DISCOVERY_DOCS,
			clientId: CLIENT_ID,
			scope: SCOPES
		})
		.then(() => {
			// Listening SignIn status with an outside function
			gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

			// HandleCurrent state of user
			updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

			authorizeButton.onclick = authClicked;
			signoutButton.onclick = signoutClicked;
		});
}

function updateSigninStatus(isSignedIn) {
	if (isSignedIn) {
		authorizeButton.style.display = 'none';
		signoutButton.style.display = 'block';
		content.style.display = 'block';
		videos.style.display = 'block';
		getChannel(defaultChannel);
	} else {
		authorizeButton.style.display = 'block';
		signoutButton.style.display = 'none';
		content.style.display = 'none';
		videos.style.display = 'none';
	}
}

function authClicked() {
	gapi.auth2.getAuthInstance().signIn();
}

function signoutClicked() {
	gapi.auth2.getAuthInstance().signOut();
}

function showChannel(data) {
	document.querySelector('#channel-data').innerHTML = data;
}

// Retrieving Channel

function getChannel(channel) {
	gapi.client.youtube.channels
		.list({
			part: 'snippet,contentDetails,statistics',
			forUsername: channel
		})
		.then((response) => {
			console.log(response);
			const channelInfo = response.result.items[0];

			const stats = `
			<ul class="collection">
               <li class="collection-item"><h6 style="color:red">Title</h6>: ${channelInfo.snippet.title}</li>
               <li class="collection-item"><h6 style="color:red">ID</h6>: ${channelInfo.id}</li>
               <li class="collection-item"><h6 style="color:red">Subscribers Count</h6>: ${numberWithCommas(
					channelInfo.statistics.subscriberCount
				)}</li>
               <li class="collection-item"><h6 style="color:red">Views</h6>: ${numberWithCommas(
					channelInfo.statistics.viewCount
				)}</li>
               <li class="collection-item"><h6 style="color:red">Videos</h6>: ${numberWithCommas(
					channelInfo.statistics.videoCount
				)}</li>
			   </ul>
			   <p>Description: ${channelInfo.snippet.description}</p>
			   <hr>
			   <a class="btn grey darken-2" target="_blank" href="https://youtube.com/${channelInfo.snippet
					.customUrl}">Go to Channel</a>
			`;
			showChannel(stats);
			const playlistId = channelInfo.contentDetails.relatedPlaylists.uploads;
			videoPlaylists(playlistId);
		})
		.catch((err) => {
			console.log(err);
		});
}

// Commas in number
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function videoPlaylists(id) {
	const requestVideos = gapi.client.youtube.playlistItems.list({
		playlistId: id,
		part: 'snippet',
		maxResults: 12
	});

	requestVideos.execute((response) => {
		console.log(response);
		const playlistItems = response.result.items;
		if (playlistItems) {
			let videoDisplayed = '<br><h4 class="center-align latest">Latest Videos</h4>';
			playlistItems.forEach((eachVideo) => {
				const videoId = eachVideo.snippet.resourceId.videoId;
				videoDisplayed += `
				<div class="col s3">
				<iframe  style="margin-right : 20px" width="250" height="auto" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
				</div>
				`;
			});
			videos.innerHTML = videoDisplayed;
		} else {
			videos.innerHTML = 'No video available on this channel';
		}
	});
}
