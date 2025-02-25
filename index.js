const express = require("express");
const cors = require("cors");
const sequelize = require("./config/Database");
const db = require("./models");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // 인증번호 생성을 위한 uuid 패키지지

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
  try {
    const { loginId, pwd } = req.body;

    // 사용자 조회
    const findUser = await db.users.findOne({
      where: { loginId: loginId }
    });

    if (!findUser) {
      return res.status(400).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
    }

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

app.post("/api/signup", async (req, res) => {  
  try {
    const { loginId, pwd, email, phone } = req.body;
    
    // 필수 입력값 확인
    if (!loginId || !pwd || !email || !phone) {
      return res.status(400).json({message: "모든 필드를 입력해주세요."});
    }

    // 아이디 중복 확인
    const existingUser = await db.users.findOne({where: { loginId }});
    if (existingUser) {
      return res.status(400).json({message: "이미 사용 중인 아이디입니다."});
    }
    
    // 비밀번호 해싱
    const hashedPwd = await bcrypt.hash(pwd, 10);

    // 사용자 정보 저장
    const newUser = await db.users.create({
      loginId,
      pwd: hashedPwd,
      email,
      phone
    });

    res.status(201).json({message: "회원가입 성공!", user: newUser });

  } catch (error) {
    console.log("회원가입 오류:", error);
    res.status(500).send({message: "서버 에러"});
  }
});

// 아이디 중복 확인
app.post("/api/check-username", async (req, res) => {
  try {
    const { loginId } = req.body;

    // 필수 입력값 확인
    if (!loginId) {
      return res.status(400).json({message: "아이디를 입력해주세요"});
    }

    // 아이디 중복 확인
    const existingUser = await db.users.findOne({where: { loginId }});
    if (existingUser) {
      return res.status(400).json({message: "이미 사용 중인 아이디입니다."});
    }

    res.status(200).json({message: "사용 가능한 아이디입니다."});
    
  } catch (error) {
    console.error("아이디 중복 확인 오류:", error);
    res.status(500).send({message: "서버 에러"});
  }
});

// 핸드폰 번호 인증 API
app.post("/api/verify-phone", async (req, res) => {
  try {
    const { phone } = req.body;

    // 필수 입력값 확인
    if (!phone) {
      return res.status(400).json({message: "핸드폰 번호를 입력해주세요."});
    }

    // 인증번호 생성
    const verificationCode = uuidv4().split('-')[0]; // 간단한 인증번호 생성

    // 인증번호 전송 로직 (sms 전송)
    // 실제로는 sms api를 사용하여 전송
    console.log(`핸드폰 번호: ${phone}, 인증번호: ${verificationCode}`);

    // 인증번호 저장 (예: DB 또는 메모리)
    // 여기서는 간단히 메모리에 저장
    global.verificationCode = global.verificationCode || {};
    global.verificationCode[phone] = verificationCode;

    res.status(200).json({message: "인증번호가 전송되었습니다."});

  } catch (error) {
    console.log("핸드폰 번호 인증 오류:", error);
    res.status(500).send({message: "서버 에러"});
  }
});

// 인증번호 확인 API
app.post("/api/confirm-verification-code", async (req, res) => {
  try {
    const { phone, verificationCode } = req.body;

    // 필수 입력값 확인
    if (!phone || !verificationCode) {
      return res.status(400).json({message: "핸드폰 번호와 인증번호를 입력해주세요."});
    }

    // 인증번호 확인
    if (global.verificationCodes && global.verificationCodes[phone] === verificationCode) {
      delete global.verificationCodes[phone]; // 인증번호 사용 후 삭제
      res.status(200).json({message: "인증 성공!"});
    } else {
      res.status(400).json({message: "인증번호가 올바르지 않습니다"});
    }
  } catch (error) {
    console.error("인증번호 확인 오류:", error);
    res.status(500).send({message: "서버 에러"});
  }
});