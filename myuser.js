// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
const token = 'BQBllanGG7-9UVoYVGM4Eqz2zM-hxI7NW3kPGvsYSteU2qv3FCwR-MZKyDbOrZaLb0w-cPSVH9lzZJXTvYUInhR0zzwZ1ECENdXPsXvtDVB1vOmz-5SAZbPMa2kfu5RN6gxoQaQAYgEnNo8Hl1IjTH-KCZ_U6v9TlJnEw5JEF13cgMe9GqqiTyES8Myr1aQBwYhXP9FTYiO0qftFUg0pmHuwy4WLKl2inuGBLRtrc6FaqLA8m9jB0LYjVWIn9rOiOZtaQ6qm8Jo4YGwL0tzHdRNNbA4FFatpwwdLKSNwFsYmrEwOszHQ2dUP';
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getTopTracks(){
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

const topTracks = await getTopTracks();
console.log(
  topTracks?.map(
    ({name, artists}) =>
      `${name} by ${artists.map(artist => artist.name).join(', ')}`
  )
);
