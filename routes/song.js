const express = require("express");
const router = express.Router();
const SongController = require("../controllers/song");
const auth = require("../utils/auth");


// Definir rutas
router.get("/", SongController.getSongs); 
router.get("/:username", auth.authentificate, SongController.getUserSongs); 
router.post("/", auth.authentificate, SongController.postSong);
router.delete("/:id", auth.authentificate, SongController.deleteSong);
router.get("/check/:trackId", auth.authentificate, SongController.checkTrackId); 


// Exportar router
module.exports = router;
