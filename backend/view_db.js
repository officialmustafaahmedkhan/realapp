const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'chat.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("--- USERS ---");
    db.each("SELECT * FROM users", (err, row) => {
        if (err) console.error(err);
        console.log(row);
    });

    // Wait a bit to ensure users print first (async/serial nature)
    setTimeout(() => {
        console.log("\n--- MESSAGES ---");
        db.each("SELECT * FROM messages", (err, row) => {
            if (err) console.error(err);
            console.log(row);
        });
    }, 1000);
});
