app.get("/", (req, res) => {
    // code you wish to run when the user get's the route must be in here!
    res.sendFile(__dirname + "/index.html")
    console.log("A user requested the about page");
});

app.post ("/", (req, res) => {
    // this code will run only if a user submits a form to the `/` route
    if (req.body["my-text"] === "secret") {
        // send the user to the /secret route, and pass along the req.body object
        res.redirect(307, "/secret");
    } else {
        res.send ("You can't access this page unless you know the `secret`")
    }
})

app.post( "/secret", (req, res) => {
    // confirm that they know the secret by inspecting the req.body
    if (req.body["my-text"] === "secret") {
        res.send ("you know the secret. Good job!")
    } else {
        res.redirect("/")
    }
})