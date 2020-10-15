import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";
admin.initializeApp();

import { StatsService } from "./services/stats";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

const db = admin.firestore();

const statsService = new StatsService();
//
// exports.overviewStats = functions.https.onRequest(async (request, res) => {
exports.overviewStats = functions.https.onCall(async (request, res) => {
    
    // var profileId = 'HeHYkQo36B85oNLINngt';
    var profileId = request['profileId'];

    var user = await db.collection('profiles').doc(profileId).get();
    var user_id = "";
    try {
        var userdata = user === null || user === void 0 ? void 0 : user.data();
        if (userdata) {
            user_id = userdata.user_id;
        }
        // res.send('Test done');
        const recordSnap = await admin
          .firestore()
          .collection("records")
          .where("user_id", "==", user_id)
          .get();
        const recordId = recordSnap.docs[0].ref.id;
        const stats = await statsService.test(recordId, profileId);


        return stats;
        // res.send(JSON.stringify(stats)); return;
    }
    catch (error) 
    {
        return error;
        // res.status(400).send(error);
    }
});
