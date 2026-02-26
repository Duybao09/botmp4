const express = require("express");
const axios = require("axios");
const { Telegraf } = require("telegraf");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DOMAIN = process.env.DOMAIN;

const app = express();
const bot = new Telegraf(BOT_TOKEN);

const fileCache = new Map();

// ================= BOT =================
bot.start((ctx) => {
  ctx.reply("📥 Gửi video (.mp4), tôi sẽ trả link ẩn token.");
});

bot.on("video", async (ctx) => {
  try {
    const fileId = ctx.message.video.file_id;

    const res = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );

    const filePath = res.data.result.file_path;

    if (!filePath.endsWith(".mp4")) {
      return ctx.reply("❌ Video không phải .mp4");
    }

    fileCache.set(fileId, filePath);

    const safeLink = `${DOMAIN}/video/${fileId}`;
    ctx.reply("✅ Link MP4:\n" + safeLink);

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Lỗi xử lý video!");
  }
});

// ================= API STREAM =================
app.get("/video/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    const filePath = fileCache.get(fileId);

    if (!filePath) {
      return res.status(404).send("File không tồn tại hoặc đã hết hạn");
    }

    const telegramUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    const response = await axios({
      method: "GET",
      url: telegramUrl,
      responseType: "stream"
    });

    res.setHeader("Content-Type", "video/mp4");
    response.data.pipe(res);

  } catch (err) {
    res.status(500).send("Server error");
  }
});

// ================= START =================
const PORT = process.env.PORT || 3000;

bot.launch();
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
