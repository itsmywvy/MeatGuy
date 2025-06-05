const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch'); // Не забудьте установить: npm install node-fetch

require('dotenv').config();

// Токены (лучше использовать переменные окружения)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const HF_TOKEN = process.env.HF_TOKEN; 

// Инициализация бота
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Модель Hugging Face (можно менять)
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.1';

// Улучшенная функция запроса к Hugging Face
async function queryHuggingFace(prompt) {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          inputs: prompt,
          parameters: {
            max_new_tokens: 200, // Ограничение длины ответа
            temperature: 0.7,   // Контроль случайности
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка запроса к Hugging Face:', error);
    throw error;
  }
}

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я бот с ИИ на основе Hugging Face. Задай вопрос!');
});

// Обработка текстовых сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Игнорируем команды и служебные сообщения
  if (userMessage.startsWith('/') || !userMessage.trim()) return;

  try {
    // Показываем индикатор набора сообщения
    await bot.sendChatAction(chatId, 'typing');
    
    // Отправляем запрос к Hugging Face
    const result = await queryHuggingFace(userMessage);
    
    // Обработка разных форматов ответа Hugging Face
    let replyText;
    if (Array.isArray(result) && result[0] && result[0].generated_text) {
      replyText = result[0].generated_text;
    } else if (result.generated_text) {
      replyText = result.generated_text;
    } else {
      replyText = 'Не удалось обработать ответ ИИ. Попробуйте еще раз.';
    }

    // Отправляем ответ пользователю
    await bot.sendMessage(chatId, replyText);
    
  } catch (error) {
    console.error('Ошибка:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.');
  }
});

// Обработка ошибок
process.on('unhandledRejection', (error) => {
  console.error('Необработанное исключение:', error);
});