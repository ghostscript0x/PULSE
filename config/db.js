const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27001/pulse', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`[DB CONNECTED] ${conn.connection.host}`);
    } catch (err) {
        console.error(`[DB ERROR] ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
