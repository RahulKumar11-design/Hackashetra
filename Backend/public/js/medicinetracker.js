// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    document.getElementById('test-reports-tab').addEventListener('click', function() {
        switchTab('test-reports');
    });
    
    document.getElementById('wellbeing-tab').addEventListener('click', function() {
        switchTab('wellbeing');
    });

    // Modal handling
    document.getElementById('upload-test-btn').addEventListener('click', function() {
        openModal('upload-modal');
    });

    // Close buttons for all modals
    document.querySelectorAll('.close-btn').forEach(function(btn) {
        btn.addEventListener('click', closeAllModals);
    });

    // Upload form submission
    document.getElementById('upload-form').addEventListener('submit', handleUpload);

    // Test buttons
    document.querySelectorAll('.start-test-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const testType = this.getAttribute('data-test');
            openModal(testType + '-test-modal');
            initializeTest(testType);
        });
    });
});

// Utility functions
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.getElementById(tabName + '-tab').classList.add('active');
    document.getElementById(tabName + '-content').classList.add('active');
}

function openModal(modalId) {
    closeAllModals();
    document.getElementById(modalId).classList.add('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
}

// API calls
async function handleUpload(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('testName', document.getElementById('test-name').value);
    formData.append('labName', document.getElementById('lab-name').value);
    formData.append('testDate', document.getElementById('test-date').value);
    formData.append('testFile', document.getElementById('test-file').files[0]);

    try {
        const response = await fetch('/medicinetracker/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            closeAllModals();
            location.reload(); // Refresh to show new test
        } else {
            alert('Upload failed: ' + data.error);
        }
    } catch (err) {
        console.error('Upload error:', err);
        alert('Failed to upload test');
    }
}

// Test handling
function initializeTest(testType) {
    const modal = document.getElementById(testType + '-test-modal');
    const nextBtn = modal.querySelector('#' + testType + '-next-btn');
    const prevBtn = modal.querySelector('#' + testType + '-prev-btn');
    const finishBtn = modal.querySelector('#' + testType + '-finish-btn');
    
    let currentQuestion = 1;
    const totalQuestions = modal.querySelectorAll('.question').length;
    
    updateNavigation();
    
    nextBtn.onclick = () => navigateQuestion(1);
    prevBtn.onclick = () => navigateQuestion(-1);
    finishBtn.onclick = () => finishTest(testType);
    
    function navigateQuestion(direction) {
        const currentQ = modal.querySelector('#' + testType + '-q' + currentQuestion);
        currentQuestion += direction;
        const nextQ = modal.querySelector('#' + testType + '-q' + currentQuestion);
        
        currentQ.style.display = 'none';
        nextQ.style.display = 'block';
        
        updateNavigation();
    }
    
    function updateNavigation() {
        prevBtn.style.display = currentQuestion > 1 ? 'block' : 'none';
        nextBtn.style.display = currentQuestion < totalQuestions ? 'block' : 'none';
        finishBtn.style.display = currentQuestion === totalQuestions ? 'block' : 'none';
    }
}

async function finishTest(testType) {
    const modal = document.getElementById(testType + '-test-modal');
    const answers = collectAnswers(testType);
    const result = calculateResult(testType, answers);
    
    try {
        const response = await fetch('/medicinetracker/wellbeing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                testType,
                answers,
                result
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showResults(testType);
        } else {
            alert('Failed to save test results');
        }
    } catch (err) {
        console.error('Test submission error:', err);
        alert('Failed to submit test');
    }
}

function collectAnswers(testType) {
    const answers = {};
    const modal = document.getElementById(testType + '-test-modal');
    
    modal.querySelectorAll('input').forEach(input => {
        if (input.type === 'radio' && input.checked) {
            answers[input.name] = input.value;
        } else if (input.type === 'number') {
            answers[input.id] = input.value;
        } else if (input.type === 'checkbox' && input.checked) {
            if (!answers[input.name]) answers[input.name] = [];
            answers[input.name].push(input.id);
        }
    });
    
    return answers;
}

function calculateResult(testType, answers) {
    // This is a simplified example. In a real application,
    // you would have more sophisticated risk calculation logic
    let riskLevel = 'low';
    let recommendations = [];
    let score = 0;
    
    switch (testType) {
        case 'cvd':
            // Example CVD risk calculation
            if (answers['hdl'] < 40 || answers['ldl'] > 160) {
                riskLevel = 'high';
                recommendations.push('Consider consulting a cardiologist');
            }
            break;
            
        case 'depression':
            // Example depression risk calculation
            const depressionScore = Object.values(answers).reduce((sum, val) => sum + parseInt(val), 0);
            if (depressionScore > 5) riskLevel = 'high';
            break;
            
        // Add other test types here
    }
    
    return { riskLevel, recommendations, score };
}

function showResults(testType) {
    const modal = document.getElementById(testType + '-test-modal');
    
    // Hide questions
    modal.querySelectorAll('.question').forEach(q => q.style.display = 'none');
    
    // Hide navigation buttons
    modal.querySelector('.nav-buttons').style.display = 'none';
    
    // Show results
    const results = modal.querySelector('#' + testType + '-results');
    results.style.display = 'block';
} 