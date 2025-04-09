import express from "express";
import dotenv from "dotenv";
import nodemaielr from "nodemailer";
import ejs from "ejs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
app.use(helmet());

app.set("view engine", "ejs");
app.set("trust proxy", 1);

app.use(express.json());
app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10, // 10 request in 1 min
  message: "Too many requests, please try again after 1 min.",
});
app.use(limiter);

// Transpoeter
const transporter = nodemaielr.createTransport({
  host: process.env.HOST,
  port: 465,
  secure: true,
  pool: true,
  priority: true,
  auth: {
    user: process.env.USER,
    pass: process.env.PASS,
  },
});

app.get('/',(req,res)=>{
  res.send('main')
})

// POST ~/api/send-email
app.post("/api/send-email", (req, res) => {
  const { name, email, message } = req.body;

  ejs.renderFile(path.join(__dirname, 'mail.ejs'), { name, email, message }, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error rendering email template");
    }

    const mailOptions = {
      from: email,
      to: process.env.USER,
      subject: "New message To Adsera",
      html: data,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).send(`${error} + please try again`);
      }
      console.log("Email sent: " + info.response);
      res.send("Email sent successfully");
    });
  });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server listening at http://localhost:${process.env.PORT}`);
});
