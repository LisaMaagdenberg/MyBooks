app.post('/books', (req, res) => {
	const searching = req.body.search;
	OwnedBooks.findAll({order: 'authorLastName'})
	.then(function(result){
		var booksWeSeek = []
		for (var i = 0; i < result.length; i++) {
			if (result[i].authorfirstname !== null && result[i].authorfirstname.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].authorlastname !== null && result[i].authorlastname.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].title !== null && result[i].title.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].genre !== null && result[i].genre.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].language !== null && result[i].language.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			} else if (result[i].lastread !== null && result[i].lastread.includes(searching)) {
				booksWeSeek.push({
					authorfirstname: result[i].dataValues.authorfirstname,
					authorlastname: result[i].dataValues.authorlastname,
					title: result[i].dataValues.title,
					genre: result[i].dataValues.genre,
					language: result[i].dataValues.language,
					lastread: result[i].dataValues.lastread
				})
			}
		}
		console.log(booksWeSeek)
		const SeekingBooks = {allBooks: booksWeSeek}
		res.render('books', SeekingBooks);
	})
})

module.exports