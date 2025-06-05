const TelegramBot = require('node-telegram-bot-api');

// Токены
const TELEGRAM_TOKEN = '8000754311:AAFygkYqZojxRfx2y3dHxdxS4nrAbJ0DOQQ';

// Инициализация бота и OpenAI
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Запрос к HuggingFace
const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
  method: 'POST',
  headers: { 'Authorization': process.env.HF_TOKEN },
  body: JSON.stringify({ inputs: userMessage }),
});
const result = await response.json();
bot.sendMessage(chatId, result[0].generated_text);

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я бот с ИИ. Задай вопрос!');
});

// Обработка текстовых сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Игнорируем команды (например, /start)
  if (userMessage.startsWith('/')) return;

  try {
    // Отправляем запрос к OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: userMessage }],
    });

    // Отправляем ответ пользователю
    bot.sendMessage(chatId, response.choices[0].message.content);
  } catch (error) {
    console.error('Ошибка OpenAI:', error);
    bot.sendMessage(chatId, 'Произошла ошибка, попробуйте позже.');
  }
});