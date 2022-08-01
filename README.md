# uniFree (Backend)

**Unfinished** demo project I created after finishing [FullStack Open](https://fullstackopen.com/en/).
Backend server for my [uniFree frontend](https://github.com/tera-si/unifree), a free item exchanging/gifting platform made with React.
Like a e-commerce site or ebay, but no price tags are attached to the items.
I have since moved on to learning cyber security, **this project is no longer being developed or maintained**.

## What's Unfinished?

- The backend was fully completed, just the frontend isn't

# Built with

- express
- mongoDB
- bcrypt
- cors
- dotenv
- express-async-errors
- jsonwebtoken
- mongoose
- mongoose-unique-validator
- morgan
- multer
- socket.io

# Requirements

1. [uniFree frontend](https://github.com/tera-si/unifree)
2. Create a `.env` file at the backend root direcotry with the following contents:
```
# MongoDB cluster to use during development
DEV_MONGODB_URI="mongodb+srv://..."

# MongoDB cluster to use during automated testing
TEST_MONGODB_URI="mongodb+srv://..."

# MongoDB cluster to use during production/deployment
MONGODB_URI="mongodb+srv://..."

# secret key for encrypting user passwords
SECRET_KEY="_PUT_YOUR_SECRET_HERE_"

# IP address of uniFree frontend
FRONTEND_ADDRESS="192.168.1.4"

# Backend server will listen on. If you change this, remember to change the frontend as well, as it by default uses port 5000
PORT=5000
```
For the frontend IP address, **due to restrictions of socket.io, you cannot use localhost or loopback address (127.0.0.1), 192.168.x.x must be used instead**

# Development

## `npm dev`

Run the server in development mode. The server will listen on the port you specified in the `.env` file.

## `npm test`

Run the automated tests. File uploading tests are included, before you run the tests, you will need to:

1. Prepare two valid images
2. Prepare one non-image file (e.g. txt)
3. Change [tests/items.api.test.js](tests/items.api.test.js) to point to the above files in the appropriate tests.

The tests will upload a bunch of files to the upload directory at /public/uploads

## `npm start`

Run the server in production/deployment mode. The server will listen on the port you specified in the `.env` file.
