/*
  app.js
  mohan chinnappan
    
  Ref: https://github.com/ccoenraets/salesforce-canvas-demo

  */
const express = require("express"),
  bodyParser = require("body-parser"),
  path = require("path"),
  request = require("request"),
  // CryptoJS = require("crypto-js"),
  decode = require("salesforce-signed-request");
require('dotenv').config()
const cookieParser = require("cookie-parser");
const session = require('express-session');
// import { createClient } from 'redis';
const redis = require('redis');
const connectRedis = require('connect-redis');
const app = express();

// make sure to set by:
//  heroku config:set CANVAS_CONSUMER_SECRET=adsfadsfdsfsdafsdfsdf

const consumerSecret = process.env.CANVAS_CONSUMER_SECRET;


const oneDay = 1000 * 60 * 60 * 24;
// app.use(session({
//   secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
//   saveUninitialized: true,
//   cookie: { maxAge: oneDay },
//   resave: false
// }));

const RedisStore = connectRedis(session)
//Configure redis client
const redisClient = redis.createClient(process.env.REDIS_URL);
// const redisClient = redis.createClient({
//   host: 'localhost',
//   port: 6379
// })

const noCache = require('nocache')
app.use(noCache())

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'secret$%^134',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // if true only transmit cookie over https
    sameSite: 'none',
    httpOnly: true, // if true prevent client side JS from reading the cookie 
    maxAge: 1000 * 60 * 10 // session max age in miliseconds
  }
}))

app.use(express.static(path.join(__dirname, "views")));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// just a welcome page
app.get("/", function (req, res) {
  const sess = req.session;
  let tagline = 'Anonymous';
  if (sess.userid) {
    console.log(sess.userid);
    tagline = 'Maurizio';
    res.render("welcome", { tagline: tagline });
  } else
    res.render("welcome", { tagline: tagline });

});

// SF call POST us on this URI with signed request
app.post("/signedrequest", function (req, res) {
  console.log(req.body.signed_request);

  const signedRequest = decode(req.body.signed_request, consumerSecret),
    context = signedRequest.context,
    oauthToken = signedRequest.client.oauthToken,
    instanceUrl = signedRequest.client.instanceUrl;
  const query = "SELECT Id, FirstName, LastName, Phone, Email FROM Contact";

  contactRequest = {
    url: instanceUrl + "/services/data/v45.0/query?q=" + query,
    headers: {
      Authorization: "OAuth " + oauthToken
    }
  };
  // const sess = req.session;
  console.log(req.session)
  session.userid = context.user.userId;

  request(contactRequest, function (err, response, body) {
    const contactRecords = JSON.parse(body).records;

    const payload = {
      instanceUrl: instanceUrl,
      headers: {
        Authorization: "OAuth " + oauthToken
      },
      context: context,
      contacts: contactRecords
    };
    tagline = context.user.userId;
    res.render("index", { payload: payload, tagline: tagline });
  });
});


// POST to toolbar URI - make this uri as Canvas App URL in the connected app (AccountPositionApp2) setting 
app.post("/myevents", function (req, res) {
  const signedRequest = decode(req.body.signed_request, consumerSecret);
  res.render("myevents", { signedRequest: signedRequest });
});


const port = process.env.PORT || 9000;
app.listen(port);
console.log("Listening on port " + port);
