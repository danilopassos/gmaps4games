function gup(name) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if (results == null) {
		return "";
	} else {
		return results[1];
	}
}

//Ext.require(['*'])
Ext.require([
	'Ext.Viewport.*',
	'Ext.data.*',
	'Ext.form.*',
	'Ext.tree.Panel.*',
	'Ext.data.Model.*',
	'Ext.menu.Menu.*',
	'Ext.tab.Tab.*',
	'Ext.MessageBox*',
	'Ext.TaskManager.*',
	'Ext.ComponentQuery.*'
]);


Ext.onReady(function() {


	//*****************************************************************//
	// CONFIG USER
    //*****************************************************************//
	var mapLoad = gup("map");
	var markerLoad = gup("marker");
	var zoomLoad = gup("zoom");
	
	var settingsTreeStore = Ext.create('Ext.tree.Panel', {
		id: 'user-tree-panel',
		title: localize("%userMarkerSettingsTitle"),
		width: '100%',
		height: '84px',
		useArrows:false,
		autoScroll:false,
		animate:false,
		enableDD:false,
		containerScroll: false,
		rootVisible: false,
		root: {
			id: "userSettingRoot",
			expanded: true,
			children: [
				{
					text: localize("%userMarkerSettingsMyMarkers"),
					id: "showOnlyMyMarkers",
					leaf: false,
					expanded: true,
					checked: false,
					children: [
						{
							id: "showMyApproved",
							checked: false,
							text: localize("%userMarkerSettingsApproved"),
							leaf: true
						},
						{
							id: "showMyNonApproved",
							checked: false,
							text: localize("%userMarkerSettingsNotApproved"),
							leaf: true
						} 
					]
				}
			]
		},
		listeners: {
			'checkchange': function(node, checked){
				var nId = node.id.split("-");
				gmap.setUserOptions(nId[nId.length-1], checked);
			
				for (var i = 0; i < node.childNodes.length; i++) {
					toggleCheck(node.childNodes[i],checked);
					// @TODO: This shouldn't exist, since it's on the listener already... here as a workaround
					var nId = node.childNodes[i].id.split("-");
					gmap.setUserOptions(nId[nId.length-1], checked);
				}
			}
		}
	});	



	
	var tabCount = 0;
	var ctxMenu;
	var categoryTree;
	
	/**************************************************** 
	* CKEditor Extension 
	* http://www.sencha.com/forum/showthread.php?132638-CKEDITOR-with-EXTJS-4
	*****************************************************/ 
	Ext.define('Ext.ux.CKeditor',{
		extend:'Ext.form.field.TextArea',
		alias:'widget.ckeditor',
		initComponent:function(){
			this.callParent(arguments);
			this.on('afterrender',function(){
				Ext.apply(this.CKConfig ,{
					height:this.getHeight()
				});
				this.editor = CKEDITOR.replace(this.inputEl.id,this.CKConfig);
				this.editorId =this.editor.id;
//				this.initialHeight = this.getHeight();
//				this.initialWidth = this.getWidth();
			},this);
		},
		onRender:function(ct, position){
			if(!this.el){
				this.defaultAutoCreate ={
					tag:'textarea',
					autocomplete:'off'
				};
			}
			this.callParent(arguments)
		},
		setValue:function(value){
			this.callParent(arguments);
			if(this.editor){
				this.editor.setData(value);
			}
		},
		getRawValue:function(){
			if(this.editor){
				return this.editor.getData()
			}else{
				return ''
			}
		}
	});

	CKEDITOR.on('instanceReady',function(e){
		
		var o = Ext.ComponentQuery.query('ckeditor[editorId="'+ e.editor.id +'"]'),
		comp = o[0];
		
		//alert(comp.initialHeight + " " + comp.getHeight());
		e.editor.resize(comp.getWidth(), 220);
		// @TODO - BUG ... Hardcoding the value 220 because it's not getting it correctly.
		//e.editor.resize(comp.initialWidth, comp.initialHeight);
		// This was changed because extjs 4.1.0 was not getting the correct height assigned in the code (it was getting the outer div height)
		//e.editor.resize(comp.getWidth(), comp.getHeight())
		
		/* @TODO: http://dev.ckeditor.com/ticket/7038 Wait for new release with new feature, so we can set Basic toolbar and change to Full once maximized */
		/*e.editor.on('beforeCommandExec',function(e){
				if (e.data.name != 'maximize') {
					return;
				}
				if (e.editor.config.toolbar == "Basic" ) {
					e.editor.setToolbar( CKEDITOR.config.toolbar_Full );
				} else {
					e.editor.setToolbar( CKEDITOR.config.toolbar_Basic );
				}				
			});
		*/
		comp.on('resize',function(c,adjWidth,adjHeight){
			c.editor.resize(adjWidth, adjHeight)
		})
	});

	
	/**
	 * Function : dump()
	 * Arguments: The data - array,hash(associative array),object
	 *    The level - OPTIONAL
	 * Returns  : The textual representation of the array.
	 * This function was inspired by the print_r function of PHP.
	 * This will accept some data as the argument and return a
	 * text that will be a more readable version of the
	 * array/hash/object that is given.
	 * Docs: http://www.openjs.com/scripts/others/dump_function_php_print_r.php
	 */
	function dump(arr,level) {
		var dumped_text = "";
		if(!level) level = 0;
		
		//The padding given at the beginning of the line.
		var level_padding = "";
		for(var j=0;j<level+1;j++) level_padding += "    ";
		
		if(typeof(arr) == 'object') { //Array/Hashes/Objects 
			for(var item in arr) {
				var value = arr[item];
				
				if(typeof(value) == 'object') { //If it is an array,
					dumped_text += level_padding + "'" + item + "' ...\n";
					dumped_text += dump(value,level+1);
				} else {
					dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
				}
			}
		} else { //Stings/Chars/Numbers etc.
			dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
		}
		return dumped_text;
	}	
	

	// Main View
    Ext.create('Ext.Viewport', {
        layout: {
            type: 'border',
            padding: 5
        },
        defaults: {
            split: true
        },
        items: [
/*		{
			id:'north-container',
            region: 'north',
            collapsible: true,
            title: 'North',
            split: true,
            height: 100,
            html: 'north'
        },{
            id:'west-container',
			region: 'west',			
            collapsible: true,
            title: 'Starts at width 30%',
            split: true,
            width: '30%',
            html: 'west<br>I am floatable'
		},*/{
			id:'map_canvas',
			header: false,
			region:'center',
			margins: 'auto',
			xtype: 'box',
			autoEl: {
				tag: 'div',
				id: 'map_canvas',
				html: localize("%gmapNotSupported")
			}
		},{
			id:'east-container',
            region: 'east',
            collapsible: true,
            floatable: true,
            split: true,
            width: 250,
			//height: '100%',
            title:  localize("%eastPanel"),
			autoScroll: true
        }/*,{
            region: 'south',
            collapsible: true,
			collapsed: true,
            split: true,
            height: 200,
            title: 'South',
            layout: {
                type: 'border',
                padding: 5
            },
            items: [{
				id: 'south-container',
                title: 'South Central',
                region: 'center',
                html: 'South Central'
            }/*,{
                title: 'South Eastern',
                region: 'east',
                flex: 1,
                html: 'South Eastern',
                split: true,
                collapsible: true
            },{
                title: 'South Western',
                region: 'west',
                flex: 1,
                html: 'South Western<br>I collapse to nothing',
                split: true,
                collapsible: true,
                collapseMode: 'mini'
            }]
        }*/]
    });
	
    //define as variáveis de cada painel para serem usadas
	erc = Ext.getCmp('east-container');
	//src = Ext.getCmp('south-container');

    //limpa os paineis
	erc.removeAll();
	//src.removeAll();
	

	//*****************************************************************//
    // TREE VIEW
    //*****************************************************************//
    var treeStore = Ext.create('Ext.data.TreeStore', {
        proxy: {
		type: 'ajax',
		/* TODO: category tree deve pegar da sessão ou do GET*/
		url: 'ajax/get_category_tree.php?map_container=' + mapLoad
        }
    });


	categoryTree = Ext.create('Ext.tree.Panel', {
		id: 'category-tree-panel',
		store: treeStore,
		title: localize("%categories"),
		width: '100%',
		//height: '100%',
		useArrows:true,
		autoScroll:true,
		//autoScroll: false,
		scroll: true,
		animate:true,
		//deferredRender: true,
		enableDD:true,
		containerScroll: true,
		rootVisible: false,		
		listeners: {
			'checkchange': function(node, checked){
				var nId = node.id.split("-");
				gmap.doUpdateCategoryVisibility(nId[nId.length-1], checked);
			
				for (var i = 0; i < node.childNodes.length; i++) {
					toggleCheck(node.childNodes[i],checked);
					// @TODO: This shouldn't exist, since it's on the listener already... here as a workaround
					var nId = node.childNodes[i].id.split("-");
					gmap.doUpdateCategoryVisibility(nId[nId.length-1], checked);
				}
			}
		},
	});

	
    //function to check/uncheck all the child node.
    function toggleCheck(node,isCheck) {
        if(node){
            var args=[isCheck];
            node.cascadeBy(function(){
                c=args[0];
				this.set('checked', c);
            },null,args);
        }
    };
		
	//*****************************************************************//
    // MAPS
    //*****************************************************************//
	Ext.define('MapModels', {
		extend: 'Ext.data.Model',
		fields: [
			{name : 'map_id', type: 'int'},
			{name : 'map_type_name', type : 'string'},
			{name : 'google_default', type : 'boolean'},
			{name : 'name', type : 'string'},
			{name : 'tile_url', type : 'string'},
			{name : 'tile_ext', type : 'string'},
			{name : 'marker_url', type : 'string'},
			{name : 'marker_ext', type : 'string'},
			{name : 'map_overlay_id', type : 'int'},
			{name : 'map_overlay_name', type : 'string'},
			{name : 'max_zoom', type : 'int'},
			{name : 'map_copyright', type : 'string'},
			{name : 'map_mapper', type : 'string'},
			{name : 'default_map', type : 'boolean'},
			{name : 'default_zoom', type : 'int'},
			{name : 'img404', type : 'string'},
			{name : 'empty_map', type : 'boolean'}
		],
		proxy: {
			type: 'rest',
			url : '/users',
			reader: {
				type: 'json',
				root: 'users'
			}
		}		
	});

	var mapStore = Ext.create('Ext.data.Store', {
		id: 'mapStore',
		model: 'MapModels',
		proxy: {
			/* envia parametros de ordenação separadamente 
			(o padrão é sort	[{"property":"id","direction":"ASC"}])*/
			simpleSortMode: true, 
			type: 'ajax',
			api: {
				// link que retorna os dados a serem exibidos na grid
				read: 'ajax/get_map.php?map_container=' + mapLoad
			},
			reader: {
				type: 'json',
				root: 'data',
				successProperty: 'success'
			},
			extraParams: {
				parametro: 'param'
			},
			actionMethods: {
				//opcional
				read: 'POST'
			}
		},
		listeners: {
			 scope: this,
			 load: function(mapStore, records){
				gmap.constructor();
				mapStore.data.each(function(){
					gmap.addMap(this.data);
				});
				mapLayerStore.load();
			}
		}			
	});
	
	//*****************************************************************//
    // MAP LAYERS
    //*****************************************************************//
	Ext.define('MapLayerModels', {
		extend: 'Ext.data.Model',
		fields: [
			{name : 'map_layer_id', type: 'int'},
			{name : 'map_id', type : 'string'},
			{name : 'name', type : 'string'},
			{name : 'tile_url', type : 'string'},
			{name : 'tile_ext', type : 'string'},
			{name : 'img404', type : 'string'},				
			{name : 'title', type : 'string'},
			{name : 'control_visible', type : 'int'},
			{name : 'control_checked', type : 'int'},
			{name : 'type', type : 'string'}
		],
		proxy: {
			type: 'rest',
			url : '/users',
			reader: {
				type: 'json',
				root: 'users'
			}
		}		
	});

	var mapLayerStore = Ext.create('Ext.data.Store', {
		id: 'mapLayerStore',
		model: 'MapLayerModels',
		proxy: {
			simpleSortMode: true, 
			type: 'ajax',
			api: {
				read: 'ajax/get_map_layers.php?map_container=' + mapLoad
			},
			reader: {
				type: 'json',
				root: 'data',
				successProperty: 'success'
			},
			extraParams: {
				parametro: 'param'
			},
			actionMethods: {
				read: 'POST'
			}
		},
		listeners: {
			 scope: this,
			 load: function(mapLayerStore, records){
				mapLayerStore.data.each(function(){
					gmap.addMapLayer(this.data);
				});
				gmap.buildMap();		
				categoryStore.load();
				userStore.load();
			}
		}			
	});	
	
	//*****************************************************************//
    // MARKERS
    //*****************************************************************//
	Ext.define('MapMarkerModel', {
		extend: 'Ext.data.Model',
		fields: [
			{name : 'marker_id', type: 'int'},
			{name : 'map_id', type : 'int'},
			{name : 'marker_category_id', type : 'int'},
			{name : 'marker_category_type_id', type : 'int'},
			{name : 'user_id', type : 'int'},
			{name : 'user_name', type : 'string'},
			{name : 'name', type : 'string'},
			{name : 'desc', type : 'string'},
			{name : 'x', type : 'float'},
			{name : 'y', type : 'float'},
			{name : 'jump_marker_id', type : 'int'},
			{name : 'tab_id', type : 'string'},	
			{name : 'tab_title', type : 'string'},	
			{name : 'tab_text', type : 'string'},
			{name : 'tab_user_id', type : 'string'},	
			{name : 'tab_user_name', type : 'string'},		
			{name : 'visible', type : 'int'},
			{name : 'overlay_id', type : 'int'},
			{name : 'global', type : 'int'},
		],
		proxy: {
			type: 'rest',
			url : '/users',
			reader: {
				type: 'json',
				root: 'users'
			}
		}		
	});
	
	var markerStore = Ext.create('Ext.data.Store', {
		id: 'markerStore',
		model: 'MapMarkerModel',
		proxy: {
			/* envia parametros de ordenação separadamente 
			(o padrão é sort	[{"property":"id","direction":"ASC"}])*/
			simpleSortMode: true, 
			type: 'ajax',
			api: {
				// link que retorna os dados a serem exibidos na grid
				read: 'ajax/get_markers.php?map_container=' + mapLoad
			},
			reader: {
				type: 'json',
				root: 'data',
				successProperty: 'success'
			},
			extraParams: {
				parametro: 'param'
			},
			actionMethods: {
				//opcional
				read: 'POST'
			}
		},
		listeners: {
			 scope: this,
			 load: function(markerStore, records){
				var hasData = false;
				markerStore.data.each(function(){
					gmap.addMarkerFromDB(this.data);
					hasData = true;
				});
				if (markerLoad) { gmap.jumpToMarker(markerLoad, zoomLoad); markerLoad = null; zoomLoad = null; };
				if (hasData) { gmap.doUpdateMarkerCluster(); };
			}
		}			
	});	
	

	//*****************************************************************//
    // CATEGORIES
    //*****************************************************************//	
	var subCategoryMenu = new Array();
	var categoryMenu = new Ext.menu.Menu({
		id: 'Category'
	});		
	
	// Extensão para colocar botão de adiconar TAB no topo
	Ext.ux.AddTabButton = (function() {

		function onTabPanelRender()
		{
			this.addTab = new Ext.tab.Tab({
				text: '&#160',
//				icon: 'resources/drop-add.gif',
				iconCls: 'addBtn',
				closable: false
			});
			
			this.onAddTabClick = function() {
				this.setActiveTab(this.add(this.createTab? this.createTab() : {
					title: 'New Tab'
				}));
			}

			this.addTab.on({
				click: this.onAddTabClick,
				scope: this
			});

			this.getTabBar().insert(999, this.addTab);
		}

		return {
			init: function(tp) {
				if (tp instanceof Ext.TabPanel) {
					tp.onRender = Ext.Function.createSequence(tp.onRender, onTabPanelRender);
				}
			}
		};
	})();  	
	
	Ext.override(Ext.form.HtmlEditor, {
		defaultValue: '<!-- Will be removed by the editor -->',
		cleanDefaultValue: true,
		cleanHtml: function(html) {
				html = String(html);
				if(Ext.isWebKit){
					html = html.replace(/\sclass="(?:Apple-style-span|khtml-block-placeholder)"/gi, '');
				}
				if(this.cleanDefaultValue){
					html = html.replace(new RegExp(this.defaultValue), '');
				}
				return html;
			}
	});	
	
	Ext.define('MapCategoriesModels', {
		extend: 'Ext.data.Model',
		fields: [
			{name : 'marker_category_id', type: 'int'},
			{name : 'marker_category_parent_id', type : 'int'},
			{name : 'name', type : 'string'},
			{name : 'checked', type : 'boolean'},
			{name : 'marker_category_type_id', type : 'int'},
			{name : 'img', type : 'string'}
		],
		proxy: {
			type: 'rest',
			url : '/users',
			reader: {
				type: 'json',
				root: 'users'
			}
		}		
	});

	var categoryStore = Ext.create('Ext.data.Store', {
		id: 'categoryStore',
		model: 'MapCategoriesModels',
		proxy: {
			/* envia parametros de ordenação separadamente 
			(o padrão é sort	[{"property":"id","direction":"ASC"}])*/
			simpleSortMode: false, 
			type: 'ajax',
			api: {
				// link que retorna os dados a serem exibidos na grid
				read: 'ajax/get_categories.php?map_container=' + mapLoad
			},
			reader: {
				type: 'json',
				root: 'data',
				successProperty: 'success'
			},
			extraParams: {
				parametro: 'param'
			},
			actionMethods: {
				//opcional
				read: 'POST'
			}
		},
		listeners: {
			 scope: this,
			 load: function(categoryStore, records){
				categoryStore.data.each(function(){
					gmap.addCategory(this.data);
					if (this.data.marker_category_parent_id != 0) {
						if (subCategoryMenu[this.data.marker_category_parent_id] == undefined) {
							subCategoryMenu[this.data.marker_category_parent_id] = new Ext.menu.Menu({id: "sub"+this.data.marker_category_parent_id});
						}
						
						switch(this.data.marker_category_type_id) {
							case 1:
							case 3:
								function clickHandler(item, e) {
									var div = document.createElement("div");    
									
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
													value: '<img class="x-tree-icon x-tree-icon-leaf icnMrkr icnMrkr' + item.id + '" src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="> ' + item.text
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
													title: localize("%tab") + " "  + tabCount,
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
															height: 220,
															customConfig : 'ckeditor_cfg.js',
								//													toolbarStartupExpanded : false
														}  					
													}]					                
												};
											},
											items: [{
												title: localize("%information"),
												anchor:'95%',
												xtype: 'displayfield',
												name: 'displayFieldMarkerCategory',
												value: localize("%addMarkerHelper")
											}]
										}],								

										buttons: [{
											id:'btnFormSave',
											xtype:'button',
											text: localize("%submit"),
											handler:function(){
												form.getForm().submit({
													params:{
														category_id: gmap.getNewMarkerInfo().categoryId,
														map_id: gmap.getNewMarkerInfo().mapId,
														x: gmap.getNewMarkerInfo().getPosition().lat(),
														y: gmap.getNewMarkerInfo().getPosition().lng(),
														max_tab: tabCount,
														user_id: gmap.getUser().id,
														overlay_id: gmap.getCurrentOverlayId(),
														action: 'add'
								//                                        pointLat:place.Point.coordinates[1],
								//                                        pointLng:place.Point.coordinates[0]
													},
													url:'ajax/marker_add.php',
													success: function(form, action) {
														//Ext.Msg.alert('Marcador eviado com sucesso.<BR>Assim que aprovado, você será notificado.', action.result.msg);
														Ext.MessageBox.show({
														   title: localize("%success"),
														   msg: localize("%addMarkerSuccessText"),
														   buttons: Ext.MessageBox.OK,
														   icon: Ext.MessageBox.INFO
														});												

														gmap.closeAddNewMarkerDialog();  
														tabCount = 0;
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
																break;
															case Ext.form.Action.CONNECT_FAILURE:
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
																gmap.closeAddNewMarkerDialog();
																tabCount = 0;
													   }
													}
												});
											}					        
										},{
											text: localize("%cancel"),
											handler: function() {gmap.closeAddNewMarkerDialog(); tabCount = 0;}
										}]
									});

									div.form = form;

									gmap.addNewMarkerFromMenu(item.id, div, item.categoryTypeId);
								}

								subCategoryMenu[this.data.marker_category_parent_id].add({
											id:this.data.marker_category_id + '',
											text: this.data.name,
											categoryTypeId: this.data.marker_category_type_id,
											icon:gmap.getMarkerURL() + gmap.getCategory(this.data.marker_category_id).img,
											handler: clickHandler
								});
								break;
							case 2:
								function clickHandler2(item, e) {
									var newMarkerJump = function(btn, text, cfg) {
										if (btn == 'ok' && Ext.isEmpty(text)) {
											var newMsg = "<span style=\"color:red\">" + localize("%jumpMarkerTextInfo1") + "</span>";
											Ext.Msg.show(Ext.apply({}, { msg: newMsg }, cfg));
											return;
										}
										if (btn == 'ok') {
											gmap.addNewJumpMarker(item.id, text);
										}
									}

									Ext.MessageBox.prompt(localize("%jumpMarkerTitleInfo"), localize("%jumpMarkerTextInfo1"), newMarkerJump);
									/*Ext.MessageBox.prompt({
										title: localize("%jumpMarkerTitleInfo"),
										msg: localize("%jumpMarkerTextInfo") + "<br /><br />" + localize("%jumpMarkerTextInfo2") + "<br /><br />",
										buttons: Ext.MessageBox.OKCANCEL,
										multiline: true,
										fn: newMarkerJump,
										icon: Ext.MessageBox.INFO
									});*/
								}
								subCategoryMenu[this.data.marker_category_parent_id].add({id:this.data.marker_category_id  + '',text: this.data.name,  icon:gmap.getMarkerURL() + gmap.getCategory(this.data.marker_category_id).img, handler: clickHandler2});
								break;
						}						
					} else {
						categoryMenu.add({icon:gmap.getMarkerURL() + gmap.getCategory(this.data.marker_category_id).img,id:this.data.marker_category_id + '',text: this.data.name, menu:subCategoryMenu[this.data.marker_category_id]});
					}
		//        	categoryMenu.add({})					
				});
				//markerStore.load();
				Ext.TaskManager.start(task);
			}
		}			
	});	



	//*****************************************************************//
	// USER
    //*****************************************************************//
	Ext.define('UserModels', {
		extend: 'Ext.data.Model',
		fields: [
			{name : 'user_id', type: 'int'},
			{name : 'username', type : 'string'},
			{name : 'is_registered', type : 'boolean'}			
		],
		proxy: {
			type: 'rest',
			url : '/users',
			reader: {
				type: 'json',
				root: 'users'
			}
		}		
	});

	var userStore = Ext.create('Ext.data.Store', {
		id: 'userStore',
		model: 'UserModels',
		proxy: {
			simpleSortMode: true, 
			type: 'ajax',
			api: {
				read: 'ajax/forum_login.php' 
			},
			reader: {
				type: 'json',
				root: 'data',
				successProperty: 'is_registered'
			},
			extraParams: {
				parametro: 'param'
			},
			actionMethods: {
				read: 'POST'
			}
		},
		listeners: {
			 scope: this,
			 load: function(mapStore, records){
				userStore.data.each(function(){
					if (this.data.is_registered) {
						var userInfoForm = Ext.create('Ext.form.Panel', {
							frame:true,
							title: localize("%userForm"),
							bodyStyle:'padding:5px 0px 0px',
							width: "100%",
							fieldDefaults: {
								msgTarget: 'side',
								labelWidth: 75
							},
							defaultType: 'textfield',
							defaults: {
								anchor: '100%'
							},
							items: [{
								anchor:'95%',
								xtype: 'displayfield',
								name: 'displayFieldMarkerCategory',
						//			fieldLabel: 'Categoria',
								value: localize("%logged") + this.data.username
							}]
						});
						
						gmap.setUser(this.data);
						
						erc.removeAll();	
						erc.add(userInfoForm);
						erc.add(settingsTreeStore);
						erc.add(categoryTree);
						
						erc.doLayout();		
						createContextMenu();
					} else {
						var userInfoForm = Ext.create('Ext.form.Panel', {
							frame:true,
							title: localize("%userForm"),
							bodyStyle:'padding:5px 0px 0px',
							width: "100%",
							fieldDefaults: {
								msgTarget: 'side',
								labelWidth: 75
							},
							defaultType: 'textfield',
							defaults: {
								anchor: '100%'
							},
							items: [{
								fieldLabel: localize("%user"),
								name: 'username',
								id: 'username',
								allowBlank:false
							},{
								fieldLabel: localize("%password"),
								name: 'password',
								id: 'userpassword',
								inputType: 'password',			
								allowBlank:false
							}],
							buttons: [{
								id: 'btnLogin',
								xtype: 'button',
								text: localize("%login"),
								handler:function(){
									userInfoForm.getForm().submit({
										url:'ajax/forum_login.php?s=1',
										success: function(form, action) {
											
											var userInfoForm2 = Ext.create('Ext.form.Panel', {
												frame:true,
												title: localize("%userForm"),
												bodyStyle:'padding:5px 0px 0px',
												width: "100%",
												fieldDefaults: {
													msgTarget: 'side',
													labelWidth: 75
												},
												defaultType: 'textfield',
												defaults: {
													anchor: '100%'
												},
												items: [{
													anchor:'95%',
													xtype: 'displayfield',
													name: 'displayFieldMarkerCategory',
													value: localize("%logged") + Ext.getCmp('username').value
												}]
											});
											gmap.setUser(action.result);											
											
											erc.remove(userInfoForm, true);
											erc.removeAll(false);	
											erc.add(userInfoForm2);
											erc.add(settingsTreeStore);
											erc.add(categoryTree);
											erc.doLayout();	
						
											createContextMenu();
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
													break;
												case Ext.form.Action.CONNECT_FAILURE:
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
														   msg: localize("%errInvalidLogin"),
														   buttons: Ext.MessageBox.OK,
														   icon: Ext.MessageBox.ERROR
													});
											}
										}
									});
								}					        
							}]

						});					
						erc.removeAll();	
						erc.add(userInfoForm);
						erc.add(categoryTree);
						erc.doLayout();		
						
						createContextMenu();
					};
				});
				
			} 
		}			
	});	
	
	function createContextMenu() {
		
		if (!(typeof(ctxMenu)=="undefined" || ctxMenu == null)) {
			ctxMenu.removeAll(true);
		}
		
		if (gmap.getUserPermission()) {
			ctxMenu = 
				new Ext.menu.Menu({
					items : [{
						text : localize("%addMarker"),
						menu: categoryMenu
					},{
						text : localize("%strZoomIn"),
						handler: function () {gmap.zoomIn()}
					},{
						text : localize("%strZoomOut"),
						handler: function () {gmap.zoomOut()}
					},{
						text : localize("%zoomInHere"),
						handler: function () {gmap.zoomInClicked()}
					},{
						text : localize("%zoomOutHere"),
						handler: function () {gmap.zoomOutClicked()}
					}]
				});
			

		} else {
			var cat = new Ext.menu.Menu({
				id: 'CategoryRegister'
			});		
			cat.add({text: localize("%register")});			
		
			ctxMenu = 
				new Ext.menu.Menu({
					items : [{
						text : localize("%addMarker"),
						menu: cat
					},{
						text : localize("%strZoomIn"),
						handler: function () {gmap.zoomIn()}
					},{
						text : localize("%strZoomOut"),
						handler: function () {gmap.zoomOut()}
					},{
						text : localize("%zoomInHere"),
						handler: function () {gmap.zoomInClicked()}
					},{
						text : localize("%zoomOutHere"),
						handler: function () {gmap.zoomOutClicked()}
					}]
				});	
		}

		ctxMenu.on("contextmenu", function() {}, this, { single: true, delay: 100, stopEvent : true, forumId: 4 });
		
		gmap.setContextMenu(ctxMenu);
	}
	

	//*****************************************************************//
	// INIT
	//*****************************************************************//

	var gmap = new GMap();
	mapStore.load();

	// Start a simple clock task that updates a div once per second
	var task = {
		run: function(){
			// Ajax request to see if there is any new markers
			markerStore.load();
		},
		interval: 10000
	}



	// Tutorial
	function createCookie(name,value,days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name+"="+value+expires+"; path=/";
	}

	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}

	function eraseCookie(name) {
		createCookie(name,"",-1);
	}
	
	var tutorialCookie = readCookie('zmaps_showtuto');
	
	if (tutorialCookie == null || tutorialCookie == 1) {
	
		createCookie('zmaps_showtuto','1');
		
		var tutorialCount = 1;
		var maxTuto = 7;
		function showTutorial(idx) {
			Ext.MessageBox.show({
				title: localize("%tutoTitle" + tutorialCount).replace("%c", tutorialCount).replace("%t", maxTuto),
				msg: localize("%tuto" + tutorialCount),
				//buttons: Ext.MessageBox.YESNO,
				buttonText: (idx > 1 ? {yes: localize("%tutorialPrevious"), ok: localize("%tutorialDontShow"), no: localize("%tutorialNext")} : {ok: localize("%tutorialDontShow"), no: localize("%tutorialNext")}),
				fn: showNextTutorial
			});
		}
		
		function showNextTutorial(btn) {
			if (btn == "no") {
				tutorialCount++;
			} else if (btn == "cancel") {
				//Ext.MessageBox.close();
				return;
			} else if (btn == "yes") {
				tutorialCount--;
			} if (btn == "ok") {
				//tutorialCount = -2;
				Ext.MessageBox.close();
				createCookie('zmaps_showtuto','0');
				return;
			}
			if (localize("%tuto" + tutorialCount) != ("%tuto" + tutorialCount)) {
				showTutorial(tutorialCount);
			}
		};
		
		showTutorial(tutorialCount);
	}
});
