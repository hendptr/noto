require('dotenv').config({ path: '.env.local' });
const { Client, LocalAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const cron = require('cron');

// Define models directly to avoid TypeScript import errors in standalone JS
const SettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'global', unique: true },
  whatsappNumber: { type: String, default: '' },
  whatsappQr: { type: String, default: '' },
  whatsappStatus: { type: String, default: 'disconnected' },
  timezone: { type: String, default: 'Asia/Tokyo' },
});
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

const ReminderSchema = new mongoose.Schema({
  time: { type: Date, required: true },
  sent: { type: Boolean, default: false }
});
const TodoSchema = new mongoose.Schema({
  task: { type: String, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  reminders: [ReminderSchema],
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'mon-fri'], default: 'none' },
  createdAt: { type: Date, default: Date.now },
});
const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema);

const ExpenseSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, default: 'Uncategorized' },
  currency: { type: String, enum: ['IDR', 'JPY'], default: 'IDR' },
  date: { type: Date, default: Date.now },
  source: { type: String, enum: ['manual', 'whatsapp-ai'], default: 'manual' }
});
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function initDB() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log('MongoDB Connected');

  // Create default settings if not exists
  let settings = await Settings.findOne({ id: 'global' });
  if (!settings) {
    settings = new Settings({ id: 'global' });
    await settings.save();
  }
}

