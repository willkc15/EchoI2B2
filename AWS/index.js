/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');

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

/*
  Handles query requests about patients with the only search
  criteria being a disease or diagnosis the patient might have. Does
  not include age groups, tobacco history, study enrollments, etc. 
  Ex: 'Show me patients with lymphoma'
*/

const patientDiseaseIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'patientsWithDisease';
  },
  handle(handlerInput) {
    var speechText = 'Accessing data of patients with ';
    
    var disease = handlerInput.requestEnvelope.request.intent.slots["disease"].value;
    speechText += disease;
    
    //Accessing I2B2 API logic should go here

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('Any more searches?') //Not sure what the parameter does... it does not reprompt the user with the given string           
      .getResponse();         
  },
};

/*
  Handles query requests with the only search criteria being
  the patients age. This handler currently allows for two types of
  age requests: a specific age or a range of ages.
  Ex: 'Show me patients that are 25 years old' or 'Show me patients'
  between the ages of 55 and 60'
*/

const patientAgeIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'patientsOfAge';
  },
  handle(handlerInput) {
    var speechText = 'Accesing data of patients ';
    
    var slots = handlerInput.requestEnvelope.request.intent.slots;
    var firstAge = slots["firstAge"].value;
    var secondAge = slots["secondAge"].value;
    
    if (secondAge === undefined) {
      speechText += 'of age ' + firstAge;
    } else {
      speechText += 'between the ages of ' + firstAge + ' and ' + secondAge;
    }
    
     //Accessing I2B2 API logic should go here

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('Any more searches?')           
      .getResponse();         
  },
};

/*
  Handles a complete I2B2 request, which currently only includes both age
  and diagnosis, packaging them together into a single request.
  Ex: 'Show me patients between the ages of 45 and 55 with hypertension'
*/
const patientCompleteIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'patientsComplete';
  },
  handle(handlerInput) {
    var speechText = 'Accesing data of patients between the ages of ';
    
    var slots = handlerInput.requestEnvelope.request.intent.slots;
    var firstAge = slots["firstAge"].value;
    var secondAge = slots["secondAge"].value;
    var disease = slots["disease"].value;
    
    speechText+= firstAge + ' an ' + secondAge + ' with ' + disease;
    
    //Accessing I2B2 API logic should go here

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt('Any more searches?')            
      .getResponse();         
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can query me for patient data, similar to I2B2.!';

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
  .addRequestHandlers(                //Order of these matters, will execute the canhandle() functions in these orders
    patientDiseaseIntentHandler,
    patientAgeIntentHandler,
    patientCompleteIntentHandler,
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();                          //Handles the creation of the skill and routing requests and responses through AWS Lambda function  
