function BasicCarousel(frame, options) {

	  if (!frame){
	    return null;
	  }
		var _this = this;

		this.options = options || {};
		this.index = this.options.startSlide || 0;
		this.itemsShowing = this.options.itemsShowing || 1;

		this.before = this.options.before || function() {};
        this.callback = this.options.callback || function() {};

		this.frame = frame;
		this.track = frame.children[0];
		this.itemWrapper = this.track.children[0];

		this.track.addEventListener('scroll', this, false);
		window.addEventListener('resize', this, false);

		this.animating = false;
		this.prevIndex = this.index;

		this.setup();
}
BasicCarousel.prototype = {

	setup: function() {

		this.items = this.itemWrapper.children;
		this.length = this.items.length;

		if (this.length < 2){ return null; }

		this.containerWidth = this.frame.getBoundingClientRect().width || this.frame.offsetWidth;

		this.width = Math.ceil(this.containerWidth / this.itemsShowing);

		if (!this.width){ return null; }
		this.itemWrapper.style.width = (this.length * this.width) + "px";

		for(var i = 0; i < this.length; i++){
			var el = this.items[i];
			el.style.width = this.width + 'px';
		}

		this.track.style.overflowX = 'scroll';
		this.track.scrollLeft = this.index * this.width;

	},
	handleEvent: function(e) {
		switch (e.type) {
			case 'scroll': this.scroll(e); break;
			case 'resize': this.setup(); break;
		}
	},
	scroll: function(e){
		clearTimeout(this.scrollTimer);
		var _this = this;

		this.prevIndex = this.index;

		var currentPos = e.target.scrollLeft;
		this.index = Math.round(currentPos / _this.width);

		if(this.index != this.prevIndex && this.animating == false){
			this.before(this.prevIndex, this.index);
			this.callback(_this.index);
		}

		this.scrollTimer = setTimeout(function(){
			var currentPos = e.target.scrollLeft;
			_this.targetPos = _this.index * _this.width;
			_this.slide();
		}, 500);


	},
	slide: function() {

		var _this = this;
		var target = this.targetPos;

		var timer = setTimeout(function(){

			this.animating = true;

			var increment = 0.5;
			var currentPos = _this.track.scrollLeft;
			var difference = target - currentPos;
			_this.track.scrollLeft += Math.floor( difference * increment );

			if ( Math.abs( Math.floor( target - _this.track.scrollLeft ) ) > 2 ) {
				_this.slide();
			} else {
				_this.track.scrollLeft = target;
 				clearTimeout(timer);
				_this.callback(_this.index);
				this.animating = false;
			}

		}, 16);

	},
	prev : function() {

		if(this.index) {
			this.prevIndex = this.index;
			this.index -= 1;

			this.before(this.prevIndex, this.index);

			this.targetPos = this.index * this.width;
			this.slide();
		}

	},
	next : function() {

		if (this.index < this.length - this.itemsShowing) {
			this.prevIndex = this.index;
			this.index += 1;

			this.before(this.prevIndex, this.index);

			this.targetPos = this.index * this.width;
			this.slide();
		}

	}
};

