const express = require('express');
const app = express();
const connectionString = process.env.DATABASE_URL || 'postgres://' + 
	process.env.POSTGRES_USER + ':' + 
	process.env.POSTGRES_PASSWORD + '@localhost/mybooks';

const Sequelize = require('sequelize')
const sequelize = new Sequelize(connectionString)
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const session = require('express-session')

app.use(express.static('static'));
app.use(express.static('static/js'));
app.use(bodyParser.urlencoded({extended: true}));  
app.use(bodyParser.json());
app.set('views', './views');
app.set('view engine', 'pug');
app.use(session({
	secret: 'oh no i will never guess this secret',
	resave: false,
	saveUninitialized: false
}))

//set table ownedBooks
var OwnedBooks = sequelize.define('ownedbooks', {
	authorfirstname: Sequelize.STRING,
	authorlastname: Sequelize.STRING,
	title: Sequelize.STRING,
	genre: Sequelize.STRING,
	language: Sequelize.STRING,
	lastread: Sequelize.STRING,
});

//set table wishlist
var Wishlist = sequelize.define('wishlist', {
	title: Sequelize.STRING,
	authorfirstname: Sequelize.STRING,
	authorlastname: Sequelize.STRING,
	language: Sequelize.STRING,
	price: Sequelize.STRING
})

//set table users
var Users = sequelize.define('users', {
	username: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING
})

//get home '/' page
app.get('/', (req, res) => {
	Wishlist.findAll({limit: 5})
	.then(function(result){
		const wishHomepage = {
			fiveBooks: result, 
			user: req.session.user
		}
		res.render('index', wishHomepage);
	})
});

// for testing: makes a new row
// app.get('/', (req, res) => {
// 	OwnedBooks.create({
// 		authorfirstname: "J.K.",
// 		authorlastname: "Rowling",
// 		title: "Harry Potter en de Geheime Kamer",
// 		genre: "fantasy",
// 		language: "Dutch",
// 		lastread: "2015"
// 	})
// 	.then(function(){
// 		res.render('index')
// 	})
// })

//get books '/books' page
app.get('/books', (req, res) => {
	OwnedBooks.findAll({order: 'authorLastName'})
	.then(function(result){
		const allTheBooks = {
			allBooks: result,
			user: req.session.user
		}
		res.render('books', allTheBooks);
	})
});

//post books '/books' page (after searching)
app.post('/books', (req, res) => {
	const searching = req.body.search;
	const findLanguage = req.body.language;
	const findGenre = req.body.genre;
	const allGenres = req.body.allGenres;
	OwnedBooks.findAll({order: 'authorLastName'})
	.then(function(result){
		var booksWeSeek = []
		for (var i = 0; i < result.length; i++) {
			var book = {
				authorfirstname: result[i].dataValues.authorfirstname,
				authorlastname: result[i].dataValues.authorlastname,
				title: result[i].dataValues.title,
				genre: result[i].dataValues.genre,
				language: result[i].dataValues.language,
				lastread: result[i].dataValues.lastread
			}
			var bookDoesExist = result[i].authorfirstname !== null && result[i].authorfirstname.includes(searching) ||
				result[i].authorlastname !== null && result[i].authorlastname.includes(searching)   ||
				result[i].title !== null && result[i].title.includes(searching)						||
				result[i].lastread !== null && result[i].lastread.includes(searching);
			if (findLanguage.includes(result[i].language)) {
				if (allGenres === "all") {
					if (bookDoesExist) {
						booksWeSeek.push(book)
					} 
				} else if (findGenre.includes(result[i].genre) || result[i].genre !== null && result[i].genre.includes(findGenre)){
					if (bookDoesExist) {
						booksWeSeek.push(book)
					} 
				}
			}
		}
		const SeekingBooks = {
			allBooks: booksWeSeek, 
			user: req.session.user
		}
		res.send(SeekingBooks);
	})
})

//get wishlist '/wishlist' page
app.get('/wishlist', (req, res) => {
	Wishlist.findAll({order: 'title'})
	.then(function(result){
		const theWholeWishlist = {
			wishingThis: result, 
			user: req.session.user
		}
		res.render('wishlist', theWholeWishlist);
	})
});

