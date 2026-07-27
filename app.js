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
const settingsRoutes = require('./routes/settingsRoutes');

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
app.use('/api/settings', settingsRoutes);


// Generic Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Handle Payload Too Large errors (e.g., from express.json / body-parser)
    if (err.type === 'entity.too.large' || err.status === 413) {
        return responseHandler.error(res, 'The data you are trying to send exceeds the allowed size limit. Please reduce the size and try again.', 413);
    }

    const status = err.status || 500;
    const message = err.status && err.status !== 500 ? err.message : 'Something went wrong! Please try again later.';

    responseHandler.error(res, message, status, err.message);
});

module.exports = app;