const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DB_URL;

const runSqlFile = async (fileName) => {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const sql = fs.readFileSync(path.join(__dirname, '../sql', fileName), 'utf8');
        await client.query(sql);
        console.log(`✅ Ejecutado con éxito: ${fileName}`);
    } catch (err) {
        console.error(`❌ Error en ${fileName}:`, err.message);
    } finally {
        await client.end();
    }
};

const main = async () => {
    const arg = process.argv[2]; 

    console.log("--- ⚖️ Supabase DB Manager (Node.js) ---");

    switch (arg) {
        case 'init':
            await runSqlFile('01_schema.sql');
            await runSqlFile('02_seed.sql');
            break;
        case 'clear':
            await runSqlFile('03_clear_data.sql');
            break;
        case 'drop':
            await runSqlFile('04_drop_all.sql');
            break;
        default:
            console.log("Uso: node scripts/db-setup.js [init | clear | drop]");
    }
};

main();