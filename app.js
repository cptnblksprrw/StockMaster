const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const Item = require("./models/Item");
const Group = require("./models/group");

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/warehouse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the folder where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure the file gets a unique name
  },
});

// Initialize multer with the storage engine
const upload = multer({ storage: storage });

// Route

app.get("/inventory", async (req, res) => {
  try {
    const items = await Item.find();
    res.render("inventory", { items });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).send("An error occurred. /");
  }
});

app.get("/groups", async (req, res) => {
  // Fetch groups from the database
  try {
    const items = await Item.find();
    const groups = await Group.find().populate("items");
    res.render("groups", { groups });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).send("An error occurred. groups");
  }
});

app.get("/searchItems", async (req, res) => {
  const searchQuery = req.query.query;

  try {
    // Search items in MongoDB using a regex query
    const results = await Item.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search
        { description: { $regex: searchQuery, $options: "i" } },
      ],
    });

    res.render("searchItems", { results, query: searchQuery });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while searching");
  }
});

app.get("/searchGroups", async (req, res) => {
  const searchQuery = req.query.query;

  try {
    // Search items in MongoDB using a regex query
    const results = await Group.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search
        { description: { $regex: searchQuery, $options: "i" } },
      ],
    });

    res.render("searchGroups", { results, query: searchQuery });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while searching");
  }
});
// Add Inventory Page
app.get("/add", (req, res) => {
  res.render("add-inventory");
});

// Save Item to Database
app.post("/add-item", upload.single("image"), async (req, res) => {
  const {
    name,
    manufacturer,
    colour,
    style,
    quantity,
    unit,
    category,
    description,
  } = req.body;
  const image = req.file ? req.file.path : null; // Handle optional image
  console.log(req.file);
  console.log(image);
  try {
    const timestamp = Date.now().toString(); // Timestamp as part of the barcode
    const uniqueSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0"); // Random 3-digit number
    const barcode = `I${timestamp}${uniqueSuffix}`; // Generate barcode

    const newItem = new Item({
      name,
      manufacturer,
      colour,
      style,
      quantity,
      unit,
      category,
      description,
      barcode,
      image,
    });
    await newItem.save(); // Save to database
    res.redirect("/inventory");
  } catch (err) {
    res.status(500).send("Error saving item.");
  }
});

app.get("/group/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate("items");
    res.render("group-details", { group });
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).send("An error occurred.");
  }
});

// Item Details Page
app.get("/item/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send("Item not found.");
    res.render("item-details", { item });
  } catch (err) {
    res.status(500).send("Error fetching item details.");
  }
});

// Scan Item Page
app.get("/scan-item", (req, res) => {
  res.render("scan-item", { item: null, error: null });
});

// Handle Barcode Scan Submission
app.post("/scan-item", async (req, res) => {
  const { barcode } = req.body;
  try {
    const item = await Item.findOne({ barcode });
    if (!item) {
      res.render("scan-item", { item: null, error: "Item not found." });
    } else {
      res.render("scan-item", { item, error: null });
    }
  } catch (err) {
    res.status(500).send("Error scanning item.");
  }
});

// Route to render the create group page
app.get("/create-group", async (req, res) => {
  const selectedItemIds = req.query.items || []; // Get selected items from query string

  try {
    // Fetch the selected items from the database
    const items = await Item.find({ _id: { $in: selectedItemIds } });
    res.render("create-group", { items }); // Render the group creation page, passing selected items
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).send("Error creating group");
  }
});

// Route to handle creating a group (POST request)
app.post("/create-group", async (req, res) => {
  const { groupName, selectedItems } = req.body;

  try {
    const timestamp = Date.now().toString(); // Timestamp as part of the barcode
    const uniqueSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0"); // Random 3-digit number
    const barcode = `G${timestamp}${uniqueSuffix}`; // Generate barcode
    // Create a new group in the database
    const newGroup = new Group({
      name: groupName,
      barcode: barcode,
      items: selectedItems, // Assuming selectedItems is an array of item IDs
    });

    await newGroup.save();
    res.redirect("/groups"); // Redirect to the groups page after group creation
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).send("Error saving group");
  }
});

app.get("/group-items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const group = await Group.findById(id).populate("items"); // Get the group by ID and populate items
    if (!group) {
      return res.status(404).send("Group not found");
    }
    res.render("group-items", { group }); // Render group items page
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Route to delete a group
app.post("/delete-group/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const group = await Group.findByIdAndDelete(id);
    if (!group) {
      return res.status(404).send("Group not found");
    }
    res.redirect("/groups"); // Redirect to the groups page after deletion
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Route to edit a group
app.post("/edit-group/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const group = await Group.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    if (!group) {
      return res.status(404).send("Group not found");
    }
    res.redirect("/groups"); // Redirect to the groups page after editing
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post("/inventory/deleteSelected", async (req, res) => {
  const { selectedItems } = req.body;

  if (!selectedItems || selectedItems.length === 0) {
    return res.status(400).json({ error: "No items selected for deletion" }); // Send a JSON response
  }

  try {
    // Delete items from the database using the selected item IDs
    await Item.deleteMany({ _id: { $in: selectedItems } });

    return res.status(200).json({ message: "Items deleted successfully" }); // Send a JSON response
  } catch (error) {
    console.error("Error deleting items:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while deleting items" }); // JSON response for error
  }
});

// Route to fetch barcodes for selected items
app.post("/inventory/barcodes", async (req, res) => {
  const { itemIds } = req.body;

  try {
    // Fetch items by their IDs
    const items = await Item.find({ _id: { $in: itemIds } }).select("barcode");

    // Extract the barcode field from the items
    const barcodes = items.map((item) => item.barcode);

    // Send the barcodes as the response
    res.json(barcodes);
  } catch (error) {
    console.error("Error fetching barcodes:", error);
    res.status(500).send("Error fetching barcodes");
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
