import * as dotenv from 'dotenv';
dotenv.config();
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "DEFINED (len=" + process.env.DATABASE_URL.length + ")" : "UNDEFINED");
console.log("POSTGRES_URL:", process.env.POSTGRES_URL ? "DEFINED (len=" + process.env.POSTGRES_URL.length + ")" : "UNDEFINED");
console.log("hrdatabase_DATABASE_URL:", process.env.hrdatabase_DATABASE_URL ? "DEFINED" : "UNDEFINED");
