/**
 * Class Map
 * 
 * Copyright(c) 2012 - Danilo Passos
 * danilo.vilanova.passos@gmail.com / ninzel@gmail.com / ninja@zelda.com.br
 *
 * The concept of this class is to create maps with custom markers populated on a database. 
 *  The original idea was that all the forms would come from outside the class in order to be framework/technology independent.
 *  Unfortunately, this was not possible once we started with some more complex functions, like edit of markers 
 * 
 * @class Map
 * @author Danilo Passos
 **/
function GMap() {
	var _this;
	
	this._currentMarker;
	this._currentNewMarker;
	this._currentOverlay = 0;
	this._currentNewJumpMarkerOrig;
	this._currentNewJumpMarkerDest;

	var markerURL = null;
	var markerExt = null;

	this.map;
	this.mapType;
	this.mapId;
	this.category;
	this._gmarkers;

	this._defaultMaps;

	/**
	 * Variable that records the last position before a map change
	 **/
	this._mapLastPos;
	this._markerLastPos;
	/** 
	 * Context Menu Variable
	 *  Must have a hide method and a showAt([x,y]) 
	 */
	this._ctxMenu;
	this._ctxMenuMkr;
	
	this._lastClickedPosition;

	/**
	 * Variable used for offset comming from the map
	 * 
	 */	
	this._clickOffset = {};
	this._clickOffset.x = 0;
	this._clickOffset.y = 0; //30
	
	this.currentCenter;
	
	/**
	 * Singleton of infoWindow
	 */
	this.infoWindow = undefined;
	
	this._STATE_IDLE = 0;
	this._STATE_EDIT_MARKER = 1;
	this._STATE_ADD_NEW_MARKER = 2;
	this._STATE_ADD_NEW_MARKER_JUMP = 3;
	
	this._state = this._STATE_IDLE;
	
	this.overlay;
	this.overlayView;

	this.copyrights = {};
};

GMap.prototype.getMarkerURL = function () {
	return this.markerURL;
};

GMap.prototype.getMarkerExt = function () {
	return this.markerExt;
};

//****************************************************************************//
//** USER                                                                    *//
//****************************************************************************//

/** 
 * This function will set the current user based on a parameter that will come from a database
 * 
 * @param vUser Object with user data coming from the Database
 * 				user.user_id		-> Unique ID (users not logged in will have a "-1" value)
 * 				user.username		-> Username (users not logged in will have a "Anonymous" value)
 *              user.is_registered	-> If it's a registered user (users not logged in will have a "false" value)
 */
GMap.prototype.setUser = function (vUser) {
	user = {};
	user.id = vUser.user_id;
	user.name = vUser.username;
	user.isRegistered = vUser.is_registered;
	
	// This options will always start as false (even if user is logged in or not), to better fit within the idea of the maps
	user.showOnlyMine = false;
	user.showApproved = false;
	user.showNotApproved = false;
	
	// We need to update all markers after login is done in order to add edit, delete, drag options
	_this.updateMarkerAfterLogin();	
};

/** 
 * This function returns if the user has any permission to add markers
 *  @TODO In the future, this may be used check other controls (like the user level, if it belongs to a certain group, etc). 
 *         For now, we only see if he is registered
 */
GMap.prototype.getUserPermission = function() {
	return user.isRegistered;
};

/**
 * Returns the whole user
 * @return user 
 * 				user.id				-> Unique ID
 * 				user.name			-> Username
 *              user.isRegistered	-> If it's a registered user
 */ 
GMap.prototype.getUser = function() {
	return user;
};

/**
 * Function to set the user options on the map according to the option checked
 * @param vOption Which option are we going to set
 * @param vChecked Boolean value stating if we are checking of unchecking things 
 */
GMap.prototype.setUserOptions = function(vOption, vChecked) {
	if (vOption == "showOnlyMyMarkers") {
		user.showOnlyMine = vChecked;
	} else if (vOption == "showMyApproved") {
		user.showApproved = vChecked;
	} else if (vOption == "showMyNonApproved") {
		user.showNotApproved = vChecked;
	}
	
	// Once we set the new user options, we need update all markers on the map
	_this.doUpdateAllMarkersVisibility();
}

//****************************************************************************//
//** ZOOM                                                                   **// 
//****************************************************************************//
/**
 *  Function to zoom in into the map according to the current center
 *   No additional protection regarding the max zoom level is needed since GMap API takes care of it
 */
GMap.prototype.zoomIn = function() {
	map.setZoom(map.getZoom() + 1);
};

/**
 *  Function to zoom out of the map according to the current center
 *   No additional protection regarding the min zoom level is needed since GMap API takes care of it
 */
GMap.prototype.zoomOut = function() {
	map.setZoom(map.getZoom() - 1);
};

/**
 *  Function to zoom in into the map according to the clicked position on the map
 */
GMap.prototype.zoomInClicked = function() {
	map.setCenter(_lastClickedPosition);
	this.zoomIn();		
};	

/**
 *  Function to zoom out of the map according to the clicked Position on the map
 */
GMap.prototype.zoomOutClicked = function() {
	map.setCenter(_lastClickedPosition);
	this.zoomOut();		
};

//****************************************************************************//
//** CONTEXT MENU                                                           **//
//****************************************************************************//
/**
 * Function to show the context menu according to a position (passed as pixel)
 *  In order to show the contextMenu, the dialogs for all the markers must be closed
 * @param vPositionPixel
 */
GMap.prototype.showCtxMenu = function(vPositionPixel) {
	if (!(typeof(_ctxMenu)=="undefined" || _ctxMenu == null)
	    	&& !(typeof(vPositionPixel)=="undefined" || vPositionPixel == null)) {
		this.closeInfoWindow();
		this.closeAddNewMarkerDialog();
		this.clearAddNewJumperMarker();
		_ctxMenu.showAt(vPositionPixel);
	}
};

/**
 * Function to hide the menu
 *  No futher action is taken except hidding the menu itself.
 */
GMap.prototype.hideCtxMenu = function() {
	if (!(typeof(_ctxMenu)=="undefined" || _ctxMenu == null)) {
		_ctxMenu.hide();
	}
	if (!(typeof(_ctxMenuMkr)=="undefined" || _ctxMenuMkr == null)) {
		_ctxMenuMkr.hide();
	}
};

/**
 * Function to set the context menu that will be called on the gmap
 * 	This contextMenu should have a .showAt([x,y]) method plus a .hide() method   
 */  
GMap.prototype.setContextMenu = function(vCtxMenu,vCtxMenuMkr) {
	_ctxMenu = vCtxMenu;
	_ctxMenuMkr = vCtxMenuMkr;
};

/**
 * Function to show the context menu for markers only. This is the menu that shows up when the user do a right click on a marker
 * @param vPositionPixel
 */
GMap.prototype.showCtxMenuMkr = function(vPositionPixel) {
	if (!(typeof(_ctxMenu)=="undefined" || _ctxMenu == null)
	    	&& !(typeof(vPositionPixel)=="undefined" || vPositionPixel == null)) {
		this.hideCtxMenu();
		this.closeInfoWindow();
		this.closeAddNewMarkerDialog();
		this.clearAddNewJumperMarker();
		_ctxMenuMkr.showAt(vPositionPixel);
	}
};
	
//****************************************************************************//
//** MAP                                                                    **//
//****************************************************************************//

GMap.prototype.constructor = function() {
	_defaultMaps = [];
	mapType = [];
	mapId = [];
	category = [];
	_gmarkers = [];
	_mapLastPos = [];
	user = {};
	user.isRegistered = false;
	_this = this;
	overlay = [];
};

/**
 * Function to add a layer to a map
 * @param vLayerToAdd Layer to be added
 */
GMap.prototype.addMapLayer = function(vLayerToAdd) {
	for (i = 0; i < overlay.length; i++) {
		if (overlay[i].id == vLayerToAdd.map_id) {
			var j = 0;
			
			if (overlay[i].layers == null) {
				overlay[i].layers = new Array();
			} else {
				j = overlay[i].layers.length;
			}
			
			var l = overlay[i].layers;
			l[j] = new Object();
			l[j].id = vLayerToAdd.map_layer_id;
			l[j].mapId = vLayerToAdd.map_id;
			l[j].tileUrl = vLayerToAdd.tile_url;
			l[j].tileExt = vLayerToAdd.tile_ext;
			l[j].title = vLayerToAdd.title;
			l[j].img404 = vLayerToAdd.img404;
			l[j].controlVisible = vLayerToAdd.control_visible;
			l[j].controlChecked = vLayerToAdd.control_checked;
			l[j].type = vLayerToAdd.type;
			break;
		}
	}
}
		
/**
 * Function to add a map to the google maps
 * @param vMapToAdd Map information that will be added
 * @TODO: See if it's necessary for custom categories (categories would changed when map type also changes
 */
