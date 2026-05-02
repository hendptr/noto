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
  const settings = await Settings.findOne({ id: 'global' });
  const targetNumber = settings.whatsappNumber;
  
  // Only process if it's from the target number
  if (targetNumber && !message.from.includes(targetNumber)) {
    return;
  }

  try {
    let prompt = `You are a helpful personal assistant bot for the Noto app. The user is sending you a message. 
    Analyze the message. Is it a request to create a Todo/Reminder, or an Expense?
    Respond ONLY in JSON format:
    For Todo: { "type": "todo", "task": "string", "dueDate": "ISO Date string or null", "recurrence": "none|daily|weekly|mon-fri", "reply": "A friendly confirmation message" }
    For Expense: { "type": "expense", "amount": number, "description": "string", "category": "string", "reply": "A friendly confirmation message" }
    Message: "${message.body}"`;

    let response;
    
    // If the message has an image (receipt)
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      if (media.mimetype.startsWith('image/')) {
        prompt = `You are an AI expense tracker. Read this receipt/image. 
        Extract the total amount, description (store name), and best category.
        Respond ONLY in JSON: { "type": "expense", "amount": number, "description": "string", "category": "string", "reply": "Friendly confirmation" }`;
        
        response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                prompt,
                { inlineData: { data: media.data, mimeType: media.mimetype } }
            ]
        });
      }
    } else {
      // Text only
      response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt
      });
    }

    if (!response || !response.text) return;
    
    let jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);

    if (data.type === 'todo') {
      const newTodo = new Todo({
        task: data.task,
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        recurrence: data.recurrence || 'none',
        reminders: [{ time: data.dueDate ? new Date(data.dueDate) : new Date(), sent: false }]
      });
      await newTodo.save();
      client.sendMessage(message.from, `✅ ${data.reply}`);
    } else if (data.type === 'expense') {
      const newExpense = new Expense({
        amount: data.amount,
        description: data.description,
        category: data.category,
        source: 'whatsapp-ai'
      });
      await newExpense.save();
      client.sendMessage(message.from, `💸 ${data.reply}`);
    }

  } catch (error) {
    console.error('Gemini error:', error);
    client.sendMessage(message.from, "Sorry, I couldn't process that right now. 😔");
  }
}

async function checkReminders(client) {
  const settings = await Settings.findOne({ id: 'global' });
  const targetNumber = settings?.whatsappNumber;
  
  if (!targetNumber || settings.whatsappStatus !== 'connected') return;

  const now = new Date();
  
  // Find todos with unsent reminders whose time has passed
  const todos = await Todo.find({
    status: 'pending',
    'reminders.sent': false,
    'reminders.time': { $lte: now }
  });

  for (let todo of todos) {
    let updated = false;
    for (let reminder of todo.reminders) {
      if (!reminder.sent && reminder.time <= now) {
        // Send WhatsApp Message
        const chatId = targetNumber.includes('@c.us') ? targetNumber : `${targetNumber}@c.us`;
        try {
          await client.sendMessage(chatId, `🔔 *Reminder:* ${todo.task}`);
          reminder.sent = true;
          updated = true;
        } catch (e) {
          console.error('Failed to send WA reminder:', e);
        }
      }
    }
    
    // Handle recurrence
    if (todo.recurrence !== 'none' && updated) {
        // Simple logic for recurring: push a new reminder for tomorrow/next week
        const lastReminder = todo.reminders[todo.reminders.length - 1].time;
        const nextTime = new Date(lastReminder);
        if (todo.recurrence === 'daily') nextTime.setDate(nextTime.getDate() + 1);
        if (todo.recurrence === 'weekly') nextTime.setDate(nextTime.getDate() + 7);
        if (todo.recurrence === 'mon-fri') {
            do {
                nextTime.setDate(nextTime.getDate() + 1);
            } while (nextTime.getDay() === 0 || nextTime.getDay() === 6);
        }
        
        todo.reminders.push({ time: nextTime, sent: false });
        todo.dueDate = nextTime;
    }

    if (updated) await todo.save();
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
  });

  client.on('message', async msg => {
    await processMessageWithGemini(msg, client);
  });

  client.on('disconnected', async () => {
    console.log('Client was logged out');
    await Settings.findOneAndUpdate({ id: 'global' }, { whatsappQr: '', whatsappStatus: 'disconnected' });
  });

  client.initialize();
}

startBot();
