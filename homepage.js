const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
let activeNoteId = null;
let activeNoteData = null;
let editorOpen = false;
let currentUserId = "";
let cachedNotes = [];

auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
.catch(err => {
  console.error("Auth persistence error:", err);
});


auth.onAuthStateChanged(user => {
  if (user) {
    //logged in
    const loginpage = document.getElementById("login-screen");
    const notespage = document.getElementById("notes-screen");
    loginpage.style.display = "none";
    notespage.style.display = "flex";
    loadNotes(user.uid);
    currentUserId = user.uid;
  }
  else {
    activeNoteId = null;
    activeNoteData = null;
    editorOpen = false;
    cachedNotes = [];
    //logged out
    const loginpage = document.getElementById("login-screen");
    const notespage = document.getElementById("notes-screen");
    notespage.style.display = "none";
    loginpage.style.display = "block";
  }
});


const loginButton = document.getElementById("login-button");
const email_e = document.getElementById("login-email");
const password_e = document.getElementById("login-password");

loginButton.addEventListener("click", () =>{
  const email = email_e.value.trim();
  const pass = password_e.value.trim();

  if(!email || !pass){
    alert("Enter both fields");
    return;
  }
  auth.signInWithEmailAndPassword(email, pass).catch(error => {
    alert(error.message);
  });
});

const db = firebase.firestore();
const add_note = document.getElementById("add-note");

add_note.addEventListener("click", async () =>{
  const user = auth.currentUser;
  if(!user) return;

  await db.collection("notes").add({
    userId: user.uid,
    title: "Untitled",
    content: "",
    created: firebase.firestore.FieldValue.serverTimestamp(),
    updated: firebase.firestore.FieldValue.serverTimestamp(),

  })
})

const displayArea = document.getElementById("display-area");

function loadNotes(userId) {
  db.collection("notes")
    .where("userId", "==", userId)
    .orderBy("updated", "desc")
    .onSnapshot(snapshot => {

      if (editorOpen) return;

      cachedNotes = [];
      displayArea.innerHTML = "";

      snapshot.forEach(doc => {
        cachedNotes.push({ id: doc.id, ...doc.data() });
      });

      renderNotes(cachedNotes);
    });
}

function renderNotes(notes) {
  displayArea.innerHTML = "";

  notes.forEach(note => {
    const notediv = document.createElement("div");
    notediv.dataset.noteId = note.id;
    notediv.className = "note-preview";
    notediv.innerHTML = `
      <div><h3>${note.title}</h3></div>
      <div style="width:100%;height:2px;background:white;"></div>
      <p>${getPreviewText(note.content)}</p>
    `;
    displayArea.appendChild(notediv);
  });
}



function getPreviewText(text) {
  if (!text) return "";

  const clean = text.replace(/\n+/g, " ").trim();
  const words = clean.split(/\s+/);

  let preview = words.slice(0, 30).join(" ");

  if (preview.length > 150) {
    preview = preview.slice(0, 150);
  }

  return preview + (words.length > 30 ? "..." : "");
}

//note click
displayArea.addEventListener("click", (event) => {
  const noteDiv = event.target.closest(".note-preview");
  if (!noteDiv) return;

  const noteId = noteDiv.dataset.noteId;
  openEditor(noteId);
});

function openEditor(noteId) {
  activeNoteId = noteId;
  editorOpen = true;

  db.collection("notes").doc(noteId).get().then((doc) => {
    if (!doc.exists) return;

    const noteData = doc.data();

    displayArea.innerHTML = `
      <div class="full-note">
        <div style="display: flex; align-items: center; margin-bottom: 20px; width: 100%;">
          <button id="back-button">←</button>
          <textarea id="note-title">${noteData.title}</textarea>
          <button id="save-button">Save</button>
        </div>

        <div style="width: 100%; height: 1px; background-color: white;"></div>

        <textarea id="note-inner">${noteData.content}</textarea>

        <div style="display: flex; justify-content: space-between; width: 100%;">
          <button id="attach-button">Attach</button>
          <button id="delete-button">Delete</button>
        </div>

        <input type="file" id="file-input" style="display:none" />
        <div id="attachment-display"></div>
      </div>
    `;

    document.body.classList.add("editor-open");

    const attachmentDiv = document.getElementById("attachment-display");
    attachmentDiv.innerHTML = "";

    const attachments = noteData.attachments || [];

    attachments.forEach(file => {
      const card = document.createElement("div");
      card.className = "attachment-card";

      card.innerHTML = `
        <div class="attachment-info" onclick="window.open('${file.url}', '_blank')">
          <div class="attachment-name">${file.name}</div>
          <div class="attachment-meta">${file.type || "file"} • ${Math.round(file.size / 1024)} KB</div>
        </div>
        <div class="attachment-actions">
          <button class="delete-attachment-btn" data-url="${file.url}" data-name="${file.name}">
            Delete
          </button>
        </div>
      `;

      attachmentDiv.appendChild(card);
    });
  });
}



