function findMatches(
    bloodGroup,
    requiredUnits,
    urgency,
    bloodBanks
) {

    const matches = [];

    for (const bank of bloodBanks) {

        const availableUnits =
            bank.inventory[bloodGroup];

        // Check if enough blood is available
        if (availableUnits >= requiredUnits) {

            let score = 0;


            // Availability score
            score += 40;


            // Distance score
            if (bank.distance <= 5) {

                score += 30;

            } else if (bank.distance <= 10) {

                score += 20;

            } else {

                score += 10;

            }


            // Urgency score
            if (urgency === "critical") {

                score += 30;

            } else if (urgency === "urgent") {

                score += 20;

            } else {

                score += 10;

            }


            matches.push({

                bankName: bank.name,

                bloodGroup: bloodGroup,

                availableUnits: availableUnits,

                distance: bank.distance,

                score: score

            });

        }

    }


    // Highest score first
    matches.sort((a, b) => b.score - a.score);


    return matches;
}


module.exports = findMatches;