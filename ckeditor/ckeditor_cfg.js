/*
Copyright (c) 2003-2011, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

CKEDITOR.editorConfig = function( config )
{
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
config.toolbar_Full =
 [
  	{ name: 'styles',		items : [ 'Format','Font','FontSize' ] },
 	{ name: 'colors',		items : [ 'TextColor','BGColor' ] },
	{ name: 'basicstyles',	items : [ 'Bold','Italic','Underline','Strike','-','RemoveFormat' ] },		
	'/',
 	'/',
 	{ name: 'paragraph',	items : [ 'NumberedList','BulletedList','-','Outdent','Indent','-','Blockquote','CreateDiv','-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-','BidiLtr','BidiRtl' ] },
 	{ name: 'links',		items : [ 'Link','Unlink','Anchor' ] },
 	{ name: 'insert',		items : [ 'Image','Flash','Table' ] },
 	'/',
 	{ name: 'clipboard',	items : [ 'Cut','Copy','Paste','PasteText','PasteFromWord','-','Undo','Redo' ] },
 	{ name: 'tools',		items : [  'Source', 'ShowBlocks','Maximize','-','About' ] }
 ];	
 
config.toolbar_Basic =
	[
		['Bold', 'Italic', '-', 'NumberedList', 'BulletedList', '-', 'Link', 'Unlink','-','Maximize','-','About']
	];
};
