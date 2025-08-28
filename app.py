from flask import Flask, render_template, request, jsonify
import openai
import os
from datetime import datetime, date
from dotenv import load_dotenv
from models import db, Meeting

load_dotenv()

app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///meetings.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/meetings', methods=['GET'])
def get_meetings():
    """Get all meetings with optional search"""
    try:
        search = request.args.get('search', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = Meeting.query
        
        # Search by title or content
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                db.or_(
                    Meeting.title.ilike(search_term),
                    Meeting.transcript.ilike(search_term)
                )
            )
        
        # Order by most recent first
        query = query.order_by(Meeting.created_at.desc())
        
        # Paginate results
        meetings = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'meetings': [meeting.to_summary_dict() for meeting in meetings.items],
            'total': meetings.total,
            'pages': meetings.pages,
            'current_page': page
        })
        
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500

@app.route('/api/meetings/<int:meeting_id>', methods=['GET'])
def get_meeting(meeting_id):
    """Get specific meeting details"""
    try:
        meeting = Meeting.query.get_or_404(meeting_id)
        return jsonify(meeting.to_dict())
        
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500

@app.route('/api/meetings', methods=['POST'])
def save_meeting():
    """Save a new meeting"""
    try:
        data = request.json
        
        # Parse date string to date object
        date_str = data.get('date')
        meeting_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else date.today()
        
        meeting = Meeting(
            title=data.get('title', 'Untitled Meeting'),
            date=meeting_date,
            language=data.get('language', 'en-US'),
            transcript=data.get('transcript', ''),
            summary=data.get('summary', '')
        )
        
        db.session.add(meeting)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'meeting': meeting.to_dict(),
            'message': 'Meeting saved successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error saving meeting: {str(e)}'}), 500

@app.route('/api/meetings/<int:meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id):
    """Delete a meeting"""
    try:
        meeting = Meeting.query.get_or_404(meeting_id)
        db.session.delete(meeting)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Meeting deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting meeting: {str(e)}'}), 500

@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        data = request.json
        api_key = data.get('api_key') or os.getenv('OPENAI_API_KEY')
        meeting_text = data.get('meeting_text')
        meeting_title = data.get('meeting_title', '').strip()
        meeting_date = data.get('meeting_date', '')
        
        if not api_key:
            return jsonify({'error': 'API key required. Please define OPENAI_API_KEY in .env file or enter in interface.'}), 400
        
        if not meeting_text:
            return jsonify({'error': 'Meeting text required'}), 400
        
        client = openai.OpenAI(api_key=api_key)
        
        # Generate title if not provided
        generated_title = None
        if not meeting_title:
            title_response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Generate a short, concise and descriptive title for this meeting text. Return only the title, don't add anything else."},
                    {"role": "user", "content": f"Generate title for this meeting:\n\n{meeting_text[:500]}..."}
                ],
                max_tokens=50,
                temperature=0.3
            )
            generated_title = title_response.choices[0].message.content.strip()
        
        # Generate summary with context
        context_info = f"Meeting Date: {meeting_date}\n" if meeting_date else ""
        context_info += f"Title: {meeting_title or generated_title}\n\n" if (meeting_title or generated_title) else ""
        
        summary_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a meeting summarizer. Summarize the given meeting text by extracting main topics, decisions, and action items. Include date and title information at the beginning of the summary. Respond in English."},
                {"role": "user", "content": f"{context_info}Meeting Text:\n{meeting_text}"}
            ],
            max_tokens=600,
            temperature=0.3
        )
        
        summary = summary_response.choices[0].message.content
        
        # Auto-save to database
        try:
            # Parse date string to date object
            date_str = meeting_date
            meeting_date_obj = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else date.today()
            
            meeting = Meeting(
                title=meeting_title or generated_title or 'Untitled Meeting',
                date=meeting_date_obj,
                language='en-US',  # Default to English for now - can be updated later from frontend
                transcript=meeting_text,
                summary=summary
            )
            
            db.session.add(meeting)
            db.session.commit()
            
            response_data = {
                'summary': summary,
                'meeting_id': meeting.id,
                'saved_to_database': True
            }
            if generated_title:
                response_data['generated_title'] = generated_title
                
        except Exception as db_error:
            # If database save fails, still return the summary
            response_data = {'summary': summary}
            if generated_title:
                response_data['generated_title'] = generated_title
            response_data['database_error'] = f'Could not save to database: {str(db_error)}'
            
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)