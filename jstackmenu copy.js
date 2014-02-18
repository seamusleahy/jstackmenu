
(function( $ ){
	var undefined;
	var radsToDeg = 180 / Math.PI;
	
	// Check what features are supported by the browser
	var dummyStyles = $('<div style="transform:scale(2); -moz-transform:scale(2); ' +
		'-webkit-transform:scale(2); -o-transform:scale(2); transition:color 1s; ' +
		'-moz-transition:color 1s; -webkit-transition:color 1s; -o-transition:color 1s;"></div>' )
		.get( 0 ).style;
	
	var supportsTransform = !!( dummyStyles.transform || dummyStyles.MozTransform || 
		dummyStyles.WebkitTransform || dummyStyles.OTransform );
	
	var supportsTransition = false && !!( dummyStyles.transition || dummyStyles.MozTransition ||
		dummyStyles.WebkitTransition || dummyStyles.OTransition );
	
	
	
	// Position Function
	var position_wo_transform = function( ){
		var positioning = [];
		
		var is_y = this.options.direction in { 'top': '', 'bottom': '' };
		var is_neg = this.options.direction in { 'left': '', 'top': '' };
		
		this.element.children( ).each( function( ){
			var v;
			if( is_y ){
				v = $( this ).outerHeight( true );
			} else {
				v = $( this ).outerWidth( true );
			}
			v = is_neg? -1*v: v;
			
			positioning.push( v );
		} );
		
		positioning.unshift( 0 );
		this.positioning = positioning;
	};
	
	var position_w_transform = function( ){
		var positioning = [];
		
		var direction = this.options.direction;
		var is_y = this.options.direction in { 'top': '', 'bottom': '' };
		var is_neg = this.options.direction in { 'left': '', 'top': '' };
		var neg = is_neg ? -1: 1;
		var r = parseInt( this.options.radius, 10 );
		r = r == 0 ? 1 : r;
		var clockwise = this.options.clockwise;
		
		var origin = this.options.direction in { 'top': '', 'right': '' } ? r : -1*r;
		var origin = clockwise ? origin : -1 * origin;
		var origin = is_y ? origin+'px 50%' : '50% '+origin+'px';
		
		this.element.children( )
			.css( {
				'transformOrigin': origin,
				'MozTransformOrigin' : origin,
				'OTransformOrigin': origin,
				'WebkitTransformOrigin': origin,
				'top': '',
				'right': '',
				'bottom': '',
				'left': '',
			} )
			.each( function( ){
				var t, a, d, dd;
				if( is_y ){
					d = $( this ).outerHeight( true );
				} else {
					d = $( this ).outerWidth( true );
				}
				
				$( this ).css( direction, (d*-0.5)+'px' );
				
				a = Math.asin( d/r*0.5 );
				t = Math.cos( a ) * r;
				a = a*radsToDeg;
				
				t = r-t;
				t = clockwise? t : -1*t;
				if( is_y ){
					t = -1*t*neg;
					t = t+'px,0';
				} else {
					t = t*neg;
					t = '0,'+t+'px';
				}
				console.log( t, a, d );
				positioning.push( { t: t, a: a, d: d } );
			} );
		
		this.positioning = positioning;
	};
	
	var position_function = supportsTransform ? position_w_transform : position_wo_transform;
	
	// Show Function
	var show_wo_transform = function( ){
		var time = this.options.time;
		var ani = { 'opacity': 1 };
		var dir = this.options.direction;
		var positioning = this.positioning;
		var offset = 0;
		this.element.children( ).stop( ).css( 'display', '' ).each( function( i ){
			offset += positioning[ i ];
			ani[ dir ] = offset;
			$( this ).animate( ani, time, 'swing' );
		} );
	};
	
	var show_w_transform = function( ){
		var positioning = this.positioning;
		var angle = 0;
		var c = this.options.clockwise ? 1: -1;
		var time = this.options.time;
		
		this.element.children( )
			.css( 'display', 'block' )
			.each( function( i ){
				var p = positioning[ i ];
				angle += c*p.a;
				console.log( i, p.t, p.a, angle );
				var trans = 'rotate('+angle+'deg) translate('+p.t+')';
				
				$( this )
					.css( 'transform', 'translate('+(p.t)+')' )
					.animate( 
					{ 'rotate': angle, 'opacity': 1 },
					time
				);
				
				angle += c*p.a;
			} );
	};
	
	var show_w_transition = function( ){
	
	};
	
	var show_function = supportsTransform ? ( supportsTransition ? show_w_transition : show_w_transform ) : show_wo_transform;
	
	
	// Hide Function
	var hide_wo_transform = function( ){
		var ani = { 'opacity': 0 };
		ani[ this.options.direction ] = 0;
		
		this.element.children( )
			.stop( )
			.animate( 
				ani, 
				this.options.time,
				function( ){
					$(this).css( 'display', 'none' );
				}
			);
	};
	
	var hide_w_transform = function( ){
	
	};
	
	var hide_w_transition = function( ){
	
	};
	
	var hide_function = supportsTransform ? ( supportsTransition ? hide_w_transition : hide_w_transform ) : hide_wo_transform;
	
	
	
	$.widget( 'ui.stackmenu', {
		_init: function( ){
			this.element.addClass( 'ui-stackmenu' );
			this.element
				.children( )
				.addClass( 'ui-stackmenu-item' )
				.css( { 'opacity': 0, 'display': 'none' } )
				.css( this.options.direction, 0 );
			
			
			this.isShowing = false;
			
			// Calculate position
			position_function.call( this );
		},
		
		/**
		 * Shows the stack menu.
		 */
		show: function( ){
			this.toggle( true );
		},
		
		/**
		 * Hides the stack menu.
		 */
		hide: function( ){
			this.toggle( false );
		},
		
		/**
		 * Toggle the display of the stack menu.
		 *
		 * @param show (optional) - a boolean flag if true, then it shows; if false,
		 *   then it hides; if undefined (not passed), then it will toggle
		 */
		toggle: function( show ){
			if( this.options.disabled == true ){
				return;
			}
			
			var nextState = show === undefined? !this.isShowing : show;
			if( nextState == this.isShowing ){
				return;
			}
			
			if( nextState ){
				// Show
				show_function.call( this );
			} else {
				// Hide
				hide_function.call( this );
			}
			
			this.isShowing = nextState;
			
		},
		/*
		enable: function( ){
			$.widget.prototype.enable.apply( this, arguments );
		},
		
		disable: function( ){
			$.widget.prototype.disable.apply( this, arguments );
		},*/
		
		/**
		 * Removes the instance from the encapsulated DOM element, 
		 * which was stored on instance creation.
		 */
		destroy: function( ){
			this.element.removeClass( 'ui-stackmenu' );
			this.element.children( )
				.removeClass( 'ui-stackmenu-item' )
				.css( { 
					'opacity': '', 
					'display': '', 
					'top': '', 
					'right': '',
					'bottom': '',
					'left': '' } );
			
			// Final clean up
			$.widget.prototype.destroy.apply( this, arguments );
		},
		
		/**
		 * Gets or sets an option for this instance
		 */
		option: function( key, value ){
			if( value === undefined ){
				return $.widget.prototype.option.apply( this, arguments );
			}
			//$.widget.prototype.option.apply( this, arguments );
			var updateDisplay = false;
			
			if( key == 'direction' && value in { 'top': '', 'right': '', 'bottom': '', 'left': '' } ){
				this.options.direction = value;
				updateDisplay = this.isShowing;
			}
			
			if( key == 'clockwise' ){
				this.options.clockwise = !!value;
				updateDisplay = this.isShowing;
			}
			
			if( key == 'radius' ){
				this.options.radius = value;
				updateDisplay = this.isShowing;
			}
			
			if( key == 'time' ){
				this.options.time = value
				updateDisplay = this.isShowing;
			}
			
			if( updateDisplay ){
				this.hide( );
				position_function.call( this );
				this.show( );
			} else {
				position_function.call( this );
			}
		}
	} );
	
	
	$.extend( $.ui.stackmenu, {
		defaults: {
			'direction': 'top',
			'clockwise': true,
			'radius': '1000px',
			'time': 500,
		}
	} );
	
} )( jQuery );