GMap.prototype.addMap = function(vMapToAdd) {
	var c = 0;
	// If map_overlay_id is populated, it means it's possible an overlay, so we add to the overlay but we don't add to the maps array (important!)
	if (vMapToAdd.map_overlay_id > 0) {
		var i = overlay.length;
		overlay[i] = new Object();
		overlay[i].id = vMapToAdd.map_id;
		overlay[i].mapId = vMapToAdd.map_overlay_id;
		overlay[i].name = vMapToAdd.name;
		overlay[i].tileUrl = vMapToAdd.tile_url;
		overlay[i].tileExt = vMapToAdd.tile_ext;
		overlay[i].title = vMapToAdd.map_overlay_name;
		overlay[i].img404 = vMapToAdd.img404;
	} 
	
	this.copyrights[vMapToAdd.map_id] = vMapToAdd.map_copyright + ", " + vMapToAdd.map_mapper;
	
	if (vMapToAdd.map_overlay_id == vMapToAdd.map_id || vMapToAdd.map_overlay_id <= 0) {
		if (vMapToAdd.google_default == true) {
			// TODO: Implement the rest of the googlemap default maps
			if (vMapToAdd.map_type_name == 'ROADMAP') {
				mapId[mapId.length] = google.maps.MapTypeId.ROADMAP;
			} else if  (vMapToAdd.map_type_name == 'SATELLITE') {
				mapId[mapId.length] = google.maps.MapTypeId.SATELLITE;
			}
			//mapId[mapId.length - 1] = vMapToAdd.maxZoom;
			_defaultMaps[_defaultMaps.length] = new Object();
			_defaultMaps[_defaultMaps.length - 1].mapId = vMapToAdd.map_id + "";
			_defaultMaps[_defaultMaps.length - 1].mapType = mapId[mapId.length - 1];		
		} else {
			mapType[mapType.length] = new google.maps.ImageMapType({
										projection: new EuclideanProjection(),
										getTileUrl: function(coord, zoom) { 
											if (vMapToAdd.empty_map) {
												return "tiles/blank.png";
											}
											var upperLimit = Math.pow(2, zoom) - 1;
											// Force exit for tiled maps
											if (coord.x < 0 || coord.y < 0 || coord.x > upperLimit || coord.y > upperLimit ) {
												return "tiles/blank.png";
											}
											return "tiles/getTile.php?i=" + vMapToAdd.tile_url + zoom + "_" + coord.x + "_" + coord.y + "." + vMapToAdd.tile_ext + "&m=" + vMapToAdd.img404;
										},
										tileSize: new google.maps.Size(256, 256),
										isPng: (vMapToAdd.tile_ext == "png") ? true : false,
										name: vMapToAdd.name,
										alt: vMapToAdd.name,
										opacity: (vMapToAdd.map_overlay_name == "BASE_OPACITY" ? 0.35 : 1)
									});
			mapType[mapType.length - 1].projection = new EuclideanProjection();
			
			mapId[mapId.length] = vMapToAdd.map_id + "";
			mapType[mapType.length - 1].maxZoom = vMapToAdd.max_zoom;
			mapType[mapType.length - 1].zoom = vMapToAdd.default_zoom;
		}
		
		// TODO: This global variable is being set for each map. Verify necessity, since it should come from the map_container table, not map table
		this.markerURL = vMapToAdd.marker_url;	
		this.markerExt = vMapToAdd.marker_ext;
	}
};

/**
 * Function to check if a point is inside the limit.
 *  This function is used by markers function (add, move), calling the other function with a false
 * @param vPoint
 */
GMap.prototype.isInsideLimits = function(vPoint) {
	this.isInsideLimits(vPoint, false)
}

/**
 * Function to check if a point is inside the limit.
 *  This function is used by markers function and also map move (drag)
 * @param vLatLng The latitute and longitute that we want to check
 * @param vMapMove If this call is made from a mapMove
 * @TODO tileSize should be based on the projection tilesize of the current map, not a hard coded value!
 * @TODO remove parameter mapMove and do check based if the infoWindow is open (singleton). Currently, the newMarker is not using the singleton
 */
GMap.prototype.isInsideLimits = function(vLatLng, vMapMove) {
	var coord = map.getProjection().fromLatLngToPoint(vLatLng);
	var tileSize = 256;
	
	// The reason why coord.y has the current logic (coord.y < (vMapMove ? tileSize / 2 : tileSize))
	//  is to give more space on the top when we are adding a new marker near the top plus give some room to open the infowindow.
	// That's why if it's a map move, we give a little more room on the top... If not, it will be 0, meaning we are dealing with ]
	//  a marker and it will only check if we are inside the limits
	if (coord.x < 0 || coord.y < (vMapMove ? tileSize / 2 : tileSize) - tileSize ||coord.x > tileSize || coord.y > tileSize) {
		return false;
	} else {
		return true;
	}
};

/**
 * Buils the main map based on the map types / map info passed by the addMap
 */
GMap.prototype.buildMap = function() {

	// Default options for map
	var mapOptions = {
		streetViewControl : false,
		zoom: (mapType[0] == null ? 0 : mapType[0].zoom),
		center: new google.maps.LatLng(0,0),
		backgroundColor: '#deecfd',
		enableEventPropagation: true,
		mapTypeControlOptions: {
			mapTypeIds: mapId,
			style: (mapId.length > 8 ? google.maps.MapTypeControlStyle.DROPDOWN_MENU : google.maps.MapTypeControlStyle.DEFAULT)
		}
	};

	// Instance of the map variable
	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	// Now attach the coordinate map type to the map's registry
	for (var i = 0; i < mapId.length; i++) {		
		map.mapTypes.set(mapId[i], mapType[i]);
		_mapLastPos[mapId[i]] = new Object();
		_mapLastPos[mapId[i]].pos = new google.maps.LatLng(0,0);
		_mapLastPos[mapId[i]].zoom = (mapType[i] == null ? 0 : mapType[i].zoom);
	}
	
	// TODO: Change to the default map on the map_container / also, may be the order (should be ok)
	map.setMapTypeId(mapId[0]);
	
	// Instance of this for googlemaps events
	var _this = this;
	currentCenter = map.getCenter();

	// FOR JUMP MARKER _lastClickedPosition
	google.maps.event.addListener(map, 'click', function(event) {
		if (_this._state == _this._STATE_ADD_NEW_MARKER_JUMP) {
			_this.addDestinationJumpMarker(event.latLng);
			//Ext.MessageBox.prompt('Confirmação de movimentação', 'Por favor, descreva o motivo para a nova posição:', markerDragEnd);
		}
	});
	
	
	google.maps.event.addListener(map, 'rightclick', function(event) {

		// Save the last _lastClickedPosition
		_lastClickedPosition = event.latLng;
		_lastClickedPosition.mapId = _this.getMapId(map.getMapTypeId()); 
		_lastClickedPosition.overlayId = _this._currentOverlay; 
		
		// Check if the click was in an allowable area. If not, don't allow context menu
		// See showContextMenu method. That method will be called right after this click by the UI
		if (_this.isInsideLimits(event.latLng)) {
			_this.showCtxMenu([event.pixel.x + _this._clickOffset.x, event.pixel.y + _this._clickOffset.y]);
		} else {
			_this.hideCtxMenu();
		}
		
//			alert("LatLng: " + event.latLng + " - Pxl: " + gameMapType[0].projection.fromLatLngToPoint(event.latLng) + " Pixel" + event.pixel);
	});

	// This avoid that the maps get too much scrolled out of the screen.
	google.maps.event.addListener(map, 'center_changed', function(){
		// if the new center is not inside limits, set the center to the previous one and exit
		if (!(_this.isInsideLimits(map.getCenter(), true))) {
			map.setCenter(currentCenter);
			return;
		// if not, just set the new center			
		} else {
			currentCenter = map.getCenter();
		}
		
		// Storing the current center and zoom (this will be used when the map changes
		_mapLastPos[map.getMapTypeId()].pos = currentCenter;
		_mapLastPos[map.getMapTypeId()].zoom = map.getZoom();
	});

	google.maps.event.addListener(map, 'maptypeid_changed', function(event) {
		if (isInt(map.getMapTypeId())) {	
			_this.switchMap(map.getMapTypeId());
			
			// Using the latest position and zoom
			map.setZoom(_mapLastPos[map.getMapTypeId()].zoom);
			map.setCenter(_mapLastPos[map.getMapTypeId()].pos);
			_this.updateMapCopyright(map.getMapTypeId());
		}
	});

	google.maps.event.addListener(map, 'zoom_changed', function(event) {
		_this.hideCtxMenu();
		_mapLastPos[map.getMapTypeId()].pos = map.getCenter();
		_mapLastPos[map.getMapTypeId()].zoom = map.getZoom();
	});
	
	//google.maps.event.addListener(map, 'tilesloaded', function(event) {
	//	alert("Carreguei");			
	//});	
	
	_this._state = _this._STATE_IDLE;
	
	
	// TODO: FAKE MARKER... EXTJS DOESNT CORRECTLY LOAD THE EDIT FORM UNLESS INFOWINDOW HAS ALREADY APPEARED
	var marker = new google.maps.Marker({
		position: new google.maps.LatLng(new google.maps.LatLng(5000,5000)),
		title: "fake",
		autoPan: true,
		clickable: true,
		draggable: false,
		map: map,
        }
    );
	marker.isValid = false;
	marker.id = -1;
	_gmarkers.push(marker);

	var div = document.createElement('DIV');
	div.innerHTML = "";
	
	_this.infoWindow = new google.maps.InfoWindow({
		content: div
	});								
	
	_this.infoWindow.open(map,marker);
	
	_this.updateOverlayControl(map.getMapTypeId());
	
	copyrightDiv = document.createElement("div");
	copyrightDiv.id = "map-copyright";
	copyrightDiv.style.fontSize = "11px";
	copyrightDiv.style.fontFamily = "Arial, sans-serif";
	copyrightDiv.style.margin = "0 2px 2px 0";
	copyrightDiv.style.whiteSpace = "nowrap";
	map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(copyrightDiv);
	
	betaDiv = document.createElement("div");
	betaDiv.style.backgroundImage = "url('beta_maps.png')";
	betaDiv.style.width = "193px";
	betaDiv.style.height = "62px";
	betaDiv.style.marginTop = "12px";
	betaDiv.id = "map-beta";
	map.controls[google.maps.ControlPosition.TOP_LEFT].push(betaDiv);
	
	
	//setTimeout(_this.updateMapCopyright(map.getMapTypeId()), 50);
	google.maps.event.addListenerOnce(map, 'idle', function() {
		_this.updateMapCopyright(map.getMapTypeId());
		//google.maps.event.clearListeners(map, 'idle');
	});
		
	overlayView = new google.maps.OverlayView();
	overlayView.draw = function() {};
	overlayView.setMap(map);
};


