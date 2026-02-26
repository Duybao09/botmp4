const express = require("express");
const axios = require("axios");
const { Telegraf } = require("telegraf");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DOMAIN = process.env.DOMAIN;

if (!BOT_TOKEN || !DOMAIN) {
  console.error("❌ Thiếu BOT_TOKEN hoặc DOMAIN trong ENV");
  process.exit(1);
}

const app = express();
const bot = new Telegraf(BOT_TOKEN);

// ================= BOT =================
bot.start((ctx) => {
  ctx.reply("📥 Gửi video (.mp4), tôi sẽ trả link tải trực tiếp.");
});

bot.on("video", async (ctx) => {
  try {
    const fileId = ctx.message.video.file_id;

    // Tạo link có đuôi .mp4
    const safeLink = `${DOMAIN}/video/${fileId}.mp4`;

    await ctx.reply("✅ Link MP4:\n" + safeLink);

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Lỗi xử lý video!");
  }
});

// ================= STREAM VIDEO =================
app.get("/video/:id.mp4", async (req, res) => {
  try {
    const fileId = req.params.id;

    // Lấy file_path từ Telegram mỗi lần mở link
    const tgRes = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );

    if (!tgRes.data.ok) {
      return res.status(404).send("File not found");
    }

    const filePath = tgRes.data.result.file_path;

    if (!filePath.endsWith(".mp4")) {
      return res.status(400).send("Not mp4 file");
    }

    const telegramUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    const response = await axios({
      method: "GET",
      url: telegramUrl,
      responseType: "stream"
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `inline; filename="${fileId}.mp4"`);

    response.data.pipe(res);

  } catch (err) {
    console.log(err.message);
    res.status(404).send("File not found");
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

bot.launch();
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
