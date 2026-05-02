-- ============================================================
-- Mental Health Knowledge Base — Seed Data
-- Run this AFTER the main migration and AFTER embedding each
-- document via the embed-content edge function or a bulk script.
-- ============================================================
-- NOTE: The 'embedding' column is left NULL here. You need to
-- generate embeddings for each row using OpenAI's API.
-- A helper script or edge function should be used to populate them.
-- ============================================================

INSERT INTO public.knowledge_documents (category, title, content, metadata) VALUES

-- ── CBT & THERAPY TECHNIQUES ──────────────────────────────

('therapy', 'What is Cognitive Behavioral Therapy (CBT)?',
'Cognitive Behavioral Therapy (CBT) is a structured, goal-oriented form of psychotherapy that helps people identify and change negative thinking patterns and behaviors. It is one of the most well-researched and effective treatments for depression, anxiety, PTSD, OCD, and many other mental health conditions. CBT works on the principle that our thoughts, feelings, and behaviors are interconnected — by changing unhelpful thoughts, we can change how we feel and act. A typical CBT course lasts 12-20 sessions. Key techniques include cognitive restructuring (challenging negative thoughts), behavioral activation (scheduling positive activities), and exposure therapy (gradually facing fears).',
'{"source": "curated", "tags": ["cbt", "therapy", "basics"]}'),

('therapy', 'Cognitive Restructuring: Challenging Negative Thoughts',
'Cognitive restructuring is a core CBT technique for identifying and challenging negative automatic thoughts. Steps: 1) Notice the negative thought ("I''m a failure"). 2) Identify the cognitive distortion (all-or-nothing thinking, catastrophizing, mind-reading, etc.). 3) Examine the evidence — what supports this thought? What contradicts it? 4) Generate a balanced alternative ("I struggled with this task, but I''ve succeeded at many others"). 5) Rate how much you believe the new thought. Common distortions include: all-or-nothing thinking, overgeneralization, mental filter, disqualifying the positive, jumping to conclusions, magnification, emotional reasoning, should statements, labeling, and personalization.',
'{"source": "curated", "tags": ["cbt", "cognitive-restructuring", "technique"]}'),

('therapy', 'Behavioral Activation for Depression',
'Behavioral activation is a therapeutic approach that combats depression by gradually increasing engagement in meaningful activities. Depression creates a vicious cycle: low mood → withdrawal → less pleasure → lower mood. Behavioral activation breaks this cycle. Steps: 1) Track daily activities and mood to find patterns. 2) Identify activities that once brought joy or accomplishment. 3) Schedule small, achievable activities each day. 4) Start tiny — even a 5-minute walk counts. 5) Track your mood after each activity. 6) Gradually increase difficulty. Research shows behavioral activation is as effective as full CBT for mild-to-moderate depression.',
'{"source": "curated", "tags": ["behavioral-activation", "depression", "technique"]}'),

-- ── ANXIETY & PANIC ───────────────────────────────────────

('anxiety', 'Understanding Anxiety: Types and Symptoms',
'Anxiety is a normal human emotion, but it becomes a disorder when it''s excessive, persistent, and interferes with daily life. Types include: Generalized Anxiety Disorder (GAD) — chronic worry about many things; Social Anxiety — intense fear of social situations; Panic Disorder — recurring panic attacks; Specific Phobias — intense fear of specific things; OCD — intrusive thoughts and compulsive behaviors; PTSD — anxiety following traumatic events. Physical symptoms include: racing heart, sweating, trembling, shortness of breath, stomach upset, muscle tension, and sleep difficulties. Anxiety is highly treatable through therapy (CBT), medication, and lifestyle changes.',
'{"source": "curated", "tags": ["anxiety", "basics", "symptoms"]}'),

('anxiety', 'The 5-4-3-2-1 Grounding Technique',
'The 5-4-3-2-1 technique is a grounding exercise that uses your five senses to bring you back to the present moment during anxiety or panic. It works by redirecting your attention away from anxious thoughts to your immediate surroundings. How to do it: 5 — Name FIVE things you can SEE (the clock, a plant, your hands...). 4 — Name FOUR things you can TOUCH (the chair, your clothing, your hair...). 3 — Name THREE things you can HEAR (traffic, birds, the fan...). 2 — Name TWO things you can SMELL (coffee, soap...). 1 — Name ONE thing you can TASTE (toothpaste, tea...). Take slow breaths between each step. This technique is quick, free, and can be done anywhere.',
'{"source": "curated", "tags": ["anxiety", "grounding", "technique", "panic"]}'),

