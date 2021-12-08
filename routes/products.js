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
  if (cacheEntry != null) {
    res.json(cacheEntry);
  } else {
    const products = await Product.findAll();
    redis.set("key:products", JSON.stringify(products));
    cache();
    res.json(products);
  }
});

// getByID
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const product = await Product.findByPk(id);
  res.json(product);
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