/*
* $ lightbox_me
* By: Buck Wilson
* Version : 2.3
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


(function($) {

    $.fn.lightbox_me = function(options) {

        return this.each(function() {

            var
                opts = $.extend({}, $.fn.lightbox_me.defaults, options),
                $overlay = $(),
                $self = $(this),
                $iframe = $('<iframe id="foo" style="z-index: ' + (opts.zIndex + 1) + ';border: none; margin: 0; padding: 0; position: absolute; width: 100%; height: 100%; top: 0; left: 0; filter: mask();"/>'),
                ie6 = ($.browser.msie && $.browser.version < 7);

            if (opts.showOverlay) {
                //check if there's an existing overlay, if so, make subequent ones clear
               var $currentOverlays = $(".js_lb_overlay:visible");
                if ($currentOverlays.length > 0){
                    $overlay = $('<div class="lb_overlay_clear js_lb_overlay"/>');
                } else {
                    $overlay = $('<div class="' + opts.classPrefix + '_overlay js_lb_overlay"/>');
                }
            }

            /*----------------------------------------------------
               DOM Building
            ---------------------------------------------------- */
            if (ie6) {
                var src = /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank';
                $iframe.attr('src', src);
                $('body').append($iframe);
            } // iframe shim for ie6, to hide select elements
            $('body').append($self.hide()).append($overlay);


            /*----------------------------------------------------
               Overlay CSS stuffs
            ---------------------------------------------------- */

            // set css of the overlay
            if (opts.showOverlay) {
                setOverlayHeight(); // pulled this into a function because it is called on window resize.
                $overlay.css({ position: 'absolute', width: '100%', top: 0, left: 0, right: 0, bottom: 0, zIndex: (opts.zIndex + 2), display: 'none' });
				if (!$overlay.hasClass('lb_overlay_clear')){
                	$overlay.css(opts.overlayCSS);
                }
            }

            /*----------------------------------------------------
               Animate it in.
            ---------------------------------------------------- */
               //
            if (opts.showOverlay) {
                $overlay.fadeIn(opts.overlaySpeed, function() {
                    setSelfPosition();
                    $self[opts.appearEffect](opts.lightboxSpeed, function() { setOverlayHeight(); setSelfPosition(); opts.onLoad()});
                });
            } else {
                setSelfPosition();
                $self[opts.appearEffect](opts.lightboxSpeed, function() { opts.onLoad()});
            }

            /*----------------------------------------------------
               Hide parent if parent specified (parentLightbox should be jquery reference to any parent lightbox)
            ---------------------------------------------------- */
            if (opts.parentLightbox) {
                opts.parentLightbox.fadeOut(200);
            }


            /*----------------------------------------------------
               Bind Events
            ---------------------------------------------------- */

            $(window).resize(setOverlayHeight)
                     .resize(setSelfPosition)
                     .scroll(setSelfPosition);
                     
            $(window).bind('keyup.lightbox_me', observeKeyPress);
                     
            if (opts.closeClick) {
                $overlay.click(function(e) { closeLightbox(); e.preventDefault; });
            }
            $self.delegate(opts.closeSelector, "click", function(e) {
                closeLightbox(); e.preventDefault();
            });
            $self.bind('close', closeLightbox);
            $self.bind('reposition', setSelfPosition);

            

            /*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
              -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */


            /*----------------------------------------------------
               Private Functions
            ---------------------------------------------------- */

            /* Remove or hide all elements */
            function closeLightbox() {
                var s = $self[0].style;
                if (opts.destroyOnClose) {
                    $self.add($overlay).remove();
                } else {
                    $self.add($overlay).hide();
                }

                //show the hidden parent lightbox
                if (opts.parentLightbox) {
                    opts.parentLightbox.fadeIn(200);
                }

                $iframe.remove();
                
				// clean up events.
                $self.undelegate(opts.closeSelector, "click");

                $(window).unbind('reposition', setOverlayHeight);
                $(window).unbind('reposition', setSelfPosition);
                $(window).unbind('scroll', setSelfPosition);
                $(window).unbind('keyup.lightbox_me');
                if (ie6)
                    s.removeExpression('top');
                opts.onClose();
            }


            /* Function to bind to the window to observe the escape/enter key press */
            function observeKeyPress(e) {
                if((e.keyCode == 27 || (e.DOM_VK_ESCAPE == 27 && e.which==0)) && opts.closeEsc) closeLightbox();
            }


            /* Set the height of the overlay
                    : if the document height is taller than the window, then set the overlay height to the document height.
                    : otherwise, just set overlay height: 100%
            */
            function setOverlayHeight() {
                if ($(window).height() < $(document).height()) {
                    $overlay.css({height: $(document).height() + 'px'});
                     $iframe.css({height: $(document).height() + 'px'}); 
                } else {
                    $overlay.css({height: '100%'});
                    if (ie6) {
                        $('html,body').css('height','100%');
                        $iframe.css('height', '100%');
                    } // ie6 hack for height: 100%; TODO: handle this in IE7
                }
            }


            /* Set the position of the modal'd window ($self)
                    : if $self is taller than the window, then make it absolutely positioned
                    : otherwise fixed
            */
            function setSelfPosition() {
                var s = $self[0].style;

                // reset CSS so width is re-calculated for margin-left CSS
                $self.css({left: '50%', marginLeft: ($self.outerWidth() / 2) * -1,  zIndex: (opts.zIndex + 3) });


                /* we have to get a little fancy when dealing with height, because lightbox_me
                    is just so fancy.
                 */

                // if the height of $self is bigger than the window and self isn't already position absolute
                if (($self.height() + 80  >= $(window).height()) && ($self.css('position') != 'absolute' || ie6)) {

                    // we are going to make it positioned where the user can see it, but they can still scroll
                    // so the top offset is based on the user's scroll position.
                    var topOffset = $(document).scrollTop() + 40;
                    $self.css({position: 'absolute', top: topOffset + 'px', marginTop: 0})
                    if (ie6) {
                        s.removeExpression('top');
                    }
                } else if ($self.height()+ 80  < $(window).height()) {
                    //if the height is less than the window height, then we're gonna make this thing position: fixed.
                    // in ie6 we're gonna fake it.
                    if (ie6) {
                        s.position = 'absolute';
                        if (opts.centered) {
                            s.setExpression('top', '(document.documentElement.clientHeight || document.body.clientHeight) / 2 - (this.offsetHeight / 2) + (blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"')
                            s.marginTop = 0;
                        } else {
                            var top = (opts.modalCSS && opts.modalCSS.top) ? parseInt(opts.modalCSS.top) : 0;
                            s.setExpression('top', '((blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + '+top+') + "px"')
                        }
                    } else {
                        if (opts.centered) {
                            $self.css({ position: 'fixed', top: '50%', marginTop: ($self.outerHeight() / 2) * -1})
                        } else {
                            $self.css({ position: 'fixed'}).css(opts.modalCSS);
                        }

                    }
                }
            }

        });



    };

    $.fn.lightbox_me.defaults = {

        // animation
        appearEffect: "fadeIn",
        appearEase: "",
        overlaySpeed: 250,
        lightboxSpeed: 300,

        // close
        closeSelector: ".close",
        closeClick: true,
        closeEsc: true,

        // behavior
        destroyOnClose: true,
        showOverlay: true,
        parentLightbox: false,

        // callbacks
        onLoad: function() {},
        onClose: function() {},

        // style
        classPrefix: 'lb',
        zIndex: 999,
        centered: false,
        modalCSS: {top: '40px'},
        overlayCSS: {background: 'black', opacity: .3}
    }
})(jQuery);

