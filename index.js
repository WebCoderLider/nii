const express = require('express');
const cors = require('cors');
const useragent = require('express-useragent');
const logRequest = require('./middleware/logs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());

app.use('/uploads', express.static('uploads'));

const port = 5000;
const adminRouter = require('./routes/admin.router');
const news = require('./routes/news.router');
const apply = require('./routes/apply.router');
const direction = require('./routes/directions.router');
const directiontype = require('./routes/Direction.type');
const leadership = require('./routes/leadership.router');
const logsRouter = require('./routes/logs.router');
const departments = require('./routes/departments.router');
const directioHome = require('./routes/directionhome')
const contact = require('./routes/contact.router');

app.use(logRequest);

app.use('/admin', adminRouter);
app.use('/news', news);
app.use('/apply', apply);
app.use('/direction', direction);
app.use('/', directiontype);
app.use('/leadership', leadership);
app.use('/logs', logsRouter);
app.use('/departments', departments);
app.use('/direction-home', directioHome)
app.use('/contact', contact)

app.listen(port, () => console.log(`Server is running on port ${port}`));