import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './shared/config';
import { errorHandler } from './shared/middlewares/errorHandler';
import { notFound } from './shared/middlewares/notFound';

import appointmentsRoutes from './modules/appointments/appointments.routes';
import lawyersRoutes from './modules/lawyers/lawyers.routes';
import clientsRoutes from './modules/clients/clients.routes';
import contactRoutes from './modules/contact/contact.routes';
import workingScheduleRoutes from './modules/working-schedule/workingSchedule.routes';
import vacationsRoutes from './modules/vacations/vacations.routes';

const app = express();

// ─── Security & HTTP utilities ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.app.corsOrigin }));
app.use(morgan('dev'));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/appointments`, appointmentsRoutes);
app.use(`${API_PREFIX}/lawyers`, lawyersRoutes);
app.use(`${API_PREFIX}/clients`, clientsRoutes);
app.use(`${API_PREFIX}/contact`, contactRoutes);
app.use(`${API_PREFIX}/working-schedule`, workingScheduleRoutes);
app.use(`${API_PREFIX}/vacations`, vacationsRoutes);

// ─── Error handling (must be last) ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
