# backend/routes/legacy_bot.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, JournalEntry, DailyReflection, Goal, Achievement, Task, User
from datetime import datetime
import random
import traceback

legacy_bot_bp = Blueprint('legacy_bot', __name__)

def get_int_user_id():
    """Helper function to get user_id as integer from JWT"""
    try:
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            try:
                return int(user_id)
            except ValueError:
                return None
        return user_id
    except Exception as e:
        print(f"Error getting user_id: {e}")
        return None

@legacy_bot_bp.route('/ask', methods=['POST'])
@jwt_required()
def ask_bot():
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        data = request.get_json()
        question = data.get('question', '')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        print(f"🤖 Legacy Bot - Question from user {user_id}: {question}")
        
        # Get user data for context
        user = User.query.get(user_id)
        user_name = user.full_name if user and user.full_name else (user.username if user else 'my friend')
        
        # Get user's data
        journal_entries = JournalEntry.query.filter_by(user_id=user_id).order_by(
            JournalEntry.date.desc()
        ).limit(10).all()
        
        goals = Goal.query.filter_by(user_id=user_id, status='completed').all()
        achievements = Achievement.query.filter_by(user_id=user_id).all()
        tasks = Task.query.filter_by(user_id=user_id).limit(10).all()
        reflections = DailyReflection.query.filter_by(user_id=user_id).order_by(
            DailyReflection.date.desc()
        ).limit(5).all()
        
        # Build context
        context = build_context(journal_entries, goals, achievements, tasks, reflections)
        
        # Generate response
        response = generate_response(question, context, user_name)
        
        return jsonify({
            'question': question,
            'response': response,
            'context_used': True
        }), 200
    except Exception as e:
        print(f"❌ Error in ask_bot: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@legacy_bot_bp.route('/context', methods=['GET'])
@jwt_required()
def get_context():
    """Get user context data for debugging"""
    try:
        user_id = get_int_user_id()
        if user_id is None:
            return jsonify({'error': 'Invalid user ID'}), 400
        
        journal_count = JournalEntry.query.filter_by(user_id=user_id).count()
        goal_count = Goal.query.filter_by(user_id=user_id).count()
        achievement_count = Achievement.query.filter_by(user_id=user_id).count()
        task_count = Task.query.filter_by(user_id=user_id).count()
        
        return jsonify({
            'journal_entries': journal_count,
            'goals': goal_count,
            'achievements': achievement_count,
            'tasks': task_count,
            'user_id': user_id
        }), 200
    except Exception as e:
        print(f"Error getting context: {e}")
        return jsonify({'error': str(e)}), 500

@legacy_bot_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Legacy Bot'}), 200

def build_context(journal_entries, goals, achievements, tasks, reflections):
    context = "Here's what I know about you:\n\n"
    
    if journal_entries:
        context += "📝 Recent journal entries:\n"
        for entry in journal_entries[:3]:
            context += f"  - {entry.date.strftime('%B %d, %Y')}: {entry.content[:150]}...\n"
    
    if goals:
        context += f"\n✅ Completed goals ({len(goals)}):\n"
        for goal in goals[:5]:
            context += f"  - {goal.title}\n"
    
    if achievements:
        context += f"\n🏆 Achievements ({len(achievements)}):\n"
        for achievement in achievements[:5]:
            context += f"  - {achievement.title} ({achievement.points} XP)\n"
    
    if tasks:
        context += f"\n📋 Recent tasks:\n"
        for task in tasks[:5]:
            status_emoji = '✅' if task.status == 'completed' else '🔄' if task.status == 'in_progress' else '⏳'
            context += f"  - {status_emoji} {task.title}\n"
    
    if reflections:
        context += f"\n💭 Recent reflections:\n"
        for reflection in reflections[:3]:
            if reflection.gratitude:
                context += f"  - Gratitude: {reflection.gratitude[:100]}...\n"
    
    return context

def generate_response(question, context, user_name):
    question_lower = question.lower().strip()
    
    # ===== CASUAL CONVERSATION HANDLING =====
    
    # Good night / bedtime
    if any(word in question_lower for word in ['good night', 'night night', 'sleep', 'bedtime', 'going to sleep', 'sleep now']):
        return get_goodnight_response(user_name)
    
    # Good morning
    if any(word in question_lower for word in ['good morning', 'morning', 'gm']):
        return get_goodmorning_response(user_name)
    
    # Thank you / thanks
    if any(word in question_lower for word in ['thank', 'thanks', 'thx', 'tysm']):
        return get_thankyou_response(user_name)
    
    # Goodbye / bye
    if any(word in question_lower for word in ['goodbye', 'bye', 'bye bye', 'see you', 'cya', 'later']):
        return get_goodbye_response(user_name)
    
    # Have a nice day / have a great day
    if any(word in question_lower for word in ['have a nice day', 'have a great day', 'have a good day']):
        return get_have_nice_day_response(user_name)
    
    # I love you / love you
    if any(word in question_lower for word in ['love you', 'i love you']):
        return get_love_response(user_name)
    
    # How are you
    if any(word in question_lower for word in ['how are you', 'how do you do', "how's it going", "how are you doing"]):
        return get_how_are_you_response(user_name)
    
    # Hello / hi
    if any(word in question_lower for word in ['hello', 'hi', 'hey', 'hola']):
        return get_greeting_response(user_name)
    
    # ===== SERIOUS CONVERSATION HANDLING =====
    
    # Advice
    if any(word in question_lower for word in ['advice', 'recommend', 'suggest', 'help']):
        return get_advice_response(user_name, context)
    
    # Motivation
    if any(word in question_lower for word in ['motivation', 'motivate', 'inspire', 'encourage', 'keep going']):
        return get_motivation_response(user_name, context)
    
    # Goals
    if any(word in question_lower for word in ['goal', 'achieve', 'target', 'dream']):
        return get_goals_response(user_name, context)
    
    # Gratitude
    if any(word in question_lower for word in ['grateful', 'thank', 'appreciate', 'bless', 'gratitude']):
        return get_gratitude_response(user_name, context)
    
    # Legacy
    if any(word in question_lower for word in ['legacy', 'future', 'build', 'leave behind', 'remember']):
        return get_legacy_response(user_name, context)
    
    # Progress / Growth
    if any(word in question_lower for word in ['progress', 'growth', 'improve', 'how to grow']):
        return get_progress_response(user_name, context)
    
    # Struggle / Hard times
    if any(word in question_lower for word in ['struggle', 'hard', 'difficult', 'challenge']):
        return get_struggle_response(user_name, context)
    
    # Success
    if any(word in question_lower for word in ['success', 'win', 'achievement']):
        return get_success_response(user_name, context)
    
    # Family / Friends
    if any(word in question_lower for word in ['family', 'friend', 'people']):
        return get_family_response(user_name, context)
    
    # Default / General
    return get_general_response(user_name, context)

# ============ CASUAL RESPONSES ============

def get_goodnight_response(user_name):
    responses = [
        f"🌙 Good night, {user_name}! Sleep well and dream big. Tomorrow is a new opportunity to build your legacy! 💫",
        f"😴 Rest well, {user_name}! You've earned a peaceful night's sleep. See you tomorrow! 🌟",
        f"💤 Good night, {user_name}! May your dreams be filled with inspiration and possibilities. ✨",
        f"🌃 Sweet dreams, {user_name}! Take care of yourself and recharge for another amazing day. 💪"
    ]
    return random.choice(responses)

def get_goodmorning_response(user_name):
    responses = [
        f"🌅 Good morning, {user_name}! Rise and shine! Today is a new chapter waiting to be written. ☀️",
        f"🌟 Good morning! The sun is up and so are you, {user_name}! Let's make today amazing! 💪",
        f"🌞 Wakey wakey, {user_name}! A beautiful day awaits you. Time to chase those dreams! 🚀",
        f"☀️ Good morning, {user_name}! Every sunrise brings new opportunities. Seize the day! ✨"
    ]
    return random.choice(responses)

def get_thankyou_response(user_name):
    responses = [
        f"😊 You're most welcome, {user_name}! It's my pleasure to help you on your journey. 🌟",
        f"❤️ You're welcome, {user_name}! I'm always here when you need me. Keep being amazing! 💫",
        f"🙏 Thank you, {user_name}! Your gratitude means a lot. I'm here to support you always. ✨",
        f"💪 You're welcome! Remember, {user_name}, you're the hero of your own story. I'm just here to help! 🌟"
    ]
    return random.choice(responses)

def get_goodbye_response(user_name):
    responses = [
        f"👋 Goodbye, {user_name}! It was wonderful talking to you. Come back anytime! 🌟",
        f"💫 Until next time, {user_name}! Keep building your legacy and chasing your dreams. ✨",
        f"🌟 Farewell, {user_name}! Remember, I'm always here whenever you need guidance. 💪",
        f"🤗 See you later, {user_name}! Stay inspired and keep growing. You've got this! 🚀"
    ]
    return random.choice(responses)

def get_have_nice_day_response(user_name):
    responses = [
        f"😊 Thank you, {user_name}! You have a wonderful day too. Make it count! 🌟",
        f"🌞 You too, {user_name}! May your day be filled with joy and inspiration. ✨",
        f"💫 Have an amazing day, {user_name}! Keep shining and building your legacy. 💪",
        f"🌈 Thank you! Your positive energy is contagious, {user_name}. Enjoy your day! 🌟"
    ]
    return random.choice(responses)

def get_love_response(user_name):
    responses = [
        f"❤️ Aww, love you too, {user_name}! You're amazing and I'm here for you always. 🥰",
        f"💖 Right back at you, {user_name}! Your journey is inspiring and I'm proud of you. 🌟",
        f"😊 I appreciate you, {user_name}! Your kindness and curiosity make you special. ✨",
        f"💝 Love you, {user_name}! Never forget how incredible you are. Keep being awesome! 🌟"
    ]
    return random.choice(responses)

# ============ SERIOUS RESPONSES ============

def get_greeting_response(user_name):
    greetings = [
        f"👋 Hello {user_name}! It's wonderful to see you. How can I help you today?",
        f"🌟 Hey {user_name}! I'm here whenever you're ready to talk.",
        f"🤗 Hello {user_name}! I've been looking forward to our conversation.",
        f"☀️ Good to see you, {user_name}! What's on your mind today?"
    ]
    return random.choice(greetings)

def get_how_are_you_response(user_name):
    responses = [
        f"😊 I'm doing great, {user_name}! Thanks for asking. I'm here to help you build your legacy.",
        f"🌟 I'm wonderful, {user_name}! I love having conversations like this.",
        f"💫 I'm fantastic, {user_name}! What's on your mind today?",
        f"🤖 I'm always ready to help, {user_name}! I'm powered by your journey and curiosity."
    ]
    return random.choice(responses)

def get_advice_response(user_name, context):
    advices = [
        f"🧠 {user_name}, take time to reflect daily. Write down your thoughts, dreams, and lessons learned. Your journal entries show you're already on the right track!",
        f"📚 Invest in yourself, {user_name}. Read, learn, and grow every single day. The knowledge you gain today will shape your tomorrow.",
        f"🤝 Surround yourself with people who inspire you to be better, {user_name}. Your journey is influenced by those you spend time with.",
        f"💡 Your future self would tell you: 'Trust the process, {user_name}. Everything happens for a reason.' Keep moving forward!",
        f"🎯 Break down your big goals into small, actionable steps, {user_name}. Progress is progress, no matter how small.",
        f"🧘 Take care of your mind and body, {user_name}. Rest is productive. Recharge to keep building your legacy."
    ]
    return random.choice(advices)

def get_motivation_response(user_name, context):
    motivations = [
        f"💪 {user_name}, your future self is counting on you. Every small step today is a giant leap for your tomorrow. You've already accomplished so much!",
        f"🌟 Remember, {user_name}: You are capable of more than you know. Your achievements prove that. Keep pushing forward!",
        f"🔥 The fire within you is stronger than the challenges around you, {user_name}. Keep burning bright!",
        f"✨ Success is not final, failure is not fatal: it's the courage to continue that counts, {user_name}. You've shown that courage!",
        f"🚀 Your potential is limitless, {user_name}. Don't let anyone, including yourself, tell you otherwise.",
        f"🌈 Every day is a new opportunity, {user_name}. The sun rises for you to try again. You've got this!",
        f"⭐ You are the architect of your own life, {user_name}. Build something beautiful!"
    ]
    return random.choice(motivations)

def get_goals_response(user_name, context):
    goals_responses = [
        f"🎯 {user_name}, write down your goals. Be specific about what you want to achieve and why. You've already completed many goals!",
        f"📅 Create a timeline for your goals, {user_name}. Break them into yearly, monthly, and daily actions. Small steps lead to big achievements.",
        f"🏆 Celebrate every milestone, {user_name}. No matter how small. Progress deserves recognition, and you've made great progress!",
        f"🔄 Review your goals regularly, {user_name}. Adjust them as you grow and evolve. Your goals should grow with you.",
        f"💪 Your goals are within reach, {user_name}. Stay focused, stay determined, and never give up. You're closer than you think!",
        f"📝 Visualize your success, {user_name}. See yourself achieving your goals. This powerful practice turns dreams into reality."
    ]
    return random.choice(goals_responses)

def get_gratitude_response(user_name, context):
    gratitudes = [
        f"🙏 {user_name}, start each day by listing three things you're grateful for. It transforms your perspective and attracts more positivity.",
        f"❤️ Take a moment to appreciate the people who support you on your journey, {user_name}. Gratitude strengthens relationships.",
        f"🌟 Gratitude turns what we have into enough, {user_name}. Practice it daily and watch your life transform.",
        f"😊 Smile at the small wins, {user_name}. They add up to big achievements. You have so much to be grateful for!",
        f"💖 Gratitude is the foundation of a meaningful legacy, {user_name}. Never forget to be thankful for the journey.",
        f"🌅 Every morning is a gift, {user_name}. Start with gratitude and watch your day unfold beautifully."
    ]
    return random.choice(gratitudes)

def get_legacy_response(user_name, context):
    legacies = [
        f"🏛️ {user_name}, your legacy is not what you leave for people, but what you leave in people. Your actions today shape tomorrow.",
        f"📝 Write down the values you want to be remembered by, {user_name}. Live them every day. Your life is your message.",
        f"🌱 Build something that outlasts you, {user_name}. Plant trees whose shade you may never sit under. That's true legacy.",
        f"💫 Your story is unique, {user_name}. Share it, own it, and let it inspire others. Your journey matters.",
        f"🌟 The best time to build your legacy is now, {user_name}. Start today, one moment at a time. Every moment counts.",
        f"📖 Your life is a book, {user_name}. Every day is a new page. Write a story worth telling."
    ]
    return random.choice(legacies)

def get_progress_response(user_name, context):
    progresses = [
        f"📈 {user_name}, you're making incredible progress! Every step forward, no matter how small, is a victory. Keep going!",
        f"🌟 Your growth is visible, {user_name}. The consistency you show is building something extraordinary.",
        f"💪 {user_name}, your journey is inspiring. The challenges you've overcome have made you stronger.",
        f"🚀 You're not just dreaming, {user_name} - you're building. Your progress is the foundation of your legacy.",
        f"✨ {user_name}, look how far you've come! Every achievement, every lesson learned - it's all part of your amazing journey.",
        f"📊 Progress is not always linear, {user_name}. Trust the journey. You're exactly where you need to be."
    ]
    return random.choice(progresses)

def get_struggle_response(user_name, context):
    struggles = [
        f"💙 {user_name}, struggles are part of the journey. They don't define you - they refine you. You're stronger than you know!",
        f"🌟 Every challenge is an opportunity in disguise, {user_name}. This difficult moment is shaping you into who you're meant to be.",
        f"💪 {user_name}, you've overcome challenges before. You have the strength to overcome this one too. I believe in you!",
        f"🌈 The darkest hour is just before dawn, {user_name}. Hold on. Your breakthrough is coming.",
        f"🧠 {user_name}, take a deep breath. You're not alone in this. Growth happens in difficult moments."
    ]
    return random.choice(struggles)

def get_success_response(user_name, context):
    successes = [
        f"🎉 Congratulations, {user_name}! Your success is well-deserved. Enjoy this moment and celebrate your achievement!",
        f"⭐ {user_name}, success is not just about the destination - it's about the journey. You've grown so much!",
        f"🏆 You earned this, {user_name}! Your hard work, dedication, and persistence have paid off. Keep shining!",
        f"🌟 {user_name}, success is a habit. You're building that habit with every win, big and small. Keep going!",
        f"💫 Your success inspires others, {user_name}. Never underestimate the impact of your achievements."
    ]
    return random.choice(successes)

def get_family_response(user_name, context):
    families = [
        f"❤️ Family is everything, {user_name}. Cherish the moments you share with them. They are part of your legacy.",
        f"🏠 Home is where the heart is, {user_name}. Your family is your foundation. Build with love.",
        f"👨‍👩‍👧‍👦 {user_name}, the love of family is the greatest gift. Nurture those bonds and they'll last a lifetime.",
        f"💖 Family is not just about blood, {user_name}. It's about who you love and who loves you back.",
        f"🌟 Your family is part of your story, {user_name}. Honor them with your actions and your success."
    ]
    return random.choice(families)

def get_general_response(user_name, context):
    generals = [
        f"💭 That's a thought-provoking question, {user_name}. Let me reflect on that... Your curiosity is the fuel for growth.",
        f"🌟 Every question you ask, {user_name}, brings you closer to understanding yourself better. Keep asking!",
        f"🤔 Interesting, {user_name}! Let me think about how I can best help you with that.",
        f"💡 Your curiosity is the fuel for growth, {user_name}. Keep asking questions! That's how you build a meaningful legacy.",
        f"🌈 Life is a beautiful journey, {user_name}. Every question leads to new discoveries. You're on the right path!",
        f"✨ {user_name}, your journey is unique and valuable. Never stop exploring, learning, and growing."
    ]
    return random.choice(generals)