const Group = require('../models/group')
const User = require('../models/user')
const Songs = require('../models/song')
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt");
const { info, error } = require('../utils/logger')

const MAX_USERS_PER_GROUP = 6


const getGroups =  async (_req, res) => {
  try {
    const groups = await Group.find({})
    return res.status(200).json(groups)
  } catch (error) {
    return res.status(500).json( { error: error.message } )
  }
}

// Get group, its users and everyone's songs; by its name and password
const login = async (req, res) => {
  try {
    const { groupName, password } = req.body
    if (!groupName || !password) {
      return res.status(403).send({
        error: 'Missing fields'
      })
    }
    let group = await Group.findOne( { name : groupName } )
    if (!group) {
      return res.status(404).send({
        error: 'Group not found'
      })
    }
    
    // Check password
    let pwd = bcrypt.compareSync(password, group.password)
    if (!pwd) {
        return res.status(400).json({
            error: "Wrong password"
        });
    }

    // Generar token JWT
    const token = jwt.createToken(group);

    // Get users and their songs
    const users = await User.find( { group : group._id } ).select("username")
    const usersWithSongs = await Promise.all(
      users.map(async (user) => {
        const songs = await Songs.find({ poster: user._id }).select("spotifyId created_at").sort({ created_at: -1 }).lean()
        return { ...user.toObject(), songs }
      })
    )

    const groupObj = group.toObject()
    delete groupObj.password
    groupObj.members = usersWithSongs

    return res.status(200).json({
      groupData: groupObj,
      token: token
    })

  } catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}


const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    
    if (groupId.toString() !== req.group.id.toString()) {
      return res.status(401).end();
    }

    const deleted = await Group.findByIdAndDelete(groupId);

    if (deleted) {
      return res.status(204).end();
    }

    return res.status(404).end();
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};


const createGroup = async (req, res) => {
    try {
        // Recoger parámetros
        const params = req.body;

        // Validación
        if (!params.groupName || !params.password) {
            return res.status(400).json({
                error: "Missing fields"
            });
        }

        // Evitar group names duplicados
        let groups = await Group.find({ name: params.groupName });
        if (groups.length > 0) {
            return res.status(400).json({
                error: "Groupname in use"
            });
        }
        
        // Cifrar contraseña
        const hashedPassword = await bcrypt.hash(params.password, 10);

        // Crear objeto grupo
        const newGroup = new Group({
          name: params.groupName,
          password: hashedPassword
        });

        // Guardar usuario en BD
        const groupSaved = await newGroup.save();
        delete groupSaved.password

        // Generar token JWT
        const token = jwt.createToken(groupSaved);

        // Éxito
        return res.status(200).json({
            groupSaved,
            token
        });
    } catch (error) {
        console.log("Error en el registro:", error);
        return res.status(500).json({
            error: error.message
        });
    }
}


const addMembers = async (req, res) => {
  try {
    // Obtener el ID del grupo autenticado desde el token
    const groupId = req.group.id;
    const usernames = req.body.usernames

    if (!groupId) {
      return res.status(401).send({
        error: 'Unauthorized.'
      })
    }

    if (!usernames || usernames.length < 1) {
      return res.status(403).send({
        error: 'No field usernames entered or array is empty'
      })
    }

    const members = await User.find({ group : groupId })

    if (usernames.length + members.length > MAX_USERS_PER_GROUP) {
      return res.status(400).send({
        error: `The group can have at most ${MAX_USERS_PER_GROUP} users. It now has ${members.length} members, it can only have ${MAX_USERS_PER_GROUP - members.length} more.`
      })
    }

    let usersAdded = []

    for (const username of usernames) {
      const usernameTaken = await User.findOne({ username, group: groupId })
      if (usernameTaken) continue

      const newUser = new User({ username, group: groupId })
      const added = await newUser.save()
      if (added) usersAdded.push(added.username)
    }

    const membersUpdated = await User.find({ group: groupId }).select("username")

    return res.status(200).send({
      members: membersUpdated
    })

  } catch (error) {
    console.log(`Error en el registro de usuarios: ${error}`);
    return res.status(500).json({
        error: error.message
    });
  }
}





module.exports = {
  getGroups,
  login,
  deleteGroup,
  createGroup,
  addMembers
}
