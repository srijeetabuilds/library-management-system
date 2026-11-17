/* Main.kt — console interface (Task 7). Run together with Library.kt. */

fun main() {
    val library = Library()
    println("===== Library Management System =====")

    while (true) {
        printMenu()
        // readLine() returns null when the input stream is closed, so we stop instead of looping forever.
        val choice = readLine()?.trim() ?: break

        when (choice) {
            "1" -> addBook(library)
            "2" -> displayAllBooks(library)
            "3" -> searchBook(library)
            "4" -> issueBook(library)
            "5" -> returnBook(library)
            "6" -> displayIssuedBooks(library)
            "7" -> {
                println("Goodbye!")
                break
            }
            else -> println("Invalid choice. Please enter a number from 1 to 7.")
        }
    }
}

fun printMenu() {
    println()
    println("1. Add a new book")
    println("2. Display all books")
    println("3. Search for a book")
    println("4. Issue a book")
    println("5. Return a book")
    println("6. Display currently issued books")
    println("7. Exit")
    print("Enter your choice: ")
}

/** Prints a label, then reads one trimmed line (empty if the input has ended). */
fun ask(label: String): String {
    print("$label: ")
    return readLine()?.trim() ?: ""
}

fun printResult(outcome: Outcome) {
    println(if (outcome.isSuccess) "[OK] ${outcome.message}" else "[ERROR] ${outcome.message}")
}

/** Prints rows as a table whose columns are exactly as wide as their longest value. */
fun printTable(headers: List<String>, rows: List<List<String>>) {
    val widths = headers.indices.map { col ->
        maxOf(headers[col].length, rows.maxOfOrNull { it[col].length } ?: 0)
    }
    val line = widths.joinToString("+", prefix = "+", postfix = "+") { "-".repeat(it + 2) }
    fun format(cells: List<String>) =
        cells.indices.joinToString("|", prefix = "|", postfix = "|") { " " + cells[it].padEnd(widths[it]) + " " }

    println(line)
    println(format(headers))
    println(line)
    rows.forEach { println(format(it)) }
    println(line)
}

fun bookRow(book: Book) =
    listOf(book.id, book.title, book.author, book.year.toString(), book.availableCopies.toString())

// ------------------------------------------------------------------ menu actions

fun addBook(library: Library) {
    println("--- Add a new book ---")
    val id = ask("Book ID")
    val title = ask("Book title")
    val author = ask("Author name")
    val year = ask("Publication year")
    val copies = ask("Number of available copies")
    printResult(library.addBook(id, title, author, year, copies))
}

fun displayAllBooks(library: Library) {
    val books = library.allBooks()
    if (books.isEmpty()) {
        println("No books have been added yet.")
        return
    }
    printTable(
        listOf("Book ID", "Title", "Author", "Year", "Available Copies"),
        books.map { bookRow(it) }
    )
}

fun searchBook(library: Library) {
    val query = ask("Enter book ID or title")
    val results = library.search(query)
    if (results.isEmpty()) {
        println("No book found for '$query'.")
        return
    }
    printTable(
        listOf("Book ID", "Title", "Author", "Year", "Available Copies", "Status"),
        results.map { bookRow(it) + it.availability }
    )
}

fun issueBook(library: Library) {
    val bookId = ask("Book ID")
    val studentId = ask("Student ID")
    printResult(library.issueBook(bookId, studentId))
}

fun returnBook(library: Library) {
    val bookId = ask("Book ID")
    val studentId = ask("Student ID")
    printResult(library.returnBook(bookId, studentId))
}

fun displayIssuedBooks(library: Library) {
    val issued = library.issuedBooks()
    if (issued.isEmpty()) {
        println("No books are currently issued.")
        return
    }
    printTable(
        listOf("Book ID", "Title", "Student ID", "Status"),
        issued.map { listOf(it.bookId, it.title, it.studentId, it.status.label) }
    )
}