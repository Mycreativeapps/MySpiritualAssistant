require('dotenv').config();
const express = require('express');
const cors = require('cors');
const setupSwagger = require('./config/swagger');
const responseHandler = require('./utils/responseHandler');

const authRoutes = require('./routes/authRoutes');
const hierarchyRoutes = require('./routes/hierarchyRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);


// Generic Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    responseHandler.error(res, 'Something went wrong!', 500, err.message);
});

module.exports = app;