GMap.prototype.updateMapCopyright = function(mapId) {
	try {
		copyrightDiv = document.getElementById("map-copyright")
		if (mapId in this.copyrights) {
			copyrightDiv.innerHTML = this.copyrights[mapId];
		} else {
			copyrightDiv.innerHTML = "";
		}
	} catch(err) {
	}
}



GMap.prototype.getMapId = function(mapId) {
	if (!isInt(mapId)) {
		for (var i =0; i < _defaultMaps.length; i++) {
			if (mapId == _defaultMaps[i].mapType) {
				return _defaultMaps[i].mapId;
			}
		}
	}
	return mapId;
};

GMap.prototype.showOverlay = function(overlayMap) {
	_this.showOverlay(overlayMap, false);
}

// @TODO: ignoreCheck created because of problems on production server... need to better investigate
GMap.prototype.showOverlay = function(overlayMap, ignoreCheck) {
	if (!ignoreCheck && _this._currentOverlay == overlayMap.id) {
		return;
	}
	map.overlayMapTypes.clear();

	var c = 0;
	
	if (overlayMap.layers != null) {	
		for (i = 0; i < overlayMap.layers.length; i++) {
			if (overlayMap.layers[i].type == "B" && overlayMap.layers[i].controlChecked) {
				var o = overlayMap.layers[i];
				// @TODO: The following logic applies to only ONE overlayer per time... Additional coding would be need for more overlays at the sametime
				map.overlayMapTypes.insertAt(c++,
					new FlatMapType(o.id, o.name, o.name, o.tileUrl, o.tileExt, o.img404)
				);
			}
		}
	}

	map.overlayMapTypes.insertAt(c++,
		new FlatMapType(overlayMap.id, overlayMap.name, overlayMap.name, overlayMap.tileUrl, overlayMap.tileExt, overlayMap.img404)
	);
	
	if (overlayMap.layers != null) {
		for (i = 0; i < overlayMap.layers.length; i++) {
			if (overlayMap.layers[i].type == "F" && overlayMap.layers[i].controlChecked) {
				var o = overlayMap.layers[i];
				map.overlayMapTypes.insertAt(c,
					new FlatMapType(o.id, o.name, o.name, o.tileUrl, o.tileExt, o.img404)
				);
				c++;
			}
		}
	}

	// Remove the font weight for all the control elements
	var el = map.controls[google.maps.ControlPosition.RIGHT_TOP].getAt(0).childNodes;
	for (var i = 0; i < el.length; i++) {
		if (overlayMap.id == el[i].ocid) {
			el[i].style.fontWeight = "Bold";
		} else {
			el[i].style.fontWeight = "";
		}
	}
	
	if (map.controls[google.maps.ControlPosition.RIGHT_TOP].length > 1) {
		map.controls[google.maps.ControlPosition.RIGHT_TOP].removeAt(1);
	}
	
	if (overlayMap.layers != null) {
		var controlDiv2 = document.createElement('DIV');
		controlDiv2.style.padding = '5px';		
		
		for (var i = 0; i < overlayMap.layers.length; i++) {
			if (overlayMap.layers[i].controlVisible) {
				controlDiv2.appendChild(_this.createOverlayControlElementSingle(overlayMap.layers[i].id, overlayMap.layers[i].title, overlayMap.layers[i], i));
			}
		}
		
		if (controlDiv2.childNodes.length > 0) {
			controlDiv2.index = 2;
			map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controlDiv2);
		}		
	}	
	
	
	_this._currentOverlay = overlayMap.id;
	
	// Go through all the markers array, shutting down any open markers and hiding them
	_this.doUpdateAllMarkersVisibility();
	_this.closeAddNewMarkerDialog();
	_this.updateMapCopyright(overlayMap.id);
}

GMap.prototype.createOverlayControlElementSingle = function(id, title, overlayMap, position) {

	position = (position == 0 ? 0 : position + 1);
	// Set CSS for the control border
	var control = document.createElement('DIV'); 
	control.className = "overlayControl";
	control.innerHTML = title;
	control.ocid = id;

	// Setup the click event listener for Home:
	// simply set the map to the control's current home property.
	google.maps.event.addDomListener(control, 'click', function() {
		if (control.style.fontWeight == "bold") {
			map.overlayMapTypes.forEach(function(item, index) {
				if (item != null && id == item.id) {
					map.overlayMapTypes.removeAt(index);
					control.style.fontWeight = "";				
				}
			});
		} else {
			control.style.fontWeight = "bold";
			if (overlayMap.type == 'B') {
				map.overlayMapTypes.insertAt(0, new FlatMapType(overlayMap.id, overlayMap.name, overlayMap.name, overlayMap.tileUrl, overlayMap.tileExt,overlayMap.img404));
			} else {
				map.overlayMapTypes.push(new FlatMapType(overlayMap.id, overlayMap.name, overlayMap.name, overlayMap.tileUrl, overlayMap.tileExt, overlayMap.img404));
			}
		};
	});
	
	if (overlayMap.controlChecked) {
		control.style.fontWeight = "bold";
	}
	return control;
};


GMap.prototype.createOverlayControlElement = function(id, title, overlayMap) {

	// Set CSS for the control border
	var control = document.createElement('DIV'); 
	control.className = "overlayControl";
	control.innerHTML = title;
	control.ocid = id;

	// if overlaymap is not null, we need to add to the map an overlay. Plus, we need to add it to the control scheme
	if (overlayMap != null) {
		// Event for on click on that control piece
		google.maps.event.addDomListener(control, 'click', function() {
			_this.showOverlay(overlayMap);
		});
	// if overlaymap is null, it means that this element is the "basis" of the overlay, therefore, no need to add an overlay
	//  still, we do need to add it to the control	
	} else {
		// Setup the click event listener for Home:
		// simply set the map to the control's current home property.
		google.maps.event.addDomListener(control, 'click', function() {
			if (_this._currentOverlay == 0) {
				return;
			}
			
			// @TODO: The following logic applies to only ONE overlayer per time... Additional coding would be need for more overlays at the sametime		
			map.overlayMapTypes.clear();
			
			// Remove the font weight for all the control elements
			var el = map.controls[google.maps.ControlPosition.RIGHT_TOP].getAt(0).childNodes;
			for (var i = 0; i < el.length; i++) {
				el[i].style.fontWeight = "";
			}
			
			// Set the current control element with bold text
			control.style.fontWeight = "bold";
					
			_this._currentOverlay = 0;
			
			// Go through all the markers array, shutting down any open markers and hiding them
			_this.doUpdateAllMarkersVisibility();
			_this.closeAddNewMarkerDialog();
			_this.updateMapCopyright(map.getMapTypeId());
		});
		
		// Set the control element that is the basis as bold on load
		control.style.fontWeight = "bold";
	}

	return control;
};


