(function ($) {

  /**
   * Augment jQuery prototype.
   * 
   * @param {type} options
   * @returns
   */
  $.fn.antiscroll = function (options) {
    return this.each(function () {
      var wrapperElement = this;
      var $wrapperElement = $(wrapperElement);

      // Apply OS X like scrollbars only on Windows
      if (options.onlyWindows && (navigator.platform.substr(0, 3) !== 'Win')) {
        return;
      }

      if (options.autoWrap) {
        // Switch elements because wrapper element is inner element
        $wrapperElement.parent().addClass('antiscroll-wrap');
        $wrapperElement.addClass('antiscroll-inner');
        $wrapperElement = $wrapperElement.parent();
        wrapperElement = $wrapperElement.get();
      }

      if ($wrapperElement.data('antiscroll')) {
        $wrapperElement.data('antiscroll').destroy();
      }

      $wrapperElement.data('antiscroll', new $.Antiscroll(wrapperElement, options));
    });
  };

  /**
   * Expose constructor.
   */
  $.Antiscroll = Antiscroll;

  /**
   * Antiscroll pane constructor.
   * 
   * @param {Element|jQuery} el main pane
   * @param {Object} opts options
   * @returns {antiscroll-2_L1.Antiscroll}
   */
  function Antiscroll(el, opts) {
    this.el = $(el);
    this.options = opts || {};

    this.x = (false !== this.options.x) || this.options.forceHorizontal;
    this.y = (false !== this.options.y) || this.options.forceVertical;
    this.autoHide = false !== this.options.autoHide;
    // Reads "0" as an argument
    this.marginTop = undefined === this.options.marginTop ? 2 : this.options.marginTop;
    this.padding = undefined === this.options.padding ? 2 : this.options.padding;

    this.inner = this.el.find('.antiscroll-inner');
    this.inner.css({
      width: '+=' + (this.y ? scrollbarSize() : 0),
      height: '+=' + (this.x ? scrollbarSize() : 0)
    });

    this.refresh();
  }

  /**
   * Refresh scrollbars
   *
   * @api public
   */
  Antiscroll.prototype.refresh = function () {
    var needHScroll = this.inner.get(0).scrollWidth > this.el.width() + (this.y ? scrollbarSize() : 0);
    var needVScroll = this.inner.get(0).scrollHeight > this.el.height() + (this.x ? scrollbarSize() : 0);

    if (this.x) {
      if (!this.horizontal && needHScroll) {
        this.horizontal = new Scrollbar.Horizontal(this);
      } else if (this.horizontal && !needHScroll) {
        this.horizontal.destroy();
        this.horizontal = null;
      } else if (this.horizontal) {
        this.horizontal.update();
      }
    }

    if (this.y) {
      if (!this.vertical && needVScroll) {
        this.vertical = new Scrollbar.Vertical(this);
      } else if (this.vertical && !needVScroll) {
        this.vertical.destroy();
        this.vertical = null;
      } else if (this.vertical) {
        this.vertical.update();
      }
    }

    return 'Scrollbars have been refreshed.';
  };

  /**
   * Cleans up.
   *
   * @return {Antiscroll} for chaining
   */
  Antiscroll.prototype.destroy = function () {
    if (this.horizontal) {
      this.horizontal.destroy();
      this.horizontal = null;
    }
    if (this.vertical) {
      this.vertical.destroy();
      this.vertical = null;
    }
    return this;
  };

  /**
   * Rebuild Antiscroll.
   * @param {Object} newOptions options
   * @return {Antiscroll} for chaining
   */
  Antiscroll.prototype.rebuild = function (newOptions) {
    if (this.options.debug) {
      console.debug('Rebuild');
    }

    var options = $.extend({}, this.options, newOptions);

    if (options.debug) {
      console.debug('Options:');
      console.debug(JSON.stringify(options));
    }

    this.destroy();
    this.inner.attr('style', '');
    Antiscroll.call(this, this.el, options);
    return this;
  };

  /**
   * Scrollbar constructor.
   * 
   * @param {Element|jQuery} pane element
   * @returns {antiscroll-2_L1.Scrollbar}
   */
  function Scrollbar(pane) {
    this.pane = pane;
    this.pane.el.append(this.el);
    this.innerEl = this.pane.inner.get(0);

    this.dragging = false;
    this.enter = false;
    this.shown = false;

    // hovering
    this.pane.el.mouseenter($.proxy(this, 'mouseenter'));
    this.pane.el.mouseleave($.proxy(this, 'mouseleave'));

    // dragging
    this.el.mousedown($.proxy(this, 'mousedown'));

    // scrolling
    this.innerPaneScrollListener = $.proxy(this, 'scroll');
    this.pane.inner.scroll(this.innerPaneScrollListener);

    // wheel -optional-
    this.innerPaneMouseWheelListener = $.proxy(this, 'mousewheel');
    this.pane.inner.bind('mousewheel', this.innerPaneMouseWheelListener);

    // show
    var initialDisplay = this.pane.options.initialDisplay;

    if (initialDisplay !== false) {
      this.show();
      if (this.pane.autoHide) {
        this.hiding = setTimeout($.proxy(this, 'hide'), parseInt(initialDisplay, 10) || 3000);
      }
    }
  }

  /**
   * Cleans up.
   *
   * @return {Scrollbar} for chaining
   * @api public
   */
  Scrollbar.prototype.destroy = function () {
    this.el.remove();
    this.pane.inner.unbind('scroll', this.innerPaneScrollListener);
    this.pane.inner.unbind('mousewheel', this.innerPaneMouseWheelListener);
    return this;
  };

  /**
   * Called upon mouseenter.
   *
   * @api private
   */
  Scrollbar.prototype.mouseenter = function () {
    this.enter = true;
    this.show();
  };

  /**
   * Called upon mouseleave.
   *
   * @api private
   */
  Scrollbar.prototype.mouseleave = function () {
    this.enter = false;

    if (!this.dragging) {
      if (this.pane.autoHide) {
        this.hide();
      }
    }
  };

  /**
   * Called upon wrap scroll.
   *
   * @api private
   */
  Scrollbar.prototype.scroll = function () {
    if (!this.shown) {
      this.show();
      if (!this.enter && !this.dragging) {
        if (this.pane.autoHide) {
          this.hiding = setTimeout($.proxy(this, 'hide'), 1500);
        }
      }
    }

    this.update();
  };

  /**
   * Called upon scrollbar mousedown.
   * 
   * @param {type} ev
   * @returns {undefined}
   */
  Scrollbar.prototype.mousedown = function (ev) {
    ev.preventDefault();

    this.dragging = true;

    this.startPageY = ev.pageY - parseInt(this.el.css('top'), 10);
    this.startPageX = ev.pageX - parseInt(this.el.css('left'), 10);

    // prevent crazy selections on IE
    this.el[0].ownerDocument.onselectstart = function () {
      return false;
    };

    // make scrollbar draggable
    var move = $.proxy(this, 'mousemove');
    var self = this;

    $(this.el[0].ownerDocument)
            .mousemove(move)
            .mouseup(function () {
              self.dragging = false;
              this.onselectstart = null;

              $(this).unbind('mousemove', move);

              if (!self.enter) {
                self.hide();
              }
            });
  };

  /**
   * Show scrollbar.
   * 
   * @returns {undefined}
   */
  Scrollbar.prototype.show = function () {
    if (!this.shown && this.update()) {
      this.el.addClass('antiscroll-scrollbar-shown');
      if (this.hiding) {
        clearTimeout(this.hiding);
        this.hiding = null;
      }
      this.shown = true;
    }
  };

  /**
   * Hide scrollbar.
   *
   * @api private
   */
  Scrollbar.prototype.hide = function () {
    if (this.pane.autoHide !== false && this.shown) {
      // check for dragging
      this.el.removeClass('antiscroll-scrollbar-shown');
      this.shown = false;
    }
  };

  /**
   * Horizontal scrollbar constructor
   * 
   * @param {type} pane
   * @returns {antiscroll-2_L1.Scrollbar.Horizontal}
   */
  Scrollbar.Horizontal = function (pane) {
    this.el = $('<div class="antiscroll-scrollbar antiscroll-scrollbar-horizontal"/>', pane.el);
    Scrollbar.call(this, pane);
  };

  /**
   * Inherits from Scrollbar.
   */
  inherits(Scrollbar.Horizontal, Scrollbar);

  /**
   * Updates size/position of scrollbar.
   * 
   * @returns {Boolean}
   */
  Scrollbar.Horizontal.prototype.update = function () {
    if (this.pane.options.debug) {
      console.debug('Scrollbar.Horizontal | Padding is: ' + this.pane.padding);
    }

    var paneWidth = this.pane.el.width();
    var trackWidth = paneWidth - this.pane.padding * 2;
    var innerEl = this.pane.inner.get(0);

    this.el.css({
      width: trackWidth * paneWidth / innerEl.scrollWidth,
      left: trackWidth * innerEl.scrollLeft / innerEl.scrollWidth
    });

    return paneWidth < innerEl.scrollWidth;
  };

  /**
   * Called upon drag.
   * 
   * @param {type} ev
   * @returns {undefined}
   */
  Scrollbar.Horizontal.prototype.mousemove = function (ev) {
    var trackWidth = this.pane.el.width() - this.pane.padding * 2;
    var pos = ev.pageX - this.startPageX;
    var barWidth = this.el.width();
    var innerEl = this.pane.inner.get(0);

    // minimum top is 0, maximum is the track height
    var y = Math.min(Math.max(pos, 0), trackWidth - barWidth);

    innerEl.scrollLeft =
            (innerEl.scrollWidth - this.pane.el.width()) * y / (trackWidth - barWidth);
  };

  /**
   * Called upon container mousewheel.
   * 
   * @param {type} ev
   * @param {type} x
   * @returns {Boolean}
   */
  Scrollbar.Horizontal.prototype.mousewheel = function (ev, x) {
    if ((x < 0 && 0 === this.pane.inner.get(0).scrollLeft) ||
            (x > 0 && (this.innerEl.scrollLeft + Math.ceil(this.pane.el.width())
                    === this.innerEl.scrollWidth))) {
      ev.preventDefault();
      return false;
    }
  };

  /**
   * Vertical scrollbar constructor.
   * 
   * @param {type} pane
   * @returns {antiscroll-2_L1.Scrollbar.Vertical}
   */
  Scrollbar.Vertical = function (pane) {
    this.el = $('<div class="antiscroll-scrollbar antiscroll-scrollbar-vertical" style="margin-top: ' + pane.marginTop + 'px;" />', pane.el);
    Scrollbar.call(this, pane);
  };

  /**
   * Inherits from Scrollbar.
   */
  inherits(Scrollbar.Vertical, Scrollbar);

  /**
   * Updates size/position of scrollbar.
   *
   * @api private
   */
  Scrollbar.Vertical.prototype.update = function () {
    if (this.pane.options.debug) {
      console.debug('Scrollbar.Vertical | Padding is: ' + this.pane.padding);
    }

    var paneHeight = this.pane.el.height();
    var trackHeight = paneHeight - this.pane.padding * 2;
    var innerEl = this.innerEl;

    var scrollbarHeight = trackHeight * paneHeight / innerEl.scrollHeight;
    scrollbarHeight = scrollbarHeight < 20 ? 20 : scrollbarHeight;

    var topPos = trackHeight * innerEl.scrollTop / innerEl.scrollHeight;

    if ((topPos + scrollbarHeight) > trackHeight) {
      var diff = (topPos + scrollbarHeight) - trackHeight;
      topPos = topPos - diff - 3;
    }

    if (topPos < this.pane.options.limitTop) {
      topPos = this.pane.options.limitTop;
    }

    this.el.css({
      height: scrollbarHeight,
      top: topPos
    });

    if (this.pane.options.debug) {
      console.debug('Scrollbar.Vertical.update | Scrollbar height: ' + scrollbarHeight);
      console.debug('Scrollbar.Vertical.update | Moving to: ' + topPos);
    }

    return paneHeight < innerEl.scrollHeight;
  };

  /**
   * Called upon drag.
   * 
   * @param {type} ev
   * @returns {undefined}
   */
  Scrollbar.Vertical.prototype.mousemove = function (ev) {
    var paneHeight = this.pane.el.height();
    var trackHeight = paneHeight - this.pane.padding * 2;
    var pos = ev.pageY - this.startPageY;
    var barHeight = this.el.height();
    var innerEl = this.innerEl;

    // minimum top is 0, maximum is the track height
    var y = Math.min(Math.max(pos, 0), trackHeight - barHeight);

    innerEl.scrollTop =
            (innerEl.scrollHeight - paneHeight) * y / (trackHeight - barHeight);
  };

  /**
   * Called upon container mousewheel.
   * 
   * @param {type} ev
   * @param {type} y
   * @returns {Boolean}
   */
  Scrollbar.Vertical.prototype.mousewheel = function (ev, y) {
    if ((y > 0 && 0 === this.innerEl.scrollTop) ||
            (y < 0 && (this.innerEl.scrollTop + Math.ceil(this.pane.el.height())
                    === this.innerEl.scrollHeight))) {
      ev.preventDefault();
      return false;
    }
  };

  /**
   * Cross-browser inheritance.
   * 
   * @param {Function} ctorA constructor
   * @param {Function} ctorB constructor we inherit from
   * @returns {undefined}
   */
  function inherits(ctorA, ctorB) {
    function f() {
    }
    f.prototype = ctorB.prototype;
    ctorA.prototype = new f;
  }

  /**
   * Scrollbar size detection.
   */
  var size;

  function scrollbarSize() {
    if (size === undefined) {
      var div = $(
              '<div class="antiscroll-inner" style="width:50px;height:50px;overflow-y:scroll;'
              + 'position:absolute;top:-200px;left:-200px;"><div style="height:100px;width:100%"/>'
              + '</div>'
              );

      $('body').append(div);
      var w1 = $(div).innerWidth();
      var w2 = $('div', div).innerWidth();
      $(div).remove();

      size = w1 - w2;
    }

    return size;
  }

})(jQuery);
