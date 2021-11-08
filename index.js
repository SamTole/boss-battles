require('dotenv').config()
const express = require('express')
const jwt = require("jsonwebtoken");
const rpc = require("./src/utils/rpcQuery");
const argon2 = require('argon2');

const app = express(
    [express.urlencoded({ extended: true }),
    express.json()]
);
app.use(express.json());


// Enables Socket.IO
const server = require("./src/utils/socket.js")(app);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/src/index.html');
});


// Register
app.post("/register", async (req, res) => {
    // Our register logic starts here
    try {
        // Get user input
        const {username, password} = req.body;

        // Validate user input
        if (!(username && password)) {
            return res.status(400).send("All fields required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const oldUserQuery = "SELECT count(*) FROM PlayerInfo WHERE Username = \"" + username + "\";"
        const oldUser = await rpc(oldUserQuery)
        console.log(oldUser["count(*)"])

        if (oldUser["count(*)"] > 0) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        const encryptedPassword = await argon2.hash(password, 10)

        // Create user in our database
        const createUserQuery = "INSERT INTO PlayerInfo VALUES (\"" + username + "\", 0, \"Elon Musk\", 0, 0, 0, \"" + encryptedPassword + "\"" +");"
        const UserQuery = await rpc(createUserQuery) //const createUser =

        // Create token
        const token = jwt.sign(
            { username: username },
            process.env.TOKEN_KEY,
            {
                expiresIn: "72h",
            }
        );

        res.status(201).json(token);
    } catch (err) {
        console.log(err);
    }
    // Our register logic ends here
});

// Login
app.post("/login", async (req, res) => {

    // Our login logic starts here
    try {
        // Get user input
        const { username, password } = req.body;

        // Validate user input
        if (!(username && password)) {
            return res.status(400).send("All input is required");
        }
        // Validate if user exist in our database
        const userQuery = "SELECT Pwdhash FROM PlayerInfo WHERE Username = \"" + username + "\";"
        const user = await rpc(userQuery)
        //await bcrypt.compare(password.toString(), user["Pwdhash"].toString())
        if (user && (await argon2.verify(user["Pwdhash"].toString(), password.toString()))) {
            // Create token
            // save user token
            const token = jwt.sign(
                { username: username },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "72h",
                }
            );
            return res.status(200).json(token);
        }
        return res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
    // Our register logic ends here
});

//test auth.js
const auth = require("./src/middleware/auth");
app.post("/welcome", auth, (req, res) => {
    res.status(200).send("Welcome");
});






server.listen(process.env.SERVER_PORT, () => {
    console.log(`Server now running at ${process.env.SERVER_PORT}`);
});
