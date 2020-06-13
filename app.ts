import express, { Request, Response, Express } from 'express';
import { join } from 'path';

const app: Express = express();
const PORT: number = process.argv[2] ? parseInt(process.argv[2]) : ( parseInt(<string> process.env.PORT) || 80 );

app.use('/static', express.static(join(__dirname, '/static')));

app.get('/', (req: Request, res: Response) => {
    res.sendFile(join(__dirname, '/static', '/main', '/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}.`);
});