displayArea.addEventListener("click", (event) => {
  if (event.target.id === "back-button") {
    editorOpen = false;
    document.body.classList.remove("editor-open");
    loadNotes(auth.currentUser.uid);
    return;
  }

  if(event.target.id === "save-button"){
    save_data();
    if (document.getElementById("save-button").disabled) return;
    return;
  }

  if(event.target.id === "delete-button"){
    delete_note();
    return;
  }
  if (event.target.id === "attach-button") {
    document.getElementById("file-input").click();
    return;
  }
  if (event.target.innerText === "Delete" && event.target.dataset.url) {
    const fileUrl = event.target.dataset.url;

    if (!confirm("Delete this attachment?")) return;

    const noteRef = db.collection("notes").doc(activeNoteId);

    noteRef.get().then(doc => {
      if (!doc.exists) return;

      const attachments = doc.data().attachments || [];
      const updated = attachments.filter(a => a.url !== fileUrl);

      return noteRef.update({ attachments: updated });
    }).then(() => {
      openEditor(activeNoteId);
    });

    return;
  }

});

function save_data(){
  note_content = document.getElementById("note-inner").value;
  note_title = document.getElementById("note-title").value;
  db.collection("notes").doc(activeNoteId).update({
    title: note_title,
    content: note_content,
    updated: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    saveBtn = document.getElementById("save-button");
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Saved!";
    saveBtn.style.borderColor = "#4CAF50";
    saveBtn.style.color = "#4CAF50";
    saveBtn.disabled = true;

    setTimeout(() => {
      saveBtn.innerText = originalText;
      saveBtn.style.borderColor = "white";
      saveBtn.style.color = "white";
      saveBtn.disabled = false;
    }, 2000);
  })
  .catch((error) => {
      console.error("Error updating note: ", error);
  });
}

function delete_note(){
  if (!confirm("Are you sure you want to delete this note?")) return;
  db.collection("notes").doc(activeNoteId).delete().then(() => {
    loadNotes(auth.currentUser.uid);
    document.body.classList.remove("editor-open");
    editorOpen = false;
  })
  .catch((error) => {
      console.error("Error deleting note: ", error);
  });
}

const search = document.getElementById("search-note");

search.addEventListener("input", () => {
  const query = search.value.toLowerCase().trim();

  if (!query) {
    renderNotes(cachedNotes);
    return;
  }

  const filtered = cachedNotes.filter(note =>
    note.title.toLowerCase().includes(query) ||
    note.content.toLowerCase().includes(query)
  );

  renderNotes(filtered);
});

const signOutBtn = document.getElementById("sign-out-button");

signOutBtn.addEventListener("click", () => {
  auth.signOut()
    .catch(error => {
      console.error("Logout failed:", error);
    });
});

const passwordInput = document.getElementById("login-password");
const togglePasswordButton = document.getElementById("toggle-password");
var eye_state = 1;
togglePasswordButton.addEventListener("click", () => {
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  if(eye_state === 0){
    togglePasswordButton.style.transform = "translateY(-59.5%)";
    eye_state = 1;
  } 
  else{
    togglePasswordButton.style.transform = "translateY(0)";
    eye_state = 0;
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id !== "file-input") return;

  const file = event.target.files[0];
  if (!file || !activeNoteId) return;

  const user = auth.currentUser;
  if (!user) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "flexnotes_upload");

  formData.append(
    "folder",
    `flexnotes/${user.uid}/${activeNoteId}`
  );
  
  const cloudName = "decdtsqup";

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!data.secure_url) {
    console.error("Upload failed", data);
    return;
  }

  await db.collection("notes").doc(activeNoteId).update({
    attachments: firebase.firestore.FieldValue.arrayUnion({
      name: file.name,
      type: file.type,
      size: file.size,
      url: data.secure_url,
      uploadedAt: Date.now()
    })
  });
  openEditor(activeNoteId);

  event.target.value = "";
});

togglePasswordButton.addEventListener("touchstart", e => {
  e.preventDefault();
}, { passive: false });
