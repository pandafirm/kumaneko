/*
* PandaFirm Photo Editor "panda.freepei.js"
* Version: 1.7.0
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
"use strict";
class freepei{
	/* constructor */
	constructor(){}
	/* build freepei */
	build(container,w,h,images,steal,close,disclose=true){
		/* setup properties */
		this.filename='';
		this.dialogs={
			brush:((panel) => {
				return panel
				.event.on('fp.change',(e) => {
					this.properties.brush=e.datas;
					this.brushcursor.css({
						height:this.properties.brush.brushweight.toString()+'px',
						width:this.properties.brush.brushweight.toString()+'px'
					});
				})
				.event.on('fp.cancel',(e) => {
					this.properties.brush=e.datas;
					this.brushcursor.css({
						height:this.properties.brush.brushweight.toString()+'px',
						width:this.properties.brush.brushweight.toString()+'px'
					});
				});
			})(new fp_brushoption()),
			figure:((panel) => {
				return panel
				.event.on('fp.preview',(e) => {
					if (parseInt(pd.elm('[name=fp_operation]:checked').attr('id').replace(/[^0-9]+/g,''))==this.operations.move)
						this.properties.layer.layers[this.properties.layer.active].init({figure:e.datas});
				})
				.event.on('fp.change',(e) => {
					this.properties.figure=e.datas;
					if (parseInt(pd.elm('[name=fp_operation]:checked').attr('id').replace(/[^0-9]+/g,''))==this.operations.figure)
					{
						this.properties.layer.add(new fp_layer('figure',this.createname())).init({bounds:{left:0,top:0,width:100,height:100},figure:this.properties.figure}).centering().focus();
						this.operate(this.operations.move);
					}
					else this.properties.layer.layers[this.properties.layer.active].init({figure:this.properties.figure});
				})
				.event.on('fp.cancel',(e) => {
					this.properties.figure=e.datas;
					if (parseInt(pd.elm('[name=fp_operation]:checked').attr('id').replace(/[^0-9]+/g,''))==this.operations.figure) this.operate(this.operations.move);
					else this.properties.layer.layers[this.properties.layer.active].init({figure:this.properties.figure});
				});
			})(new fp_figureoption()),
			font:((panel) => {
				var verify=(event) => {
					if (this.properties.layer.active>-1)
						if (this.properties.layer.layers[this.properties.layer.active].type=='text')
							if (this.properties.layer.layers[this.properties.layer.active].init({text:this.properties.text}).textarea.css('user-select')=='text')
								this.properties.layer.layers[this.properties.layer.active].textarea.focus();
				};
				return panel
				.event.on('fp.preview',(e) => {
					if (this.properties.layer.active>-1)
						if (this.properties.layer.layers[this.properties.layer.active].type=='text')
							this.properties.layer.layers[this.properties.layer.active].init({text:e.datas});
				})
				.event.on('fp.change',(e) => {
					this.properties.text=e.datas;
					verify(e);
				})
				.event.on('fp.cancel',(e) => {
					this.properties.text=e.datas;
					verify(e);
				});
			})(new fp_fontoption()),
			layer:((panel) => {
				var verify=(event) => {
					if (this.properties.layer.active==event.datas.layer.index)
					{
						this.properties.layer.active=-1;
						this.monitor.panel.html('w:'+this.properties.canvas.w.toString()+'px&nbsp;&nbsp;h:'+this.properties.canvas.h.toString()+'px');
					}
				};
				return panel
				.event.on('fp.swap',(e) => {
					this.properties.layer.layers=(() => {
						var res=[];
						for (var i=0;i<e.datas.swap.length;i++) res.push(this.properties.layer.layers[e.datas.swap[i]]);
						return res;
					})();
					this.properties.layer.sort();
				})
				.event.on('fp.delete',(e) => {
					this.properties.layer.del(e.datas.layer);
					verify(e);
					if (this.properties.layer.active>e.datas.layer.index) this.properties.layer.active--;
				})
				.event.on('fp.unvisible',(e) => {
					verify(e);
				});
			})(new fp_layeroption()),
			size:((panel) => {
				return panel
				.event.on('fp.change',(e) => {
					e.sender.cancel.disable(false);
					e.sender.close.show();
					this.properties.canvas=e.datas;
					this.canvas.resize(this.properties.canvas.w,this.properties.canvas.h).centering();
					this.operate(this.operations.grab);
				})
				.event.on('fp.cancel',(e) => {
					this.properties.canvas=e.datas;
					this.canvas.resize(this.properties.canvas.w,this.properties.canvas.h);
				});
			})(new fp_sizeoption())
		};
		this.operations={move:1,image:2,figure:3,brush:4,erase:5,text:6,grab:7};
		this.properties={
			canvas:{
				w:(w)?w:window.innerWidth-50,
				h:(h)?h:window.innerHeight-50
			},
			brush:{
				brushblur:0,
				brushcolor:{r:0,g:0,b:0,a:1},
				brushweight:10
			},
			figure:{
				bordercolor:{r:0,g:0,b:0,a:0},
				borderradius:0,
				borderweight:0,
				fillcolor:{r:255,g:255,b:255,a:1},
				shape:'square'
			},
			text:{
				color:{r:0,g:0,b:0,a:1},
				fontbold:false,
				fontfamily:'',
				fontitalic:false,
				fontsize:16,
				lineheight:24,
				textalign:'left'
			},
			layer:{
				active:-1,
				layers:[],
				add:(layer) => {
					this.properties.layer.layers.splice(0,0,layer);
					this.properties.layer.sort();
					this.canvas.panel.append(
						layer.event.on(['fp.dragging','fp.dragend','fp.focus','fp.resizing','fp.resizeend','fp.rotating','fp.rotateend','fp.relocate',],(e) => {
							if (e.type=='fp.focus')
							{
								this.properties.layer.active=e.sender.index;
								for (var i=0;i<this.properties.layer.layers.length;i++)
									if (i!=this.properties.layer.active) this.properties.layer.layers[i].leave();
								this.dialogs.layer.focus(e.sender.index);
								this.switchdialog();
							}
							this.monitor.panel.html((() => {
								var res='';
								res+='x:'+e.datas.left.toString()+'px&nbsp;&nbsp;';
								res+='y:'+e.datas.top.toString()+'px&nbsp;&nbsp;';
								res+='w:'+e.datas.width.toString()+'px&nbsp;&nbsp;';
								res+='h:'+e.datas.height.toString()+'px&nbsp;&nbsp;';
								res+='d:'+e.datas.degrees.toString()+'&deg;';
								return res;
							})());
						}).panel
					);
					this.dialogs.layer.add(layer);
					return layer;
				},
				del:(layer) => {
					this.canvas.panel.removeChild(layer.panel);
					this.properties.layer.layers=this.properties.layer.layers.filter((item) => {
						return item.index!=layer.index;
					});
					this.properties.layer.sort();
				},
				sort:() => {
					for (var i=0;i<this.properties.layer.layers.length;i++)
					{
						this.properties.layer.layers[i].index=i;
						this.properties.layer.layers[i].panel.css({
							zIndex:(this.properties.layer.layers.length-i).toString()
						});
					}
				}
			},
			get:() => {
				var datas={...this.properties};
				delete datas.layer;
				delete datas.get;
				delete datas.set;
				datas['layers']=[];
				for (var i=0;i<this.properties.layer.layers.length;i++)
					datas.layers.push({
						type:this.properties.layer.layers[i].type,
						name:this.properties.layer.layers[i].name,
						visible:this.properties.layer.layers[i].visible,
						properties:((layer) => {
							var res={...layer.properties};
							if (layer.type=='text') res.text['text']=layer.textarea.val();
							return res;
						})(this.properties.layer.layers[i])
					});
				return datas;
			},
			set:(properties,filename) => {
				return new Promise((resolve,reject) => {
					try
					{
						this.properties.canvas={...properties.canvas};
						this.properties.brush={...properties.brush};
						this.properties.figure={...properties.figure};
						this.properties.text={...properties.text};
						this.brushcursor.css({
							height:this.properties.brush.brushweight.toString()+'px',
							width:this.properties.brush.brushweight.toString()+'px'
						});
						this.canvas.resize(this.properties.canvas.w,this.properties.canvas.h).centering();
						this.dialogs.layer.clear();
						this.dialogs.size.hide();
						this.filename=filename;
						for (var i=properties.layers.length;i>0;i--)
						{
							var layer=properties.layers[i-1];
							this.properties.layer.add(new fp_layer(layer.type,layer.name,layer.visible)).init(layer.properties).leave();
						}
						this.operate(this.operations.move);
						this.properties.layer.active=-1;
						this.monitor.panel.html('w:'+this.properties.canvas.w.toString()+'px&nbsp;&nbsp;h:'+this.properties.canvas.h.toString()+'px').off('click');
						resolve(this.properties.layer.layers);
					}
					catch (error)
					{
						pd.alert('The file format is incorrect');
						reject();
					}
				});
			}
		};
		/* append elements */
		pd.theme='dark';
		((typeof container==='string')?pd.elm(container):container).addclass('fp_container').empty().css({
			backgroundColor:'rgba(64,64,64,1)',
			fontSize:'13px',
			overflow:'hidden'
		})
		.append(
			(() => {
				this.canvas=new fp_panel(true,false,false).event.on('fp.dragend',(e) => {
					this.canvas.panel.parentNode.css({cursor:'grab'});
				});
				return this.canvas.panel.css({
					backgroundColor:'#fff',
					cursor:'inherit',
					position:'fixed'
				});
			})()
		)
		.append((() => {
			this.brushcursor=pd.create('div').css({
				border:'1px solid rgba(0,0,0,0.5)',
				borderRadius:'50%',
				cursor:'none',
				display:'none',
				height:this.properties.brush.brushweight.toString()+'px',
				left:'0',
				pointerEvents:'none',
				position:'fixed',
				top:'0',
				transform:'translate(-50%,-50%)',
				width:this.properties.brush.brushweight.toString()+'px'
			});
			window.on('mousemove,touchmove',(e) => {
				var pointer=(e.changedTouches)?e.changedTouches[0]:e;
				this.brushcursor.css({left:pointer.clientX.toString()+'px',top:pointer.clientY.toString()+'px'});
			});
			return this.brushcursor;
		})())
		.append(
			(() => {
				if (close)
				{
					return ((button) => {
						button.button.css({
							left:'0',
							top:'0.5em'
						})
						.on('click',(e) => close());
						return button.button;
					})(new fp_button({type:'image',src:'https://freepei.net/image/del.svg'}));
				}
				else
				{
					return pd.create('img').css({
						boxSizing:'border-box',
						height:'3em',
						left:'0',
						position:'fixed',
						top:'0',
						width:'3em'
					})
					.attr('src','https://freepei.net/image/logo.svg');
				}
			})()
		)
		.append(
			(() => {
				this.monitor=new fp_panel(false,false,false);
				return this.monitor.panel.css({
					backgroundColor:'rgba(0,0,0,0.5)',
					borderBottomLeftRadius:'0.5em',
					borderBottomRightRadius:'0.5em',
					color:'#fff',
					cursor:'pointer',
					display:'none',
					left:'50%',
					lineHeight:'1.5em',
					maxWidth:'calc(100% - 7em)',
					overflowX:'auto',
					overflowY:'hidden',
					padding:'0.5em 1em',
					position:'fixed',
					top:'0',
					transform:'translate(-50%,0)',
					whiteSpace:'nowrap',
					width:'auto'
				})
				.on('mousedown,touchstart',(e) => e.stopPropagation());
			})()
		)
		.append(
			((panel) => {
				panel.css({
					backgroundColor:'rgba(0,0,0,0.5)',
					borderRadius:'1.5em',
					bottom:'0.5em',
					left:'50%',
					maxWidth:'calc(100% - 7em)',
					overflowX:'auto',
					overflowY:'hidden',
					padding:'0 1.5em',
					position:'fixed',
					transform:'translate(-50%,0)',
					whiteSpace:'nowrap',
					width:'auto'
				})
				.off('mousedown,touchstart').on('mousedown,touchstart',(e) => e.stopPropagation());
				for (var key in this.operations)
					((key,operation) => {
						panel.append(new fp_radio({id:'fp_operation'+operation.toString(),name:'fp_operation',src:'https://freepei.net/image/'+key+'.svg'}).radio);
					})(key,this.operations[key]);
				panel.append(
					pd.create('div').css({
						boxSizing:'border-box',
						display:'inline-block',
						margin:'0 0.25em',
						padding:'0.25em',
						position:'relative',
						textAlign:'center',
						verticalAlign:'top',
						height:'3em',
						width:'3em'
					})
					.append(
						pd.create('img').css({
							cursor:'pointer',
							display:'block',
							height:'100%',
							position:'relative',
							width:'100%'
						})
						.attr('src','https://freepei.net/image/help.svg')
					)
					.on('click',(e) => {
						switch (navigator.language.substr(0,2))
						{
							case 'ja':
								window.open('https://freepei.pandafirm.jp/docs/ja/');
								break;
							default:
								window.open('https://freepei.pandafirm.jp/docs/en/');
								break;
						}
					})
				);
				return panel;
			})(new fp_panel(false,false,false).panel)
		)
		.append(
			((button) => {
				button.button.css({
					bottom:'0.5em',
					right:'0'
				})
				.on('click',(e) => this.dialogs.layer.show());
				return button.button;
			})(new fp_button({type:'image',src:'https://freepei.net/image/layer.svg'}))
		)
		.append(
			((button) => {
				button.button.css({
					right:'0',
					top:'0.5em'
				})
				.on('click',(e) => {
					var blob=null;
					var canvas=pd.create('canvas');
					var context=canvas.getContext('2d');
					canvas.width=this.properties.canvas.w;
					canvas.height=this.properties.canvas.h;
					for (var i=this.properties.layer.layers.length;i>0;i--)
					{
						var layer=this.properties.layer.layers[i-1];
						if (layer.visible)
						{
							layer.affect(layer.properties.effects,context);
							context.translate(layer.properties.bounds.left,layer.properties.bounds.top);
							context.rotate(layer.properties.radian);
							context.drawImage(
								layer.redraw(null,true),
								0,
								0,
								layer.properties.bounds.width,
								layer.properties.bounds.height
							);
							context.setTransform(1,0,0,1,0,0);
						}
					}
					blob=((bin) => {
						var buffer=new Uint8Array(bin.length);
						for (var i=0;i<bin.length;i++) buffer[i]=bin.charCodeAt(i);
						return new Blob([buffer.buffer],{type:'image/png'});
					})(atob(canvas.toDataURL('image/png').split(',')[1]));
					if (steal) steal(blob,this.properties.get());
					else
					{
						var url=window.URL || window.webkitURL;
						var a=pd.create('a')
						.attr('href',url.createObjectURL(blob))
						.attr('target','_blank')
						.attr('download','fp_image.png')
						.css({display:'none'});
						pd.elm('body').append(a);
						a.click();
						document.body.removeChild(a);
					}
					canvas.remove();
				});
				return button.button;
			})(new fp_button({type:'image',src:'https://freepei.net/image/create.svg'}))
		)
		.append(
			((button) => {
				button.button.css({
					right:'0',
					top:'4em'
				})
				.on('click',(e) => {
					pd.input('Please enter the file name to save',(verify) => {
						if (!verify) pd.alert('Please enter the file name to save');
						else
						{
							pd.downloadtext(JSON.stringify(this.properties.get()),verify+'.fpd');
							this.filename=verify;
						}
					},'text',this.filename.replace(/\.fpd$/g,''));
				});
				if (!disclose) button.button.hide();
				return button.button;
			})(new fp_button({type:'image',src:'https://freepei.net/image/save.svg'}))
		)
		.append(
			((button) => {
				button.button.css({
					right:'0',
					top:'8em'
				})
				.on('click',(e) => {
					((file) => {
						pd.elm('body').append(file.on('change',(e) => {
							if (e.currentTarget.files)
							{
								var reader=new FileReader();
								var filename=e.currentTarget.files[0].name;
								reader.onload=((readData) => {
									this.properties.set(JSON.parse(reader.result),filename).then((layers) => {}).catch(() => {});
									document.body.removeChild(file);
								});
								reader.readAsText(e.currentTarget.files[0]);
							}
							else document.body.removeChild(file);
						}));
						file.click();
					})(pd.create('input').attr('type','file').attr('accept','.fpd').css({display:'none'}));
				});
				if (!disclose) button.button.hide();
				return button.button;
			})(new fp_button({type:'image',src:'https://freepei.net/image/open.svg'}))
		)
		.append(this.dialogs.brush.panel)
		.append(this.dialogs.figure.panel)
		.append(this.dialogs.font.panel)
		.append(this.dialogs.layer.panel)
		.append(this.dialogs.size.panel);
		window
		.on('keydown',(e) => {
			var code=e.keyCode||e.which;
			if (this.properties.layer.active>-1)
			{
				var rect=this.properties.layer.layers[this.properties.layer.active].panel.getBoundingClientRect();
				var from={left:rect.left,top:rect.top};
				var to={left:rect.left,top:rect.top};
				if (code==37) to.left--;
				if (code==39) to.left++;
				if (code==38) to.top--;
				if (code==40) to.top++;
				this.properties.layer.layers[this.properties.layer.active].move(from,to);
			}
		})
		.on('paste',(e) => {
			var items=(e.clipboardData || e.originalEvent.clipboardData).items;
			for (var i=0;i<items.length;i++)
				if (items[i].type.indexOf('image')==0)
				{
					var url=window.URL || window.webkitURL;
					var image=new Image();
					image.src=url.createObjectURL(items[i].getAsFile());
					image.onload=() => {
						this.properties.layer.add(new fp_layer('image',this.createname())).init(
							{
								bounds:{left:0,top:0,width:image.naturalWidth,height:image.naturalHeight},
								image:{
									src:image.src,
									origin:{
										width:image.naturalWidth,
										height:image.naturalHeight
									}
								}
							}
						).centering().focus();
						this.operate(this.operations.move);
					};
					break;
				}
		});
		if (!w || !h)
		{
			this.dialogs.size.cancel.disable(true);
			this.dialogs.size.close.hide();
			this.dialogs.size.show(this.properties.canvas);
		}
		else
		{
			this.properties.canvas.w=w;
			this.properties.canvas.h=h;
			this.canvas.resize(this.properties.canvas.w,this.properties.canvas.h).centering();
			this.operate(this.operations.grab);
		}
		if (Array.isArray(images))
		{
			for (var i=0;i<images.length;i++)
				((image) => {
					this.properties.layer.add(new fp_layer('image',this.createname())).init(
						{
							bounds:{left:0,top:0,width:image.naturalWidth,height:image.naturalHeight},
							image:{
								src:image.src,
								origin:{
									width:image.naturalWidth,
									height:image.naturalHeight
								}
							}
						}
					).centering();
				})(images[i]);
			this.operate(this.operations.move);
		}
		if (!pd.elm('.fpstyle_container'))
			pd.elm('head').append(
				pd.create('style')
				.addclass('fpstyle_container')
				.attr('media','screen')
				.attr('type','text/css')
				.text((() => {
					var res='';
					res+='.fp_container *{font-size:13px;}';
					res+='.fp_container *:is(input,option,select){color:initial !important;}';
					res+='.fp_container *::-webkit-scrollbar{height:6px;width:6px;}';
					res+='.fp_container *::-webkit-scrollbar-corner{background:transparent;}';
					res+='.fp_container *::-webkit-scrollbar-thumb{background:rgba(64,64,64,1);border-radius:3px;}';
					res+='.fp_container *::-webkit-scrollbar-track{border:none;border-radius:3px;box-shadow:inset 0 0 2px rgba(64,64,64,0.5);}';
					return res;
				})())
			);
		pd.elms('[name=fp_operation]').some((item,index) => {
			item.on('change',(e) => this.operate());
		});
	}
	/* create new layer's name */
	createname(operation){
		var res=0;
		for (var i=0;i<this.properties.layer.layers.length;i++)
		{
			var name=this.properties.layer.layers[i].name;
			if (name.match(/^layer [1-9]{1}[0-9]*$/))
				if (res<parseInt(name.replace(/[^0-9]+/g,''))) res=parseInt(name.replace(/[^0-9]+/g,''));
		}
		return 'layer '+(res+1).toString();
	}
	/* operate */
	operate(operation){
		operation=((operation) => {
			if (operation)
			{
				pd.elm('#fp_operation'+operation.toString()).checked=true;
				return operation;
			}
			else return parseInt(pd.elm('[name=fp_operation]:checked').attr('id').replace(/[^0-9]+/g,''));
		})(operation);
		this.brushcursor.hide();
		switch (operation)
		{
			case this.operations.move:
				this.canvas.panel.parentNode.css({cursor:'move'})
				.off('mousedown,touchstart').on('mousedown,touchstart',(e) => {
					var pointer=(e.changedTouches)?e.changedTouches[0]:e;
					this.properties.layer.active=-1;
					for (var i=0;i<this.properties.layer.layers.length;i++)
						if (this.properties.layer.layers[i].hit({left:pointer.clientX,top:pointer.clientY},this.canvas.properties.bounds))
						{
							this.properties.layer.layers[i].focus().drag(e);
							break;
						}
					if (this.properties.layer.active<0)
					{
						for (var i=0;i<this.properties.layer.layers.length;i++) this.properties.layer.layers[i].leave();
						this.dialogs.layer.focus(-1);
						this.monitor.panel.html('w:'+this.properties.canvas.w.toString()+'px&nbsp;&nbsp;h:'+this.properties.canvas.h.toString()+'px').off('click');
					}
					e.stopPropagation();
					e.preventDefault();
				});
				this.switchdialog();
				break;
			case this.operations.image:
				((file) => {
					pd.elm('body').append(file.on('change',(e) => {
						if (e.currentTarget.files)
						{
							var image=new Image();
							var reader=new FileReader();
							reader.onload=((readData) => {
								image.src=reader.result;
								image.onload=() => {
									this.properties.layer.add(new fp_layer('image',this.createname())).init(
										{
											bounds:{left:0,top:0,width:image.naturalWidth,height:image.naturalHeight},
											image:{
												src:image.src,
												origin:{
													width:image.naturalWidth,
													height:image.naturalHeight
												}
											}
										}
									).centering().focus();
									document.body.removeChild(file);
									this.operate(this.operations.move);
								};
							});
							reader.readAsDataURL(e.currentTarget.files[0]);
						}
						else
						{
							document.body.removeChild(file);
							this.operate(this.operations.move);
						}
					}));
					file.click();
				})(pd.create('input').attr('type','file').css({display:'none'}));
				break;
			case this.operations.figure:
				this.dialogs.figure.show(this.properties.figure);
				break;
			case this.operations.brush:
				var hit=(event) => {
					var pointer=(event.changedTouches)?event.changedTouches[0]:event;
					var rect=this.properties.layer.layers[this.properties.layer.active].panel.getBoundingClientRect();
					if (pointer.clientX<rect.left) return false;
					if (pointer.clientX>rect.right) return false;
					if (pointer.clientY<rect.top) return false;
					if (pointer.clientY>rect.bottom) return false;
					return true;
				};
				this.canvas.panel.parentNode.css({cursor:'none'})
				.off('mousedown,touchstart').on('mousedown,touchstart',(e) => {
					var pointer=(e.changedTouches)?e.changedTouches[0]:e;
					if (this.properties.layer.active<0)
						this.properties.layer.add(new fp_layer('draw',this.createname())).init({bounds:{left:0,top:0,width:this.properties.canvas.w,height:this.properties.canvas.h}}).focus();
					if (this.properties.layer.layers[this.properties.layer.active].type!='draw')
						this.properties.layer.add(new fp_layer('draw',this.createname())).init({bounds:{left:0,top:0,width:this.properties.canvas.w,height:this.properties.canvas.h}}).focus();
					if (!hit(e))
						this.properties.layer.add(new fp_layer('draw',this.createname())).init({bounds:{left:0,top:0,width:this.properties.canvas.w,height:this.properties.canvas.h}}).focus();
					this.properties.layer.layers[this.properties.layer.active].handwrite({left:pointer.clientX,top:pointer.clientY},this.canvas.properties.bounds,this.properties.brush);
					e.stopPropagation();
					e.preventDefault();
				});
				this.brushcursor.show();
				this.monitor.panel.off('click').on('click',(e) => {
					this.dialogs.brush.show(this.properties.brush);
				}).show();
				break;
			case this.operations.erase:
				if (this.properties.layer.active<0)	this.canvas.panel.parentNode.css({cursor:'not-allowed'}).off('mousedown,touchstart');
				else
				{
					if (this.properties.layer.layers[this.properties.layer.active].type!='draw') this.canvas.panel.parentNode.css({cursor:'not-allowed'}).off('mousedown,touchstart');
					else
					{
						this.canvas.panel.parentNode.css({cursor:'none'})
						.off('mousedown,touchstart').on('mousedown,touchstart',(e) => {
							var pointer=(e.changedTouches)?e.changedTouches[0]:e;
							this.properties.layer.layers[this.properties.layer.active].handwrite({left:pointer.clientX,top:pointer.clientY},this.canvas.properties.bounds,this.properties.brush,true);
							e.stopPropagation();
							e.preventDefault();
						});
						this.brushcursor.show();
					}
				}
				this.monitor.panel.off('click').on('click',(e) => {
					this.dialogs.brush.show(this.properties.brush);
				}).show();
				break;
			case this.operations.text:
				if (!this.properties.text.fontfamily) this.properties.text.fontfamily=this.dialogs.font.fontfamily.val();
				this.canvas.panel.parentNode.css({cursor:'text'})
				.off('mousedown,touchstart').on('mousedown,touchstart',(e) => {
					var pointer=(e.changedTouches)?e.changedTouches[0]:e;
					this.properties.layer.add(new fp_layer('text',this.createname())).init({bounds:{left:pointer.offsetX,top:pointer.offsetY,width:100,height:100},text:this.properties.text}).focus(true);
					this.operate(this.operations.move);
					e.stopPropagation();
					e.preventDefault();
				});
				this.monitor.panel.off('click').on('click',(e) => {
					this.dialogs.font.show(this.properties.text);
				}).show();
				break;
			case this.operations.grab:
				for (var i=0;i<this.properties.layer.layers.length;i++) this.properties.layer.layers[i].leave();
				this.canvas.panel.parentNode.css({cursor:'grab'})
				.off('mousedown,touchstart').on('mousedown,touchstart',(e) => {
					for (var i=0;i<this.properties.layer.layers.length;i++) this.properties.layer.layers[i].leave();
					this.canvas.panel.parentNode.css({cursor:'grabbing'});
					this.canvas.drag(e);
					e.stopPropagation();
					e.preventDefault();
				});
				this.monitor.panel.html('w:'+this.properties.canvas.w.toString()+'px&nbsp;&nbsp;h:'+this.properties.canvas.h.toString()+'px')
				.off('click').on('click',(e) => {
					this.dialogs.size.show(this.properties.canvas);
				}).show();
				break;
		}
	}
	/* switch display on dialog */
	switchdialog(){
		if (this.properties.layer.active<0) this.monitor.panel.off('click');
		else
		{
			((layer) => {
				switch (layer.type)
				{
					case 'draw':
						this.monitor.panel.off('click').on('click',(e) => {
							this.dialogs.brush.show(this.properties.brush);
						}).show();
						break;
					case 'figure':
						this.monitor.panel.off('click').on('click',(e) => {
							this.dialogs.figure.show(layer.properties.figure);
						}).show();
						if (this.dialogs.figure.panel.visible()) this.dialogs.figure.show(layer.properties.figure);
						break;
					case 'text':
						this.monitor.panel.off('click').on('click',(e) => {
							this.dialogs.font.show(layer.properties.text);
						}).show();
						if (this.dialogs.font.panel.visible()) this.dialogs.font.show(layer.properties.text);
						break;
					default:
						this.monitor.panel.off('click');
						break;
				}
			})(this.properties.layer.layers[this.properties.layer.active]);
			((operation) => {
				switch (operation)
				{
					case this.operations.brush:
					case this.operations.erase:
						this.operate();
						break;
				}
			})(parseInt(pd.elm('[name=fp_operation]:checked').attr('id').replace(/[^0-9]+/g,'')));
		}
	}
}
class fp_button{
	/* constructor */
	constructor(args){
		/* setup properties */
		this.isDisabled=false;
		/* create element */
		this.button=pd.create('div').addclass('fp_button').addclass(args.type).css({
			boxSizing:'border-box',
			cursor:'pointer',
			display:'inline-block',
			position:'relative',
			textAlign:'center',
			verticalAlign:'top'
		}).on('mousedown,touchstart',(e) => e.stopPropagation());
		switch (args.type)
		{
			case 'image':
				this.button.css({
					backgroundColor:'rgba(0,0,0,0.5)',
					borderRadius:'50%',
					height:'3em',
					margin:'0 0.5em',
					padding:'0',
					position:'fixed',
					width:'3em'
				})
				.append(
					pd.create('img').css({
						borderRadius:'50%',
						display:'block',
						height:'100%',
						position:'relative',
						width:'100%'
					})
					.attr('src',args.src)
				);
				break;
			case 'normal':
				this.button.css({
					border:'1px solid rgba(0,0,0,0.5)',
					borderRadius:'0.25em',
					boxShadow:'inset 0 1px 0 rgba(255,255,255,0.25)',
					color:'#fff',
					fontFamily:'Roboto,"Helvetica Neue",Helvetica,Arial,sans-serif',
					padding:'0.25em 0.5em'
				})
				.html(args.label);
				break;
		}
		if (!pd.elm('.fpstyle_button'))
		{
			pd.elm('head').append(
				pd.create('style')
				.addclass('fpstyle_button')
				.attr('media','screen')
				.attr('type','text/css')
				.text((() => {
					var res='';
					res+='.fp_button{transition:all 0.1s ease-out 0s;}';
					res+='.fp_button.disabled{background-color:rgba(192,192,192,0.5) !important;}';
					res+='.fp_button.image:hover{transform:scale(1.25,1.25);transformOrigin:(center,center);}';
					res+='.fp_button.normal:hover{background-color:rgba(25,118,210,1);}';
					return res;
				})())
			);
		}
	}
	/* disable */
	disable(arg){
		this.isDisabled=arg;
		if (this.isDisabled) this.button.addclass('disabled');
		else this.button.removeclass('disabled');
	}
}
class fp_checkbox{
	/* constructor */
	constructor(args){
		/* create element */
		this.checkbox=pd.create('label').addclass('fp_checkbox').css({
			boxSizing:'border-box',
			display:'inline-block',
			height:'3em',
			margin:'0 0.25em',
			padding:'0',
			position:'relative',
			textAlign:'center',
			verticalAlign:'top',
			width:'3em'
		})
		.append(
			pd.create('input').css({display:'none'})
			.attr('type','checkbox')
			.attr('id',args.id)
		)
		.append(
			pd.create('div').css({
				boxSizing:'border-box',
				padding:'0.25em',
				height:'3em',
				width:'3em'
			})
		);
		if (args.src)
		{
			this.checkbox.elm('div')
			.append(
				pd.create('img').css({
					cursor:'pointer',
					display:'block',
					height:'100%',
					position:'relative',
					width:'100%'
				})
				.attr('src',args.src)
			);
		}
		else
		{
			this.checkbox.elm('div')
			.append(
				pd.create('div').css({
					boxSizing:'border-box',
					cursor:'pointer',
					display:'block',
					height:'100%',
					position:'relative',
					width:'100%'
				})
			);
		}
		if (!pd.elm('.fpstyle_checkbox'))
		{
			pd.elm('head').append(
				pd.create('style')
				.addclass('fpstyle_checkbox')
				.attr('media','screen')
				.attr('type','text/css')
				.text('.fp_checkbox input[type=checkbox]:checked+div{box-shadow:inset 0 -4px 2px -2px rgba(25,118,210,1);}')
			);
		}
	}
}
class fp_input{
	/* constructor */
	constructor(label){
		/* create element */
		this.input=pd.create('input').addclass('fp_input').css({
			backgroundColor:'rgba(255,255,255,0.75)',
			border:'1px solid rgba(0,0,0,0.5)',
			borderRadius:'0.25em',
			boxSizing:'border-box',
			display:'inline-block',
			fontFamily:'Roboto,"Helvetica Neue",Helvetica,Arial,sans-serif',
			fontSize:'13px',
			outline:'none',
			padding:'0.25em 0.5em',
			position:'relative',
			verticalAlign:'top'
		})
		.attr('type','text')
		.on('keydown',(e) => e.stopPropagation());
		if (!pd.elm('.fpstyle_input'))
		{
			pd.elm('head').append(
				pd.create('style')
				.addclass('fpstyle_input')
				.attr('media','screen')
				.attr('type','text/css')
				.text('.fp_input:focus{background-color:rgba(179,229,252,0.75) !important;color:rgba(0,0,0,1) !important;}')
			);
		}
	}
}
class fp_radio{
	/* constructor */
	constructor(args){
		/* create element */
		this.radio=pd.create('label').addclass('fp_radio').css({
			boxSizing:'border-box',
			display:'inline-block',
			height:'3em',
			margin:'0 0.25em',
			padding:'0',
			position:'relative',
			textAlign:'center',
			verticalAlign:'top',
			width:'3em'
		})
		.append(
			pd.create('input').css({display:'none'})
			.attr('type','radio')
			.attr('id',args.id)
			.attr('name',args.name)
		)
		.append(
			pd.create('div').css({
				boxSizing:'border-box',
				padding:'0.25em',
				height:'3em',
				width:'3em'
			})
		);
		if (args.src)
		{
			this.radio.elm('div')
			.append(
				pd.create('img').css({
					cursor:'pointer',
					display:'block',
					height:'100%',
					position:'relative',
					width:'100%'
				})
				.attr('src',args.src)
			);
		}
		else
		{
			this.radio.elm('div')
			.append(
				pd.create('div').css({
					boxSizing:'border-box',
					cursor:'pointer',
					display:'block',
					height:'100%',
					position:'relative',
					width:'100%'
				})
			);
		}
		if (!pd.elm('.fpstyle_radio'))
		{
			pd.elm('head').append(
				pd.create('style')
				.addclass('fpstyle_radio')
				.attr('media','screen')
				.attr('type','text/css')
				.text('.fp_radio input[type=radio]:checked+div{box-shadow:inset 0 -4px 2px -2px rgba(25,118,210,1);}')
			);
		}
	}
}
class fp_range{
	/* constructor */
	constructor(min,max,step){
		/* create element */
		this.input=pd.create('input').addclass('fp_range').css({
			backgroundColor:'rgba(255,255,255,0.75)',
			border:'none',
			borderRadius:'0.25em',
			boxSizing:'border-box',
			cursor:'pointer',
			display:'inline-block',
			fontSize:'13px',
			height:'0.5em',
			margin:'0.75em 0',
			outline:'none',
			position:'relative',
			verticalAlign:'top',
			appearance:'none',
			webkitAppearance:'none'
		})
		.attr('type','range')
		.attr('min',min)
		.attr('max',max)
		.attr('step',step)
		.on('keydown',(e) => e.stopPropagation());
		if (!pd.elm('.fpstyle_range'))
		{
			pd.elm('head').append(
				pd.create('style')
				.addclass('fpstyle_range')
				.attr('media','screen')
				.attr('type','text/css')
				.text((() => {
					var res='';
					res+='.fp_range::-webkit-slider-thumb{background:rgba(25,118,210,1);border:none;border-radius:50%;height:1em;width:1em;-webkit-appearance:none;}';
					res+='.fp_range::-moz-slider-thumb{background:rgba(25,118,210,1);border:none;border-radius:50%;height:1em;width:1em;}';
					res+='.fp_range::-moz-focus-outer{border:0;}';
					return res;
				})())
			);
		}
	}
}
class fp_select{
	/* constructor */
	constructor(label){
		/* create element */
		this.select=pd.create('select').addclass('fp_select').css({
			backgroundColor:'rgba(255,255,255,0.75)',
			border:'1px solid rgba(0,0,0,0.5)',
			borderRadius:'0.25em',
			boxSizing:'border-box',
			display:'inline-block',
			fontFamily:'Roboto,"Helvetica Neue",Helvetica,Arial,sans-serif',
			fontSize:'13px',
			outline:'none',
			padding:'0.25em 0.5em',
			position:'relative',
			textIndent:'.01px',
			textOverflow:'',
			verticalAlign:'top',
			appearance:'none',
			webkitAppearance:'none'
		})
		.attr('type','text');
		if (!pd.elm('.fpstyle_select'))
		{
			pd.elm('head').append(
				pd.create('style')
				.addclass('fpstyle_select')
				.attr('media','screen')
				.attr('type','text/css')
				.text('.fp_select:focus{background-color:rgba(179,229,252,0.75) !important;}')
			);
		}
	}
}
class fp_panel{
	/* constructor */
	constructor(isDraggable,isResizable,isRotatable){
		/* setup properties */
		this.isDraggable=isDraggable;
		this.isResizable=isResizable;
		this.isRotatable=isRotatable;
		this.listeners={
			'dragging':null,
			'dragend':null,
			'resizing':null,
			'resizeend':null,
			'resizekeydown':null,
			'resizekeyup':null,
			'rotating':null,
			'rotateend':null
		};
		this.panel=pd.create('div').css({boxSizing:'border-box'});
		this.properties={
			bounds:{
				left:null,
				top:null,
				width:null,
				height:null
			},
			radian:0
		};
		/* setup properties to event */
		this.eventlisteners={};
		this.event={
			on:(keys,listener) => {
				var types=(Array.isArray(keys))?keys:keys.split(',');
				for (var i=0;i<types.length;i++)
				{
					var type=types[i];
					if (!(type in this.eventlisteners)) this.eventlisteners[type]=[];
					this.eventlisteners[type].push(listener);
				}
				return this;
			}
		};
		/* processing for each argument */
		if (this.isDraggable)
		{
			window.on('resize',(e) => {
				if (this.panel.css('position')=='fixed')
				{
					if (this.panel.visible())
						this.screenposition().callevent('fp.relocate',{sender:this,datas:this.screenbounds()});
				}
			});
		}
		if (this.isResizable)
		{
			this.panel.append(
				((size) => {
					this.resizeclip=pd.create('div').css({
						backgroundColor:'rgba(21,101,192,1)',
						bottom:(size*-1).toString()+'px',
						boxShadow:'0 1px 0 rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.5)',
						cursor:'nwse-resize',
						display:'none',
						height:size.toString()+'px',
						right:(size*-1).toString()+'px',
						pointerEvents:'auto',
						position:'absolute',
						width:size.toString()+'px'
					})
					.on('mousedown,touchstart',(e) => {
						var pointer=(e.changedTouches)?e.changedTouches[0]:e;
						var rect=this.panel.getBoundingClientRect();
						var keep={
							clientX:pointer.clientX,
							clientY:pointer.clientY,
							aspect:{
								ratio:this.properties.bounds.width/this.properties.bounds.height,
								hold:false
							},
							size:{
								width:this.properties.bounds.width,
								height:this.properties.bounds.height
							}
						};
						if (this.listeners.resizing) window.off('mousemove,touchmove',this.listeners.resizing);
						if (this.listeners.resizeend) window.off('mouseup,touchend',this.listeners.resizeend);
						this.listeners.resizing=(e) => {
							var pointer=(e.changedTouches)?e.changedTouches[0]:e;
							var size=((from,to) => {
								var vec={
									from:this.rotate(from,{left:0,top:0},this.properties.radian*-1),
									to:this.rotate(to,{left:0,top:0},this.properties.radian*-1),
								};
								return {
									width:Math.max(keep.size.width-(vec.from.left-vec.to.left),this.resizeclip.outerwidth()),
									height:Math.max(keep.size.height-(vec.from.top-vec.to.top),this.resizeclip.outerheight())
								};
							})({left:keep.clientX,top:keep.clientY},{left:pointer.clientX,top:pointer.clientY});
							keep.clientX=pointer.clientX;
							keep.clientY=pointer.clientY;
							keep.size.width=size.width;
							keep.size.height=size.height;
							this.resize(keep.size.width,(keep.aspect.hold)?keep.size.width/keep.aspect.ratio:keep.size.height);
							this.callevent('fp.resizing',{sender:this,datas:this.screenbounds()});
							e.stopPropagation();
							e.preventDefault();
						};
						this.listeners.resizekeydown=(e) => {
							var code=e.keyCode||e.which;
							if (code==16)
							{
								keep.aspect.hold=true;
								this.resize(keep.size.width,keep.size.width/keep.aspect.ratio);
							}
						};
						this.listeners.resizekeyup=(e) => {
							var code=e.keyCode||e.which;
							if (code==16)
							{
								keep.aspect.hold=false;
								this.resize(keep.size.width,keep.size.height);
							}
						};
						this.listeners.resizeend=(e) => {
							if (this.listeners.resizing) window.off('mousemove,touchmove',this.listeners.resizing);
							if (this.listeners.resizeend) window.off('mouseup,touchend',this.listeners.resizeend);
							if (this.listeners.resizekeydown) window.off('keydown',this.listeners.resizekeydown);
							if (this.listeners.resizekeyup) window.off('keyup',this.listeners.resizekeyup);
							this.callevent('fp.resizeend',{sender:this,datas:this.screenbounds()});
							e.stopPropagation();
							e.preventDefault();
						};
						window.on('mousemove,touchmove',this.listeners.resizing);
						window.on('mouseup,touchend',this.listeners.resizeend);
						window.on('keydown',this.listeners.resizekeydown);
						window.on('keyup',this.listeners.resizekeyup);
						e.stopPropagation();
						e.preventDefault();
					});
					return this.resizeclip;
				})(10)
			);
		}
		if (this.isRotatable)
		{
			this.panel.append(
				((size) => {
					this.rotateclip=pd.create('div').css({
						backgroundColor:'rgba(21,101,192,1)',
						borderRadius:(size/2).toString()+'px',
						boxShadow:'0 1px 0 rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.5)',
						cursor:'none',
						display:'none',
						height:size.toString()+'px',
						right:(size*-1).toString()+'px',
						pointerEvents:'auto',
						position:'absolute',
						top:(size*-1).toString()+'px',
						width:size.toString()+'px'
					})
					.on('mouseover',(e) => {
						this.rotatecursor.show();
					})
					.on('mouseout',(e) => {
						if (!pd.elm('.fpstyle_cursor')) this.rotatecursor.hide();
					})
					.on('mousedown,touchstart',(e) => {
						var pointer=(e.changedTouches)?e.changedTouches[0]:e;
						var rect=this.panel.getBoundingClientRect();
						var keep={
							centerX:rect.left+rect.width/2,
							centerY:rect.top+rect.height/2,
							radian:this.properties.radian,
							clientX:pointer.clientX,
							clientY:pointer.clientY
						};
						if (!pd.elm('.fpstyle_cursor'))
						{
							pd.elm('head').append(
								pd.create('style')
								.addclass('fpstyle_cursor')
								.attr('media','screen')
								.attr('type','text/css')
								.text('body *{cursor:none !important;}')
							);
						}
						this.move(
							this.properties.bounds,
							this.rotate(
								this.properties.bounds,
								this.screenorigin(),
								this.properties.radian*-1
							),
							'center center'
						);
						if (this.listeners.rotating) window.off('mousemove,touchmove',this.listeners.rotating);
						if (this.listeners.rotateend) window.off('mouseup,touchend',this.listeners.rotateend);
						this.listeners.rotating=(e) => {
							var pointer=(e.changedTouches)?e.changedTouches[0]:e;
							this.properties.radian=keep.radian+((from,to) => {
								var radian=Math.atan2(from.y,from.x)-Math.atan2(to.y,to.x);
								return radian;
							})({x:(keep.centerX-keep.clientX)*-1,y:keep.centerY-keep.clientY},{x:(keep.centerX-pointer.clientX)*-1,y:keep.centerY-pointer.clientY});
							this.panel.css({
								transform:'rotate('+(this.properties.radian*180/Math.PI).toString()+'deg)'
							});
							this.callevent('fp.rotating',{sender:this,datas:this.screenbounds()});
							e.stopPropagation();
							e.preventDefault();
						};
						this.listeners.rotateend=(e) => {
							if (pd.elm('.fpstyle_cursor')) pd.elm('head').removeChild(pd.elm('.fpstyle_cursor'));
							this.move(
								this.properties.bounds,
								this.rotate(
									this.properties.bounds,
									{left:this.properties.bounds.left+this.properties.bounds.width/2,top:this.properties.bounds.top+this.properties.bounds.height/2},
									this.properties.radian
								)
							);
							this.rotatecursor.hide();
							if (this.listeners.rotating) window.off('mousemove,touchmove',this.listeners.rotating);
							if (this.listeners.rotateend) window.off('mouseup,touchend',this.listeners.rotateend);
							this.callevent('fp.rotateend',{sender:this,datas:this.screenbounds()});
							e.stopPropagation();
							e.preventDefault();
						};
						window.on('mousemove,touchmove',this.listeners.rotating);
						window.on('mouseup,touchend',this.listeners.rotateend);
						e.stopPropagation();
						e.preventDefault();
					});
					((size) => {
						this.rotatecursor=pd.create('img').css({
							cursor:'none',
							display:'none',
							height:'30px',
							left:'0',
							pointerEvents:'none',
							position:'fixed',
							top:'0',
							width:'30px'
						})
						.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAFMN540AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAnJJREFUeNpiYMAGzM3N70OZ/1EkHBwcEAL///8XAFEAAcRAGKDoQwNgCYAAgqNVq1YZQAX/Y0gqKChgGOPi4vIeRUBAQOA/mvH/GYgBAAFENII7DupY7F5BCkQsroT6hgnE+PPnjwAWSUxjPT0976N5D9NhV69eTcDrfIAAwu0vYITm5uYWTJo0qQAaufhBQ0MDyKr/IJ8gawCxoXH1H6oGFaSlpc0nMl7+Q9WiCoaGhu4npBOq5j+6kxtw2XzmzJkAYJTCnPsfFA5YAwlqCM50AQQKRIc6LCz8/PzOAzWiJCiAAKINAtriAPICiCZaE8h5aBnzP8zZeDVCE+x/9ECDxQTOBA2LP1xJEVb+4EoLWFMOwVQIjbv/xIclJK6ZYBmXxMhQwF8e4i+FGJBtRo4mXLEALkJw5eUGqH+wJcH/U6dO3Y8tGtFDEwVAcxA4/o2Njd+TFDIGBgYoKQ1fyYc1gEBFEE7nkgsAAmzwI1ARBsoT6OEHwyBxkDxSUYcXMBKqAhYsWDD/wYMHyBHHoKqqekBGRuYCPz//Rz4+Pv7jx48b3L592+HChQtwdUpKSh/i4uIKgWYsIKXwUgBqfA/zjbW19Xn0ehhPyBiA1MP0gswhqqzev3+/A6wcA6UqYi3E5gBYxQgyD2QuXg3QdgNYMaWVA0g/zBPY2iMo9QMsiIipaIkBSJXxf+R6h2nQZBvkCo7YrAED6G0uqH7iKkhQCoQlCpzNDiygsLCwH1awIrVK/iOLkexzQm0CdMeS1BSgVgJCx6CmNqlRRhQAtQixWQjKRqAsBKrzgCESQHRQEwv6+vr6Y2Nj14N8RVJrcqAAAGCrkdg7oC1hAAAAAElFTkSuQmCC');
						window.on('mousemove,touchmove',(e) => {
							var pointer=(e.changedTouches)?e.changedTouches[0]:e;
							this.rotatecursor.css({left:(pointer.clientX-size/2).toString()+'px',top:(pointer.clientY-size/2).toString()+'px'});
						});
					})(30);
					return this.rotateclip;
				})(10)
			);
		}
	}
	/* event call */
	callevent(type,param){
		var call=(index,param,callback) => {
			var listener=this.eventlisteners[type][index];
			var promise=(listener,param) => {
				return new Promise((resolve,reject) => {
					resolve(listener(param));
				});
			};
			promise(listener,param).then((resp) => {
				if (resp) param=resp;
				if (!param.error)
				{
					index++;
					if (index<this.eventlisteners[type].length) call(index,param,callback);
					else callback(param);
				}
				else callback(param);
			});
		};
		return new Promise((resolve,reject) => {
			param['type']=type;
			param['error']=false;
			if (type in this.eventlisteners)
			{
				if (this.eventlisteners[type].length!=0)
				{
					call(0,param,(param) => {
						resolve(param);
					});
				}
				else resolve(param);
			}
			else resolve(param);
		});
	}
	/* move to center on display */
	centering(){
		var rect=this.panel.getBoundingClientRect();
		this.move({left:rect.left,top:rect.top},{left:(window.innerWidth-rect.width)/2,top:(window.innerHeight-rect.height)/2});
		this.callevent('fp.relocate',{sender:this,datas:this.screenbounds()});
		return this;
	}
	/* drag */
	drag(event){
		var pointer=(event.changedTouches)?event.changedTouches[0]:event;
		var rect=this.panel.getBoundingClientRect();
		var keep={
			clientX:pointer.clientX,
			clientY:pointer.clientY
		};
		if (this.isDraggable)
		{
			if (this.listeners.dragging) window.off('mousemove,touchmove',this.listeners.dragging);
			if (this.listeners.dragend) window.off('mouseup,touchend',this.listeners.dragend);
			switch (this.panel.css('position'))
			{
				case 'absolute':
					var parent=this.panel.parentNode.getBoundingClientRect();
					this.listeners.dragging=(e) => {
						var pointer=(e.changedTouches)?e.changedTouches[0]:e;
						this.move(
							{
								left:keep.clientX,
								top:keep.clientY
							},
							{
								left:pointer.clientX,
								top:pointer.clientY
							}
						);
						keep.clientX=pointer.clientX;
						keep.clientY=pointer.clientY;
						this.callevent('fp.dragging',{sender:this,datas:this.screenbounds()});
						e.stopPropagation();
						e.preventDefault();
					};
					this.listeners.dragend=(e) => {
						if (this.listeners.dragging) window.off('mousemove,touchmove',this.listeners.dragging);
						if (this.listeners.dragend) window.off('mouseup,touchend',this.listeners.dragend);
						this.callevent('fp.dragend',{sender:this,datas:this.screenbounds()});
						e.stopPropagation();
						e.preventDefault();
					};
					window.on('mousemove,touchmove',this.listeners.dragging);
					window.on('mouseup,touchend',this.listeners.dragend);
					break;
				case 'fixed':
					this.listeners.dragging=(e) => {
						var pointer=(e.changedTouches)?e.changedTouches[0]:e;
						this.move(
							{
								left:keep.clientX,
								top:keep.clientY
							},
							{
								left:pointer.clientX,
								top:pointer.clientY
							}
						);
						keep.clientX=pointer.clientX;
						keep.clientY=pointer.clientY;
						this.screenposition().callevent('fp.dragging',{sender:this,datas:this.screenbounds()});
						e.stopPropagation();
						e.preventDefault();
					};
					this.listeners.dragend=(e) => {
						if (this.listeners.dragging) window.off('mousemove,touchmove',this.listeners.dragging);
						if (this.listeners.dragend) window.off('mouseup,touchend',this.listeners.dragend);
						this.callevent('fp.dragend',{sender:this,datas:this.screenbounds()});
						e.stopPropagation();
						e.preventDefault();
					};
					window.on('mousemove,touchmove',this.listeners.dragging);
					window.on('mouseup,touchend',this.listeners.dragend);
					break;
			}
		}
		return this;
	}
	/* focus */
	focus(){
		if (this.isResizable) this.resizeclip.show();
		if (this.isRotatable)
		{
			this.rotateclip.show();
			if (!this.rotatecursor.parentNode) this.panel.parentNode.append(this.rotatecursor);
		}
		this.callevent('fp.focus',{sender:this,datas:this.screenbounds()});
		return this;
	}
	/* initialize properties */
	init(args){
		if (!(args instanceof Object))
		{
			var rect=this.panel.getBoundingClientRect();
			this.properties.bounds={
				left:rect.left,
				top:rect.top,
				width:rect.width,
				height:rect.height
			};
			switch (this.panel.css('position'))
			{
				case 'absolute':
					if (this.panel.parentNode instanceof HTMLDocument)
					{
						this.properties.bounds.left+=window.pageXOffset;
						this.properties.bounds.top+=window.pageYOffset;
					}
					else
					{
						var parent=this.panel.parentNode.getBoundingClientRect();
						this.properties.bounds.left-=parent.left;
						this.properties.bounds.top-=parent.top;
					}
					break;
			}
		}
		else
		{
			if ('bounds' in args)
			{
				this.properties.bounds.left=args.bounds.left;
				this.properties.bounds.top=args.bounds.top;
				this.properties.bounds.width=args.bounds.width;
				this.properties.bounds.height=args.bounds.height;
			}
			if ('radian' in args) this.properties.radian=args.radian;
			this.move({left:0,top:0},{left:0,top:0});
			this.resize(this.properties.bounds.width,this.properties.bounds.height);
			this.panel.css({
				transform:'rotate('+(this.properties.radian*180/Math.PI).toString()+'deg)',
				transformOrigin:'left top'
			});
		}
		return this;
	}
	/* leave */
	leave(){
		if (this.isResizable) this.resizeclip.hide();
		if (this.isRotatable) this.rotateclip.hide();
		this.callevent('fp.leave',{sender:this,datas:this.screenbounds()});
		return this;
	}
	/* move */
	move(from,to,origin){
		this.properties.bounds.left-=from.left-to.left;
		this.properties.bounds.top-=from.top-to.top;
		this.panel.css({
			left:this.properties.bounds.left.toString()+'px',
			top:this.properties.bounds.top.toString()+'px',
			transformOrigin:(origin)?origin:'left top'
		});
		return this;
	}
	/* resize */
	resize(w,h){
		this.properties.bounds.width=w;
		this.properties.bounds.height=h;
		this.panel.css({
			height:this.properties.bounds.height.toString()+'px',
			width:this.properties.bounds.width.toString()+'px'
		});
		return this;
	}
	/* rotate */
	rotate(point,base,radian){
		var matrix=[Math.cos(radian),-Math.sin(radian),0,Math.sin(radian),Math.cos(radian),0,0,0,1];
		var vec={
			left:point.left-base.left,
			top:point.top-base.top
		};
		return {left:matrix[0]*vec.left+matrix[1]*vec.top+matrix[2]+base.left,top:matrix[3]*vec.left+matrix[4]*vec.top+matrix[5]+base.top};
	}
	/* get the bounds on screen */
	screenbounds(){
		var rect=this.panel.getBoundingClientRect();
		var res={
			left:Math.round(rect.left),
			right:Math.round(rect.right),
			top:Math.round(rect.top),
			bottom:Math.round(rect.bottom),
			width:Math.round(rect.width),
			height:Math.round(rect.height),
			degrees:Math.round(this.properties.radian*(180/Math.PI))
		};
		switch (this.panel.css('position'))
		{
			case 'absolute':
				if (this.panel.parentNode instanceof HTMLDocument)
				{
					res.left+=window.pageXOffset;
					res.right+=+window.pageXOffset;
					res.top+=window.pageYOffset;
					res.bottom+=window.pageYOffset;
				}
				else
				{
					var parent=this.panel.parentNode.getBoundingClientRect();
					res.left-=parent.left;
					res.right-=parent.left;
					res.top-=parent.top;
					res.bottom-=parent.top;
				}
				break;
		}
		return res;
	}
	/* get the origin to panel on screen */
	screenorigin(){
		var rect=this.panel.getBoundingClientRect();
		var res={
			left:rect.left+rect.width/2,
			top:rect.top+rect.height/2
		};
		switch (this.panel.css('position'))
		{
			case 'absolute':
				if (this.panel.parentNode instanceof HTMLDocument)
				{
					res.left+=window.pageXOffset;
					res.top+=window.pageYOffset;
				}
				else
				{
					var parent=this.panel.parentNode.getBoundingClientRect();
					res.left-=parent.left;
					res.top-=parent.top;
				}
				break;
		}
		return res;
	}
	/* get the limit position on screen */
	screenposition(){
		var rect=this.panel.getBoundingClientRect();
		var from={left:rect.left,top:rect.top};
		var to={left:rect.left,top:rect.top};
		if (this.isDraggable)
		{
			switch (this.panel.css('position'))
			{
				case 'fixed':
					var threshold=100;
					if (rect.left>window.innerWidth-threshold) to.left=window.innerWidth-threshold;
					if (rect.right<threshold) to.left=threshold-rect.width;
					if (rect.top>window.innerHeight-threshold) to.top=window.innerHeight-threshold;
					if (rect.bottom<threshold) to.top=threshold-rect.height;
					this.move(from,to);
					break;
			}
		}
		return this;
	}
}
class fp_layer extends fp_panel{
	/* constructor */
	constructor(type,name,visible){
		switch (type)
		{
			case 'draw':
				super(true,false,true);
				break;
			case 'figure':
				super(true,true,true);
				break;
			case 'image':
				super(true,true,true);
				break;
			case 'text':
				super(true,false,true);
				break;
		}
		/* setup properties */
		this.panel.css({pointerEvents:'none',position:'absolute'});
		this.canvas=null;
		this.context=null;
		this.index=-1;
		this.name=(name)?name:'';
		this.type=type;
		this.visible=(typeof visible!=='undefined')?visible:true;
		this.properties['effects']={
			blendmode:'normal',
			blur:0,
			brightness:100,
			contrast:100,
			grayscale:0,
			huerotate:0,
			invert:0,
			opacity:100,
			saturate:100,
			sepia:0,
			shadow:{
				blur:0,
				color:{r:0,g:0,b:0,a:1},
				offset:{x:0,y:0}
			}
		};
		switch (type)
		{
			case 'draw':
				this.properties['draw']=[];
				this.panel.append(
					(() => {
						this.canvas=pd.create('canvas').css({
							display:'block'
						});
						return this.canvas;
					})()
				);
				this.context=this.canvas.getContext('2d');
				break;
			case 'figure':
				this.properties['figure']={
					bordercolor:{r:0,g:0,b:0,a:0},
					borderradius:0,
					borderweight:0,
					fillcolor:{r:255,g:255,b:255,a:1},
					shape:'square'
				};
				this.panel.append(
					(() => {
						this.figure=pd.create('div').css({
							boxSizing:'border-box',
							display:'block',
							height:'100%',
							position:'relative',
							width:'100%'
						});
						return this.figure;
					})()
				);
				break;
			case 'image':
				this.properties['image']={
					src:null,
					origin:{width:0,height:0}
				};
				this.panel.append(
					(() => {
						this.image=pd.create('img').css({
							boxSizing:'border-box',
							display:'block',
							height:'100%',
							position:'relative',
							width:'100%'
						});
						return this.image;
					})()
				);
				break;
			case 'text':
				this.properties['text']={
					color:{r:0,g:0,b:0,a:1},
					fontbold:false,
					fontfamily:'',
					fontitalic:false,
					fontsize:16,
					lineheight:24,
					textalign:'left'
				};
				this.panel.append(
					(() => {
						this.textarea=pd.create('textarea').css({
							backgroundColor:'transparent',
							border:'none',
							boxSizing:'border-box',
							display:'block',
							height:'100%',
							margin:'0',
							outline:'none',
							overflow:'hidden',
							padding:'0',
							pointerEvents:'auto',
							position:'relative',
							resize:'none',
							userSelect:'text',
							whiteSpace:'nowrap',
							width:'100%'
						})
						.on('mousedown,touchstart',(e) => {
							if (e.currentTarget.css('user-select')=='text') e.stopPropagation();
							else e.currentTarget.off('dblclick').on('dblclick',(e) => e.currentTarget.css({cursor:'text',userSelect:'text'}).focus());
						})
						.on('keydown',(e) => e.stopPropagation())
						.on('keyup',(e) => this.resize());
						return this.textarea;
					})()
				);
				break;
		}
		if (!this.visible) this.hide();
	}
	/* apply effect */
	affect(effects,ctx){
		var res=null;
		var createfilters=() => {
			var res=[];
			if (effects.blur!=0) res.push('blur('+effects.blur+'px)');
			if (effects.brightness!=100) res.push('brightness('+effects.brightness+'%)');
			if (effects.contrast!=100) res.push('contrast('+effects.contrast+'%)');
			if (effects.grayscale!=0) res.push('grayscale('+effects.grayscale+'%)');
			if (effects.huerotate!=0) res.push('hue-rotate('+effects.huerotate+'deg)');
			if (effects.invert!=0) res.push('invert('+effects.invert+'%)');
			if (effects.saturate!=100) res.push('saturate('+effects.saturate+'%)');
			if (effects.sepia!=0) res.push('sepia('+effects.sepia+'%)');
			if (effects.shadow.blur!=0 || effects.shadow.offset.x!=0 || effects.shadow.offset.y!=0)
				res.push('drop-shadow('+effects.shadow.offset.x+'px '+effects.shadow.offset.y+'px '+effects.shadow.blur+'px '+this.rgbastringify(effects.shadow.color)+')');
			return (res.length!=0)?res.join(' '):'none';
		};
		if (ctx)
		{
			res=ctx;
			res.filter=createfilters();
			res.globalAlpha=parseInt(effects.opacity)/100;
			res.globalCompositeOperation=effects.blendmode;
		}
		else
		{
			switch (this.type)
			{
				case 'draw':
					res=this.canvas;
					break;
				case 'figure':
					res=this.figure;
					break;
				case 'image':
					res=this.image;
					break;
				case 'text':
					res=this.textarea;
					break;
			}
			((filter) => {
				this.panel.css({mixBlendMode:effects.blendmode});
				res.css({
					opacity:parseInt(effects.opacity)/100,
					webkitFilter:filter,
					mozFilter:filter,
					filter:filter
				});
			})(createfilters());
		}
		return res;
	}
	/* focus */
	focus(edit){
		if (this.type=='text')
			if (edit) this.textarea.focus();
		return super.focus();
	}
	/* handwrite */
	handwrite(point,offset,brush,erase){
		if (this.type=='draw')
		{
			point=this.rotate(
				{left:point.left-offset.left-this.properties.bounds.left,top:point.top-offset.top-this.properties.bounds.top},
				{left:0,top:0},
				this.properties.radian*-1
			);
			if (!('drawing' in this.listeners)) this.listeners['drawing']=null;
			if (!('drawend' in this.listeners)) this.listeners['drawend']=null;
			if (this.listeners.drawing) window.off('mousemove,touchmove',this.listeners.drawing);
			if (this.listeners.drawend) window.off('mouseup,touchend',this.listeners.drawend);
			this.listeners.drawing=(e) => {
				var pointer=(e.changedTouches)?e.changedTouches[0]:e;
				point=this.rotate(
					{left:pointer.clientX-offset.left-this.properties.bounds.left,top:pointer.clientY-offset.top-this.properties.bounds.top},
					{left:0,top:0},
					this.properties.radian*-1
				);
				this.properties.draw[this.properties.draw.length-1].path.push({type:'l',x:point.left,y:point.top});
				this.redraw(this.context);
				this.callevent('fp.drawing',{sender:this,datas:this.screenbounds()});
				e.stopPropagation();
				e.preventDefault();
			};
			this.listeners.drawend=(e) => {
				this.redraw(this.context);
				if (this.listeners.drawing) window.off('mousemove,touchmove',this.listeners.drawing);
				if (this.listeners.drawend) window.off('mouseup,touchend',this.listeners.drawend);
				this.callevent('fp.drawend',{sender:this,datas:this.screenbounds()});
				e.stopPropagation();
				e.preventDefault();
			};
			this.properties.draw.push({
				globalCompositeOperation:((erase)?'destination-out':'source-over'),
				lineCap:'round',
				lineJoin:'round',
				lineWidth:brush.brushweight,
				path:[],
				shadowBlur:brush.brushblur,
				shadowColor:this.rgbastringify({r:brush.brushcolor.r,g:brush.brushcolor.g,b:brush.brushcolor.b,a:brush.brushcolor.a}),
				strokeStyle:this.rgbastringify({r:brush.brushcolor.r,g:brush.brushcolor.g,b:brush.brushcolor.b,a:((erase)?1:brush.brushcolor.a)})
			});
			this.properties.draw[this.properties.draw.length-1].path.push({type:'m',x:point.left,y:point.top});
			this.redraw(this.context);
			window.on('mousemove,touchmove',this.listeners.drawing);
			window.on('mouseup,touchend',this.listeners.drawend);
		}
		return this;
	}
	/* check whether it is a cordinate in the area */
	hit(point,offset)
	{
		var res=false;
		if (!this.visible) return false;
		point=this.rotate(
			{left:point.left-offset.left-this.properties.bounds.left,top:point.top-offset.top-this.properties.bounds.top},
			{left:0,top:0},
			this.properties.radian*-1
		);
		switch (this.type)
		{
			case 'draw':
				res=(this.context.getImageData(point.left,point.top,1,1).data[3]!=0);
				break;
			default:
				this.panel.append(
					(() => {
						this.canvas=pd.create('canvas').css({
							display:'block',
							left:'0',
							opacity:'0',
							position:'absolute',
							top:'0'
						});
						this.canvas.width=this.properties.bounds.width;
						this.canvas.height=this.properties.bounds.height;
						this.context=this.canvas.getContext('2d');
						this.redraw(this.context);
						return this.canvas;
					})()
				);
				res=(this.context.getImageData(point.left,point.top,1,1).data[3]!=0);
				this.panel.removeChild(this.canvas);
				break;
		}
		return res;
	}
	/* initialize properties */
	init(args){
		super.init(args);
		if (args instanceof Object)
		{
			switch (this.type)
			{
				case 'draw':
					if ('bounds' in args)
					{
						this.canvas.width=args.bounds.width;
						this.canvas.height=args.bounds.height;
					}
					if ('draw' in args)
					{
						this.properties.draw=[...args.draw];
						this.redraw(this.context);
					}
					break;
				case 'figure':
					if ('figure' in args)
					{
						this.properties.figure={...args.figure};
						switch (this.properties.figure.shape)
						{
							case 'square':
								this.figure.css({
									backgroundColor:this.rgbastringify(this.properties.figure.fillcolor),
									border:this.properties.figure.borderweight.toString()+'px solid '+this.rgbastringify(this.properties.figure.bordercolor),
									borderRadius:'0'
								});
								break;
							case 'rounded':
								this.figure.css({
									backgroundColor:this.rgbastringify(this.properties.figure.fillcolor),
									border:this.properties.figure.borderweight.toString()+'px solid '+this.rgbastringify(this.properties.figure.bordercolor),
									borderRadius:this.properties.figure.borderradius.toString()+'px'
								});
								break;
							case 'circle':
								this.figure.css({
									backgroundColor:this.rgbastringify(this.properties.figure.fillcolor),
									border:this.properties.figure.borderweight.toString()+'px solid '+this.rgbastringify(this.properties.figure.bordercolor),
									borderRadius:'50%'
								});
								break;
						}
					}
					break;
				case 'image':
					if ('image' in args)
					{
						this.properties.image={...args.image};
						this.image.src=this.properties.image.src;
					}
					break;
				case 'text':
					if ('text' in args)
					{
						this.properties.text={...args.text};
						this.textarea.css({
							color:this.rgbastringify(this.properties.text.color),
							fontFamily:this.properties.text.fontfamily,
							fontSize:this.properties.text.fontsize.toString()+'px',
							fontStyle:(this.properties.text.fontitalic)?'italic':'normal',
							fontWeight:(this.properties.text.fontbold)?'bold':'normal',
							lineHeight:this.properties.text.lineheight.toString()+'px',
							textAlign:this.properties.text.textalign
						});
						if ('text' in this.properties.text)
						{
							this.textarea.val(this.properties.text.text);
							delete this.properties.text.text;
						}
						this.resize();
					}
					break;
			}
			if ('effects' in args) this.properties.effects={...args.effects};
			this.affect(this.properties.effects);
		}
		return this;
	}
	/* leave */
	leave(){
		if (this.type=='text') this.textarea.css({cursor:'inherit',userSelect:'none'}).blur();
		return super.leave();
	}
	/* draw */
	redraw(ctx,detail){
		if (!ctx)
		{
			ctx=((canvas) => {
				canvas.width=this.properties.bounds.width;
				canvas.height=this.properties.bounds.height;
				return canvas.getContext('2d');
			})(pd.create('canvas'));
		}
		switch (this.type)
		{
			case 'draw':
				ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
				for (var i=0;i<this.properties.draw.length;i++)
				{
					var draw=this.properties.draw[i];
					var path=new Path2D();
					ctx.globalCompositeOperation=draw.globalCompositeOperation;
					ctx.lineCap=draw.lineCap;
					ctx.lineJoin=draw.lineJoin;
					ctx.lineWidth=draw.lineWidth;
					ctx.shadowBlur=draw.shadowBlur;
					ctx.shadowColor=draw.shadowColor;
					ctx.strokeStyle=draw.strokeStyle;
					for (var i2=0;i2<draw.path.length;i2++)
						switch(draw.path[i2].type)
						{
							case 'm':
								path.moveTo(draw.path[i2].x,draw.path[i2].y);
								break;
							case 'l':
								path.lineTo(draw.path[i2].x,draw.path[i2].y);
								break;
						}
					path.moveTo(draw.path[draw.path.length-1].x,draw.path[draw.path.length-1].y);
					path.closePath();
					ctx.stroke(path);
				}
				break;
			case 'figure':
				var x=0;
				var y=0;
				var width=this.properties.bounds.width;
				var height=this.properties.bounds.height;
				var radius=this.properties.figure.borderradius;
				var hasBorder=(this.properties.figure.bordercolor.a>0);
				var setupstroke=() => {
					ctx.lineWidth=this.properties.figure.borderweight;
					if (ctx.lineWidth>Math.min(width/2,height/2)) ctx.lineWidth=Math.min(width/2,height/2);
					x+=ctx.lineWidth/2;
					y+=ctx.lineWidth/2;
					width-=ctx.lineWidth;
					height-=ctx.lineWidth;
					radius=Math.max(radius-ctx.lineWidth/2,0);
				};
				switch (this.properties.figure.shape)
				{
					case 'square':
						ctx.fillStyle=this.rgbastringify(this.properties.figure.fillcolor);
						ctx.fillRect(x,y,width,height);
						if (hasBorder)
						{
							ctx.strokeStyle=this.rgbastringify(this.properties.figure.bordercolor);
							setupstroke();
							ctx.strokeRect(x,y,width,height);
						}
						break;
					case 'rounded':
						ctx.fillStyle=this.rgbastringify(this.properties.figure.fillcolor);
						ctx.beginPath();
						ctx.moveTo(x,y+radius);
						ctx.lineTo(x,y+height-radius);
						ctx.arcTo(x,y+height,x+radius,y+height,radius);
						ctx.lineTo(x+width-radius,y+height);
						ctx.arcTo(x+width,y+height,x+width,y+height-radius,radius);
						ctx.lineTo(x+width,y+radius);
						ctx.arcTo(x+width,y,x+width-radius,y,radius);
						ctx.lineTo(x+radius,y);
						ctx.arcTo(x,y,x,y+radius,radius);
						ctx.closePath();
						ctx.fill();
						if (hasBorder)
						{
							ctx.strokeStyle=this.rgbastringify(this.properties.figure.bordercolor);
							setupstroke();
							ctx.beginPath();
							ctx.moveTo(x,y+radius);
							ctx.lineTo(x,y+height-radius);
							ctx.arcTo(x,y+height,x+radius,y+height,radius);
							ctx.lineTo(x+width-radius,y+height);
							ctx.arcTo(x+width,y+height,x+width,y+height-radius,radius);
							ctx.lineTo(x+width,y+radius);
							ctx.arcTo(x+width,y,x+width-radius,y,radius);
							ctx.lineTo(x+radius,y);
							ctx.arcTo(x,y,x,y+radius,radius);
							ctx.closePath();
							ctx.stroke();
						}
						break;
					case 'circle':
						ctx.fillStyle=this.rgbastringify(this.properties.figure.fillcolor);
						ctx.beginPath();
						ctx.ellipse(
							width/2,
							height/2,
							width/2,
							height/2,
							0,
							0,
							Math.PI*2
						);
						ctx.closePath();
						ctx.fill();
						if (hasBorder)
						{
							ctx.strokeStyle=this.rgbastringify(this.properties.figure.bordercolor);
							setupstroke();
							ctx.beginPath();
							ctx.ellipse(
								x+width/2,
								y+height/2,
								width/2,
								height/2,
								0,
								0,
								Math.PI*2
							);
							ctx.closePath();
							ctx.stroke();
						}
						break;
				}
				break;
			case 'image':
				if (detail)
				{
					((image) => {
						image.width=this.properties.bounds.width;
						image.height=this.properties.bounds.height;
						image.src=this.properties.image.src;
						ctx.drawImage(image,0,0,this.properties.bounds.width,this.properties.bounds.height);
					})(new Image());
				}
				else ctx.fillRect(0,0,this.properties.bounds.width,this.properties.bounds.height);
				break;
			case 'text':
				if (detail)
				{
					var texts=this.textarea.val().split('\n');
					var point={left:0,top:((canvas) => {
						var res=0;
						var context=null;
						var datas=[];
						canvas.width=this.properties.text.fontsize;
						canvas.height=this.properties.text.fontsize;
						context=canvas.getContext('2d');
						context.fillStyle='rgba(255,255,255,1)';
						context.font=((this.properties.text.fontitalic)?'italic':'normal')+' '+((this.properties.text.fontbold)?'bold':'normal')+' '+this.properties.text.fontsize.toString()+'px '+this.properties.text.fontfamily;
						context.textAlign='left';
						context.textBaseline='top';
						context.fillText('A',0,0);
						datas=context.getImageData(0,0,this.properties.text.fontsize,this.properties.text.fontsize).data;
						for (var i=0;i<datas.length;i+=4)
							if (datas[i]==255) res=Math.ceil(i/(this.properties.text.fontsize*4));
						return (this.properties.text.lineheight-res)/2;
					})(pd.create('canvas'))};
					ctx.fillStyle=this.rgbastringify(this.properties.text.color);
					ctx.font=((this.properties.text.fontitalic)?'italic':'normal')+' '+((this.properties.text.fontbold)?'bold':'normal')+' '+this.properties.text.fontsize.toString()+'px '+this.properties.text.fontfamily;
					ctx.textAlign=this.properties.text.textalign;
					ctx.textBaseline='top';
					switch (this.properties.text.textalign)
					{
						case 'left':
							point.left=0;
							break;
						case 'center':
							point.left=this.properties.bounds.width/2;
							break;
						case 'right':
							point.left=this.properties.bounds.width;
							break;
					}
					for (var i=0;i<texts.length;i++)
					{
						ctx.fillText(texts[i],point.left,point.top);
						point.top+=parseFloat(this.properties.text.lineheight);
					}
				}
				else ctx.fillRect(0,0,this.properties.bounds.width,this.properties.bounds.height);
				break;
		}
		return ctx.canvas;
	}
	/* resize */
	resize(w,h){
		if (this.type=='text')
		{
			((canvas) => {
				var context=canvas.getContext('2d');
				var texts=this.textarea.val().split('\n');
				var res={w:0,h:0};
				context.font=((this.properties.text.fontitalic)?'italic':'normal')+' '+((this.properties.text.fontbold)?'bold':'normal')+' '+this.properties.text.fontsize.toString()+'px '+this.properties.text.fontfamily;
				for (var i=0;i<texts.length;i++)
				{
					var metrics=context.measureText(texts[i]+' ');
					if (res.w<metrics.width) res.w=metrics.width;
					res.h+=this.properties.text.lineheight;
				}
				w=Math.ceil(res.w);
				h=Math.ceil(res.h);
			})(pd.create('canvas'));
		}
		return super.resize(w,h);
	}
	/* convert to rgba string */
	rgbastringify(args){
		return 'rgba('+args.r+','+args.g+','+args.b+','+args.a+')';
	}
	/* show */
	show(){
		this.visible=true;
		this.panel.show();
		return this;
	}
	/* hide */
	hide(){
		this.visible=false;
		this.panel.hide();
		return this;
	}
}
class fp_dialog extends fp_panel{
	/* constructor */
	constructor(title,width,disusebuttons){
		super(true,false,false);
		/* setup properties */
		this.initialized=false;
		this.keep={};
		this.parts={
			div:pd.create('div').css({
				boxSizing:'border-box',
				position:'relative',
				verticalAlign:'top'
			}),
			span:pd.create('span').css({
				boxSizing:'border-box',
				color:'#fff',
				display:'inline-block',
				lineHeight:'2em',
				padding:'0 0.5em',
				position:'relative',
				verticalAlign:'top'
			})
		};
		this.validation=null;
		this.contents=this.parts.div.clone().css({
			overflowX:'hidden',
			overflowY:'auto',
			padding:'1em',
			width:'100%'
		});
		this.ok=new fp_button({type:'normal',label:'OK'});
		this.cancel=new fp_button({type:'normal',label:'Cancel'});
		this.close=pd.create('img').css({
			boxSizing:'border-box',
			cursor:'pointer',
			height:'2.25em',
			position:'absolute',
			right:0,
			top:0,
			width:'2.25em'
		})
		.attr('src','https://freepei.net/image/del.svg')
		.on('click',(e) => {
			this.callevent('fp.cancel',{sender:this,datas:this.keep});
			this.panel.hide();
			e.stopPropagation();
			e.preventDefault();
		});
		/* append elements */
		this.panel.css({
			backgroundColor:'rgba(48,48,48,1)',
			border:'1px solid rgba(0,0,0,0.5)',
			borderRadius:'0.25em',
			boxShadow:'0 0 3px rgba(0,0,0,0.35)',
			cursor:'default',
			display:'none',
			maxHeight:'calc(100% - 2em)',
			maxWidth:'calc(100% - 2em)',
			padding:'2.25em 0 calc(2.5em + 1px) 0',
			position:'fixed',
			width:width
		})
		.append(this.contents)
		.append(
			this.parts.div.clone().css({
				boxShadow:'0 1px 0 rgba(0,0,0,0.5),inset 0 0 1px rgba(255,255,255,0.5)',
				color:'#fff',
				cursor:'grab',
				height:'2.25em',
				left:'0',
				lineHeight:'2.25em',
				top:'0',
				position:'absolute',
				textAlign:'center',
				width:'100%'
			})
			.html(title)
			.on('mousedown,touchstart',(e) => {
				this.drag(e);
				e.stopPropagation();
				e.preventDefault();
			})
		)
		.append(this.close)
		.on('mousedown,touchstart',(e) => e.stopPropagation());
		if (!disusebuttons)
		{
			this.panel.append(
				this.parts.div.clone().css({
					borderTop:'1px solid rgba(192,192,192,0.85)',
					bottom:'0',
					left:'0',
					position:'absolute',
					width:'100%'
				})
				.append(this.ok.button.css({
					height:'2em',
					lineHeight:'1.5em',
					margin:'0.25em 0.125em 0.25em 0.25em',
					width:'calc(50% - 0.375em)'
				})
				.on('click',(e) => {
					if (!this.ok.isDisabled)
					{
						var res=this.validation();
						if (res)
						{
							this.callevent('fp.change',{sender:this,datas:res});
							this.panel.hide();
						}
					}
					e.stopPropagation();
					e.preventDefault();
				}))
				.append(this.cancel.button.css({
					height:'2em',
					lineHeight:'1.5em',
					margin:'0.25em 0.25em 0.25em 0.125em',
					width:'calc(50% - 0.375em)'
				})
				.on('click',(e) => {
					if (!this.cancel.isDisabled)
					{
						this.callevent('fp.cancel',{sender:this,datas:this.keep});
						this.panel.hide();
					}
					e.stopPropagation();
					e.preventDefault();
				}))
			);
		}
		else this.panel.css({padding:'2.25em 0 0 0'});
		/* resize event */
		((callback) => {
			let observer=new IntersectionObserver(callback,{root:null,rootMargin:'0px',threshold:1.0});
			observer.observe(this.panel);
			window.on('resize',callback);
		})(() => {
			this.contents
			.css({height:'auto'})
			.css({height:this.panel.innerheight().toString()+'px'});
		});
	}
	/* show */
	show(){
		if (!this.initialized)
		{
			this.panel.show();
			this.init().centering();
		}
		this.initialized=true;
		return this;
	}
	/* hide */
	hide(){
		this.panel.hide();
		return this;
	}
}
class fp_colorpicker extends fp_dialog{
	/* constructor */
	constructor(){
		super('Color picker','25em');
		/* setup properties */
		this.r=new fp_range(0,255,1).input.on('input',(e) => this.redraw());
		this.g=new fp_range(0,255,1).input.on('input',(e) => this.redraw());
		this.b=new fp_range(0,255,1).input.on('input',(e) => this.redraw());
		this.a=new fp_range(0,1,0.1).input.on('input',(e) => this.redraw());
		this.redraw=() => {
			this.contents.elm('.fp_colormonitor').css({
				backgroundColor:'rgba('+this.r.val()+','+this.g.val()+','+this.b.val()+','+this.a.val()+')'
			});
			this.contents.elm('.fp_colorguide').html('r:'+this.r.val()+'&nbsp;g:'+this.g.val()+'&nbsp;b:'+this.b.val()+'&nbsp;a:'+this.a.val());
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		};
		this.validation=() => {
			var res={...this.keep};
			res.r=this.r.val();
			res.g=this.g.val();
			res.b=this.b.val();
			res.a=this.a.val();
			return res;
		};
		/* append elements */
		this.contents
		.append(
			this.parts.div.clone().css({
				textAlign:'center',
				width:'100%'
			})
			.append(
				this.parts.div.clone().addclass('fp_colormonitor').css({
					border:'1px solid rgba(192,192,192,0.85)',
					margin:'0px auto',
					paddingTop:'25%',
					width:'50%'
				})
			)
			.append(
				this.parts.span.clone().addclass('fp_colorguide').css({textAlign:'center',width:'100%'})
			)
		)
		.append(this.parts.span.clone().css({width:'5em'}).html('red'))
		.append(this.r.css({width:'calc(100% - 5em)'}))
		.append(this.parts.span.clone().css({width:'5em'}).html('green'))
		.append(this.g.css({width:'calc(100% - 5em)'}))
		.append(this.parts.span.clone().css({width:'5em'}).html('blue'))
		.append(this.b.css({width:'calc(100% - 5em)'}))
		.append(this.parts.span.clone().css({width:'5em'}).html('alpha'))
		.append(this.a.css({width:'calc(100% - 5em)'}));
	}
	/* show */
	show(args){
		super.show();
		this.keep=args;
		this.r.val(this.keep.r);
		this.g.val(this.keep.g);
		this.b.val(this.keep.b);
		this.a.val(this.keep.a);
		this.redraw();
		this.panel.show();
		this.r.focus();
	}
}
class fp_brushoption extends fp_dialog{
	/* constructor */
	constructor(){
		super('Brush option','25em');
		/* setup properties */
		this.brushweight=new fp_range(1,100,1).input.on('input',(e) => this.redraw());
		this.brushblur=new fp_range(0,50,1).input.on('input',(e) => this.redraw());
		this.brushcolor=new fp_colorpicker()
		.event.on('fp.preview',(e) => {
			this.resetcolor(e.datas);
			this.redraw();
		})
		.event.on('fp.change',(e) => {
			this.resetcolor(e.datas);
			this.redraw();
		})
		.event.on('fp.cancel',(e) => {
			this.resetcolor(e.datas);
			this.redraw();
		});
		this.redraw=() => {
			this.contents.elm('.fp_brushmonitor').css({
				backgroundColor:this.contents.elm('.fp_brushcolormonitor').css('background-color'),
				boxShadow:'0 0 '+this.brushblur.val()+'px '+this.contents.elm('.fp_brushcolormonitor').css('background-color'),
				height:this.brushweight.val()+'px',
				width:this.brushweight.val()+'px'
			});
			this.contents.elm('.fp_brushguide').html('w:'+this.brushweight.val()+'px&nbsp;b:'+this.brushblur.val()+'px');
		};
		this.validation=() => {
			var res={...this.keep};
			res.brushcolor={
				r:this.contents.elm('.fp_brushcolorred').val(),
				g:this.contents.elm('.fp_brushcolorgreen').val(),
				b:this.contents.elm('.fp_brushcolorblue').val(),
				a:this.contents.elm('.fp_brushcoloralpha').val()
			};
			res.brushweight=this.brushweight.val();
			res.brushblur=this.brushblur.val();
			return res;
		};
		/* append elements */
		this.contents
		.append(
			this.parts.div.clone().css({
				height:'100px',
				marginBottom:'0.5em',
				width:'100%'
			})
			.append(
				this.parts.div.clone().addclass('fp_brushmonitor').css({
					borderRadius:'50%',
					height:'0',
					left:'50%',
					position:'absolute',
					top:'50%',
					transform:'translate(-50%,-50%)',
					width:'0'
				})
			)
		)
		.append(
			this.parts.span.clone().addclass('fp_brushguide').css({textAlign:'center',width:'100%'})
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({lineHeight:'3em',width:'5em'}).html('color'))
			.append(
				this.parts.div.clone().addclass('fp_brushcolormonitor').css({
					border:'1px solid rgba(192,192,192,0.85)',
					cursor:'pointer',
					display:'inline-block',
					height:'2em',
					margin:'0.5em 0',
					width:'2em'
				})
				.append(pd.create('input').addclass('fp_brushcolorred').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_brushcolorgreen').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_brushcolorblue').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_brushcoloralpha').attr('type','hidden'))
				.on('click',(e) => {
					this.brushcolor.show({
						r:this.contents.elm('.fp_brushcolorred').val(),
						g:this.contents.elm('.fp_brushcolorgreen').val(),
						b:this.contents.elm('.fp_brushcolorblue').val(),
						a:this.contents.elm('.fp_brushcoloralpha').val()
					});
				})
			)
		)
		.append(this.parts.span.clone().css({width:'5em'}).html('weight'))
		.append(this.brushweight.css({width:'calc(100% - 5em)'}))
		.append(this.parts.span.clone().css({width:'5em'}).html('blur'))
		.append(this.brushblur.css({width:'calc(100% - 5em)'}));
		this.panel
		.append(this.brushcolor.panel);
	}
	/* reset color values */
	resetcolor(value)
	{
		this.contents.elm('.fp_brushcolormonitor').css({
			backgroundColor:'rgba('+value.r+','+value.g+','+value.b+','+value.a+')'
		});
		this.contents.elm('.fp_brushcolorred').val(value.r);
		this.contents.elm('.fp_brushcolorgreen').val(value.g);
		this.contents.elm('.fp_brushcolorblue').val(value.b);
		this.contents.elm('.fp_brushcoloralpha').val(value.a);
	}
	/* show */
	show(args){
		super.show();
		this.keep=args;
		this.brushweight.val(this.keep.brushweight);
		this.brushblur.val(this.keep.brushblur);
		this.resetcolor(this.keep.brushcolor);
		this.redraw();
		this.panel.show();
	}
}
class fp_effectoption extends fp_dialog{
	/* constructor */
	constructor(){
		super('Effect option','25em');
		/* setup properties */
		var blendmodes=[
			{key:{value:'normal'}},
			{key:{value:'darken'}},
			{key:{value:'multiply'}},
			{key:{value:'color-burn'}},
			{key:{value:'lighten'}},
			{key:{value:'screen'}},
			{key:{value:'color-dodge'}},
			{key:{value:'overlay'}},
			{key:{value:'soft-light'}},
			{key:{value:'hard-light'}},
			{key:{value:'difference'}},
			{key:{value:'exclusion'}},
			{key:{value:'hue'}},
			{key:{value:'saturation'}},
			{key:{value:'color'}},
			{key:{value:'luminosity'}}
		];
		this.blendmode=new fp_select().select.css({
			height:'2em',
			lineHeight:'1.5em',
			width:'calc(100% - 8em)'
		})
		.assignoption(blendmodes,'key','key')
		.on('change',(e) => {
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.opacity=new fp_range(0,100,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.blur=new fp_range(0,50,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.brightness=new fp_range(0,500,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.contrast=new fp_range(0,500,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.grayscale=new fp_range(0,100,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.huerotate=new fp_range(0,360,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.invert=new fp_range(0,100,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.saturate=new fp_range(0,200,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.sepia=new fp_range(0,100,1).input.on('input',(e) => {
			this.resetguide();
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.shadow={
			blur:new fp_range(0,50,1).input.on('input',(e) => {
				this.resetguide();
				this.callevent('fp.preview',{sender:this,datas:this.validation()});
			}),
			color:new fp_colorpicker()
			.event.on('fp.preview',(e) => {
				this.resetcolor(e.datas);
				this.callevent('fp.preview',{sender:this,datas:this.validation()});
			})
			.event.on('fp.change',(e) => {
				this.resetcolor(e.datas);
				this.callevent('fp.preview',{sender:this,datas:this.validation()});
			})
			.event.on('fp.cancel',(e) => {
				this.resetcolor(e.datas);
				this.callevent('fp.preview',{sender:this,datas:this.validation()});
			}),
			offset:{
				x:new fp_range(-100,100,1).input.on('input',(e) => {
					this.resetguide();
					this.callevent('fp.preview',{sender:this,datas:this.validation()});
				}),
				y:new fp_range(-100,100,1).input.on('input',(e) => {
					this.resetguide();
					this.callevent('fp.preview',{sender:this,datas:this.validation()});
				})
			}
		};
		this.validation=() => {
			var res={...this.keep};
			res.blendmode=this.blendmode.val();
			res.opacity=this.opacity.val();
			res.shadow={
				blur:this.shadow.blur.val(),
				color:{
					r:this.contents.elm('.fp_effectshadowcolorred').val(),
					g:this.contents.elm('.fp_effectshadowcolorgreen').val(),
					b:this.contents.elm('.fp_effectshadowcolorblue').val(),
					a:this.contents.elm('.fp_effectshadowcoloralpha').val()
				},
				offset:{
					x:this.shadow.offset.x.val(),
					y:this.shadow.offset.y.val()
				}
			};
			res.blur=this.blur.val();
			res.brightness=this.brightness.val();
			res.contrast=this.contrast.val();
			res.grayscale=this.grayscale.val();
			res.huerotate=this.huerotate.val();
			res.invert=this.invert.val();
			res.saturate=this.saturate.val();
			res.sepia=this.sepia.val();
			return res;
		};
		/* append elements */
		this.contents
		.append(this.parts.span.clone().css({width:'8em'}).html('blend mode'))
		.append(this.blendmode)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('opacity'))
			.append(this.opacity.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('px'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'100%'}).html('dropshadow'))
			.append(this.parts.span.clone().css({lineHeight:'3em',paddingLeft:'2em',width:'8em'}).html('color'))
			.append(
				this.parts.div.clone().addclass('fp_effectshadowcolormonitor').css({
					border:'1px solid rgba(192,192,192,0.85)',
					cursor:'pointer',
					display:'inline-block',
					height:'2em',
					margin:'0.5em 0',
					width:'2em'
				})
				.append(pd.create('input').addclass('fp_effectshadowcolorred').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_effectshadowcolorgreen').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_effectshadowcolorblue').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_effectshadowcoloralpha').attr('type','hidden'))
				.on('click',(e) => {
					this.shadow.color.show({
						r:this.contents.elm('.fp_effectshadowcolorred').val(),
						g:this.contents.elm('.fp_effectshadowcolorgreen').val(),
						b:this.contents.elm('.fp_effectshadowcolorblue').val(),
						a:this.contents.elm('.fp_effectshadowcoloralpha').val()
					});
				})
			)
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({paddingLeft:'2em',width:'8em'}).html('blur'))
			.append(this.shadow.blur.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('px'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({paddingLeft:'2em',width:'8em'}).html('offset x'))
			.append(this.shadow.offset.x.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('px'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({paddingLeft:'2em',width:'8em'}).html('offset y'))
			.append(this.shadow.offset.y.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('px'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('blur'))
			.append(this.blur.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('px'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('brightness'))
			.append(this.brightness.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('%'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('contrast'))
			.append(this.contrast.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('%'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('grayscale'))
			.append(this.grayscale.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('%'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('hue-rotate'))
			.append(this.huerotate.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('&deg;'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('invert'))
			.append(this.invert.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('%'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('saturate'))
			.append(this.saturate.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('%'))
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({width:'8em'}).html('sepia'))
			.append(this.sepia.css({width:'calc(100% - 12em)'}))
			.append(this.parts.span.clone().css({textAlign:'right',width:'4em'}).html('%'))
		);
		this.panel.append(this.shadow.color.panel);
	}
	/* reset color values */
	resetcolor(value)
	{
		this.contents.elm('.fp_effectshadowcolormonitor').css({
			backgroundColor:'rgba('+value.r+','+value.g+','+value.b+','+value.a+')'
		});
		this.contents.elm('.fp_effectshadowcolorred').val(value.r);
		this.contents.elm('.fp_effectshadowcolorgreen').val(value.g);
		this.contents.elm('.fp_effectshadowcolorblue').val(value.b);
		this.contents.elm('.fp_effectshadowcoloralpha').val(value.a);
	}
	/* reset guide values */
	resetguide()
	{
		this.opacity.closest('div').elms('span').last().html(this.opacity.val()+'%');
		this.shadow.blur.closest('div').elms('span').last().html(this.shadow.blur.val()+'px');
		this.shadow.offset.x.closest('div').elms('span').last().html(this.shadow.offset.x.val()+'px');
		this.shadow.offset.y.closest('div').elms('span').last().html(this.shadow.offset.y.val()+'px');
		this.blur.closest('div').elms('span').last().html(this.blur.val()+'px');
		this.brightness.closest('div').elms('span').last().html(this.brightness.val()+'%');
		this.contrast.closest('div').elms('span').last().html(this.contrast.val()+'%');
		this.grayscale.closest('div').elms('span').last().html(this.grayscale.val()+'%');
		this.huerotate.closest('div').elms('span').last().html(this.huerotate.val()+'&deg;');
		this.invert.closest('div').elms('span').last().html(this.invert.val()+'%');
		this.saturate.closest('div').elms('span').last().html(this.saturate.val()+'%');
		this.sepia.closest('div').elms('span').last().html(this.sepia.val()+'%');
	}
	/* show */
	show(args){
		super.show();
		this.keep=args;
		this.blendmode.val(this.keep.blendmode);
		this.opacity.val(this.keep.opacity);
		this.shadow.blur.val(this.keep.shadow.blur);
		this.shadow.offset.x.val(this.keep.shadow.offset.x);
		this.shadow.offset.y.val(this.keep.shadow.offset.y);
		this.blur.val(this.keep.blur);
		this.brightness.val(this.keep.brightness);
		this.contrast.val(this.keep.contrast);
		this.grayscale.val(this.keep.grayscale);
		this.huerotate.val(this.keep.huerotate);
		this.invert.val(this.keep.invert);
		this.saturate.val(this.keep.saturate);
		this.sepia.val(this.keep.sepia);
		this.resetcolor(this.keep.shadow.color);
		this.resetguide();
		this.panel.show();
	}
}
class fp_figureoption extends fp_dialog{
	/* constructor */
	constructor(){
		super('Figure option','25em');
		/* setup properties */
		this.square=((radio) => {
			radio.elm('div').css({padding:'0.35em'})
			.elm('div').css({
				border:'2px solid rgba(255,255,255,0.5)',
			});
			return radio;
		})(new fp_radio({id:'fp_figuresquare',name:'fp_figure',src:null}).radio);
		this.rounded=((radio) => {
			radio.elm('div').css({padding:'0.35em'})
			.elm('div').css({
				border:'2px solid rgba(255,255,255,0.5)',
				borderRadius:'0.5em'
			});
			return radio;
		})(new fp_radio({id:'fp_figurerounded',name:'fp_figure',src:null}).radio);
		this.circle=((radio) => {
			radio.elm('div').css({padding:'0.35em'})
			.elm('div').css({
				border:'2px solid rgba(255,255,255,0.5)',
				borderRadius:'50%'
			});
			return radio;
		})(new fp_radio({id:'fp_figurecircle',name:'fp_figure',src:null}).radio);
		this.borderradius=new fp_input().input.css({
			height:'2em',
			lineHeight:'1.5em',
			textAlign:'right',
			width:'calc(100% - 11em)'
		})
		.on('change',(e) => {
			if (!e.currentTarget.val()) e.currentTarget.val('0');
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.borderweight=new fp_input().input.css({
			height:'2em',
			lineHeight:'1.5em',
			textAlign:'right',
			width:'calc(100% - 11em)'
		})
		.on('change',(e) => {
			if (!e.currentTarget.val()) e.currentTarget.val('0');
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.fillcolor=new fp_colorpicker()
		.event.on('fp.preview',(e) => {
			this.resetcolor('fill',e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		})
		.event.on('fp.change',(e) => {
			this.resetcolor('fill',e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		})
		.event.on('fp.cancel',(e) => {
			this.resetcolor('fill',e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.bordercolor=new fp_colorpicker()
		.event.on('fp.preview',(e) => {
			this.resetcolor('border',e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		})
		.event.on('fp.change',(e) => {
			this.resetcolor('border',e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		})
		.event.on('fp.cancel',(e) => {
			this.resetcolor('border',e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.validation=() => {
			var res={...this.keep};
			if (this.square.elm('input').checked) res.shape='square';
			if (this.rounded.elm('input').checked) res.shape='rounded';
			if (this.circle.elm('input').checked) res.shape='circle';
			res.fillcolor={
				r:this.contents.elm('.fp_fillcolorred').val(),
				g:this.contents.elm('.fp_fillcolorgreen').val(),
				b:this.contents.elm('.fp_fillcolorblue').val(),
				a:this.contents.elm('.fp_fillcoloralpha').val()
			};
			res.bordercolor={
				r:this.contents.elm('.fp_bordercolorred').val(),
				g:this.contents.elm('.fp_bordercolorgreen').val(),
				b:this.contents.elm('.fp_bordercolorblue').val(),
				a:this.contents.elm('.fp_bordercoloralpha').val()
			};
			res.borderradius=(isNaN(this.borderradius.val()))?0:parseInt(this.borderradius.val());
			res.borderweight=(isNaN(this.borderweight.val()))?0:parseInt(this.borderweight.val());
			return res;
		};
		/* append elements */
		this.contents
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({lineHeight:'3em',width:'8em'}).html('shape'))
			.append(this.square)
			.append(this.rounded)
			.append(this.circle)
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({lineHeight:'3em',width:'8em'}).html('color'))
			.append(this.parts.span.clone().css({lineHeight:'3em',width:'auto'}).html('fill'))
			.append(
				this.parts.div.clone().addclass('fp_fillcolormonitor').css({
					border:'1px solid rgba(192,192,192,0.85)',
					cursor:'pointer',
					display:'inline-block',
					height:'2em',
					margin:'0.5em 0',
					width:'2em'
				})
				.append(pd.create('input').addclass('fp_fillcolorred').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_fillcolorgreen').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_fillcolorblue').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_fillcoloralpha').attr('type','hidden'))
				.on('click',(e) => {
					this.fillcolor.show({
						r:this.contents.elm('.fp_fillcolorred').val(),
						g:this.contents.elm('.fp_fillcolorgreen').val(),
						b:this.contents.elm('.fp_fillcolorblue').val(),
						a:this.contents.elm('.fp_fillcoloralpha').val()
					});
				})
			)
			.append(this.parts.span.clone().css({lineHeight:'3em',width:'auto'}).html('border'))
			.append(
				this.parts.div.clone().addclass('fp_bordercolormonitor').css({
					border:'1px solid rgba(192,192,192,0.85)',
					cursor:'pointer',
					display:'inline-block',
					height:'2em',
					margin:'0.5em 0',
					width:'2em'
				})
				.append(pd.create('input').addclass('fp_bordercolorred').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_bordercolorgreen').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_bordercolorblue').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_bordercoloralpha').attr('type','hidden'))
				.on('click',(e) => {
					this.bordercolor.show({
						r:this.contents.elm('.fp_bordercolorred').val(),
						g:this.contents.elm('.fp_bordercolorgreen').val(),
						b:this.contents.elm('.fp_bordercolorblue').val(),
						a:this.contents.elm('.fp_bordercoloralpha').val()
					});
				})
			)
		)
		.append(this.parts.span.clone().css({width:'8em'}).html('border radius'))
		.append(this.borderradius)
		.append(this.parts.span.clone().css({width:'3em'}).html('px'))
		.append(this.parts.span.clone().css({width:'8em'}).html('border weight'))
		.append(this.borderweight)
		.append(this.parts.span.clone().css({width:'3em'}).html('px'));
		this.panel
		.append(this.fillcolor.panel)
		.append(this.bordercolor.panel);
		this.contents.elms('[name=fp_figure]').some((item,index) => {
			item.on('change',(e) => {
				this.callevent('fp.preview',{sender:this,datas:this.validation()});
			});
		});
	}
	/* reset color values */
	resetcolor(key,value)
	{
		this.contents.elm('.fp_'+key+'colormonitor').css({
			backgroundColor:'rgba('+value.r+','+value.g+','+value.b+','+value.a+')'
		});
		this.contents.elm('.fp_'+key+'colorred').val(value.r);
		this.contents.elm('.fp_'+key+'colorgreen').val(value.g);
		this.contents.elm('.fp_'+key+'colorblue').val(value.b);
		this.contents.elm('.fp_'+key+'coloralpha').val(value.a);
	}
	/* show */
	show(args){
		super.show();
		this.keep=args;
		if (this.keep.shape=='square') this.square.elm('input').checked=true;
		if (this.keep.shape=='rounded') this.rounded.elm('input').checked=true;
		if (this.keep.shape=='circle') this.circle.elm('input').checked=true;
		this.borderradius.val(this.keep.borderradius);
		this.borderweight.val(this.keep.borderweight);
		this.resetcolor('fill',this.keep.fillcolor);
		this.resetcolor('border',this.keep.bordercolor);
		this.panel.show();
	}
}
class fp_fontoption extends fp_dialog{
	/* constructor */
	constructor(){
		super('Font option','25em');
		/* setup properties */
		var css={
			upper:{
				borderTop:'1px solid rgba(255,255,255,0.5)',
				borderBottom:'1px solid rgba(255,255,255,0.5)',
				left:'50%',
				position:'absolte',
				textAlign:'left',
				top:'50%',
				transform:'translate(-50%,-50%)'
			},
			lower:{
				borderTop:'1px solid rgba(255,255,255,0.5)',
				borderBottom:'1px solid rgba(255,255,255,0.5)',
				boxSizing:'border-box',
				display:'inline-block',
				height:'calc(50% - 2px)',
				marginTop:'25%',
				position:'relative',
				width:'50%'
			}
		};
		var families=((families) => {
			var res=[];
			var span=((span) => {
				pd.elm('body').append(span);
				return span.css({
					display:'block',
					fontSize:'1rem',
					left:'0',
					opacity:'0',
					position:'absolute',
					top:'0'
				}).html('!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~');
			})(pd.create('span'));
			if (!pd.elm('.fpstyle_font'))
			{
				pd.elm('head').append(
					pd.create('style')
					.addclass('fpstyle_font')
					.attr('media','screen')
					.attr('type','text/css')
					.text('@font-face{font-family:Blank;src:url("data:font/opentype;base64,T1RUTwAKAIAAAwAgQ0ZGIDTeCDQAACFkAAAZPERTSUcAAAABAABKqAAAAAhPUy8yAF+xmwAAARAAAABgY21hcCRDbtEAAAdcAAAZ6GhlYWQFl9tDAAAArAAAADZoaGVhB1oD7wAAAOQAAAAkaG10eAPoAHwAADqgAAAQBm1heHAIAVAAAAABCAAAAAZuYW1lIE0HkgAAAXAAAAXrcG9zdP+4ADIAACFEAAAAIAABAAAAAQuFfcPHtV8PPPUAAwPoAAAAANFMRfMAAAAA0UxF8wB8/4gDbANwAAAAAwACAAAAAAAAAAEAAANw/4gAAAPoAHwAfANsAAEAAAAAAAAAAAAAAAAAAAACAABQAAgBAAAAAwPoAZAABQAAAooCWAAAAEsCigJYAAABXgAyANwAAAAAAAAAAAAAAAD3/67/+9///w/gAD8AAAAAQURCTwBAAAD//wNw/4gAAANwAHhgLwH/AAAAAAAAAAAAAAAgAAAAAAARANIAAQAAAAAAAQALAAAAAQAAAAAAAgAHAAsAAQAAAAAAAwAbABIAAQAAAAAABAALAAAAAQAAAAAABQA6AC0AAQAAAAAABgAKAGcAAwABBAkAAACUAHEAAwABBAkAAQAWAQUAAwABBAkAAgAOARsAAwABBAkAAwA2ASkAAwABBAkABAAWAQUAAwABBAkABQB0AV8AAwABBAkABgAUAdMAAwABBAkACAA0AecAAwABBAkACwA0AhsAAwABBAkADQKWAk8AAwABBAkADgA0BOVBZG9iZSBCbGFua1JlZ3VsYXIxLjA0NTtBREJPO0Fkb2JlQmxhbms7QURPQkVWZXJzaW9uIDEuMDQ1O1BTIDEuMDQ1O2hvdGNvbnYgMS4wLjgyO21ha2VvdGYubGliMi41LjYzNDA2QWRvYmVCbGFuawBDAG8AcAB5AHIAaQBnAGgAdAAgAKkAIAAyADAAMQAzACwAIAAyADAAMQA1ACAAQQBkAG8AYgBlACAAUwB5AHMAdABlAG0AcwAgAEkAbgBjAG8AcgBwAG8AcgBhAHQAZQBkACAAKABoAHQAdABwADoALwAvAHcAdwB3AC4AYQBkAG8AYgBlAC4AYwBvAG0ALwApAC4AQQBkAG8AYgBlACAAQgBsAGEAbgBrAFIAZQBnAHUAbABhAHIAMQAuADAANAA1ADsAQQBEAEIATwA7AEEAZABvAGIAZQBCAGwAYQBuAGsAOwBBAEQATwBCAEUAVgBlAHIAcwBpAG8AbgAgADEALgAwADQANQA7AFAAUwAgADEALgAwADQANQA7AGgAbwB0AGMAbwBuAHYAIAAxAC4AMAAuADgAMgA7AG0AYQBrAGUAbwB0AGYALgBsAGkAYgAyAC4ANQAuADYAMwA0ADAANgBBAGQAbwBiAGUAQgBsAGEAbgBrAEEAZABvAGIAZQAgAFMAeQBzAHQAZQBtAHMAIABJAG4AYwBvAHIAcABvAHIAYQB0AGUAZABoAHQAdABwADoALwAvAHcAdwB3AC4AYQBkAG8AYgBlAC4AYwBvAG0ALwB0AHkAcABlAC8AVABoAGkAcwAgAEYAbwBuAHQAIABTAG8AZgB0AHcAYQByAGUAIABpAHMAIABsAGkAYwBlAG4AcwBlAGQAIAB1AG4AZABlAHIAIAB0AGgAZQAgAFMASQBMACAATwBwAGUAbgAgAEYAbwBuAHQAIABMAGkAYwBlAG4AcwBlACwAIABWAGUAcgBzAGkAbwBuACAAMQAuADEALgAgAFQAaABpAHMAIABGAG8AbgB0ACAAUwBvAGYAdAB3AGEAcgBlACAAaQBzACAAZABpAHMAdAByAGkAYgB1AHQAZQBkACAAbwBuACAAYQBuACAAIgBBAFMAIABJAFMAIgAgAEIAQQBTAEkAUwAsACAAVwBJAFQASABPAFUAVAAgAFcAQQBSAFIAQQBOAFQASQBFAFMAIABPAFIAIABDAE8ATgBEAEkAVABJAE8ATgBTACAATwBGACAAQQBOAFkAIABLAEkATgBEACwAIABlAGkAdABoAGUAcgAgAGUAeABwAHIAZQBzAHMAIABvAHIAIABpAG0AcABsAGkAZQBkAC4AIABTAGUAZQAgAHQAaABlACAAUwBJAEwAIABPAHAAZQBuACAARgBvAG4AdAAgAEwAaQBjAGUAbgBzAGUAIABmAG8AcgAgAHQAaABlACAAcwBwAGUAYwBpAGYAaQBjACAAbABhAG4AZwB1AGEAZwBlACwAIABwAGUAcgBtAGkAcwBzAGkAbwBuAHMAIABhAG4AZAAgAGwAaQBtAGkAdABhAHQAaQBvAG4AcwAgAGcAbwB2AGUAcgBuAGkAbgBnACAAeQBvAHUAcgAgAHUAcwBlACAAbwBmACAAdABoAGkA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wwDEAMUAxgDHAMgAyQDKAMsAzADNAM4AzwDQANEA0gDTANQA1QDWANcA2ADZANoA2wDcAN0A3gDfAOAA4QDiAOMA5ADlAOYA5wDoAOkA6gDrAOwA7QDuAO8A8ADxAPIA8wD0APUA9gD3APgA+QD6APsA/AD9AP4A/wEAAQEBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAEVARYBFwEYARkBGgEbARwBHQEeAR8BIAEhASIBIwEkASUBJgEnASgBKQEqASsBLAEtAS4BLwEwATEBMgEzATQBNQE2ATcBOAE5AToBOwE8AT0BPgE/AUABQQFCAUMBRAFFAUYBRwFIAUkBSgFLAUwBTQFOAU8BUAFRAVIBUwFUAVUBVgFXAVgBWQFaAVsBXAFdAV4BXwFgAWEBYgFjAWQBZQFmAWcBaAFpAWoBawFsAW0BbgFvAXABcQFyAXMBdAF1AXYBdwF4AXkBegF7AXwBfQF+AX8BgAGBAYIBgwGEAYUBhgGHAYgBiQGKAYsBjAGNAY4BjwGQAZEBkgGTAZQBlQGWAZcBmAGZAZoBmwGcAZ0BngGfAaABoQGiAaMBpAGlAaYBpwGoAakBqgGrAawBrQGuAa8BsAGxAbIBswG0AbUBtgG3AbgBuQG6AbsBvAG9Ab4BvwHAAcEBwgHDAcQBxQHGAccByAHJAcoBywHMAc0BzgHPAdAB0QHSAdMB1AHVAdYB1wHYAdkB2gHbAdwB3QHeAd8B4AHhAeIB4wHkAeUB5gHnAegB6QHqAesB7AHtAe4B7wHwAfEB8gHzAfQB9QH2AfcB+AH5AfoB+wH8Af0B/gH/AgACAQICAgMCBAIFAgYCBwIIAgkCCgILAgwCDQIOAg8CEAIRAhICEwIUAhUCFgIXAhgCGQIaAhsCHAIdAh4CHwIgAiECIgIjAiQCJQImAicCKAIpAioCKwIsAi0CLgIvAjACMQIyAjMCNAI1AjYCNwI4AjkCOgI7AjwCPQI+Aj8CQAJBAkICQwJEAkUCRgJHAkgCSQJKAksCTAJNAk4CTwJQAlECUgJTAlQCVQJWAlcCWAJZAloCWwJcAl0CXgJfAmACYQJiAmMCZAJlAmYCZwJoAmkCagJrAmwCbQJuAm8CcAJxAnICcwJ0AnUCdgJ3AngCeQJ6AnsCfAJ9An4CfwKAAoECggKDAoQChQKGAocCiAKJAooCiwKMAo0CjgKPApACkQKSApMClAKVApYClwKYApkCmgKbApwCnQKeAp8CoAKhAqICowKkAqUCpgKnAqgCqQKqAqsCrAKtAq4CrwKwArECsgKzArQCtQK2ArcCuAK5AroCuwK8Ar0CvgK/AsACwQLCAsMCxALFAsYCxwLIAskCygLLAswCzQLOAs8C0ALRAtIC0wLUAtUC1gLXAtgC2QLaAtsC3ALdAt4C3wLgAuEC4gLjAuQC5QLmAucC6ALpAuoC6wLsAu0C7gLvAvAC8QLyAvMC9AL1AvYC9wL4AvkC+gL7AvwC/QL+Av8DAAMBAwIDAwMEAwUDBgMHAwgDCQMKAwsDDAMNAw4DDwMQAxEDEgMTAxQDFQMWAxcDGAMZAxoDGwMcAx0DHgMfAyADIQMiAyMDJAMlAyYDJwMoAykDKgMrAywDLQMuAy8DMAMxAzIDMwM0AzUDNgM3AzgDOQM6AzsDPAM9Az4DPwNAA0EDQgNDA0QDRQNGA0cDSANJA0oDSwNMA00DTgNPA1ADUQNSA1MDVANVA1YDVwNYA1kDWgNbA1wDXQNeA18DYANhA2IDYwNkA2UDZgNnA2gDaQNqA2sDbANtA24DbwNwA3EDcgNzA3QDdQN2A3cDeAN5A3oDewN8A30DfgN/A4ADgQOCA4MDhAOFA4YDhwOIA4kDigOLA4wDjQOOA48DkAORA5IDkwOUA5UDlgOXA5gDmQOaA5sDnAOdA54DnwOgA6EDogOjA6QDpQOmA6cDqAOpA6oDqwOsA60DrgOvA7ADsQOyA7MDtAO1A7YDtwO4A7kDugO7A7wDvQO+A78DwAPBA8IDwwPEA8UDxgPHA8gDyQPKA8sDzAPNA84DzwPQA9ED0gPTA9QD1QPWA9cD2APZA9oD2wPcA90D3gPfA+AD4QPiA+MD5APlA+YD5wPoA+kD6gPrA+wD7QPuA+8D8APxA/ID8wP0A/UD9gP3A/gD+QP6A/sD/AP9A/4D/wQABAEEAgQDBAQEBQQGBAcECAQJBAoECwQMBA0EDgQPBBAEEQQSBBMEFAQVBBYEFwQYBBkEGgQbBBwEHQQeBB8EIAQhBCIEIwQkBCUEJgQnBCgEKQQqBCsELAQtBC4ELwQwBDEEMgQzBDQENQQ2BDcEOAQ5BDoEOwQ8BD0EPgQ/BEAEQQRCBEMERARFBEYERwRIBEkESgRLBEwETQROBE8EUARRBFIEUwRUBFUEVgRXBFgEWQRaBFsEXARdBF4EXwRgBGEEYgRjBGQEZQRmBGcEaARpBGoEawRsBG0EbgRvBHAEcQRyBHMEdAR1BHYEdwR4BHkEegR7BHwEfQR+BH8EgASBBIIEgwSEBIUEhgSHBIgEiQSKBIsEjASNBI4EjwSQBJEEkgSTBJQElQSWBJcEmASZBJoEmwScBJ0EngSfBKAEoQSiBKMEpASlBKYEpwSoBKkEqgSrBKwErQSuBK8EsASxBLIEswS0BLUEtgS3BLgEuQS6BLsEvAS9BL4EvwTABMEEwgTDBMQExQTGBMcEyATJBMoEywTMBM0EzgTPBNAE0QTSBNME1ATVBNYE1wTYBNkE2gTbBNwE3QTeBN8E4AThBOIE4wTkBOUE5gTnBOgE6QTqBOsE7ATtBO4E7wTwBPEE8gTzBPQE9QT2BPcE+AT5BPoE+wT8BP0E/gT/BQAFAQUCBQMFBAUFBQYFBwUIBQkFCgULBQwFDQUOBQ8FEAURBRIFEwUUBRUFFgUXBRgFGQUaBRsFHAUdBR4FHwUgBSEFIgUjBSQFJQUmBScFKAUpBSoFKwUsBS0FLgUvBTAFMQUyBTMFNAU1BTYFNwU4BTkFOgU7BTwFPQU+BT8FQAVBBUIFQwVEBUUFRgVHBUgFSQVKBUsFTAVNBU4FTwVQBVEFUgVTBVQFVQVWBVcFWAVZBVoFWwVcBV0FXgVfBWAFYQViBWMFZAVlBWYFZwVoBWkFagVrBWwFbQVuBW8FcAVxBXIFcwV0BXUFdgV3BXgFeQV6BXsFfAV9BX4FfwWABYEFggWDBYQFhQWGBYcFiAWJBYoFiwWMBY0FjgWPBZAFkQWSBZMFlAWVBZYFlwWYBZkFmgWbBZwFnQWeBZ8FoAWhBaIFowWkBaUFpgWnBagFqQWqBasFrAWtBa4FrwWwBbEFsgWzBbQFtQW2BbcFuAW5BboFuwW8Bb0FvgW/BcAFwQXCBcMFxAXFBcYFxwXIBckFygXLBcwFzQXOBc8F0AXRBdIF0wXUBdUF1gXXBdgF2QXaBdsF3AXdBd4F3wXgBeEF4gXjBeQF5QXmBecF6AXpBeoF6wXsBe0F7gXvBfAF8QXyBfMF9AX1BfYF9wX4BfkF+gX7BfwF/QX+Bf8GAAYBBgIGAwYEBgUGBgYHBggGCQYKBgsGDAYNBg4GDwYQBhEGEgYTBhQGFQYWBhcGGAYZBhoGGwYcBh0GHgYfBiAGIQYiBiMGJAYlBiYGJwYoBikGKgYrBiwGLQYuBi8GMAYxBjIGMwY0BjUGNgY3BjgGOQY6BjsGPAY9Bj4GPwZABkEGQgZDBkQGRQZGBkcGSAZJBkoGSwZMBk0GTgZPBlAGUQZSBlMGVAZVBlYGVwZYBlkGWgZbBlwGXQZeBl8GYAZhBmIGYwZkBmUGZgZnBmgGaQZqBmsGbAZtBm4GbwZwBnEGcgZzBnQGdQZ2BncGeAZ5BnoGewZ8Bn0GfgZ/BoAGgQaCBoMGhAaFBoYGhwaIBokGigaLBowGjQaOBo8GkAaRBpIGkwaUBpUGlgaXBpgGmQaaBpsGnAadBp4GnwagBqEGogajBqQGpQamBqcGqAapBqoGqwasBq0GrgavBrAGsQayBrMGtAa1BrYGtwa4BrkGuga7BrwGvQa+Br8GwAbBBsIGwwbEBsUGxgbHBsgGyQbKBssGzAbNBs4GzwbQBtEG0gbTBtQG1QbWBtcG2AbZBtoG2wbcBt0G3gbfBuAG4QbiBuMG5AblBuYG5wboBukG6gbrBuwG7QbuBu8G8AbxBvIG8wb0BvUG9gb3BvgG+Qb6BvsG/Ab9Bv4G/wcABwEHAgcDBwQHBQcGBwcHCAcJBwoHCwcMBw0HDgcPBxAHEQcSBxMHFAcVBxYHFwcYBxkHGgcbBxwHHQceBx8HIAchByIHIwckByUHJgcnBygHKQcqBysHLActBy4HLwcwBzEHMgczBzQHNQc2BzcHOAc5BzoHOwc8Bz0HPgc/B0AHQQdCB0MHRAdFB0YHRwdIB0kHSgdLB0wHTQdOB08HUAdRB1IHUwdUB1UHVgdXB1gHWQdaB1sHXAddB14HXwdgB2EHYgdjB2QHZQdmB2cHaAdpB2oHawdsB20HbgdvB3AHcQdyB3MHdAd1B3YHdwd4B3kHegd7B3wHfQd+B38HgAeBB4IHgweEB4UHhgeHB4gHiQeKB4sHjAeNB44HjweQB5EHkgeTB5QHlQeWB5cHmAeZB5oHmwecB50HngefB6AHoQeiB6MHpAelB6YHpweoB6kHqgerB6wHrQeuB68HsAexB7IHswe0B7UHtge3B7gHuQe6B7sHvAe9B74HvwfAB8EHwgfDB8QHxQfGB8cHyAfJB8oHywfMB80HzgfPB9AH0QfSB9MH1AfVB9YH1wfYB9kH2gfbB9wH3QfeB98H4AfhB+IH4wfkB+UH5gfnB+gH6QfqB+sH7AftB+4H7wfwB/EH8gfzB/QH9Qf2B/cH+Af5B/oH+wf8B/0H/gf/CAAIAQgCCAMIBAgFCAYIBwgICAkICggLCAwIDQgOCA8IEAgRCBIIEwgUCBUIFggXCBgIGQgaCBsIHAgdCB4IHwggCCEIIggjCCQIJQgmCCcIKAgpCCoIKwgsCC0ILggvCDAIMQgyCDMINAg1CDYINwg4CDkIOgg7CDwIPQg+CD8IQAhBCEIIQwhECEUIRghHCEgISQhKCEsg+wy3+iS3AfcQt/kstwP3EPoEFf58+YT6fAf9WP4nFfnSB/fF/DMFprAV+8X4NwX49gamYhX90gf7xfgzBXBmFffF/DcF/PYGDg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4OAAEBAQr4HwwmmhwZLRL7joscBUaLBr0KvQv65xUD6AB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAA==");}')
				);
			}
			for (var i=0;i<families.length;i++)
			{
				span.css({fontFamily:'"'+families[i]+'",Blank'});
				if (span.offsetWidth>0) res.push({name:{value:families[i]}});
			}
			document.body.removeChild(span);
			return res;
		})(['Droid Sans',
			'Roboto',
			'cursive',
			'Comic Sans MS',
			'Jenkins v2.0',
			'Mv Boli',
			'Script',
			'sans-serif',
			'arial',
			'arial black',
			'arial narrow',
			'arial unicode ms',
			'Century Gothic',
			'Franklin Gothic Medium',
			'Gulim',
			'GulimChe',
			'Dotum',
			'Haettenschweiler',
			'Impact',
			'Lucida Sans Unicode',
			'Microsoft Sans Serif',
			'MS Sans Serif',
			'MV Boil',
			'New Gulim',
			'Tahoma',
			'Trebuchet',
			'Trebuchet MS',
			'Verdana',
			'serif',
			'Batang',
			'Book Antiqua',
			'Bookman Old Style',
			'Century',
			'Estrangelo Edessa',
			'Garamond',
			'Gautami',
			'Georgia',
			'Gungsuh',
			'Latha',
			'Mangal',
			'MS Serif',
			'NSimSun',
			'PMingLiU',
			'Palatino Linotype',
			'Raavi',
			'Roman',
			'Shruti',
			'Sylfaen',
			'Times New Roman',
			'Tunga',
			'monospace',
			'BatangChe',
			'Courier',
			'Courier New',
			'DotumChe',
			'GlimChe',
			'GungsuhChe',
			'Lucida Console',
			'MingLiU',
			'OCRB',
			'SimHei',
			'SimSun',
			'Small Fonts',
			'Terminal',
			'fantasy',
			'alba',
			'alba matter',
			'alba super',
			'baby kruffy',
			'Chick',
			'Croobie',
			'Fat',
			'Freshbot',
			'Frosty',
			'GlooGun',
			'Jokewood',
			'Modern',
			'Monotype Corsiva',
			'Poornut',
			'Pussycat Snickers',
			'Weltron Urban',
			'MS UI Gothic',
			'ＭＳ Ｐゴシック',
			'ＭＳ ゴシック',
			'ＭＳ Ｐ明朝',
			'ＭＳ 明朝',
			'メイリオ',
			'Meiryo UI',
			'游ゴシック',
			'游明朝',
			'ヒラギノ角ゴ Pro W3',
			'ヒラギノ角ゴ ProN W3',
			'ヒラギノ角ゴ Pro W6',
			'ヒラギノ角ゴ ProN W6',
			'ヒラギノ角ゴ Std W8',
			'ヒラギノ角ゴ StdN W8',
			'ヒラギノ丸ゴ Pro W4',
			'ヒラギノ丸ゴ ProN W4',
			'ヒラギノ明朝 Pro W3',
			'ヒラギノ明朝 ProN W3',
			'ヒラギノ明朝 Pro W6',
			'ヒラギノ明朝 ProN W6',
			'游ゴシック体',
			'游明朝体',
			'游明朝体+36ポかな',
			'HG行書体',
			'HGP行書体',
			'HG正楷書体-PRO',
			'クレー',
			'筑紫A丸ゴシック',
			'筑紫B丸ゴシック',
			'Osaka',
			'Osaka－等幅'
		]);
		this.left=((radio) => {
			radio.elm('div').css({padding:'0.5em'})
			.elm('div').css(Object.assign(css.upper,{textAlign:'left'}))
			.append(pd.create('div').css(css.lower));
			return radio;
		})(new fp_radio({id:'fp_textalignleft',name:'fp_textalign',src:null}).radio);
		this.center=((radio) => {
			radio.elm('div').css({padding:'0.5em'})
			.elm('div').css(Object.assign(css.upper,{textAlign:'center'}))
			.append(pd.create('div').css(css.lower));
			return radio;
		})(new fp_radio({id:'fp_textaligncenter',name:'fp_textalign',src:null}).radio);
		this.right=((radio) => {
			radio.elm('div').css({padding:'0.5em'})
			.elm('div').css(Object.assign(css.upper,{textAlign:'right'}))
			.append(pd.create('div').css(css.lower));
			return radio;
		})(new fp_radio({id:'fp_textalignright',name:'fp_textalign',src:null}).radio);
		this.fontbold=((checkbox) => {
			checkbox.elm('div div').css({
				color:'rgba(255,255,255,0.5)',
				fontSize:'1.5em',
				fontWeight:'bold',
				lineHeight:'2em',
				textAlign:'center'
			})
			.html('B');
			checkbox.elm('input').on('change',(e) => {
				this.callevent('fp.preview',{sender:this,datas:this.validation()});
			});
			return checkbox;
		})(new fp_checkbox({id:'fp_fontbold',src:null}).checkbox);
		this.fontitalic=((checkbox) => {
			checkbox.elm('div div').css({
				color:'rgba(255,255,255,0.5)',
				fontSize:'1.5em',
				fontStyle:'italic',
				lineHeight:'2em',
				textAlign:'center'
			})
			.html('I');
			checkbox.elm('input').on('change',(e) => {
				this.callevent('fp.preview',{sender:this,datas:this.validation()});
			});
			return checkbox;
		})(new fp_checkbox({id:'fp_fontitalic',src:null}).checkbox);
		this.fontfamily=new fp_select().select.css({
			height:'2em',
			lineHeight:'1.5em',
			width:'calc(100% - 8em)'
		})
		.assignoption(families,'name','name')
		.val('arial')
		.on('change',(e) => {
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.fontsize=new fp_input().input.css({
			height:'2em',
			lineHeight:'1.5em',
			textAlign:'right',
			width:'calc(100% - 11em)'
		})
		.on('change',(e) => {
			if (!e.currentTarget.val()) e.currentTarget.val(getComputedStyle(this.panel).fontSize);
			if (parseFloat(e.currentTarget.val())>parseFloat(this.lineheight.val())) this.lineheight.val(e.currentTarget.val());
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.lineheight=new fp_input().input.css({
			height:'2em',
			lineHeight:'1.5em',
			textAlign:'right',
			width:'calc(100% - 11em)'
		})
		.on('change',(e) => {
			if (!e.currentTarget.val()) e.currentTarget.val(getComputedStyle(this.panel).lineHeight);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.fontcolor=new fp_colorpicker()
		.event.on('fp.preview',(e) => {
			this.resetcolor(e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		})
		.event.on('fp.change',(e) => {
			this.resetcolor(e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		})
		.event.on('fp.cancel',(e) => {
			this.resetcolor(e.datas);
			this.callevent('fp.preview',{sender:this,datas:this.validation()});
		});
		this.validation=() => {
			var res={...this.keep};
			var defaultstyle=getComputedStyle(this.panel);
			if (this.left.elm('input').checked) res.textalign='left';
			if (this.center.elm('input').checked) res.textalign='center';
			if (this.right.elm('input').checked) res.textalign='right';
			res.fontbold=this.fontbold.elm('input').checked;
			res.fontitalic=this.fontitalic.elm('input').checked;
			res.color={
				r:this.contents.elm('.fp_fontcolorred').val(),
				g:this.contents.elm('.fp_fontcolorgreen').val(),
				b:this.contents.elm('.fp_fontcolorblue').val(),
				a:this.contents.elm('.fp_fontcoloralpha').val()
			};
			res.fontfamily=this.fontfamily.val();
			res.fontsize=(isNaN(this.fontsize.val()))?defaultstyle.fontSize:parseInt(this.fontsize.val());
			res.lineheight=(isNaN(this.lineheight.val()))?defaultstyle.lineHeight:parseInt(this.lineheight.val());
			return res;
		};
		/* append elements */
		this.contents
		.append(this.parts.span.clone().css({width:'8em'}).html('font family'))
		.append(this.fontfamily)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({lineHeight:'3em',width:'8em'}).html('color'))
			.append(
				this.parts.div.clone().addclass('fp_fontcolormonitor').css({
					border:'1px solid rgba(192,192,192,0.85)',
					cursor:'pointer',
					display:'inline-block',
					height:'2em',
					margin:'0.5em 0',
					width:'2em'
				})
				.append(pd.create('input').addclass('fp_fontcolorred').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_fontcolorgreen').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_fontcolorblue').attr('type','hidden'))
				.append(pd.create('input').addclass('fp_fontcoloralpha').attr('type','hidden'))
				.on('click',(e) => {
					this.fontcolor.show({
						r:this.contents.elm('.fp_fontcolorred').val(),
						g:this.contents.elm('.fp_fontcolorgreen').val(),
						b:this.contents.elm('.fp_fontcolorblue').val(),
						a:this.contents.elm('.fp_fontcoloralpha').val()
					});
				})
			)
		)
		.append(
			this.parts.div.clone().css({
				width:'100%'
			})
			.append(this.parts.span.clone().css({lineHeight:'3em',width:'8em'}).html('align'))
			.append(this.left)
			.append(this.center)
			.append(this.right)
		)
		.append(
			this.parts.div.clone().css({
				paddingBottom:'0.5em',
				width:'100%'
			})
			.append(this.parts.span.clone().css({lineHeight:'3em',width:'8em'}).html('style'))
			.append(this.fontbold)
			.append(this.fontitalic)
		)
		.append(this.parts.span.clone().css({width:'8em'}).html('font size'))
		.append(this.fontsize)
		.append(this.parts.span.clone().css({width:'3em'}).html('px'))
		.append(this.parts.span.clone().css({width:'8em'}).html('line height'))
		.append(this.lineheight)
		.append(this.parts.span.clone().css({width:'3em'}).html('px'));
		this.panel.append(this.fontcolor.panel);
		this.contents.elms('[name=fp_textalign]').some((item,index) => {
			item.on('change',(e) => {
				this.callevent('fp.preview',{sender:this,datas:this.validation()});
			});
		});
	}
	/* reset color values */
	resetcolor(value)
	{
		this.contents.elm('.fp_fontcolormonitor').css({
			backgroundColor:'rgba('+value.r+','+value.g+','+value.b+','+value.a+')'
		});
		this.contents.elm('.fp_fontcolorred').val(value.r);
		this.contents.elm('.fp_fontcolorgreen').val(value.g);
		this.contents.elm('.fp_fontcolorblue').val(value.b);
		this.contents.elm('.fp_fontcoloralpha').val(value.a);
	}
	/* show */
	show(args){
		super.show();
		this.keep=args;
		if (this.keep.textalign=='left') this.left.elm('input').checked=true;
		if (this.keep.textalign=='center') this.center.elm('input').checked=true;
		if (this.keep.textalign=='right') this.right.elm('input').checked=true;
		this.fontbold.elm('input').checked=this.keep.fontbold;
		this.fontitalic.elm('input').checked=this.keep.fontitalic;
		this.fontfamily.val(this.keep.fontfamily);
		this.fontsize.val(this.keep.fontsize);
		this.lineheight.val(this.keep.lineheight);
		this.resetcolor(this.keep.color);
		this.panel.show();
	}
}
class fp_layeroption extends fp_dialog{
	/* constructor */
	constructor(){
		super('Layer option','30em',true);
		/* setup properties */
		this.active=null;
		this.dragging=null;
		this.layers={};
		this.effect=new fp_effectoption()
		.event.on('fp.preview',(e) => {
			this.active.affect(e.datas);
		})
		.event.on('fp.change',(e) => {
			this.active.properties.effects=e.datas;
			this.active.affect(this.active.properties.effects);
		})
		.event.on('fp.cancel',(e) => {
			this.active.properties.effects=e.datas;
			this.active.affect(this.active.properties.effects);
		});
		this.panel.append(this.effect.panel);
		if (!pd.elm('.fpstyle_layer'))
		{
			pd.elm('head').append(
				pd.create('style')
				.addclass('fpstyle_layer')
				.attr('media','screen')
				.attr('type','text/css')
				.text((() => {
					var res='';
					res+='.fp_layerguide.active{border:1px solid rgba(25,118,210,1);}';
					return res;
				})())
			);
		}
	}
	/* add layer */
	add(layer)
	{
		var uuid=([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
		var createbutton=(classname,src) => {
			var res=pd.create('img').addclass(classname).css({
				boxSizing:'border-box',
				cursor:'pointer',
				height:'3em',
				position:'absolute',
				width:'3em'
			})
			.attr('src',src)
			.on('mousedown,touchstart',(e) => e.stopPropagation());
			return res;
		};
		this.layers[uuid]={
			guide:this.parts.div.clone().addclass('fp_layerguide').css({
				cursor:'grab',
				lineHeight:'2em',
				padding:'0.5em 7em 0.5em 3.5em',
				width:'100%'
			})
			.attr('draggable','true')
			.append(
				this.parts.span.clone().addclass('fp_layername').css({
					color:'#fff',
					display:'inline-block',
					cursor:'inherit',
					lineHeight:'2em',
					overflow:'hidden',
					whiteSpace:'nowrap',
					width:'100%'
				})
				.html(layer.name)
			)
			.append(
				new fp_input().input.css({
					border:'none',
					display:'none',
					height:'2em',
					left:'3.5em',
					lineHeight:'1.5em',
					position:'absolute',
					top:'0.5em',
					width:'calc(100% - 10.5em)'
				})
				.val(layer.name)
				.on('change',(e) => {
					layer.name=e.currentTarget.val();
					this.layers[uuid].guide.elm('.fp_layername').html(layer.name);
				})
				.on('blur',(e) => {
					e.currentTarget.hide();
					this.layers[uuid].guide.elm('.fp_layername').css({opacity:'1'});
				})
			)
			.append(
				createbutton('fp_layervisible','https://freepei.net/image/visible.svg').css({
					left:'0',
					top:'0'
				})
				.on('click',(e) => {
					if (layer.visible)
					{
						layer.leave().hide();
						e.currentTarget.attr('src','https://freepei.net/image/unvisible.svg');
						this.callevent('fp.unvisible',{sender:this,datas:{layer:layer}});
					}
					else
					{
						layer.show();
						if (this.layers[uuid].guide.hasclass('active')) layer.focus();
						e.currentTarget.attr('src','https://freepei.net/image/visible.svg');
					}
					e.stopPropagation();
					e.preventDefault();
				})
				.attr('src',(layer.visible)?'https://freepei.net/image/visible.svg':'https://freepei.net/image/unvisible.svg')
			)
			.append(
				createbutton('fp_layereffects','https://freepei.net/image/effects.svg').css({
					right:'3.5em',
					top:'0'
				})
				.on('click',(e) => {
					this.active=layer;
					this.effect.show(layer.properties.effects);
					e.stopPropagation();
					e.preventDefault();
				})
			)
			.append(
				createbutton('fp_layerdel','https://freepei.net/image/del.svg').css({
					right:'0',
					top:'0'
				})
				.on('click',(e) => {
					pd.confirm('Do you want to delete it?',() => {
						this.contents.removeChild(this.layers[uuid].guide);
						this.contents
						.css({height:'auto',overflow:'hidden'})
						.css({height:this.panel.innerheight().toString()+'px'});
						delete this.layers[uuid];
						this.callevent('fp.delete',{sender:this,datas:{layer:layer}});
					});
					e.stopPropagation();
					e.preventDefault();
				})
			)
			.append(pd.create('input').addclass('fp_layeruuid').attr('type','hidden').val(uuid))
			.on('mousedown,touchstart',(e) => {
				layer.focus();
				e.stopPropagation();
			})
			.on('dblclick',(e) => {
				e.currentTarget.elm('.fp_input').show().focus();
				e.currentTarget.elm('.fp_layername').css({opacity:'0'});
			})
			.on('dragstart',(e) => {
				this.dragging=this.layers[uuid].guide;
				for (var key in this.layers) this.layers[key].guide.elm('.fp_input').blur();
			})
			.on('dragover',(e) => {
				if (e.currentTarget.elm('.fp_layeruuid').val()!=this.dragging.elm('.fp_layeruuid').val())
				{
					var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
					var rect=e.currentTarget.getBoundingClientRect();
					if (pointer.pageY<rect.top+rect.height/2) this.contents.insertBefore(this.dragging,e.currentTarget);
					else this.contents.insertBefore(this.dragging,e.currentTarget.nextElementSibling);
					this.callevent('fp.swap',{sender:this,datas:{swap:this.contents.elms('.fp_layerguide').map((item) => this.layers[item.elm('.fp_layeruuid').val()].layer.index)}});
				}
				e.stopPropagation();
				e.preventDefault();
			}),
			layer:layer
		};
		this.contents.insertBefore(this.layers[uuid].guide,this.contents.firstChild);
		this.contents
		.css({height:'auto',overflow:'hidden'})
		.css({height:this.panel.innerheight().toString()+'px'});
	}
	/* clear */
	clear(){
		for (var key in this.layers)
		{
			this.contents.removeChild(this.layers[key].guide);
			this.callevent('fp.delete',{sender:this,datas:{layer:this.layers[key].layer}});
		}
		this.active=null;
		this.layers={};
		this.effect.hide();
	}
	/* focus */
	focus(index,call){
		for (var key in this.layers)
		{
			if (this.layers[key].layer.index==index) this.layers[key].guide.addclass('active');
			else this.layers[key].guide.removeclass('active');
		}
	}
	/* show */
	show(args){
		this.panel.show();
		if (!this.initialized)
		{
			var rect=this.panel.getBoundingClientRect();
			var from={left:rect.left,top:rect.top};
			var to={left:window.innerWidth-rect.width-30,top:window.innerHeight-rect.height-30};
			this.move(from,to);
			this.callevent('fp.relocate',{sender:this,datas:this.screenbounds()});
		}
		this.initialized=true;
	}
}
class fp_sizeoption extends fp_dialog{
	/* constructor */
	constructor(){
		super('Canvas size','18em');
		/* setup properties */
		this.width=new fp_input().input.css({
			height:'2em',
			lineHeight:'1.5em',
			textAlign:'right',
			width:'calc(100% - 8em)'
		});
		this.height=new fp_input().input.css({
			height:'2em',
			lineHeight:'1.5em',
			textAlign:'right',
			width:'calc(100% - 8em)'
		});
		this.validation=() => {
			var res={...this.keep};
			if (!this.width.val())
			{
				pd.alert('Please enter the width');
				return false;
			}
			else
			{
				if (isNaN(this.width.val()))
				{
					pd.alert('Enter the width as a numerical value');
					return false;
				}
				else res.w=this.width.val();
			}
			if (!this.height.val())
			{
				pd.alert('Please enter the height');
				return false;
			}
			else
			{
				if (isNaN(this.height.val()))
				{
					pd.alert('Enter the height as a numerical value');
					return false;
				}
				else res.h=this.height.val();
			}
			return res;
		};
		/* append elements */
		this.contents
		.append(this.parts.span.clone().css({width:'5em'}).html('width'))
		.append(this.width)
		.append(this.parts.span.clone().css({width:'3em'}).html('px'))
		.append(this.parts.span.clone().css({width:'5em'}).html('height'))
		.append(this.height)
		.append(this.parts.span.clone().css({width:'3em'}).html('px'));
	}
	/* show */
	show(args){
		super.show();
		this.keep=args;
		this.width.val(this.keep.w);
		this.height.val(this.keep.h);
		this.panel.show();
		this.width.focus();
	}
}
var fp=new freepei();
