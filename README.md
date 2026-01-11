# Flex Notes

## Description
Flex Notes is a web-based notes application built using Firebase Authentication and Firestore.
Users sign in with email and password, after which all notes are securely scoped to their account.
Notes are created, edited, deleted, and searched in real time without page reloads.
The interface switches between a preview list and a full editor.

## Tech Stack
- HTML5
- CSS3
- JS
- Firebase Firestore
- Firebase Authentication

## Setup
Clone the repository.
Open the project folder in VS Code.
Go to Firebase Console and create a project.

Enable:
Authentication → Email/Password
Firestore Database

Replace the firebaseConfig object inside index.html with your own Firebase project credentials 
Make sure all files are in the same root directory:
index.html
homepage.js
login.css
notes.css

Open index.html directly in a browser or serve it using a local server.


## Usage
Open the app.

Log in using a registered email and password. 

Click Add Note to create a new note. 

Click a note card to open the full editor.

Edit the title or content and hit Save.

Use the search bar to filter notes by title or content.

Click Delete to permanently remove a note.

Use the back button to return to the notes grid. Unsaved progress will be lost.

Refreshing the page logs the user out by design.

Notes are private per user.
