/* eslint-disable  func-names */
/* eslint-disable  no-console */

var Alexa       = require('ask-sdk-core'),
    mySQL       = require('mysql');



//This function returns a promise which we use to return in the patientquery intent handler
function dbQuery (query, db) {
  return new Promise ((resolve, reject) => {
      db.query(query, function(err, result) {
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
    const speechText = 'Welcome to I2B2, what can I help you with today?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)           //This is needed if we want the user to be able to query Alexa multiple times, should be included in every handler that allows the user to prompt Alexa again
      .getResponse();                 //This is needed as part of the responseBuilder helper function if anything is spoken by Alexa
  },
};

const patientQueryIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'patientQuery';
  },
  handle(handlerInput) {
    var speechText = "Accessing data for patients ";
    
    //Variables for each of the slot types
    var disease = handlerInput.requestEnvelope.request.intent.slots.disease.value;
    var firstAge = handlerInput.requestEnvelope.request.intent.slots.firstAge.value;
    var secondAge = handlerInput.requestEnvelope.request.intent.slots.secondAge.value;
    
    //Decides which speech text to send back to Alexa 
    if (firstAge === undefined && secondAge === undefined) {
      speechText += "with " + disease;
    }
    else if (disease === undefined) {
      speechText += "between the ages of " + firstAge + " and " + secondAge; 
    } else {
      speechText += "between the ages of " + firstAge + " and " + secondAge + " with " + disease;
    }
    
      
    //Establish db connection
    var db  = mySQL.createConnection({
      host: "i2b2querystore.cncfflqccsyv.us-east-1.rds.amazonaws.com",
      user: "willkc15",
      password: 'gastonbella',
      database: 'i2b2querystore'
    });
  
    let sqlWrite = "INSERT INTO querys SET ?";
    let postDB = {disease: disease, firstAge: firstAge, secondAge: secondAge, id: null}; 
    let sqlRead = "SELECT * FROM querys ORDER BY id DESC LIMIT 1";
    
    //Write to database
    db.query(sqlWrite, postDB, function(err, result) {
      if (err) {
        console.log('SOMETHING WRONG WITH DB WRITE');
      } else {
        console.log("WROTE TO DB!");
      }
    });
     
    //Read from database
    //Must return in this fashion, otherwise will return before db is queried
    return new Promise((resolve, reject) => {
     dbQuery(sqlRead, db).then((response) => {
       resolve(handlerInput.responseBuilder.speak(speechText + ': ' + response[0].disease).getResponse());
     }).catch((error) => {
        resolve(handlerInput.responseBuilder.speak('PROMISE NOT WORKING')
        .getResponse());
      });
    });
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
  .addRequestHandlers( 
    LaunchRequestHandler,             //Order of these matters, will execute the canhandle() functions in these orders
    patientQueryIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();                          //Handles the creation of the skill and routing requests/responses through AWS Lambda function  
