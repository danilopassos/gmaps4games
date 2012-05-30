// Author: Ben Appleton
// http://www.google.com/url?sa=D&q=http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/50421ba5c4dd307b/&usg=AFQjCNGDfrt2FDWu0fD_fGqndbGmDspxYg

// Setup the new type of projection
function EuclideanProjection() {
	var EUCLIDEAN_RANGE = 256;
	this.pixelOrigin_ = new google.maps.Point(EUCLIDEAN_RANGE / 2, EUCLIDEAN_RANGE / 2);
	this.pixelsPerLonDegree_ = EUCLIDEAN_RANGE / 360;
	this.pixelsPerLonRadian_ = EUCLIDEAN_RANGE / (2 * Math.PI);
	this.scaleLat = 18;// Height
	this.scaleLng = 18;	// Width
	this.offsetLat = 0;	// Height
	this.offsetLng = 0;	// Width
};

EuclideanProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
	//var me = this;
	var point = opt_point || new google.maps.Point(0, 0);
	var origin = this.pixelOrigin_;
	point.x = (origin.x + (latLng.lng() + this.offsetLng ) * this.scaleLng * this.pixelsPerLonDegree_);
	// NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
	// 89.189.  This is about a third of a tile past the edge of the world tile.
	point.y = (origin.y + (-1 * latLng.lat() + this.offsetLat ) * this.scaleLat * this.pixelsPerLonDegree_);
	return point;
};

EuclideanProjection.prototype.fromPointToLatLng = function(point) {
	var me = this;	
	var origin = me.pixelOrigin_;
	var lng = (((point.x - origin.x) / me.pixelsPerLonDegree_) / this.scaleLng) - this.offsetLng;
	var lat = ((-1 *( point.y - origin.y) / me.pixelsPerLonDegree_) / this.scaleLat) - this.offsetLat;
	return new google.maps.LatLng(lat , lng, true);
};

EuclideanProjection.prototype.getProjectionName = function() {
	return "Euclidean";
};