('anxiety', 'Managing Panic Attacks',
'A panic attack is a sudden surge of intense fear or discomfort that peaks within minutes. Symptoms include: pounding heart, sweating, trembling, shortness of breath, chest pain, nausea, dizziness, chills, numbness, and a feeling of unreality or fear of dying. Important: panic attacks are NOT dangerous — they are your body''s fight-or-flight response misfiring. How to manage: 1) Remind yourself "This is a panic attack. It will pass. I am safe." 2) Slow your breathing — inhale 4 counts, hold 4, exhale 6. 3) Use the 5-4-3-2-1 grounding technique. 4) Don''t fight it — resistance makes it worse. 5) After it passes, rest and be gentle with yourself. If panic attacks recur, consult a psychiatrist — they are very treatable.',
'{"source": "curated", "tags": ["panic", "anxiety", "coping", "crisis"]}'),

-- ── DEPRESSION ────────────────────────────────────────────

('depression', 'Understanding Depression',
'Depression (Major Depressive Disorder) is more than feeling sad — it''s a persistent condition that affects how you think, feel, and function. Symptoms include: persistent sadness or emptiness, loss of interest in activities you once enjoyed, changes in appetite or weight, sleep disturbances (insomnia or oversleeping), fatigue, feelings of worthlessness or excessive guilt, difficulty concentrating, and in severe cases, thoughts of death or suicide. Depression is NOT a character flaw or weakness — it''s a medical condition involving changes in brain chemistry. It is highly treatable through therapy (CBT, IPT), medication (SSRIs, SNRIs), lifestyle changes (exercise, sleep hygiene, social connection), and in severe cases, brain stimulation therapies.',
'{"source": "curated", "tags": ["depression", "basics", "symptoms"]}'),

('depression', 'Small Steps When Everything Feels Heavy',
'When depression makes everything feel impossible, start impossibly small. These micro-steps can help: 1) Open the curtains — let light in. 2) Drink a glass of water. 3) Take a 2-minute walk, even inside your house. 4) Text one person "hi." 5) Take a warm shower. 6) Eat something — anything. 7) Put on fresh clothes. 8) Write one sentence about how you feel. None of these will "cure" depression, but they create momentum. Depression lies to you — it says nothing will help. Doing one tiny thing proves it wrong. Be proud of every small step. Progress is not linear, and bad days don''t erase good ones.',
'{"source": "curated", "tags": ["depression", "coping", "self-care", "motivation"]}'),

-- ── MINDFULNESS & MEDITATION ──────────────────────────────

('mindfulness', 'Box Breathing (4-4-4-4 Technique)',
'Box breathing is a simple, powerful technique used by Navy SEALs, athletes, and therapists to calm the nervous system. How to do it: 1) Sit comfortably with your back straight. 2) Inhale slowly through your nose for 4 counts. 3) Hold your breath for 4 counts. 4) Exhale slowly through your mouth for 4 counts. 5) Hold empty for 4 counts. 6) Repeat 4-6 times. Why it works: Slow, controlled breathing activates the parasympathetic nervous system (rest-and-digest), counteracting the sympathetic nervous system (fight-or-flight). It lowers cortisol, reduces heart rate, and calms the mind. Practice for 2-5 minutes when stressed, before sleep, or anytime you need to center yourself.',
'{"source": "curated", "tags": ["breathing", "mindfulness", "stress", "technique"]}'),

('mindfulness', 'Body Scan Meditation for Beginners',
'The body scan is a mindfulness meditation that helps you notice physical sensations and release tension. It takes 10-20 minutes. How to do it: 1) Lie down or sit comfortably. Close your eyes. 2) Take 3 deep breaths. 3) Focus your attention on the top of your head. Notice any sensations — tingling, warmth, tension. Don''t judge, just notice. 4) Slowly move your attention down: forehead, eyes, jaw (common tension spot), neck, shoulders, arms, hands, chest, stomach, hips, thighs, knees, calves, feet. 5) If your mind wanders, gently bring it back. 6) After reaching your feet, take a moment to feel your whole body at once. 7) Open your eyes slowly. Benefits: reduces stress, improves body awareness, helps with chronic pain, and improves sleep quality.',
'{"source": "curated", "tags": ["meditation", "body-scan", "mindfulness", "sleep"]}'),

('mindfulness', 'Journaling for Mental Health',
'Journaling is one of the simplest and most effective mental health tools. Research shows it can reduce anxiety, process trauma, improve mood, and boost self-awareness. Types of journaling: 1) Free writing — write whatever comes to mind without editing. 2) Gratitude journaling — list 3 things you''re grateful for each day. 3) Mood tracking — note your mood and what influenced it. 4) Prompt-based — answer specific questions like "What was my small win today?" Tips: Write for at least 5 minutes. Don''t censor yourself. You don''t need to write every day — even 2-3 times a week helps. Handwriting may be more therapeutic than typing. Your journal is private — be honest.',
'{"source": "curated", "tags": ["journaling", "mindfulness", "self-care", "technique"]}'),

-- ── SLEEP ─────────────────────────────────────────────────

