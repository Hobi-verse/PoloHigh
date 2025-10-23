const mongoose = require("mongoose");
// require("dotenv").config();

// Suppress Mongoose duplicate index warnings using the correct option
mongoose.set('strictQuery', false);
// Suppress index creation warnings in production
if (process.env.NODE_ENV === 'production') {
  mongoose.set('bufferCommands', false);
}

exports.connect = () => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || typeof mongoUri !== "string") {
        console.error("Db connection Failed");
        console.error(new Error("MONGODB_URI environment variable is missing"));
        process.exit(1);
    }

    mongoose
        .connect(mongoUri)
        .then(() => console.log("DB connected successfully"))
        .catch((error) => {
            console.log("Db connection Failed");
            console.error(error);
            process.exit(1);
        });
};