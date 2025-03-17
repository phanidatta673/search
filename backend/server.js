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

// Ensure index exists through createIndex()
// Create text index
Post.collection.createIndex(
  { title: "text", body: "text", tags: "text"},
  {name: "search_text_index"})
.then(() => console.log("Text index created or already exists"))
.catch((error) => console.log("Error creating text index:",error));

// Create creationdate index
Post.collection.createIndex({ creationdate:1 })
.then(() => console.log("Index created or already exists on creationdate"))
.catch((error) => console.log("Error creating index:", error));

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
  const cursor = req.query.cursor || null;
  const pageSize = 10; 

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  try {
    const cachedResults = await client.get(`search:${query}:${cursor}`  );
    if (cachedResults) {
      return res.json({ results: JSON.parse(cachedResults), cursor:null });
    }

    // If cursor is provided, fetch results that are greater than the cursor creationdate
    const queryCondition = cursor
      ? { $text: { $search: query }, creationdate: { $gt: cursor } }
      : { $text: { $search: query } };

    // Perform search, sorted by creationdate for pagination
    const results = await Post.find(queryCondition)
      .sort({ creationdate: 1 })  // Sort by creationdate to paginate correctly
      .limit(pageSize);

    // If results are found, find the last item's creationdate to use as the cursor for the next page
    const newCursor = results.length > 0 ? results[results.length - 1].creationdate : null;

    console.log("Query:", query);
    console.log("Cursor:", cursor);
    console.log("Query condition:", queryCondition);
    console.log("Results count:", results.length);
    // Cache the results for 60 seconds
    await client.set(`search:${query}:${cursor}`, JSON.stringify(results), { EX: 60 });

    res.json({ results, cursor:newCursor });
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    res.status(500).json({error:"Internal server error"});
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});