/**
 * Function that creates the overlay control element for a given overlay
 * @param title The text that it will be shown inside the control element
 * @param overlayMap The overlay map that will be opened on the onclick event
 * @return controlDiv The div containing the element, the click event and the styles applied
 */
GMap.prototype.createOverlayControlElement = function(id, title, overlayMap) {

	// Set CSS for the control border
	var control = document.createElement('DIV'); 
	control.className = "overlayControl";
	control.innerHTML = title;
	control.ocid = id;

	// if overlaymap is not null, we need to add to the map an overlay. Plus, we need to add it to the control scheme
	if (overlayMap != null) {
		
		// Event for on click on that control piece
		google.maps.event.addDomListener(control, 'click', function() {
			_this.showOverlay(overlayMap);
		});
	// if overlaymap is null, it means that this element is the "basis" of the overlay, therefore, no need to add an overlay
	//  still, we do need to add it to the control	
	} else {
		// Setup the click event listener for Home:
		// simply set the map to the control's current home property.
		google.maps.event.addDomListener(control, 'click', function() {
			if (_this._currentOverlay == 0) {
				return;
			}
			
			// @TODO: The following logic applies to only ONE overlayer per time... Additional coding would be need for more overlays at the sametime		
			map.overlayMapTypes.clear();
			
			// Remove the font weight for all the control elements
			var el = map.controls[google.maps.ControlPosition.RIGHT_TOP].getAt(0).childNodes;
			for (var i = 0; i < el.length; i++) {
				el[i].style.fontWeight = "";
			}
			
			// Set the current control element with bold text
			control.style.fontWeight = "bold";
					
			_this._currentOverlay = 0;
			
			// Go through all the markers array, shutting down any open markers and hiding them
			_this.doUpdateAllMarkersVisibility();
			_this.closeAddNewMarkerDialog();
			_this.updateMapCopyright(map.getMapTypeId());
		});
		
		// Set the control element that is the basis as bold on load
		control.style.fontWeight = "bold";
	}

	return control;
};

/**
 * This function should be used to update the overall overlay control (such as a map change)
 *  If a map has no overlay, it will only clean the controller
 * @param mapId The mapId which be the basis to build the overlay control
 */
GMap.prototype.updateOverlayControl = function(mapId) {
	map.overlayMapTypes.clear();
	map.controls[google.maps.ControlPosition.RIGHT_TOP].clear();
	
	var currentMapId = this.getMapId(mapId);
	
	var controlDiv = document.createElement('DIV');
	controlDiv.style.padding = '5px';
	
	var x;
	var c = 0;
	
	// Looping through the overlay array in order to find those that match the param mapId
	for (var i = 0; i < overlay.length; i++) {
		if (overlay[i].title.substring(0,4) == "BASE" && overlay[i].mapId == mapId) {
			x = overlay[i];
			continue;
		}
		if (currentMapId == overlay[i].mapId) {
			if (c == 0 || overlay[i].title == "1F") {
				c = overlay[i];
			}
			
			// If the currentMapId (which should be the basis layer) is equal, we add it to the control element (null overlay)
			if (overlay[i].mapId == overlay[i].id) {
				controlDiv.appendChild(_this.createOverlayControlElement(overlay[i].id, overlay[i].title, null));
			// If they are not equal, it means it is an overlay, therefore we add it to the controller and give the overlay itself in order to be built
			} else {
				controlDiv.appendChild(_this.createOverlayControlElement(overlay[i].id, overlay[i].title, overlay[i]));
			}
		}
	}

	// If there is any overlay, add to the controller
	if (controlDiv.childNodes.length > 0) {
		controlDiv.index = 1;
		map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controlDiv);
	}
	
	
	if (x != null && x.title.substring(0,4) == "BASE") {
		_this.showOverlay(c);
	} else {
		this._currentOverlay = 0;
	}
};


GMap.prototype.getCurrentOverlayId = function() {
	return _this._currentOverlay;
};	

/**
 * Function to close a info window for all the existing tabs on a map
 * 
 * @param mapId The id of the map that needs to be switched
 */
GMap.prototype.switchMap = function(mapId) {
	this.updateOverlayControl(mapId);
	
	this.hideCtxMenu();
	this.closeAddNewMarkerDialog();
	
	// Go through all the markers array, shutting down any open markers and hiding them
	this.doUpdateAllMarkersVisibility();
};   

//****************************************************************************//
//** CATEGORY
//****************************************************************************//

/**
 * Add a category to the map 
 * @param {} vCategory
 */
GMap.prototype.addCategory = function(vCategory) {
	var i = vCategory.marker_category_id;

	category[i] = new Object();
	category[i].id = vCategory.marker_category_id;
	category[i].parentId = vCategory.marker_category_parent_id;
	category[i].checked = vCategory.checked;
	category[i].name = vCategory.name;
	category[i].img = vCategory.img;
};

/**
 * Updates the visibility of category. This will in turn reflect on the markers
 * @param {} id Category id to be changed
 * @param {} checked True of false, reflecting the status
 */
GMap.prototype.doUpdateCategoryVisibility = function(id, checked) {
	if (category[id].checked != checked) {
		category[id].checked = checked;
		this.doUpdateAllMarkersVisibility();
	}
};

GMap.prototype.getCategory = function(vCategoryId) {
	return category[vCategoryId];
}

//****************************************************************************//
//** MARKER
//****************************************************************************//

GMap.prototype.openMarker = function(mkr) {
	if (_this._state == _this._STATE_ADD_NEW_MARKER_JUMP) {
		_currentNewJumpMarkerDest = mkr;
		_this.showJumpMarkerConfirmation();
	} else {
		_this.openInfoWindow(mkr);	
	}
}

GMap.prototype.openMarkerById = function(mkr_id) {
	try {
		_this.openMarker(_this.getMarkerById(mkr_id));
	 } catch (err) {
	 }
}

/**
 * Add Marker - Function to add a marker to the map.
 * 
 * @param mkr Object with marker data coming from the Database
 * 				mkr.marker_id          -> Unique ID
 * 				mkr.map_id             -> Id of the map that the marker should be rendered
 *              mkr.marker_category_id -> ID of the category that marker belongs to
 *              mkr.marker_category_type_id -> Category type id used to determine the action to be taken              
 *              mkr.user_id            -> User ID that created the marker
 *              mkr.user_name          -> User name that created the marker
 * 				mkr.name               -> Name for the marker
 *              mkr.desc               -> Description of marker
 * 				mkr.x                  -> Lat position
 * 				mkr.y                  -> Lng position
 *              mkr.tab_title          -> Array containing all of the titles for the tabs. <|> separated
 *              mkr.tab_text           -> Array containing all of the text for the tabs. <|> separated
 */