//get about '/about' page
app.get('/about', (req, res) => {
	res.render('about', {user: req.session.user});
});

//get login '/login' page
app.get('/login', (req, res) => {
	res.render('login', {user: req.session.user});
});

app.post('/login', (req, res) => {
	if (req.body.username.length === 0){
		res.redirect('/login/?message=' + encodeURIComponent("Please fill out your username."))
	}
	if (req.body.password.length === 0){
		res.redirect('/login/?message=' + encodeURIComponent("Please fill out your password."))
	}

	Users.findOne({
		where: {
			username: req.body.username
		}
	}).then(function(user){
		if(req.body.password === user.password) {
			req.session.user = user;
			res.redirect('/addbooks')
		} else {
			res.redirect('/login/?message=' + encodeURIComponent("Invalid username or password."))
		}
	})
})

app.get('/addbooks', (req, res) => {
	var activeUser = req.session.user;
	// console.log('user is:' + user)
	// console.log(activeUser)
	if (activeUser === undefined) {
		res.redirect('/login/?message=' + encodeURIComponent("Please log in to add books."));
	} else {
		const sendingthis = {user: activeUser}
		// console.log(sendingthis)
		res.render('add', sendingthis);
	}
})

app.post('/addbooks', (req, res) => {
	OwnedBooks.create({
		authorfirstname: req.body.authorfirstname,
		authorlastname: req.body.authorlastname,
		title: req.body.title,
		genre: req.body.genre,
		language: req.body.language,
		lastread: req.body.lastread
	})
	.then(function(){
		res.redirect('/books')
	})
})

app.get('/book/:bookId', (req, res)=>{
	console.log('console.logging bookId')
	console.log(req.params.bookId)
	OwnedBooks.findOne({
		where: {id: req.params.bookId}
	})
	.then(function(book){
		console.log('inside the .then')
		console.log(book)
		//here it goes back to the top of the get request and fill in js.cookie and jquery file as req.params.bookId
		res.render('change', {result:book, user:req.session.user})
	})
})

app.get('/wishlist_to_books/:bookId', (req, res)=>{
	console.log('console.logging bookId')
	console.log(req.params.bookId)
	Wishlist.findOne({
		where: {id: req.params.bookId}
	})
	.then(function(book){
		console.log('inside the .then')
		console.log(book)
		res.render('transfer', {result:book, user:req.session.user})
	})
})

app.post('/wishlist', (req, res) => {
	Wishlist.create({
		title: req.body.titlewish,
		authorfirstname: req.body.authorfirstnamewish,
		authorlastname: req.body.authorlastnamewish,
		language: req.body.languagewish,
		price: req.body.pricewish
	})
	.then(function(){
		res.redirect('/wishlist')
	})
})

app.get('/logout', (req, res) => {
	req.session.destroy(function(error){
		if (error){
			throw error;
		}
		res.redirect('/');
	})
})