async function processMessageWithGemini(message, client) {
  try {
    // Read user's timezone from settings (auto-synced from their browser)
    const settings = await Settings.findOne({ id: 'global' });
    const userTz = settings?.timezone || 'Asia/Tokyo';

    // Format current time in the user's local timezone
    const now = new Date();
    const localTimeStr = now.toLocaleString('en-US', {
      timeZone: userTz,
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    const textPrompt = `You are a helpful personal assistant bot for the Noto app. The user is sending you a message.
The user's current local date and time is: ${localTimeStr} (timezone: ${userTz}).

Analyze the message. It may contain ONE or MULTIPLE expenses or todos in a single sentence.

Rules:
- ALWAYS return a valid JSON array, even for just one item.
- Parse natural language dates like "today", "yesterday", "last night", "tadi", "kemarin", specific dates, etc.
- IMPORTANT: All dates/times MUST be returned as ISO 8601 UTC strings. When the user says a time like "11 AM", that means 11 AM in their local timezone (${userTz}). You MUST convert it to UTC before returning. For example, if the user is in Asia/Tokyo (UTC+9) and says "11 AM", the UTC time would be 02:00:00.000Z.
- Default to today if date is not mentioned.
- For multiple spending items in one message, create ONE expense entry per item.
- Detect currency: Yen/¥/JPY → "JPY", Rupiah/Rp/IDR → "IDR". Default to "JPY" if unclear (user lives in Japan).

Return ONLY a raw JSON array (no markdown, no backticks) structured exactly like this:
[
  { "type": "expense", "amount": 500, "description": "Cake at Lawson", "category": "Food", "currency": "JPY", "date": "2026-05-02T00:00:00.000Z" },
  { "type": "expense", "amount": 300, "description": "Milk", "category": "Food", "currency": "JPY", "date": "2026-05-02T00:00:00.000Z" },
  { "type": "todo", "task": "Buy groceries", "dueDate": "2026-05-03T02:00:00.000Z", "recurrence": "none" },
  { "type": "reply", "message": "✅ Saved today's spending:\n• Coffee and bread — ¥450 (Food)\n• Transport — ¥1,000 (Transport)\nTotal: ¥1,450 for today!" }
]

The LAST element MUST always be { "type": "reply", "message": "..." }.
The reply MUST be itemized — list every expense with its amount+currency+category, every todo task name. End with a total if there are expenses.

User message: "${message.body}"`;

    let response;

    // If the message has an image (receipt)
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (media.mimetype.startsWith('image/')) {
        const imagePrompt = `You are an AI expense tracker. The user's current local date and time is: ${localTimeStr} (timezone: ${userTz}).
Read this receipt/image. Extract:
- Total amount paid
- Store/vendor name as description
- Best category (Food/Transport/Shopping/Utilities/Other)
- Currency: Yen/¥ → "JPY", Rupiah/Rp → "IDR". Default "JPY" if unclear.
- Date: use the date printed on the receipt if visible, otherwise today. Return as ISO 8601 UTC string (convert from ${userTz} to UTC).

Return ONLY a raw JSON array (no markdown):
[
  { "type": "expense", "amount": 500, "description": "Store Name", "category": "Food", "currency": "JPY", "date": "ISO date string" },
  { "type": "reply", "message": "Friendly confirmation of what was logged" }
]`;

        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [
            {
              role: 'user',
              parts: [
                { text: imagePrompt },
                { inlineData: { data: media.data, mimeType: media.mimetype } }
              ]
            }
          ]
        });
      }
    } else {
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: textPrompt
      });
    }

    if (!response) {
      console.log('No response from Gemini (media was not an image?)');
      return;
    }

    const rawText = response.text;
    console.log('Gemini raw response:', rawText);

    if (!rawText) {
      console.error('Gemini returned empty text. Full response:', JSON.stringify(response.candidates));
      await client.sendMessage(message.from, "Sorry, I couldn't understand that right now. 😔");
      return;
    }

    let jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const items = JSON.parse(jsonStr);

    if (!Array.isArray(items)) {
      throw new Error('Gemini did not return a JSON array');
    }

    let replyMessage = '';
    let savedCount = 0;

    for (const item of items) {
      if (item.type === 'reply') {
        replyMessage = item.message;
        continue;
      }

      if (item.type === 'todo') {
        const dueDate = item.dueDate ? new Date(item.dueDate) : new Date();
        const newTodo = new Todo({
          task: item.task,
          dueDate: dueDate,
          recurrence: item.recurrence || 'none',
          reminders: [{ time: dueDate, sent: false }]
        });
        await newTodo.save();
        console.log(`✅ Todo saved: "${item.task}" due ${dueDate.toISOString()}`);
        savedCount++;
      } else if (item.type === 'expense') {
        const expenseDate = item.date ? new Date(item.date) : new Date();
        const newExpense = new Expense({
          amount: item.amount,
          description: item.description,
          category: item.category || 'Other',
          currency: item.currency || 'JPY',
          date: expenseDate,
          source: 'whatsapp-ai'
        });
        await newExpense.save();
        console.log(`💸 Expense saved: ${item.currency} ${item.amount} — "${item.description}" on ${expenseDate.toDateString()}`);
        savedCount++;
      }
    }

    const finalReply = replyMessage || `✅ Saved ${savedCount} item(s)!`;
    await client.sendMessage(message.from, finalReply);

  } catch (error) {
    console.error('Gemini processing error:', error);
    await client.sendMessage(message.from, "Sorry, I couldn't process that right now. 😔");
  }
}

let isCheckingReminders = false;

