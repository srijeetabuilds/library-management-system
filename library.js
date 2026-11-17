/* library.js — all the rules of the Library Management System (no DOM code here).
   Same rules as the Kotlin version, so the console, web and Android apps behave alike. */

const MIN_YEAR = 1000;
const MAX_COPIES = 1000;

// Example data for the "Load sample books" button: [id, title, author, year, copies]
const SAMPLE_BOOKS = [
  ["B101", "Clean Code", "Robert C. Martin", "2008", "3"],
  ["B102", "The Pragmatic Programmer", "Andrew Hunt & David Thomas", "1999", "2"],
  ["B103", "Introduction to Algorithms", "Thomas H. Cormen et al.", "2009", "4"],
  ["B104", "Design Patterns", "Erich Gamma et al.", "1994", "2"],
  ["B105", "Kotlin in Action", "Dmitry Jemerov & Svetlana Isakova", "2017", "3"],
  ["B106", "Artificial Intelligence: A Modern Approach", "Stuart Russell & Peter Norvig", "2020", "5"],
  ["B107", "Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow", "Aurélien Géron", "2019", "4"],
  ["B108", "Deep Learning", "Ian Goodfellow, Yoshua Bengio & Aaron Courville", "2016", "3"],
  ["B109", "Python Crash Course", "Eric Matthes", "2015", "5"],
  ["B110", "The C Programming Language", "Brian Kernighan & Dennis Ritchie", "1988", "2"],
  ["B111", "Computer Networking: A Top-Down Approach", "James Kurose & Keith Ross", "2020", "3"],
  ["B112", "Operating System Concepts", "Abraham Silberschatz et al.", "2018", "4"],
  ["B113", "Code Complete", "Steve McConnell", "2004", "2"],
  ["B114", "Refactoring", "Martin Fowler", "2018", "2"],
  ["B115", "Effective Java", "Joshua Bloch", "2017", "3"],
  ["B116", "Cracking the Coding Interview", "Gayle Laakmann McDowell", "2015", "5"],
  ["B117", "Pattern Recognition and Machine Learning", "Christopher M. Bishop", "2006", "2"],
  ["B118", "Designing Data-Intensive Applications", "Martin Kleppmann", "2017", "3"],
];

// IDs are compared ignoring case and surrounding spaces ("b1" and " B1 " are the same ID).
const key = (text) => String(text ?? "").trim().toLowerCase();
const ok = (message) => ({ ok: true, message });
const fail = (message) => ({ ok: false, message });

// Accepts only plain digits, so "+5", "-3", "2.5" and "abc" are all rejected.
function wholeNumber(text) {
  const t = String(text ?? "").trim();
  return /^\d+$/.test(t) ? Number(t) : null;
}

class Library {
  constructor(data = {}) {
    // books: { id, title, author, year, availableCopies }   records: { bookId, studentId, status }
    this.books = Array.isArray(data.books) ? data.books : [];
    this.records = Array.isArray(data.records) ? data.records : [];
  }

  toJSON() {
    return { books: this.books, records: this.records };
  }

  findBook(id) {
    return this.books.find((b) => key(b.id) === key(id));
  }

  findOutstanding(bookId, studentId) {
    return this.records.find(
      (r) => r.status === "Issued" && key(r.bookId) === key(bookId) && key(r.studentId) === key(studentId)
    );
  }

  // Task 1: add a book (rejects duplicate IDs and invalid values)
  addBook({ id, title, author, year, copies }) {
    const cleanId = String(id ?? "").trim();
    const cleanTitle = String(title ?? "").trim();
    const cleanAuthor = String(author ?? "").trim();

    if (!cleanId) return fail("Book ID cannot be empty.");
    if (this.findBook(cleanId)) return fail(`A book with ID '${cleanId}' already exists.`);
    if (!cleanTitle) return fail("Book title cannot be empty.");
    if (!cleanAuthor) return fail("Author name cannot be empty.");

    const thisYear = new Date().getFullYear();
    const yearValue = wholeNumber(year);
    if (yearValue === null || yearValue < MIN_YEAR || yearValue > thisYear) {
      return fail(`Publication year must be a whole number between ${MIN_YEAR} and ${thisYear}.`);
    }

    const copiesValue = wholeNumber(copies);
    if (copiesValue === null || copiesValue < 1 || copiesValue > MAX_COPIES) {
      return fail(`Number of copies must be a whole number between 1 and ${MAX_COPIES}.`);
    }

    this.books.push({ id: cleanId, title: cleanTitle, author: cleanAuthor, year: yearValue, availableCopies: copiesValue });
    return ok(`Book '${cleanTitle}' was added.`);
  }

  // Task 2
  allBooks() {
    return this.books.slice();
  }

  // Adds the sample books through addBook(), so the normal checks apply and existing IDs are skipped.
  loadSampleBooks() {
    let added = 0;
    for (const [id, title, author, year, copies] of SAMPLE_BOOKS) {
      if (this.addBook({ id, title, author, year, copies }).ok) added++;
    }
    const skipped = SAMPLE_BOOKS.length - added;
    if (added === 0) return fail("The sample books are already in the library.");
    return ok(`Loaded ${added} sample book${added === 1 ? "" : "s"}${skipped ? ` (${skipped} already existed)` : ""}.`);
  }

  // Task 3: ID equals the query, or the title contains it (ignoring case)
  search(query) {
    const q = key(query);
    if (!q) return [];
    return this.books.filter((b) => key(b.id) === q || b.title.toLowerCase().includes(q));
  }

  // Task 4
  issueBook(bookId, studentId) {
    const student = String(studentId ?? "").trim();
    if (!key(bookId)) return fail("Book ID cannot be empty.");
    if (!student) return fail("Student ID cannot be empty.");

    const book = this.findBook(bookId);
    if (!book) return fail(`No book with ID '${String(bookId).trim()}' exists.`);
    if (this.findOutstanding(book.id, student)) return fail(`Student '${student}' already has '${book.title}' issued.`);
    if (book.availableCopies < 1) return fail(`No copies of '${book.title}' are available right now.`);

    book.availableCopies -= 1;
    this.records.push({ bookId: book.id, studentId: student, status: "Issued" });
    return ok(`'${book.title}' was issued to student '${student}'.`);
  }

  // Task 5: a return needs a matching, still-open issue record
  returnBook(bookId, studentId) {
    const student = String(studentId ?? "").trim();
    if (!key(bookId)) return fail("Book ID cannot be empty.");
    if (!student) return fail("Student ID cannot be empty.");

    const record = this.findOutstanding(bookId, student);
    if (!record) {
      return fail(`No outstanding issue record for student '${student}' and book '${String(bookId).trim()}'.`);
    }
    const book = this.findBook(record.bookId);

    record.status = "Returned";
    book.availableCopies += 1;
    return ok(`'${book.title}' was returned by student '${student}'.`);
  }

  // Task 6
  issuedBooks() {
    return this.records
      .filter((r) => r.status === "Issued")
      .map((r) => ({
        bookId: r.bookId,
        title: (this.findBook(r.bookId) || { title: "(unknown)" }).title,
        studentId: r.studentId,
        status: r.status,
      }));
  }
}

// lets you test this file in Node: node -e "const {Library}=require('./library.js')"
if (typeof module !== "undefined") {
  module.exports = { Library, SAMPLE_BOOKS };
}
