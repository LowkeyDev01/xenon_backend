import { offlineDBClient, onlineDBClient } from "../db.js";
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();
function generateCode() {
    return 'XENON-' + crypto.randomBytes(12).toString('hex').toUpperCase();
}
async function insertName(client, code, type) {
    const query = `INSERT INTO codes (code_string, account_type) VALUES ($1, $2)`
    await client.query(query, [code, type])
}

export async function generateBaches({ users = 0, creators = 0 }) {
    const onlineClient = await onlineDBClient.connect();
    const offlineClient = await offlineDBClient.connect();

    try {
        await onlineClient.query('BEGIN')
        await offlineClient.query('BEGIN')

        for (let i = 0; i < users; i++) {
            const code = generateCode();
            await insertName(onlineClient, code, "USER")
            await insertName(offlineClient, code, "USER")
        }
        for (let i = 0; i < creators; i++) {
            const code = generateCode();
            await insertName(onlineClient, code, "CREATOR")
            await insertName(offlineClient, code, "CREATOR")
        }
        await onlineClient.query('COMMIT')
        await offlineClient.query('COMMIT')

        console.log(`generated ${users} USER codes and ${creators} CREATOR codes`)
    }
    catch (err) {
        await onlineClient.query('ROLLBACK')
        await offlineClient.query('ROLLBACK')
        console.error(err.message)
        throw err;
    }
    finally {
        onlineClient.release();
        offlineClient.release();
    }
}