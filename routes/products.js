var express = require("express");
var router = express.Router();
const Validator = require("fastest-validator");

const v = new Validator();

const { Product } = require("../models");

// using redis
const Redis = require("ioredis");
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

// Throttling API using Redis
const APIKey = "A3ci6zhjqxrzrivlqxc2n11uo98voivh7pnf7cziv89xojrl68f";
const rateLimit = 10;
const longTime = 60000;
let count = 0;
let isLimited = false;
const messageLimited = {
  error: 429,
  message: `API rate limit exceeded`,
  command: `Please wait 1 minute`,
};

// Throttling check
const checkLimitRate = async () => {
  if (!isLimited) {
    count += 1;
    redis.set(`key:${APIKey}`, count);
    let cek = await redis.get(`key:${APIKey}`);
    console.log(count);
    if (cek > rateLimit) {
      isLimited = true;
      count = 0;
      setTimeout(() => (isLimited = false), longTime);
    }
  }
};

// check isLimited
function checkIsLimit() {
  checkLimitRate();
  if (isLimited) {
    return true;
  }
  return false;
}

// variable caches
let cacheEntry;

// check cache
const cache = async () => {
  cacheEntry = await redis.get(`key:products`);

  if (cacheEntry) {
    return (cacheEntry = JSON.parse(cacheEntry));
  }
  return null;
};

// getAll
router.get("/", async (req, res) => {
  if (checkIsLimit()) res.json(messageLimited);
  else {
    if (cacheEntry != null) {
      console.log("get data from cache");
      res.json(cacheEntry);
    } else {
      const products = await Product.findAll();
      redis.set("key:products", JSON.stringify(products));
      cache();
      res.json(products);
    }
  }
});

// getByID
router.get("/:id", async (req, res) => {
  if (checkIsLimit()) res.json(messageLimited);
  else {
    const id = req.params.id;
    const product = await Product.findByPk(id);
    res.json(product);
  }
});

// Create
router.post("/", async (req, res) => {
  const schema = {
    name: "string",
    brand: "string",
    description: "string|optional",
  };

  const validate = v.validate(req.body, schema);

  if (validate.length) {
    return res.status(400).json(validate);
  }

  const product = await Product.create(req.body);

  res.json(product);
});

// Update
router.put("/:id", async (req, res) => {
  const id = req.params.id;

  let product = await Product.findByPk(id);

  if (!product) {
    return res.json({
      message: "Product not found",
    });
  }

  const schema = {
    name: "string|optional",
    brand: "string|optional",
    description: "string|optional",
  };

  const validate = v.validate(req.body, schema);

  if (validate.length) {
    return res.status(400).json(validate);
  }

  product = await product.update(req.body);

  res.json(product);
});

// Delete
router.delete("/:id", async (req, res) => {
  const id = req.params.id;

  let product = await Product.findByPk(id);

  if (!product) {
    return res.json({
      message: "Product not found",
    });
  }

  await product.destroy();

  res.json({
    message: "Product is deleted",
  });
});

module.exports = router;
