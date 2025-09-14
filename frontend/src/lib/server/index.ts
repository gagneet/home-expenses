import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './api/auth';
import uploadRouter from './api/upload';
import accountsRouter from './api/accounts';
import transactionsRouter from './api/transactions';
import investmentsRouter from './api/investments';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/statements', uploadRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/investments', investmentsRouter);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
