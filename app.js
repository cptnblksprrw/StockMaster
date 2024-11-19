const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Item = require('./models/Item');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/warehouse', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes

// Inventory Page
app.get('/', async (req, res) => {
    try {
        const items = await Item.find(); // Fetch all items from the database
        res.render('inventory', { items });
    } catch (err) {
        res.status(500).send('Error fetching items.');
    }
});

// Add Inventory Page
app.get('/add', (req, res) => {
    res.render('add-inventory');
});

// Save Item to Database
app.post('/add-item', async (req, res) => {
    const { name, quantity, category, description } = req.body;
    try {
        const timestamp = Date.now().toString(); // Timestamp as part of the barcode
        const uniqueSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // Random 3-digit number
        const barcode = `WH${timestamp}${uniqueSuffix}`; // Generate barcode

        const newItem = new Item({ name, quantity, category, description, barcode });
        await newItem.save(); // Save to database
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error saving item.');
    }
});

// Item Details Page
app.get('/item/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) return res.status(404).send('Item not found.');
        res.render('item-details', { item });
    } catch (err) {
        res.status(500).send('Error fetching item details.');
    }
});

// Scan Item Page
app.get('/scan-item', (req, res) => {
    res.render('scan-item', { item: null, error: null });
});

// Handle Barcode Scan Submission
app.post('/scan-item', async (req, res) => {
    const { barcode } = req.body;
    try {
        const item = await Item.findOne({ barcode });
        if (!item) {
            res.render('scan-item', { item: null, error: 'Item not found.' });
        } else {
            res.render('scan-item', { item, error: null });
        }
    } catch (err) {
        res.status(500).send('Error scanning item.');
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
