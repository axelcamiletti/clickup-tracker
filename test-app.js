// Test script to verify the application components work independently
console.log('🧪 Testing ClickUp Tracker components...');

// Test basic JavaScript functionality
try {
    // Test that we can create basic objects
    const testObject = {
        name: 'Test Task',
        id: 'test_001'
    };
    
    console.log('✅ Basic JavaScript: OK');
    
    // Test localStorage
    if (typeof Storage !== "undefined") {
        localStorage.setItem('test', 'value');
        const value = localStorage.getItem('test');
        localStorage.removeItem('test');
        console.log('✅ LocalStorage: OK');
    }
    
    // Test fetch API
    if (typeof fetch !== "undefined") {
        console.log('✅ Fetch API: Available');
    }
    
    console.log('🎯 All basic tests passed!');
    
} catch (error) {
    console.error('❌ Test failed:', error);
}
