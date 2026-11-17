/* app.js — page behaviour. Needs library.js loaded first. */

const STORAGE_KEY = "libraryManagement.v1";

/* ---------- saving: books and records stay in this browser after a refresh ---------- */
function loadLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Library(raw ? JSON.parse(raw) : {});
  } catch (err) {
    console.warn("Could not read saved data, starting fresh.", err);
    return new Library();
  }
}

function saveLibrary() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library.toJSON()));
  } catch (err) {
    console.warn("Could not save data.", err);
  }
}

const library = loadLibrary();

// Start with the sample books already in the library. Books whose ID already exists are skipped,
// so this is safe to run on every page load and never creates duplicates.
if (library.loadSampleBooks().ok) saveLibrary();

/* ---------- small helpers ---------- */
const $ = (id) => document.getElementById(id);

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function table(headers, rows, emptyText) {
  if (!rows.length) return `<p class="empty">${esc(emptyText)}</p>`;
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = rows.map((r) => `<tr>${r.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function showFlash(result) {
  const box = $("flash");
  box.textContent = result.message;
  box.className = result.ok ? "ok" : "err";
  box.hidden = false;
}

function clearFlash() {
  $("flash").hidden = true;
}

const availabilityBadge = (book) =>
  book.availableCopies > 0
    ? `<span class="badge yes">Available (${book.availableCopies} ${book.availableCopies === 1 ? "copy" : "copies"})</span>`
    : `<span class="badge no">Not available</span>`;

/* ---------- rendering ---------- */
function renderBooks() {
  const rows = library.allBooks().map((b) => [esc(b.id), esc(b.title), esc(b.author), b.year, b.availableCopies]);
  $("books-table").innerHTML = table(
    ["Book ID", "Title", "Author", "Year", "Available Copies"],
    rows,
    "No books have been added yet."
  );
}

function renderSearch() {
  const query = $("search-input").value;
  if (!query.trim()) {
    $("search-table").innerHTML = '<p class="empty">Type a book ID or part of a title.</p>';
    return;
  }
  const rows = library
    .search(query)
    .map((b) => [esc(b.id), esc(b.title), esc(b.author), b.year, b.availableCopies, availabilityBadge(b)]);
  $("search-table").innerHTML = table(
    ["Book ID", "Title", "Author", "Year", "Available Copies", "Status"],
    rows,
    `No book found for "${query.trim()}".`
  );
}

function renderIssued() {
  const rows = library.issuedBooks().map((i) => [esc(i.bookId), esc(i.title), esc(i.studentId), `<span class="badge issued">${esc(i.status)}</span>`]);
  $("issued-table").innerHTML = table(["Book ID", "Title", "Student ID", "Status"], rows, "No books are currently issued.");
}

const renderers = { books: renderBooks, search: renderSearch, issued: renderIssued };

function showTab(name) {
  document.querySelectorAll("#menu button").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll("main > section").forEach((s) => (s.hidden = s.id !== `tab-${name}`));
  clearFlash();
  if (renderers[name]) renderers[name]();
}

/* ---------- events ---------- */
$("menu").addEventListener("click", (e) => {
  if (e.target.dataset.tab) showTab(e.target.dataset.tab);
});

// every form works the same way: run an action, show the message, save, clear the form on success
function handleForm(formId, action) {
  $(formId).addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const result = action(data);
    showFlash(result);
    if (result.ok) {
      saveLibrary();
      e.target.reset();
      e.target.querySelector("input").focus();
    }
  });
}

handleForm("form-add", (d) => library.addBook(d));
handleForm("form-issue", (d) => library.issueBook(d.bookId, d.studentId));
handleForm("form-return", (d) => library.returnBook(d.bookId, d.studentId));

$("search-input").addEventListener("input", renderSearch);

showTab("add");