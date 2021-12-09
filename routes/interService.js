var express = require("express");
var router = express.Router();
const request = require("request");

router.get("/", function (req, res) {
  res.json({
    message: "Interservice is running",
  });
});

router.get("/products", async (req, res) => {
  request("http://localhost:8080/products", function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.json(JSON.parse(body));
    }
  });
});

router.get("/product/:id", async (req, res) => {
  const id = req.params.id;
  request(
    "http://localhost:8080/product/" + id,
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.json(JSON.parse(body));
      }
    }
  );
});

module.exports = router;
