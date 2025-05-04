require("dotenv").config();
const express = require("express");
const cors = require("cors");       
const path = require("path");

const app = express();



app.use(cors({
    origin: process.env.CLIENT_URL ||"*", 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
}));

//Connect to MongoDB
const connectDB = require("./config/db");
connectDB();

//Middleware
app.use(express.json());


//Routes
// app.use("api/auth",authRoutes);
// app.use("api/users",userRoutes);
// app.use("api/tasks",taskRoutes);
// app.use("api/reports",reportRoutes);



//Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});