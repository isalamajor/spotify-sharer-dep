const express = require("express");
const router = express.Router();
const GroupController = require("../controllers/group");
const auth = require("../utils/auth");


console.log('auth.authentificate type:', typeof auth.authentificate);
console.log('GroupController.getGroups type:', typeof GroupController.getGroups);

// Definir rutas
router.get("/", auth.authentificate, GroupController.getGroups); 
router.post("/login", GroupController.login); 
router.post("/register", GroupController.createGroup);
router.post("/users", auth.authentificate, GroupController.addMembers);
router.delete("/:id", auth.authentificate, GroupController.deleteGroup);


// Exportar router
module.exports = router;
