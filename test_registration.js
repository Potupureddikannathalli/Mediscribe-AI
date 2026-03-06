const API_URL = 'http://localhost:5000';

const testDoctor = {
    _id: `test_doc_${Date.now()}`,
    name: 'Test Doctor',
    email: `test_doc_${Date.now()}@example.com`,
    password: 'password123',
    role: 'doctor',
    phone: '1234567890',
    specialization: 'General Medicine',
    departmentId: '1'
};

async function runTest() {
    console.log('🚀 Sending test registration to:', `${API_URL}/api/doctors`);
    try {
        const response = await fetch(`${API_URL}/api/doctors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testDoctor)
        });
        const data = await response.json();
        console.log('✅ Status:', response.status);
        console.log('📦 Data:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Error Message:', error.message);
    }
}

runTest();
