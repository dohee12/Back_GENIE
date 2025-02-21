const express = require("express");
const cors = require("cors");
const sequelize = require("./config/Database");
const db = require("./models");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 8000;

/** CORS 설정 */
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, // 쿠키 전달 허용
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    await db.sequelize.sync({ alter: true });
    console.log("DB 연결 성공");
  } catch (error) {
    console.error("DB 연결 실패: " + error);
  }
};

// 서버 실행 전에 DB 초기화 실행
initDatabase();

app.post("/api/login", async (req, res) => {
  console.log("요청 데이터:", req.body);
  
  try {
    const { loginId, pwd } = req.body;

    // 사용자 조회
    const findUser = await db.users.findOne({
      where: { loginId: loginId }
    });

    if (!findUser) {
      return res.status(400).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }

    // 필드명 확인
    console.log("DB에서 가져온 사용자 정보:", findUser);
    console.log("사용자가 입력한 비밀번호:", pwd);
    console.log("DB 저장된 비밀번호", findUser.pwd);

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(pwd, findUser.pwd);
    if (!isMatch) {
      return res.status(400).json({message:"아이디 또는 비밀번호가 올바르지 않습니다"});
    }

    // JWT 발급
    const token = jwt.sign(
      { userId: findUser.userId }, 
      process.env.JWT_SECRET || 'yourSecretKey', 
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      message: "로그인 성공!", 
      token 
    });

  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).send({ message: "서버 에러" });
  }
});

app.listen(port, () => {
  console.log(`서버 실행 중! http://localhost:${port}`);
});

const updatePasswords = async () => {
  try {
    const users = await db.users.findAll();
    for (let user of users) {
      if (!user.pwd.startsWith("$2b$")) {  // 이미 해싱된 비밀번호는 건너뜀
        const hashedPwd = await bcrypt.hash(user.pwd, 10);
        await user.update({ pwd: hashedPwd });
        console.log(`사용자 ${user.loginId} 비밀번호 업데이트 완료`);
      }
    }
  } catch (error) {
    console.error("비밀번호 업데이트 중 오류 발생:", error);
  }
};

// 서버 실행 시 한 번 실행하여 기존 비밀번호 업데이트
updatePasswords();

