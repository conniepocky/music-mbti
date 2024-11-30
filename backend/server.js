const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = "cd2f2b18040840dbb309819867b80e25";
const CLIENT_SECRET = "1732d834e9f14d96a01a92a76f59a69d";
const REDIRECT_URI = "http://localhost:3000/callback";

app.use(cors());
app.use(express.json());

const path = require("path");

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/login", (req, res) => {
    const scopes = "user-top-read user-library-read";
    const spotifyAuthURL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
    )}&scope=${encodeURIComponent(scopes)}`;
    res.redirect(spotifyAuthURL);
});

app.get("/callback", async (req, res) => {
    const code = req.query.code;

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
            `${CLIENT_ID}:${CLIENT_SECRET}`
            ).toString("base64")}`,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
        }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const topArtistsResponse = await fetch(
        "https://api.spotify.com/v1/me/top/artists",
        {
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });

    const topTracksResponse = await fetch(
        "https://api.spotify.com/v1/me/top/tracks",
        {
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });

    const topTracks = await topTracksResponse.json();

    const topArtists = await topArtistsResponse.json();

    const mbtiType = inferMBTI(topArtists.items, topTracks.items);

    res.redirect(`/result.html?mbti=${mbtiType}`);
});

// MBTI inference function
function inferMBTI(artists, tracks) {
    let traits = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    const processGenres = (genres) => {
        genres.forEach((genre) => {
            // E vs I
            if (genre.includes("pop") || genre.includes("dance") || genre.includes("hip hop") || genre.includes("rock") || genre.includes("reggae") || genre.includes("electronic") || genre.includes("indie pop")) {
                traits.E++;
            }
            if (genre.includes("ambient") || genre.includes("acoustic") || genre.includes("classical") || genre.includes("folk") || genre.includes("blues") || genre.includes("jazz") || genre.includes("lo-fi")) {
                traits.I++;
            }

            // S vs N
            if (genre.includes("classical") || genre.includes("jazz") || genre.includes("blues") || genre.includes("reggae") || genre.includes("rock") || genre.includes("country") || genre.includes("folk") || genre.includes("electronic")) {
                traits.S++;
            }
            if (genre.includes("experimental") || genre.includes("indie") || genre.includes("psychedelic") || genre.includes("ambient") || genre.includes("synthwave") || genre.includes("new wave")) {
                traits.N++;
            }

            // T vs F
            if (genre.includes("rock") || genre.includes("metal") || genre.includes("punk") || genre.includes("classical") || genre.includes("electronic") || genre.includes("instrumental")) {
                traits.T++;
            }
            if (genre.includes("soul") || genre.includes("romantic") || genre.includes("pop") || genre.includes("r&b") || genre.includes("ballads") || genre.includes("acoustic") || genre.includes("folk")) {
                traits.F++;
            }

            // J vs P
            if (genre.includes("classical") || genre.includes("rock") || genre.includes("jazz") || genre.includes("blues") || genre.includes("country") || genre.includes("indie pop") || genre.includes("synthwave")) {
                traits.J++;
            }
            else {
                traits.P++;
            }
        });
    };

    artists.forEach((artist) => {
        const genres = artist.genres; 
        processGenres(genres);
    });

    tracks.forEach((track) => {
        const album = track.album;
        if (album && album.genres) {
            processGenres(album.genres);  
        }
    });

    const E_I = traits.E > traits.I ? "E" : "I";
    const S_N = traits.S > traits.N ? "S" : "N";
    const T_F = traits.T > traits.F ? "T" : "F";
    const J_P = traits.J > traits.P ? "J" : "P";

    return `${E_I}${S_N}${T_F}${J_P}`;
}


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
