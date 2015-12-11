/*
 * jquery.bounceback
 * https://github.com/andrewrjones/jquery.bounceback
 *
 * Copyright (c) 2012 Andrew Jones
 * Licensed under the MIT license.
 */

(function($) {

  // Collection method.
  $.fn.bounceback = function() {
    return this.each(function() {
      var el = $(this);
      
      // TODO: when we hit the bottom, stop processing event while we animate
      el.scroll(function(){
        if (el[0].scrollHeight - el.scrollTop() === el.outerHeight()) {
          // We're at the bottom.
          console.log("bottom" + el.height() );
          el.height( el.height() + 44);
          // TODO: do animation
        }
      });
    });
  };

}(jQuery));