// Registered emergency volunteer donors.
// distance is in km (numeric) to stay consistent with bloodData.js.
// lat/lng are included for the map view (added next pass).
const donors = [
    {
        id: 101,
        name: "Rahul Sharma",
        bloodGroup: "O-",
        distance: 1.2,
        phone: "+91 98765 43210",
        lastDonated: "4 months ago",
        lat: 28.6180,
        lng: 77.2010
    },
    {
        id: 102,
        name: "Priya Singh",
        bloodGroup: "A+",
        distance: 2.8,
        phone: "+91 98123 45678",
        lastDonated: "6 months ago",
        lat: 28.6300,
        lng: 77.2200
    },
    {
        id: 103,
        name: "Amit Verma",
        bloodGroup: "O-",
        distance: 3.5,
        phone: "+91 99887 76655",
        lastDonated: "3 months ago",
        lat: 28.5980,
        lng: 77.2300
    },
    {
        id: 104,
        name: "Sneha Iyer",
        bloodGroup: "B+",
        distance: 2.1,
        phone: "+91 99001 22334",
        lastDonated: "5 months ago",
        lat: 28.6250,
        lng: 77.1950
    },
    {
        id: 105,
        name: "Mohammed Khan",
        bloodGroup: "O+",
        distance: 4.0,
        phone: "+91 98200 11223",
        lastDonated: "2 months ago",
        lat: 28.6050,
        lng: 77.2400
    },
    {
        id: 106,
        name: "Anjali Nair",
        bloodGroup: "AB+",
        distance: 5.2,
        phone: "+91 97654 33221",
        lastDonated: "7 months ago",
        lat: 28.6400,
        lng: 77.1800
    }
];

module.exports = donors;