//server
sequelize.sync()
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Douglas",
		authorlastname: "Adams",
		title: "The ultimate hitchhiker's guide to the galaxy",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Victoria",
		authorlastname: "Aveyard",
		title: "Red queen",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Victoria",
		authorlastname: "Aveyard",
		title: "Glass sword",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Amanda",
		authorlastname: "Brookfield",
		title: "Life begins",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kiera",
		authorlastname: "Cass",
		title: "The selection",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kiera",
		authorlastname: "Cass",
		title: "The elite",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kiera",
		authorlastname: "Cass",
		title: "The one",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kiera",
		authorlastname: "Cass",
		title: "The prince and the guard",
		genre: "fantasy",
		language: "English",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kiera",
		authorlastname: "Cass",
		title: "The heir",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kiera",
		authorlastname: "Cass",
		title: "The crown",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kiera",
		authorlastname: "Cass",
		title: "The siren",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Suzanne",
		authorlastname: "Collins",
		title: "The hunger games",
		genre: "fantasy",
		language: "English",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Suzanne",
		authorlastname: "Collins",
		title: "Catching fire",
		genre: "fantasy",
		language: "English",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Suzanne",
		authorlastname: "Collins",
		title: "Mockingjay",
		genre: "fantasy",
		language: "English",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "James",
		authorlastname: "Dashner",
		title: "The maze runner",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "James",
		authorlastname: "Dashner",
		title: "The scorch trials",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "James",
		authorlastname: "Dashner",
		title: "The death cure",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "James",
		authorlastname: "Dashner",
		title: "The kill order",
		genre: "fantasy",
		language: "English",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kerstin",
		authorlastname: "Gier",
		title: "Ruby red",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kerstin",
		authorlastname: "Gier",
		title: "Sapphire blue",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kerstin",
		authorlastname: "Gier",
		title: "Emerald green",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Thomas",
		authorlastname: "Harris",
		title: "Hannibal rising",
		genre: "thriller",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Lindsey",
		authorlastname: "Kelk",
		title: "I heart New York",
		genre: "chicklit",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Sophie",
		authorlastname: "Kinsella",
		title: "Can you keep a secret?",
		genre: "chicklit",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "C.S.",
		authorlastname: "Lewis",
		title: "The chronicles of Narnia: the magician's nephew",
		genre: "fantasy/children's",
		language: "English",
		lastread: "2016"
	})
}).then(function(){
	OwnedBooks.create({
		authorfirstname: "C.S.",
		authorlastname: "Lewis",
		title: "The chronicles of Narnia: the lion, the witch and the wardrobe",
		genre: "fantasy/children's",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "C.S.",
		authorlastname: "Lewis",
		title: "The chronicles of Narnia: the horse and his boy",
		genre: "fantasy/children's",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "C.S.",
		authorlastname: "Lewis",
		title: "The chronicles of Narnia: the voyage of the Dawn Treader",
		genre: "fantasy/children's",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "C.S.",
		authorlastname: "Lewis",
		title: "The chronicles of Narnia: the silver chair",
		genre: "fantasy/children's",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "C.S.",
		authorlastname: "Lewis",
		title: "The chronicles of Narnia: prince Caspian",
		genre: "fantasy/children's",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "C.S.",
		authorlastname: "Lewis",
		title: "The chronicles of Narnia: the last battle",
		genre: "fantasy/children's",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jill",
		authorlastname: "Mansell",
		title: "Take a chance on me",
		genre: "chicklit",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "George R.R.",
		authorlastname: "Martin",
		title: "A game of thrones",
		genre: "fantasy",
		language: "English",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "George R.R.",
		authorlastname: "Martin",
		title: "A clash of kings",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "George R.R.",
		authorlastname: "Martin",
		title: "A storm of swords",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "George R.R.",
		authorlastname: "Martin",
		title: "A feast for crows",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "George R.R.",
		authorlastname: "Martin",
		title: "A dance with dragons",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Stephenie",
		authorlastname: "Meyer",
		title: "Twilight",
		genre: "fantasy",
		language: "English",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Stephenie",
		authorlastname: "Meyer",
		title: "New moon",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Camilla",
		authorlastname: "Morton",
		title: "How to walk in high heels",
		genre: "real life",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Camilla",
		authorlastname: "Morton",
		title: "A year in high heels",
		genre: "real life",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Terry",
		authorlastname: "Pratchett",
		title: "Good omens (with Neil Gaiman)",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rick",
		authorlastname: "Riordan",
		title: "Percy Jackson and the lightning thief",
		genre: "fantasy",
		language: "English",
		lastread: "Dec 2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rick",
		authorlastname: "Riordan",
		title: "Percy Jackson and the sea of monsters",
		genre: "fantasy",
		language: "English",
		lastread: "Dec 2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rick",
		authorlastname: "Riordan",
		title: "Percy Jackson and the titan's curse",
		genre: "fantasy",
		language: "English",
		lastread: "Dec 2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rick",
		authorlastname: "Riordan",
		title: "Percy Jackson and the battle of the labyrinth",
		genre: "fantasy",
		language: "English",
		lastread: "Jan 2017"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rick",
		authorlastname: "Riordan",
		title: "Percy Jackson and the last Olympian",
		genre: "fantasy",
		language: "English",
		lastread: "Jan 2017"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rick",
		authorlastname: "Riordan",
		title: "Heroes of Olympus: The lost hero",
		genre: "fantasy",
		language: "English",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rick",
		authorlastname: "Riordan",
		title: "Heroes of Olympus: The son of Neptune",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.K.",
		authorlastname: "Rowling",
		title: "The tales of Beedle the bard",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.K.",
		authorlastname: "Rowling",
		title: "Harry Potter and the Philosopher's stone",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "William",
		authorlastname: "Shakespeare",
		title: "Romeo and Juliet",
		genre: "romance",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.R.R.",
		authorlastname: "Tolkien",
		title: "The hobbit",
		genre: "fantasy",
		language: "English",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.R.R.",
		authorlastname: "Tolkien",
		title: "The lord of the rings: the fellowship of the ring",
		genre: "fantasy",
		language: "English",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.R.R.",
		authorlastname: "Tolkien",
		title: "The lord of the rings: the two towers",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.R.R.",
		authorlastname: "Tolkien",
		title: "The lord of the rings: the return of the king",
		genre: "fantasy",
		language: "English"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Isabel",
		authorlastname: "Allende",
		title: "Het huis met de geesten",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Julie",
		authorlastname: "B.",
		title: "Ik was vijftien en verslaafd",
		genre: "real life",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Tilly",
		authorlastname: "Bagshawe",
		title: "Perfect",
		genre: "romance",
		language: "Dutch",
		lastread: "2008"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Kader",
		authorlastname: "Abdolah",
		title: "De kraai",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rob",
		authorlastname: "Bakker",
		title: "De dood wandelt mee",
		genre: "thriller",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rob",
		authorlastname: "Bakker",
		title: "Het mysterie van de 100...",
		genre: "thriller",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Dan",
		authorlastname: "Brown",
		title: "Het Bernini mysterie",
		genre: "thriller",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Dan",
		authorlastname: "Brown",
		title: "De Da Vinci code",
		genre: "thriller",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Dan",
		authorlastname: "Brown",
		title: "Het Juvenalis dilemma",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Dan",
		authorlastname: "Brown",
		title: "Inferno",
		genre: "thriller",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Janelle",
		authorlastname: "Brown",
		title: "Alles wat wij wilden was alles",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Mark",
		authorlastname: "Canter",
		title: "De verborgen vallei",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Angeles",
		authorlastname: "Caso",
		title: "Tegen de wind in",
		genre: "novel",
		language: "Dutch",
		lastread: "2012"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Aiden",
		authorlastname: "Chambers",
		title: "Dit is alles",
		genre: "novel/YA",
		language: "Dutch",
		lastread: "2010"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Victoria",
		authorlastname: "Clayton",
		title: "De foute prins",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2006"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Harlan",
		authorlastname: "Coben",
		title: "Verloren",
		genre: "thriller",
		language: "Dutch",
		lastread: "Jan 2017"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Paulo",
		authorlastname: "Coelho",
		title: "Aan de oever van de Piedra huilde ik",
		genre: "novel",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Suzanne",
		authorlastname: "Collins",
		title: "De Hongerspelen",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Suzanne",
		authorlastname: "Collins",
		title: "Vlammen",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Suzanne",
		authorlastname: "Collins",
		title: "Spotgaai",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Sylvia",
		authorlastname: "Day",
		title: "Afterburn/Aftershock",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Stefan",
		authorlastname: "van Dierendonck",
		title: "En het regende brood",
		genre: "novel/real life",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jenny",
		authorlastname: "Downham",
		title: "Voor ik doodga",
		genre: "YA",
		language: "Dutch",
		lastread: "2008"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Martin Michael",
		authorlastname: "Driessen",
		title: "Vader van God",
		genre: "novel",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Sarah",
		authorlastname: "Dunant",
		title: "De geboorte van Venus",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Bies",
		authorlastname: "van Ede",
		title: "De tovenaarsleerling",
		language: "Dutch",
		lastread: "2005"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Janet",
		authorlastname: "Evanovich",
		title: "Tien met stip",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Gustave",
		authorlastname: "Flaubert",
		title: "Madame Bovary",
		genre: "novel",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Elena",
		authorlastname: "Forbes",
		title: "Onze Lieve Vrouwe van de Pijn",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jemma",
		authorlastname: "Forte",
		title: "De diva & ik",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Nicci",
		authorlastname: "French",
		title: "Verlies",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Nicci",
		authorlastname: "French",
		title: "Verloren",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorlastname: "Fynn",
		title: "Hallo meneer God... Met Anna",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Amy",
		authorlastname: "Garvey",
		title: "Moordweekend!",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rachel",
		authorlastname: "Gibson",
		title: "Undercover lover & Niet alles is liefde",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2010"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rachel",
		authorlastname: "Gibson",
		title: "Verslingerd aan jou & Weet wie je date",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2010"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rachel",
		authorlastname: "Gibson",
		title: "Ware liefde en andere rampen",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2011"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Emily",
		authorlastname: "Giffin",
		title: "Ingepikt!",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Elizabeth",
		authorlastname: "Gilbert",
		title: "Eten, bidden, beminnen",
		genre: "novel",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Ronald",
		authorlastname: "Giphart",
		title: "Gala",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Olivia",
		authorlastname: "Goldsmith",
		title: "Mr. Big",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Olivia",
		authorlastname: "Goldsmith",
		title: "Foute mannen",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "John",
		authorlastname: "Green",
		title: "Een weeffout in onze sterren",
		genre: "novel",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "John",
		authorlastname: "Grisham",
		title: "Het testament",
		genre: "detective",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "John",
		authorlastname: "Grisham",
		title: "Advocaat van de duivel",
		genre: "detective",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Hella S.",
		authorlastname: "Haasse",
		title: "Oeroeg",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Joanne",
		authorlastname: "Harris",
		title: "Chocolat",
		genre: "novel",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Alexa",
		authorlastname: "Hennig",
		title: "Kwestie van geluk",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Mary",
		authorlastname: "Hoffman",
		title: "Stravaganza, stad van maskers",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Mary",
		authorlastname: "Hoffman",
		title: "Stravaganza, stad van sterren",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Mary",
		authorlastname: "Hoffman",
		title: "Stravaganza, stad van bloemen",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Loes",
		authorlastname: "den Hollander",
		title: "Nooit alleen",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Victor",
		authorlastname: "Hugo",
		title: "De klokkenluider van Parijs",
		genre: "novel",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "John",
		authorlastname: "Irving",
		title: "De vierde hand",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "John",
		authorlastname: "Irving",
		title: "Bidden wij voor Owen Meany",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Peter",
		authorlastname: "James",
		title: "Op sterven na dood",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "E.L.",
		authorlastname: "James",
		title: "Vijftig tinten grijs",
		genre: "romance",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "E.L.",
		authorlastname: "James",
		title: "Vijftig tinten donkerder",
		genre: "romance",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "E.L.",
		authorlastname: "James",
		title: "Vijftig tinten vrij",
		genre: "romance",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "E.L.",
		authorlastname: "James",
		title: "Grey",
		genre: "romance",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Arthur",
		authorlastname: "Japin",
		title: "De overgave",
		genre: "novel",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jonas",
		authorlastname: "Jonasson",
		title: "De 100 jarige man die uit het raam klom en verdween",
		genre: "novel",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jill",
		authorlastname: "Kargman",
		title: "Momzilla's",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2010"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Cathy",
		authorlastname: "Kelly",
		title: "Iemand als jij",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Marian",
		authorlastname: "Keyes",
		title: "De vakantie van Rachel",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Stephen",
		authorlastname: "King",
		title: "De NoodZaak",
		genre: "thriller",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Stephen",
		authorlastname: "King",
		title: "Bezeten stad",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Stephen",
		authorlastname: "King",
		title: "De scherpschutter",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Stephen",
		authorlastname: "King",
		title: "Satans kinderen",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Sophie",
		authorlastname: "Kinsella",
		title: "Aanpakken",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Sophie",
		authorlastname: "Kinsella",
		title: "Shopaholic! & Shopaholic! In alle staten",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Dean",
		authorlastname: "Koontz",
		title: "Geheugen fout",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Tim",
		authorlastname: "Krabbé",
		title: "Een tafel vol vlinders",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Judith",
		authorlastname: "Kranz",
		title: "Justine",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Judith",
		authorlastname: "Kranz",
		title: "Maxime",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Alisa",
		authorlastname: "Kwitney",
		title: "Wedden van wel",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Tjeerd",
		authorlastname: "Langestraat",
		title: "Villa Gladiola",
		genre: "thriller",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Tessa",
		authorlastname: "de Loo",
		title: "De tweeling",
		genre: "war",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Valerio Massimo",
		authorlastname: "Manfredi",
		title: "Mijn naam is niemand",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jill",
		authorlastname: "Mansell",
		title: "De boot gemist",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jill",
		authorlastname: "Mansell",
		title: "Niet storen!",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jill",
		authorlastname: "Mansell",
		title: "Open huis",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jill",
		authorlastname: "Mansell",
		title: "De prins op het verkeerde paard",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jill",
		authorlastname: "Mansell",
		title: "Schot in de roos",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "K.C.",
		authorlastname: "McKinnon",
		title: "Terugkeer naar Harvest Moon",
		genre: "romance",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Stephenie",
		authorlastname: "Meyer",
		title: "Twilight",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2010"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Mariëtte",
		authorlastname: "Middelbeek",
		title: "Single & sexy",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Catherine",
		authorlastname: "Millet",
		title: "Het seksuele leven van Catherine M.",
		genre: "real life",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jacquelyn",
		authorlastname: "Mitchard",
		title: "Mijn eigen kind",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Sarah",
		authorlastname: "Mlynowski",
		title: "Single jungle",
		genre: "chicklit",
		language: "Dutch"
	})
}).then(function(){
	OwnedBooks.create({
		authorfirstname: "Erin",
		authorlastname: "Morgenstern",
		title: "Het nachtcircus",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Harry",
		authorlastname: "Mulisch",
		title: "Twee vrouwen",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Harry",
		authorlastname: "Mulisch",
		title: "De ontdekking van de hemel",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "William",
		authorlastname: "Nicholson",
		title: "Schaduwzijde",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Cees",
		authorlastname: "Nooteboom",
		title: "Rituelen",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Naomi",
		authorlastname: "Novik",
		title: "Ontworteld",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Ally",
		authorlastname: "O'Brien",
		title: "Ploeteren op pumps",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Helen",
		authorlastname: "Oxenbury",
		title: "De avonturen van Alice in Wonderlant",
		genre: "children's",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Connie",
		authorlastname: "Palmen",
		title: "De erfenis",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Adele",
		authorlastname: "Parks",
		title: "Uit en thuis",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "James",
		authorlastname: "Patterson",
		title: "Het negende oordeel",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Wilhelm",
		authorlastname: "Raabe",
		title: "Oliebol",
		language: "Dutch",
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Katy",
		authorlastname: "Regan",
		title: "Als ik auto had kunnen rijden was ik nu niet zwanger (van mijn beste vriend)",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Meg",
		authorlastname: "Rosoff",
		title: "Hoe ik nu leef",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Lydia",
		authorlastname: "Rood",
		title: "Louter lust",
		genre: "romance",
		language: "Dutch",
		lastread: "2010"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Veronica",
		authorlastname: "Roth",
		title: "Divergent 1",
		genre: "fantasy",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.K.",
		authorlastname: "Rowling",
		title: "Harry Potter en de steen der wijzen",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.K.",
		authorlastname: "Rowling",
		title: "Harry Potter en de gevangene van Azkaban",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.K.",
		authorlastname: "Rowling",
		title: "Harry Potter en de vuurbeker",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.K.",
		authorlastname: "Rowling",
		title: "Harry Potter en de orde van de feniks",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.K.",
		authorlastname: "Rowling",
		title: "Harry Potter en de halfbloed prins",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "J.K.",
		authorlastname: "Rowling",
		title: "Harry Potter en de relieken van de dood",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Els",
		authorlastname: "Ruiters",
		title: "Door dik en dun",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Liza",
		authorlastname: "van Sambeek",
		title: "Koniginnenrit",
		language: "Dutch",
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Liza",
		authorlastname: "van Sambeek",
		title: "Het verwende nest",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jan Paul",
		authorlastname: "Schutten",
		title: "De wraak van het spruitje",
		genre: "children's",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Lisa",
		authorlastname: "Scottoline",
		title: "De gespiegelde vrouw",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Darren",
		authorlastname: "Shan",
		title: "Freakshow trilogie",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Darren",
		authorlastname: "Shan",
		title: "Vampier trilogie",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Darren",
		authorlastname: "Shan",
		title: "Schemerjager trilogie",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Darren",
		authorlastname: "Shan",
		title: "Noodlot trilogie",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2015"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Karin",
		authorlastname: "Slaughter",
		title: "Trouweloos",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Karin",
		authorlastname: "Slaughter",
		title: "Triptiek",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Karin",
		authorlastname: "Slaughter",
		title: "Onaantastbaar",
		genre: "thriller",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Ali",
		authorlastname: "Smith",
		title: "Hotel Wereld",
		genre: "novel",
		language: "Dutch",
		lastread: "2016"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Lisa",
		authorlastname: "St Aubin de Terán",
		title: "De haciënda",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Sophie",
		authorlastname: "van der Stap",
		title: "Meisje met de negen pruiken",
		genre: "real life",
		language: "Dutch",
		lastread: "2012"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Sophie",
		authorlastname: "van der Stap",
		title: "Een blauwe vlinder zegt gedag",
		genre: "real life",
		language: "Dutch",
		lastread: "2012"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Bram",
		authorlastname: "Stoker",
		title: "Dracula",
		genre: "fantasy",
		language: "Dutch",
		lastread: "2010"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Patrick",
		authorlastname: "Süskind",
		title: "Het parfum",
		genre: "thriller",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Danielle",
		authorlastname: "Steel",
		title: "Boze opzet",
		genre: "romance",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Danielle",
		authorlastname: "Steel",
		title: "Het geluk tegemoet",
		genre: "romance",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Donna",
		authorlastname: "Tartt",
		title: "De verborgen geschiedenis",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Edward",
		authorlastname: "van de Vendel",
		title: "De dagen van de bluegrassliefde",
		genre: "YA",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Edward",
		authorlastname: "van de Vendel",
		title: "Ons derde lichaam",
		genre: "YA",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Simone",
		authorlastname: "van der Vlucht",
		title: "Schaduwzuster",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Barbara",
		authorlastname: "Voors",
		title: "Zusje van me",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Robert",
		authorlastname: "Vuijsje",
		title: "Alleen maar nette mensen",
		genre: "novel",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Nicole",
		authorlastname: "Wallace",
		title: "Mrs. President",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2013"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Minette",
		authorlastname: "Walters",
		title: "De tondeldoos",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Jennifer",
		authorlastname: "Weiner",
		title: "Goed in bed",
		genre: "chicklit",
		language: "Dutch",
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Lauren",
		authorlastname: "Weisberger",
		title: "Chanel Chic",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Lauren",
		authorlastname: "Weisberger",
		title: "De duivel draagt Prada",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2011"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Lauren",
		authorlastname: "Weisberger",
		title: "Gossip & Gucci",
		genre: "chicklit",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Hans",
		authorlastname: "Werkman",
		title: "Een dagje naar huis",
		language: "Dutch"
	})
})
.then(function(){
	OwnedBooks.create({
		authorfirstname: "Rosie",
		authorlastname: "Wilde",
		title: "Het leven is te kort om cakejes te glazuren",
		genre: "chicklit",
		language: "Dutch",
		lastread: "2014"
	})
})
.then(function(){
	User.create({
		username: "PrinsesLisa",
		email: "lisa.maagdenberg92@gmail.com",
		password: "notsafe"
	})
})
	.then(function(){
		app.listen(process.env.PORT || 8000, () => {
			console.log('server has started at port ' + process.env.PORT || 8000);
		});
	})
