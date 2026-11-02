import cors from 'cors';
import express from 'express';
import routes from './routes.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

// Support both /api/* and root routes
app.use('/api', routes);
app.use(routes);

app.use((_request, response) => response.status(404).json({ error: 'NOT_FOUND', message: 'المسار غير موجود.' }));
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ error: 'INTERNAL_ERROR', message: 'حدث خطأ غير متوقع.' });
});

export default app;