GMap.prototype.addMarkerFromDB = function(mkr) {
	
	var marker = this.getMarkerById(mkr.marker_id);
	var insert = false;

	// @TODO: Make dynamic markers Icons
	
	// If the marker already exists on our marker array, we just do an update 
	if (marker == null) {
		if (mkr.marker_category_type_id == 3) {
			var image = new google.maps.MarkerImage(this.markerURL + "_" + category[mkr.marker_category_id].img,
				new google.maps.Size(121, 49),
				new google.maps.Point(0,0),
				new google.maps.Point(60, 39));
			var shape = {
				coord: [1, 1, 120, 48],
				type: 'rect'
			};
			marker = new google.maps.Marker({
					position: new google.maps.LatLng(mkr.x,mkr.y),
					icon: image,
					shape: shape,
					title: mkr.name,
					autoPan: true,
					clickable: true,
					draggable: (user.id == mkr.user_id),
					map: map
				});
			var label = new Label({
			   map: map
			});
			label.set('zIndex', 1234);
			label.bindTo('position', marker, 'position');
			label.set('text', marker.getTitle());
			marker.label = label;				
		} else {
			var icn = new google.maps.MarkerImage(this.markerURL + category[mkr.marker_category_id].img,
			  // This marker is 32 pixels wide by 32 pixels tall.
			  new google.maps.Size(32, 32),
			  // The origin for this image is 0,0.
			  new google.maps.Point(0,0),
			  // The anchor for this image is the center of the image itself.
			  new google.maps.Point(16, 16)
			);		
			
			marker = new google.maps.Marker({
					position: new google.maps.LatLng(mkr.x,mkr.y),
					icon: icn,
					title: mkr.name,
					autoPan: true,
					clickable: true,
					draggable: (user.id == mkr.user_id),
					map: map
				}
			);
		}
		insert = true;		
	} else {
		marker.setPosition(new google.maps.LatLng(mkr.x,mkr.y));
		marker.setTitle(mkr.name);
		if (marker.categoryTypeId == 3 && marker.label != null) {
			marker.label.set('text', marker.getTitle());
		}
	}

	marker.id = mkr.marker_id;
	marker.categoryId = mkr.marker_category_id;	
	for (var i = 0; i < _defaultMaps.length; i++) {
		if (_defaultMaps[i].mapId == mkr.map_id) {
			marker.mapId = _defaultMaps[i].mapType;
			marker.mapId2 = mkr.map_id;
			break;
		}
	}
	if (marker.mapId == undefined) {
		marker.mapId = mkr.map_id;
	}
	marker.categoryTypeId = mkr.marker_category_type_id;
	marker.jump_marker_id = mkr.jump_marker_id;
	marker.userId = mkr.user_id;
	if (mkr.tab_title.length > 0) 
		marker.tabTitle = mkr.tab_title.split('<|>');
	if (mkr.tab_text.length > 0) 		
		marker.tabText = mkr.tab_text.split('<|>');
	marker.tabId = mkr.tab_id.split('<|>');
	marker.tabUserId = mkr.tab_user_id.split('<|>');
	marker.tabUserName = mkr.tab_user_name.split('<|>');
	marker.userName = mkr.user_name;
	marker.name = mkr.name;
	marker.isValid = mkr.visible;
	marker.setVisible(marker.isValid == 1 ? true : false);
	marker.overlayMap = mkr.overlay_id;
	marker.global = mkr.global;

	if (marker.isValid == 1) {
		this.doUpdateMarkerVisibility(marker);
		//alert(marker.userId);
		this.updateMarkerDraggable(marker, user.id == marker.userId);
	} else {
		if (marker.categoryTypeId == 3 && marker.label != null) {
			marker.label.remove();
			marker.label = null;
		}
	}

	google.maps.event.addListener(marker, 'rightclick', function() {
		// TODO: Remove this once we have implemented type 2
		if (user.id == marker.userId && (marker.categoryTypeId == 1 || marker.categoryTypeId == 3)) {
			_ctxMenuMkr = new Ext.menu.Menu({
				items : [{
					text : localize("%edit"),
					handler: function () {_this.markerEditForm(marker)}
				},{
					text : localize("%delete"),
					handler: function () {_this.markerDeleteForm(marker)}
				}]
			});
			_ctxMenuMkr.on("contextmenu", function() {}, this, { single: true, delay: 100, stopEvent : true, forumId: 4 });
			
			var point = overlayView.getProjection().fromLatLngToContainerPixel(marker.getPosition());
			_this.showCtxMenuMkr([point.x+16, point.y+16]);
		}
	});
	

	switch (marker.categoryTypeId) {
		// Data marker
		case 1:
		case 3:
			if (mkr.tab_title.length > 0 && mkr.tab_text.length > 0) {
				google.maps.event.addListener(marker, 'click', function() {
					_this.openMarker(marker);
				});
			}			
			break;
		// Jump / Link to another position
		case 2:
			google.maps.event.addListener(marker, 'click', function() {
				if (_this._state == _this._STATE_ADD_NEW_MARKER_JUMP) {
					_currentNewJumpMarkerDest = marker;
					_this.showJumpMarkerConfirmation();
				} else {
					// Get the marker id to jump
					var jump_marker = _this.getMarkerById(marker.jump_marker_id);
					
					// Verify if the marker id was valid and we got a marker object.
					if (jump_marker == undefined || jump_marker == null) {
						return;
					}
					
					// If we got, change the map accordingly
					// Needs to verify if we are going to change the map.
					if (map.getMapTypeId() != jump_marker.mapId && isInt(map.getMapTypeId())) {
						map.setMapTypeId(jump_marker.mapId + "");
					}
					_this.switchMap(jump_marker.mapId);
					for (var i = 0; i < overlay.length; i++) {
						if (overlay[i].id == jump_marker.overlayMap) {
							_this.showOverlay(overlay[i], true);
						}
					}
					

					_this.closeInfoWindow();
					_this.closeAddNewMarkerDialog();
					
					// Sets the target marker as visible in order to appear, even if the
					//  marker should be hidden by category or map_type issues 
					jump_marker.setVisible(true);
					
					map.panTo(jump_marker.position);
					
					// Open the info window after the jump is completed
					_this.openInfoWindow(jump_marker);
				}
			});			
			break;
	}
	
	if (insert) {
		_gmarkers.push(marker);
	}
};

/**
 * Function to update all markers according to the visibility of marker categories and user options
 */
GMap.prototype.doUpdateAllMarkersVisibility = function() {
	for (var i = 0; i < _gmarkers.length; i++) {
		this.doUpdateMarkerVisibility(_gmarkers[i]);
	}
}

/**
 * Function to update a given marker according to the visibility of marker categories and user options
 * @param marker
 */
GMap.prototype.doUpdateMarkerVisibility = function(marker) {

	// Checking if the user option show only mine is true. If it is marked and he is not owner of the marker, we hide the marker.
	if (user.showOnlyMine && marker.userId != user.id) {
		marker.setVisible(false);
		if (_this._currentMarker != undefined && _this._currentMarker.id == marker.id) {
			_this.closeInfoWindow();
		}
	// Anything else, including if the user only wants to show his marker, need to go through the proper process
	} else {
		if ((marker.isValid == 1 && !user.showOnlyMine)
				|| (user.showOnlyMine && user.showNotApproved && marker.isValid == 0)
				|| (user.showOnlyMine && user.showApproved && marker.isValid == 1)
				// This is for googlemaps default maps... so all markers will shown, independently of setup on googlemaps
				|| (marker.isValid == 1 && !isInt(marker.mapId) && !isInt(map.getMapTypeId())))
		{
			if (
					(marker.mapId == map.getMapTypeId() 
						&& (marker.overlayMap == _this._currentOverlay || marker.global == 1) 
						&& category[marker.categoryId].checked == true)
					// This is for googlemaps default maps... so all markers will shown, independently of setup on googlemaps
					|| ((!isInt(marker.mapId) && !isInt(map.getMapTypeId())) && category[marker.categoryId].checked == true)
				)
			{
				if (marker.getVisible() != true) {
					marker.setVisible(true);
					if (marker.categoryTypeId == 3) {
						var label = new Label({
						   map: map
						});
						label.set('zIndex', 1234);
						label.bindTo('position', marker, 'position');
						label.set('text', marker.getTitle());
						marker.label = label;
					}
				}
			} else {
				if (marker.getVisible() != false) {
					marker.setVisible(false);
					if (marker.categoryTypeId == 3) {
						if (marker.label != null) {
							marker.label.remove();
						}
						marker.label = null;
					}
					
					if (_this._currentMarker != undefined && _this._currentMarker.id == marker.id) {
						_this.closeInfoWindow();
					}
				}
			}
		} else {
			marker.setVisible(false);
		}
	}
};


