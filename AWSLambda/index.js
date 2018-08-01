/* eslint-disable  func-names */
/* eslint-disable  no-console */

var Alexa       = require('ask-sdk-core'),
    mySQL       = require('mysql'),
    CONFIG      = require('./config.json');
  

//Simple db query, returns a promise
function dbQuery (query, db) {
  return new Promise ((resolve, reject) => {
      db.query(query, function(err, result) {
        db.end();                             //Must always include this, otherwise lambda function will time out
      	if (err) {
      		reject(err);
      	} else {
        	resolve(result);
      	}
    });
  });
}

//Function for posting data to db, returns a promise
function dbPost (query, dbPost, db) {
  return new Promise ((resolve, reject) => {
      db.query(query, dbPost, function(err, result) {
        db.end();                             
      	if (err) {
      		reject(err);
      	} else {
        	resolve(result);
      	}
    });
  });
}


const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  
  handle(handlerInput) {
    //Establish db connection
    var db  = mySQL.createConnection({
      host: CONFIG.dbHost,
      user: CONFIG.dbUser,
      password: CONFIG.dbPassword,
      database: CONFIG.dbName
    });
  
    //Need to pass data to next instance of lambda function so user cannot login without first giving password
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    attributes.loggedIn = false;
    
    //The unique identifier of the Alexa device being used, keep track of it like a username
    const deviceID = handlerInput.requestEnvelope.context.System.device.deviceId;
    const sql = 'SELECT password, email, userID FROM userInfo where device="' + deviceID + '"';

    return new Promise((resolve, reject) => {
      dbQuery(sql, db).then((response) => {
        //If there is no password registered to the user...
        if (response[0] === undefined) {
          attributes.needsNewPassword = true;
          attributes.needsRegisterEmail = true;
          handlerInput.attributesManager.setSessionAttributes(attributes);
          resolve(handlerInput.responseBuilder.speak('This is your first time using I2B2 on this device.\nPlease choose a password by saying "My new password is", followed by your new password.\nMake sure your password is a real word that I can understand.')
          .reprompt('Please choose a password by saying "My new password is", followed by your new password.\nMake sure your password is a real word that I can understand.')
          .getResponse());
        //If there is a password registered, the user already registered an email too
        }
        else if (response[0].email == '') {
          const speechText = 'You have created a password, but have not yet registered your email. To do this, please say "My email is" followed by your email';
          resolve(handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse());
        }
        else {
          attributes.needsNewPassword = false;
          attributes.needsRegisterEmail = false;
          const speechText = 'What is your password?';
          handlerInput.attributesManager.setSessionAttributes(attributes);
          resolve(handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse());
        }
      }).catch((error) => {
        resolve(handlerInput.responseBuilder.speak('Error occured during launch. Please contact developer').getResponse());
      });
    });
  },
};

const createPasswordIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'createPassword';
  },
  
  handle(handlerInput) {
    var db  = mySQL.createConnection({
    host: CONFIG.dbHost,
    user: CONFIG.dbUser,
    password: CONFIG.dbPassword,
    database: CONFIG.dbName
  });
  
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    //Making sure user actually needs a new password
    if (attributes.needsNewPassword) {
      
      const deviceID = handlerInput.requestEnvelope.context.System.device.deviceId;
      const newPassword = handlerInput.requestEnvelope.request.intent.slots.password.value;
      const sql = 'INSERT INTO userInfo SET ?';
      const postDB = {device: deviceID, password: newPassword, userID: null};
      
      return new Promise ((resolve, reject) => {
        dbPost(sql, postDB, db).then((response) => {
          attributes.needsNewPassword = false;
          handlerInput.attributesManager.setSessionAttributes(attributes);
          const speechText = 'New password created.\nNow we must register your email as I2B2 will send you emails regarding your query results. Please say "My email is" followed by your email. Spell out your email letter by letter'; ;
          resolve(handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse());
        }).catch((error) => {
          console.log(error);
          resolve(handlerInput.responseBuilder.speak('Error occurred while creating password. Please contact developer').getResponse());
        });
      });
    } 
    //Handles situation if user tries to create new password again, but hasnt yet registered email
    else if (attributes.needsRegisterEmail) {
      const speechText = 'Your password has already been created. Please register your email by saying "My email is" followed by your email';
      return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(speechText)
          .getResponse();
    } else {
        const speechText = 'This account already has a password. To login, please say "My password is", followed by your password';
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(speechText)
          .getResponse();
    }
  }
};

const registerEmailIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'registerEmail';
  },
  
  handle(handlerInput) {
    var db  = mySQL.createConnection({
    host: CONFIG.dbHost,
    user: CONFIG.dbUser,
    password: CONFIG.dbPassword,
    database: CONFIG.dbName
    });
    
    const deviceID = handlerInput.requestEnvelope.context.System.device.deviceId;
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const email = handlerInput.requestEnvelope.request.intent.slots.email.value;
    const sql = 'UPDATE userInfo SET email = "' + email + '" WHERE device = "' + deviceID + '"';
    
    if (attributes.needsNewPassword) {
      const speechText = 'This account does not have a registered password yet. Please create a password first by saying "My new password is", followed by your password';
       return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
    
    else if (attributes.needsRegisterEmail) {
      return new Promise ((resolve, reject) => {
        dbQuery(sql, db).then((response) => {
          attributes.needsRegisterEmail = false;
          handlerInput.attributesManager.setSessionAttributes(attributes);
          const speechText = 'Email is now registered.\nPlease login now by saying "My password is" followed by your password';
          resolve(handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse());
        }).catch((error) => {
          console.log(error);
          resolve(handlerInput.responseBuilder.speak('Error occurred while registering email. Please contact developer').getResponse());
        });
      });
    } else {
      const speechText = 'This account already has an email registered. To login, please say "My password is", followed by your password';
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(speechText)
          .getResponse();
    }
  }
};

const loginIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'login';
  },
  
  handle (handlerInput) {
    var db  = mySQL.createConnection({
    host: CONFIG.dbHost,
    user: CONFIG.dbUser,
    password: CONFIG.dbPassword,
    database: CONFIG.dbName
  });
  
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const deviceID = handlerInput.requestEnvelope.context.System.device.deviceId;
    const password = handlerInput.requestEnvelope.request.intent.slots.password.value;
    const sql = 'SELECT password, userID FROM userInfo WHERE device = "' + deviceID + '"';
    
    //If user has both a password and email...
    if (!attributes.needNewPassword && !attributes.needsRegisterEmail) {
      return new Promise ((resolve, reject) => {
        dbQuery(sql, db).then((response) => {
          if (response[0].password === password) {
            attributes.loggedIn = true;
            attributes.userID = response[0].userID;
            handlerInput.attributesManager.setSessionAttributes(attributes);
            const speechText = 'You are now logged in. You may now query I2B2';
            resolve(handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse());
          } else {
              const speechText = 'That is the incorrect password. Please try again';
              resolve(handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse());
          }
        }).catch((error) => {
            console.log(error);
            const speechText = 'Authentication error. Please contact developer';
            resolve(handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse());
        });
      });
    } else {
        const speechText = 'You still need to create a password or register your email. Say "My new password is" followed by a password to create your password. Otherwise, say "My email is" followed by your email';
        return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
  }
};

const patientQueryIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'patientQuery';
  },
  
  handle(handlerInput) {
  //Handles situation in which user attempts to access data before entering password
  if (handlerInput.attributesManager.getSessionAttributes().loggedIn == false) {
    const speechText = 'You cannot access any data before entering your password. Please respond by saying "My password is", followed by your password';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  } else {
      
    var db  = mySQL.createConnection({
      host: CONFIG.dbHost,
      user: CONFIG.dbUser,
      password: CONFIG.dbPassword,
      database: CONFIG.dbName
    });
    
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const userID = attributes.userID;
    console.log(userID)
    const query = handlerInput.requestEnvelope.request.intent.slots.query.value;
    const sqlWrite = 'INSERT INTO querys SET ?';
    const postDB = {query: query, userID: userID, queryID: null};
    const sqlRead = 'SELECT * FROM querys ORDER BY queryID DESC LIMIT 1';
      
      //Write to database
      db.query(sqlWrite, postDB, function(err, result) {
        if (err) {
          console.log(err);
          console.log('SOMETHING WRONG WITH DB WRITE');
        } else {
          console.log('WROTE TO DB!');
        }
      });
       
      //Read from database in return statement, must return as promise otherwise will return before db is queried
      return new Promise((resolve, reject) => {
        dbQuery(sqlRead, db).then((response) => {
          const speechText = 'Accessing data for query: ' + query + '. If you would like to make another request, you may do so now. Otherwise say exit to exit I2B2';
          resolve(handlerInput.responseBuilder.speak(speechText).reprompt('If you would like to make another request, you may do so now.').getResponse());
        }).catch((error) => {
          resolve(handlerInput.responseBuilder.speak('Query error. Please contact developer')
          .getResponse());
        });
      });
    }
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  
  handle(handlerInput) {
    const speechText = 'You can query me for patient data, similar to I2B2. Say something like: show me patients with influenza. I can also filter age groups. For example say: give me patients between the ages of 55 and 60 with acute pancreatitis';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
 //Order of these matters, will execute the canhandle() functions in these orders
  .addRequestHandlers( 
    LaunchRequestHandler,
    createPasswordIntentHandler,
    registerEmailIntentHandler,
    loginIntentHandler,
    patientQueryIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();                          //Handles the creation of the skill and routing requests/responses through AWS Lambda function  
