const { pool } = require('./config/db');
const moment = require('moment-timezone');

async function setupBhaktiTasks() {
    const client = await pool.connect();
    try {
        console.log('Setting up Bhakti Health Score tasks...');
        await client.query('BEGIN');

        // 1. Create master_tasks table
        await client.query(`
            CREATE TABLE IF NOT EXISTS master_tasks (
                id SERIAL PRIMARY KEY,
                task_name VARCHAR(255) NOT NULL,
                scheduled_time TIME,
                options JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('master_tasks table created/verified.');
        await client.query(`
            ALTER TABLE master_tasks 
            ADD COLUMN IF NOT EXISTS scheduled_time TIME;
        `);

        // 2. Add master_task_id to user_routines
        await client.query(`
            ALTER TABLE user_routines 
            ADD COLUMN IF NOT EXISTS master_task_id INTEGER REFERENCES master_tasks(id),
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS scheduled_time TIME,
            ADD COLUMN IF NOT EXISTS options JSONB;
        `);
        console.log('user_routines table updated.');

        // 3. Clear and Seed Master Tasks
        await client.query('TRUNCATE TABLE master_tasks RESTART IDENTITY CASCADE');

        const tasks = [
            // A. Morning Discipline
            {
                task_name: 'Wake-Up Time',
                scheduled_time: '10:00:00',
                options: {
                    1: 'After 7:30am',
                    3: '6:30–7:30am',
                    6: '5:30–6:30am',
                    8: '4:30–5:30am',
                    10: 'Before 4:30am'
                }
            },
            {
                task_name: 'Mangala Arati Attendance',
                scheduled_time: '10:30:00',
                options: {
                    1: 'Did not attend',
                    3: 'Listened online partially',
                    6: 'Attended partially',
                    8: 'Attended fully',
                    10: 'Attended fully with focus & prayerful mood'
                }
            },
            {
                task_name: 'Tulasi Arati / Worship',
                scheduled_time: '11:00:00',
                options: {
                    1: 'Not done',
                    3: 'Rushed / distracted',
                    6: 'Done properly',
                    8: 'Done with attention',
                    10: 'Deeply prayerful and attentive'
                }
            },
            {
                task_name: 'Guru Puja / Guru Connection',
                scheduled_time: '11:30:00',
                options: {
                    1: 'Not observed',
                    3: 'Mechanically observed',
                    6: 'Attended or offered prayer',
                    8: 'Conscious gratitude to guru',
                    10: 'Deep prayer + practical application of instructions'
                }
            },
            // B. Japa
            {
                task_name: 'Japa Rounds Completed',
                scheduled_time: '12:00:00',
                options: {
                    1: 'Less than 8',
                    3: '8–12',
                    6: '12–15',
                    8: '16',
                    10: '16+ (or with extra chanting spirit)'
                }
            },
            {
                task_name: 'Japa Attention Quality',
                scheduled_time: '12:30:00',
                options: {
                    1: 'Highly distracted',
                    3: 'Mostly distracted',
                    6: 'Moderate attention',
                    8: 'Mostly attentive',
                    10: 'Deep absorption'
                }
            },
            {
                task_name: 'Early Morning Japa (before 8am)',
                scheduled_time: '13:00:00',
                options: {
                    1: 'None',
                    3: '1–4 rounds',
                    6: '5–8 rounds',
                    8: '9–12 rounds',
                    10: 'Majority completed early'
                }
            },
            // C. Hearing & Study
            {
                task_name: 'Srila Prabhupada Book Reading',
                scheduled_time: '13:30:00',
                options: {
                    1: 'None',
                    3: '<10 min',
                    6: '10–20 min',
                    8: '20–40 min',
                    10: '40+ min'
                }
            },
            {
                task_name: 'Hearing Class (Live or Recorded)',
                scheduled_time: '14:00:00',
                options: {
                    1: 'None',
                    3: 'Partial hearing',
                    6: 'Full class heard',
                    8: 'Heard + took notes',
                    10: 'Reflected and applied learning'
                }
            },
            {
                task_name: 'Memorization / Reflection',
                scheduled_time: '14:30:00',
                options: {
                    1: 'None',
                    3: 'Casual reflection',
                    6: 'Reflected on one teaching',
                    8: 'Journaled insight',
                    10: 'Shared insight with others'
                }
            },
            // D. Temple Practices
            {
                task_name: 'Sandhya Arati Participation',
                scheduled_time: '15:00:00',
                options: {
                    1: 'Did not attend',
                    3: 'Brief participation',
                    6: 'Full attendance',
                    8: 'Engaged attentively',
                    10: 'Deep devotional absorption'
                }
            },
            {
                task_name: 'Kirtan Participation',
                scheduled_time: '15:30:00',
                options: {
                    1: 'None',
                    3: 'Passive listening',
                    6: 'Sang softly',
                    8: 'Sang with energy',
                    10: 'Deep, heart-centered participation'
                }
            },
            {
                task_name: 'Deity Darsan Consciousness',
                scheduled_time: '16:00:00',
                options: {
                    1: 'None',
                    3: 'Rushed',
                    6: 'Offered basic prayers',
                    8: 'Felt gratitude',
                    10: 'Deep heartfelt connection'
                }
            },
            // E. Lifestyle
            {
                task_name: 'Honored Only Prasadam',
                scheduled_time: '16:30:00',
                options: {
                    1: 'Ate outside food',
                    3: 'Doubtful items',
                    6: 'Mostly prasadam',
                    8: 'Fully prasadam',
                    10: 'Mindful honoring with gratitude'
                }
            },
            {
                task_name: 'Regulative Principles',
                scheduled_time: '17:00:00',
                options: {
                    1: 'Broken',
                    3: 'Compromised',
                    6: 'Maintained with struggle',
                    8: 'Cleanly maintained',
                    10: 'Maintained + consciously grateful'
                }
            },
            {
                task_name: 'Media Consumption Discipline',
                scheduled_time: '17:30:00',
                options: {
                    1: 'Excessive / degrading',
                    3: 'Distracting',
                    6: 'Neutral / controlled',
                    8: 'Minimal unnecessary media',
                    10: 'Fully controlled & intentional'
                }
            },
            {
                task_name: 'Sleeping Time',
                scheduled_time: '18:00:00',
                options: {
                    1: 'After 11:30pm',
                    3: '10:45–11:30pm',
                    6: '10:15–10:45pm',
                    8: '9:45–10:15pm',
                    10: 'Before 9:45pm'
                }
            },
            // F. Service
            {
                task_name: 'Service to Srila Prabhupada’s Mission',
                scheduled_time: '18:30:00',
                options: {
                    1: 'None',
                    3: 'Minimal obligation',
                    6: 'Completed assigned service',
                    8: 'Enthusiastic service',
                    10: 'Service with extra initiative'
                }
            },
            {
                task_name: 'Quality of Service Mood',
                scheduled_time: '19:00:00',
                options: {
                    1: 'Complaining / resistant',
                    3: 'Mechanical',
                    6: 'Neutral',
                    8: 'Grateful',
                    10: 'Joyful and surrendered'
                }
            },
            {
                task_name: 'Encouraged Another Devotee',
                scheduled_time: '19:30:00',
                options: {
                    1: 'None',
                    3: 'Casual interaction',
                    6: 'Offered small support',
                    8: 'Meaningful encouragement',
                    10: 'Deep supportive conversation'
                }
            },
            // G. Inner Heart
            {
                task_name: 'Humility Practice',
                scheduled_time: '20:00:00',
                options: {
                    1: 'Arrogant reactions',
                    3: 'Defensive',
                    6: 'Neutral',
                    8: 'Accepted correction',
                    10: 'Actively cultivated humility'
                }
            },
            {
                task_name: 'Anger / Criticism Control',
                scheduled_time: '20:30:00',
                options: {
                    1: 'Harsh speech',
                    3: 'Repeated criticism',
                    6: 'Controlled but struggled',
                    8: 'Mostly peaceful',
                    10: 'Consciously compassionate'
                }
            },
            {
                task_name: 'Gratitude to Krishna',
                scheduled_time: '21:00:00',
                options: {
                    1: 'None',
                    3: 'Brief thought',
                    6: 'One prayer',
                    8: 'Multiple conscious moments',
                    10: 'Ongoing remembrance'
                }
            },
            {
                task_name: 'Avoiding Vaishnava Aparadha',
                scheduled_time: '21:30:00',
                options: {
                    1: 'Serious offense',
                    3: 'Critical speech',
                    6: 'Minor negativity',
                    8: 'Careful speech',
                    10: 'Actively glorified devotees'
                }
            },
            {
                task_name: 'End-of-Day Reflection',
                scheduled_time: '22:00:00',
                options: {
                    1: 'None',
                    3: 'Quick mental check',
                    6: 'Short reflection',
                    8: 'Journal entry',
                    10: 'Deep introspective prayer'
                }
            }
        ];

        for (const task of tasks) {
            await client.query(
                'INSERT INTO master_tasks (task_name, scheduled_time, options) VALUES ($1, $2, $3)',
                [task.task_name, task.scheduled_time, JSON.stringify(task.options)]
            );
        }

        await client.query('COMMIT');
        console.log(`SUCCESS: Seeded ${tasks.length} tasks.`);
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('FAILED: Error setting up tasks:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

setupBhaktiTasks();