(function(c,n){var l="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";c.fn.imagesLoaded=function(f){function m(){var b=c(i),a=c(h);d&&(h.length?d.reject(e,b,a):d.resolve(e));c.isFunction(f)&&f.call(g,e,b,a)}function j(b,a){b.src===l||-1!==c.inArray(b,k)||(k.push(b),a?h.push(b):i.push(b),c.data(b,"imagesLoaded",{isBroken:a,src:b.src}),o&&d.notifyWith(c(b),[a,e,c(i),c(h)]),e.length===k.length&&(setTimeout(m),e.unbind(".imagesLoaded")))}var g=this,d=c.isFunction(c.Deferred)?c.Deferred():
0,o=c.isFunction(d.notify),e=g.find("img").add(g.filter("img")),k=[],i=[],h=[];c.isPlainObject(f)&&c.each(f,function(b,a){if("callback"===b)f=a;else if(d)d[b](a)});e.length?e.bind("load.imagesLoaded error.imagesLoaded",function(b){j(b.target,"error"===b.type)}).each(function(b,a){var d=a.src,e=c.data(a,"imagesLoaded");if(e&&e.src===d)j(a,e.isBroken);else if(a.complete&&a.naturalWidth!==n)j(a,0===a.naturalWidth||0===a.naturalHeight);else if(a.readyState||a.complete)a.src=l,a.src=d}):m();return d?d.promise(g):
g}})(jQuery);

