const { google } = require('googleapis');
const auth = require('./oauth.json');
const http = require('http');
const opn = require('open');
const fs = require('fs');
const { URL } = require('url');
const enableDestroy = require('server-destroy');
const AUTH_BASEURL = 'http://localhost:8080';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';
const { client_id, client_secret, redirect_uris } = auth.web;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);
const youtube = google.youtube({ version: 'v3' });
google.options({ auth: oauth2Client });
const scopes = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.readonly',
];

async function authenticate() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  //   const code = require('./code.json').code;
  //   console.log(code);
  //   if (code) {
  //     oauth2Client.setCredentials(await oauth2Client.getToken(code));
  //     return;
  //   }

  const server = http.createServer(async (req, res) => {
    console.log('Incoming request from ', req.url);
    try {
      if (req.url.includes('/oauth2Callback')) {
        const qs = new URL(req.url, AUTH_BASEURL).searchParams;
        res.end('Authentication successful');
        server.destroy();
        const { tokens } = await oauth2Client.getToken(qs.get('code'));
        console.log(tokens);
        oauth2Client.setCredentials(tokens);
        fs.writeFileSync('auth.json', JSON.stringify(tokens));
      }
    } catch (error) {
      console.log('Error during authentication');
      return error;
    }
  });
  server.listen(8080, () => {
    // open the browser to the authorize url to start the workflow
    opn(authUrl, { wait: false }).then((cp) => cp.unref());
  });
  enableDestroy(server); // make our server destroyable later
}
async function run() {
  try {
    //await authenticate();
    getToken();
    const { data } = await getVideosForPlaylist([
      'PLnyLMZR_kHj-ZUS2vvW9D_ciG8QqZqUTz',
    ]);
    console.log(data.items);
  } catch (error) {
    console.log(error);
  }
}
async function getToken() {
  const tokens = require('./auth.json');
  oauth2Client.setCredentials(tokens);
}
async function getPlaylists() {
  return youtube.playlists.list({
    part: ['snippet', 'contentDetails', 'id'],
    mine: true,
    maxResults: 25,
  });
}
async function getVideosForPlaylist(playlistId) {
  return youtube.playlistItems.list({
    part: ['snippet', 'contentDetails'],
    playlistId,
    maxResults: 25,
  });
}
async function getSubscriptions() {
  return youtube.subscriptions.list({
    part: ['snippet', 'contentDetails'],
    mine: true,
  });
}

//Run app

run();
