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
const app = express();
// make sure to set by:
//  heroku config:set CANVAS_CONSUMER_SECRET=adsfadsfdsfsdafsdfsdf

const consumerSecret = process.env.CANVAS_CONSUMER_SECRET;

app.use(express.static(path.join(__dirname, "views")));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ entended: true }));
// just a welcome page
app.get("/", function (req, res) {
  res.render("welcome");
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
    res.render("index", { payload: payload });
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
