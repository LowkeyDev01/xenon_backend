import pkg from 'pg'
import dotenv from 'dotenv';
dotenv.config();
export const { Pool } = pkg;

export const onlineDBClient = new Pool({ connectionString: process.env.ONLINE_DB_URL })
export const offlineDBClient = new Pool({ connectionString: process.env.OFFLINE_DB_URL })