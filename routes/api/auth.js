const express = require('express');
const Users = require('../../models/Users');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth  = require('./middleware/authentication')
const User = require('../../models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');


// @route GET api/auth
// @desc  authenticate, give token 
// @access Public


router.get('/', auth , async (req, res) => {
    try{
        const user = await Users.findById(req.user.id).select('-password');
        res.json(user);
    }catch( err){
        console.error(err.message);
        res.status(500).send("server error");
    } 
});

router.post('/', [
    
    check('password','Invalid Credentials').exists(),
    check('email', 'Please enter valid Email').isEmail()
], async  (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {email,password} = req.body;
    try{
        // see if users exists
        let user = await User.findOne({email});
        if(!user) {
           return res.status(400).json({error: [{msg: 'Invalid Credential'}]});
        }

    
    // return jsonwebtoken
    const isMatch  = await bcrypt.compare(password,user.password);
    if(!isMatch) {
        return res.status(400).json({error: [{msg: 'Invalid Credential'}]});
     };
    const payload = {
        user : {
            id : user.id
        }
    };
    
    jwt.sign(payload, config.get('jwtToken'), {expiresIn : 3600}, (err,token) => {
        if (err) throw err;
    else{res.json({ token });
    }})

    

    } catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
         
    }
    
});

module.exports = router;