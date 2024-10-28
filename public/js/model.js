
const fs = require( "fs" );

var myObj = { name : "Adam" };

const express = require ( "express" );

// this is a canonical alias to make your life easier, like jQuery to $.
const app = express(); 

// a common localhost test port
const port = 3000; 

app.use(express.static("public"))

// Simple server operation
app.listen (port, () => {
    // template literal
    console.log (`Server is running on http://localhost:${port}`);
});

app.get("/", (req, res) => {
    res.send("<h1> Hello Node World! </h1>");
    console.log("A user requested the root route");
});


fs.writeFile ( __dirname + "/object.json", 
                   JSON.stringify( myObj ), 
                   "utf8", 
                   ( err ) => {
    if ( err ) {
        console.log( "Error writingthe file:", err );
        return;
    }
});