import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import summarize from './api/summarize'

const localApi = (): Plugin => ({
  name: 'local-api',
  configureServer(server) {
    server.middlewares.use('/api/summarize', async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        chunks.push(Buffer.from(chunk));
      }

      const body = chunks.length
        ? JSON.parse(Buffer.concat(chunks).toString('utf8'))
        : undefined;
      let statusCode = 200;
      let responseBody: unknown;
      const adapter = {
        status: (code: number) => {
          statusCode = code;
          return adapter;
        },
        json: (payload: unknown) => {
          responseBody = payload;
        },
      };
      await summarize(
        { method: request.method, body },
        adapter
      );
      response.statusCode = statusCode;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(responseBody));
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_MODEL = env.OPENROUTER_MODEL;
  process.env.APP_URL = env.APP_URL;

  return {
    plugins: [react(), localApi()],
    server: {
      watch: {
        ignored: ['**/.env', '**/.Env', '**/.env.*', '**/.Env.*'],
      },
    },
  };
});
