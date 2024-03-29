<!DOCTYPE html>
<?php 
	if (isset($_GET['map'])) {
		$map_container = $_GET['map'];
		session_start("map");
		
		$_SESSION["map_container"] = $map_container;
		$_SESSION["last_updated"] = "1800-01-01 00:00:00";
	} else {
		die("Precisa fornecer um mapa");
	}
?>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta http-equiv="Content-Language" content="en-us">
		<title>GMaps</title>

		<script type="text/javascript" src="js/json2.min.js?<?php echo filemtime('js/json2.min.js'); ?>"></script>
		<script type="text/javascript" src="js/l10n.min.js?<?php echo filemtime('js/l10n.min.js'); ?>"></script>
		<script type="text/javascript" src="js/localizations.js?<?php echo filemtime('js/localizations.js'); ?>"></script>
		
		<!-- CSS -->
		<link rel="stylesheet" type="text/css" href="http://cdn.sencha.io/ext-4.1.0-gpl/resources/css/ext-all.css" />
		<link rel="stylesheet" type="text/css" href="markers.php?<?php echo filemtime('markers.php'); ?>" />
	    <link rel="stylesheet" type="text/css" href="map.css?<?php echo filemtime('map.css'); ?>" />
		<!-- ENDCSS -->

		<!-- LIBS --> 
		<script type="text/javascript" charset="utf-8" src="http://cdn.sencha.io/ext-4.1.0-gpl/ext-all.js"></script>
		<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
		<script type="text/javascript" src="http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobubble/src/infobubble-compiled.js"></script>
		<script type="text/javascript" src="http://google-maps-utility-library-v3.googlecode.com/svn/tags/markerclustererplus/2.0.9/src/markerclusterer_packed.js"></script>
		<script type="text/javascript" src="http://google-maps-utility-library-v3.googlecode.com/svn/tags/markerwithlabel/1.1.5/src/markerwithlabel.js"></script>		
		<!-- ENDLIBS --> 
	 
		<!-- CSS -->
		<script src="js/EuclideanProjection.js?<?php echo filemtime('js/EuclideanProjection.js'); ?>"></script>		
		<script src="js/FlatMapType.js?<?php echo filemtime('js/FlatMapType.js'); ?>"></script>		
		<script src="js/Map.js?<?php echo filemtime('js/Map.js'); ?>"></script>
		<script src="js/Main.js?<?php echo filemtime('js/Main.js'); ?>"></script>
		
		
		<script type="text/javascript" src="ckeditor/ckeditor.js?<?php echo filemtime('ckeditor/ckeditor.js'); ?>"></script>
	</head>

	<body onload="">
	<script type="text/javascript">
	if (location.hash) {
		String.locale = location.hash.substr(1);	
	}

	var localize = function (string, fallback) {
		var localized = string.toLocaleString();
		
		if (localized !== string) {
			return localized;
		} else {
			var l = String.locale;
			String.locale = "en";
			localized = string.toLocaleString();
			String.locale = l;
			if (localized !== string) {
				return localized;
			} else {
				return string;
			}
		}
	};	

	</script>
	</body>

</html>
