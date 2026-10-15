
require("dotenv").config();

const mongoose = require("mongoose");
const Equipment = require("./models/Equipment");
const User = require("./models/User");

async function fixEquipmentOwnerIds() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const equipmentList = await Equipment.find({
            $or: [
                { ownerId: { $exists: false } },
                { ownerId: null }
            ]
        });

        let updated = 0;
        let skipped = 0;

        for (const equipment of equipmentList) {
            const matchingUsers = await User.find({
                name: equipment.owner
            }).select("_id name");

            if (matchingUsers.length !== 1) {
                console.log(
                    `SKIPPED: "${equipment.name}" — owner "${equipment.owner}" has ${matchingUsers.length} matching users`
                );
                skipped++;
                continue;
            }

            equipment.ownerId = matchingUsers[0]._id;
            await equipment.save();

            console.log(
                `UPDATED: "${equipment.name}" → ownerId ${matchingUsers[0]._id}`
            );

            updated++;
        }

        console.log("\nMigration finished.");
        console.log("Updated:", updated);
        console.log("Skipped:", skipped);

    } catch (error) {
        console.error("Migration failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

fixEquipmentOwnerIds();
