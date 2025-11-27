require('dotenv').config()
const axios = require('axios')
const qs = require('qs')
const Song = require('../models/song')
const Group = require('../models/group')
const User = require('../models/user')
const mongoose = require('mongoose')


const getSongs = async (_req, res) => {
  try {
    const songs = await Song.find({})
    return res.status(200).json(songs)
  } catch (error) {
    return res.status(500).json( { error: error.message } )
  }
}

const getUserSongs = async (req, res) => {
  try {
    const groupId = req.group.id
    const username = req.params.username

    if (!username) {
      return res.status(400).send({
        error: "Field username missing in url"
      })
    }
    
    const user = await User.findOne( { username: username })

    if (!user) {
      return res.status(404).send({
        error: `User ${username} not found`
      })
    }
    if (!user.group.equals(groupId)) {
      return res.status(401).end()
    }

    const data = await Song.find( { poster: user } ).sort({ created_at: -1 }) 
    return res.status(200).json(data)
  
  } catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}

const deleteSong = async (req, res) => {
  try {
    const songId = req.params.id
    const groupId = req.group.id
    console.log('delete id', songId)
    
    if (!songId) {
      return res.status(400).send({
        error: "Missing field songId in url"
      })
    }

    if (!mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ error: "Invalid song id format" })
    }

    const song = await Song.findById(songId).populate("poster")

    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

    if (!song.poster) {
      return res.status(500).json({ error: "Poster not found for this song" });
    }

    if (!song.poster.group.equals(groupId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await song.deleteOne();
    return res.status(204).end()

  } catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}


const postSong =  async (req, res) => {
  try {
    const groupId = req.group.id
    const newsong = req.body

    if (!groupId) {
      return res.status(401).end()
    }

    if (!newsong || !newsong.spotifyId || !newsong.username) {
      return res.status(400).json({
        error: 'Missing fields'
      })
    }

    const userInGroup = await User.findOne( { username : newsong.username, group: groupId } )
    const group = await Group.findById(groupId)

    if (!userInGroup) {
      return res.status(401).send({
        error: `User ${username} is not part of group ${group.name}`
      }) 
    }

    const songAlreadyRegistered = await Song.findOne({
      spotifyId : newsong.spotifyId, poster : userInGroup._id
    })

    if (songAlreadyRegistered) {
      return res.status(402).json({
        error: 'This user already registered this song'
      })
    }
    const newRegister = new Song ({
      spotifyId : newsong.spotifyId, poster : userInGroup._id
    })

    const saved = await newRegister.save()
    if (saved) {
      return res.status(201).json({
        songAdded: saved
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      error: error.message
    })
  }
}


const checkTrackId = async (req, res) => {
  try {
    const trackId = req.params.trackId
    
    if (!trackId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing field trackId in url'
      }) 
    }

    const token = await getSpotifyToken();
    if (token === -1) {
      return res.status(400).json({
      message: 'Server error when checking trackId'
    })
    }
    console.log('token', token)
    console.log('trackid', trackId)
    
    const response = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        validateStatus: (status) => {
          return status === 200 || status === 404;
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log('response get track', response.data.name)

    if (response.status === 404) {
      return res.status(404).json({
        status: 'error',
        message: 'Track not found'
      })
    }

    return res.status(200).json({
      status: 'success',
      song: `${response.data.name} by ${response.data.artists[0].name}`
    })
    
  } catch (error) {
    console.log(`Server error when checking trackId: ${error}`)
    return res.status(400).json({
      message: 'Server error when checking trackId'
    })
  }
}


async function getSpotifyToken() {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_SECRET;
  
    const token = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      qs.stringify({ grant_type: "client_credentials" }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${token}`
        }
      }
    );
  
    return response.data.access_token;
  } catch (error) {
    console.log("err gettoken", error)
    return -1
  }
}


module.exports = { 
  getSongs,
  getUserSongs,
  deleteSong,
  postSong,
  checkTrackId
}
