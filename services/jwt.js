const config = require('../utils/config')
const jwt = require("jwt-simple");
const moment = require("moment");

// Clave secreta
const secret = config.SECRET_KEY
// Función para generar tokens
createToken = (group) => {
    const payload = { // Info del grupo que vamos a tener disponible en la sesión
        id: group._id,
        groupname: group.name,
        iat: moment().unix(), // Momento en el que se crea el payload
        ex: moment().add(10, "days").unix() // Fecha de expiración de la sesión
    };
    return jwt.encode(payload, secret); // Generar JWT
}

module.exports = {
    createToken, 
    secret
}