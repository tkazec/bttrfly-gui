Social mass texting. https://npmjs.org/package/bttrfly

---

	$ npm install -g bttrfly
	
	$ bttrfly --help
	
	  Usage: bttrfly [options]

	  Options:

	    -h, --help            output usage information
	    -V, --version         output the version number
	    -u, --user <txt>      Google Voice email address.
	    -p, --pass <txt>      Google Voice password.
	    -t, --tokens <obj>    JSON object of Google Voice auth tokens.
	    -c, --contacts <arr>  JSON array of objects of contacts to text.
	    -m, --message <str>   JSON string message to text.
	    -d, --dry             Log texts instead of sending them.

	    Pipe JSON to populate any of the properties. Options take precedence.

	  Properties:

	    user: Email address you log in to Google Voice with.
	    pass: Password you log in to Google Voice with.
	          If 2-step verification is on, use an application-specific password.
	    tokens: Optional Google Voice auth tokens. Logged after texts are sent.
	    contacts: List of contacts. Meaningful keys: phone, skip.
	    message: Text to send. #{keys} are replaced with data from contacts.

	  Examples:

	    $ bttrfly -u foo@bar.com -p foobar -c '[...]' -m '"Hello world!"'
	    $ cat contacts.json | bttrfly -p foobar -m '"Hey #{fname}! Sup?"'

	  API: require("bttrfly")(options, onsend(error, contact), ondone(tokens));

	  Warning: Use at your own risk. ;)

---

© 2013 [Teddy Cross](http://tkaz.ec), shared under the [MIT License](http://www.opensource.org/licenses/MIT).