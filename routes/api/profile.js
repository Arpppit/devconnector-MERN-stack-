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

// @route GET api/profile
// @desc  get all profiles
// @access Public

router.get('/',async (req,res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name','avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message)
        res.status(500).send("Server Error")
    }
});

// @route GET api/profile/user/:user_id
// @desc  get  profiles by user ID
// @access Public

router.get('/user/:user_id',async (req,res) => {
    try {
        const profile = await Profile.findOne({user : req.params.user_id}).populate('user', ['name','avatar']);
        if (!profile) return res.status(400).json({msg : "Profile not found" })
        res.json(profiles);
    } catch (err) {
        if (err.kind == 'ObjectID'){
            return res.status(400).json({msg : "Profile not found" })
        }
        console.error(err.message)
        res.status(500).send("Server Error")
    }
});

// @route DELETE api/profile
// @desc  delete profile and post
// @access Private

router.delete('/', auth, async (req,res) => {
    try { 
         await Profile.findOneAndRemove({ user: req.user.id })
         await User.findOneAndRemove({ _id: req.user.id })
        res.json({"msg":"User Deleted"});
    } catch (err) {
        console.error(err.message)
        res.status(500).send("Server Error") 
    }
});


// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post(
    '/experience',
   auth, 
    (req, res) => {
      const { errors, isValid } = validateExperienceInput(req.body);
  
      // Check Validation
      if (!isValid) {
        // Return any errors with 400 status
        return res.status(400).json(errors);
      }
  
      Profile.findOne({ user: req.user.id }).then(profile => {
        const newExp = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };
  
        // Add to exp array
        profile.experience.unshift(newExp);
  
        profile.save().then(profile => res.json(profile));
      });
    }
  );

  // @route   POST api/profile/education
// @desc    Add education to profile
// @access  Private
router.post(
    '/education',
    auth,
    (req, res) => {
      const { errors, isValid } = validateEducationInput(req.body);
  
      // Check Validation
      if (!isValid) {
        // Return any errors with 400 status
        return res.status(400).json(errors);
      }
  
      Profile.findOne({ user: req.user.id }).then(profile => {
        const newEdu = {
          school: req.body.school,
          degree: req.body.degree,
          fieldofstudy: req.body.fieldofstudy,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };
  
        // Add to exp array
        profile.education.unshift(newEdu);
  
        profile.save().then(profile => res.json(profile));
      });
    }
  );

  // @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete(
    '/experience/:exp_id',
   auth,
    (req, res) => {
      Profile.findOne({ user: req.user.id })
        .then(profile => {
          // Get remove index
          const removeIndex = profile.experience
            .map(item => item.id)
            .indexOf(req.params.exp_id);
  
          // Splice out of array
          profile.experience.splice(removeIndex, 1);
  
          // Save
          profile.save().then(profile => res.json(profile));
        })
        .catch(err => res.status(404).json(err));
    }
  );
  
  // @route   DELETE api/profile/education/:edu_id
  // @desc    Delete education from profile
  // @access  Private
  router.delete(
    '/education/:edu_id',
   auth,
    (req, res) => {
      Profile.findOne({ user: req.user.id })
        .then(profile => {
          // Get remove index
          const removeIndex = profile.education
            .map(item => item.id)
            .indexOf(req.params.edu_id);
  
          // Splice out of array
          profile.education.splice(removeIndex, 1);
  
          // Save
          profile.save().then(profile => res.json(profile));
        })
        .catch(err => res.status(404).json(err));
    }
  );
  
  // @route   DELETE api/profile
  // @desc    Delete user and profile
  // @access  Private
  router.delete(
    '/',
   auth,
    (req, res) => {
      Profile.findOneAndRemove({ user: req.user.id }).then(() => {
        User.findOneAndRemove({ _id: req.user.id }).then(() =>
          res.json({ success: true })
        );
      });
    }
  );

module.exports = router;