dragDrop = {
	initialMouseX: undefined,
	initialMouseY: undefined,
	startX: undefined,
	startY: undefined,
	draggedObject: undefined,
	bounds: undefined,

	initElement: function (element, bounds) {
		dragDrop.bounds = bounds;
		element[0].onmousedown = dragDrop.startDragMouse;
	},
	startDragMouse: function (e) {
		dragDrop.startDrag(this);
		var evt = e || window.event;
		dragDrop.initialMouseX = evt.clientX;
		dragDrop.initialMouseY = evt.clientY;
		addEventSimple(document,'mousemove',dragDrop.dragMouse);
		addEventSimple(document,'mouseup',dragDrop.releaseElement);
		return false;
	},
	startDrag: function (obj) {
		if (dragDrop.draggedObject)
			dragDrop.releaseElement();
		dragDrop.startX = obj.offsetLeft;
		dragDrop.startY = obj.offsetTop;
		dragDrop.draggedObject = obj;
		obj.className += ' dragged';
	},
	dragMouse: function (e) {
		var evt = e || window.event;
		var dX = evt.clientX - dragDrop.initialMouseX;
		var dY = evt.clientY - dragDrop.initialMouseY;
		dragDrop.setPosition(dX,dY);
		return false;
	},
	setPosition: function (dx,dy) {

		var w = parseInt(dragDrop.draggedObject.style.width),
			h = parseInt(dragDrop.draggedObject.style.height),
			centerX = dragDrop.bounds.width() / 2,
			centerY = dragDrop.bounds.height() / 2;

		var xMax = centerX;
		var xMin = centerX - w;

		var yMax = centerY;
		var yMin = centerY - h;

		if(dragDrop.startX + dx < xMax && dragDrop.startX + dx > xMin) {
			dragDrop.draggedObject.style.left = dragDrop.startX + dx + 'px';
		}
		if(dragDrop.startY + dy < yMax && dragDrop.startY + dy > yMin) {
			dragDrop.draggedObject.style.top = dragDrop.startY + dy + 'px';
		}

	},
	releaseElement: function() {
		removeEventSimple(document,'mousemove',dragDrop.dragMouse);
		removeEventSimple(document,'mouseup',dragDrop.releaseElement);
		dragDrop.draggedObject.className = dragDrop.draggedObject.className.replace(/dragged/,'');
		dragDrop.draggedObject = null;
	}
}

function addEventSimple(obj,evt,fn) {
	if (obj.addEventListener)
		obj.addEventListener(evt,fn,false);
	else if (obj.attachEvent)
		obj.attachEvent('on'+evt,fn);
}

function removeEventSimple(obj,evt,fn) {
	if (obj.removeEventListener)
		obj.removeEventListener(evt,fn,false);
	else if (obj.detachEvent)
		obj.detachEvent('on'+evt,fn);
}



