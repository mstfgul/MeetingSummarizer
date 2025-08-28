# 🤖 Meeting Summarizer

A very simple, locally running meeting summarization application. You can instantly summarize your meeting notes with OpenAI API and perform real-time transcription with **voice recording**.

## ✨ Features

- 🎤 **Voice Recording**: Real-time speech-to-text conversion with Web Speech API
- 🗄️ **Database Storage**: SQLite database automatically saves all meetings
- 📋 **Meeting History**: Browse, search, and load previous meetings
- 💾 **Save to File**: Download complete transcript and summary as text file
- 🔒 **Secure**: All data stays on your local machine, .env support
- ⚡ **Fast**: Simple interface, quick results
- 🤖 **Smart**: Powerful summarization with OpenAI GPT
- 🌍 **Multi-language**: Support for 12+ languages
- 🔍 **Search & Filter**: Find meetings by title or content
- 📱 **Responsive**: Works on all devices
- 🎯 **Simple**: 2-minute setup
- 🌐 **Browser Optimized**: Optimized for Chrome/Edge

## 🚀 Installation

### 1. Install Requirements
```bash
pip install -r requirements.txt
```

### 2. API Key Configuration
**Option A**: Create .env file (recommended)
```bash
cp .env.example .env
# Edit .env file and add your OPENAI_API_KEY
```

**Option B**: Enter manually in interface

### 3. Run Application
```bash
python app.py
```

### 4. Open in Browser
```
http://127.0.0.1:5000
```

## 💡 How to Use?

### 📝 With Text:
1. **API Key**: Enter in interface if not defined in .env
2. **Paste Text**: Paste your meeting notes into the textarea
3. **Summarize**: Click the button

### 🎤 With Voice Recording:
1. **API Key**: Enter in interface if not defined in .env
2. **Select Language**: Choose your language from dropdown
3. **Click "Start Recording"** button
4. **Speak**: Give microphone permission and start speaking
5. **"Stop"** to end recording
6. **Summarize**: Transcription appears automatically in textarea

### 🗄️ Database Features:
7. **Auto-save**: Meetings are automatically saved to database after summarization
8. **Browse History**: View all previous meetings in the sidebar
9. **Search**: Find meetings by title or content in the search box
10. **Load Previous**: Click any meeting to load it back into the form
11. **Delete**: Remove meetings you no longer need

### 💾 Export:
12. **Click "Save as Text"** button to download as file
13. **Download File**: Complete transcript + summary downloaded as file

### 💻 Browser Support:
- ✅ **Chrome**: Full support
- ✅ **Edge**: Full support  
- ⚠️ **Firefox**: Text input only
- ⚠️ **Safari**: Text input only

## 📁 File Structure

```
meeting-summarizer/
├── app.py                 # Flask backend + .env support + API routes
├── models.py             # SQLAlchemy database models
├── meetings.db           # SQLite database (auto-created)
├── requirements.txt       # Python dependencies
├── .env.example          # Example environment file
├── .gitignore           # Git ignore rules
├── README.md             # This file
├── templates/
│   └── index.html        # Main page + voice UI + sidebar
└── static/
    ├── style.css         # CSS styles + voice controls + sidebar
    └── script.js         # JavaScript + Web Speech API + database
```

## 🔧 Technical Details

- **Backend**: Python Flask + Flask-SQLAlchemy + python-dotenv
- **Database**: SQLite (local file-based)
- **Frontend**: Vanilla HTML/CSS/JS + Web Speech API
- **AI**: OpenAI GPT-3.5-turbo (English prompts)
- **Speech Recognition**: Web Speech API (Multi-language)
- **File Download**: Browser Blob API
- **API**: RESTful endpoints for CRUD operations
- **Port**: 5000 (configurable)

## 🛡️ Security

- Your API key is safely stored in .env file
- .env file is protected with .gitignore
- All meeting data stored in local SQLite database
- No data is sent to external servers (except OpenAI for processing)
- All processing happens locally
- Audio data is only processed temporarily
- Database file stays on your machine

## ❓ Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### Port already in use
Change port number in `app.py` file:
```python
app.run(debug=True, host='127.0.0.1', port=5001)
```

### API key not working
- Make sure you have credits in your OpenAI account
- Correct format in .env file: `OPENAI_API_KEY=sk-...`

### Microphone not working
- Use Chrome/Edge (Firefox/Safari not supported)
- HTTPS or localhost required
- Grant microphone permission
- Check system audio settings

## 📝 License

This project is open source. You can use and develop it as you wish.