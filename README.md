ECHO I2B2 - Wake Forest Baptist Intern Project
	
The goal of this project is to create an Alexa skill which will allow users to query I2B2 through simple voice interactions with the Echo Dot. 

IMPLEMENTATION
	
Currently, I am using the Alexa Skills Kit(ASK) SDK available through Amazon's developer console to create a list of voice commands that Alexa will "wake up" to and answer user questions. These intents and utterances are coded into JSON to send to the service endpoint. I've chosen the endpoint to be hosted as an AWS Lambda function, which handles much of the server management and is free up to 1 million requests per month. I am currently using node.js to write the Lambda function.

PROGRESS
	
Alexa can now answer to many utterances such as "Open I2B2" and "show me patients between the ages of 55 and 60 with lung cancer". When asked this, all the code currently does is have Alexa reply with "Accessing Patient Data". This shows a successful connection between the Alexa software and the AWS Lambda function. Other basic commands such as "help" and "exit" can also be called while the I2B2 skill is running.

MOVING FORWARD

-Need to determine how to interact with I2B2 API so as to:
	1) Create an authentication process for Alexa skill users, probably just spoken username and password 
	2) Obtain the patient data that the user is looking for
-Need to choose how patient data will be sent back to the user, I would assume through email. We may want to ask physicians how they would like to receive this data since they will be the primary users. 

EXPECTED ISSUES

1. Alexa understanding clinical terminology such as "echocardiography". There is no way to increase Alexa's understanding of complex words that are not in her vocabulary. One option moving forward is to limit this Alexa skill to simple I2B2 searches with somewhat pedestrian language such as "Search for patients with breast cancer and a history of tobacco use." 
2. Users may feel like this process takes longer than simply using normal I2B2 software; we will have to optimize for quick Alexa interactions




