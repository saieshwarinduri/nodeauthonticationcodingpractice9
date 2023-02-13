const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");

const app = express();
app.use(express.json());
let db = null;

const intialaizeDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server has started");
    });
  } catch (error) {
    console.log(`DB error ${error.message}`);
  }
};
intialaizeDbandServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const user_get_Query = `SELECT * FROM user WHERE username = '${username}';`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const Db_user_response = await db.get(user_get_Query);
  if (Db_user_response === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const user_createQuery = `INSERT INTO user(username, name, password, gender, location)
                            VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;

      const Dbresponse = await db.run(user_createQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const user_get_query = `SELECT * FROM user WHERE username = '${username}';`;
  const userDBresponse = await db.get(user_get_query);
  if (userDBresponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordCompare = await bcrypt.compare(
      password,
      userDBresponse.password
    );
    if (passwordCompare === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      response.status(200);
      response.send("Login success!");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const password_checkQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbPasswordResponse = await db.get(password_checkQuery);
  const checkPassword = await bcrypt.compare(
    oldPassword,
    dbPasswordResponse.password
  );
  if (checkPassword === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newhashedPassword = await bcrypt.hash(newPassword, 10);
      const passwordUpdateQuery = `UPDATE user SET password = '${newhashedPassword}'`;
      const dbresponse = await db.run(passwordUpdateQuery);
      response.status(200);
      response.send("Password updated");
    }
  }
});
module.exports = app;
