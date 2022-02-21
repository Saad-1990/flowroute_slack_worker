import express from "express";

const routes = express.Router();


//Comment If we Don't want to Entertain All routes and generate Error
routes.use('/',(req,res) => { console.log('Default : '); res.send('Hello World'); });


routes.use('*',(req,res) => { res.status(401).send('Uknown Router Default Handled'); });

export const router = routes;