GMap.prototype.markerEditForm = function(marker) {
	_this.closeInfoWindow();
	_this.closeAddNewMarkerDialog();

	var div = document.createElement('DIV');
	div.innerHTML = "";
	
	_this.infoWindow = new google.maps.InfoWindow({
		content: div
	});								
	
	_this.infoWindow.open(map,marker);
	_this._currentMarker = marker;
	
	//---------------------------
	var info=new Array();

	info[0] = [{
				title: localize("%information"),
				anchor:'95%',
				xtype: 'displayfield',
				name: 'displayFieldMarkerCategory',						
				value: localize("%addMarkerHelper")
			}];
	var tab_title = marker.tabTitle;
	var tab_text = marker.tabText;
	var tab_id = marker.tabId;
		
	tabCount = 1;
	if (tab_title != undefined) {
		for (tabCount = 1; tabCount <= tab_title.length; tabCount++) {
			if (user.id == marker.tabUserId[tabCount - 1]) {
				info[tabCount] = [{
							title: tab_title[tabCount - 1],
							closable: true,
							defaultType: 'textfield',												
							items: [{
								readOnly: true,
								hidden: true,
								name: 'tab' + tabCount + '_id',
								value: tab_id[tabCount - 1],
								allowBlank:false
							}, {
								fieldLabel: localize("%tabTitle"),
								name: 'tab' + tabCount + '_title',
								value: tab_title[tabCount - 1],
								allowBlank:false
							}, {
								name: 'tab' + tabCount + '_original_text',
								allowBlank:false,
								readOnly: true,
								hidden: true,
								value: tab_text[tabCount - 1],
								allowBlank:false,
								xtype: 'textarea'
							}, {								
								xtype: 'ckeditor', 
								fieldLabel: localize("%tabDescription"), 
								name: 'tab' + tabCount + '_text', 
								value: tab_text[tabCount - 1],
								width: 550,
								height: 220,
								CKConfig: { 
									toolbar: 'Full',
									customConfig : 'ckeditor_cfg.js',
								}
							}]
						}];
			} else {
				info[tabCount] = [{
							title: tab_title[tabCount - 1],
							closable: false,
							readOnly: true,
							defaultType: 'textfield',
							items: [{
								readOnly: true,
								hidden: true,
	//									disabled: true,
								name: 'tab' + tabCount + '_id',
								value: tab_id[tabCount - 1],
								allowBlank:false
							}, {
								readOnly: true,
	//									disabled: true,
								fieldLabel: localize("%tabTitle"),
								name: 'tab' + tabCount + '_title',
								value: tab_title[tabCount - 1],
								allowBlank:false
							}, {
								readOnly: true,
	//									disabled: true,
								xtype: 'textareafield', 
								fieldLabel: localize("%tabDescription"),
								name: 'tab' + tabCount + '_text', 
								value: tab_text[tabCount - 1],
								width: 550,
								height: 220,
							}]
						}];				
			}
		}
	}

	var form = Ext.create('Ext.form.Panel', {
		labelWidth: 65, // label settings here cascade unless overridden
		//url:'save-form.php',
		frame:false,
		header:false,
		bodyStyle:'padding:5px 0px 0',
		bodyBorder: false,
		border: false,
	
//		labelWidth: 75,
		border:false,
		width: 650,
		height: 370,
		fieldDefaults: {
			labelWidth: 65,
			msgTarget: 'side'
		},
		defaults: {
			anchor: '100%'
		},
		items: [{
			layout:'column',
			border:false,
			
			items:[{
				columnWidth:.4,
				border:false,
				layout: 'anchor',
				defaultType: 'textfield',
				items: [{
					fieldLabel: localize("%title"),
					name: 'marker_title',
					value: marker.name,
					anchor:'95%',
					allowBlank:false
				}]
			},{
				columnWidth:.2,
				border:false,
				layout: 'anchor',
				items: [{
					xtype: 'checkboxfield',
					name: 'global_marker',
					checked: (marker.global),
					labelWidth: 100,
					anchor:'95%',
					fieldLabel: localize("%globalMarker"),
				}]
			},{					
				columnWidth:.4,
				border:false,
				layout: 'anchor',
				defaultType: 'textfield',
				items: [{
					anchor:'95%',
					xtype: 'displayfield',
					name: 'displayFieldMarkerCategory',
					fieldLabel: localize("%category"),
					value: '<img class="x-tree-icon x-tree-icon-leaf icnMrkr icnMrkr' + marker.categoryId + '" src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="> ' + category[marker.categoryId].name
				}]
			}]
		},{
			xtype:'tabpanel',
			enableTabScroll:true,
			activeTab: 0,
			defaults:{autoHeight:false, bodyStyle:'padding:10px'}, 
			height: 300,	
			plugins: [ Ext.ux.AddTabButton ],
			createTab: function() { tabCount++;// Optional function which the plugin uses to create new tabs
				return {
					title: localize("%tab") + " " + tabCount,
					closable: true,
					defaultType: 'textfield',
										
					items: [{
						fieldLabel: localize("%tabTitle"),
						name: 'tab' + tabCount + '_title',
						allowBlank:false
					},{
						xtype: 'ckeditor', 
						fieldLabel: localize("%tabDescription"), 
						name: 'tab' + tabCount + '_text', 
						width: 550,
						height: 220,
						CKConfig: { 
							toolbar: 'Full',
							customConfig : 'ckeditor_cfg.js',
						}  					
					}]					                
				};
			},
			items: info
		}],								

		buttons: [{
			id:'btnFormSave',
			xtype:'button',
			text: localize("%submit"),
			handler:function(){
				form.getForm().submit({
					params:{
						id: _this._currentMarker.id,
						category_id: _this._currentMarker.categoryId,
						map_id: (isInt(_this._currentMarker.mapId)) ? _this._currentMarker.mapId : _this._currentMarker.mapId2,
						x: _this._currentMarker.getPosition().lat(),
						y: _this._currentMarker.getPosition().lng(),
						max_tab: tabCount - 1,
						user_id: user.id,
						action: 'edit',
						overlay_id: _this._currentOverlay
//                                        pointLat:place.Point.coordinates[1],
//                                        pointLng:place.Point.coordinates[0]
					},
					url:'ajax/marker_add.php',
					success: function(form, action) {
						Ext.MessageBox.show({
						   title: localize("%success"),
						   msg: localize("%addMarkerSuccessText"),
						   buttons: Ext.MessageBox.OK,
						   icon: Ext.MessageBox.INFO
						});
						//Ext.Msg.alert('Marcador eviado com sucesso&#46;&#60;BR&#62;Assim que aprovado&#44; voc&#234; ser&#225; notificado&#46;', action.result.msg);

						_this.closeAddNewMarkerDialog();
						_this.closeInfoWindow();
						tabCount = 0;
						_this._state = _this._STATE_IDLE;
					},
					failure: function(form, action) {
						switch (action.failureType) {
							case Ext.form.Action.CLIENT_INVALID:
								Ext.MessageBox.show({
									   title: localize("%err"),
									   msg: localize("%errMissing"),
									   buttons: Ext.MessageBox.OK,
									   icon: Ext.MessageBox.ERROR
								});
								//Ext.Msg.alert('Erro!', 'Todos os campos devem ser preenchidos&#46;');
								break;
							case Ext.form.Action.CONNECT_FAILURE:
								//Ext.Msg.alert('Erro!', 'Houve um erro de conex&#227;o com o servidor&#46; Por favor tente novamente');
								Ext.MessageBox.show({
									   title: localize("%err"),
									   msg: localize("%errConnection"),
									   buttons: Ext.MessageBox.OK,
									   icon: Ext.MessageBox.ERROR
								});										
								break;
							case Ext.form.Action.SERVER_INVALID:
								Ext.MessageBox.show({
									   title: localize("%err"),
									   msg: action.result.msg,
									   buttons: Ext.MessageBox.OK,
									   icon: Ext.MessageBox.ERROR
								});
								//Ext.Msg.alert('Erro!', action.result.msg);
								_this.closeAddNewMarkerDialog();
								_this.closeInfoWindow();
								tabCount = 0;
								_this._currentMarker = undefined;
								_this._state = _this._STATE_IDLE;
					   }
					}
				});
			}					        
		},{
			text: localize("%cancel"),
			handler: function() {
				_this.closeAddNewMarkerDialog();
				_this.closeInfoWindow();
				tabCount = 0;
				_this._currentMarker = undefined;
				_this._state = _this._STATE_IDLE;}
		}]
	});	
	

	// @TODO: FIRST EDIT NOT WORKING ON MULTI TAB MARKER
	try {
		form.render(_this.infoWindow.getContent());
		tabCount--;
	} catch (err) {
		_this.infoWindow.close();
		_this._currentMarker = undefined;
		_this._state = _this._STATE_IDLE;		
		alert(err);
	}
	
	google.maps.event.addListener(_this.infoWindow, 'closeclick', function() {
		_this._currentMarker = undefined;
		_this._state = _this._STATE_IDLE;			
	});
	_this._state = _this._STATE_EDIT_MARKER;
	return false;
}

GMap.prototype.markerDeleteForm = function(marker) {
	// DELETE FORM
	var doMarkerDelete = function(btn, text, cfg){
		if (btn == 'ok' && Ext.isEmpty(text)) {
			var newMsg = localize("%deletMarkerText") + "<br /><br /><span style=\"color:red\">" + localize("%deletMarkerText2") + "</span><br /><br />";
			Ext.Msg.show(Ext.apply({}, { msg: newMsg }, cfg));
			return;
		}			
		if (btn == 'ok') {
			var conn = new Ext.data.Connection();
			conn.request({
				url: 'ajax/marker_delete.php',
				method: 'POST',
				params: {"marker_id": marker.id, "user_id": user.id, "reason":text},
				success: function(responseObject) {
					Ext.MessageBox.show({
						   title: localize("%success"),
						   msg: localize("%addMarkerSuccessText"),
						   buttons: Ext.MessageBox.OK,
						   icon: Ext.MessageBox.INFO
					   });
					_this.closeInfoWindow();
					if (marker.categoryTypeId == 3) {
						marker.label.remove();
						marker.label = null;
					}					
					marker.setVisible(false);
					marker.isValid = 0;
				},
				failure: function() {
					//Ext.Msg.alert('Erro!', 'Occoreu um erro com o servidor&#46; Por favor, entre em contato com o Administrador');
					Ext.MessageBox.show({
						   title: localize("%err"),
						   msg: localize("%errConnection"),
						   buttons: Ext.MessageBox.OK,
						   icon: Ext.MessageBox.ERROR
					});
				}
			});
		} else {

		}
	};
	
	//Ext.MessageBox.prompt('Confirmação de movimentação', 'Por favor, descreva o motivo para a nova posição:', markerDragEnd);
	Ext.MessageBox.prompt({
			   title: localize("%deletMarkerTitle"),
			   msg: localize("%deletMarkerText") + "<br /><br />" + localize("%deletMarkerText2") + "<br /><br />",
			   width: 300,
			   buttons: Ext.MessageBox.OKCANCEL,
			   multiline: true,
			   fn: doMarkerDelete,
			   icon: Ext.MessageBox.WARNING,
			   closable:false
		   });	
}		

