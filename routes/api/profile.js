const express = require('express');
const router = express.Router()
const auth  = require('./middleware/authentication')
const Profile = require('../../models/Profile')
const User = require('../../models/Users')
const {check, validationResult} = require('express-validator')


// @route GET api/profile/me
// @desc  get current user profile
// @access Private
router.get('/me', auth, async(req,res) => {
    try {
            const profile = await Profile.findOne({user : req.user.id}).populate('user',['name','avatar']);
            if (!profile) {
                return res.status(400).json({msg : 'There is no profie for this user'})
            }   
            res.json(profile )
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

// @route GET api/profile
// @desc  create update user profile
// @access Private

router.post('/', [auth, [
    check('status', 'status is required').not().isEmpty(),
    check('skills','skills is required').not().isEmpty(),
]],
async  (req , res ) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        instagram,
        linkedIn
    } = req.body;

    // build profile object
    const profileFeilds = {}
    profileFeilds.user = req.userid;
    if (company) profileFeilds.company = company;
    if (website) profileFeilds.website = website;
    if (location) profileFeilds.location = location;
    if (bio) profileFeilds.bio = bio;
    if (status) profileFeilds.status = status;
    if (githubusername) profileFeilds.githubusername = githubusername;
    if (skills) {
        profileFeilds.skills = skills.split(',').map(skill => skill.trim());
    profileFeilds.social ={}
    if (youtube) profileFeilds.social.youtube = youtube;
    if (facebook) profileFeilds.social.twitter = facebook;
    if (instagram) profileFeilds.social.instagram = instagram;
    if (linkedIn) profileFeilds.social.linkedIn= linkedIn;
   
    try {
        let profile = await Profile.findOne({user: req.user.id});
        if(profile){
            profile = await Profile.findOneAndUpdate({user : req.user.id}, {$set : profileFeilds }, {new :true});
            return res.json(profile);
        }
        profile = new Profile(profileFeilds);

        await profile.save()
        res.json(profile);
    }

   
    catch(err){
        console.error(err.message);
        res.status(500).send("server error");
    }

}
});


module.exports = router;