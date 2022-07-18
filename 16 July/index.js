require('dotenv').config();
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const cookieParser=require('cookie-parser');
const hbs = require('hbs');


app.use(express.json());// parses the request body of the api address and gets the parameters
app.use(cookieParser());// used to get the cookies stored

app.set("view engine", "hbs");// used for res.render methods

const Register = require('./models/model'); // importing the collection opf the database
const auth = require('./middleware/auth');// requiring the authe function from middleware to check the validity of th user

require('./db/db');// importing the connection of the database

const port = process.env.PORT;// accessibng the port from .env file

app.get('/',auth, (req,res)=>{// auth.js is used here for validating the user
    console.log(`Cookie is : ${req.cookies.jwt}`);// this will processes onlty if auth is verified
    res.send('hello from the other side');
})

app.post('/login',async(req,res)=>{
    try{
         const email=req.body.email;
         const password = req.body.password;
 
         const result = await Register.findOne({email:email});// checking for the document in the collection
 
         const isMatch = await bcrypt.compare(password, result.password);// matching the passwords
 
         const tokens = await result.generateJWT();// generating the token
         console.log(tokens);

         res.cookie("jwt", tokens, {// setting the cookie 
            expires:new Date(Date.now()+ 60000),
            httpOnly:true
         });// setting the jwt to the cookies
         const registered = await result.save();
 
         if(isMatch){
             res.send("login successful")
         }else{
             res.end("Invalid Credentials")
         }
     
    }catch(e){
        res.status(400).send("Invalid Login details");
    }
     
 })


app.get('/logout',auth, async (req,res)=>{
    try {
        console.log('invoked');

        req.user.tokens=req.user.tokens.filter((currElem)=>{// actually deleting the token from the database by filter method
            return currElem.token != req.token
        })

        res.clearCookie("jwt");// removing the cookies from the browser
        console.log('Logout Successfully');
        const result =await req.user.save();// saving the removal of cookies from the browser
        // console.log(result);
        res.send('Logged Out Successfully!')
    } catch (error) {
        console.log('Error')
    }
}) 


app.post('/post',async (req,res)=>{
    try {
        const result = new Register(req.body);

        const tokens = await result.generateJWT(); // method for generating the token

        res.cookie("jwt", tokens, {// setting the cokkies
            expires:new Date(Date.now()+ 60000),
            httpOnly:true
        });// setting the jwt to the cookies

        const registered = await result.save();// saving the token in the database
        console.log('saved');
        res.send(registered);
        
    } catch (error) {
        res.send(`Error from the post req`)
        console.log('error part')
    }
})

app.listen(port, ()=>{
    console.log(`Listening to the port ${port} at ${Date.now()}...`);
})