import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  // TODO use NODE_ENV in building the following env file path
  path: path.resolve(__dirname, '../../.env.e2e'),
});
