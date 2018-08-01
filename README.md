ECHO I2B2 - Wake Forest Baptist Intern Project
	
The goal of this project is to create an Alexa skill which will allow users to query I2B2 through simple voice interactions with an Amazon echo device.

IMPLEMENTATION
	
Used the Alexa Skills Kit(ASK) SDK available through Amazon's developer console to create a list of voice commands that Alexa will "wake up" to and answer user questions. The developer console transforms the intents and utterances the developer creates into JSON to send to the service endpoint. I've chosen the endpoint to be hosted as an AWS Lambda function, which handles much of the server management and is free up to 1 million requests per month. This lambda function takes the users query which we gather from the JSON sent to Lambda and stores it in a mySQL db. The Lambda function also handles user authentication. I then wrote python code on my personal machine connected to the Wake network which checks the db every 5 seconds and pulls a query if it is new. The code then sends a series of XML requests to an I2B2 endpoint which ultimately returns the result we are looking for. The result is then stored in the db. An automatic email is also sent to the user with the result. 
 

MOVING FORWARD

Prototype is complete but could still use many improvements:
- Better user authentication. Right now we are just storing a password and email in db. I'm also using the deviceID of the Alexa device as a unique identifier for each user which could cause problems for multiple users on a single device.
- Individual search keys we gather from I2B2 are currently assigned a random totalNum value as this prototype does not access the real I2B2 data. We then use Levenshteins algorithm as a tiebreak. This is good behavior but the totalNum value will need to be gathered from I2B2 instead of assigned a random value to make it function correctly.
- Eventually, when Amazon develops the capabilities, it would be great to send the result back to Alexa and have her speak it out to the user. 



