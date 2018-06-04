ECHO I2B2 - Wake Forest Baptist Intern Project
	
	The goal of this project is to create an Alexa skill which will allow users to query I2B2 through simple voice interactions with the Echo Dot. 

Implementation

	Currently, I am using the Alexa Skills Kit(ASK) available through Amazon's developer console to create a list of voice commands that Alexa will "wake up" to and answer user questions. These intents and utterances are coded into JSON to send to the service endpoint. I've chosen the endpoint to be hosted as an AWS Lambda function, which handles much of the server management and is free up to 1 million requests per month. I am currently using node.js to write the Lambda function.

Progress

	Alexa can now answer to many utterances such as "Open I2B2" and "show me patients between the ages of 55 and 60 with lung cancer". When asked this, all the code currently does is have Alexa reply with "Accessing Patient Data". This shows a successful connection between the Alexa software and the AWS Lambda function. Other basic commands such as "help" and "exit" can also be called while the I2B2 skill is running.

