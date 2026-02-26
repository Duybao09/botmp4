const express = require("express");
const axios = require("axios");
const { Telegraf } = require("telegraf");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DOMAIN = process.env.DOMAIN;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !DOMAIN) {
  console.error("Missing BOT_TOKEN or DOMAIN");
  process.exit(1);
}

const app = express();
const bot = new Telegraf(BOT_TOKEN);

// ====== BOT ======
bot.start((ctx) => {
  ctx.reply("📥 Gửi video (.mp4), tôi sẽ trả link tải.");
});

bot.on("video", async (ctx) => {
  const fileId = ctx.message.video.file_id;
  const safeLink = `${DOMAIN}/video/${fileId}.mp4`;
  ctx.reply("✅ Link MP4:\n" + safeLink);
});

// ====== STREAM VIDEO ======
app.get("/video/:id.mp4", async (req, res) => {
  try {
    const fileId = req.params.id;

    const tgRes = await axios.get(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    );

    const filePath = tgRes.data.result.file_path;

    const telegramUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    const response = await axios({
      method: "GET",
      url: telegramUrl,
      responseType: "stream"
    });

    res.setHeader("Content-Type", "video/mp4");
    response.data.pipe(res);

  } catch (err) {
    res.status(404).send("File not found");
  }
});

// ====== WEBHOOK SETUP ======
app.use(bot.webhookCallback("/bot"));

bot.telegram.setWebhook(`${DOMAIN}/bot`);

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
