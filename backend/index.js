const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors()); // enable cors
// Tell Express how to read incoming JSON data
app.use(express.json());

const MONGO_URI = "mongodb+srv://ragidhanush36_db_user:QPVv5EhfCjPA1X57@cluster0.exdjzas.mongodb.net/?appName=Cluster0";
// Replace with YOUR actual URL!
mongoose.connect(MONGO_URI)
    .then(() => console.log("SUCCESS: Connected to MongoDB Atlas!"))
    .catch((err) => console.error("ERROR: Failed to connect", err));

// --- NEW: Define the Schema (Your C++ Struct) ---
const ProblemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    platform: { type: String, required: true },
    difficulty: { type: String, required: true },
    status: { type: String, default: "Solved" },
	lastReviewed: { type: Date, default: Date.now }
});

// Compile the Schema into a usable Model (Class)
const Problem = mongoose.model('Problem', ProblemSchema);

// --- NEW: The POST Route (Writing Data) ---
app.post('/api/problems', async (req, res) => {
    try {
        // 1. Grab the data the user sent us (req.body)
        const newProblem = new Problem(req.body);
        
        // 2. Wait for it to save to the cloud database
        await newProblem.save(); 
        
        // 3. Send a success message back!
        res.status(201).json({ message: "Problem saved permanently!", data: newProblem });
    } catch (error) {
        // If Mongoose validation fails, catch the error so the server doesn't crash
        res.status(400).json({ message: "Validation Failed", error: error.message });
    }
});

// --- KEEP: The GET Route (Reading Data) ---
// Let's update this to actually read from the database instead of the hardcoded array!
app.get('/api/problems', async (req, res) => {
    // Wait for the database to find ALL problems ({})
    const allProblems = await Problem.find({}); 
    res.json(allProblems);
});

app.listen(PORT, () => {
    console.log(`Backend server listening on http://localhost:${PORT}`);
});

// --- NEW: The Magic URL Fetcher Route ---
app.post('/api/fetch-problem', async (req, res) => {
    try {
        const { url } = req.body;
        
        // Check if it's a LeetCode URL
        if (url.includes('leetcode.com/problems/')) {
            // Extract the problem name from the URL
            const match = url.match(/problems\/([^\/]+)/);
            if (!match) return res.status(400).json({ error: "Invalid URL format" });
            const titleSlug = match[1];

            // LeetCode's hidden GraphQL Query
            const query = `
                query questionTitle($titleSlug: String!) {
                    question(titleSlug: $titleSlug) {
                        title
                        difficulty
                    }
                }
            `;
            
            // Reach out to LeetCode's servers
            const response = await fetch('https://leetcode.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query, variables: { titleSlug } })
            });
            
            const data = await response.json();
            
            if (!data.data.question) {
                return res.status(404).json({ error: "Problem not found on LeetCode" });
            }

            // Send the clean data back to our React frontend
            return res.json({
                title: data.data.question.title,
                platform: "LeetCode",
                difficulty: data.data.question.difficulty // Returns "Easy", "Medium", or "Hard"
            });
        } else {
            return res.status(400).json({ error: "Only LeetCode URLs are supported for the magic fetch right now!" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data from API" });
    }
});

// --- NEW: The DELETE Route (Removing Data) ---
// The ":id" part is a variable. If the frontend asks to delete "/api/problems/123", 
// Express will grab "123" and put it in req.params.id
app.delete('/api/problems/:id', async (req, res) => {
    try {
        const targetId = req.params.id;
        
        // Mongoose makes this incredibly easy. Just find the ID and destroy it.
        await Problem.findByIdAndDelete(targetId);
        
        res.status(200).json({ message: "Problem deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete problem", error: error.message });
    }
});

// --- NEW: The PUT Route (Updating Data) ---
app.put('/api/problems/:id', async (req, res) => {
    try {
        const targetId = req.params.id;
        const newData = req.body; // The updated data sent from the React form
        
        // Find the problem by ID and overwrite it. 
        // { new: true } tells Mongoose to send back the newly updated version, not the old one.
        const updatedProblem = await Problem.findByIdAndUpdate(targetId, newData, { new: true });
        
        res.json(updatedProblem);
    } catch (error) {
        res.status(400).json({ message: "Failed to update", error: error.message });
    }
});
