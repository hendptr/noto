require('dotenv').config({ path: '.env.local' });
const { Client, LocalAuth } = require('whatsapp-web.js');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const cron = require('cron');
const { format, subDays } = require('date-fns');

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
const MilestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  description: { type: String, default: '' },
  reminders: { type: [Number], default: [1] },
  lastReminded: { type: Map, of: Boolean, default: {} }
});
const Milestone = mongoose.models.Milestone || mongoose.model('Milestone', MilestoneSchema);

const DailyEntrySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  happiness: { type: Number },
  highlight: { type: String },
  activities: { type: String },
});
const DailyEntry = mongoose.models.DailyEntry || mongoose.model('DailyEntry', DailyEntrySchema);

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
    const settings = await Settings.findOne({ id: 'global' });
    const userTz = settings?.timezone || 'Asia/Tokyo';

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
- IMPORTANT: All dates/times MUST be returned as ISO 8601 UTC strings. Convert from ${userTz} to UTC.
- For multiple spending items in one message, create ONE expense entry per item.
- Detect currency: Yen/¥/JPY → "JPY", Rupiah/Rp/IDR → "IDR". Default to "JPY" if unclear.

Return ONLY a raw JSON array:
[
  { "type": "expense", "amount": 500, "description": "Cake at Lawson", "category": "Food", "currency": "JPY", "date": "ISO string" },
  { "type": "todo", "task": "Buy groceries", "dueDate": "ISO string", "recurrence": "none" },
  { "type": "reply", "message": "Itemized confirmation" }
]

User message: "${message.body}"`;

    let response;
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (media.mimetype.startsWith('image/')) {
        const imagePrompt = `Extract expense info from this receipt. Today's local time: ${localTimeStr} (${userTz}). Return ONLY a JSON array.`;
        response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: [{ role: 'user', parts: [{ text: imagePrompt }, { inlineData: { data: media.data, mimeType: media.mimetype } }] }]
        });
      }
    } else {
      response = await ai.models.generateContent({ model: 'gemini-flash-latest', contents: textPrompt });
    }

    if (!response) return;
    const rawText = response.text;
    let jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const items = JSON.parse(jsonStr);

    for (const item of items) {
      if (item.type === 'todo') {
        const dueDate = item.dueDate ? new Date(item.dueDate) : new Date();
        await new Todo({ task: item.task, dueDate, recurrence: item.recurrence || 'none', reminders: [{ time: dueDate, sent: false }] }).save();
      } else if (item.type === 'expense') {
        const expenseDate = item.date ? new Date(item.date) : new Date();
        await new Expense({ amount: item.amount, description: item.description, category: item.category || 'Other', currency: item.currency || 'JPY', date: expenseDate, source: 'whatsapp-ai' }).save();
      }
    }
    await client.sendMessage(message.from, items.find(i => i.type === 'reply')?.message || "Saved!");
  } catch (error) {
    console.error('Gemini error:', error);
  }
}

async function checkReminders(client) {
  try {
    const settings = await Settings.findOne({ id: 'global' });
    const targetNumber = settings?.whatsappNumber;
    if (!targetNumber || settings.whatsappStatus !== 'connected') return;

    const now = new Date();
    const todos = await Todo.find({ status: 'pending', reminders: { $elemMatch: { sent: false, time: { $lte: now } } } });

    for (let todo of todos) {
      for (let reminder of todo.reminders) {
        if (!reminder.sent && reminder.time <= now) {
          const chatId = targetNumber.includes('@c.us') ? targetNumber : `${targetNumber}@c.us`;
          await client.sendMessage(chatId, `🔔 *Reminder:* ${todo.task}`);
          reminder.sent = true;
          
          let newStatus = todo.status;
          let newDueDate = todo.dueDate;
          let newReminders = [...todo.reminders];

          if (todo.recurrence !== 'none') {
            const nextTime = new Date(reminder.time);
            if (todo.recurrence === 'daily') nextTime.setDate(nextTime.getDate() + 1);
            else if (todo.recurrence === 'weekly') nextTime.setDate(nextTime.getDate() + 7);
            else if (todo.recurrence === 'mon-fri') { do { nextTime.setDate(nextTime.getDate() + 1); } while (nextTime.getDay() === 0 || nextTime.getDay() === 6); }
            newReminders.push({ time: nextTime, sent: false });
            newDueDate = nextTime;
          } else {
            newStatus = 'completed';
          }

          await Todo.findByIdAndUpdate(todo._id, { $set: { status: newStatus, reminders: newReminders, dueDate: newDueDate } });
        }
      }
    }
  } catch (err) { console.error('Reminders error:', err); }
}

