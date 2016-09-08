var _pogorelov = {};
var animationPrefix = (function () {
	var t,
	el = document.createElement("fakeelement");
	var transitions = {
		"WebkitTransition": "webkitAnimationEnd",
		"OTransition": "oAnimationEnd",
		"MozTransition": "animationend",
		"transition": "animationend"
	};
	for (t in transitions) {
		if (el.style[t] !== undefined) {
			return transitions[t];
		}
	}
})(),
transitionPrefix = (function () {
	var t,
	el = document.createElement("fakeelement");
	var transitions = {
		"WebkitTransition": "webkitTransitionEnd",
		"transition": "transitionend",
		"OTransition": "oTransitionEnd",
		"MozTransition": "transitionend"
	};
	for (t in transitions) {
		if (el.style[t] !== undefined) {
			return transitions[t];
		}
	}
})(),
requestAnimFrame = window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame    ||
window.oRequestAnimationFrame      ||
window.msRequestAnimationFrame     ||
function( callback ){
	window.setTimeout( callback, 17 );
},
bodyOverflow = (function () {
	var $body = $('body');
	return {
		fixBody: function () {
			$body
				.addClass('fixed');
		},
		unfixBody: function () {
			$body
				.removeClass('fixed');
		},
		resize: function () {
			this.unfixBody();
		}.bind(this)
	};
})(),
goUp = (function () {
	var $el = $('#to-top'),
		state = false,
		speed = 900,
		paused = false,
		plg = {
			up: function () {
				paused = true;
				state = true;

				$("html, body").stop().animate({scrollTop:0}, speed, 'swing', function () {
					paused = false;
				}).one('touchstart mousewheel DOMMouseScroll wheel', function () {
					$(this).stop(false, false).off('touchstart mousewheel DOMMouseScroll wheel');
					paused = false;
				});
				plg.hide();
			},
			show: function () {
				if (!state && !paused) {
					$el.addClass('opened');
					state = true;
				}
			},
			hide: function () {
				if (state) {
					$el.removeClass('opened');
					state = false;
				}

			},
			$el: $el
		};

	if ($el.length) {
		$el.on('click', function () {
			plg.up();
		});
	} else {
		$(window).on('load', function () {
			$el.on('click', function () {
				plg.up();
			});
		});
	}


	return plg;
})();

// shuffle array
Array.prototype.shuffle = function() {
	for (var i = this.length - 1; i > 0; i--) {
		var num = Math.floor(Math.random() * (i + 1)),
			d = this[num];
		this[num] = this[i];
		this[i] = d;
	}
	return this;
};

(function ($) {
	// jQuery plugins here
})(jQuery);
