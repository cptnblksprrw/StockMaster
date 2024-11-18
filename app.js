const fs = require( "fs" );

const express = require ( "express" );

// this is a canonical alias to make your life easier, like jQuery to $.
const app = express(); 

// require
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    barcode: Number,
    Manufacturer: String,
    Style: String,
    Colour: String,
    Ammount: String
  });

const Item = mongoose.model("Item", itemSchema);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "./views"); // Optional: Specify the directory for EJS templates

app.engine("ejs", require("ejs").__express);

// a common localhost test port
const port = 3000;

// Simple server operation
app.listen(port, () => {
  // template literal
  console.log(`Server is running on http://localhost:${port}`);
});

// Initialize session middleware with your session configuration
app.use(
  session({
    secret: "your-secret-key", // replace with a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Function to load data from a JSON file
function loadData(filename) {
  const data = fs.readFileSync(path.join(__dirname, filename), "utf-8");
  return JSON.parse(data);
}

const users = loadData("users.json");
const posts = loadData("posts.json");

// Helper function to save users to JSON
function saveUsers() {
  fs.writeFileSync(
    path.join(__dirname, "users.json"),
    JSON.stringify(users, null, 2),
    "utf-8"
  );
}

// Render the login page on the root route
app.get("/", (req, res) => {
  res.render("login");
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (user && user.password === password) {
    // If user exists and password matches, redirect to /note-vote
    console.log("login succesful");
    req.session.username = username;
    res.redirect(`/note-vote?username=${username}`);
  } else {
    // If login fails, redirect back to the login page
    console.log("login unsuccesful");
    res.redirect("/");
  }
});

// Handle registration form submission
app.post("/register", async (req, res) => {
  const { username, password, invitecode } = req.body;
  const INVITE_CODE = "Note Vote 2024";

  // Check invite code
  if (invitecode !== INVITE_CODE) {
    return res.redirect("/");
  }

  // Check if user already exists
  const existingUser = users.find((u) => u.username === username);
  if (existingUser) {
    return res.redirect("/");
  }

  /*
  const user = new User({ // creates new user with submitted values
    userName: req.body.username,
    passWord: req.body.password,
  });

  await user.save(); // save new user to database
  */

  // Add new user and save to JSON
  const newUser = { username, password };
  users.push(newUser);
  saveData("users.json", users);

  // const currentUser = user.userName; // switch with below line to switch to db model
  const currentUser = newUser.username;

  // Redirect to /note-vote with the new user
  res.render("note-vote", { currentUser, username: newUser.username, posts });
});

app.get("/note-vote", (req, res) => {
  const currentUser = req.session.username; // Get the logged-in user's username from the query string

  const posts = loadData("posts.json");

  // If no username is provided, redirect to login
  if (!currentUser) {
    return res.redirect("/");
  }

  // Render the note-vote page, passing the username and posts
  res.render("note-vote", {
    username: currentUser,
    posts: posts,
    currentUser: currentUser,
  });
});

// Handle voting action (upvote or downvote)
app.post("/vote", (req, res) => {
  const posts = loadData("posts.json");
  const { postId, username, voteType } = req.body;

  // Find the post by its id
  const post = posts.find((p) => p.id == postId);
  if (!post) {
    return res.status(404).send("Post not found");
  }

  // Find the user object (you can replace this with the actual user object if needed)
  const user = { username };

  // Handle the voting logic
  if (voteType === "up") {
    // If the user has already upvoted, do nothing
    if (!post.upvotes.some((u) => u.username === username)) {
      post.downvotes = post.downvotes.filter((u) => u.username !== username);
      post.upvotes.push(user);
    }
  } else if (voteType === "down") {
    // If the user has already downvoted, do nothing
    if (!post.downvotes.some((u) => u.username === username)) {
      post.upvotes = post.upvotes.filter((u) => u.username !== username);
      post.downvotes.push(user);
    }
  } else if (voteType === "remove") {
    // If removing an upvote, remove from the upvotes array
    post.upvotes = post.upvotes.filter((u) => u.username !== username);

    // If removing a downvote, remove from the downvotes array
    post.downvotes = post.downvotes.filter((u) => u.username !== username);
  }

  // Save the updated post data to JSON or wherever you store the data
  saveData("posts.json", posts);

  // Redirect back to the note-vote page
  res.redirect("/note-vote?username=" + username);
});

app.post("/add-post", (req, res) => {
  const { text, username } = req.body;
  const posts = loadData("posts.json"); // Read current posts from JSON file

  // Create a new post
  const newPost = {
    id: posts.length + 1,
    text,
    creator: {
      username: username,
    },
    upvotes: [],
    downvotes: [],
  };

  // Add the new post to the array
  posts.push(newPost);

  // Save the updated posts array to the file
  fs.writeFileSync("posts.json", JSON.stringify(posts, null, 2));

  // Redirect to the note-vote page
  res.redirect("/note-vote?username=" + username);
});

// Function to save data to a JSON file
function saveData(filename, data) {
  fs.writeFileSync(
    path.join(__dirname, filename),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}