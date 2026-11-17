import java.util.Calendar

/* Library.kt — all the rules of the Library Management System.
   No input/output happens here, so the same file is reused by the Android app. */

/** One book record (Task 1). It is immutable: issuing/returning replaces it with a copy. */
data class Book(
    val id: String,
    val title: String,
    val author: String,
    val year: Int,
    val availableCopies: Int
) {
    val isAvailable: Boolean get() = availableCopies > 0

    /** Availability status text used by search (Task 3). */
    val availability: String
        get() = if (isAvailable) {
            "Available ($availableCopies ${if (availableCopies == 1) "copy" else "copies"})"
        } else {
            "Not available (all copies issued)"
        }
}

enum class IssueStatus(val label: String) { ISSUED("Issued"), RETURNED("Returned") }

/** One transaction: a book issued to a student (Tasks 4 and 5). */
data class IssueRecord(
    val bookId: String,
    val studentId: String,
    val status: IssueStatus = IssueStatus.ISSUED
)

/** A row of the "currently issued books" report (Task 6). */
data class IssuedBookInfo(
    val bookId: String,
    val title: String,
    val studentId: String,
    val status: IssueStatus
)

/** Every operation returns either a Success or a Failure with a message for the user. */
sealed class Outcome(val message: String) {
    class Success(message: String) : Outcome(message)
    class Failure(message: String) : Outcome(message)

    val isSuccess: Boolean get() = this is Success
}

class Library {

    // Task 1: books live in a map keyed by book ID, so a duplicate ID can never be stored.
    // LinkedHashMap keeps the order in which books were added.
    private val books = LinkedHashMap<String, Book>()

    // Every issue/return is recorded here (Tasks 4, 5 and 6).
    private val records = mutableListOf<IssueRecord>()

    companion object {
        const val MIN_YEAR = 1000
        const val MAX_COPIES = 1000
    }

    // IDs are compared ignoring case and surrounding spaces ("b1" and " B1 " are the same ID).
    private fun key(id: String) = id.trim().lowercase()

    // Accepts only plain digits, so "+5", "-3", "2.5" and "abc" are all rejected.
    private fun String.toWholeNumberOrNull(): Int? {
        val text = trim()
        return if (text.isNotEmpty() && text.all { it in '0'..'9' }) text.toIntOrNull() else null
    }

    private fun findOutstanding(bookId: String, studentId: String): IssueRecord? =
        records.firstOrNull {
            it.status == IssueStatus.ISSUED &&
                key(it.bookId) == key(bookId) &&
                key(it.studentId) == key(studentId)
        }

    // ---------------------------------------------------------------- Task 1
    fun addBook(id: String, title: String, author: String, year: String, copies: String): Outcome {
        val cleanId = id.trim()
        val cleanTitle = title.trim()
        val cleanAuthor = author.trim()

        if (cleanId.isEmpty()) return Outcome.Failure("Book ID cannot be empty.")
        if (key(cleanId) in books) return Outcome.Failure("A book with ID '$cleanId' already exists.")
        if (cleanTitle.isEmpty()) return Outcome.Failure("Book title cannot be empty.")
        if (cleanAuthor.isEmpty()) return Outcome.Failure("Author name cannot be empty.")

        val thisYear = Calendar.getInstance().get(Calendar.YEAR)
        val yearValue = year.toWholeNumberOrNull()
        if (yearValue == null || yearValue !in MIN_YEAR..thisYear) {
            return Outcome.Failure("Publication year must be a whole number between $MIN_YEAR and $thisYear.")
        }

        val copiesValue = copies.toWholeNumberOrNull()
        if (copiesValue == null || copiesValue !in 1..MAX_COPIES) {
            return Outcome.Failure("Number of copies must be a whole number between 1 and $MAX_COPIES.")
        }

        books[key(cleanId)] = Book(cleanId, cleanTitle, cleanAuthor, yearValue, copiesValue)
        return Outcome.Success("Book '$cleanTitle' was added.")
    }

    // ---------------------------------------------------------------- Task 2
    fun allBooks(): List<Book> = books.values.toList()

    // ---------------------------------------------------------------- Task 3
    /** Finds books whose ID equals the query, or whose title contains it (ignoring case). */
    fun search(query: String): List<Book> {
        val q = key(query)
        if (q.isEmpty()) return emptyList()
        return books.values.filter { key(it.id) == q || it.title.lowercase().contains(q) }
    }

    // ---------------------------------------------------------------- Task 4
    fun issueBook(bookId: String, studentId: String): Outcome {
        val student = studentId.trim()
        if (bookId.isBlank()) return Outcome.Failure("Book ID cannot be empty.")
        if (student.isEmpty()) return Outcome.Failure("Student ID cannot be empty.")

        val book = books[key(bookId)]
            ?: return Outcome.Failure("No book with ID '${bookId.trim()}' exists.")
        if (findOutstanding(book.id, student) != null) {
            return Outcome.Failure("Student '$student' already has '${book.title}' issued.")
        }
        if (!book.isAvailable) {
            return Outcome.Failure("No copies of '${book.title}' are available right now.")
        }

        books[key(book.id)] = book.copy(availableCopies = book.availableCopies - 1)
        records.add(IssueRecord(book.id, student))
        return Outcome.Success("'${book.title}' was issued to student '$student'.")
    }

    // ---------------------------------------------------------------- Task 5
    fun returnBook(bookId: String, studentId: String): Outcome {
        val student = studentId.trim()
        if (bookId.isBlank()) return Outcome.Failure("Book ID cannot be empty.")
        if (student.isEmpty()) return Outcome.Failure("Student ID cannot be empty.")

        // A return is only allowed when a matching, still-open issue record exists.
        val record = findOutstanding(bookId, student)
            ?: return Outcome.Failure("No outstanding issue record for student '$student' and book '${bookId.trim()}'.")
        val book = books.getValue(key(record.bookId))

        records[records.indexOf(record)] = record.copy(status = IssueStatus.RETURNED)
        books[key(book.id)] = book.copy(availableCopies = book.availableCopies + 1)
        return Outcome.Success("'${book.title}' was returned by student '$student'.")
    }

    // ---------------------------------------------------------------- Task 6
    fun issuedBooks(): List<IssuedBookInfo> =
        records
            .filter { it.status == IssueStatus.ISSUED }
            .map { IssuedBookInfo(it.bookId, books[key(it.bookId)]?.title ?: "(unknown)", it.studentId, it.status) }
}