async function checkMilestones(client) {
  try {
    const settings = await Settings.findOne({ id: 'global' });
    const targetNumber = settings?.whatsappNumber;
    if (!targetNumber || settings.whatsappStatus !== 'connected') return;
    const chatId = targetNumber.includes('@c.us') ? targetNumber : `${targetNumber}@c.us`;

    const now = new Date();
    const milestones = await Milestone.find();

    for (const m of milestones) {
      const daysUntil = Math.ceil((new Date(m.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) continue;

      for (const day of m.reminders) {
        const key = day.toString();
        if (daysUntil === day && !m.lastReminded.get(key)) {
          let msg = `📅 *Upcoming Milestone: ${m.title}*\n⏰ In ${daysUntil} days (${format(m.date, 'MMM d')})`;
          if (m.description) msg += `\n\n📝 *Details:*\n${m.description}`;
          await client.sendMessage(chatId, msg);
          m.lastReminded.set(key, true);
          await m.save();
        }
      }
    }
  } catch (err) { console.error('Milestones error:', err); }
}

async function sendDailyDigest(client) {
  try {
    const settings = await Settings.findOne({ id: 'global' });
    const targetNumber = settings?.whatsappNumber;
    if (!targetNumber || settings.whatsappStatus !== 'connected') return;
    const chatId = targetNumber.includes('@c.us') ? targetNumber : `${targetNumber}@c.us`;

    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0));
    const endOfDay = new Date(now.setHours(23,59,59,999));
    const tomorrowStart = new Date(startOfDay);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(endOfDay);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const expenses = await Expense.find({ date: { $gte: startOfDay, $lte: endOfDay } });
    const completedTasks = await Todo.find({ status: 'completed', updatedAt: { $gte: startOfDay, $lte: endOfDay } });
    const tomorrowTasks = await Todo.find({ status: 'pending', dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd } });
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const diary = await DailyEntry.findOne({ date: dateStr });

    let msg = `📋 *Your Day — ${format(new Date(), 'MMM d, yyyy')}*\n\n`;
    
    if (expenses.length > 0) {
      const totalJPY = expenses.filter(e => e.currency === 'JPY').reduce((s, e) => s + e.amount, 0);
      const totalIDR = expenses.filter(e => e.currency === 'IDR').reduce((s, e) => s + e.amount, 0);
      msg += `💸 *Spent:* ${totalJPY > 0 ? `¥${totalJPY.toLocaleString()}` : ''}${totalJPY > 0 && totalIDR > 0 ? ' & ' : ''}${totalIDR > 0 ? `Rp${totalIDR.toLocaleString()}` : ''}\n`;
      expenses.forEach(e => msg += `• ${e.description} (${e.currency} ${e.amount})\n`);
      msg += `\n`;
    }

    if (completedTasks.length > 0) {
      msg += `✅ *Completed:*\n`;
      completedTasks.forEach(t => msg += `• ${t.task}\n`);
      msg += `\n`;
    }

    if (tomorrowTasks.length > 0) {
      msg += `🔔 *Tomorrow:*\n`;
      tomorrowTasks.forEach(t => msg += `• ${t.task} at ${format(t.dueDate, 'HH:mm')}\n`);
      msg += `\n`;
    }

    msg += `📓 *Diary:* ${diary ? '✅ Completed' : '❌ Not written yet — don\'t forget!'}`;

    await client.sendMessage(chatId, msg);
  } catch (err) { console.error('Digest error:', err); }
}

async function sendWeeklyReflection(client) {
  try {
    const settings = await Settings.findOne({ id: 'global' });
    const targetNumber = settings?.whatsappNumber;
    if (!targetNumber || settings.whatsappStatus !== 'connected') return;
    const chatId = targetNumber.includes('@c.us') ? targetNumber : `${targetNumber}@c.us`;

    const sevenDaysAgo = subDays(new Date(), 7);
    const entries = await DailyEntry.find({ createdAt: { $gte: sevenDaysAgo } });
    const expenses = await Expense.find({ date: { $gte: sevenDaysAgo } });

    const prompt = `Based on these entries and expenses from the last 7 days, write a short, friendly, and encouraging weekly reflection for the user. Mention happiness trends and major spendings.
Entries: ${JSON.stringify(entries)}
Expenses: ${JSON.stringify(expenses)}`;

    const result = await ai.models.generateContent({ model: 'gemini-flash-latest', contents: prompt });
    await client.sendMessage(chatId, `🧠 *Weekly AI Reflection*\n\n${result.text}`);
  } catch (err) { console.error('Reflection error:', err); }
}

async function startBot() {
  await initDB();
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process', '--disable-gpu'] }
  });

  client.on('qr', async (qr) => {
    await Settings.findOneAndUpdate({ id: 'global' }, { whatsappQr: qr, whatsappStatus: 'disconnected' });
  });

  client.on('ready', async () => {
    await Settings.findOneAndUpdate({ id: 'global' }, { whatsappQr: '', whatsappStatus: 'connected' });
    
    new cron.CronJob('* * * * *', () => checkReminders(client)).start();
    new cron.CronJob('0 9 * * *', () => checkMilestones(client)).start(); // 9 AM check
    new cron.CronJob('0 22 * * *', () => sendDailyDigest(client)).start(); // 10 PM digest
    new cron.CronJob('0 20 * * 0', () => sendWeeklyReflection(client)).start(); // Sunday 8 PM reflection
  });

  client.on('message', async msg => {
    if (msg.from.endsWith('@g.us') || msg.from === 'status@broadcast') return;
    await processMessageWithGemini(msg, client);
  });

  client.initialize();
}

startBot();
