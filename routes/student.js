import {Router} from 'express';
import {catalog,store} from '../services/store.js';
import {requireAuth,user} from '../middleware/auth.js';
const r=Router();
r.get('/profile',requireAuth,(req,res)=>{const u=user(req);const {passwordHash,...safe}=u;res.json({student:safe});});
r.put('/profile',requireAuth,(req,res)=>{const u=user(req),{education,interests,careerGoalId,careerGoalName,skills,assessment}=req.body||{};
  if(education)u.education={degree:String(education.degree||'').slice(0,100),branch:String(education.branch||'').slice(0,100),year:Number(education.year)||null};
  if(Array.isArray(interests))u.interests=interests.slice(0,10).map(String);
  if(careerGoalId){const career=store.findCareer(careerGoalId);if(!career)return res.status(400).json({error:'That career path is no longer available.'});u.careerGoalId=career._id;u.careerGoal=career.name;delete u.customCareer;}
  if(careerGoalName&&!careerGoalId){const name=String(careerGoalName).trim().slice(0,120);if(name.length<2)return res.status(400).json({error:'Enter a career target with at least 2 characters.'});u.careerGoal=name;u.careerGoalId=null;u.customCareer={_id:'custom-career',name,skills:[]};}
  if(Array.isArray(skills)){const valid=new Set(['Beginner','Intermediate','Advanced']);u.skills=skills.slice(0,50).filter(x=>valid.has(x?.proficiency)).map(x=>({skillId:String(x.skillId||x.skillName||''),skillName:String(x.skillName||'').slice(0,80),proficiency:x.proficiency}));}
  if(assessment&&typeof assessment==='object')u.assessment={...assessment,completedAt:new Date().toISOString()};
  u.profileCompleted=Boolean(u.education?.degree&&u.education?.branch&&u.interests?.length&&u.careerGoal&&u.skills?.length);u.updatedAt=new Date();store.saveStudent(u);res.json({message:'Profile updated',careerGoal:u.careerGoal,skills:u.skills||[]});
});
r.post('/skills',requireAuth,(req,res)=>{const u=user(req),valid=new Set(['Beginner','Intermediate','Advanced']);u.skills=(req.body?.skills||[]).slice(0,50).filter(x=>valid.has(x.proficiency)).map(x=>({skillId:String(x.skillId||x.skillName||''),skillName:String(x.skillName||'').slice(0,80),proficiency:x.proficiency}));res.json({skills:u.skills});});
export default r;