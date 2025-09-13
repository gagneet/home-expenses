import express from 'express';
import cors from 'cors';
import authRouter from './api/auth';
import uploadRouter from './api/upload';
import accountsRouter from './api/accounts';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/statements', uploadRouter);
app.use('/api/accounts', accountsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
