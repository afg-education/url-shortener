"use strict";

var https = require("https");
var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
//afg: add mongo db connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useFindAndModify", false);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
//afg: add body parser.
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

//challenge relevant code here.
let Schema = mongoose.Schema;

let urlSchema = new Schema({
  url: String, // String is shorthand for {type: String}
  short_url: Number
});

var Url = mongoose.model("Url", urlSchema);

var findOrCreate = function(site, done) {
  Url.findOneAndUpdate(
    { url: site.url },
    { url: site.url, short_url: site.short_url },
    { new: true, upsert: true },
    function(err, data) {
      if (err) return done(err);
      return done(null, data);
    }
  );
  process.env.SHORT_URL++;
};

app.post("/api/shorturl/new", (req, res, next) => {
  console.log(req.body.url);

  var site = new Url({ url: req.body.url, short_url: process.env.SHORT_URL });
  console.log(site);

  findOrCreate(site, function(err, site) {
    if (err) {
      return next(err);
    }
    if (!site) {
      console.log("Missing `done()` argument");
      return next({ message: "Missing callback argument" });
    }
    res.json(site);
  });
});

var findSite = function(short, done) {
  Url.find({ short_url: short }, function(err, data) {
    if (err) return console.error(err);
    done(null, data);
  });
};

app.get("/api/shorturl/:short_url", (req, res, next) => {
  console.log(req.params.short_url);

  findSite(req.params.short_url, function(err, data) {
    if (err) {
      return next(err);
    }
    if (!data) {
      console.log("Missing `done()` argument");
      return next({ message: "Missing callback argument" });
    }
    console.log(data[0].url);
    res.redirect(data[0].url);
  });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