('sleep', 'Sleep Hygiene: 10 Rules for Better Sleep',
'Good sleep is foundational to mental health. Poor sleep worsens anxiety, depression, and cognitive function. The 10 rules of sleep hygiene: 1) Fixed schedule — go to bed and wake up at the same time daily, even weekends. 2) No screens 1 hour before bed — blue light suppresses melatonin. 3) Cool, dark room — 18-20°C is ideal. 4) Caffeine cutoff — no coffee/tea after 2 PM. 5) Exercise regularly — but not within 3 hours of bedtime. 6) Limit naps — max 20 minutes, before 3 PM. 7) Wind-down routine — reading, gentle stretching, warm shower. 8) Use bed only for sleep — not for work, phone, or TV. 9) If you can''t sleep after 20 minutes, get up and do something calming, then return. 10) Limit alcohol — it disrupts sleep quality even if it helps you fall asleep initially.',
'{"source": "curated", "tags": ["sleep", "hygiene", "self-care", "habits"]}'),

-- ── MEDICATION INFO ───────────────────────────────────────

('medication', 'Understanding SSRIs (Antidepressants)',
'SSRIs (Selective Serotonin Reuptake Inhibitors) are the most commonly prescribed antidepressants. They work by increasing serotonin levels in the brain. Common SSRIs include: Fluoxetine (Prozac), Sertraline (Zoloft), Escitalopram (Lexapro/Cipralex), Paroxetine (Paxil), and Fluvoxamine. Important facts: 1) They take 4-6 weeks to show full effect — don''t give up too early. 2) Common side effects (usually temporary): nausea, headache, sleep changes, sexual dysfunction. 3) NEVER stop abruptly — always taper under doctor supervision. 4) They are NOT addictive. 5) They work best combined with therapy. 6) Finding the right medication and dose may take time — this is normal. Always consult your psychiatrist about medication decisions.',
'{"source": "curated", "tags": ["medication", "ssri", "antidepressant", "info"]}'),

-- ── INDIA-SPECIFIC RESOURCES ──────────────────────────────

('resources', 'Mental Health Helplines in India',
'If you or someone you know is in crisis, these helplines are available 24/7 in India: 1) Tele MANAS (Government of India): 14416 — free, multilingual, run by NIMHANS-trained counselors. 2) iCall (Tata Institute): 9152987821 — professional counseling. 3) Vandrevala Foundation: 1860-2662-345 — crisis support in multiple languages. 4) AASRA: 9820466626 — for suicidal thoughts. 5) Snehi: 044-24640050 — emotional support. 6) NIMHANS Helpline: 080-46110007 — from India''s premier mental health institute. Remember: seeking help is a sign of strength, not weakness. These services are confidential.',
'{"source": "curated", "tags": ["india", "helplines", "crisis", "resources"]}'),

('resources', 'Mental Health Rights in India',
'Under the Mental Healthcare Act 2017, every person in India has: 1) Right to access mental healthcare — the government must provide affordable mental health services. 2) Right to confidentiality — your mental health records are private. 3) Right to live in a community — no one can be sent to a mental institution without consent except in emergencies. 4) Advance Directive — you can specify in advance how you want to be treated during a mental health crisis. 5) Right against discrimination — no one can deny you employment, education, or services based on mental illness. 6) Attempted suicide is decriminalized — Section 309 IPC cannot be used against those who attempt suicide. Know your rights. NIMHANS and District Mental Health Programmes (DMHP) offer free or subsidized treatment.',
'{"source": "curated", "tags": ["india", "rights", "legal", "resources"]}'),

-- ── STRESS & COPING ───────────────────────────────────────

('coping', 'The Stress Bucket Model',
'The stress bucket model helps you understand your stress capacity. Imagine your stress tolerance as a bucket. Stress fills the bucket (work, relationships, health, finances). If the bucket overflows, you experience burnout, anxiety, or breakdown. The key is having "taps" that drain the bucket: exercise, sleep, social connection, hobbies, therapy, journaling, boundaries. Some buckets are smaller (genetic predisposition, trauma history) — this isn''t a flaw, just something to be aware of. Action steps: 1) Identify what''s filling your bucket right now. 2) Which taps do you have open? 3) Which taps could you add? 4) Can you reduce any inputs? 5) Be realistic — you can''t empty the bucket completely, but you can keep it from overflowing.',
'{"source": "curated", "tags": ["stress", "coping", "model", "self-awareness"]}'),

('coping', 'Setting Healthy Boundaries',
'Boundaries are limits you set to protect your mental health and well-being. Types: 1) Time boundaries — "I don''t take work calls after 7 PM." 2) Emotional boundaries — "I won''t take responsibility for others'' emotions." 3) Physical boundaries — "I need personal space." 4) Digital boundaries — "I check social media only once a day." How to set them: Use "I" statements ("I need..." not "You always..."). Be clear and specific. It''s okay to say no without explaining why. Start small. Expect pushback — people used to no boundaries may resist. Remember: boundaries aren''t selfish — they''re necessary for healthy relationships and mental health.',
'{"source": "curated", "tags": ["boundaries", "relationships", "self-care", "coping"]}');
