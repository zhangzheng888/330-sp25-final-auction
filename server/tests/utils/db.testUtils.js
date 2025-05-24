const mongoose = require('mongoose');

/**
 * Finds a single document in the specified collection that matches the query.
 * Converts _id to string if it exists.
 * @param {mongoose.Model} model - The Mongoose model to query.
 * @param {object} query - The query object to match.
 * @returns {Promise<object|null>} The found document as a plain object, or null.
 */
async function findOne(model, query) {
    const result = await model.findOne(query).lean(); // .lean() returns a plain JS object
    if (result && result._id) {
        result._id = result._id.toString();
    }
    // Recursively convert any other ObjectId instances to strings if needed
    // This is a simple version; a more robust one would traverse nested objects/arrays
    for (const key in result) {
        if (result[key] instanceof mongoose.Types.ObjectId) {
            result[key] = result[key].toString();
        }
    }
    return result;
}

/**
 * Finds all documents in the specified collection that match the query.
 * Converts _id to string for all found documents.
 * @param {mongoose.Model} model - The Mongoose model to query.
 * @param {object} query - The query object to match.
 * @returns {Promise<Array<object>>} An array of found documents as plain objects.
 */
async function find(model, query) {
    const results = await model.find(query).lean();
    return results.map(doc => {
        if (doc && doc._id) {
            doc._id = doc._id.toString();
        }
        // Recursively convert any other ObjectId instances to strings if needed
        for (const key in doc) {
            if (doc[key] instanceof mongoose.Types.ObjectId) {
                doc[key] = doc[key].toString();
            }
        }
        return doc;
    });
}

module.exports = {
    findOne,
    find,
};
