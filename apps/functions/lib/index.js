"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveChoreography = exports.updateUserProfile = exports.getUserProfile = exports.helloWorld = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
// Initialize Firebase Admin
admin.initializeApp();
// Example HTTP function
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.json({ message: 'Hello from Bailapp Functions!' });
});
// Example authenticated function
exports.getUserProfile = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to get profile');
    }
    const uid = context.auth.uid;
    try {
        // Get user data from Firestore
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return {
                uid,
                displayName: context.auth.token.name || 'Anonymous',
                email: context.auth.token.email || null,
                profileCreated: false,
            };
        }
        return Object.assign(Object.assign({ uid }, userDoc.data()), { profileCreated: true });
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get user profile');
    }
});
exports.updateUserProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const uid = context.auth.uid;
    const { displayName, bio, favoriteStyles } = data;
    try {
        await admin
            .firestore()
            .collection('users')
            .doc(uid)
            .set({
            displayName,
            bio,
            favoriteStyles,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { success: true };
    }
    catch (error) {
        console.error('Error updating user profile:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update user profile');
    }
});
exports.saveChoreography = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to save choreography');
    }
    const uid = context.auth.uid;
    const { title, description, moves } = data;
    try {
        const choreographyRef = await admin
            .firestore()
            .collection('choreographies')
            .add({
            userId: uid,
            title,
            description,
            moves,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            choreographyId: choreographyRef.id,
        };
    }
    catch (error) {
        console.error('Error saving choreography:', error);
        throw new functions.https.HttpsError('internal', 'Failed to save choreography');
    }
});
//# sourceMappingURL=index.js.map