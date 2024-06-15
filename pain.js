const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCrtLSQQQQwHICeXUN__K8umaOF9YEMon8");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log('Bot is ready!');
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content || message.content === '') return; // Ignore bot messages

    try {
        // Fetch last 5 messages in the channel
        const messages = await message.channel.messages.fetch({ limit: 6 }); // Fetch 6 to include the current message
        const history = messages.filter(m => m.author.id !== client.user.id && m.content.trim() !== ''); // Exclude bot's own messages and empty messages
        const context = history.map(m => m.content).slice(0, 5); // Get content of last 5 non-bot messages

        // Use startChat endpoint to get AI response with context
        const chatContext = context.join('\n'); // Join context messages with new lines
        const startChatResponse = await model.startChat(chatContext);

        // Generate AI response based on message content
        const result = await model.generateContent(message.content, { context: startChatResponse.context });

        let response = result.response.text();
        response = response.substring(0, 1999); // Discord message cutoff is 2000 characters

        // Check if response length exceeds Discord's limit
        if (response.length > 1999) {
            
            // Split long response into multiple messages
            const chunks = splitText(response, 1999);
            for (const chunk of chunks) {
                message.reply(chunk);
            }
        } else {
            // Send the response as a single message
            message.reply(response);
        }

        console.log(response);
    } catch (err) {
        console.error('Error fetching messages or generating response:', err);
    }
});

function splitText(text, maxLength) {
    const regex = new RegExp(`.{1,${maxLength}}`, 'g');
    return text.match(regex);
}

// Authenticate Discord bot
client.login("MTI1MTIxNjM5NzM3NjI5MDkxOQ.Go8C1D.DJaBqnK-iY1lUswIqCL5NOio4Qbm5ALRC24Aeo");
