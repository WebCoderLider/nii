const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'))

const port = 5000
const adminRouter = require('./routes/admin.router')
const news = require('./routes/news.router')
const apply = require('./routes/apply.router')
const direction = require('./routes/directions.router')
app.use('/admin', adminRouter)
app.use('/news', news)
app.use('/apply', apply)
app.use('/direction', direction)

app.listen(port, () => console.log(`Server is running on port ${port}`))