async function checkReminders(client) {
  if (isCheckingReminders) return; // Prevent overlapping cron jobs
  isCheckingReminders = true;

  try {
    const settings = await Settings.findOne({ id: 'global' });
    const targetNumber = settings?.whatsappNumber;

    if (!targetNumber || settings.whatsappStatus !== 'connected') return;

    const now = new Date();

    // Use $elemMatch to ensure the SAME reminder element matches BOTH conditions
    const todos = await Todo.find({
      status: 'pending',
      reminders: {
        $elemMatch: {
          sent: false,
          time: { $lte: now }
        }
      }
    });

    for (let todo of todos) {
      let updated = false;
      for (let reminder of todo.reminders) {
        if (!reminder.sent && reminder.time <= now) {
          const chatId = targetNumber.includes('@c.us') ? targetNumber : `${targetNumber}@c.us`;
          try {
            await client.sendMessage(chatId, `🔔 *Reminder:* ${todo.task}`);
            reminder.sent = true;
            updated = true;
            console.log(`✅ Reminder sent for: "${todo.task}"`);
          } catch (e) {
            console.error('Failed to send WA reminder:', e);
          }
        }
      }

      if (!updated) continue;

      let newStatus = todo.status;
      let newDueDate = todo.dueDate;
      let newReminders = [...todo.reminders];

      if (todo.recurrence !== 'none') {
        const lastReminder = todo.reminders[todo.reminders.length - 1].time;
        const nextTime = new Date(lastReminder);

        if (todo.recurrence === 'daily') {
          nextTime.setDate(nextTime.getDate() + 1);
        } else if (todo.recurrence === 'weekly') {
          nextTime.setDate(nextTime.getDate() + 7);
        } else if (todo.recurrence === 'mon-fri') {
          do { nextTime.setDate(nextTime.getDate() + 1); }
          while (nextTime.getDay() === 0 || nextTime.getDay() === 6);
        } else if (todo.recurrence === 'mon-wed-fri') {
          const valid = [1, 3, 5];
          do { nextTime.setDate(nextTime.getDate() + 1); }
          while (!valid.includes(nextTime.getDay()));
        } else if (todo.recurrence === 'tue-thu') {
          const valid = [2, 4];
          do { nextTime.setDate(nextTime.getDate() + 1); }
          while (!valid.includes(nextTime.getDay()));
        } else if (todo.recurrence === 'custom' && todo.customDays?.length > 0) {
          do { nextTime.setDate(nextTime.getDate() + 1); }
          while (!todo.customDays.includes(nextTime.getDay()));
        }

        newReminders.push({ time: nextTime, sent: false });
        newDueDate = nextTime;
        console.log(`🔁 Next "${todo.recurrence}" reminder scheduled for: ${nextTime.toISOString()}`);
      } else {
        newStatus = 'completed';
        console.log(`✅ Todo completed: "${todo.task}"`);
      }

      await Todo.findByIdAndUpdate(todo._id, {
        $set: {
          status: newStatus,
          reminders: newReminders,
          dueDate: newDueDate
        }
      });
    }
  } catch (err) {
    console.error('checkReminders error:', err);
  } finally {
    isCheckingReminders = false;
  }
}

async function startBot() {
  await initDB();

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  });

  client.on('qr', async (qr) => {
    console.log('QR RECEIVED');
    await Settings.findOneAndUpdate({ id: 'global' }, { whatsappQr: qr, whatsappStatus: 'disconnected' });
  });

  client.on('ready', async () => {
    console.log('Client is ready!');
    await Settings.findOneAndUpdate({ id: 'global' }, { whatsappQr: '', whatsappStatus: 'connected' });

    // Start Cron Job for Reminders (every minute)
    const job = new cron.CronJob('* * * * *', () => {
      checkReminders(client);
    });
    job.start();
    console.log('⏰ Reminder cron job started (checks every minute)');
  });

  client.on('message', async msg => {
    console.log(`\n--- RAW MESSAGE RECEIVED ---`);
    console.log(`From: ${msg.from}`);
    console.log(`Body: ${msg.body ? msg.body.substring(0, 100) : '[no text body]'}`);
    console.log(`Has Media: ${msg.hasMedia}`);

    // Ignore messages from status broadcasts and groups
    if (msg.from === 'status@broadcast') {
      console.log('Ignored: Status broadcast message.');
      return;
    }
    if (msg.from.endsWith('@g.us')) {
      console.log('Ignored: Group message.');
      return;
    }

    console.log('✅ Processing with Gemini...');
    await processMessageWithGemini(msg, client);
  });

  client.on('disconnected', async () => {
    console.log('Client was logged out');
    await Settings.findOneAndUpdate({ id: 'global' }, { whatsappQr: '', whatsappStatus: 'disconnected' });
  });

  client.initialize();
}

startBot();
