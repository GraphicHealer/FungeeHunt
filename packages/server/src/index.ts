import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';
import { config } from './config';
import authRoute from './routes/auth';
import configRoute from './routes/config';
import gamesRoute from './routes/games';
import joinRoute from './routes/join';
import playRoute from './routes/play';
import archiveRoute from './routes/archive';
import submitRoute from './routes/submit';
import tasksRoute from './routes/tasks';
import teamsRoute from './routes/teams';
import playersRoute from './routes/players';
import viewRoute from './routes/view';
import submissionsRoute from './routes/submissions';
import bonusesRoute from './routes/bonuses';
import rulesRoute from './routes/rules';
import settingsRoute from './routes/settings';
import recapRoute from './routes/recap';
import { seedSystemSettings, seedStyleProfiles } from './lib/defaults';
import { logger } from './lib/logger';
import { gmAuth } from './middleware/gmAuth';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.set('io', io);

app.use(express.json());
app.use('/uploads', express.static(config.UPLOAD_DIR));
app.use('/api/config', configRoute);
app.use('/api/auth', authRoute);
app.use('/api/join', joinRoute);
app.use('/api/archive/:code', archiveRoute);
app.use('/api/play/:code', playRoute);
app.use('/api/play/:code/tasks/:taskId/submit', submitRoute);
app.use('/api/view/:code', viewRoute);
app.use('/api/gm/games', gmAuth, gamesRoute);
app.use('/api/gm/games/:gameId/submissions', gmAuth, submissionsRoute);
app.use('/api/gm/games/:gameId/tasks', gmAuth, tasksRoute);
app.use('/api/gm/games/:gameId/teams', gmAuth, teamsRoute);
app.use('/api/gm/games/:gameId/players', gmAuth, playersRoute);
app.use('/api/gm/games/:gameId/bonuses', gmAuth, bonusesRoute);
app.use('/api/gm/games/:gameId/rules', gmAuth, rulesRoute);
app.use('/api/gm/games/:gameId/recap', gmAuth, recapRoute);
app.use('/api/gm/settings', gmAuth, settingsRoute);

app.use(express.static(config.FRONTEND_BUILD_DIR));
app.get('*', (_req, res) => {
  res.sendFile(path.join(config.FRONTEND_BUILD_DIR, '200.html'));
});

io.on('connection', (socket) => {
  logger.debug('socket connected', socket.id);

  socket.on('disconnect', () => {
    logger.debug('socket disconnected', socket.id);
  });
});

console.log(`Starting Fungee-Hunt with LOG_LEVEL=${config.LOG_LEVEL}`);

seedSystemSettings()
  .then(() => seedStyleProfiles())
  .then(() => {
    server.listen(config.WEB_UI, () => {
      logger.info(`Fungee-Hunt server listening on port ${config.WEB_UI}`);
    });
  });
