# Prerequistes
1. Install Nodejs v9+
2. Mongodb v3.6+

# Note: Use following command for installing global modules.
Example : npm run -g <module_name>

# Global Dependencies that Must be installed inorder to run and compile project successfully
1. typescript
2. yarn
3. nodemon
4. concurrently

# To Run project on local machine use following command
# Note It compile and run project in auto-reload mode by detecing changed
1. npm run dev

# To Transpile Only use following command at the root of the project
1. tsc --watch

# To run the project in auto-reload mode use following mode
1. nodemon ./build/index.js
# If we don't want to auto-reload use following command
1. node ./build/index.js



# PRODUCTION 
# LIST OF ENVIRONMENT VARIABLES
FLOWROUTE_USERNAME (defaults to ab05f456)
FLOWROUTE_PASSWORD (defaults to c412e2bb859540378a2c80bb34727384)
FLOWROUTE_NUMBER (defaults to 16085612999)
RMQ_HOST (defaults to localhost)
RMQ_USER (defaults to slack_user)
RMQ_PASSWORD (defaults to Tyler@sms)
RMQ_PROTOCOL (defaults to amqp)
RMQ_PORT (defaults to 5672)
SLACK_TOKEN (defaults to Random Unknown Key)