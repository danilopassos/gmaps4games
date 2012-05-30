// Prototype responsible for map info
function FlatMapType(id, name, alt, tileURL, tileExt,img404) {
	this.id = id;
	this.name = name;
	this.alt = alt;
	this.tileURL = tileURL;
	this.tileExt = tileExt;
	this.isPng = (tileExt == "png");
	this.img404 = img404;
}

FlatMapType.prototype.tileSize = new google.maps.Size(256,256);

FlatMapType.prototype.maxZoom = 8;

FlatMapType.prototype.isPng = true;

FlatMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
	var div = ownerDocument.createElement('DIV');

	var upperLimit = Math.pow(2, zoom) - 1;
	// Force exit for tiled maps
	if (coord.x < 0 || coord.y < 0 || coord.x > upperLimit || coord.y > upperLimit ) {
		return div;
	}
	div.style.width = this.tileSize.width + 'px';
	div.style.height = this.tileSize.height + 'px';
	div.style.backgroundImage = "url(tiles/getTile.php?i=" + this.tileURL + zoom + "_" + coord.x + "_" + coord.y + "." + this.tileExt + "&m=" + this.img404 + ")";
	div.area = true;
	return div;
};

FlatMapType.prototype.releaseTile = function() {
}

FlatMapType.prototype.projection = new EuclideanProjection();