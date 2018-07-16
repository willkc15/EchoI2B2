ECHO I2B2 - Wake Forest Baptist Intern Project
	
The goal of this project is to create an Alexa skill which will allow users to query I2B2 through simple voice interactions with an Amazon echo device.

IMPLEMENTATION
	
Used the Alexa Skills Kit(ASK) SDK available through Amazon's developer console to create a list of voice commands that Alexa will "wake up" to and answer user questions. These intents and utterances are coded into JSON to send to the service endpoint. I've chosen the endpoint to be hosted as an AWS Lambda function, which handles much of the server management and is free up to 1 million requests per month. I used node.js to code the lambda function.

PROGRESS
	
Alexa can now answer to many utterances such as "Open I2B2" and "show me patients with lung cancer". When asked this, the lambda function stores the users request in a mysql db hosted by Amazon RDS. A python function living internally on the wakehealth network then scans the RDS db every 5 seconds for new entries. If it finds a new entry it querys the I2B2 Soap API, returning the data set the user asked for. 

MOVING FORWARD

-Currently, the python function finds the requested data but has no way of sending it back to Alexa. Will require an agreement with Amazon to keep data returned secure as we would violate HIPAA regulations if Amazon had access to this data. An alternative would be to send the user a private, secure email with the returned results to their Alexa query.
-Need a form of authentication to interact with the I2B2 Alexa skill so only those with access to the I2B2 web client are able to use the I2B2 skill
-Need an algorithm that will find the best possible results to a simple user query. Ex: If a user queries patients with heart disease, we need to be able to find the most generic result. Currently returns whatever I2B2 finds first with the keyword heart disease. As of right now I2B2 might return data discussing left ventricle failure if it is under a path including the keyword heart disease. 




