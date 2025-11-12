import express from 'express';
import { listJobsByState, stats, dlqList } from './jobStore.js';
import { ensureDb } from './db.js';

ensureDb();
const app = express();
app.get('/',(req,res)=>{
  const s = stats();
  res.send(`<h1>queuectl</h1><pre>${JSON.stringify(s,null,2)}</pre>`);
});
app.get('/jobs',(req,res)=>{
  const { state } = req.query;
  res.json(listJobsByState(state));
});
app.get('/dlq',(req,res)=> res.json(dlqList()));
const port = process.env.PORT || 3030;
app.listen(port, ()=> console.log('dashboard at http://localhost:'+port));
