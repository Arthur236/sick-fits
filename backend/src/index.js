const cookieParser = require('cookie-parser');

require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// Parse cookies into a nicely formatted object instead of teh normal cookie string
server.express.use(cookieParser());

// TODO Use express middleware to populate current user

server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL,
  },
}, deets => {
  console.log('\x1b[35m%s\x1b[0m', `\nServer is now running on http://localhost:${deets.port}`);
});

