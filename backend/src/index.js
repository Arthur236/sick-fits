const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// Parse cookies into a nicely formatted object instead of teh normal cookie string
server.express.use(cookieParser());

// Decode the jwt so we can get the user id on each request
server.express.use((req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);

    // put the userId onto the request for future requests to access
    req.userId = userId;
  }

  next();
});

server.start({
  cors: {
    credentials: true,
    origin: process.env.FRONTEND_URL,
  },
}, deets => {
  console.log('\x1b[35m%s\x1b[0m', `\nServer is now running on http://localhost:${deets.port}`);
});

