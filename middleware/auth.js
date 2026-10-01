import {createStudent,store} from '../services/store.js';

const sessionCookie = 's2c_session';
const newSessionStudent = () => createStudent({name:'Guest User',email:'guest@skill2career.ai',education:{},interests:[],skills:[],profileCompleted:false,createdAt:new Date(),updatedAt:new Date()});
const readCookies = (header = '') => Object.fromEntries(header.split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, value]) => key && value));

export const attachUser=(req,res,next)=>{
	const cookies=readCookies(req.headers.cookie);
	let student=cookies[sessionCookie] ? store.findStudent(cookies[sessionCookie]) : null;
	if(!student){
		student=newSessionStudent();
		res.setHeader('Set-Cookie',`${sessionCookie}=${encodeURIComponent(student._id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
	}
	req.user=student;
	next();
};
export const requireAuth=(req,res,next)=>req.user?next():attachUser(req,res,next);
export const requireAdmin=(req,res,next)=>res.status(404).json({error:'Admin features are not enabled in guest mode.'});
export function user(req){return req.user||store.guest;}
