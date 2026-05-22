// const { GoogleGenerativeAI } = require('@google/generative-ai');

// // Paste your actual AI Studio key here
// const genAI = new GoogleGenerativeAI("AIzaSyCS-c2fvp-yBvhkR4LQ-C9MwFpDoGyRxMQ"); 
// test-ai.js - Raw REST API Bypass
const API_KEY = "AIzaSyCS-c2fvp-yBvhkR4LQ-C9MwFpDoGyRxMQ"; 

async function discoverModels() {
    console.log("🔍 Bypassing the NPM package and asking Google directly...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.error) {
            console.error("❌ Google Error:", data.error.message);
            return;
        }

        console.log("✅ SUCCESS! Google accepted the key. Here are the exact model names you are allowed to use:");
        
        // Filter out models that can't generate text
        const usableModels = data.models.filter(m => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
        );
        
        usableModels.forEach(m => {
            console.log(`➡️  ${m.name.replace('models/', '')}`);
        });

    } catch (error) {
        console.error("❌ System Error:", error.message);
    }
}

discoverModels();