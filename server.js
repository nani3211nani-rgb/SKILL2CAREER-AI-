import express from 'express';import helmet from 'helmet';import rateLimit from 'express-rate-limit';import path from 'path';import {fileURLToPath} from 'url';import {env} from './config/env.js';import student from './routes/student.js';import careers from './routes/careers.js';import ai from './routes/ai.js';
const app=express(),root=path.dirname(fileURLToPath(import.meta.url));
app.use(helmet({contentSecurityPolicy:false}));app.use(express.json({limit:'100kb'}));
app.get('/api/health',(req,res)=>res.json({ok:true,storage:'in-memory',aiConfigured:Boolean((env.geminiApiKey&&env.geminiModel)||(env.groqApiKey&&env.groqModel)||(env.mistralApiKey&&env.mistralModel)||(env.youtubeApiKey)),providers:{gemini:Boolean(env.geminiApiKey&&env.geminiModel),groq:Boolean(env.groqApiKey&&env.groqModel),mistral:Boolean(env.mistralApiKey&&env.mistralModel),youtube:Boolean(env.youtubeApiKey)}}));
app.use('/api',rateLimit({windowMs:15*60*1000,max:500}));app.use('/api/student',student);app.use('/api',careers);app.use('/api/ai',rateLimit({windowMs:15*60*1000,max:40}),ai);
app.use(express.static(path.join(root,'public')));app.get('*',(req,res)=>res.sendFile(path.join(root,'public','index.html')));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Something went wrong. Please try again.'})});
app.listen(env.port,()=>console.log(`Skill2Career AI: http://localhost:${env.port}`));
