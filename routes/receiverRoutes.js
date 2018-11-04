const _ = require('lodash');
const Path = require('path-parser');
const { URL } = require('url');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');

const Receiver = mongoose.model('receivers');

module.exports = app => {

  app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
  });

  app.get('/api/receivers', async (req, res) => {
    const receivers = await Receiver.find({ _user: req.user.id }).select({
      recipients: false
    });

    res.send(receivers);
  });

  app.post('/update_tag_to_connection', async (req, res) => {
    console.log('req.body in update_tag_to_connection route', req.body);

    let numOfLoops=0;

    let updateReceiverTag = function(){
       Receiver.update(
          { publicIdentifier: req.body.connection_id }, 
          { $push: { licampaigns: req.body.tags, liusers: req.body.user_id} },
          function(err,numAffected) {
            if(numAffected.nModified==0 && numOfLoops<10){
              console.log('numAffected===0 loop with: ', req.body.connection_id);
              console.log('numOfLoops: ', numOfLoops);
              numOfLoops++;
              setTimeout(function(){ updateReceiverTag(); }, 3000);

            }
            console.log('numAffected: ', numAffected);
             // something with the result in here
          }
       );
    }

    updateReceiverTag();

    res.send(req.body);

  });
  

  app.post('/add_profile', async (req, res) => {
    console.log('req.body in receivers route', req.body);

    const {  firstName,
              lastName,
              entityUrn,
              objectUrn,
              headline,
              publicIdentifier,
              industryCode,
              picture,
              trackingId,
              locationName,
              postalCode,
              versionTag,
              schoolName,
              fieldOfStudy,
              title,
              companyName,
              languages,
              email,
              phone,
              skills } = req.body;

        //If it's the add-profile api call of followup process:

        if(email != ''){
          let numOfLoops=0;
          let updateReceiver = function(){
            Receiver.update(
                { publicIdentifier: publicIdentifier }, 
                { $set: { email: email} },
                function(err,numAffected) {
                  if (err){
                    console.log('err within updateReceiver func: ',err);
                  }
                  if(numAffected.nModified==0 && numOfLoops<10){
                    console.log('numAffected===0 loop with: ', req.body.connection_id);
                    console.log('numOfLoops: ', numOfLoops);
                    numOfLoops++;
                    setTimeout(function(){ updateReceiver(); }, 3000);

                  }
                  console.log('numAffected: ', numAffected);
                  
                   // something with the result in here
                }
             );
          }
          updateReceiver();
        } else {
            const receiver = new Receiver({
              firstName,
              lastName,
              entityUrn,
              objectUrn,
              headline,
              publicIdentifier,
              industryCode,
              picture,
              trackingId,
              locationName,
              postalCode,
              versionTag,
              schoolName,
              fieldOfStudy,
              title,
              companyName,  
              languages,
              email,
              phone,
              skills: skills? skills.split(',').map(skill => { 
                skill = skill.split('||');
                return { skill: skill[0], rating: skill[1]};
              }): '',
              dateAccepted: Date.now()
            });

            console.log('receiver: ',receiver);

            // Great place to send an email!


            try {
              // await receiver.save();

              await receiver.save();
              res.send({"success":"Profile saved"});
            } catch (err) {
              res.status(422).send(err);
            }

    // res.send(user);
   }
  });
};