/**
 * Function to open a info window for markers
 *  Since we use singleton infoWindow, this should work everywhere
 * @param {} marker
 */
GMap.prototype.openInfoWindow = function(marker) {

	if (_this._currentMarker == undefined || _this._currentMarker.id != marker.id) {
		_this.closeInfoWindow();
		_this.closeAddNewMarkerDialog();
		
		// if it is a jumper_marker_id that we are trying to open, don't do anything.
		// Same thing if it's a marker with no content
		if ((marker.jump_marker_id != undefined && marker.jump_marker_id != 0) 
				|| (marker.tabText == undefined || marker.tabTitle == undefined)) {
			_this._currentMarker = marker;
			return;
		}						
		
		// Adding marker text
		if (marker.tabTitle.length > 1) {
//			_this.infoWindow = undefined;
			_this.infoWindow = new InfoBubble();		
			
			// @TODO: Change author to tab, not by marker
			for (var i = 0; i < marker.tabTitle.length; i++) {
				var div = document.createElement('DIV');
				div.innerHTML = marker.tabText[i] + "<p style='clear: both; text-align: right;'>Marker ID: " + marker.id + "<br />" + localize("%sentBy") + marker.tabUserName[i] + "</p>";
				
				if (user.id == marker.tabUserId[i] && marker.isValid) {
					var p = document.createElement('P');
					p.innerHTML = "[ " + localize("%delete") + " ]";
					p.style.cssFloat = "right";
					p.onclick = function() {_this.markerDeleteForm(marker);};
					div.appendChild(p);
					
					var p = document.createElement('P');
					p.innerHTML = "[ " + localize("%edit") + " ]";
					p.style.cssFloat = "right";
					p.onclick = function() {_this.markerEditForm(marker);};
					div.appendChild(p);
				}
		
				_this.infoWindow.addTab(marker.tabTitle[i], div);
			}								
		} else {
			var div = document.createElement('DIV');
			div.innerHTML =  marker.tabText[0] + "<p style='clear: both; text-align: right;'>Marker ID: " + marker.id + "<br />" + localize("%sentBy") + marker.tabUserName[0] + "</p>";
			
			_this.infoWindow = new google.maps.InfoWindow({
				content: div
			});
			
			if (user.id == marker.tabUserId[0] && marker.isValid) {
				var p = document.createElement('P')
				p.innerHTML = "[ " + localize("%delete") + " ]";
				p.style.cssFloat = "right";
				p.onclick = function() {_this.markerDeleteForm(marker);};
				div.appendChild(p);		
				
				var p = document.createElement('P')
				p.innerHTML = "[ " + localize("%edit") + " ]";
				p.style.cssFloat = "right";
				p.onclick = function() {_this.markerEditForm(marker);};
				div.appendChild(p);
			}
		}
	
		google.maps.event.addListener(_this.infoWindow, 'closeclick', function() {
			_this._currentMarker = undefined;
		});									
		
		// Opening marker infoWindow (singleton)
		_this.infoWindow.open(map,marker);
		_this._currentMarker = marker;		
	}
}


/**
 * Function to close a info window for markers
 *  Since we use singleton infoWindow, this should work everywhere
 * @param {} marker
 */
GMap.prototype.closeInfoWindow = function() {
	if (_this.infoWindow != undefined) {
		_this.infoWindow.close();
		_this._currentMarker = undefined;
	}
};

/**
 * @deprecated Only used if we don't used singletons 
 */
GMap.prototype.openInfoWindowById = function(markerToOpen) {
	this.closeInfoWindow();
	for (var i = 0; i < this._gmarkers.length; i++) {
		var marker = this._gmarkers[i];
		if (marker.id = markerToOpen) {
			this.openInfoWindow(marker);
			// Force exit to not loop more
			break;
		}
	}    	
};

GMap.prototype.getMarkerById = function(markerIdToGet) {
	// Go against all the markers array, shutting down any open markers
	for (var i = 0; i < _gmarkers.length; i++) {
		if (_gmarkers[i].id == markerIdToGet) {
			return _gmarkers[i];
		}
	}
	return null;
};

GMap.prototype.updateMarkerAfterLogin = function() {
	for (var i = 0; i < _gmarkers.length; i++) {
		_this.updateMarkerDraggable(_gmarkers[i], user.id == _gmarkers[i].userId);
	}
}

/**
 * Updates the marker after user has logged in (useful to update things like draggable and etc)
 */
GMap.prototype.updateMarkerDraggable = function(marker, draggable) {
	if (draggable) {
		marker.setDraggable(draggable);

		google.maps.event.addListener(marker, 'dragstart', function() {
			_this._markerLastPos = marker.getPosition();
			marker.originalPos = marker.getPosition();
			_this.closeInfoWindow();
			if (marker.categoryTypeId == 3 && marker.label != null) {
				marker.label.set('text', '');
			}
		});				
		
		google.maps.event.addListener(marker, 'drag', function() {
			if (_this.isInsideLimits(marker.getPosition())) {
				_this._markerLastPos = marker.getPosition();
			} else {
				marker.setPosition(_this._markerLastPos);
			}
		});	
		
		google.maps.event.addListener(marker, 'dragend', function() {
			if (_this.isInsideLimits(marker.getPosition())) {
				_this._markerLastPos = marker.getPosition();
			} else {
				marker.setPosition(_this._markerLastPos);
			}

			if (marker.categoryTypeId == 3 && marker.label != null) {
				marker.label.set('text', marker.getTitle());
			}
			

			var markerDragEnd = function(btn, text, cfg){
				if (btn == 'ok' && Ext.isEmpty(text)) {
					var newMsg = '<span style="color:red">' + localize("%moveMarkerText") + '</span>';
					Ext.Msg.show(Ext.apply({}, { msg: newMsg }, cfg));
					return;
				}			
				if (btn == 'ok') {
					var conn = new Ext.data.Connection();
					conn.request({
						url: 'ajax/marker_drag.php',
						method: 'POST',
						params: {"marker_id": marker.id, "x": marker.getPosition().lat(), "y": marker.getPosition().lng(), "user_id": user.id, "reason":text},
						success: function(responseObject) {
							Ext.MessageBox.show({
								   title: localize("%success"),
								   msg: localize("%addMarkerSuccessText"),
								   buttons: Ext.MessageBox.OK,
								   icon: Ext.MessageBox.INFO
							   });
						},
						failure: function() {
							//Ext.Msg.alert('Erro!', 'Occoreu um erro com o servidor&#46; Por favor, entre em contato com o Administrador');
							Ext.MessageBox.show({
								   title: localize("%err"),
								   msg: localize("%errConnection"),
								   buttons: Ext.MessageBox.OK,
								   icon: Ext.MessageBox.ERROR
							});
						}
					});
					marker.setPosition(marker.originalPos);
				} else {
					marker.setPosition(marker.originalPos);
				}
			};			
			   
			//Ext.MessageBox.prompt('Confirmação de movimentação', 'Por favor, descreva o motivo para a nova posição:', markerDragEnd);
			Ext.MessageBox.prompt({
					   title: localize("%moveMarkerTitle"),
					   msg: localize("%moveMarkerText"),
					   width: 300,
					   buttons: Ext.MessageBox.OKCANCEL,
					   multiline: true,
					   fn: markerDragEnd,
					   icon: Ext.MessageBox.QUESTION,
					   closable:false
				   });			
		});
	} else {
		// TODO: Implement removeListeners / setDraggable = false
	}
};


//****************************************************************************//
//** New Marker Functions 
//****************************************************************************//

/**
 * Used by the UI for the ajax submit of the new marker.
 * @return _currentNewMarker
 */
GMap.prototype.getNewMarkerInfo = function() {
	if (_this._state == _this._STATE_EDIT_MARKER) {
		return _this._currentMarker;
	} else {
		return _currentNewMarker;
	}
};

isInt=function (i) { return ((i % 1) == 0)? i:false; }

/**
 * Function to add a marker on the map according to the category id passed as parameter
 *  This will show form with information that must be entered in order to be processed.
 * @param {} categoryId
 */
