import 'dotenv/config';
import app from './app';
import config from './shared/config';

const { port } = config.server;

app.listen(port, () => {
  console.log(`[server] Running on http://localhost:${port} (${config.server.nodeEnv})`);
  console.log(`[server] Health: http://localhost:${port}/health`);
});