function zoomView(bounds, image){

	$('body').css('overflow', 'hidden');

	var target = $('.enlargeWrap')[0];

	var zoom = 0.85,
	minZoom = 0.5,
	maxZoom = 1.25,
	photoW,photoH,frameW,frameH,width,height,left,top,bShowControls;

	var preload = new Image();
    preload.src = image.attr('src');

	image.css('opacity', '0');

    preload.onload = function(){

		image.css('opacity', '');

		photoW = preload.naturalWidth;
		photoH = preload.naturalHeight;
		frameW = $(window).width();
		frameH = $(window).height();

		if(photoW > frameW || photoH > frameH) {

			bShowControls = true;
			width = photoW * zoom;
			height = photoH * zoom;

		} else {

			bShowControls = false;
			width = photoW;
			height = photoH;
			$('.enlargeZoomIn').css('display', 'none');
			$('.enlargeZoomOut').css('display', 'none');

		}

		left = ( frameW / 2 ) - ( width / 2 );

		if(height > frameH) {
			top = -( height / 18);
		} else {
			top = ( frameH / 2 ) - ( height / 2);
		}

		image.css({
			'width' : width + "px",
			'height' : height + "px",
			'left' : left + "px",
			'top' : top + "px",
		});

		dragDrop.initElement(image, $(window));

    }

	var increase;
	$('.enlargeZoomIn').on('mousedown', function(e){
		increase = setInterval(addZoom, 1000/60);
	}).on('mouseup', function(){
		clearInterval(increase);
	});
	$('.enlargeZoomIn').on('mouseleave', function(){
		clearInterval(increase);
	});

	var decrease;
	$('.enlargeZoomOut').on('mousedown', function(){
		decrease = setInterval(subZoom, 1000/60);
	}).on('mouseup', function(){
		clearInterval(decrease);
	});
	$('.enlargeZoomOut').on('mouseleave', function(){
		clearInterval(decrease);
	});
	function addZoom(){
		if(zoom >= maxZoom) {
			zoom = maxZoom;
		} else {
			zoom += 0.025;
			updateImage(zoom);
		}
	}
	function subZoom(){
		if(zoom <= minZoom) {
			zoom = minZoom;
		} else {
			zoom -= 0.025;
			updateImage(zoom);
		}
	}
	
	
	image.on('mousedown',function(){
    image.addClass('grabbing');
	}).on('mouseup', function(){
	  image.removeClass('grabbing');
	});
	

	function updateControls(s){
		if(s < minZoom + 0.05) {
			$('.enlargeZoomOut').addClass('disabled')
		} else {
			$('.enlargeZoomOut').removeClass('disabled')
		}
		if(s > maxZoom - 0.05) {
			$('.enlargeZoomIn').addClass('disabled')
		} else {
			$('.enlargeZoomIn').removeClass('disabled')
		}
	}

	function updateImage(scale){
		updateControls(scale);
		var centerX = frameW / 2,
			offsetX = parseInt(image.css('left')),
			pctX = ( centerX - offsetX ) / width,
			centerY = frameH / 2,
			offsetY = parseInt(image.css('top')),
			pctY = ( centerY- offsetY ) / height;

		var diffX = ( ( photoW * scale ) - width ) * pctX;
		var diffY = ( ( photoH * scale ) - height ) * pctY;

		top = offsetY - diffY;
		left = offsetX - diffX;

		width = photoW * scale;
		height = photoH * scale;

		image.css({
			'width' : width + "px",
			'height' : height + "px",
			'left' : left + "px",
			'top' : top + "px"
		});
	}

	function MouseScroll (e) {
		var scrollTimer;
		e.preventDefault();
        if ('wheelDelta' in e) {
			clearTimeout(scrollTimer);

			if(e.wheelDeltaY === undefined) { //ie
				zoom += (e.wheelDelta * 0.001);
			} else {
				zoom += (e.wheelDeltaY * 0.001);
			}

			if(zoom > minZoom && zoom < maxZoom) {
				if(e.wheelDeltaY * 0.001 > 0) {

					$('.enlargeZoomOut').removeClass('active');
					$('.enlargeZoomIn').addClass('active');
				}
				if(e.wheelDeltaY * 0.001 < 0) {

					$('.enlargeZoomIn').removeClass('active');
					$('.enlargeZoomOut').addClass('active');
				}
				updateImage(zoom);
			}
			updateControls(zoom);
			if(zoom < minZoom) {
				zoom = minZoom;
			}
			if(zoom > maxZoom) {
				zoom = maxZoom;
			}
			scrollTimer = setTimeout(function(){
				$('.enlargeZoomOut').removeClass('active');
				$('.enlargeZoomIn').removeClass('active');
			}, 500);
        } else {  // Firefox
			clearTimeout(scrollTimer);
			zoom += (e.detail * -0.005);
			if(zoom > minZoom && zoom < maxZoom) {
				if(e.detail * 0.005 > 0) {
					$('.enlargeZoomOut').removeClass('active');
					$('.enlargeZoomIn').addClass('active');
				}
				if(e.detail * 0.005 < 0) {
					$('.enlargeZoomIn').removeClass('active');
					$('.enlargeZoomOut').addClass('active');
				}
				updateImage(zoom)
			}
			updateControls(zoom);
			if(zoom < minZoom) {
				zoom = minZoom;
			}
			if(zoom > maxZoom) {
				zoom = maxZoom;
			}
			scrollTimer = setTimeout(function(){
				$('.enlargeZoomOut').removeClass('active');
				$('.enlargeZoomIn').removeClass('active');
			}, 500);
        }
		return false;
    }
    function initScroll (elem) {
        if (elem[0].addEventListener) {    // all browsers except IE before version 9
                // Internet Explorer, Opera, Google Chrome and Safari
            elem[0].addEventListener ("mousewheel", MouseScroll, false);
                // Firefox
            elem[0].addEventListener ("DOMMouseScroll", MouseScroll, false);
        } else {
            if (elem[0].attachEvent) { // IE before version 9
                elem[0].attachEvent ("onmousewheel", MouseScroll);
            }
        }
    }

    // $('.lightboxClose').on('click', function(){
    //  $('body').attr('style', '');
    // });
}
	