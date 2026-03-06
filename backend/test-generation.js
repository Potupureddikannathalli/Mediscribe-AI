const axios = require('axios');

async function testGeneration() {
    const transcript = `
    Doctor: Good morning, John. How are you feeling today?
    Patient: I have a bad headache and some fever since yesterday.
    Doctor: I see. Have you taken any medication?
    Patient: I took a Paracetamol but it didn't help much.
    Doctor: Okay, let me check your temperature. It's 101 degrees. 
    Doctor: I will prescribe you Dolo 650 for the fever and Naproxen for the headache.
    Doctor: Please drink plenty of water and rest. Avoid cold water.
    Patient: Okay doctor. Thank you.
  `;

    try {
        console.log("Testing Report Generation...");
        const response = await axios.post('http://localhost:5000/api/generate-reports', {
            transcript,
            patientName: "John Doe",
            language: "en"
        });

        if (response.data.success) {
            console.log("✅ Report Generation Successful!");
            console.log("--------------------------------------------------");
            console.log(JSON.stringify(response.data.data, null, 2));
            console.log("--------------------------------------------------");
        } else {
            console.error("❌ Generation Failed:", response.data.message);
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error("❌ Connection Refused. Is the backend server running on port 5000?");
        } else {
            console.error("❌ Error:", error.message);
            if (error.response) console.error("Details:", error.response.data);
        }
    }
}

testGeneration();
