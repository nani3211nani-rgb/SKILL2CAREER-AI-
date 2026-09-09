import {store} from '../services/store.js';
export const requireAuth=(req,res,next)=>next();
export const requireAdmin=(req,res,next)=>res.status(404).json({error:'Admin features are not enabled in guest mode.'});
export function user(req){return store.guest;}
