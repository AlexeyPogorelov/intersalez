var express = require('express');
var router = express.Router();
var sg = require('sendgrid')('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');

router.post('/', function(req, res, next) {
	// console.log(req.body.from);
	// console.log(req.body.email);
	// console.log('---------------');
	res.json({
		from: req.body.from,
		to: req.body.email,
		subject: req.body.subject,
		htmlBody: decodeURIComponent(req.body.text),
		ok: true
	});
	return;
	sg.API(sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: {
			personalizations: [
				{
					to: [
						{
							email: req.body.email,
						},
					],
					subject: req.body.subject,
				}
			],
			from: {
				email: req.body.from,
			},
			content: [
				{
					type: 'text/html',
					value: decodeURIComponent(req.body.text),
				}
			]
		}
	}), function(error, response) {
		if (error) {
			console.log('Error response received');
		}
		console.log(response.statusCode);
		// console.log(response.body);
		// console.log(response.headers);
	});
});

module.exports = router;
