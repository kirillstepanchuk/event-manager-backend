import express from 'express';
import router from './routes/index';

import connection, { dbParameters } from './configs/db.config';
import sendComingEmail from './utils/sendComingEmail';

const cors = require('cors');
const http = require('http');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const { Server } = require('socket.io');

const {
  FILE_SIZE_LIMIT, CLIENT_URL, appParameters, httpStatusCode, languages,
} = require('./constants');

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: languages.ENGLISH,
    preload: [languages.ENGLISH, languages.GERMAN],
    backend: {
      loadPath: './locales/{{lng}}/translation.json',
    },
  });

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: CLIENT_URL,
  preflightContinue: true,
  optionsSuccessStatus: httpStatusCode.OK,
  credentials: true,
  methods: 'GET,PUT,PATCH,POST,DELETE',
};

const io = new Server(server, {
  cors: corsOptions,
});

io.on('connection', (socket) => {
  console.log(`User ${socket.id} has connected`);

  socket.on('join_chat', (data) => {
    socket.join(data.id);
    console.log(`User ${socket.id} has joined chat ${data.id} as ${data.role}`);
  });

  socket.on('send_message', (data) => {
    console.log(data);
    socket.to(data.room).emit('receive_message', {
      date: `${new Date().getHours()}:${(new Date().getMinutes() < 10 ? '0' : '') + new Date().getMinutes()}`,
      userId: data.userId,
      text: data.text,
    });
  });

  socket.on('disconnect', () => {
    console.log(`user ${socket.id} has disconnected`);
  });
});

app.use(middleware.handle(i18next));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json({ limit: FILE_SIZE_LIMIT }));
app.use(express.raw());
app.use(express.urlencoded({ extended: true, limit: FILE_SIZE_LIMIT }));

app.use(router);

cron.schedule('0 */1 * * *', () => {
  try {
    const time = new Date();
    time.setHours(time.getHours() + 3);
    console.log('running a task every', time);

    const sqlQuery = `SELECT e.id , u.email
    FROM ${dbParameters.NAME}.events e 
    JOIN ${dbParameters.NAME}.user_events ue 
    ON e.id = ue.event_id
    JOIN ${dbParameters.NAME}.users u 
    ON ue.user_id = u.id
    WHERE (eventDate BETWEEN '2022-04-07 15:00:00' AND '2022-04-07 15:35:00')
    AND ue.isConfirmed = '1';`;

    connection.query(sqlQuery, (err, result) => {
      sendComingEmail(result);
      console.log('result: ', result);
    });
  } catch (e) {
    console.log(e);
  }
});

const startServer = async () => {
  try {
    server.listen(appParameters.PORT, () => {
      console.info(`server started on port ${appParameters.PORT}!`);
    });
  } catch (error) {
    if (!!error) {
      console.log(`the ${error} happend with server`);
      console.log(`it means ${error.message}`);
    }
  }
};

startServer();
