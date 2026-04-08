const { OpenAI } = require("openai");

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

module.exports = openai;
