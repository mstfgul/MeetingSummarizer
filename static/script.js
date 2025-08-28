document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('api-key');
    const meetingTextArea = document.getElementById('meeting-text');
    const summarizeBtn = document.getElementById('summarize-btn');
    const btnText = document.querySelector('.btn-text');
    const loading = document.querySelector('.loading');
    const resultContainer = document.getElementById('result-container');
    const errorContainer = document.getElementById('error-container');
    const summaryResult = document.getElementById('summary-result');
    const errorMessage = document.getElementById('error-message');
    const copyBtn = document.getElementById('copy-btn');
    const saveBtn = document.getElementById('save-btn');
    
    // Speech recognition elements
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const clearTextBtn = document.getElementById('clear-text');
    const speechStatus = document.getElementById('speech-status');
    const speechWarning = document.getElementById('speech-support-warning');
    const languageSelect = document.getElementById('language-select');
    
    // Form elements
    const meetingTitleInput = document.getElementById('meeting-title');
    const meetingDateInput = document.getElementById('meeting-date');
    
    // Sidebar elements
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const searchMeetingsInput = document.getElementById('search-meetings');
    const refreshMeetingsBtn = document.getElementById('refresh-meetings');
    const meetingsList = document.getElementById('meetings-list');
    
    let recognition = null;
    let isRecording = false;
    let currentMeetingId = null;

    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    meetingDateInput.value = today;

    // Initialize speech recognition
    function initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            recognition = new SpeechRecognition();
        } else {
            speechWarning.style.display = 'block';
            startRecordingBtn.disabled = true;
            return false;
        }

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = languageSelect.value;

        let finalTranscript = '';

        recognition.onstart = function() {
            isRecording = true;
            startRecordingBtn.disabled = true;
            stopRecordingBtn.disabled = false;
            startRecordingBtn.classList.add('recording');
            startRecordingBtn.textContent = '🎤 Listening...';
            updateSpeechStatus('listening', '🎤 Listening...');
        };

        recognition.onresult = function(event) {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            meetingTextArea.value = finalTranscript + interimTranscript;
            meetingTextArea.scrollTop = meetingTextArea.scrollHeight;
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            let errorMsg = 'Speech recognition error';
            
            switch(event.error) {
                case 'no-speech':
                    errorMsg = 'No speech detected';
                    break;
                case 'audio-capture':
                    errorMsg = 'Microphone access error';
                    break;
                case 'not-allowed':
                    errorMsg = 'Microphone permission denied';
                    break;
                case 'network':
                    errorMsg = 'Network connection error';
                    break;
            }
            
            updateSpeechStatus('error', errorMsg);
            stopRecording();
        };

        recognition.onend = function() {
            stopRecording();
        };

        return true;
    }

    function updateSpeechStatus(type, message) {
        speechStatus.className = `speech-status ${type}`;
        speechStatus.textContent = message;
    }

    function startRecording() {
        if (recognition && !isRecording) {
            recognition.lang = languageSelect.value;
            recognition.start();
        }
    }

    function stopRecording() {
        isRecording = false;
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        startRecordingBtn.classList.remove('recording');
        startRecordingBtn.textContent = '🎤 Start Recording';
        updateSpeechStatus('', '');
        
        if (recognition) {
            recognition.stop();
        }
    }

    // Event listeners for speech controls
    startRecordingBtn.addEventListener('click', function() {
        if (!isRecording) {
            startRecording();
        }
    });

    stopRecordingBtn.addEventListener('click', function() {
        if (isRecording) {
            stopRecording();
        }
    });

    clearTextBtn.addEventListener('click', function() {
        if (isRecording) {
            stopRecording();
        }
        meetingTextArea.value = '';
        hideMessages();
    });

    // Initialize speech recognition on page load
    initSpeechRecognition();

    // Load meetings on page load
    loadMeetings();

    // Meeting management functions
    async function loadMeetings(search = '') {
        try {
            const url = search ? `/api/meetings?search=${encodeURIComponent(search)}` : '/api/meetings';
            const response = await fetch(url);
            const data = await response.json();
            
            if (response.ok) {
                displayMeetings(data.meetings);
            } else {
                console.error('Error loading meetings:', data.error);
                meetingsList.innerHTML = '<div class="error-message">Error loading meetings</div>';
            }
        } catch (error) {
            console.error('Error loading meetings:', error);
            meetingsList.innerHTML = '<div class="error-message">Connection error</div>';
        }
    }

    function displayMeetings(meetings) {
        if (meetings.length === 0) {
            meetingsList.innerHTML = '<div class="no-meetings">No meetings found</div>';
            return;
        }

        const meetingsHTML = meetings.map(meeting => `
            <div class="meeting-item" data-id="${meeting.id}">
                <div class="meeting-header">
                    <h4 class="meeting-title">${escapeHtml(meeting.title)}</h4>
                    <span class="meeting-date">${formatDate(meeting.date)}</span>
                </div>
                <div class="meeting-meta">
                    <span class="meeting-language">${meeting.language}</span>
                    <div class="meeting-actions">
                        <button class="load-btn" onclick="loadMeeting(${meeting.id})">📄 Load</button>
                        <button class="delete-btn" onclick="deleteMeeting(${meeting.id})">🗑️</button>
                    </div>
                </div>
                <div class="meeting-preview">${escapeHtml(meeting.preview)}</div>
            </div>
        `).join('');

        meetingsList.innerHTML = meetingsHTML;
    }

    async function loadMeeting(meetingId) {
        try {
            const response = await fetch(`/api/meetings/${meetingId}`);
            const meeting = await response.json();
            
            if (response.ok) {
                // Populate form with meeting data
                meetingTitleInput.value = meeting.title;
                meetingDateInput.value = meeting.date;
                meetingTextArea.value = meeting.transcript;
                
                // Show summary if exists
                if (meeting.summary) {
                    summaryResult.textContent = meeting.summary;
                    showResult(meeting.summary);
                }
                
                currentMeetingId = meetingId;
                
                // Visual feedback
                showSuccess('Meeting loaded successfully');
            } else {
                showError('Error loading meeting: ' + meeting.error);
            }
        } catch (error) {
            showError('Connection error: ' + error.message);
        }
    }

    async function deleteMeeting(meetingId) {
        if (!confirm('Are you sure you want to delete this meeting?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/meetings/${meetingId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (response.ok) {
                loadMeetings(); // Refresh list
                showSuccess('Meeting deleted successfully');
                
                // Clear form if deleted meeting was currently loaded
                if (currentMeetingId === meetingId) {
                    clearForm();
                }
            } else {
                showError('Error deleting meeting: ' + data.error);
            }
        } catch (error) {
            showError('Connection error: ' + error.message);
        }
    }

    function clearForm() {
        meetingTitleInput.value = '';
        meetingDateInput.value = today;
        meetingTextArea.value = '';
        hideMessages();
        currentMeetingId = null;
    }

    function showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = '✅ ' + message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Helper functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    // Event listeners for sidebar
    toggleSidebarBtn.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        toggleSidebarBtn.textContent = sidebar.classList.contains('collapsed') ? '→' : '←';
    });

    refreshMeetingsBtn.addEventListener('click', function() {
        loadMeetings(searchMeetingsInput.value);
    });

    searchMeetingsInput.addEventListener('input', function() {
        const searchTerm = this.value.trim();
        if (searchTerm.length > 2 || searchTerm.length === 0) {
            loadMeetings(searchTerm);
        }
    });

    // Make functions globally available
    window.loadMeeting = loadMeeting;
    window.deleteMeeting = deleteMeeting;

    summarizeBtn.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim();
        const meetingText = meetingTextArea.value.trim();

        if (!meetingText) {
            showError('Please enter meeting text or use voice recording.');
            return;
        }

        setLoading(true);
        hideMessages();

        try {
            const response = await fetch('/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    meeting_text: meetingText,
                    meeting_title: meetingTitleInput.value.trim(),
                    meeting_date: meetingDateInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                showResult(data.summary);
                // Update title if auto-generated
                if (data.generated_title && !meetingTitleInput.value.trim()) {
                    meetingTitleInput.value = data.generated_title;
                }
                // Show database save status
                if (data.saved_to_database) {
                    showSuccess('Meeting saved to database automatically');
                    currentMeetingId = data.meeting_id;
                    // Refresh meetings list
                    loadMeetings(searchMeetingsInput.value);
                }
                if (data.database_error) {
                    console.warn('Database save failed:', data.database_error);
                }
            } else {
                showError(data.error || 'An error occurred.');
            }
        } catch (error) {
            showError('Connection error: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    copyBtn.addEventListener('click', function() {
        const summaryText = summaryResult.textContent;
        navigator.clipboard.writeText(summaryText).then(function() {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(function() {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(function() {
            alert('Copy failed. Please select and copy the text manually.');
        });
    });

    saveBtn.addEventListener('click', function() {
        const title = meetingTitleInput.value.trim() || 'Untitled Meeting';
        const date = meetingDateInput.value || new Date().toISOString().split('T')[0];
        const language = languageSelect.value;
        const transcript = meetingTextArea.value.trim();
        const summary = summaryResult.textContent;
        
        const content = `Meeting Title: ${title}
Date: ${date}
Language: ${language}

=== TRANSCRIPT ===
${transcript}

=== SUMMARY ===
${summary}

---
Generated by Meeting Summarizer
${new Date().toLocaleString()}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const filename = `meeting_${date}_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Show feedback
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✅ Saved!';
        setTimeout(function() {
            saveBtn.textContent = originalText;
        }, 2000);
    });

    function setLoading(isLoading) {
        summarizeBtn.disabled = isLoading;
        btnText.style.display = isLoading ? 'none' : 'inline';
        loading.style.display = isLoading ? 'inline' : 'none';
    }

    function showResult(summary) {
        summaryResult.textContent = summary;
        resultContainer.style.display = 'block';
        errorContainer.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorContainer.style.display = 'block';
        resultContainer.style.display = 'none';
    }

    function hideMessages() {
        resultContainer.style.display = 'none';
        errorContainer.style.display = 'none';
    }

    meetingTextArea.addEventListener('input', function() {
        const charCount = this.value.length;
        if (charCount > 0) {
            hideMessages();
        }
    });

    apiKeyInput.addEventListener('input', function() {
        if (this.value.trim().length > 0) {
            hideMessages();
        }
    });
});