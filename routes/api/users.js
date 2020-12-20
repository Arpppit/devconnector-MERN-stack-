const { Router } = require('express');
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User  = require('../../models/Users')
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route       POST api/users
// @desc        Register user
// @access      Public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('password','Please enter a password with atleast 6 characters').isLength({min:6}),
    check('email', 'Please enter valid Email').isEmail()
], async  (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const { name,email,password} = req.body;
    try{
        // see if users exists
        let user = await User.findOne({email});
        if(user) {
           return res.status(400).json({error: [{msg: 'User already exists'}]});
        }
        // get user gravatar
        const avatar = gravatar.url(email,{
            s:'200',
            d:'mm'
        });
        user = new User({
            name,email,avatar,password
        });
    
    // encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password,salt);
    await user.save();
    // return jsonwebtoken

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
        res.status(500).send('Service Error');
         
    }
    
});
module.exports = router; 