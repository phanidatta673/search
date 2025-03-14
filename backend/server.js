const express = require('express');
const cors = require('cors');
const redis = require('redis');
const mongoose = require('mongoose')

const app = express();
const port = 4000;

// Enable CORS
app.use(cors());

// Create Redis client
const client = redis.createClient();

// Handle Redis connection errors
client.on("connect", () => console.log("Listening to Redis successfully!"));
client.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis
(async () => {
  try{
    await client.connect();
    console.log('Redis client established connected successfully');
  } catch (error){
    console.error("Redis Connection Failed:", error);
  }
  
})();

// Mongo db connection
mongoose.connect('mongodb://127.0.0.1:27017/searchdb',{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to Mongo db',mongoose.connection.name))
  .catch(error => console.error('Mongo db connection error',error));

// Mongo db schema definition and model
const postSchema = new mongoose.Schema({
  id: String,
  creationdate: String,
  score: String,
  viewcount: String,
  body: String,
  title: String,
  tags: String
});

// Create the post model
const Post = mongoose.model('post',postSchema);

// Autocomplete endpoint
app.get('/autocomplete', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  try {
    // Check Redis cache first
    const cachedResults = await client.get(`autocomplete:${query}`);
    if (cachedResults){
      return res.json({suggestions: JSON.parse(cachedResults)});
    }
    
    // If not in cache, perform MongoDB text search
    const suggestions = await Post.find({ $text: { $search: query}}).limit(10);
    await client.set(`autocomplete:${query}`, JSON.stringify(suggestions.map(s => s.title)),'EX',60); // Cache for 60 sec
    res.json({suggestions: suggestions.map(s => s.title)});
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    res.status(500).json({error:"Internal server error"});
  }
});

app.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  try {
    const cachedResults = await client.get(`search:${query}`  );
    if (cachedResults) {
      return res.json({ results: JSON.parse(cachedResults) });
    }

    // Perform full-text search
    const results = await Post.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" }, title: 1, body: 1, tags: 1, score: 1, viewcount: 1 }
    ).sort({ score: { $meta: "textScore" } }).limit(10);

    await client.set(`search:${query}`, JSON.stringify(results), { EX: 60 }); // Cache results for 60s

    res.json({ results: results });
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    res.status(500).json({error:"Internal server error"});
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});