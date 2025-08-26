/**
 * Hotiro WhatsApp Bot
 * Base: Baileys WhatsApp Web API
 * Mode: Pairing Code (tanpa QR)
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@adiwajshing/baileys");
const P = require("pino");

// === CONFIG ===
const OWNER_NUMBER = "6281234567890"; // ganti dengan nomor kamu
const BOT_NAME = "Hotiro";

// === START BOT ===
async function startHotiro() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: false, // QR dimatikan
    auth: state,
    browser: [BOT_NAME, "Chrome", "10.0"],
    version
  });

  sock.ev.on("creds.update", saveCreds);

  // === Pairing code (sekali login) ===
  if (!sock.authState.creds.registered) {
    const phoneNumber = OWNER_NUMBER;
    const code = await sock.requestPairingCode(phoneNumber);
    console.log("========== HOTIRO ==========");
    console.log(`Masukkan kode ini di WhatsApp (${phoneNumber}): ${code}`);
    console.log("============================");
  }

  // === Connection update ===
  sock.ev.on("connection.update", (update) => {
    const { connection } = update;
    if (connection === "open") {
      console.log(`✅ ${BOT_NAME} connected!`);
    } else if (connection === "close") {
      console.log("❌ Connection closed, reconnecting...");
      startHotiro();
    }
  });

  // === Message handler ===
  sock.ev.on("messages.upsert", async (m) => {
    if (m.type !== "notify") return;

    for (let msg of m.messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const from = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const command = text.trim().toLowerCase();

      if (command === "allmenu") {
        const menu = `
╔═══「 *HOTIRO MENU* 」
║ • allmenu  -> Tampilkan menu
║ • ping     -> Cek bot aktif
║ • info     -> Info bot
║ • help     -> Bantuan
╚═══════════════════
        `;
        await sock.sendMessage(from, { text: menu }, { quoted: msg });
      }

      if (command === "ping") {
        await sock.sendMessage(from, { text: "🏓 Pong! Bot aktif." }, { quoted: msg });
      }

      if (command === "info") {
        await sock.sendMessage(
          from,
          {
            text: `🤖 ${BOT_NAME} aktif!\nOwner: ${OWNER_NUMBER}\nLibrary: Baileys\nMode: Pairing Code`
          },
          { quoted: msg }
        );
      }

      if (command === "help") {
        await sock.sendMessage(
          from,
          { text: "Ketik *allmenu* untuk lihat semua perintah." },
          { quoted: msg }
        );
      }
    }
  });
}

startHotiro();