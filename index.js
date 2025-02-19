const express = require("express");
const cors = require("cors");
const sequelize = require("./config/Database");
// const { sequelize } = require("./models");
const db = require("./models");
const app = express();
const port = 8000;

/**
 
cors 설정*/
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(express.json());
app.use(cors(corsOptions));

// const initDatabase = async () => {
//   try {
//     await sequelize.authenticate();
//     await db.sequelize.sync({ force: true });
//   } catch (error) {
//     console.error("not connect DB! : " + error);
//   }
// }

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// app.get("/login", (req, res) => {
//     res.send("Hello World login!");
// });

// app.post("/password", (req, res) => {
//     res.send(JSON.stringify(req.body))
//     console.log("들어온 값" + JSON.stringify(req.body.message));
// });

app.post("/api/login", async (req, res) => {
  try {
    const { loginId, password } = req.body;
    console.log (loginId, password)
    const findUsers = await db.users.findOne({
      where: {
        loginId: loginId,
        pwd: password,
      },
    });

    if (findUsers) {
    res.status(200).json({ message: "로그인 성공!"});
    } else {
      res.status(400).json({ message: "로그인 실패!"});
    }
  } catch (error) {
    res.status(500).send({ message: "서버 에러"});
    console.error(error);
  }
});