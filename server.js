const app = require('./app');
const { initCronJobs } = require('./services/cronService');

const PORT = process.env.PORT;

// Initialize Background Jobs
initCronJobs();

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
