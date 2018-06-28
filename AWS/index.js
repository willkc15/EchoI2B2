/* eslint-disable  func-names */
/* eslint-disable  no-console */

var Alexa       = require('ask-sdk-core'),
    mySQL       = require('mysql');

//Establish db connection
var db  = mySQL.createConnection({
      host: "i2b2querystore.cncfflqccsyv.us-east-1.rds.amazonaws.com",
      user: "willkc15",
      password: 'gastonbella',
      database: 'i2b2querystore'
    });

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
    
    if (firstAge === undefined && secondAge === undefined) {
      speechText = "Accessing data for patients ";
    }
    else if (disease === undefined) {
      speechText += "between the ages of " + firstAge + " and " + secondAge; 
    } else {
      speechText += "between the ages of " + firstAge + " and " + secondAge + " with " + disease;
    }
    //Accessing rds db logic here
    db.connect();
  
    let sql = "SELECT * FROM querys ORDER BY id ASC LIMIT 1";
    db.query(sql, function(err, result) {
      db.end();
    	if (err) {
    		console.log(err);
    	} else {
      		disease = (result[0].disease);
          speechText = disease;
          console.log("Have speech text");
    	}
    });
    
    //************
    //MAIN PROBLEM: 
    //Need var speechText to update with value from the database,
    //but keeps returning before the query has been processed,
    //therefore not updating speechText. I have tried putting the 
    //return statements in the callback function but still get an error
    //************
   
    return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt("Any more searches?") //Will reprompt user after a certain amount of silence from the user
                .getResponse();
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