GMap.prototype.addNewMarkerFromMenu = function(categoryId, divForm, categoryTypeId) {
	// If the new marker already exists, delete it and recreate a new one
	if (!(typeof(_currentNewMarker) == "undefined" || _currentNewMarker == null)) {
		this.closeAddNewMarkerDialog();
		this.closeInfoWindow();
	}
	
	if (!(typeof(_lastClickedPosition) == "undefined" || _lastClickedPosition == null)) {
		if (!_this.isInsideLimits(_lastClickedPosition)) {
			return;
		}
		
		var marker;
		
		if (categoryTypeId == 3) {
			var image = new google.maps.MarkerImage(this.markerURL + "_" + category[categoryId].img,
				new google.maps.Size(121, 49),
				new google.maps.Point(0,0),
				new google.maps.Point(60, 39));
			var shape = {
				coord: [1, 1, 120, 48],
				type: 'rect'
			};
			marker = new google.maps.Marker({
				position: _lastClickedPosition, 
				icon: image,
				shape: shape,
				map: map
			});
		} else {
			var icn = new google.maps.MarkerImage(this.markerURL + category[categoryId].img,
			  // This marker is 32 pixels wide by 32 pixels tall.
			  new google.maps.Size(32, 32),
			  // The origin for this image is 0,0.
			  new google.maps.Point(0,0),
			  // The anchor for this image is the center of the image itself.
			  new google.maps.Point(16, 16)
			);		
			
			marker = new google.maps.Marker({
				position: _lastClickedPosition, 
				map: map,
				icon: icn
			});
		}
		
		map.panTo(_lastClickedPosition);
	  
		marker.mapId = map.getMapTypeId();
		if (!isInt(marker.mapId)) {
			for (var i =0; i < _defaultMaps.length; i++) {
				if (marker.mapId == _defaultMaps[i].mapType) {
					marker.mapId = _defaultMaps[i].mapId;
					break;
				}
			}
		}
		marker.categoryId = categoryId;
		
		var infowindow = new google.maps.InfoWindow({
			content: divForm
		});
		
		google.maps.event.addListener(infowindow, 'closeclick', _this.closeAddNewMarkerDialog);
		
		marker.infowindow = infowindow;		
		marker.infowindow.open(map,marker);
		divForm.form.render(divForm);
					
		_gmarkers.push(marker);
		_lastClickedPosition = null;
		_currentNewMarker = marker;
	}
};

/**
 * Closes the new marker dialog and frees up memory
 */
GMap.prototype.closeAddNewMarkerDialog = function() {
	if (!(typeof(_currentNewMarker) == "undefined" || _currentNewMarker == null)) {
		_currentNewMarker.infowindow.close();
		_currentNewMarker.infowindow = null;		
		_currentNewMarker.setMap(null);
		_currentNewMarker.form = null;
		_currentNewMarker = null;
		tabCount = 0;
	}		
};



//****************************************************************************//
//** JumpMarker Functions 
//****************************************************************************//

GMap.prototype.showJumpMarkerConfirmation = function() {
	var doMarkerJump = function(btn, text, cfg) {
		if (btn == 'ok' && Ext.isEmpty(text)) {
			var newMsg = "<span style=\"color:red\">" + localize("%jumpMarkerTextConfirm") + "</span>";
			Ext.Msg.show(Ext.apply({}, { msg: newMsg }, cfg));
			return;
		}
		if (btn == 'ok') {
			var conn = new Ext.data.Connection();
			conn.request({
				url: 'ajax/marker_jump.php',
				method: 'POST',
				params: {	"user_id": user.id, 
							"reason":text,
							"title": _currentNewJumpMarkerOrig.getTitle(),
							"map_id": _this.getMapId(_currentNewJumpMarkerOrig.mapId),
							"overlay_id":_currentNewJumpMarkerOrig.overlayMap,
							"x":_currentNewJumpMarkerOrig.getPosition().lat(), 
							"y":_currentNewJumpMarkerOrig.getPosition().lng(),
							"marker_id2": (_currentNewJumpMarkerDest.id == undefined ? 0 : _currentNewJumpMarkerDest.id),							
							"title2": _currentNewJumpMarkerDest.getTitle(),
							"map_id2":_this.getMapId(_currentNewJumpMarkerDest.mapId),
							"overlay_id2":_currentNewJumpMarkerDest.overlayMap,
							"x2":_currentNewJumpMarkerDest.getPosition().lat(), 
							"y2":_currentNewJumpMarkerDest.getPosition().lng(),
							"category_id": _currentNewJumpMarkerOrig.categoryId
						},
				success: function(responseObject) {
					Ext.MessageBox.show({
						   title: localize("%success"),
						   msg: localize("%addMarkerSuccessText"),
						   buttons: Ext.MessageBox.OK,
						   icon: Ext.MessageBox.INFO
					   });
					   
					_this._state == _this._STATE_IDLE;
					_this.clearAddNewJumperMarker();
				},
				failure: function() {
					//Ext.Msg.alert('Erro!', 'Occoreu um erro com o servidor&#46; Por favor, entre em contato com o Administrador');
					Ext.MessageBox.show({
						   title: localize("%err"),
						   msg: localize("%errConnection"),
						   buttons: Ext.MessageBox.OK,
						   icon: Ext.MessageBox.ERROR
					});
					
					_this._state == _this._STATE_IDLE;
					_this.clearAddNewJumperMarker();
				}
			});
		} else {
			_this._state == _this._STATE_IDLE;
			_this.clearAddNewJumperMarker();
		}
	};

	Ext.MessageBox.prompt({
			   title: localize("%jumpMarkerTitleConfirm"),
			   msg: localize("%jumpMarkerTextConfirm"),
			   width: 300,
			   buttons: Ext.MessageBox.OKCANCEL,
			   multiline: true,
			   fn: doMarkerJump,
			   icon: Ext.MessageBox.QUESTION,
			   closable:false
	});

}

GMap.prototype.addDestinationJumpMarker = function(vPosition) {
	var newMarkerJumpDest = function(vBtn, vText, vCfg) {
		if (vBtn == 'ok' && Ext.isEmpty(vText)) {
			var newMsg = "<span style=\"color:red\">" + localize("%jumpMarkerTextInfo3") + "</span>";
			Ext.Msg.show(Ext.apply({}, { msg: newMsg }, vCfg));
			return;
		}
		if (vBtn == 'ok') {
			var marker = new google.maps.Marker({
				position: vPosition, 
				map: map,
				title: vText,
				icon: _this.markerURL + category[_currentNewJumpMarkerOrig.categoryId].img
			});

			map.panTo(vPosition);
			marker.mapId = map.getMapTypeId();
			marker.categoryId = _currentNewJumpMarkerOrig.categoryId;
			marker.overlayMap = _this._currentOverlay;
			marker.isValid = true;
		
			_lastClickedPosition = null;
			_currentNewJumpMarkerDest = marker;
			_gmarkers.push(marker);

			_this.showJumpMarkerConfirmation();
		} else {
			_this._state == _this._STATE_IDLE;
			_this.clearAddNewJumperMarker();
		}
	}
	Ext.MessageBox.prompt(localize("%jumpMarkerTitleInfo"), localize("%jumpMarkerTextInfo3"), newMarkerJumpDest);
}

GMap.prototype.clearAddNewJumperMarker = function() {
	if (!(typeof(_currentNewJumpMarkerOrig) == "undefined" || _currentNewJumpMarkerOrig == null)) {
		_currentNewJumpMarkerOrig.setMap(null);
		_currentNewJumpMarkerOrig = null;
	}
	
	if (!(typeof(_currentNewJumpMarkerDest) == "undefined" || _currentNewJumpMarkerDest == null)) {	
		if ((typeof(_currentNewJumpMarkerDest.id) == "undefined" || _currentNewJumpMarkerDest.id == null)) {
			_currentNewJumpMarkerDest.setMap(null);
			_currentNewJumpMarkerDest = null;	
		}
	}
	
	_this._state = _this._STATE_IDLE;
};

GMap.prototype.addNewJumpMarker = function(categoryId, markerTitle, source) {
	if (!(typeof(_lastClickedPosition) == "undefined" || _lastClickedPosition == null)) {
		this._state = this._STATE_ADD_NEW_MARKER_JUMP;
		
		if (!_this.isInsideLimits(_lastClickedPosition)) {
			return;
		}
		
		var marker = new google.maps.Marker({
			position: _lastClickedPosition, 
			map: map,
			title: markerTitle,
			icon: this.markerURL + category[categoryId].img
		});

		map.panTo(_lastClickedPosition);
		
//		marker.mapId = _this.getMapId(map.getMapTypeId());
		marker.mapId = map.getMapTypeId();
		//alert(map.getMapTypeId());
		/*if (!isInt(marker.mapId)) {
			for (var i =0; i < _defaultMaps.length; i++) {
				if (marker.mapId == _defaultMaps[i].mapType) {
					marker.mapId = _defaultMaps[i].mapId;
					break;
				}
			}
		}*/
		
		marker.categoryId = categoryId;
		marker.overlayMap = this._currentOverlay;
		marker.isValid = true;
	
		_lastClickedPosition = null;
		_currentNewJumpMarkerOrig = marker;
		_gmarkers.push(marker);
		
		Ext.MessageBox.prompt({
			title: localize("%jumpMarkerTitleInfo"),
			msg: localize("%jumpMarkerTextInfo2") + "<br /><br />",
			buttons: Ext.MessageBox.OK,
			icon: Ext.MessageBox.INFO
		});
	} else {
		this._state = this._STATE_IDLE;
	}
}