const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const Item = require("./models/Item");
const Group = require("./models/Group");
const Template = require("./models/Template");
const JsBarcode = require("jsbarcode");
const app = express();
const { ObjectId } = require('mongodb');


app.use(express.json()); // Middleware to parse JSON bodies

require('dotenv').config();
const dbConfig = {
  cluster: process.env.DB_CLUSTER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const { MongoClient, ServerApiVersion } = require('mongodb');

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000,  // 30 seconds connection timeout
  serverSelectionTimeoutMS: 30000,  // 30 seconds server selection timeout
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority&appName=${process.env.DB_NAME}`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// Create a MongoClient with the uri and options
const client = new MongoClient(uri, options);

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

run().catch(console.dir);

/* // Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/warehouse", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));
*/
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Set storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Initialize multer with the storage engine
const upload = multer({ storage });

// Routes

app.get('/', async (req, res) => {
  try {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(process.env.DB_NAME);

    const totalItems = await db.collection('items').countDocuments();
    const templates = await db.collection('templates').find().toArray();
    const items = await db.collection('items').find().toArray();
    const groups = await db.collection('groups').find().toArray();
    const totalValue = db.collection('items').aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    const recentItems = db.collection('items').find()
      .sort({ createdAt: -1 }) // Sort by most recent first
      .limit(15); // Limit to 50 items

    const totalPrice = totalValue[0]?.total || 0; // Default to 0 if no items
    res.render('overview', { recentItems, templates, groups, totalItems, totalPrice });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).send('An error occurred while fetching overview data');
  }
});

app.get('/inventory', async (req, res) => {
  const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = client.db(process.env.DB_NAME);


  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = req.query.limit === 'unlimited' ? 0 : parseInt(req.query.limit) || 10; // Default to 10 items per page
  const skip = (page - 1) * limit;

  try {

    const totalItems = await db.collection('items').countDocuments();
    const templates = await db.collection('templates').find().toArray();
    const items = await db.collection('items').find().toArray();

    const totalPages = limit === 0 ? 1 : Math.ceil(totalItems / limit);

    res.render('inventory', {
      items,
      templates,
      currentPage: page,
      totalPages,
      currentLimit: req.query.limit || '10'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading inventory");
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
        { category: { $regex: searchQuery, $options: "i" } }
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
app.post("/create", upload.single('image'), async (req, res) => {
  const {
    manufacturer,
    colour,
    style,
    measurement1,
    unit1,
    measurement2,
    unit2,
    category,
    description,
    price,
    isTemplate,
  } = req.body;


  const imagePath = req.file ? req.file.path : null;

  console.log(req.body);
  console.log(req.file);

  try {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(process.env.DB_NAME);

    if (isTemplate) {
      // Create a template
      const template = new Template({
        manufacturer,
        colour,
        style, 
        measurement1,
        unit1,
        measurement2,
        unit2,
        category,
        description,
        price,
        image: imagePath,
      });
      const result = await db.collection('templates').insertOne(template);

      if (result.acknowledged) {
        console.log('Template successfully inserted');
      } else {
        console.log('template insertion failed');
        res.status(500).send('Failed to add templat3e');
      }

      await client.close();
      
    } else {
      // Create an item
      const barcode = `BC${Date.now()}`; // Generate a unique barcode
      const item = new Item({
        manufacturer,
        colour,
        style,
        measurement1,
        unit1,
        measurement2,
        unit2,
        category,
        description,
        price,
        barcode,
        image: imagePath
      });
      const result = await db.collection('items').insertOne(item);

      if (result.acknowledged) {
        console.log('Item successfully inserted');
      } else {
        console.log('Item insertion failed');
        res.status(500).send('Failed to add item');
      }

      // Close the connection
      await client.close();
    }

    res.redirect("/inventory");
  } catch (error) {
    console.error("Error creating item or template:", error);
    res.status(500).send("An error occurred while processing your request.");
  }
});

app.post("/templates/:templateId/generate-items", async (req, res) => {
  const { templateId } = req.params;
  const { quantity } = req.body;

  const template = await Template.findById(templateId);
  if (!template) return res.status(404).send("Template not found");

  for (let i = 0; i < quantity; i++) {
    const barcode = `BC${Date.now()}${i}`; // Generate unique barcode

    const item = new Item({
      name: template.name,
      manufacturer: template.manufacturer,
      colour: template.colour,
      style: template.style,
      measurement1: template.measurement1,
      unit1: template.unit1,
      measurement2: template.measurement2,
      unit2: template.unit2,
      category: template.category,
      description: template.description,
      price: template.price,
      barcode,
    });

    await item.save();
  }

  template.itemCount += parseInt(quantity, 10);
  await template.save();

  res.redirect("/inventory");
});

app.get('/template-details/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).send('Template not found');
    }
    res.render('template-details', { template });
  } catch (error) {
    console.error('Error fetching template details:', error);
    res.status(500).send('An error occurred while fetching template details');
  }
});

// Route to delete a group
app.post("/delete-template/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const template = await Template.findByIdAndDelete(id);
    if (!template) {
      return res.status(404).send("Group not found");
    }
    res.redirect("/inventory"); // Redirect to the groups page after deletion
  } catch (err) {
    res.status(500).send("Server Error");
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

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    console.log(req.params.id);

    const itemId = new ObjectId(req.params.id);
    console.log(itemId)

    // Fetch the item by ID using the native driver
    const item = await db.collection('items').findOne({ _id: itemId });


    if (!item) return res.status(404).send("Item not found.");
    res.render("item-details", { item });
  } catch (err) {
    res.status(500).send("Error fetching item details.");
  }
});

app.post('/item/:id/availability', async (req, res) => {
  const { id } = req.params;
  const { availability } = req.body;

  try {
    await Item.findByIdAndUpdate(id, { availability });
    res.redirect(`/item/${id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating availability");
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

    // Update availability of the selected items to "sold"
    await Item.updateMany(
      { _id: { $in: selectedItemIds } },
      { $set: { availability: "sold" } }
    );

    // Render the group creation page, passing selected items
    res.render("create-group", { items });
  } catch (err) {
    console.error("Error creating group:", err);
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
