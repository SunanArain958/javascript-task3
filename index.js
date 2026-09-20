

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const studentsRef = database.ref("students");

// HTML Elements
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const searchInput = document.getElementById("search");

const studentsBox = document.getElementById("students");
const totalBox = document.getElementById("total");

const addBtn = document.getElementById("addBtn");
const formTitle = document.getElementById("formTitle");

// Store students
let allStudents = {};

// Edit mode
let editingId = null;


// ADD / UPDATE STUDENT
async function addStudent() {
    const studentName = nameInput.value.trim();
    const studentEmail = emailInput.value.trim().toLowerCase();

    if (!studentName || !studentEmail) {
        alert("Please enter student name and email.");
        return;
    }

    if (!emailInput.checkValidity()) {
        alert("Please enter a valid email address.");
        return;
    }

    try {
        // Check duplicate email
        const snapshot = await studentsRef
            .orderByChild("email")
            .equalTo(studentEmail)
            .once("value");

        let duplicate = false;

        snapshot.forEach(function(child) {
            if (child.key !== editingId) {
                duplicate = true;
            }
        });

        if (duplicate) {
            alert("Ye email already use ho chuki hai. Email change karo.");
            return;
        }

        if (editingId !== null) {
            // Update existing student
            await studentsRef.child(editingId).update({
                name: studentName,
                email: studentEmail
            });

            alert("Student updated successfully!");

        } else {
            // Add new student
            const newStudent = studentsRef.push();

            await newStudent.set({
                name: studentName,
                email: studentEmail
            });

            alert("Student added successfully!");
        }

        resetForm();

    } catch (error) {
        console.error("Firebase Error:", error);
        alert("Error: " + error.message);
    }
}


// RESET FORM
function resetForm() {
    nameInput.value = "";
    emailInput.value = "";

    editingId = null;

    formTitle.textContent = "Add New Student";
    addBtn.textContent = "Add Student";
}


// READ STUDENTS
studentsRef.on("value", function(snapshot) {
    allStudents = snapshot.val() || {};

    displayStudents();

}, function(error) {
    console.error("Database Error:", error);

    studentsBox.textContent =
        "Error loading students: " + error.message;
});


// SEARCH + DISPLAY STUDENTS
function displayStudents() {
    const searchValue = searchInput.value.trim().toLowerCase();

    studentsBox.innerHTML = "";

    const studentIds = Object.keys(allStudents);

    // Total database students
    totalBox.textContent = studentIds.length + " Students";

    const filteredIds = studentIds.filter(function(id) {
        const student = allStudents[id];

        return (
            student.name.toLowerCase().includes(searchValue) ||
            student.email.toLowerCase().includes(searchValue)
        );
    });

    if (filteredIds.length === 0) {
        studentsBox.innerHTML =
            '<div class="empty">No students found</div>';
        return;
    }

    filteredIds.forEach(function(id) {
        const student = allStudents[id];

        // Student row
        const studentDiv = document.createElement("div");
        studentDiv.className = "student";

        // Avatar
        const avatar = document.createElement("div");
        avatar.className = "avatar";

        avatar.textContent =
            student.name.charAt(0).toUpperCase();

        // Student information
        const info = document.createElement("div");
        info.className = "info";

        const heading = document.createElement("h3");
        heading.textContent = student.name;

        const email = document.createElement("p");
        email.textContent = student.email;

        info.appendChild(heading);
        info.appendChild(email);

        // Action buttons
        const actions = document.createElement("div");
        actions.className = "actions";

        const editBtn = document.createElement("button");
        editBtn.className = "edit";
        editBtn.textContent = "Edit";

        editBtn.onclick = function() {
            editStudent(id);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete";
        deleteBtn.textContent = "Delete";

        deleteBtn.onclick = function() {
            deleteStudent(id);
        };

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        studentDiv.appendChild(avatar);
        studentDiv.appendChild(info);
        studentDiv.appendChild(actions);

        studentsBox.appendChild(studentDiv);
    });
}


// EDIT STUDENT
function editStudent(id) {
    const student = allStudents[id];

    if (!student) {
        alert("Student not found.");
        return;
    }

    nameInput.value = student.name;
    emailInput.value = student.email;

    editingId = id;

    formTitle.textContent = "Edit Student";
    addBtn.textContent = "Update Student";

    nameInput.focus();
}


// DELETE STUDENT
async function deleteStudent(id) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) {
        return;
    }

    try {
        await studentsRef.child(id).remove();

        if (editingId === id) {
            resetForm();
        }

        alert("Student deleted successfully!");

    } catch (error) {
        console.error("Delete Error:", error);
        alert("Error: " + error.message);
    }
}


// BUTTON EVENTS
addBtn.addEventListener("click", addStudent);

searchInput.addEventListener("input", displayStudents);