const { pool } = require('./config/db');
const moment = require('moment-timezone');

async function setupBhaktiTasks() {
    const client = await pool.connect();
    try {
        console.log('Setting up Bhakti Health Score tasks...');
        await client.query('BEGIN');

        // Check if master_tasks table exists before seeding
        await client.query(`SELECT 1 FROM master_tasks LIMIT 1`).catch(async () => {
            console.log('master_tasks table not found. Please run setup_db.js first.');
            process.exit(1);
        });

        // 3. Clear and Seed Master Tasks
        await client.query('TRUNCATE TABLE master_tasks RESTART IDENTITY CASCADE');

        const tasks = [
            {
                task_name: "Wake up",
                scheduled_time: null,
                options: {
                    1: "After 7am",
                    3: "5.30–7am",
                    6: "4.30–5.30am",
                    8: "3.30–4.30am",
                    10: "Before 3.30am"
                }
            },
            {
                task_name: "Chanting rounds",
                scheduled_time: "4:30:00",
                options: {
                    1: "less than 30 rounds",
                    3: "30-60 rounds",
                    6: "60-90 rounds",
                    8: "90-120 rounds",
                    10: "120-150 rounds"
                }
            },
            {
                task_name: "Cooking Prasadam",
                scheduled_time: null,
                options: {
                    1: "0 times a day",
                    3: "1 time a day",
                    6: "2 times a day",
                    8: "3 times a day",
                    10: "4 times a day"
                }
            },
            {
                task_name: "Honouring Prasadam",
                scheduled_time: null,
                options: {
                    1: "No Prasadham",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Only Prasadham"
                }
            },
            {
                task_name: "Managala aarati",
                scheduled_time: "4:00:00",
                options: {
                    1: "After 7am",
                    3: "6-7am",
                    6: "5-6am",
                    8: "4.30-5am",
                    10: "4-4.30am"
                }
            },
            {
                task_name: "Tulasi aarati",
                scheduled_time: null,
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Narasimha aarati",
                scheduled_time: null,
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Sandhya aarati",
                scheduled_time: "17:00:00",
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Guru aarati",
                scheduled_time: null,
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Lectures",
                scheduled_time: "10:00:00",
                options: {
                    1: "0 hours a day",
                    3: "30mins-1hour",
                    6: "1hour-2hour",
                    8: "2hours-2.30hours",
                    10: "3 hours a day"
                }
            },
            {
                task_name: "Book Reading",
                scheduled_time: "8:00:00",
                options: {
                    1: "0 hours a day",
                    3: "30mins-1hour",
                    6: "1hour-2hour",
                    8: "2hours-3hours",
                    10: "3hours-4hours"
                }
            },
            {
                task_name: "Excercises",
                scheduled_time: null,
                options: {
                    1: "0 hours a day",
                    3: "30mins-1hour",
                    6: "1hour-2hour",
                    8: "2hours-2.30hours",
                    10: "3 hours a day"
                }
            },
            {
                task_name: "No.of classes attended",
                scheduled_time: null,
                options: {
                    1: "None",
                    3: "1 Class",
                    6: "2 Classes",
                    8: "3 Classes",
                    10: "5 Classes"
                }
            },
            {
                task_name: "Devotees Association",
                scheduled_time: null,
                options: {
                    1: "0 hours a day",
                    3: "2 hours a day",
                    6: "4 hours a day",
                    8: "6 hours a day",
                    10: "8 hours a day"
                }
            },
            {
                task_name: "Abishekam",
                scheduled_time: null,
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Sleep",
                scheduled_time: "20:00:00",
                options: {
                    1: "11:00 PM",
                    3: "10:00 PM",
                    6: "9:00 PM",
                    8: "8:30 PM",
                    10: "8:00 PM"
                }
            },
            {
                task_name: "Fasting",
                scheduled_time: "4:00:00",
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Festival",
                scheduled_time: null,
                options: {
                    1: "0",
                    3: "1",
                    6: "2",
                    8: "3",
                    10: "4"
                }
            },
            {
                task_name: "Temple Visit",
                scheduled_time: null,
                options: {
                    1: "Complaining / resistant",
                    3: "Mechanical",
                    6: "Neutral",
                    8: "Grateful",
                    10: "Joyful and surrendered"
                }
            },
            {
                task_name: "Book Distribution",
                scheduled_time: null,
                options: {
                    1: "None",
                    3: "Casual interaction",
                    6: "Offered small support",
                    8: "Meaningful encouragement",
                    10: "Deep supportive conversation"
                }
            },
            {
                task_name: "Pravachan/giving classes",
                scheduled_time: null,
                options: {
                    1: "0 hours a day",
                    3: "1 hour a day",
                    6: "2 hours a day",
                    8: "3 hours day",
                    10: "4 hours a day"
                }
            },
            {
                task_name: "Vaishanava/Sadu Seva",
                scheduled_time: null,
                options: {
                    1: "0 hours a day",
                    3: "1-6 hours a day",
                    6: "6-12 hours a day",
                    8: "12-18 hours a day",
                    10: "18-24 hours day"
                }
            },
            {
                task_name: "Nitya anusandhanam",
                scheduled_time: "7:00:00",
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Jagran",
                scheduled_time: null,
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Sayana Aarati",
                scheduled_time: "19:45:00",
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "charity",
                scheduled_time: null,
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Screen Time",
                scheduled_time: null,
                options: {
                    1: "4+ hours a day",
                    3: "3 hours a day",
                    6: "2 hours a day",
                    8: "1 hour a day",
                    10: "0 hour a day"
                }
            },
            {
                task_name: "Sevas:Garland/Cleaning alter",
                scheduled_time: null,
                options: {
                    1: "0 hours a day",
                    3: "1 hour a day",
                    6: "2 hours a day",
                    8: "3 hours day",
                    10: "4 hours a day"
                }
            },
            {
                task_name: "Meditation",
                scheduled_time: null,
                options: {
                    1: "0 hours a day",
                    3: "1 hour a day",
                    6: "2 hours a day",
                    8: "3 hours day",
                    10: "4 hours a day"
                }
            },
            {
                task_name: "Courses",
                scheduled_time: null,
                options: {
                    1: "Not Attended",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Fully Attended"
                }
            },
            {
                task_name: "Memorizing shlokas",
                scheduled_time: "19:00:00",
                options: {
                    1: "0 hours a day",
                    3: "1 hour a day",
                    6: "2 hours a day",
                    8: "3 hours day",
                    10: "4 hours a day"
                }
            },
            {
                task_name: "Gayathri mantra japa",
                scheduled_time: "5:00:00",
                options: {
                    1: "0 times a day",
                    3: "1 time a day",
                    6: "2 times a day",
                    8: "3 times a day",
                    10: "4 times a day"
                }
            },
            {
                task_name: "Yoga",
                scheduled_time: null,
                options: {
                    1: "0 hours a day",
                    3: "1 hour a day",
                    6: "2 hours a day",
                    8: "3 hours day",
                    10: "4 hours a day"
                }
            },
            {
                task_name: "Pranayama",
                scheduled_time: null,
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            },
            {
                task_name: "Prayers",
                scheduled_time: null,
                options: {
                    1: "Not Done",
                    3: "less than Partial",
                    6: "Partial",
                    8: "more than Partial",
                    10: "Done"
                }
            }
        ];

        for (const task of tasks) {
            await client.query(
                'INSERT INTO master_tasks (task_name, scheduled_time, notification_times, options) VALUES ($1, $2, $3, $4)',
                [task.task_name, task.scheduled_time, JSON.stringify(task.notification_times || []), JSON.stringify(task.options)]
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
