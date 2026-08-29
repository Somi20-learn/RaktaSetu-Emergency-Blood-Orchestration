const express = require("express");
const cors = require("cors");

const bloodBanks = require("./data/bloodData");
const findMatches = require("./services/matchingEngine");

const app = express();
const requests = [];

app.use(cors());
app.use(express.json());



// Home route
app.get("/", (req, res) => {
    res.send("RaktaSetu Backend is Working!");
});


// Blood stock API
app.get("/api/blood-stock", (req, res) => {

    res.json(bloodBanks);

});


// Blood request API
app.post("/api/requests", (req, res) => {

    const request = req.body;

    console.log("New blood request:", request);

    const matches = findMatches(
        request.bloodGroup,
        request.units,
        request.urgency,
        bloodBanks
    );

    const newRequest = {
        id: requests.length + 1,
        ...request,
        matches: matches,
        currentMatchIndex: 0,
        status: "pending"
    };

    requests.push(newRequest);

    res.json({
        message: "Blood request processed successfully",
        request: newRequest
    });

});


// Reserve blood
app.post("/api/reserve", (req, res) => {

    const { bankId, bloodGroup, units } = req.body;

    const bank = bloodBanks.find(
        (bank) => bank.id === bankId
    );

    if (!bank) {
        return res.status(404).json({
            message: "Blood bank not found"
        });
    }

    const availableUnits = bank.inventory[bloodGroup];

    if (availableUnits < units) {
        return res.status(400).json({
            message: "Not enough blood available"
        });
    }

    bank.inventory[bloodGroup] -= units;

    res.json({
        message: "Blood reserved successfully",
        bankName: bank.name,
        bloodGroup: bloodGroup,
        reservedUnits: units,
        remainingUnits: bank.inventory[bloodGroup]
    });

});

// Accept blood request
app.post("/api/accept", (req, res) => {

    const { requestId } = req.body;

    const request = requests.find(
        (request) => request.id === requestId
    );

    if (!request) {
        return res.status(404).json({
            message: "Request not found"
        });
    }

    request.status = "accepted";

    res.json({
        message: "Blood request accepted",
        requestId: request.id,
        status: request.status,
        bank: request.matches[request.currentMatchIndex]
    });

});

// Reject blood request and find next match
app.post("/api/reject", (req, res) => {

    const { requestId } = req.body;

    const request = requests.find(
        (request) => request.id === requestId
    );

    if (!request) {
        return res.status(404).json({
            message: "Request not found"
        });
    }

    // Move to the next blood bank
    request.currentMatchIndex++;

    // Check if another match exists
    if (request.currentMatchIndex >= request.matches.length) {

        request.status = "no-match";

        return res.json({
            message: "No more blood banks available",
            status: request.status
        });
    }

    // Get next blood bank
    const nextMatch =
        request.matches[request.currentMatchIndex];

    request.status = "escalated";

    res.json({
        message: "Request escalated to next blood bank",
        requestId: request.id,
        status: request.status,
        nextMatch: nextMatch
    });

});


app.listen(5000, () => {
    console.log("Server is running on port 5000");
});