/*
* FileName "panda.ui.js"
* Version: 1.1.2
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
"use strict";
class panda_event{
	/* constructor */
	constructor(){
		this.eventhandlers={};
	}
	/* setup event handler */
	on(key,events,handler){
		((Array.isArray(events))?events:events.split(',').map((item) => item.trim())).each((type,index) => {
			if (type)
			{
				if (!(key in this.eventhandlers)) this.eventhandlers[key]={};
				if (!(type in this.eventhandlers[key])) this.eventhandlers[key][type]=[];
				this.eventhandlers[key][type].push(handler);
			}
		});
	}
	/* clear event handler */
	off(key,events,handler){
		((Array.isArray(events))?events:events.split(',').map((item) => item.trim())).each((type,index) => {
			if (type)
			{
				if (key in this.eventhandlers)
					if (type in this.eventhandlers[key])
						this.eventhandlers[key][type]=this.eventhandlers[key][type].filter((item) => item!==handler);
			}
		});
	}
	/* call event */
	call(key,type,param){
		var call=(index,param,callback) => {
			var handler=this.eventhandlers[key][type][index];
			var promise=(handler,param) => {
				return new Promise((resolve,reject) => {
					resolve(handler(param));
				});
			};
			promise(handler,param).then((resp) => {
				if (resp!== null && typeof(resp) === 'object' && resp.constructor === Object) param=resp;
				if (!param.error)
				{
					index++;
					if (index<this.eventhandlers[key][type].length) call(index,param,callback);
					else callback(param);
				}
				else callback(param);
			});
		};
		return new Promise((resolve,reject) => {
			Object.assign(param,{
				type:type,
				error:false
			});
			if (key in this.eventhandlers)
			{
				if (type in this.eventhandlers[key])
				{
					if (this.eventhandlers[key][type].length!=0) call(0,param,(param) => resolve(param));
					else resolve(param);
				}
				else resolve(param);
			}
			else resolve(param);
		});
	}
};
class panda_filter extends panda_dialog{
	/* constructor */
	constructor(){
		super(999996,false,false);
		/* setup properties */
		this.handler=null;
		this.config={
			department:{},
			group:{},
			user:{}
		};
		this.result={};
		this.tables={
			query:null,
			sort:null
		};
		/* query */
		this.query={
			create:(lhs,operator,rhs) => {
				var res='';
				switch (rhs.type)
				{
					case 'checkbox':
					case 'creator':
					case 'department':
					case 'group':
					case 'modifier':
					case 'user':
						res=(rhs.value)?'('+rhs.value.shape((item) => (item)?'"'+item+'"':PD_THROW).join(',')+')':'()';
						break;
					case 'dropdown':
					case 'radio':
						res='("'+((rhs.value)?rhs.value:'')+'")';
						break;
					case 'file':
						res='""';
						break;
					case 'id':
					case 'number':
						res=((pd.isnumeric(rhs.value))?rhs.value:'null');
						break;
					case 'lookup':
						switch (lhs.type)
						{
							case 'id':
							case 'number':
								res=((pd.isnumeric(rhs.value))?rhs.value:'null');
								break;
							default:
								res=(operator.match(/match/g))?(((pd.isnumeric(rhs.value))?rhs.value:'null')):('"'+((rhs.search)?rhs.search:'')+'"');
								break;
						}
						break;
					default:
						res='"'+((rhs.value)?rhs.value:'')+'"';
						break;
				}
				return lhs.id+' '+operator+' '+res;
			},
			operator:(fieldinfo) => {
				var res=[];
				if (fieldinfo)
					switch (fieldinfo.type)
					{
						case 'autonumber':
							res.push({id:{value:'='},caption:{value:pd.constants.filter.operator.equal[pd.lang]}});
							res.push({id:{value:'!='},caption:{value:pd.constants.filter.operator.notequal[pd.lang]}});
							res.push({id:{value:'<='},caption:{value:pd.constants.filter.operator.less.equal[pd.lang]}});
							res.push({id:{value:'<'},caption:{value:pd.constants.filter.operator.less[pd.lang]}});
							res.push({id:{value:'>='},caption:{value:pd.constants.filter.operator.greater.equal[pd.lang]}});
							res.push({id:{value:'>'},caption:{value:pd.constants.filter.operator.greater[pd.lang]}});
							res.push({id:{value:'like'},caption:{value:pd.constants.filter.operator.like[pd.lang]}});
							res.push({id:{value:'not like'},caption:{value:pd.constants.filter.operator.notlike[pd.lang]}});
							break;
						case 'checkbox':
						case 'creator':
						case 'department':
						case 'dropdown':
						case 'group':
						case 'modifier':
						case 'radio':
						case 'user':
							res.push({id:{value:'in'},caption:{value:pd.constants.filter.operator.in[pd.lang]}});
							res.push({id:{value:'not in'},caption:{value:pd.constants.filter.operator.notin[pd.lang]}});
							break;
						case 'color':
							res.push({id:{value:'='},caption:{value:pd.constants.filter.operator.equal[pd.lang]}});
							res.push({id:{value:'!='},caption:{value:pd.constants.filter.operator.notequal[pd.lang]}});
							break;
						case 'createdtime':
						case 'date':
						case 'datetime':
						case 'id':
						case 'modifiedtime':
						case 'number':
						case 'time':
							res.push({id:{value:'='},caption:{value:pd.constants.filter.operator.equal[pd.lang]}});
							res.push({id:{value:'!='},caption:{value:pd.constants.filter.operator.notequal[pd.lang]}});
							res.push({id:{value:'<='},caption:{value:pd.constants.filter.operator.less.equal[pd.lang]}});
							res.push({id:{value:'<'},caption:{value:pd.constants.filter.operator.less[pd.lang]}});
							res.push({id:{value:'>='},caption:{value:pd.constants.filter.operator.greater.equal[pd.lang]}});
							res.push({id:{value:'>'},caption:{value:pd.constants.filter.operator.greater[pd.lang]}});
							break;
						case 'file':
						case 'postalcode':
							res.push({id:{value:'like'},caption:{value:pd.constants.filter.operator.like[pd.lang]}});
							res.push({id:{value:'not like'},caption:{value:pd.constants.filter.operator.notlike[pd.lang]}});
							break;
						case 'lookup':
							res.push({id:{value:'='},caption:{value:pd.constants.filter.operator.equal[pd.lang]}});
							res.push({id:{value:'!='},caption:{value:pd.constants.filter.operator.notequal[pd.lang]}});
							res.push({id:{value:'like'},caption:{value:pd.constants.filter.operator.like[pd.lang]}});
							res.push({id:{value:'not like'},caption:{value:pd.constants.filter.operator.notlike[pd.lang]}});
							res.push({id:{value:'match'},caption:{value:pd.constants.filter.operator.match[pd.lang]}});
							res.push({id:{value:'not match'},caption:{value:pd.constants.filter.operator.notmatch[pd.lang]}});
							break;
						case 'spacer':
							break;
						default:
							res.push({id:{value:'='},caption:{value:pd.constants.filter.operator.equal[pd.lang]}});
							res.push({id:{value:'!='},caption:{value:pd.constants.filter.operator.notequal[pd.lang]}});
							res.push({id:{value:'like'},caption:{value:pd.constants.filter.operator.like[pd.lang]}});
							res.push({id:{value:'not like'},caption:{value:pd.constants.filter.operator.notlike[pd.lang]}});
							break;
					}
				return res;
			},
			parse:(query) => {
				var res=[];
				query.split(' and ').map((item) => item.match(/^([^!><= ]+|(?:(?!(?:not match|match|not in|in|not like|like).)*))[ ]*([!><=]+|not match|match|not in|in|not like|like)[ ]*(.*)$/)).each((query,index) => {
					if (query)
					{
						res.push({
							field:query[1].trim(),
							operator:query[2].trim(),
							value:query[3].trim()
						})
					}
				});
				return res;
			}
		};
		/* record */
		this.record={
			load:() => {
				return new Promise((resolve,reject) => {
					pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
					.then((resp) => {
						var config=resp.file;
						this.config.department=config.apps.system.departments;
						this.config.group=config.apps.system.groups;
						this.config.user=config.apps.system.users;
						pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'departments',query:'',offset:0,limit:0},true)
						.then((resp) => {
							this.record.department=resp.records;
							pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'groups',query:'',offset:0,limit:0},true)
							.then((resp) => {
								this.record.group=resp.records;
								pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'users',query:'available = "available"',offset:0,limit:0},true)
								.then((resp) => {
									this.record.user=resp.records;
									resolve(config);
								})
								.catch((error) => {
									pd.alert(error.message);
									reject();
								});
							})
							.catch((error) => {
								pd.alert(error.message);
								reject();
							});
						})
						.catch((error) => {
							pd.alert(error.message);
							reject();
						});
					})
					.catch((error) => {
						pd.alert(error.message);
						reject();
					});
				});
			},
			department:[],
			group:[],
			user:[]
		};
		/* sort */
		this.sort={
			parse:(sort) => {
				var res=[];
				sort.split(',').map((item) => item.trim()).map((item) => item.split(' ')).each((sort,index) => {
					if (sort[0])
						res.push({
							field:sort[0],
							order:(sort.length>1)?sort[1]:'asc'
						})
				});
				return res;
			}
		};
		/* modify elements */
		this.container.css({
			height:'calc(100% - 1em)',
			width:'55em'
		});
		this.contents.addclass('pd-filterbuilder').css({
			padding:'0'
		});
	}
	/* build */
	build(app,query,sort,callback){
		var fieldinfos=pd.ui.field.embed(pd.ui.field.parallelize(app.fields));
		var fields=(exclude) => {
			var res=[];
			res.push({
				id:{value:''},
				caption:{value:''}
			});
			for (var key in fieldinfos)
				if (fieldinfos[key].type!='spacer')
				{
					if (exclude && fieldinfos[key].tableid) continue;
					res.push({
						id:{value:key},
						caption:{value:fieldinfos[key].caption}
					});
				}
			return res;
		};
		/* create table */
		this.tables.query=pd.ui.table.create({
			id:'queries',
			type:'table',
			caption:'',
			nocaption:true,
			fields:{
				fields:{
					id:'fields',
					type:'dropdown',
					caption:'',
					required:false,
					nocaption:true,
					options:[]
				},
				operators:{
					id:'operators',
					type:'dropdown',
					caption:'',
					required:false,
					nocaption:true,
					options:[]
				},
				values:{
					id:'values',
					type:'spacer',
					caption:'',
					required:false,
					nocaption:true
				}
			}
		}).spread((row,index) => {
			/* event */
			row.elm('.pd-table-row-add').on('click',(e) => {
				this.tables.query.insertrow(row);
			});
			row.elm('.pd-table-row-del').on('click',(e) => {
				pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
					this.tables.query.delrow(row);
				});
			});
			/* modify elements */
			((row) => {
				((cells) => {
					cells.fields.empty().assignoption(fields(),'caption','id').on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
						return new Promise((resolve,reject) => {
							cells.operators.empty();
							cells.values.empty();
							if (cells.fields.val())
							{
								((fieldinfo) => {
									cells.operators.assignoption(pd.filter.query.operator(fieldinfo),'caption','id');
									((field) => {
										cells.values.value={
											get:() => {
												var res='';
												switch (fieldinfo.type)
												{
													case 'checkbox':
													case 'dropdown':
													case 'radio':
														res=[];
														field.elms('input').each((element,index) => {
															if (element.checked) res.push('"'+element.val()+'"');
														});
														res='('+res.join(',')+')';
														break;
													case 'creator':
													case 'department':
													case 'group':
													case 'modifier':
													case 'user':
														res='('+field.elm('input').val().replace(/["']{1}LOGIN_USER["']{1}/g,'LOGIN_USER').replace(/(^\[|\]$)/g,'')+')';
														break;
													case 'createdtime':
													case 'date':
													case 'datetime':
													case 'modifiedtime':
														((elements) => {
															switch (elements.pattern.val())
															{
																case 'today':
																	res='TODAY()';
																	break;
																case 'manually':
																	switch (fieldinfo.type)
																	{
																		case 'date':
																			res='"'+elements.date.val()+'"';
																			break;
																		case 'createdtime':
																		case 'datetime':
																		case 'modifiedtime':
																			if (elements.date.val())
																			{
																				if (!elements.hour.val()) elements.hour.val('00');
																				if (!elements.minute.val()) elements.minute.val('00');
																			}
																			if (elements.date.val() && elements.hour.val() && elements.minute.val())
																				res='"'+(elements.date.val()+' '+elements.hour.val()+':'+elements.minute.val()+':00').parseDateTime().format('ISO')+'"';
																			break;
																	}
																	break;
																default:
																	res=elements.pattern.val().toUpperCase().replace(/ /g,'_')+'("'+elements.interval.val()+'","'+elements.unit.val()+'")';
																	break;
															}
														})({
															pattern:field.elm('[field-id=pattern]').elm('select'),
															date:field.elm('[field-id=value]').elm('input'),
															hour:(field.elm('[field-id=value]').elm('.pd-hour'))?field.elm('[field-id=value]').elm('.pd-hour').elm('select'):null,
															minute:(field.elm('[field-id=value]').elm('.pd-minute'))?field.elm('[field-id=value]').elm('.pd-minute').elm('select'):null,
															interval:field.elm('[field-id=interval]').elm('input'),
															unit:field.elm('[field-id=unit]').elm('select')
														});
														break;
													case 'id':
													case 'number':
														res=field.elm('input').val();
														break;
													case 'time':
														res='""';
														if (field.elm('.pd-hour').elm('select').val())
															if (!field.elm('.pd-minute').elm('select').val()) field.elm('.pd-minute').elm('select').val('00');
														if (field.elm('.pd-minute').elm('select').val())
															if (!field.elm('.pd-hour').elm('select').val()) field.elm('.pd-hour').elm('select').val('00');
														if (field.elm('.pd-hour').elm('select').val() && field.elm('.pd-minute').elm('select').val())
															res='"'+field.elm('.pd-hour').elm('select').val()+':'+field.elm('.pd-minute').elm('select').val()+'"';
														break;
													default:
														res='"'+field.elm('input').val()+'"';
														break;
												}
												return res;
											},
											set:(value) => {
												switch (fieldinfo.type)
												{
													case 'checkbox':
													case 'dropdown':
													case 'radio':
														var values=value.replace(/(^\(|\)$)/g,'').split(',').map((item) => item.trim()).shape((item) => (item)?item.replace(/(^["']{1}|["']{1}$)/g,''):PD_THROW);
														field.elms('input').each((element,index) => element.checked=values.includes(element.val()));
														break;
													case 'creator':
													case 'department':
													case 'group':
													case 'modifier':
													case 'user':
														var values=value.replace(/(^\(|\)$)/g,'').split(',').map((item) => item.trim()).shape((item) => (item)?item.replace(/(^["']{1}|["']{1}$)/g,''):PD_THROW);
														field.elm('input').val(JSON.stringify(values));
														field.elm('.pd-guide').empty();
														values.each((value,index) => field.elm('.pd-field-value').guide(value));
														break;
													case 'createdtime':
													case 'date':
													case 'datetime':
													case 'modifiedtime':
														((elements) => {
															if (value.toLowerCase().match(/^today/g)) elements.pattern.val('today').dispatchEvent(new Event('change'));
															else
															{
																if (value.toLowerCase().match(/^from_/g))
																{
																	elements.pattern.val(value.toLowerCase().replace(/\(.*$/g,'').replace(/_/g,' ')).dispatchEvent(new Event('change'));
																	elements.interval.val(value.toLowerCase().match(/^[^"']+["']{1}([0-9-]*)["']{1}/)[1]);
																	elements.unit.val(value.toLowerCase().match(/^[^"']+["']{1}([0-9-]*)["']{1}[ ]*,[ ]*["']{1}([^"']*)["']{1}/)[2]);
																}
																else
																{
																	elements.pattern.val('manually').dispatchEvent(new Event('change'));
																	switch (fieldinfo.type)
																	{
																		case 'date':
																			elements.date.val(value.replace(/(^["']{1}|["']{1}$)/g,''));
																			break;
																		case 'createdtime':
																		case 'datetime':
																		case 'modifiedtime':
																			var date=value.replace(/(^["']{1}|["']{1}$)/g,'').parseDateTime();
																			elements.date.val(date.format('Y-m-d'));
																			elements.hour.val(date.format('H'));
																			elements.minute.val(date.format('i'));
																			break;
																	}
																}
															}
														})({
															pattern:field.elm('[field-id=pattern]').elm('select'),
															date:field.elm('[field-id=value]').elm('input'),
															hour:(field.elm('[field-id=value]').elm('.pd-hour'))?field.elm('[field-id=value]').elm('.pd-hour').elm('select'):null,
															minute:(field.elm('[field-id=value]').elm('.pd-minute'))?field.elm('[field-id=value]').elm('.pd-minute').elm('select'):null,
															interval:field.elm('[field-id=interval]').elm('input'),
															unit:field.elm('[field-id=unit]').elm('select')
														});
														break;
													case 'time':
														var values=value.replace(/(^["']{1}|["']{1}$)/g,'').split(':').filter((item) => item);
														if (values.length==2)
														{
															field.elm('.pd-hour').elm('select').val(values[0]);
															field.elm('.pd-minute').elm('select').val(values[1]);
														}
														else
														{
															field.elm('.pd-hour').elm('select').val('');
															field.elm('.pd-minute').elm('select').val('');
														}
														break;
													default:
														field.elm('input').val(value.replace(/(^["']{1}|["']{1}$)/g,''));
														break;
												}
											}
										}
										field.elms('input,select,textarea').each((element,index) => element.initialize());
										cells.values.append(field);
									})(((fieldinfo) => {
										var res=null;
										fieldinfo.id='value';
										fieldinfo.caption='';
										fieldinfo.required=false;
										fieldinfo.nocaption=true;
										switch (fieldinfo.type)
										{
											case 'address':
											case 'autonumber':
											case 'file':
											case 'id':
											case 'lookup':
											case 'postalcode':
											case 'textarea':
												res=pd.ui.field.create({
													id:'value',
													type:'text',
													caption:'',
													required:false,
													nocaption:true,
													format:(fieldinfo.type=='id')?'nondemiliternumber':'text'
												});
												break;
											case 'creator':
											case 'modifier':
												((fieldinfo) => {
													fieldinfo.type='user';
													fieldinfo.loginuser=true;
													fieldinfo.unify=true;
													res=pd.ui.field.activate(pd.ui.field.create(fieldinfo),((app) => {
														app.fields[fieldinfo.id]=fieldinfo;
														return app;
													})({id:'filterbuilder',fields:{}}));
												})(pd.extend({},fieldinfo));
												break;
											case 'createdtime':
											case 'date':
											case 'datetime':
											case 'modifiedtime':
												res=pd.create('div')
												.append(
													((field) => {
														field.addclass('pd-filterbuilder-date').elm('select').assignoption([
															{id:{value:'today'},caption:{value:pd.constants.filter.pattern.today[pd.lang]}},
															{id:{value:'from today'},caption:{value:pd.constants.filter.pattern.from.today[pd.lang]}},
															{id:{value:'from thisweek'},caption:{value:pd.constants.filter.pattern.from.thisweek[pd.lang]}},
															{id:{value:'from thismonth'},caption:{value:pd.constants.filter.pattern.from.thismonth[pd.lang]}},
															{id:{value:'from thisyear'},caption:{value:pd.constants.filter.pattern.from.thisyear[pd.lang]}},
															{id:{value:'manually'},caption:{value:pd.constants.filter.pattern.manually[pd.lang]}}
														],'caption','id').on('change',(e) => {
															switch (e.currentTarget.val())
															{
																case 'today':
																	res.elm('[field-id=value]').hide();
																	res.elm('[field-id=interval]').hide();
																	res.elm('[field-id=unit]').hide();
																	break;
																case 'manually':
																	res.elm('[field-id=value]').css({display:'inline-block'});
																	res.elm('[field-id=interval]').hide();
																	res.elm('[field-id=unit]').hide();
																	break;
																default:
																	res.elm('[field-id=value]').hide();
																	res.elm('[field-id=interval]').css({display:'inline-block'});
																	res.elm('[field-id=unit]').css({display:'inline-block'});
																	break;
															}
														});
														return field;
													})(pd.ui.field.create({
														id:'pattern',
														type:'dropdown',
														caption:'',
														required:false,
														nocaption:true,
														options:[]
													}))
												)
												.append(
													((fieldinfo) => {
														if (['createdtime','modifiedtime'].includes(fieldinfo.type)) fieldinfo.type='datetime';
														return pd.ui.field.activate(pd.ui.field.create(fieldinfo),((app) => {
															app.fields[fieldinfo.id]=fieldinfo;
															return app;
														})({id:'filterbuilder',fields:{}})).addclass('pd-filterbuilder-date').hide()
													})(pd.extend({},fieldinfo))
												)
												.append(
													pd.ui.field.create({
														id:'interval',
														type:'number',
														caption:'',
														required:false,
														nocaption:true,
														demiliter:false
													}).addclass('pd-filterbuilder-date').css({width:'5em'}).hide()
												)
												.append(
													pd.ui.field.create({
														id:'unit',
														type:'dropdown',
														caption:'',
														required:false,
														nocaption:true,
														options:[
															{option:{value:'day'}},
															{option:{value:'month'}},
															{option:{value:'year'}}
														]
													}).addclass('pd-filterbuilder-date').hide()
												);
												break;
											case 'dropdown':
											case 'radio':
												res=((field) => {
													return field.append(
														((field) => {
															fieldinfo.options.each((option,index) => {
																field
																.append(
																	pd.create('label')
																	.append(pd.create('input').attr('type','checkbox').attr('data-type',fieldinfo.type).val(option.option.value))
																	.append(pd.create('span').html(option.option.value))
																);
															});
															return field;
														})(pd.create('div').addclass('pd-field-value'))
													);
												})(pd.create('div').addclass('pd-field').attr('field-id','value'));
												break;
											default:
												((fieldinfo) => {
													if (fieldinfo.type=='user')
													{
														fieldinfo.loginuser=true;
														fieldinfo.unify=true;
													}
													res=pd.ui.field.activate(pd.ui.field.create(fieldinfo),((app) => {
														app.fields[fieldinfo.id]=fieldinfo;
														return app;
													})({id:'filterbuilder',fields:{}}));
												})(pd.extend({},fieldinfo));
												break;
										}
										return res;
									})(pd.extend({},fieldinfo)));
								})(fieldinfos[cells.fields.val()]);
							}
							resolve({});
						});
					};
				})({
					fields:row.elm('[field-id=fields]').elm('select'),
					operators:row.elm('[field-id=operators]').elm('select'),
					values:row.elm('[field-id=values]').css({padding:'0'})
				});
			})(row.addclass('pd-scope').attr('form-id','form_filterbuilder'));
		},(table,index) => {
			if (table.tr.length==0) table.addrow();
		},false);
		this.tables.sort=pd.ui.table.create({
			id:'sorts',
			type:'table',
			caption:'',
			nocaption:true,
			fields:{
				fields:{
					id:'fields',
					type:'dropdown',
					caption:'',
					required:false,
					nocaption:true,
					options:[]
				},
				options:{
					id:'options',
					type:'dropdown',
					caption:'',
					required:false,
					nocaption:true,
					options:[
						{option:{value:'asc'}},
						{option:{value:'desc'}}
					]
				}
			}
		}).spread((row,index) => {
			/* event */
			row.elm('.pd-table-row-add').on('click',(e) => {
				this.tables.sort.insertrow(row);
			});
			row.elm('.pd-table-row-del').on('click',(e) => {
				pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
					this.tables.sort.delrow(row);
				});
			});
			/* modify elements */
			row.elm('[field-id=fields]').elm('select').empty().assignoption(fields(true),'caption','id');
		},(table,index) => {
			if (table.tr.length==0) table.addrow();
		},false);
		this.tables.sort.template.elm('[field-id=options]').elms('option').each((element,index) => {
			if (element.val()) element.html(pd.constants.common.caption.sort[element.val()][pd.lang]);
		});
		this.contents.empty()
		.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.filter.caption.filter[pd.lang]))
		.append(this.tables.query)
		.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.filter.caption.sort[pd.lang]))
		.append(this.tables.sort);
		if (query)
		{
			((fields) => {
				pd.filter.query.parse(query).each((query,index) => {
					if (fields.some((item) => item.id.value==query.field))
						((row) => {
							row.elm('[field-id=fields]').elm('select').val(query.field).rebuild().then(() => {
								row.elm('[field-id=operators]').elm('select').val(query.operator);
								row.elm('[field-id=values]').value.set(query.value);
							});
						})(this.tables.query.addrow());
				});
			})(fields());
			if (this.tables.query.tr.length==0) this.tables.query.addrow();
		}
		else this.tables.query.addrow();
		if (sort)
		{
			((fields) => {
				pd.filter.sort.parse(sort).each((sort,index) => {
					if (fields.some((item) => item.id.value==sort.field))
						((row) => {
							row.elm('[field-id=fields]').elm('select').val(sort.field);
							row.elm('[field-id=options]').elm('select').val(sort.order);
						})(this.tables.sort.addrow());
				});
			})(fields(true));
			if (this.tables.sort.tr.length==0) this.tables.sort.addrow();
		}
		else
		{
			if (typeof sort==='string') this.tables.sort.addrow();
			else
			{
				this.tables.sort.hide();
				this.tables.sort.previousElementSibling.hide();
			}
		}
		/* setup handler */
		if (this.handler) this.ok.off('click',this.handler);
		this.handler=(e) => {
			var queries=[];
			var sorts=[];
			this.tables.query.tr.each((element,index) => {
				var fields=element.elm('[field-id=fields]').elm('select');
				var operators=element.elm('[field-id=operators]').elm('select');
				var values=element.elm('[field-id=values]');
				if (fields.val()) queries.push(fields.val()+' '+operators.val()+' '+values.value.get());
			});
			this.tables.sort.tr.each((element,index) => {
				var fields=element.elm('[field-id=fields]').elm('select');
				var options=element.elm('[field-id=options]').elm('select');
				if (fields.val()) sorts.push(fields.val()+' '+options.val());
			});
			this.hide();
			callback(queries.join(' and '),sorts.join(','));
		};
		this.ok.on('click',this.handler);
		this.cancel.on('click',(e) => this.hide());
		/* show */
		super.show();
	}
	/* scanning */
	scan(app,record,query,parallelize=true){
		var matches=0;
		var queries=this.query.parse(query);
		var comparison=(fieldinfo,lhs,operator,rhs) => {
			var formula='';
			var CONTAIN_FILE=() => {
				var res=false;
				switch (operator)
				{
					case 'not like':
						if (lhs.value.length>0) res=(!lhs.value.some((item) => (rhs)?item.name.match(new RegExp(rhs,'g')):!item.name));
						else res=rhs;
						break;
					case 'like':
						if (lhs.value.length>0) res=(lhs.value.some((item) => (rhs)?item.name.match(new RegExp(rhs,'g')):!item.name));
						else res=!rhs;
						break;
				}
				return res;
			};
			var CONTAIN_MULTIPLE=() => {
				var res=false;
				switch (operator)
				{
					case 'not in':
						if (lhs.value.length>0) res=(!lhs.value.some((item) => rhs.includes(item)));
						else res=(rhs.length!=0);
						break;
					case 'in':
						if (lhs.value.length>0) res=(lhs.value.some((item) => rhs.includes(item)));
						else res=(rhs.length==0);
						break;
				}
				return res;
			};
			var CONTAIN_USER=() => {
				var res=false;
				var calculate=() => {
					var res=0;
					var values={
						department:[],
						group:[],
						user:[]
					};
					rhs.each((value,index) => {
						if (typeof value==='number' || typeof value==='string')
							((value) => {
								switch (value.charAt(0))
								{
									case 'd':
										values.department.push(value.slice(1));
										break;
									case 'g':
										values.group.push(value.slice(1));
										break;
									case 'u':
										values.user.push(value.slice(1));
										break;
									default:
										values.user.push(value);
										break;
								}
							})(value.toString());
					});
					lhs.value.each((value,index) => {
						((user) => {
							if (user.length!=0)
							{
								res+=user.first().department.value.filter((item) => values.department.includes(item)).length;
								res+=user.first().group.value.filter((item) => values.group.includes(item)).length;
								if (values.user.includes(value)) res++;
							}
						})(this.record.user.filter((item) => item['__id'].value==value));
					});
					return res;
				}
				switch (operator)
				{
					case 'not in':
						if (lhs.value.length>0) res=(calculate()==0);
						else res=(rhs.length!=0);
						break;
					case 'in':
						if (lhs.value.length>0) res=(calculate()!=0);
						else res=(rhs.length==0);
						break;
				}
				return res;
			};
			var TODAY=(type='date',adddays='0') => {
				var date=new Date(new Date().format('Y-m-d'));
				return (type!='date')?date.calc(adddays+' day,'+date.getTimezoneOffset().toString()+' minute').format('ISO'):date.format('Y-m-d');
			};
			var FROM_TODAY=(interval,unit,type='date',adddays='0') => {
				var date=new Date(new Date().format('Y-m-d')).calc(interval+' '+unit);
				return (type!='date')?date.calc(adddays+' day,'+date.getTimezoneOffset().toString()+' minute').format('ISO'):date.format('Y-m-d');
			};
			var FROM_THISWEEK=(interval,unit,type='date',adddays='0') => {
				var date=new Date(new Date().format('Y-m-d')).calc('-'+new Date().getDay().toString()+' day,'+interval+' '+unit);
				return (type!='date')?date.calc(adddays+' day,'+date.getTimezoneOffset().toString()+' minute').format('ISO'):date.format('Y-m-d');
			};
			var FROM_THISMONTH=(interval,unit,type='date',adddays='0') => {
				var date=new Date(new Date().format('Y-m-01')).calc(interval+' '+unit);
				return (type!='date')?date.calc(adddays+' day,'+date.getTimezoneOffset().toString()+' minute').format('ISO'):date.format('Y-m-d');
			};
			var FROM_THISYEAR=(interval,unit,type='date',adddays='0') => {
				var date=new Date(new Date().format('Y-01-01')).calc(interval+' '+unit);
				return (type!='date')?date.calc(adddays+' day,'+date.getTimezoneOffset().toString()+' minute').format('ISO'):date.format('Y-m-d');
			};
			switch (fieldinfo.type)
			{
				case 'checkbox':
				case 'department':
				case 'group':
					rhs=rhs.replace(/(^\(|\)$)/g,'').split(',').map((item) => item.trim()).shape((item) => (item)?item.replace(/(^["']{1}|["']{1}$)/g,''):PD_THROW);
					formula='CONTAIN_MULTIPLE()';
					break;
				case 'creator':
				case 'modifier':
				case 'user':
					rhs=rhs.replace(/(^\(|\)$)/g,'').split(',').map((item) => item.trim().replace(/LOGIN_USER/g,pd.operator.__id.value.toString())).shape((item) => (item)?item.replace(/(^["']{1}|["']{1}$)/g,''):PD_THROW);
					formula='CONTAIN_USER()';
					break;
				case 'dropdown':
				case 'radio':
					rhs=rhs.replace(/(^\(|\)$)/g,'').split(',').map((item) => item.trim()).shape((item) => (item)?item.replace(/(^["']{1}|["']{1}$)/g,''):PD_THROW);
					switch (operator)
					{
						case 'not in':
							formula='!rhs.includes(lhs.value)';
							break;
						case 'in':
							formula='rhs.includes(lhs.value)';
							break;
					}
					break;
				case 'createdtime':
				case 'datetime':
				case 'modifiedtime':
					if (rhs.toLowerCase().match(/^today/g))
					{
						switch (operator)
						{
							case '>':
								formula='lhs.value >= FROM_TODAY("1","day","datetime")';
								break;
							case '>=':
								formula='lhs.value >= TODAY("datetime")';
								break;
							case '<':
								formula='lhs.value < TODAY("datetime")';
								break;
							case '<=':
								formula='lhs.value < FROM_TODAY("1","day","datetime")';
								break;
							case '!=':
								formula='(lhs.value < TODAY("datetime") || lhs.value >= FROM_TODAY("1","day","datetime"))';
								break;
							case '=':
								formula='(lhs.value >= TODAY("datetime") && lhs.value < FROM_TODAY("1","day","datetime"))';
								break;
						}
					}
					else
					{
						if (rhs.toLowerCase().match(/^from_/g))
						{
							rhs=rhs.replace(/\)$/g,'');
							switch (operator)
							{
								case '>':
									formula='lhs.value >= '+rhs+',"datetime","1")';
									break;
								case '>=':
									formula='lhs.value >= '+rhs+',"datetime")';
									break;
								case '<':
									formula='lhs.value < '+rhs+',"datetime")';
									break;
								case '<=':
									formula='lhs.value < '+rhs+',"datetime","1")';
									break;
								case '!=':
									formula='(lhs.value < '+rhs+',"datetime") || lhs.value >= '+rhs+',"datetime","1"))';
									break;
								case '=':
									formula='(lhs.value >= '+rhs+',"datetime") && lhs.value < '+rhs+',"datetime","1"))';
									break;
							}
						}
						else formula='lhs.value '+((operator=='=')?'==':operator)+' '+rhs;
					}
					break;
				case 'file':
					rhs=rhs.replace(/(^["']{1}|["']{1}$)/g,'');
					formula='CONTAIN_FILE()';
					break;
				case 'id':
				case 'number':
					formula=((rhs) => {
						return '(pd.isnumeric(lhs.value)?parseFloat(lhs.value):null) '+((operator=='=')?'==':operator)+' '+((rhs!='0')?rhs.replace(/^0/g,''):rhs);
					})((pd.isnumeric(rhs.replace(/(^["']{1}|["']{1}$)/g,'')))?rhs.replace(/(^["']{1}|["']{1}$)/g,''):'null');
					break;
				case 'lookup':
					switch (operator)
					{
						case 'not like':
							((pattern) => {
								formula=(pattern)?'!lhs.search.match(/(?:'+pattern+')/g)':'lhs.search';
							})(rhs.replace(/(^["']{1}|["']{1}$)/g,''));
							break;
						case 'like':
							((pattern) => {
								formula=(pattern)?'lhs.search.match(/(?:'+pattern+')/g)':'!lhs.search';
							})(rhs.replace(/(^["']{1}|["']{1}$)/g,''));
							break;
						case 'not match':
							formula=((rhs) => {
								return '(pd.isnumeric(lhs.value)?parseFloat(lhs.value):null) != '+((rhs!='0')?rhs.replace(/^0/g,''):rhs);
							})((pd.isnumeric(rhs.replace(/(^["']{1}|["']{1}$)/g,'')))?rhs.replace(/(^["']{1}|["']{1}$)/g,''):'null');
							break;
						case 'match':
							formula=((rhs) => {
								return '(pd.isnumeric(lhs.value)?parseFloat(lhs.value):null) == '+((rhs!='0')?rhs.replace(/^0/g,''):rhs);
							})((pd.isnumeric(rhs.replace(/(^["']{1}|["']{1}$)/g,'')))?rhs.replace(/(^["']{1}|["']{1}$)/g,''):'null');
							break;
						default:
							formula='lhs.search '+((operator=='=')?'==':operator)+' '+rhs;
							break;
					}
					break;
				default:
					switch (operator)
					{
						case 'not like':
							((pattern) => {
								formula=(pattern)?'!((lhs.value)?lhs.value:\'\').match(/(?:'+pattern+')/g)':'lhs.value';
							})(rhs.replace(/(^["']{1}|["']{1}$)/g,''));
							break;
						case 'like':
							((pattern) => {
								formula=(pattern)?'((lhs.value)?lhs.value:\'\').match(/(?:'+pattern+')/g)':'!lhs.value';
							})(rhs.replace(/(^["']{1}|["']{1}$)/g,''));
							break;
						default:
							formula='((lhs.value)?lhs.value:\'\') '+((operator=='=')?'==':operator)+' '+rhs;
							break;
					}
					break;
			}
			return eval(formula);
		};
		this.result=(() => {
			var res={};
			for (var key in record) res[key]=record[key];
			return res;
		})();
		((fieldinfos) => {
			queries.each((query,index) => {
				if (query.field in fieldinfos)
					((fieldinfo) => {
						if (fieldinfo.tableid)
						{
							this.result[fieldinfo.tableid]={value:this.result[fieldinfo.tableid].value.filter((item) => {
								return (fieldinfo.id in item)?(comparison(fieldinfo,item[fieldinfo.id],query.operator,query.value)):false;
							})};
							if (this.result[fieldinfo.tableid].value.length>0) matches++;
						}
						else
						{
							if (fieldinfo.id in this.result)
								if (comparison(fieldinfo,this.result[fieldinfo.id],query.operator,query.value)) matches++;
						}
					})(fieldinfos[query.field]);
			});
		})(pd.ui.field.embed((parallelize)?pd.ui.field.parallelize(app.fields):pd.extend({},app.fields)));
		return (queries.length==matches)?this.result:false;
	}
};
class panda_formula{
	/* constructor */
	constructor(){}
	calculate(param,row,record,origin,fieldinfos){
		if (param.field in fieldinfos)
		{
			var IF=(condition,exprIfTrue,exprIfFalse) => {
				return condition?exprIfTrue:exprIfFalse;
			};
			var AND=(...args) => {
				return (args.length>0)?args.filter((item) => item).length==args.length:true;
			};
			var OR=(...args) => {
				return (args.length>0)?args.some((item) => item):false;
			};
			var CONTAIN=(value,pattern) => {
				return (Array.isArray(value))?value.includes(pattern):(STR(value).match(new RegExp(STR(pattern),'g')));
			};
			var ASC=(value) => {
				var map={
					'ア':'ｱ','イ':'ｲ','ウ':'ｳ','エ':'ｴ','オ':'ｵ',
					'カ':'ｶ','キ':'ｷ','ク':'ｸ','ケ':'ｹ','コ':'ｺ',
					'サ':'ｻ','シ':'ｼ','ス':'ｽ','セ':'ｾ','ソ':'ｿ',
					'タ':'ﾀ','チ':'ﾁ','ツ':'ﾂ','テ':'ﾃ','ト':'ﾄ',
					'ナ':'ﾅ','ニ':'ﾆ','ヌ':'ﾇ','ネ':'ﾈ','ノ':'ﾉ',
					'ハ':'ﾊ','ヒ':'ﾋ','フ':'ﾌ','ヘ':'ﾍ','ホ':'ﾎ',
					'マ':'ﾏ','ミ':'ﾐ','ム':'ﾑ','メ':'ﾒ','モ':'ﾓ',
					'ヤ':'ﾔ','ユ':'ﾕ','ヨ':'ﾖ',
					'ラ':'ﾗ','リ':'ﾘ','ル':'ﾙ','レ':'ﾚ','ロ':'ﾛ',
					'ワ':'ﾜ','ヲ':'ｦ','ン':'ﾝ',
					'ァ':'ｧ','ィ':'ｨ','ゥ':'ｩ','ェ':'ｪ','ォ':'ｫ',
					'ッ':'ｯ','ャ':'ｬ','ュ':'ｭ','ョ':'ｮ',
					'ガ':'ｶﾞ','ギ':'ｷﾞ','グ':'ｸﾞ','ゲ':'ｹﾞ','ゴ':'ｺﾞ',
					'ザ':'ｻﾞ','ジ':'ｼﾞ','ズ':'ｽﾞ','ゼ':'ｾﾞ','ゾ':'ｿﾞ',
					'ダ':'ﾀﾞ','ヂ':'ﾁﾞ','ヅ':'ﾂﾞ','デ':'ﾃﾞ','ド':'ﾄﾞ',
					'バ':'ﾊﾞ','ビ':'ﾋﾞ','ブ':'ﾌﾞ','ベ':'ﾍﾞ','ボ':'ﾎﾞ',
					'パ':'ﾊﾟ','ピ':'ﾋﾟ','プ':'ﾌﾟ','ペ':'ﾍﾟ','ポ':'ﾎﾟ',
					'ヴ':'ｳﾞ','ヷ':'ﾜﾞ','ヺ':'ｦﾞ',
					'。':'｡','、':'､','ー':'ｰ','「':'｢','」':'｣',
					'・':'･','”':'"','’':'\'','‘':'`','￥':'\\',
					'　':' ','〜':'~'
				};
				return STR(value)
				.replace(/[\uFF01-\uFF5E]/g,(s) => String.fromCharCode(s.charCodeAt(0)-0xFEE0))
				.replace(/[\u3041-\u3096]/g,(s) => String.fromCharCode(s.charCodeAt(0)+0x60))
				.replace(new RegExp('('+Object.keys(map).join('|')+')','g'),(s) => map[s]);
			};
			var AVG=(id) => {
				var res=0;
				if (id in fieldinfos)
				{
					var fieldinfo=fieldinfos[id];
					if (fieldinfo.tableid)
					{
						res=((values) => {
							return (values.length!=0)?values.reduce((a,b) => a+b)/values.length:0;
						})(record[fieldinfo.tableid].value.shape((item) => pd.isnumeric(item[id].value)?NUM(item[id].value):PD_THROW));
					}
					else res=NUM(record[id].value);
				}
				return res;
			};
			var AVGIF=(id,query='') => {
				var res=0;
				if (id in fieldinfos)
				{
					((record,fieldinfo) => {
						if (record)
						{
							if (fieldinfo.tableid)
							{
								res=((values) => {
									return (values.length!=0)?values.reduce((a,b) => a+b)/values.length:0;
								})(record[fieldinfo.tableid].value.shape((item) => pd.isnumeric(item[id].value)?NUM(item[id].value):PD_THROW));
							}
							else res=NUM(record[id].value);
						}
					})(pd.filter.scan({fields:fieldinfos},origin,query,false),fieldinfos[id]);
				}
				return res;
			};
			var CONCAT=(...args) => {
				return (args.length>0)?args.map((item) => (typeof item==='number' || typeof item==='string')?item.toString():'').join(''):'';
			};
			var COUNT=(id) => {
				return (Object.values(fieldinfos).some((item) => item.tableid==id))?record[id].value.length:0;
			};
			var COUNTIF=(id,query='') => {
				return ((record,fieldinfo) => {
					return (record)?((Object.values(fieldinfos).some((item) => item.tableid==id))?record[id].value.length:0):0;
				})(pd.filter.scan({fields:fieldinfos},origin,query,false),fieldinfos[id]);
			};
			var CEIL=(value) => {
				return Math.ceil(NUM(value));
			};
			var FLOOR=(value) => {
				return Math.floor(NUM(value));
			};
			var ROUND=(value) => {
				return Math.round(NUM(value));
			};
			var DIFF=(from,to,format) => {
				from=STR(from);
				to=STR(to);
				if (isNaN(Date.parse(from))) return '';
				else
				{
					return ((from,to,res) => {
						var year=0;
						var month=0;
						var day=0;
						var days=parseInt(from.format('d'))-1;
						var keep={
							from:from.calc('first-of-month'),
							to:to.calc('first-of-month')
						};
						if (keep.from.format('Y-m-d')==keep.to.format('Y-m-d')) day=Math.floor((to.getTime()-from.getTime())/(1000*60*60*24));
						else
						{
							while (keep.from.getTime()<keep.to.getTime())
							{
								if (keep.from.calc('1 month,'+days.toString()+' day')<to)
								{
									month++;
									if (month>11)
									{
										year++;
										month=0;
									}
									day=Math.floor((to.getTime()-keep.from.calc('1 month,'+days.toString()+' day').getTime())/(1000*60*60*24));
								}
								else day=Math.floor((to.getTime()-keep.from.calc(days.toString()+' day').getTime())/(1000*60*60*24));
								keep.from=keep.from.calc('1 month');
							}
						}
						return res
						.replace(/Y/g,year.toString())
						.replace(/FM/g,((year*12)+month).toString())
						.replace(/M/g,month.toString())
						.replace(/FD/g,Math.floor((to.getTime()-from.getTime())/(1000*60*60*24)).toString())
						.replace(/D/g,day.toString());
					})(new Date(from),(isNaN(Date.parse(to)))?new Date():new Date(to),STR(format));
				}
			};
			var MAX=(id) => {
				var res=0;
				if (id in fieldinfos)
				{
					var fieldinfo=fieldinfos[id];
					if (fieldinfo.tableid)
					{
						res=((values) => {
							return (values.length!=0)?values.reduce((a,b) => Math.max(a,b)):0;
						})(record[fieldinfo.tableid].value.shape((item) => pd.isnumeric(item[id].value)?NUM(item[id].value):PD_THROW));
					}
					else res=NUM(record[id].value);
				}
				return res;
			};
			var MAXIF=(id,query='') => {
				var res=0;
				if (id in fieldinfos)
				{
					((record,fieldinfo) => {
						if (record)
						{
							if (fieldinfo.tableid)
							{
								res=((values) => {
									return (values.length!=0)?values.reduce((a,b) => Math.max(a,b)):0;
								})(record[fieldinfo.tableid].value.shape((item) => pd.isnumeric(item[id].value)?NUM(item[id].value):PD_THROW));
							}
							else res=NUM(record[id].value);
						}
					})(pd.filter.scan({fields:fieldinfos},origin,query,false),fieldinfos[id]);
				}
				return res;
			};
			var MIN=(id) => {
				var res=0;
				if (id in fieldinfos)
				{
					var fieldinfo=fieldinfos[id];
					if (fieldinfo.tableid)
					{
						res=((values) => {
							return (values.length!=0)?values.reduce((a,b) => Math.min(a,b)):0;
						})(record[fieldinfo.tableid].value.shape((item) => pd.isnumeric(item[id].value)?NUM(item[id].value):PD_THROW));
					}
					else res=NUM(record[id].value);
				}
				return res;
			};
			var MINIF=(id,query='') => {
				var res=0;
				if (id in fieldinfos)
				{
					((record,fieldinfo) => {
						if (record)
						{
							if (fieldinfo.tableid)
							{
								res=((values) => {
									return (values.length!=0)?values.reduce((a,b) => Math.min(a,b)):0;
								})(record[fieldinfo.tableid].value.shape((item) => pd.isnumeric(item[id].value)?NUM(item[id].value):PD_THROW));
							}
							else res=NUM(record[id].value);
						}
					})(pd.filter.scan({fields:fieldinfos},origin,query,false),fieldinfos[id]);
				}
				return res;
			};
			var SUM=(id) => {
				var res=0;
				if (id in fieldinfos)
				{
					var fieldinfo=fieldinfos[id];
					if (fieldinfo.tableid)
					{
						res=((values) => {
							return (values.length!=0)?values.reduce((a,b) => a+b):0;
						})(record[fieldinfo.tableid].value.shape((item) => pd.isnumeric(item[id].value)?NUM(item[id].value):PD_THROW));
					}
					else res=NUM(record[id].value);
				}
				return res;
			};
			var SUMIF=(id,query='') => {
				var res=0;
				if (id in fieldinfos)
				{
					((record,fieldinfo) => {
						if (record)
						{
							if (fieldinfo.tableid)
							{
								res=((values) => {
									return (values.length!=0)?values.reduce((a,b) => a+b):0;
								})(record[fieldinfo.tableid].value.shape((item) => pd.isnumeric(item[id].value)?NUM(item[id].value):PD_THROW));
							}
							else res=NUM(record[id].value);
						}
					})(pd.filter.scan({fields:fieldinfos},origin,query,false),fieldinfos[id]);
				}
				return res;
			};
			var FORMAT=(...args) => {
				return (typeof args[1]==='string')?((!isNaN(Date.parse(args[0])))?new Date(args[0]).calc(STR(args[2])).format(args[1]):''):NUM(args[0]).comma(args[1]);
			};
			var LEN=(value) => {
				return (value)?value.length:0;
			};
			var LEFT=(value,len) => {
				return STR(value).substr(0,NUM(len));
			};
			var RIGHT=(value,len) => {
				return STR(value).slice(NUM(len)*-1);
			};
			var MID=(value,start,len) => {
				return STR(value).substr(NUM(start)-1,NUM(len));
			};
			var LINE=(value,index) => {
				var res=STR(value).split('\n');
				return (res.length<index)?'':res[index-1];
			};
			var LOOKUP_DEPT=(value) => {
				var res=[];
				if (Array.isArray(value))
				{
					res=Array.from(new Set(value.shape((item) => {
						return ((id) => {
							return ((user) => {
								return (user.length!=0)?user.first().department.value:PD_THROW;
							})(pd.filter.record.user.filter((item) => item['__id'].value==id));
						})(item);
					}).flat()));
				}
				return res;
			};
			var LOOKUP_DEPT_USER=(value,query) => {
				var res=[];
				if (Array.isArray(value))
				{
					res=Array.from(new Set(value.shape((item) => {
						return ((id) => {
							return ((user) => {
								if (user.length!=0)
								{
									if (query) user=user.filter((item) => pd.filter.scan(pd.filter.config.user,item,query));
									return (user.length!=0)?user.map((item) => item['__id'].value):PD_THROW;
								}
								else return PD_THROW;
							})(pd.filter.record.user.filter((item) => item.department.value.includes(id)));
						})(item);
					}).flat()));
				}
				return res;
			};
			var LOOKUP_GROUP=(value) => {
				var res=[];
				if (Array.isArray(value))
				{
					res=Array.from(new Set(value.shape((item) => {
						return ((id) => {
							return ((user) => {
								return (user.length!=0)?user.first().group.value:PD_THROW;
							})(pd.filter.record.user.filter((item) => item['__id'].value==id));
						})(item);
					}).flat()));
				}
				return res;
			};
			var LOOKUP_GROUP_USER=(value,query) => {
				var res=[];
				if (Array.isArray(value))
				{
					res=Array.from(new Set(value.shape((item) => {
						return ((id) => {
							return ((user) => {
								if (user.length!=0)
								{
									if (query) user=user.filter((item) => pd.filter.scan(pd.filter.config.user,item,query));
									return (user.length!=0)?user.map((item) => item['__id'].value):PD_THROW;
								}
								else return PD_THROW;
							})(pd.filter.record.user.filter((item) => item.group.value.includes(id)));
						})(item);
					}).flat()));
				}
				return res;
			};
			var LPAD=(value,len,pad) => {
				return STR(value).padStart(len,pad);
			};
			var RPAD=(value,len,pad) => {
				return STR(value).padEnd(len,pad);
			};
			var REPLACE=(value,pattern,replacement) => {
				return STR(value).replace(new RegExp(STR(pattern),'g'),STR(replacement));
			};
			var NUM=(value) => {
				var res=0;
				switch (typeof value)
				{
					case 'number':
					case 'string':
						res=(pd.isnumeric(value))?parseFloat(value):0;
						break;
				}
				return res;
			};
			var STR=(value) => {
				var res='';
				switch (typeof value)
				{
					case 'number':
					case 'string':
						res=value.toString();
						break;
				}
				return res;
			};
			var TODAY=() => {
				return new Date().format('Y-m-d');
			};
			var WEEK=(value) => {
				return (!isNaN(Date.parse(value)))?pd.constants.weeks[pd.lang][new Date(value).getDay()]:'';
			};
			var result=(answer,fieldinfo) => {
				var res=null;
				switch (fieldinfo.type)
				{
					case 'checkbox':
					case 'creator':
					case 'department':
					case 'file':
					case 'group':
					case 'modifier':
					case 'user':
						res=(answer)?(((Array.isArray(answer))?answer:answer.toString().split(',').map((item) => item.trim())).shape((item) => (item=='LOGIN_USER')?LOGIN_USER:((item)?item:PD_THROW))):[];
						break;
					case 'id':
					case 'lookup':
					case 'number':
						res=((pd.isnumeric(answer))?parseFloat(answer):'');
						break;
					default:
						res=(answer)?((Array.isArray(answer))?answer.join(','):answer.toString()):'';
						break;
				}
				return res;
			};
			var LOGIN_USER=pd.operator.__id.value.toString();
			try
			{
				var formula=param.formula.replace(/([^!><]{1})[ ]*=/g,'$1==');
				var reserved=[];
				for (var key in fieldinfos)
					((fieldinfo) => {
						formula=((formula) => {
							if (formula.match(new RegExp('(^|[^\'\"]{1})'+fieldinfo.id+'([^\'\"]{1}|$)')))
							{
								if (fieldinfo.tableid)
								{
									if (fieldinfo.id in row)
										formula=formula.replace(new RegExp('(^|[^\'\"]{1})'+fieldinfo.id+'([^\'\"]{1}|$)','g'),'$1row["'+fieldinfo.id+'"].value$2');
								}
								else formula=formula.replace(new RegExp('(^|[^\'\"]{1})'+fieldinfo.id+'([^\'\"]{1}|$)','g'),'$1record["'+fieldinfo.id+'"].value$2');
							}
							return formula;
						})(
							formula
							.replace(new RegExp('(AVG|MIN|MAX|SUM)\\([ ]*('+fieldinfo.id+')[ ]*\\)','g'),(match,functions,field) => {
								reserved.push(functions+'("'+field+'")');
								return 'calculate_'+reserved.length.toString();
							})
							.replace(new RegExp('(AVGIF|MINIF|MAXIF|SUMIF)\\([ ]*('+fieldinfo.id+')[ ]*,[ ]*("[^\\"]*"|\\\'[^\\\']*\\\')\\)','g'),(match,functions,field,query) => {
								reserved.push(functions+'("'+field+'",'+query+')');
								return 'calculate_'+reserved.length.toString();
							})
							.replace(new RegExp('(COUNT)\\([ ]*('+fieldinfo.tableid+')[ ]*\\)','g'),(match,functions,field) => {
								reserved.push(functions+'("'+field+'")');
								return 'calculate_'+reserved.length.toString();
							})
							.replace(new RegExp('(COUNTIF)\\([ ]*('+fieldinfo.tableid+')[ ]*,[ ]*("[^\\"]*"|\\\'[^\\\']*\\\')\\)','g'),(match,functions,field,query) => {
								reserved.push(functions+'("'+field+'",'+query+')');
								return 'calculate_'+reserved.length.toString();
							})
						);
					})(fieldinfos[key]);
				reserved.each((reserved,index) => {
					formula=formula.replace(new RegExp('calculate_'+(index+1).toString(),'g'),reserved);
				});
				return result(eval(formula),fieldinfos[param.field]);
			}
			catch(e)
			{
				return result(null,fieldinfos[param.field]);
			}
		}
		else return null;
	}
};
class panda_record{
	/* constructor */
	constructor(){}
	/* create record */
	create(app,isrecord=true){
		var res={};
		for (var key in app.fields)
			((fieldinfo) => {
				switch (fieldinfo.type)
				{
					case 'checkbox':
					case 'department':
					case 'file':
					case 'group':
					case 'user':
						res[key]={value:[]};;
						break;
					case 'lookup':
						res[key]={search:'',value:''};
						break;
					case 'radio':
						res[key]={value:(fieldinfo.options.length!=0)?fieldinfo.options.first().option.value:''};
						break;
					case 'table':
						res[key]={value:[this.create(fieldinfo,false)]};
						break;
					default:
						if (!['id','autonumber','creator','createdtime','modifier','modifiedtime','spacer'].includes(fieldinfo.type)) res[key]={value:''};
						break;
				}
			})(app.fields[key]);
		/* reserved field */
		if (isrecord)
		{
			res['__id']={value:''};
			res['__autonumber']={value:''};
			res['__creator']={value:[]};
			res['__createdtime']={value:''};
			res['__modifier']={value:[]};
			res['__modifiedtime']={value:''};
		}
		return res;
	}
	/* get record */
	get(container,app,errorthrow){
		var res={
			error:false,
			record:{}
		};
		if (!errorthrow)
			for (var key in app.fields)
			{
				((field,fieldinfo) => {
					if (field)
					{
						if (fieldinfo.type!='table') field=field.elm('.pd-field-value');
						switch (fieldinfo.type)
						{
							case 'checkbox':
								if (fieldinfo.required)
									if (!field.elms('input').some((item) => item.checked))
									{
										field.alert(pd.constants.common.message.invalid.required[pd.lang]);
										res.error=true;
									}
								break;
							case 'department':
							case 'file':
							case 'group':
							case 'user':
								if (fieldinfo.required)
									((value) => {
										if (value.length==0)
										{
											field.alert(pd.constants.common.message.invalid.required[pd.lang]);
											res.error=true;
										}
									})((field.elm('input').val())?JSON.parse(field.elm('input').val()):[]);
								break;
							case 'table':
								break;
							default:
								field.elms('input,select,textarea').each((element,index) => {
									if (!element.checkValidity()) res.error=true;
								});
								break;
						}
					}
				})(container.elm('[field-id="'+CSS.escape(key)+'"]'),app.fields[key]);
				if (res.error) break;
			}
		if (!res.error)
		{
			for (var key in app.fields)
				((field,fieldinfo) => {
					if (field)
					{
						if (fieldinfo.type!='table') field=field.elm('.pd-field-value');
						switch (fieldinfo.type)
						{
							case 'checkbox':
								res.record[fieldinfo.id]={
									value:(() => {
										var res=[];
										field.elms('input').each((element,index) => {
											if (element.checked) res.push(element.val());
										});
										return res;
									})()
								};
								break;
							case 'datetime':
								res.record[fieldinfo.id]={
									value:(() => {
										var res='';
										if (field.elm('input').val())
										{
											if (!field.elm('.pd-hour').elm('select').val()) field.elm('.pd-hour').elm('select').val('00');
											if (!field.elm('.pd-minute').elm('select').val()) field.elm('.pd-minute').elm('select').val('00');
										}
										if (field.elm('input').val() && field.elm('.pd-hour').elm('select').val() && field.elm('.pd-minute').elm('select').val())
											res=(field.elm('input').val()+' '+field.elm('.pd-hour').elm('select').val()+':'+field.elm('.pd-minute').elm('select').val()+':00').parseDateTime().format('ISO');
										return res;
									})()
								};
								break;
							case 'department':
							case 'file':
							case 'group':
							case 'user':
								res.record[fieldinfo.id]={
									value:((field.elm('input').val())?JSON.parse(field.elm('input').val()):[])
								};
								break;
							case 'dropdown':
								res.record[fieldinfo.id]={
									value:field.elm('select').val()
								};
								break;
							case 'lookup':
								res.record[fieldinfo.id]={
									search:field.elm('.pd-lookup-search').val(),
									value:field.elm('.pd-lookup-value').val()
								};
								break;
							case 'number':
								res.record[fieldinfo.id]={
									value:((field.elm('input').val())?parseFloat(field.elm('input').val()):field.elm('input').val())
								};
								break;
							case 'radio':
								res.record[fieldinfo.id]={
									value:(() => {
										var res='';
										field.elms('[data-name='+fieldinfo.id+']').each((element,index) => {
											if (element.checked) res=element.val();
										});
										return res;
									})()
								};
								break;
							case 'textarea':
								res.record[fieldinfo.id]={
									value:field.elm('textarea').val()
								};
								break;
							case 'time':
								res.record[fieldinfo.id]={
									value:(() => {
										var res='';
										if (field.elm('.pd-hour').elm('select').val())
											if (!field.elm('.pd-minute').elm('select').val()) field.elm('.pd-minute').elm('select').val('00');
										if (field.elm('.pd-minute').elm('select').val())
											if (!field.elm('.pd-hour').elm('select').val()) field.elm('.pd-hour').elm('select').val('00');
										if (field.elm('.pd-hour').elm('select').val() && field.elm('.pd-minute').elm('select').val())
											res=field.elm('.pd-hour').elm('select').val()+':'+field.elm('.pd-minute').elm('select').val();
										return res;
									})()
								};
								break;
							case 'table':
								res.record[fieldinfo.id]={
									value:(() => {
										var rows=[];
										field.tr.each((element,index) => {
											var row=this.get(element,fieldinfo,errorthrow);
											if (row.error)
											{
												res.error=row.error;
												return PD_BREAK;
											}
											else rows.push(row.record);
										});
										return rows;
									})()
								};
								break;
							default:
								if (!['id','autonumber','creator','createdtime','modifier','modifiedtime','spacer'].includes(fieldinfo.type))
									res.record[fieldinfo.id]={
										value:field.elm('input').val()
									};
								break;
						}
					}
				})(container.elm('[field-id="'+CSS.escape(key)+'"]'),app.fields[key]);
			/* reserved field */
			if (container.elm('[data-type=id]')) res.record['__id']={value:((container.elm('[data-type=id]').val())?parseInt(container.elm('[data-type=id]').val()):container.elm('[data-type=id]').val())};
			if (container.elm('[data-type=autonumber]')) res.record['__autonumber']={value:container.elm('[data-type=autonumber]').val()};
			if (container.elm('[data-type=creator]')) res.record['__creator']={value:((container.elm('[data-type=creator]').val())?JSON.parse(container.elm('[data-type=creator]').val()):[])};
			if (container.elm('[data-type=createdtime]')) res.record['__createdtime']={value:container.elm('[data-type=createdtime]').val()};
			if (container.elm('[data-type=modifier]')) res.record['__modifier']={value:((container.elm('[data-type=modifier]').val())?JSON.parse(container.elm('[data-type=modifier]').val()):[])};
			if (container.elm('[data-type=modifiedtime]')) res.record['__modifiedtime']={value:container.elm('[data-type=modifiedtime]').val()};
		}
		else pd.alert(pd.constants.common.message.invalid.record[pd.lang]);
		return res;
	}
	/* set record */
	set(container,app,record){
		if ('__uneditable' in record)
		{
			if (record['__uneditable'].value) container.addclass('pd-uneditable');
			else container.removeclass('pd-uneditable');
			delete record['__uneditable'];
		}
		else container.removeclass('pd-uneditable');
		Object.values(app.fields).filter((item) => item.type=='spacer').each((fieldinfo,index) => {
			((field) => {
				if (field)
				{
					field.removeclass('pd-hidden');
					if (fieldinfo.id in record)
					{
						if (record[fieldinfo.id].hidden) field.addclass('pd-hidden');
						delete record[fieldinfo.id];
					}
				}
			})(container.elm('[field-id="'+CSS.escape(fieldinfo.id)+'"]'));
		});
		for (var key in record)
			((field,fieldinfo,value) => {
				if (field)
				{
					if (value.disabled) field.addclass('pd-disabled');
					else field.removeclass('pd-disabled');
					if (value.hidden) field.addclass('pd-hidden');
					else field.removeclass('pd-hidden');
					if (fieldinfo.type!='table')
					{
						field=field.elm('.pd-field-value');
						if (value.backcolor) field.addclass('pd-force-backcolor').elm('.pd-guide').css({backgroundColor:value.backcolor});
						else field.removeclass('pd-force-backcolor').elm('.pd-guide').css({backgroundColor:''});
						if (value.forecolor) field.addclass('pd-force-forecolor').elm('.pd-guide').css({color:value.forecolor});
						else field.removeclass('pd-force-forecolor').elm('.pd-guide').css({color:''});
						switch (fieldinfo.type)
						{
							case 'autonumber':
							case 'checkbox':
							case 'creator':
							case 'createdtime':
							case 'department':
							case 'file':
							case 'group':
							case 'id':
							case 'modifier':
							case 'modifiedtime':
							case 'radio':
							case 'user':
								field.css({
									backgroundColor:(value.backcolor)?value.backcolor:'',
									color:(value.forecolor)?value.forecolor:''
								});
								break;
							default:
								field.elms('input,select,textarea').each((element,index) => {
									element.css({
										backgroundColor:(value.backcolor)?value.backcolor:'',
										color:(value.forecolor)?value.forecolor:''
									});
								});
								break;
						}
					}
					switch (fieldinfo.type)
					{
						case 'autonumber':
						case 'id':
							field.elm('.pd-guide').html(value.value);
							break;
						case 'checkbox':
							field.elms('input').each((element,index) => element.checked=value.value.includes(element.val()));
							field.elm('.pd-guide').html(value.value.join('<br>'));
							break;
						case 'color':
							field.css({backgroundColor:(value.value)?value.value:'transparent'}).elm('input').val(value.value);
							field.elm('.pd-guide').html(value.value);
							break;
						case 'creator':
							if (value.value.length>0) field.guide(value.value.first());
							else field.guide('0');
							break;
						case 'createdtime':
							if (value.value) field.elm('.pd-guide').html(new Date(value.value).format('Y-m-d H:i'));
							else field.elm('.pd-guide').html('');
							break;
						case 'datetime':
							if (value.value)
							{
								var date=value.value.parseDateTime();
								field.elm('input').val(date.format('Y-m-d'));
								field.elm('.pd-hour').elm('select').val(date.format('H'));
								field.elm('.pd-minute').elm('select').val(date.format('i'));
								field.elm('.pd-guide').html(date.format('Y-m-d H:i'));
							}
							else
							{
								field.elm('input').val('');
								field.elm('.pd-hour').elm('select').val('');
								field.elm('.pd-minute').elm('select').val('');
								field.elm('.pd-guide').html('');
							}
							break;
						case 'department':
						case 'file':
						case 'group':
						case 'user':
							field.elm('.pd-guide').empty();
							if (value.value)
							{
								field.elm('input').val(JSON.stringify(value.value));
								value.value.each((value,index) => field.guide(value));
							}
							else field.elm('input').val('[]');
							break;
						case 'dropdown':
							field.elm('select').val(value.value);
							field.elm('.pd-guide').html(field.elm('select').selectedtext());
							break;
						case 'lookup':
							if (value.lookup) field.lookup(value.value,record);
							else
							{
								field.elm('.pd-lookup-search').val(value.search);
								field.elm('.pd-lookup-value').val(value.value);
								field.elm('.pd-guide').html(value.search);
							}
							break;
						case 'modifier':
							if (value.value.length>0) field.guide(value.value.first());
							else field.guide('0');
							break;
						case 'modifiedtime':
							if (value.value) field.elm('.pd-guide').html(new Date(value.value).format('Y-m-d H:i'));
							else field.elm('.pd-guide').html('');
							break;
						case 'number':
							if (fieldinfo.demiliter)
							{
								if (pd.isnumeric(value.value))
								{
									field.elm('input').val(Number(value.value).comma(fieldinfo.decimals));
									field.elm('.pd-guide').html(Number(value.value).comma(fieldinfo.decimals));
								}
								else
								{
									field.elm('input').val(value.value);
									field.elm('.pd-guide').html(value.value);
								}
							}
							else
							{
								if (fieldinfo.decimals)
								{
									if (pd.isnumeric(value.value))
									{
										field.elm('input').val(Number(value.value).toFixed(parseInt(fieldinfo.decimals)));
										field.elm('.pd-guide').html(Number(value.value).toFixed(parseInt(fieldinfo.decimals)));
									}
									else
									{
										field.elm('input').val(value.value);
										field.elm('.pd-guide').html(value.value);
									}
								}
								else
								{
									field.elm('input').val(value.value);
									field.elm('.pd-guide').html(value.value);
								}
							}
							if (fieldinfo.unit)
							{
								if (fieldinfo.unitposition=='prefix') field.elm('.pd-guide').html(fieldinfo.unit+field.elm('.pd-guide').text());
								else field.elm('.pd-guide').html(field.elm('.pd-guide').text()+fieldinfo.unit);
							}
							break;
						case 'radio':
							field.elms('[data-name='+key+']').each((element,index) => element.checked=(value.value==element.val()));
							field.elm('.pd-guide').html(value.value);
							break;
						case 'text':
							field.elm('input').val(value.value);
							switch (fieldinfo.format)
							{
								case 'mail':
									field.elm('.pd-guide').append(
										pd.create('a').attr('href','mailto:'+value.value).html(value.value)
									);
									break;
								case 'tel':
									field.elm('.pd-guide').append(
										pd.create('a').attr('href','tel:'+value.value).html(value.value)
									);
									break;
								case 'url':
									field.elm('.pd-guide').append(
										pd.create('a').attr('href',value.value).attr('target','_blank').html(value.value)
									);
									break;
								default:
									field.elm('.pd-guide').html(value.value);
									break;
							}
							break;
						case 'textarea':
							field.elm('textarea').val(value.value);
							field.elm('.pd-guide').html(value.value.replace(/\n/g,'<br>'));
							break;
						case 'time':
							if (value.value)
							{
								field.elm('.pd-hour').elm('select').val(value.value.split(':')[0]);
								field.elm('.pd-minute').elm('select').val(value.value.split(':')[1]);
								field.elm('.pd-guide').html(value.value);
							}
							else
							{
								field.elm('.pd-hour').elm('select').val('');
								field.elm('.pd-minute').elm('select').val('');
								field.elm('.pd-guide').html('');
							}
							break;
						case 'table':
							if (value.value.length==0) field.clearrows();
							else
							{
								field.tr.each((element,index) => {
									if (value.value.length>index)
										this.set(element,fieldinfo,((values) => {
											if (value.disabled)
												for (var key in values) values[key].disabled=true;
											return values;
										})(value.value[index]));
								});
								for (var i=field.tr.length;i<value.value.length;i++)
									this.set(field.addrow(),fieldinfo,((values) => {
										if (value.disabled)
											for (var key in values) values[key].disabled=true;
										return values;
									})(value.value[i]));
								field.tr.slice(value.value.length).each((element,index) => field.delrow(element));
							}
							if (field.tr.length==0)
								((row) => {
									if (value.disabled)
										this.set(row,fieldinfo,((values) => {
											for (var key in values) values[key].disabled=true;
											return values;
										})(this.get(row,fieldinfo,true).record));
								})(field.addrow());
							break;
						default:
							field.elm('input').val(value.value);
							field.elm('.pd-guide').html(value.value);
							break;
					}
				}
			})(container.elm('[field-id="'+CSS.escape(key)+'"]'),app.fields[key],record[key]);
		/* reserved field */
		if ('__id' in record)
			if (container.elm('[data-type=id]')) container.elm('[data-type=id]').val(record['__id'].value);
		if ('__autonumber' in record)
			if (container.elm('[data-type=autonumber]')) container.elm('[data-type=autonumber]').val(record['__autonumber'].value);
		if ('__creator' in record)
			if (container.elm('[data-type=creator]')) container.elm('[data-type=creator]').val(JSON.stringify(record['__creator'].value));
		if ('__createdtime' in record)
			if (container.elm('[data-type=createdtime]')) container.elm('[data-type=createdtime]').val(record['__createdtime'].value);
		if ('__modifier' in record)
			if (container.elm('[data-type=modifier]')) container.elm('[data-type=modifier]').val(JSON.stringify(record['__modifier'].value));
		if ('__modifiedtime' in record)
			if (container.elm('[data-type=modifiedtime]')) container.elm('[data-type=modifiedtime]').val(record['__modifiedtime'].value);
		return new Promise((resolve,reject) => resolve(record));
	}
};
class panda_recordpicker extends panda_dialog{
	/* constructor */
	constructor(multiselect){
		super(999997,false,!multiselect);
		/* setup properties */
		this.multiselect=multiselect;
		this.limit=50;
		this.offset=0;
		this.table=null;
		this.fieldinfo={};
		this.prepend=[];
		this.records=[];
		this.selection=[];
		this.img=this.parts.icon.clone().css({top:'0px'});
		this.prev=this.img.clone()
		.css({right:'4em'})
		.on('click',(e) => {
			this.offset-=this.limit;
			/* search records */
			this.search();
		});
		this.next=this.img.clone()
		.css({right:'2em'})
		.on('click',(e) => {
			this.offset+=this.limit;
			/* search records */
			this.search();
		});
		this.submit=this.img.clone()
		.css({left:'0'})
		.on('click',(e) => {
			this.offset=0;
			/* search records */
			this.search();
		});
		this.input=this.parts.input.clone().css({
			paddingLeft:'2em',
			paddingRight:'4em'
		})
		.attr('placeholder',pd.constants.common.prompt.keyword[pd.lang])
		.attr('type','text')
		.on('keydown',(e) => {
			var code=e.keyCode||e.which;
			if (code==13)
			{
				this.offset=0;
				/* search records */
				this.search();
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
		});
		/* modify elements */
		this.container.css({
			height:'calc(34em + 16px)',
			minWidth:'16em'
		});
		this.contents.css({
			padding:'0px'
		});
		this.header.css({boxShadow:'none'})
		.append(this.input)
		.append(this.next)
		.append(this.prev)
		.append(this.submit)
	}
	/* search records */
	search(callback){
		pd.request(
			pd.ui.baseuri()+'/records.php',
			'GET',
			{},
			{
				app:this.fieldinfo.app,
				query:(() => {
					var res=[];
					if (this.fieldinfo.query) res.push(this.fieldinfo.query);
					if (this.input.val())
					{
						res.push(((keywords) => {
							var res=[];
							keywords.each((keyword,index) => {
								for (var key in this.fieldinfo.picker)
									((picker) => {
										switch (picker.type)
										{
											case 'checkbox':
												res.push(picker.id+' in ("'+keyword+'")');
												break;
											case 'creator':
											case 'department':
											case 'group':
											case 'modifier':
											case 'spacer':
											case 'user':
												break;
											default:
												res.push(picker.id+' like "'+keyword+'"');
												break;
										}
									})(this.fieldinfo.picker[key]);
							});
							return '('+res.join(' or ')+')';
						})(this.input.val().replace(/[　 ]+/g,' ').split(' ').filter((item) => item)));
					}
					return res.join(' and ');
				})(),
				sort:(this.fieldinfo.sort)?this.fieldinfo.sort:'__id asc',
				offset:this.offset,
				limit:this.limit
			}
		)
		.then((resp) => {
			/* setup properties */
			this.records=(this.offset==0)?pd.extend({},this.prepend):[];
			/* create table */
			this.table.clearrows();
			/* append records */
			Array.prototype.push.apply(this.records,resp.records);
			this.records.each((record,index) => {
				((row) => {
					pd.record.set(row,{fields:this.fieldinfo.picker},record);
					if (this.multiselect)
						if (this.selection.some((item) => item['__id'].value==record['__id'].value)) row.css({backgroundColor:'rgba(66,165,245,0.5)',color:''});
				})(this.table.addrow());
			});
			/* modify elements */
			if (this.offset>0) this.prev.show();
			else this.prev.hide();
			if (this.offset+((this.limit==resp.records.length)?this.limit:resp.records.length)<resp.total) this.next.show();
			else this.next.hide();
			if (callback) callback();
		})
		.catch((error) => pd.alert(error.message));
	}
	/* show records */
	show(fieldinfo,prepend,callback){
		var div=this.parts.div.clone().css({
			borderTop:'1px solid #42a5f5',
			borderBottom:'1px solid #42a5f5',
			lineHeight:'2em',
			padding:'0px 0.5em'
		});
		var td=this.parts.td.clone().css({cursor:'pointer',padding:'0',userSelect:'none'});
		var th=this.parts.th.clone().css({backgroundColor:pd.themecolor().backcolor});
		/* setup styles */
		switch (pd.theme)
		{
			case 'dark':
				this.prev.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAf1JREFUeNpiYKAJ+A8EMDYTmkQDsiQIMOLSyQgEGCbABKkLAAKIun6/D/MFCy6voXgLXQJnkOJVSJQpAAFE12BAcQ4LqRoIaibWw0zYBKHJqJGqUU7VKAAIoOGOgGH1nqh4JjbemQhoWk9yCiM2lTFh0RRAUfIkFjCS4mz0ohOnzVCFG6hSCFCUKbAlkoEDAAE0iqiZ+wvoaVnAfyRAa8sU/uMA+PSxkGmZAJCiKI+wkJEhBagRUkxEWLYfKegEqBVFjLT0Mb4GKiMt45imLWNyU/XQzceDouQaEgAggEbRKBgFRBUcdC+1QLUXXYtLoD0GdK8ggHacJ6dmYqHAQoraXUxkWtpP18YeKaMsVPMxtbMJsWMKVGvWEm0xrbIGwaCGthQ/0N1iqOWCQKqQmhYz0ipVE2pTk5yPoQZOoLuPiS25qO5jJIM/QA2/MJB1sMGAdV8GpD4e8BbIKBgFyAAgQLvmdgIgCAVQkwZwhEZolEZphDZolEZqFBNS8CsK7yWVc1D89Qh1H8oAAFAK8VOqhnuWdOlC9/d+sLLk7h/oRXTzL2lZcs1z/y6F4/3MZ8mmhGMJeXohSvYyKkpOYTnCnGs6fCss6bJ3QWdtsiLCeRgxd99nqfnzsgbkMyNpSvY4KMqr/bRaeHZcTVgi8SC1pHigPKQBQIsHAECICye3aWBxWa7dAAAAAElFTkSuQmCC');
				this.next.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAdFJREFUeNpiYKAa+A8B99HFGZEVwAWBAMZmwmUajM2CYSSSbpy6SAIAAUQl/6OLMWEJoAaiAoaJaD+TBAACiPZexgUYCWnG50FGUmxGN4iJSBc2EhXE/xHgPk0DFyCAhgsCBtR7SgsVolIZEwFD1lOUPPElUSYSvBJAlmZcgIWorEemszfgyxAspNpGu0RCNwAQQKMIW8QVDFjdgwQCBspiZKBAibmMxFhMhDmCwPz3YSAshoEPQAcIUlRgkwkEkKJiP8WlJi18TC2LSY7jAUvVgzofD0zJNewAQACNolEwMps+/wekEEEqLt8PlMUwYDCQba7zlJpLadOH7HqY0qbPe6C7+geylUlyN49poLIdtZu3RDf4aGExUUHPRIMc+IGY+Ka2xYX0blcPSKqeQM6ICaU+pnvJdYERAj4w0AoMhtppQOrj0W7MKBg6ACDARtEoGAWjYEQOFpyn+XjqIPMwMlgPxAIjycPIoH/Yef4/8aBhpHkY3h8Y0s3z/5SB93SdzxkEHkYG9+nR/WSkhodp4K4LQBwI7Ow/GM4xjAsMrmruP30BxdUcE8MoGN5JerTQGu7V0mjDY7RpOdp5GO0ejsgBgJEzxDMKRsEoGAX0BADL1BWfwMZOPAAAAABJRU5ErkJggg==');
				this.submit.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtFJREFUeNpiYKAa+P//fwKU/k+2Cf+h9HyiFRNSdJ4oqwECiHK/7yfKpUCmAzYFBgS98x8KKAsQgACivrf/IwGSYxo9FCjR/J8c5zsQCl5GcrzECAQUBy5AAA0X9B8VNOBTy4SukREJAIXkgUIFxNgYQGoOQbbZgFL/vifXZhB4gFQMBsDCAGu5QUq6Jitto2tCTtdMhDSjZwJCcU9eqUdXABBAIw+RUvwFIGWdA8DIP0DLIuU9NGGcRxMXwCVHrXLsPF2TLCjTkGIY1G4HaljsADVMgJi4p2omhfkaX0MQFBVU8y0Wwwv+4wYOyK02uhZRSNGCAaiSjylpdmNr9jBRrSRCtAJwdj3oFQUNdLVw0AOAABpFo2BgWyDQWqoAqbBooHUhoICngvhPK0uRa5wAHFUmUXU21VvhlPicCYeB64nsTCvC6mxq+vY9Lfsn+KrFiUSacYBqQU0iEKBrwqJVUC9AKjiI6UoH0s3X0G4M9QsSZIPR29bIY3nIBQ6tOm7o4D4ONQnUdoADFBvg6E38p5nl+NIC3S2HddoGyvKEQWk5PeI7YUAsxmG5AAO9ALTJ1MAwCkY0AAjQrtXeMAgCUUdghI7QDbQbMIIjdAQ36AiOwAh0A+oEHUE3oJjww1wOPyjqqfciMTHxwoPzPh7yxWAwrgdfeCo7jb4CrvuMSVp2CYkU7qaRPrHzTWszeJa7USBmPm48XOffUd7NG9LPVAveF4g3aMquG0U0YE8DdxeUyApAViayWw9sGkqEh+KhWrHBLdbkEStuNYnn8d5q42IJ5yk/FRDBO0pu3aYKWIHApTJKQE4l1D87CxbwSzkXQ/lOz62efGqDefx1hHJSwD8wkUXQAW0TJeqPmAzIzZIq+ecEOesrLImVqSNq9HYC8EaLdbfLUJ6BdGuXozw66dLG4ZLE2z177L2IV2cJanOIm+xsCBA3pHpoBoPBSI0fpUxZjdiY9G0AAAAASUVORK5CYII=');
				break;
			case 'light':
				this.prev.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjZJREFUeNpiYKAJ6J8y8T+MzYIm0QCk6pHFmNA016ObhqKgMCefkfoOBggg6vr9Psz/LLgCBcVb6BI4gxSvQqJMAQggugYDinNYSNVAUDOxHmbCJghNRo2ENDMSG+VASoGq6RMggIY7Agbae6Limdh4ZyGgaT2QCiAphRGbyliwaALZtJ7s5EksYCTF2ehJE6fNUIUbqFIIUFQuYUskAwcAAmgUUTP3F5CUpSi0DD07TqCZxUDLQBXBfVL1sZBpmQCQoiiPsJCRIQWoES3ENAn2AykHaic+Rlr6GF8DgJGWcUx1i4lN1TS1GF8+HpC2FqGSa+QBgAAaRaNgFBBVcJDVm6BCL4uo2ouFShYaAKnzNG/6oFkKstCALm0uarS7mMi0tJ+ujT1i+79UtRhav/ZTKwewUDubULN5S5MRO4KJC9pu+kB3i6GWC4KoAWvQkxL0hFqYJOdjqIET6BLUWCwHBbsg3S2GWv4B6vsLdLUYyQGGQMqQ5omL2IKG6omL3tluFIwCkgFAgPbN6AZAGASi1XQQR3BD3aSrGhLilzZqoQK9iwu8RLnrUfFAEORKbla63NNSRbq21KPZOCQFqJIqC133wAxJt2FU+uZsCHRPF9d+QgFzq7FJlwymgHk/U3pCdgfmgpMm7PL3p5MVIU8bsTQUpbtxcRsxB6xtI9Ka02CaPL7SLdFSLUtrDi2TwJq2ZB5YOni4ApaIlm6Bvx4eQgC/8fVQwE9sLizwnc3hbwMIgobRAdIK28oCHbudAAAAAElFTkSuQmCC');
				this.next.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAi1JREFUeNpiYKAa6J8y8T8Q30cXZ0LjK4AU4lMANw3GZkGXLMzJZ2QgpIskABBAVPI/Xr9DA6gBn7/rcUri9DNJACCAaO9lXICRkGZ8HmQkxWZ0g5iIdGEjNhew4NHwAKhBkWaBCxBAwwUBo+o9sWqxRZUAsamMiUDJtJ4szVAQgM8VTMRmFiAOIEszLsBCjCJcOYuQzRvwZUkWUm2jWiIZOAAQQKMIW8QV0MJcRmKyExI3EJjsNgyExchAEeiIBwNhMTIQBDriw0BYDAMfgA4QHAiLkcEBoCMcKSo1aeFjallMchxTYjFFqZpUi6mWjwes5Bp5ACCARtEoGJlNn/+0KESI7RD0U7vRTEpPRADqewN6WwwD54GWnx/Ixh5Z9TBVOn1A8B7osP6BsBgECshplzENVLZjona2JzbbUdtiogdDaGHxB2K69dS2uJDe7WqSBy+o4eMJ5IyYUOpjsksuci2+ALTQkBIXk2OxIdDSC5TGDwuJ2USQWomRidrZZBSMggEHAAHaNaMbAEEYiBLDgo7AJo7gaI7gCI5giMSAn0LLNb0XBuAlhF4LXIQQU3Q/vZfcnsPI2jNPtSZck+e66W/utCjcpPzw/DC4vAjXZPHNk/DbDxT53YvwVz6pvecACNec5aY/vAg3zb5UmUMVFitzFoSHlrklOCMa2OPQI40qLHZpIQmrlKXZwurBI06SnBYtNYUhmgdpYbj2UEIYegAwStjMiIcQQkxxA49895hLUEtfAAAAAElFTkSuQmCC');
				this.submit.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7BJREFUeNpiYKAa6J8yMQFK/yfbhP9Qej7RigkpOk+U1QABRLnf92MTZ4LSDkgKHbDpNiDoHZACvIqIChCAAKIIMeLwNtxHhTn5jCTFNHoo4FLPRISZ58mJNQdCwctIauIlKRzwAYAAGqKIkUBcNwIDp4GsRAIqFoC4gBiNAaTmEOQUZkBpWfCeXJtB4AFSMRgAYoNSE9Zyg5R0TVbaRteEnK4JZkn0TAA0rIGcwPxP+4KNWAAQQKO5mVCeg2WdA8DYP0Azi6FZTACILwAtMkQSB4ndxyZHjfbNf2LaE1RNsqBMQ4phUMsdSLEDV04+gBSkRJW3pMY5E45iA2RIIxC/x9cQhEbFeiB2pHqqhlYz/TikHUGOhLZXzpNS6TNSIT2A4nY/MQUuVS0mpibD5gCqt4NwOCARaPkCuhSJ0CyZMFo5wABAAI2iUTCwLRBoLVWAVBI10NRioIUK0JYG0UUhxRaj1TiBQEs2oLWu66FcQaDcB1ItZiHUu8bmK2hQw1op78kp85lw+HY9kUGpiFRnU24xEICaMwSDD+iwBzC3UstiEJhIpBlkta+ZqJAlBahtcT2RZhhQ0+IFxDRvkdrSgVSxGJhoEqHM9wRKs/1Q9RuoGdSCSL2E+WiW7oc5Cpbl8A3Jkduufo8jAT0AWqqIRQ1RDTtSuqmw+PwANPgCWm/CgNRWJTUa9Lja03gtp0Y+xpWi5+Nr3lJsMTRFJ5JqOTV8zAANUpyW08xiIiynncV4LBekW0MO1GQiawxwFAwrABCgXau9QRCIoYQJWMENdAJlBCZQJjCOwAZugE4AG+AGygSs4AjapJra8HF3HEcx96J/jCR91uu1r8+/PDw8/k+FUGw+jzhg9gGGT+iSMjJkLoMwzgxVS5v/xKG1Jp9tA+IfIIDOPDYRMZwRRgnozogq77dxysvZvwE2Z7E4wi17h2yMyMacI5Dl1dTZDjWCixjZZKyiiFm9EAmlmjrDOvMDlc5KE9FhQOwArHU3k1MSpqgtx3FzVbRMCW8tDnURq+AyzjCe108wO4uTZ8GOykNSlYYrqWEBJiMy25Dr7SvRiWs8WuQ7OIOpSveERalg9/j5/exJeqcVYeC7gUIUBd3i+Q9R7N5y8v0n/pDl7IRbyB/e733QvxmAwK+cQE+bSmHFVjC7F5RbVRQwirgI82vPrsE6cTFuXxTPc4NHtYiLszcbEofitlG5JUJphCFbuKdLNR77FM3lZdgw48om0MU49juIO1dMPDw8PJziBXvFttyY+HdhAAAAAElFTkSuQmCC');
				break;
		}
		/* setup properties */
		this.offset=0;
		this.fieldinfo=fieldinfo;
		this.prepend=(Array.isArray(prepend))?prepend:[];
		this.records=[];
		this.selection=[];
		/* setup elements */
		this.input.val('');
		/* create table */
		this.table=this.parts.table.clone().css({marginBottom:'0.5em'})
		.append(pd.create('thead').append(pd.create('tr')))
		.append(pd.create('tbody').append(pd.create('tr')));
		for (var key in this.fieldinfo.picker)
			((picker) => {
				this.table.elm('thead tr').append(
					th.clone()
					.append(div.clone().html(('caption' in picker)?picker.caption:''))
				);
				this.table.elm('tbody tr').append(
					td.clone()
					.append(pd.ui.field.create(((fieldinfo) => {
						fieldinfo.nocaption=true;
						return fieldinfo;
					})(pd.extend({},picker))).css({width:'100%'}).addclass('pd-picker pd-readonly'))
				);
			})(this.fieldinfo.picker[key]);
		this.contents.empty().append(
			this.table.spread((row,index) => {
				row.on('click',(e) => {
					((record) => {
						if (this.multiselect)
						{
							((filter) => {
								if (filter.length==this.selection.length)
								{
									this.selection.push(pd.extend({},record));
									row.css({backgroundColor:'rgba(66,165,245,0.5)',color:''});
								}
								else
								{
									this.selection=filter;
									row.css({backgroundColor:'transparent',color:pd.themecolor().forecolor});
								}
							})(this.selection.filter((item) => item['__id'].value!=record['__id'].value));
						}
						else
						{
							if (callback) callback(record);
							this.hide();
						}
					})(this.records[index]);
				});
				/* activation */
				((app) => {
					row.addclass('pd-scope').elms('.pd-field').each((element,index) => pd.ui.field.activate(element,app));
				})({id:'recordpicker',fields:pd.extend({},this.fieldinfo.picker)})
			})
		);
		if (this.multiselect)
		{
			/* setup handler */
			if (this.handler) this.ok.off('click',this.handler);
			this.handler=(e) => {
				if (callback) callback(this.selection);
				this.hide();
			};
			this.ok.on('click',this.handler);
			this.cancel.on('click',(e) => this.hide());
		}
		/* show */
		this.search(() => super.show());
	}
};
class panda_unifiedpicker extends panda_dialog{
	/* constructor */
	constructor(){
		super(999997,false,false);
		/* setup properties */
		this.active={};
		this.fields={
			name:{
				id:'name',
				type:'text',
				caption:'name',
				required:false,
				nocaption:true
			}
		};
		this.menus={
			users:{
				id:'users',
				keyword:'',
				limit:50,
				offset:0,
				prepend:[],
				records:[],
				selection:[],
				tab:null,
				table:null
			},
			departments:{
				id:'departments',
				keyword:'',
				limit:50,
				offset:0,
				prepend:[],
				records:[],
				selection:[],
				tab:null,
				table:null
			},
			groups:{
				id:'groups',
				keyword:'',
				limit:50,
				offset:0,
				prepend:[],
				records:[],
				selection:[],
				tab:null,
				table:null
			}
		};
		this.img=this.parts.icon.clone().css({top:'0px'});
		this.prev=this.img.clone()
		.css({right:'4em'})
		.on('click',(e) => {
			this.active.offset-=this.active.limit;
			/* search records */
			this.search();
		});
		this.next=this.img.clone()
		.css({right:'2em'})
		.on('click',(e) => {
			this.active.offset+=this.active.limit;
			/* search records */
			this.search();
		});
		this.submit=this.img.clone()
		.css({left:'0'})
		.on('click',(e) => {
			this.active.keyword=this.input.val();
			this.active.offset=0;
			/* search records */
			this.search();
		});
		this.input=this.parts.input.clone().css({
			paddingLeft:'2em',
			paddingRight:'4em'
		})
		.attr('placeholder',pd.constants.common.prompt.keyword[pd.lang])
		.attr('type','text')
		.on('keydown',(e) => {
			var code=e.keyCode||e.which;
			if (code==13)
			{
				this.active.keyword=this.input.val();
				this.active.offset=0;
				/* search records */
				this.search();
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
		});
		/* modify elements */
		this.container.css({
			height:'calc(100% - 1em)',
			paddingTop:'4em',
			width:'55em'
		})
		.append(
			((container) => {
				for (var key in this.menus)
					container.append(
						((menu) => {
							menu.tab=this.parts.button.clone().css({width:'calc(100% / 3)'}).html(pd.constants.picker.caption[menu.id][pd.lang]).on('click',(e) => {
								this.active=menu;
								this.search(() => {
									for (var key in this.menus)
									{
										if (key==menu.id)
										{
											this.menus[key].tab.css({backgroundColor:'rgba(66,165,245,0.5)',color:'rgba(255,255,255,1)'});
											this.menus[key].table.css({display:'table'});
										}
										else
										{
											this.menus[key].tab.css({backgroundColor:'transparent',color:'#42a5f5'});
											this.menus[key].table.hide();
										}
									}
									super.show();
								});
								e.stopPropagation();
								e.preventDefault();
							});
							return menu.tab;
						})(this.menus[key])
					);
				return container;
			})(this.parts.div.clone().css({
				boxShadow:'0 1px 0 #42a5f5',
				left:'0',
				lineHeight:'2em',
				padding:'0',
				position:'absolute',
				textAlign:'center',
				top:'2em',
				width:'100%'
			}))
		);
		this.contents.css({
			padding:'0px'
		});
		for (var key in this.menus)
			this.contents.append(
				((menu) => {
					menu.table=this.parts.table.clone().css({marginBottom:'0.5em'})
					.append(
						pd.create('tbody').append(
							pd.create('tr')
							.append(
								this.parts.td.clone().css({cursor:'pointer',padding:'0',userSelect:'none'})
								.append(pd.ui.field.create(this.fields.name).css({width:'100%'}).addclass('pd-readonly'))
							)
						)
					)
					.spread((row,index) => {
						row.on('click',(e) => {
							((record) => {
								((filter) => {
									if (filter.length==menu.selection.length)
									{
										menu.selection.push(pd.extend({},record));
										row.css({backgroundColor:'rgba(66,165,245,0.5)',color:''});
									}
									else
									{
										menu.selection=filter;
										row.css({backgroundColor:'transparent',color:pd.themecolor().forecolor});
									}
								})(menu.selection.filter((item) => item['__id'].value!=record['__id'].value));
							})(menu.records[index]);
						});
					});
					return menu.table;
				})(this.menus[key])
			);
		this.header
		.append(this.input)
		.append(this.next)
		.append(this.prev)
		.append(this.submit)
	}
	/* search records */
	search(callback){
		this.input.val(this.active.keyword);
		pd.request(
			pd.ui.baseuri()+'/records.php',
			'GET',
			{},
			{
				app:this.active.id,
				query:(() => {
					var res=[];
					if (this.active.id==this.menus.users.id) res.push('available = "available"');
					if (this.active.keyword)
					{
						res.push(((keywords) => {
							var res=[];
							keywords.each((keyword,index) => res.push('name like "'+keyword+'"'));
							return '('+res.join(' or ')+')';
						})(this.active.keyword.replace(/[　 ]+/g,' ').split(' ').filter((item) => item)));
					}
					return res.join(' and ');
				})(),
				sort:'__id asc',
				offset:this.active.offset,
				limit:this.active.limit
			}
		)
		.then((resp) => {
			/* setup properties */
			this.active.records=(this.active.offset==0)?pd.extend({},this.active.prepend):[];
			/* create table */
			this.active.table.clearrows();
			/* append records */
			Array.prototype.push.apply(this.active.records,resp.records);
			this.active.records.each((record,index) => {
				((row) => {
					pd.record.set(row,{fields:this.fields},record);
					if (this.active.selection.some((item) => item['__id'].value==record['__id'].value)) row.css({backgroundColor:'rgba(66,165,245,0.5)',color:''});
				})(this.active.table.addrow());
			});
			/* modify elements */
			if (this.active.offset>0) this.prev.show();
			else this.prev.hide();
			if (this.active.offset+((this.active.limit==resp.records.length)?this.active.limit:resp.records.length)<resp.total) this.next.show();
			else this.next.hide();
			if (callback) callback();
		})
		.catch((error) => pd.alert(error.message));
	}
	/* show records */
	show(prepend,callback){
		/* setup styles */
		switch (pd.theme)
		{
			case 'dark':
				this.prev.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAf1JREFUeNpiYKAJ+A8EMDYTmkQDsiQIMOLSyQgEGCbABKkLAAKIun6/D/MFCy6voXgLXQJnkOJVSJQpAAFE12BAcQ4LqRoIaibWw0zYBKHJqJGqUU7VKAAIoOGOgGH1nqh4JjbemQhoWk9yCiM2lTFh0RRAUfIkFjCS4mz0ohOnzVCFG6hSCFCUKbAlkoEDAAE0iqiZ+wvoaVnAfyRAa8sU/uMA+PSxkGmZAJCiKI+wkJEhBagRUkxEWLYfKegEqBVFjLT0Mb4GKiMt45imLWNyU/XQzceDouQaEgAggEbRKBgFRBUcdC+1QLUXXYtLoD0GdK8ggHacJ6dmYqHAQoraXUxkWtpP18YeKaMsVPMxtbMJsWMKVGvWEm0xrbIGwaCGthQ/0N1iqOWCQKqQmhYz0ipVE2pTk5yPoQZOoLuPiS25qO5jJIM/QA2/MJB1sMGAdV8GpD4e8BbIKBgFyAAgQLvmdgIgCAVQkwZwhEZolEZphDZolEZqFBNS8CsK7yWVc1D89Qh1H8oAAFAK8VOqhnuWdOlC9/d+sLLk7h/oRXTzL2lZcs1z/y6F4/3MZ8mmhGMJeXohSvYyKkpOYTnCnGs6fCss6bJ3QWdtsiLCeRgxd99nqfnzsgbkMyNpSvY4KMqr/bRaeHZcTVgi8SC1pHigPKQBQIsHAECICye3aWBxWa7dAAAAAElFTkSuQmCC');
				this.next.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAdFJREFUeNpiYKAa+A8B99HFGZEVwAWBAMZmwmUajM2CYSSSbpy6SAIAAUQl/6OLMWEJoAaiAoaJaD+TBAACiPZexgUYCWnG50FGUmxGN4iJSBc2EhXE/xHgPk0DFyCAhgsCBtR7SgsVolIZEwFD1lOUPPElUSYSvBJAlmZcgIWorEemszfgyxAspNpGu0RCNwAQQKMIW8QVDFjdgwQCBspiZKBAibmMxFhMhDmCwPz3YSAshoEPQAcIUlRgkwkEkKJiP8WlJi18TC2LSY7jAUvVgzofD0zJNewAQACNolEwMps+/wekEEEqLt8PlMUwYDCQba7zlJpLadOH7HqY0qbPe6C7+geylUlyN49poLIdtZu3RDf4aGExUUHPRIMc+IGY+Ka2xYX0blcPSKqeQM6ICaU+pnvJdYERAj4w0AoMhtppQOrj0W7MKBg6ACDARtEoGAWjYEQOFpyn+XjqIPMwMlgPxAIjycPIoH/Yef4/8aBhpHkY3h8Y0s3z/5SB93SdzxkEHkYG9+nR/WSkhodp4K4LQBwI7Ow/GM4xjAsMrmruP30BxdUcE8MoGN5JerTQGu7V0mjDY7RpOdp5GO0ejsgBgJEzxDMKRsEoGAX0BADL1BWfwMZOPAAAAABJRU5ErkJggg==');
				this.submit.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtFJREFUeNpiYKAa+P//fwKU/k+2Cf+h9HyiFRNSdJ4oqwECiHK/7yfKpUCmAzYFBgS98x8KKAsQgACivrf/IwGSYxo9FCjR/J8c5zsQCl5GcrzECAQUBy5AAA0X9B8VNOBTy4SukREJAIXkgUIFxNgYQGoOQbbZgFL/vifXZhB4gFQMBsDCAGu5QUq6Jitto2tCTtdMhDSjZwJCcU9eqUdXABBAIw+RUvwFIGWdA8DIP0DLIuU9NGGcRxMXwCVHrXLsPF2TLCjTkGIY1G4HaljsADVMgJi4p2omhfkaX0MQFBVU8y0Wwwv+4wYOyK02uhZRSNGCAaiSjylpdmNr9jBRrSRCtAJwdj3oFQUNdLVw0AOAABpFo2BgWyDQWqoAqbBooHUhoICngvhPK0uRa5wAHFUmUXU21VvhlPicCYeB64nsTCvC6mxq+vY9Lfsn+KrFiUSacYBqQU0iEKBrwqJVUC9AKjiI6UoH0s3X0G4M9QsSZIPR29bIY3nIBQ6tOm7o4D4ONQnUdoADFBvg6E38p5nl+NIC3S2HddoGyvKEQWk5PeI7YUAsxmG5AAO9ALTJ1MAwCkY0AAjQrtXeMAgCUUdghI7QDbQbMIIjdAQ36AiOwAh0A+oEHUE3oJjww1wOPyjqqfciMTHxwoPzPh7yxWAwrgdfeCo7jb4CrvuMSVp2CYkU7qaRPrHzTWszeJa7USBmPm48XOffUd7NG9LPVAveF4g3aMquG0U0YE8DdxeUyApAViayWw9sGkqEh+KhWrHBLdbkEStuNYnn8d5q42IJ5yk/FRDBO0pu3aYKWIHApTJKQE4l1D87CxbwSzkXQ/lOz62efGqDefx1hHJSwD8wkUXQAW0TJeqPmAzIzZIq+ecEOesrLImVqSNq9HYC8EaLdbfLUJ6BdGuXozw66dLG4ZLE2z177L2IV2cJanOIm+xsCBA3pHpoBoPBSI0fpUxZjdiY9G0AAAAASUVORK5CYII=');
				break;
			case 'light':
				this.prev.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjZJREFUeNpiYKAJ6J8y8T+MzYIm0QCk6pHFmNA016ObhqKgMCefkfoOBggg6vr9Psz/LLgCBcVb6BI4gxSvQqJMAQggugYDinNYSNVAUDOxHmbCJghNRo2ENDMSG+VASoGq6RMggIY7Agbae6Limdh4ZyGgaT2QCiAphRGbyliwaALZtJ7s5EksYCTF2ehJE6fNUIUbqFIIUFQuYUskAwcAAmgUUTP3F5CUpSi0DD07TqCZxUDLQBXBfVL1sZBpmQCQoiiPsJCRIQWoES3ENAn2AykHaic+Rlr6GF8DgJGWcUx1i4lN1TS1GF8+HpC2FqGSa+QBgAAaRaNgFBBVcJDVm6BCL4uo2ouFShYaAKnzNG/6oFkKstCALm0uarS7mMi0tJ+ujT1i+79UtRhav/ZTKwewUDubULN5S5MRO4KJC9pu+kB3i6GWC4KoAWvQkxL0hFqYJOdjqIET6BLUWCwHBbsg3S2GWv4B6vsLdLUYyQGGQMqQ5omL2IKG6omL3tluFIwCkgFAgPbN6AZAGASi1XQQR3BD3aSrGhLilzZqoQK9iwu8RLnrUfFAEORKbla63NNSRbq21KPZOCQFqJIqC133wAxJt2FU+uZsCHRPF9d+QgFzq7FJlwymgHk/U3pCdgfmgpMm7PL3p5MVIU8bsTQUpbtxcRsxB6xtI9Ka02CaPL7SLdFSLUtrDi2TwJq2ZB5YOni4ApaIlm6Bvx4eQgC/8fVQwE9sLizwnc3hbwMIgobRAdIK28oCHbudAAAAAElFTkSuQmCC');
				this.next.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAi1JREFUeNpiYKAa6J8y8T8Q30cXZ0LjK4AU4lMANw3GZkGXLMzJZ2QgpIskABBAVPI/Xr9DA6gBn7/rcUri9DNJACCAaO9lXICRkGZ8HmQkxWZ0g5iIdGEjNhew4NHwAKhBkWaBCxBAwwUBo+o9sWqxRZUAsamMiUDJtJ4szVAQgM8VTMRmFiAOIEszLsBCjCJcOYuQzRvwZUkWUm2jWiIZOAAQQKMIW8QV0MJcRmKyExI3EJjsNgyExchAEeiIBwNhMTIQBDriw0BYDAMfgA4QHAiLkcEBoCMcKSo1aeFjallMchxTYjFFqZpUi6mWjwes5Bp5ACCARtEoGJlNn/+0KESI7RD0U7vRTEpPRADqewN6WwwD54GWnx/Ixh5Z9TBVOn1A8B7osP6BsBgECshplzENVLZjona2JzbbUdtiogdDaGHxB2K69dS2uJDe7WqSBy+o4eMJ5IyYUOpjsksuci2+ALTQkBIXk2OxIdDSC5TGDwuJ2USQWomRidrZZBSMggEHAAHaNaMbAEEYiBLDgo7AJo7gaI7gCI5giMSAn0LLNb0XBuAlhF4LXIQQU3Q/vZfcnsPI2jNPtSZck+e66W/utCjcpPzw/DC4vAjXZPHNk/DbDxT53YvwVz6pvecACNec5aY/vAg3zb5UmUMVFitzFoSHlrklOCMa2OPQI40qLHZpIQmrlKXZwurBI06SnBYtNYUhmgdpYbj2UEIYegAwStjMiIcQQkxxA49895hLUEtfAAAAAElFTkSuQmCC');
				this.submit.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7BJREFUeNpiYKAa6J8yMQFK/yfbhP9Qej7RigkpOk+U1QABRLnf92MTZ4LSDkgKHbDpNiDoHZACvIqIChCAAKIIMeLwNtxHhTn5jCTFNHoo4FLPRISZ58mJNQdCwctIauIlKRzwAYAAGqKIkUBcNwIDp4GsRAIqFoC4gBiNAaTmEOQUZkBpWfCeXJtB4AFSMRgAYoNSE9Zyg5R0TVbaRteEnK4JZkn0TAA0rIGcwPxP+4KNWAAQQKO5mVCeg2WdA8DYP0Azi6FZTACILwAtMkQSB4ndxyZHjfbNf2LaE1RNsqBMQ4phUMsdSLEDV04+gBSkRJW3pMY5E45iA2RIIxC/x9cQhEbFeiB2pHqqhlYz/TikHUGOhLZXzpNS6TNSIT2A4nY/MQUuVS0mpibD5gCqt4NwOCARaPkCuhSJ0CyZMFo5wABAAI2iUTCwLRBoLVWAVBI10NRioIUK0JYG0UUhxRaj1TiBQEs2oLWu66FcQaDcB1ItZiHUu8bmK2hQw1op78kp85lw+HY9kUGpiFRnU24xEICaMwSDD+iwBzC3UstiEJhIpBlkta+ZqJAlBahtcT2RZhhQ0+IFxDRvkdrSgVSxGJhoEqHM9wRKs/1Q9RuoGdSCSL2E+WiW7oc5Cpbl8A3Jkduufo8jAT0AWqqIRQ1RDTtSuqmw+PwANPgCWm/CgNRWJTUa9Lja03gtp0Y+xpWi5+Nr3lJsMTRFJ5JqOTV8zAANUpyW08xiIiynncV4LBekW0MO1GQiawxwFAwrABCgXau9QRCIoYQJWMENdAJlBCZQJjCOwAZugE4AG+AGygSs4AjapJra8HF3HEcx96J/jCR91uu1r8+/PDw8/k+FUGw+jzhg9gGGT+iSMjJkLoMwzgxVS5v/xKG1Jp9tA+IfIIDOPDYRMZwRRgnozogq77dxysvZvwE2Z7E4wi17h2yMyMacI5Dl1dTZDjWCixjZZKyiiFm9EAmlmjrDOvMDlc5KE9FhQOwArHU3k1MSpqgtx3FzVbRMCW8tDnURq+AyzjCe108wO4uTZ8GOykNSlYYrqWEBJiMy25Dr7SvRiWs8WuQ7OIOpSveERalg9/j5/exJeqcVYeC7gUIUBd3i+Q9R7N5y8v0n/pDl7IRbyB/e733QvxmAwK+cQE+bSmHFVjC7F5RbVRQwirgI82vPrsE6cTFuXxTPc4NHtYiLszcbEofitlG5JUJphCFbuKdLNR77FM3lZdgw48om0MU49juIO1dMPDw8PJziBXvFttyY+HdhAAAAAElFTkSuQmCC');
				break;
		}
		/* setup properties */
		for (var key in this.menus)
			((menu) => {
				menu.keyword='';
				menu.offset=0;
				menu.prepend=(menu.id==this.menus.users.id)?((Array.isArray(prepend))?prepend:[]):[];
				menu.records=[];
				menu.selection=[];
			})(this.menus[key])
		/* setup handler */
		if (this.handler) this.ok.off('click',this.handler);
		this.handler=(e) => {
			callback({
				departments:this.menus.departments.selection,
				groups:this.menus.groups.selection,
				users:this.menus.users.selection
			});
			this.hide();
		};
		this.ok.on('click',this.handler);
		this.cancel.on('click',(e) => this.hide());
		/* show */
		this.menus.users.tab.dispatchEvent(new MouseEvent('click'));
	}
};
class panda_user_interface{
	/* constructor */
	constructor(){
		this.uri='';
		this.box={
			create:(app,caption) => {
				var res=pd.create('div').addclass('pd-box')
				.append(
					pd.create('span').addclass('pd-box-caption')
					.append(
						pd.create('span').addclass('pd-box-caption-label').html(caption)
					)
					.append(
						pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-up')
					)
					.on('click',(e) => {
						if (res.elm('.pd-box-container').visible()) res.close();
						else res.open();
					})
				)
				.append(
					pd.create('div').addclass('pd-box-container')
				);
				res.open=() => {
					res.elm('.pd-box-container').show();
					res.elm('.pd-icon-arrow').removeclass('pd-icon-arrow-down').addclass('pd-icon-arrow-up');
					if (app) pd.event.call(app,'pd.box.open.'+res.attr('field-id'),{container:res});
				};
				res.close=() => {
					res.elm('.pd-box-container').hide();
					res.elm('.pd-icon-arrow').removeclass('pd-icon-arrow-up').addclass('pd-icon-arrow-down');
					if (app) pd.event.call(app,'pd.box.close.'+res.attr('field-id'),{container:res});
				};
				return res;
			}
		};
		this.chart={
			create:(type) => {
				return ((table,chart) => {
					table
					.append(pd.create('thead').append(pd.create('tr').addclass('pd-matrix-head')))
					.append(pd.create('tbody').append(pd.create('tr').addclass('pd-matrix-row')))
					.spread(null,null,false).show=(source,view) => {
						switch (view.chart.type)
						{
							case 'table':
								chart.hide();
								((head,template,fields) => {
									var set=(index,records,row,parsed) => {
										if (index<source.rows.length)
										{
											for (var key in records)
											{
												parsed[source.rows[index].field]={value:records[key].caption};
												row=((res) => {
													row.elm('[field-id="'+CSS.escape(source.rows[index].field)+'"]').closest('td').attr('rowspan',res.span);
													((id) => {
														(res.span-1).each((index) => {
															row=row.nextElementSibling;
															row.elm('[field-id="'+CSS.escape(id)+'"]').closest('td').hide();
														});
													})(source.rows[index].field);
													return res.row;
												})(set(index+1,records[key].rows,row,parsed));
												if (Object.keys(records).last()!=key) row=table.insertrow(row);
											}
											return {row:row,span:Object.keys(records).length};
										}
										else
										{
											for (var key in records) parsed[key]={value:records[key]};
											pd.record.set(row,{fields:fields},parsed);
											return {row:row,span:1};
										}
									};
									table.clearrows();
									source.fields.each((field,index) => {
										head.append(
											pd.create('th').addclass('pd-matrix-head-cell')
											.append(pd.create('span').addclass('pd-matrix-head-caption').html(field.caption))
										);
										template.append(
											pd.create('td').append(
												((style) => {
													return pd.ui.field.create(field).addclass('pd-readonly pd-matrix-row-cell'+((index<source.rows.length)?'':style));
												})((type=='timeseries')?' pd-matrix-row-cell-numeric':'')
											)
										);
										fields[field.id]=field;
									});
									if (!Array.isArray(source.records)) set(0,source.records,table.addrow(),{});
								})(table.css({display:'table'}).elm('thead tr').empty(),table.template.empty(),{});
								break;
							default:
								if (pd.chart.loaded)
								{
									table.hide();
									if (!chart.parentNode) table.parentNode.append(chart);
									((categories) => {
										var build=() => {
											pd.chart.reloadchart(chart.empty().show(),{
												data:((columns) => {
													var res=new Array(columns.length+1).fill().map((item,index) => [(index==0)?'':columns[index-1]]);
													var set=(index,records,parsed) => {
														if (index<source.rows.length)
														{
															for (var key in records) set(index+1,records[key].rows,{name:(index==0)?records[key].caption:parsed.name+' '+records[key].caption,data:[]});
														}
														else
														{
															parsed.data=categories.map((item) => parseFloat((type=='timeseries')?records[item.id].toString().replace(/[^0-9.]+/g,''):records[item.id]) || 0);
															switch (view.chart.type)
															{
																case 'pie':
																	parsed.data.each((data,index) => {
																		((value) => {
																			if (value) res[index].push([columns[index]+' '+parsed.name,value])
																		})(pd.isnumeric(data)?data:0);
																	});
																	break;
																default:
																	res[0].push(parsed.name);
																	parsed.data.each((data,index) => res[index+1].push(data));
																	break;
															}
														}
													};
													switch (view.chart.type)
													{
														case 'pie':
															res=res.map((item) => []);
															res.shift();
															break;
													}
													if (source.rows.length==0) res=[['','']].concat(categories.map((item) => [item.caption,source.records[item.id]]));
													else
													{
														set(0,source.records);
														switch (view.chart.type)
														{
															case 'pie':
																res=[['','']].concat(res.flat(1));
																break;
														}
													}
													return res;
												})(categories.map((item) => item.caption)),
												options:{
													animation:{
														duration:1000,
														easing:'out',
														startup:true
													},
													backgroundColor:'transparent',
													colors:[
														'#4e79a7',
														'#a0cbe8',
														'#f28e2b',
														'#ffbe7d',
														'#59a14f',
														'#8cd17d',
														'#b6992d',
														'#f1ce63',
														'#499894',
														'#86bcb6',
														'#e15759',
														'#ff9d9a',
														'#79706e',
														'#bab0ac',
														'#d37295',
														'#fabfd2',
														'#b07aa1',
														'#d4a6c8',
														'#9d7660',
														'#d7b5a6'
													],
													height:chart.parentNode.innerheight(),
													legend:{
														alignment:'center',
														pagingTextStyle:{
															color:pd.themecolor().forecolor
														},
														position:'bottom',
														textStyle:{
															color:pd.themecolor().forecolor
														},
														scrollArrows:{
															activeColor:pd.themecolor().forecolor,
															inactiveColor:'transparent'
														}
													},
													pieSliceBorderColor:'transparent',
													tooltip:{
														showColorCode:true
													},
													hAxis:{
														baselineColor:(pd.theme=='light')?'#b6b6b6':'#727272',
														gridlines:{
															color:(pd.theme=='light')?'#b6b6b6':'#727272'
														},
														minorGridlines:{
															color:(pd.theme=='light')?'#b6b6b6':'#727272'
														},
														textStyle:{
															color:pd.themecolor().forecolor
														}
													},
													vAxis:{
														baselineColor:(pd.theme=='light')?'#b6b6b6':'#727272',
														gridlines:{
															color:(pd.theme=='light')?'#b6b6b6':'#727272'
														},
														minorGridlines:{
															color:(pd.theme=='light')?'#b6b6b6':'#727272'
														},
														textStyle:{
															color:pd.themecolor().forecolor
														}
													},
													width:chart.parentNode.innerwidth()
												},
												type:view.chart.type
											});
										};
										chart.off('show').on('show',(e) => build());
										build();
									})(source.fields.slice(source.rows.length).map((item) => ({id:item.id,caption:item.caption})));
								}
								else pd.alert(pd.constants.common.message.invalid.chart[pd.lang]);
								break;
						}
					};
					table.chart=chart;
					return table;
				})(pd.create('table').addclass('pd-matrix'),pd.create('div').css({overflow:'hidden'}));
			},
			types:((types) => ['table'].concat(types))(pd.chart.types)
		};
		this.field={
			activate:(field,app) => {
				var fieldinfos=this.field.parallelize(app.fields);
				var alert=() => {
					return pd.create('div').css({
						zIndex:pd.window.alert.cover.style.zIndex-4
					})
					.append(
						pd.create('img')
						.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QkVGNzA3QTE1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QkVGNzA3QTI1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCRUY3MDc5RjVFNzgxMUU4QjkwMDlFQTY0MUJBNTM0NyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCRUY3MDdBMDVFNzgxMUU4QjkwMDlFQTY0MUJBNTM0NyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkBlNTAAAADNSURBVHja7NHBCcJAFATQZNBcYwmSmycPlpI2bCVgAVqAVmAFHmxqncAKQVyz+/N/grADc0iyy0Be6ZwrlgiKhZKH83Ae/v/h1X23l9499vfZk2hYOHpgO7ZkH+xzjl9dsze2Ytfsld3MMXxhm8Hzlj1bD/eu7Zf3rf9mMvx2DaXzZ1SHh66hVP5MrTn86RpK48+qDIdcQ4nyxkRXsTcmuoq9oeAq8oaSa7I3FF2TvKHomuQNZddobxi4RnnDyHXUG0auo94wdP3p/RJgAMw4In5GE/6/AAAAAElFTkSuQmCC')
					)
					.append(
						pd.create('span')
					);
				};
				var call=(type) => {
					((container,scope) => {
						if (field.elm('.pd-field-alert')) field.elm('.pd-field-alert').hide();
						else
						{
							field.elms('input,select,textarea').each((element,index) => {
								if (element.alert) element.alert.hide();
							});
						}
						pd.event.call(app.id,type,(() => {
							var res={
								container:scope,
								record:pd.record.get(container,app,true).record
							};
							if (scope.hasAttribute('row-id')) res=pd.extend({rowindex:scope.attr('row-id')},res);
							return res;
						})())
						.then((param) => {
							if (!param.error)
							{
								pd.event.call(app.id,'pd.action.call',{
									record:param.record,
									workplace:(container.closest('.pd-view'))?'view':'record'
								})
								.then((param) => {
									pd.record.set(container,app,param.record);
									((event) => {
										container.attr('unsaved','unsaved').dispatchEvent(event);
									})(new Event('change'));
								});
							}
						});
					})(field.closest('[form-id=form_'+app.id+']'),field.closest('.pd-scope'));
				};
				if (field.attr('field-id'))
					((field,fieldinfo) => {
						switch (fieldinfo.type)
						{
							case 'address':
								((handler) => {
									field.elm('.pd-open').on('click',(e) => {
										((scope) => {
											((resp) => {
												if (resp.lat && resp.lng)
												{
													field.map.popup.show();
													field.map.map.reloadmap([resp],true);
												}
											})({
												lat:scope.elm('[field-id="'+CSS.escape(fieldinfo.mapping.lat)+'"]').elm('.pd-field-value').elm('input').val(),
												lng:scope.elm('[field-id="'+CSS.escape(fieldinfo.mapping.lng)+'"]').elm('.pd-field-value').elm('input').val()
											});
										})(field.closest('.pd-scope'));
									});
									field.elm('.pd-search').on('click',(e) => {
										((address) => {
											if (address) handler(address);
											else field.set({}).then(() => call('pd.change.'+fieldinfo.id));
										})(field.elm('input').val());
									});
									field.elm('input').on('change',(e) => {
										if (e.currentTarget.val()) handler(e.currentTarget.val());
										else field.set({}).then(() => call('pd.change.'+fieldinfo.id));
									});
								})((address) => {
									pd.map.searchlocation(address,(lat,lng) => {
										((resp) => {
											field.set(resp).then(() => call('pd.change.'+fieldinfo.id));
										})({lat:lat,lng:lng});
									});
								});
								field.map=((map) => {
									map.map.init(
										map.popup.contents.elm('.pd-container'),
										{
											fullscreenControl:true,
											mapTypeControl:true,
											streetViewControl:true,
											streetViewControlOptions:{
												position:google.maps.ControlPosition.RIGHT_TOP
											},
											styles:[
												{
													featureType:'landscape.man_made',
													elementType:'labels.icon',
													stylers:[{visibility:'off'}]
												},
												{
													featureType:'poi',
													elementType:'labels.icon',
													stylers:[{visibility:'off'}]
												}
											],
											zoomControl:true,
											zoomControlOptions:{
												position:google.maps.ControlPosition.RIGHT_TOP
											},
											zoom:14
										}
									);
									return map;
								})({
									map:new panda_map(),
									popup:pd.create('div').addclass('pd-container').popup('full','full')
								});
								field.set=(record) => {
									return new Promise((resolve,reject) => {
										pd.record.set(field.closest('.pd-scope'),((fieldinfo.tableid)?app.fields[fieldinfo.tableid]:app),(() => {
											var res={};
											for (var key in fieldinfo.mapping)
												if (fieldinfo.mapping[key] in fieldinfos)
													res[fieldinfo.mapping[key]]={value:(key in record)?record[key]:''};
											return res;
										})());
										resolve();
									});
								};
								break;
							case 'checkbox':
								if (fieldinfo.required)
								{
									field.alert=(message) => {
										if (!field.elm('.pd-field-alert')) field.append(alert().addclass('pd-field-alert'));
										field.elm('.pd-field-alert').elm('span').html(message).parentNode.show();
									};
								}
								break;
							case 'color':
								field.elm('.pd-search').on('click',(e) => {
									pd.pickupcolor((color) => {
										field.css({backgroundColor:color}).elm('input').val(color);
										call('pd.change.'+fieldinfo.id);
									});
								});
								field.elm('input').on('change',(e) => {
									if (!e.currentTarget.val())
									{
										field.css({backgroundColor:'transparent'});
										call('pd.change.'+fieldinfo.id);
									}
									else
									{
										var color=e.currentTarget.val().replace(/#/g,'');
										if (color.match(/([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/g))
										{
											field.css({backgroundColor:'#'+color}).elm('input').val('#'+color);
											call('pd.change.'+fieldinfo.id);
										}
									}
								});
								break;
							case 'creator':
							case 'modifier':
								field.guide=(id) => {
									pd.request(
										this.baseuri()+'/records.php',
										'GET',
										{},
										{
											app:'users',
											id:id
										},
										true
									)
									.then((resp) => {
										field.elm('.pd-guide').html('');
										if (resp.total!=0)
											if ('name' in resp.record)
												field.elm('.pd-guide').html(resp.record.name.value);
									})
									.catch((error) => pd.alert(error.message));
								}
								break;
							case 'date':
								field.elm('.pd-search').on('click',(e) => {
									pd.pickupdate(field.elm('input').val(),(date) => {
										field.elm('input').val(date);
										call('pd.change.'+fieldinfo.id);
									});
								});
								break;
							case 'datetime':
								field.elm('.pd-search').on('click',(e) => {
									pd.pickupdate(field.elm('input').val(),(date) => {
										field.elm('input').val(date);
										call('pd.change.'+fieldinfo.id);
									});
								});
								break;
							case 'department':
							case 'group':
							case 'user':
								field.elm('.pd-search').on('click',(e) => {
									if (fieldinfo.unify)
									{
										field.recordpicker.show(
											((fieldinfo.loginuser)?[{__id:{value:'LOGIN_USER'},account:{value:'LOGIN_USER'},name:{value:'Login user'}}]:[]),
											(records) => {
												((values) => {
													records.users.each((record,index) => {
														if (!values.includes(record['__id'].value.toString())) values.push(record['__id'].value.toString());
													});
													records.departments.each((record,index) => {
														if (!values.includes('d'+record['__id'].value.toString())) values.push('d'+record['__id'].value.toString());
													});
													records.groups.each((record,index) => {
														if (!values.includes('g'+record['__id'].value.toString())) values.push('g'+record['__id'].value.toString());
													});
													field.elm('input').val(JSON.stringify(values));
													call('pd.change.'+fieldinfo.id);
												})((field.elm('input').val())?JSON.parse(field.elm('input').val()):[]);
											}
										);
									}
									else
									{
										field.recordpicker.show(
											{
												app:fieldinfo.type+'s',
												query:(fieldinfo.type=='user')?'available = "available"':'',
												sort:'__id asc',
												picker:{
													name:{
														id:'name',
														type:'text',
														caption:'name',
														required:false,
														nocaption:true
													}
												}
											},
											((fieldinfo.loginuser)?[{__id:{value:'LOGIN_USER'},account:{value:'LOGIN_USER'},name:{value:'Login user'}}]:[]),
											(records) => {
												((values) => {
													records.each((record,index) => {
														if (!values.includes(record['__id'].value.toString())) values.push(record['__id'].value.toString());
													});
													field.elm('input').val(JSON.stringify(values));
													call('pd.change.'+fieldinfo.id);
												})((field.elm('input').val())?JSON.parse(field.elm('input').val()):[]);
											}
										);
									}
								});
								field.recordpicker=(fieldinfo.unify)?new panda_unifiedpicker():new panda_recordpicker(true);
								field.guide=(id) => {
									field.elm('.pd-guide').append(
										((guide) => {
											guide
											.append(
												pd.create('button').addclass('pd-icon pd-icon-del pd-'+fieldinfo.type+'guide-icon').on('click',(e) => {
													pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
														field.elm('input').val(JSON.stringify(JSON.parse(field.elm('input').val()).filter((item) => item!=id)));
														call('pd.change.'+fieldinfo.id);
													});
												})
											)
											.append(
												((res) => {
													if (id=='LOGIN_USER') res.html('Login user');
													else
													{
														pd.request(
															this.baseuri()+'/records.php',
															'GET',
															{},
															(() => {
																var res={
																	app:fieldinfo.type+'s',
																	id:id
																};
																if (fieldinfo.unify)
																	switch (id.charAt(0))
																	{
																		case 'd':
																			res={
																				app:'departments',
																				id:id.slice(1)
																			};
																			break;
																		case 'g':
																			res={
																				app:'groups',
																				id:id.slice(1)
																			};
																			break;
																		default:
																			res={
																				app:'users',
																				id:id
																			};
																			break;
																	}
																return res;
															})(),
															true
														)
														.then((resp) => {
															if (resp.total!=0)
																if ('name' in resp.record) res.html(resp.record.name.value);
														})
														.catch((error) => pd.alert(error.message));
													}
													return res;
												})(pd.create('span').addclass('pd-'+fieldinfo.type+'guide-label'))
											)
											return guide;
										})(pd.create('span').addclass('pd-'+fieldinfo.type+'guide'))
									);
								};
								if (fieldinfo.required)
								{
									field.alert=(message) => {
										if (!field.elm('.pd-field-alert')) field.append(alert().addclass('pd-field-alert'));
										field.elm('.pd-field-alert').elm('span').html(message).parentNode.show();
									};
								}
								break;
							case 'file':
								if (!('dir' in fieldinfo)) fieldinfo['dir']='attachment';
								field.elm('.pd-search').on('click',(e) => {
									((file) => {
										if ('accept' in fieldinfo) file.attr('accept',fieldinfo.accept);
										pd.elm('body').append(file.on('change',(e) => {
											if (e.currentTarget.files)
											{
												((files) => {
													pd.request(this.baseuri()+'/limit.php','GET',{},{option:'upload_max_filesize'},true)
													.then((resp) => {
														if (Array.from(files).some((file,index) => new Blob([file],{type:file.type}).size>resp.size))
														{
															pd.alert(pd.constants.common.message.invalid.upload[pd.lang].replace(/%value%/g,resp.value));
															document.body.removeChild(file);
														}
														else
														{
															pd.file(this.baseuri()+'/file.php','POST',{},{dir:fieldinfo.dir,files:files})
															.then((resp) => {
																field.elm('input').val(((files) => {
																	return JSON.stringify(files.concat(resp.files));
																})((field.elm('input').val())?JSON.parse(field.elm('input').val()):[]));
																call('pd.change.'+fieldinfo.id);
															})
															.catch((error) => pd.alert(error.message))
															.finally(() => document.body.removeChild(file));
														}
													})
													.catch((error) => {
														pd.alert(error.message);
														document.body.removeChild(file);
													});
												})(e.currentTarget.files);
											}
											else document.body.removeChild(file);
										}));
										file.click();
									})(pd.create('input').attr('type','file').css({display:'none'}));
								});
								field.guide=(file) => {
									field.elm('.pd-guide').append(
										((guide) => {
											guide
											.append(
												pd.create('button').addclass('pd-icon pd-icon-del pd-fileguide-icon').on('click',(e) => {
													pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
														field.elm('input').val(JSON.stringify(JSON.parse(field.elm('input').val()).filter((item) => item.filekey!=file.filekey)));
														call('pd.change.'+fieldinfo.id);
														pd.event.call(app.id,'pd.file.delete.call',{
															dir:fieldinfo.dir,
															filekey:file.filekey,
															id:((container) => {
																return (container.elm('[data-type=id]'))?container.elm('[data-type=id]').val():'';
															})(field.closest('[form-id=form_'+app.id+']'))
														});
													});
												})
											)
											.append(
												pd.create('span').addclass('pd-fileguide-label').html(file.name).on('click',(e) => field.open(file))
											)
											return guide;
										})(pd.create('span').addclass('pd-fileguide'))
									);
								};
								field.open=(file) => {
									pd.file(this.baseuri()+'/file.php','GET',{},{dir:fieldinfo.dir,filekey:file.filekey})
									.then((resp) => {
										try
										{
											var src=(() => {
												var res='';
												switch (pd.theme)
												{
													case 'dark':
														res='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtFJREFUeNpiYKA6+A8EyHwmfJI4dQKZBjA+C9EmICm6T5KjAQKIHn7H6vr/EGCAroARl18ZgYB8vwIEEE29/h6EyQ43fBHLhEPTfmLEsNoEBAFY5AIIuQSkKOE/bpBAtQAFCKDhiAhlXiZKDKe+ZuRCCD2jEsrmMIWGSLQALgNgmhygtrzHk8NAwAGbzTBBARzmC6CpQy1XSSpfYQUUsRoxCi08YaAA9aPC4Eu+AAE0iugGGKlRxBCd7KhVitCl+ELKIxhVFVptRJs8BCsWsQADalqyHt10LA4wwOFzEFhPqoUNBGt/EtoyIPNIjmMsvjgPxAJoagSg4v9xpQOisxO09UiNhPIAmNsUKY3z+f/xg/mjReOgAwABNIpGwSggujM79FsgI9ti5PoYvW6m1bAKIfB+ICx/PxA+p5lP5yO3LtAsf49LHbmWJeAbOkIfSiOkntRmKcltKWztMqq0h2naNqekR4Cv90GOxcigAIv6AnwaiG7QU9p1IWbYBleRGUhFewPJKpNBY7//SQf7qVaGQwfw8BaZyIN3tCrJGqiR5UbBKKAJAAjQrhXYMAgCQUk6gCO4QjeoGziCo7iBK3SDjlA3qBvQDXSDFpJr2hKoovii/YvGaBS4/wfkHj4YDMamIKgrhHiffTzS+up9z4SH9zrsUYP4O9GFCRPhsFA/dS1gTq71iLo0jvVlE70VkWzsHvPQBc2ORkx8e0QnEo+fKHYKaHFJjknYO4h3jvdskKgvoyJYjgxRaVPeDELXXx4dMKRpsHJpZedL16TaeQiDXxztqKjmYR1e6dLJF5SfJmH2R8zysCvM6qmDEEK+9hzhyTxsg/aE7sM3S/gXBrnCDFP9Hb4PHjXCx+poSKw4qr+yNpiHdWECULe5Os/q7Fci16P+XLzRkrYAc3I1cirxgUS5WRI7kK4pPVI2V7y/2IgvVjLES+YhlXcYDAZjc3gC2vR/IwVkWLEAAAAASUVORK5CYII=';
														break;
													case 'light':
														res='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA1FJREFUeNpiYKA66J8y8T8ynwmfJE6dQHYAjM9CtAlIihJIcjRAANHD71hdDxIA+RVdAbKf1wMFqeRXgACiqdcbQBiXPBMB/fVQTLxmoG3riRHDlXwWgIjCnHxGJOkPMHmYOCMx0QwDaIZRBgACaDgiYMDtxydPKJE4UKIZL8AVzwZA6jySkCEwji8QtBmoUQBIgbAhTCOIDxXHX4DgSl3Y5CjyMwspaRuvn6EJfwEOtQtIyhiEEsnAAYAAGkV0A4wUFDH/KSmPmYaEj4nJpcT6niQfQw01xCFtSEqQMxLwYT+QKsDmI6RyGV4eYwmRCUC5QpIsRjJEEaj5ARmJTwFI3ccV/CxEmHEfS2svEWjYArQG33yKi3ooCAQ1MXHIzQdaRqxFjtRI1aDgA5X+ClikQdHhSE60jAKaAoAAGkWjYBSgtF8pacOyUGC3AyUOH7Cmz8izmJGUxEREvB4AVouOtGhlvod2Y7GBD0BLBWnWoMdhOUmWEh3HoDYVrKkDteADNktBaogdcGMksZnTCLSkAcnnDEiWgsTriW0KMRKZkEDd8kQiQwcUMgmEEhwLgVKJ5LiDOjARKS04kFNkCkAb9h+gwXaBgG8NoNEjQK2yGmTQeWjD/gCozQ10xAekkaL1pJbduCz+gMfVIAve4x1LxjSLuOwEjdcNVCgZN+BKI4xEpFKi4w3JhwTTA6lFJqjL2o8rQQMtm0CPFgjesfhRMAoGDAAEaNdqbxCEgWhjGKAjMAKbyAg6ATM4gWECGQE2cBRGcAS5eI1VGvt110C8F/hDSNvX69217yqPQCAQbBnF69iuikbJevrh3ywshIUwrf82Md93E7QSjpXJR81NRelE4ixEi6alQOKsRMkI4+XCo/rU7wxAiBo9xFdEsU1X0XhY3sluk5VwhHo2q5c+dTHKm8Pi3fL2LotiP6DAAvHa09ddWQofNWHXvQ8YMMh6Y2iniStJ4wTARDWpuzWKtNTgkm6ZQ4FxnawUVhEOpv26kDFblp8jLFlblqypZ61itAgMFtTVqyVkP9C3J/UWwM3q0KoAYglDUeOW0Z/GaH4i5nEO/THneh7r0vNkgGhXYdt4YBWRKoiNmHeHPe60uh++any7595pCQQCgWDLeALGLWqyLWBxZQAAAABJRU5ErkJggg==';
														break;
												}
												return res;
											})();
											var download=() => {
												if (window.navigator.msSaveBlob) window.navigator.msSaveOrOpenBlob(((data) => {
													var datas=atob(data);
													var buffer=new Uint8Array(datas.length);
													datas.length.each((index) => buffer[index]=datas.charCodeAt(index));
													return new Blob([buffer.buffer],{type:file.filetype});
												})(resp.file),file.name);
												else
												{
													var a=pd.create('a')
													.css({display:'none'})
													.attr('href',this.objecturl(resp.file,file.filetype))
													.attr('target','_blank')
													.attr('download',file.name);
													pd.elm('body').append(a);
													a.click();
													document.body.removeChild(a);
												}
											};
											switch (file.filetype)
											{
												case 'application/javascript':
													fetch(new Request(this.objecturl(resp.file,file.filetype)))
													.then((resp) => resp.text())
													.then((text) => {
														var lines=text.split('\n');
														pd.create('div')
														.append(
															((container) => {
																lines.each((line,index) => container.append(pd.create('code').css({display:'block'}).text(line)));
																return container
															})(pd.create('pre'))
														)
														.popup('full','full',[{src:src,handler:download}]).show();
													});
													break;
												case 'application/json':
													fetch(new Request(this.objecturl(resp.file,file.filetype)))
													.then((resp) => resp.text())
													.then((text) => {
														pd.create('div').html(text.replace(/\n/g,'<br>')).popup('full','full',[{src:src,handler:download}]).show();
													});
													break;
												case 'application/pdf':
													pd.create('iframe').css({
														border:'none',
														height:'100%',
														outline:'none',
														width:'100%'
													})
													.attr('src',this.objecturl(resp.file,file.filetype)).popup('full','full',[{src:src,handler:download}]).show();
													break;
												case 'audio/mpeg':
												case 'audio/x-m4a':
													pd.create('audio').css({
														outline:'none'
													})
													.attr('controls','controls')
													.attr('src',this.objecturl(resp.file,file.filetype))
													.popup(null,null,[{src:src,handler:download}]).show();
													break;
												case 'image/bmp':
												case 'image/gif':
												case 'image/jpeg':
												case 'image/png':
													pd.create('img').css({
														maxHeight:'calc(100vh - 4em)',
														maxWidth:'calc(100vw - 2em)'
													}).attr('src',this.objecturl(resp.file,file.filetype)).popup(null,null,[{src:src,handler:download}]).show();
													break;
												case 'text/plain':
												case 'text/css':
													fetch(new Request(this.objecturl(resp.file,file.filetype)))
													.then((resp) => resp.text())
													.then((text) => {
														pd.create('div').html(text.replace(/\n/g,'<br>')).popup('full','full',[{src:src,handler:download}]).show();
													});
													break;
												case 'text/csv':
													fetch(new Request(this.objecturl(resp.file,file.filetype)))
													.then((resp) => resp.text())
													.then((text) => {
														var csv=text.parseCSV();
														if (csv.length!=0)
															((table) => {
																csv.each((cells,index) => {
																	table.append(
																		((row) => {
																			cells.each((cell,index) => row.append(pd.create('td').css({padding:'0.25em'}).html(cell.replace(/\n/g,'<br>'))));
																			return row;
																		})(pd.create('tr'))
																	);
																});
																return table;
															})(pd.create('table')).popup(null,'full',[{src:src,handler:download}]).show();
													});
													break;
												case 'video/mp4':
												case 'video/mpeg':
													pd.create('video').css({
														maxHeight:'calc(100vh - 4em)',
														maxWidth:'calc(100vw - 2em)',
														outline:'none'
													})
													.attr('controls','controls')
													.attr('src',this.objecturl(resp.file,file.filetype))
													.popup(null,null,[{src:src,handler:download}]).show();
													break;
												default:
													download();
													break;
											};
										}
										catch(e){pd.alert(e.message);}
									});
								};
								if (fieldinfo.required)
								{
									field.alert=(message) => {
										if (!field.elm('.pd-field-alert')) field.append(alert().addclass('pd-field-alert'));
										field.elm('.pd-field-alert').elm('span').html(message).parentNode.show();
									};
								}
								break;
							case 'lookup':
								((handler) => {
									field.elm('.pd-open').on('click',(e) => {
										if (field.elm('.pd-lookup-value').val()) pd.event.call(fieldinfo.app,'pd.edit.call',{recordid:field.elm('.pd-lookup-value').val()});
										else pd.event.call(fieldinfo.app,'pd.create.call',{activate:true});
									});
									field.elm('.pd-search').on('click',(e) => {
										handler(field.elm('.pd-lookup-search').val(),pd.extend({},fieldinfo));
									});
									field.elm('input').on('change',(e) => {
										if (e.currentTarget.val()) handler(e.currentTarget.val(),pd.extend({},fieldinfo));
										else field.lookup('').then(() => call('pd.change.'+fieldinfo.id));
									});
								})((search,fieldinfo) => {
									pd.event.call(fieldinfo.app,'pd.fields.call',{fields:{}})
									.then((param) => {
										((fields) => {
											var get=() => {
												if (Array.isArray(fieldinfo.picker))
												{
													fieldinfo.picker=((picker) => {
														var res={};
														picker.each((picker,index) => {
															if (picker in fields.external) res[picker]=pd.extend({},fields.external[picker]);
														});
														if (Object.keys(res).length==0)
															if (fieldinfo.search in fields.external) res[fieldinfo.search]=pd.extend({},fields.external[fieldinfo.search]);
														if (Object.keys(res).length==0) res['__id']={id:'__id',type:'id',caption:'id',required:false,nocaption:false};
														return res;
													})(fieldinfo.picker);
													field.recordpicker.show(fieldinfo,[],(record) => {
														field.lookup(record['__id'].value).then(() => call('pd.change.'+fieldinfo.id));
													});
												}
												else
												{
													field.recordpicker.show(fieldinfo,[],(record) => {
														field.lookup(record['__id'].value).then(() => call('pd.change.'+fieldinfo.id));
													});
												}
											};
											fieldinfo.query=((row) => {
												var res=[];
												res.push(((criterias,record) => {
													var res=[];
													criterias.each((criteria,index) => {
														if ((criteria.external in fields.external) && (criteria.internal in fields.internal))
															((value) => {
																switch (fields.internal[criteria.internal].type)
																{
																	case 'checkbox':
																	case 'creator':
																	case 'department':
																	case 'file':
																	case 'group':
																	case 'modifier':
																	case 'user':
																		if (value!=null)
																			if (fieldinfo.ignore && value.value.length==0) value=null;
																		break;
																	case 'id':
																	case 'lookup':
																	case 'number':
																		if (value!=null)
																			if (fieldinfo.ignore && !pd.isnumeric(value.value)) value=null;
																		break;
																	default:
																		if (value!=null)
																			if (fieldinfo.ignore && !value.value) value=null;
																		break;
																}
																if (value!=null)
																	res.push(pd.filter.query.create(fields.external[criteria.external],criteria.operator,pd.extend({type:fields.internal[criteria.internal].type},value)));
															})((() => {
																var res=null;
																if (!fields.internal[criteria.internal].tableid) res=record[fields.internal[criteria.internal].id];
																else
																{
																	if (fields.internal[criteria.internal].tableid==fieldinfo.tableid)
																		res=record[fields.internal[criteria.internal].tableid].value[row][fields.internal[criteria.internal].id];
																}
																return res;
															})());
													});
													return res.filter((item) => item).join(' and ');
												})(fieldinfo.criteria,pd.record.get(field.closest('[form-id=form_'+app.id+']'),app,true).record));
												res.push(fieldinfo.query);
												return res.filter((item) => item).join(' and ');
											})((field.closest('.pd-scope').hasAttribute('row-id'))?parseInt(field.closest('.pd-scope').attr('row-id')):0);
											if (search)
											{
												fieldinfo.query=(() => {
													var res=[];
													res.push(fieldinfo.query);
													res.push(fieldinfo.search+' like "'+search+'"');
													return res.filter((item) => item).join(' and ');
												})();
												pd.request(
													this.baseuri()+'/records.php',
													'GET',
													{},
													{
														app:fieldinfo.app,
														query:fieldinfo.query
													},
													true
												)
												.then((resp) => {
													if ('records' in resp)
													{
														if (resp.records.length==1) field.lookup(resp.records.first()['__id'].value).then(() => call('pd.change.'+fieldinfo.id));
														else get();
													}
												})
												.catch((error) => pd.alert(error.message));
											}
											else get();
										})({
											external:param.fields,
											internal:fieldinfos
										});
									});
								});
								field.recordpicker=new panda_recordpicker();
								field.lookup=(id,record) => {
									return new Promise((resolve,reject) => {
										((scope) => {
											if (id)
											{
												pd.request(
													this.baseuri()+'/records.php',
													'GET',
													{},
													{
														app:fieldinfo.app,
														id:id
													},
													true
												)
												.then((resp) => {
													if (resp.total!=0)
													{
														pd.record.set(scope,((fieldinfo.tableid)?app.fields[fieldinfo.tableid]:app),(() => {
															var res={};
															res[fieldinfo.id]={
																search:resp.record[fieldinfo.search].value,
																value:resp.record['__id'].value
															};
															for (var key in fieldinfo.mapping)
																if ((key in resp.record) && (fieldinfo.mapping[key] in fieldinfos))
																	res[fieldinfo.mapping[key]]=pd.extend((fieldinfos[fieldinfo.mapping[key]].type=='lookup')?{lookup:true}:{},{value:resp.record[key].value});
															return res;
														})());
														resolve();
													}
													else resolve();
												})
												.catch((error) => {
													pd.alert(error.message);
													resolve();
												});
											}
											else
											{
												pd.record.set(scope,((fieldinfo.tableid)?app.fields[fieldinfo.tableid]:app),(() => {
													var res={};
													res[fieldinfo.id]={
														search:'',
														value:''
													};
													for (var key in fieldinfo.mapping)
														if (fieldinfo.mapping[key] in fieldinfos)
														{
															switch (fieldinfos[fieldinfo.mapping[key]].type)
															{
																case 'checkbox':
																case 'department':
																case 'file':
																case 'group':
																case 'user':
																	res[fieldinfo.mapping[key]]={value:[]};
																	break;
																case 'lookup':
																	res[fieldinfo.mapping[key]]={lookup:true,value:''};
																	break;
																default:
																	res[fieldinfo.mapping[key]]={value:''};
																	break;
															}
														}
													if (record instanceof Object)
														for (var key in res)
															if (key in record) record[key]=pd.extend({},res[key]);
													return res;
												})());
												resolve();
											}
										})(field.closest('.pd-scope'));
									});
								};
								break;
							case 'postalcode':
								((handler) => {
									field.elm('.pd-search').on('click',(e) => {
										((postalcode) => {
											if (postalcode) handler(postalcode);
											else
											{
												((scope) => {
													pd.pickupaddress((() => {
														var res='';
														if (fieldinfo.mapping.prefecturename)
															if (scope.elm('[field-id="'+CSS.escape(fieldinfo.mapping.prefecturename)+'"]'))
																res=scope.elm('[field-id="'+CSS.escape(fieldinfo.mapping.prefecturename)+'"]').elm('.pd-field-value').elm('input').val();
														return res;
													})(),(() => {
														var res='';
														if (fieldinfo.mapping.cityname)
															if (scope.elm('[field-id="'+CSS.escape(fieldinfo.mapping.cityname)+'"]'))
																res=scope.elm('[field-id="'+CSS.escape(fieldinfo.mapping.cityname)+'"]').elm('.pd-field-value').elm('input').val();
														return res;
													})(),(resp) => {
														if (resp) field.set(resp).then(() => call('pd.change.'+fieldinfo.id));
													});
												})(field.closest('.pd-scope'));
											}
										})(field.elm('input').val().replace(/[^0-9]/g,''));
									});
									field.elm('input').on('change',(e) => {
										((postalcode) => {
											if (postalcode) handler(postalcode);
											else field.set({}).then(() => call('pd.change.'+fieldinfo.id));
										})(e.currentTarget.val().replace(/[^0-9]/g,''));
									});
								})((postalcode) => {
									pd.pickuppostal(postalcode,(resp) => {
										if (resp) field.set(resp).then(() => call('pd.change.'+fieldinfo.id));
										else pd.alert(pd.constants.common.message.notfound[pd.lang]);
									});
								});
								field.set=(record) => {
									return new Promise((resolve,reject) => {
										pd.record.set(field.closest('.pd-scope'),((fieldinfo.tableid)?app.fields[fieldinfo.tableid]:app),(() => {
											var res={};
											for (var key in fieldinfo.mapping)
												if (fieldinfo.mapping[key] in fieldinfos)
												{
													switch (key)
													{
														case 'address':
														case 'label':
															res[fieldinfo.mapping[key]]={value:(key in record)?record[key]:''};
															break;
														case 'prefecture':
														case 'city':
															res[fieldinfo.mapping[key]]={value:(key in record)?record[key].id:''};
															break;
														case 'prefecturename':
														case 'cityname':
														case 'streetname':
															res[fieldinfo.mapping[key]]={value:(key.replace(/name$/g,'') in record)?record[key.replace(/name$/g,'')].name:''};
															break;
													}
												}
											res[fieldinfo.id]={value:('postalcode' in record)?record['postalcode']:''};
											return res;
										})());
										if ((fieldinfo.mapping.address in fieldinfos)?fieldinfos[fieldinfo.mapping.address].type=='address':false)
										{
											((address) => {
												if (record.address)
												{
													pd.map.searchlocation(record.address,(lat,lng) => {
														((resp) => {
															address.set(resp).then(() => resolve());
														})({lat:lat,lng:lng});
													});
												}
												else address.set({}).then(() => resolve());
											})(field.closest('.pd-scope').elm('[field-id="'+CSS.escape(fieldinfo.mapping.address)+'"]').elm('.pd-field-value'));
										}
										else resolve();
									});
								};
								break;
							case 'radio':
								field.elms('[data-name='+fieldinfo.id+']').each((element,index) => {
									element.closest('label').on('click',(e) => {
										((value) => {
											field.elms('[data-name='+fieldinfo.id+']').each((element,index) => element.checked=(value==element.val()));
											call('pd.change.'+fieldinfo.id);
										})(element.val());
										e.stopPropagation();
										e.preventDefault();
									});
								});
								break;
						}
						field.elms('input,select,textarea').each((element,index) => {
							switch (fieldinfo.type)
							{
								case 'address':
								case 'color':
								case 'department':
								case 'file':
								case 'group':
								case 'lookup':
								case 'postalcode':
								case 'radio':
								case 'user':
									break;
								default:
									element.on('change',(e) => call('pd.change.'+fieldinfo.id));
									break;
							}
						});
					})(field.elm('.pd-field-value'),fieldinfos[field.attr('field-id')]);
				return field;
			},
			create:(fieldinfo) => {
				var time=(container) => {
					container
					.append(
						pd.create('div').addclass('pd-dropdown pd-hour').append(
							pd.create('select').assignoption((() => {
								var res=[{option:{value:''}}];
								(24).each((index) => res.push({option:{value:index.toString().lpad('0',2)}}));
								return res;
							})(),'option','option')
						)
					)
					.append(
						pd.create('div').addclass('pd-dropdown pd-minute').append(
							pd.create('select').assignoption((() => {
								var res=[{option:{value:''}}];
								(60).each((index) => res.push({option:{value:index.toString().lpad('0',2)}}));
								return res;
							})(),'option','option')
						)
					);
				};
				if (!('type' in fieldinfo)) throw new Error('You shoud setup [type] in field information');
				return ((field) => {
					field.append(pd.create('span').addclass('pd-field-caption').html(fieldinfo.caption));
					if (fieldinfo.nocaption) field.elm('.pd-field-caption').addclass('pd-hidden');
					field.append(
						((field) => {
							switch (fieldinfo.type)
							{
								case 'address':
									field
									.append(pd.create('input').attr('type','text').attr('data-type',fieldinfo.type))
									.append(pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search'))
									.append(pd.create('button').addclass('pd-icon pd-icon-open pd-open'));
									break;
								case 'checkbox':
									fieldinfo.options.each((option,index) => {
										field
										.append(
											pd.create('label')
											.append(pd.create('input').attr('type','checkbox').attr('data-type',fieldinfo.type).val(option.option.value))
											.append(pd.create('span').html(option.option.value))
										);
									});
									break;
								case 'color':
									field
									.append(pd.create('input').attr('type','text').attr('data-type',fieldinfo.type))
									.append(pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search'));
									break;
								case 'date':
									field
									.append(pd.create('input').attr('type','text').attr('data-type',fieldinfo.type))
									.append(pd.create('button').addclass('pd-icon pd-icon-date pd-search'));
									break;
								case 'datetime':
									time(
										field
										.append(pd.create('input').attr('type','text').attr('data-type','date'))
										.append(pd.create('button').addclass('pd-icon pd-icon-date pd-search'))
									);
									break;
								case 'department':
								case 'group':
								case 'user':
									field
									.append(pd.create('input').attr('type','hidden').attr('data-type',fieldinfo.type))
									.append(pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search'));
									break;
								case 'dropdown':
									field.append(pd.create('select').assignoption(fieldinfo.options,'option','option'));
									break;
								case 'file':
									field
									.append(pd.create('input').attr('type','hidden').attr('data-type',fieldinfo.type))
									.append(pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search'));
									break;
								case 'lookup':
									field
									.append(pd.create('input').addclass('pd-lookup-search').attr('type','text').attr('data-type',fieldinfo.type))
									.append(pd.create('input').addclass('pd-lookup-value').attr('type','hidden').attr('data-type',fieldinfo.type))
									.append(pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search'))
									.append(pd.create('button').addclass('pd-icon pd-icon-open pd-open'));
									break;
								case 'number':
									field.append(
										((res) => {
											if (fieldinfo.decimals) res.attr('data-decimals',fieldinfo.decimals);
											return res.attr('data-type',((fieldinfo.demiliter)?'number':'nondemiliternumber'));
										})(pd.create('input').attr('type','text'))
									);
									break;
								case 'postalcode':
									field
									.append(pd.create('input').attr('type','text').attr('data-type',fieldinfo.type))
									.append(pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search'));
									break;
								case 'radio':
									fieldinfo.options.each((option,index) => {
										field
										.append(
											(() => {
												var res=pd.create('label')
												.append(pd.create('input').attr('type','radio').attr('data-name',fieldinfo.id).attr('data-type',fieldinfo.type).val(option.option.value))
												.append(pd.create('span').html(option.option.value));
												if (index==0) res.elm('input').checked=true;
												return res;
											})()
										);
									});
									break;
								case 'spacer':
									field.html(fieldinfo.contents);
									break;
								case 'text':
									switch (fieldinfo.format)
									{
										case 'password':
											field.append(pd.create('input').attr('type','password').attr('data-type',fieldinfo.type));
											break;
										default:
											field.append(pd.create('input').attr('type','text').attr('data-type',(fieldinfo.format)?fieldinfo.format:'text'));
											break;
									}
									break;
								case 'textarea':
									field.append(((res) => {
										if (fieldinfo.lines) res.css({height:'calc('+(parseFloat(fieldinfo.lines)*1.5).toString()+'em + 2px)'});
										return res;
									})(pd.create('textarea')));
									break;
								case 'time':
									time(field);
									break;
								default:
									if (!['id','autonumber','creator','createdtime','modifier','modifiedtime'].includes(fieldinfo.type))
										field.append(pd.create('input').attr('type','text').attr('data-type',fieldinfo.type));
									break;
							}
							return (fieldinfo.type!='spacer')?field.append(pd.create('span').addclass('pd-guide')):field;
						})(pd.create('div').addclass('pd-field-value pd-'+fieldinfo.type))
					);
					switch (fieldinfo.type)
					{
						case 'autonumber':
						case 'creator':
						case 'createdtime':
						case 'department':
						case 'file':
						case 'group':
						case 'id':
						case 'modifier':
						case 'modifiedtime':
						case 'user':
							field.elm('.pd-guide').addclass('pd-fixed');
							break;
					}
					if (fieldinfo.required)
					{
						switch (fieldinfo.type)
						{
							case 'autonumber':
							case 'checkbox':
							case 'creator':
							case 'createdtime':
							case 'department':
							case 'file':
							case 'group':
							case 'id':
							case 'modifier':
							case 'modifiedtime':
							case 'user':
								break;
							default:
								field.elms('input,select,textarea').each((element,index) => element.attr('required','required'));
								break;
						}
					}
					if (fieldinfo.placeholder) field.elms('input,select,textarea').each((element,index) => element.attr('placeholder',fieldinfo.placeholder));
					return field;
				})(pd.create('div').addclass('pd-field').attr('field-id',fieldinfo.id));
			},
			embed:(fields) => {
				if (!('__id' in fields))
				{
					fields['__id']={
						id:'__id',
						type:'id',
						caption:'id',
						required:false,
						nocaption:false
					};
				}
				if (!('__creator' in fields))
				{
					fields['__creator']={
						id:'__creator',
						type:'creator',
						caption:'creator',
						required:false,
						nocaption:false
					};
				}
				if (!('__createdtime' in fields))
				{
					fields['__createdtime']={
						id:'__createdtime',
						type:'createdtime',
						caption:'createdtime',
						required:false,
						nocaption:false
					};
				}
				if (!('__modifier' in fields))
				{
					fields['__modifier']={
						id:'__modifier',
						type:'modifier',
						caption:'modifier',
						required:false,
						nocaption:false
					};
				}
				if (!('__modifiedtime' in fields))
				{
					fields['__modifiedtime']={
						id:'__modifiedtime',
						type:'modifiedtime',
						caption:'modifiedtime',
						required:false,
						nocaption:false
					};
				}
				return fields;
			},
			parallelize:(fields) => {
				return ((fields) => {
					var res={};
					for (var key in fields)
						((fieldinfo) => {
							switch (fieldinfo.type)
							{
								case 'table':
									var tableid=fieldinfo.id;
									for (var subkey in fieldinfo.fields)
									{
										fieldinfo.fields[subkey]=pd.extend({
											tableid:tableid
										},fieldinfo.fields[subkey]);
										res[fieldinfo.fields[subkey].id]=fieldinfo.fields[subkey];
									}
									break;
								default:
									fieldinfo=pd.extend({
										tableid:''
									},fieldinfo);
									res[fieldinfo.id]=fieldinfo;
									break;
							}
						})(fields[key]);
					return res;
				})(pd.extend({},fields));
			},
			typing:(sender,receiver,isfilter=false) => {
				var res=false;
				if (receiver.type=='text')
				{
					if (receiver.format=='text')
						switch (sender.type)
						{
								case 'address':
								case 'autonumber':
								case 'color':
								case 'createdtime':
								case 'date':
								case 'datetime':
								case 'dropdown':
								case 'modifiedtime':
								case 'postalcode':
								case 'radio':
								case 'text':
								case 'time':
									res=true;
									break;
								case 'id':
								case 'number':
									res=!isfilter;
									break;
						}
					if (receiver.type==sender.type)
						if (receiver.format==sender.format) res=true;
				}
				if (receiver.type=='lookup')
					switch (sender.type)
					{
						case 'address':
						case 'autonumber':
						case 'color':
						case 'date':
						case 'datetime':
						case 'dropdown':
						case 'postalcode':
						case 'radio':
						case 'text':
						case 'time':
							res=isfilter;
							break;
						case 'id':
						case 'number':
							res=true;
							break;
						case 'lookup':
							res=(receiver.app==sender.app);
							break;
					}
				if (!res)
					switch (sender.type)
					{
						case 'address':
						case 'checkbox':
						case 'color':
						case 'date':
						case 'department':
						case 'file':
						case 'group':
						case 'postalcode':
						case 'textarea':
						case 'time':
							res=(receiver.type==sender.type);
							break;
						case 'autonumber':
							res=(isfilter)?(receiver.type==sender.type):false;
							break;
						case 'creator':
						case 'modifier':
						case 'user':
							res=(isfilter)?['creator','modifier','user'].includes(receiver.type):(receiver.type=='user');
							break;
						case 'createdtime':
						case 'datetime':
						case 'modifiedtime':
							res=(isfilter)?['createdtime','datetime','modifiedtime'].includes(receiver.type):(receiver.type=='datetime');
							break;
						case 'dropdown':
						case 'radio':
							res=['dropdown','radio'].includes(receiver.type);
							break;
						case 'id':
						case 'lookup':
						case 'number':
							res=(isfilter)?['id','number'].includes(receiver.type):(receiver.type=='number');
							break;
						case 'text':
							res=(isfilter)?['address','autonumber','dropdown','postalcode','radio','textarea'].includes(receiver.type):['address','textarea'].includes(receiver.type);
							break;
					}
				return res;
			}
		};
		this.form={
			create:(container,app) => {
				var createrow=(fields) => {
					return ((res) => {
						fields.each((field,index) => {
							((field,fieldinfo) => {
								if (fieldinfo.id in app.styles) field.css({width:app.styles[fieldinfo.id].width});
								res.append(field);
							})(this.field.activate(this.field.create(app.fields[field]),app),app.fields[field]);
						});
						return res;
					})(pd.create('div').addclass('pd-row'));
				};
				app.layout.each((layout,index) => {
					switch (layout.type)
					{
						case 'row':
							container.append(createrow(layout.fields));
							break;
						case 'box':
							container.append(
								((res,rows) => {
									rows.each((row,index) => res.elm('.pd-box-container').append(createrow(row.fields)));
									return res;
								})(this.box.create(app.id,layout.caption).attr('field-id',layout.id),layout.rows)
							);
							break;
						case 'table':
							if (!app.fields[layout.id].nocaption)
							{
								container.append(
									pd.create('div').addclass('pd-row').append(
										pd.create('span').addclass('pd-table-caption').html(app.fields[layout.id].caption)
									)
								);
							}
							container.append(
								pd.create('div').addclass('pd-row').append(
									this.table.activate(this.table.create(app.fields[layout.id],true),app)
								)
							);
							for (var key in app.fields[layout.id].fields)
								if (key in app.styles)
									container.elm('[field-id="'+CSS.escape(layout.id)+'"]').template.elm('[field-id="'+CSS.escape(key)+'"]').css({width:app.styles[key].width});
							break;
					}
				});
				/* setup to readonly field */
				for (var key in app.fields)
					((fieldinfo) => {
						if (fieldinfo.type=='address')
						{
							for (var key in fieldinfo.mapping)
								if (fieldinfo.mapping[key])
									if (container.elm('[field-id="'+CSS.escape(fieldinfo.mapping[key])+'"]')) container.elm('[field-id="'+CSS.escape(fieldinfo.mapping[key])+'"]').addclass('pd-readonly');
						}
					})(app.fields[key]);
				/* setup to validation method */
				container.addclass('pd-scope').attr('form-id','form_'+app.id)
				.append(pd.create('input').attr('type','hidden').attr('data-type','id'))
				.append(pd.create('input').attr('type','hidden').attr('data-type','autonumber'))
				.append(pd.create('input').attr('type','hidden').attr('data-type','creator'))
				.append(pd.create('input').attr('type','hidden').attr('data-type','createdtime'))
				.append(pd.create('input').attr('type','hidden').attr('data-type','modifier'))
				.append(pd.create('input').attr('type','hidden').attr('data-type','modifiedtime'))
				.elms('input,select,textarea').each((element,index) => element.initialize());
				/* setup to focus method */
				container.focus=(field) => {
					var elements=(() => {
						var res=[];
						if (field)
						{
							if (container.elm('[field-id="'+CSS.escape(field)+'"]'))
								res=container.elm('[field-id="'+CSS.escape(field)+'"]').elms('input[type=text],input[type=password],select,textarea');
						}
						else res=container.elms('input[type=text],input[type=password],select,textarea');
						return res;
					})();
					if (elements.length!=0) elements.first().focus();
				};
				return container;
			}
		};
		this.gantt={
			create:() => {
				return ((table) => {
					const resizeObserver=new ResizeObserver((entries) => {
						var rect=(target) => {
							var res=new DOMRect(0,0,0,0);
							if (target)
							{
								((rect) => {
									res=new DOMRect(target.offsetLeft,target.offsetTop,rect.width,rect.height);
								})(target.getBoundingClientRect());
							}
							return {
								top:res.top,
								bottom:res.bottom,
								left:res.left,
								right:res.right,
								height:res.height,
								width:res.width
							};
						};
						((rows) => {
							rows.each((row,index) => {
								((cells,matrix) => {
									cells.each((cell,index) => {
										((pos) => {
											var set=(task) => {
												if (pos.row<matrix.length)
												{
													((row) => {
														if (row[pos.column].entry!=pos.column)
														{
															((height) => {
																if (height>0)
																{
																	task.css({marginTop:(parseFloat(task.css('margin-top'))+height).toString()+'px'});
																	pos.row++;
																	set(task);
																}
																else
																{
																	task.rect=rect(task);
																	((origin) => {
																		matrix.slice(pos.row+1).some((item,index) => {
																			if (item[pos.column].rect.top>task.rect.bottom-1) return true;
																			else
																			{
																				if (item[pos.column].rect.top)
																				{
																					if (!task.previousElementSibling) task.css({marginTop:item[pos.column].rect.bottom.toString()+'px'});
																					else
																					{
																						((rect) => {
																							task.css({marginTop:(item[pos.column].rect.bottom-rect.bottom).toString()+'px'});
																						})(rect(task.previousElementSibling));
																					}
																					task.rect=rect(task);
																					pos.row=origin+index+1;
																				}
																			}
																		});
																	})(pos.row+1);
																	if (pos.row>matrix.length-1)
																	{
																		matrix.push(
																			new Array(cells.length).fill().map((item,index) => {
																				return (index<pos.column || index>pos.column+task.taskspan-1)?{entry:-1,rect:rect()}:{entry:pos.column,rect:rect(task)};
																			})
																		);
																		pos.row=matrix.length;
																	}
																	else
																	{
																		matrix[pos.row]=row.map((item,index) => {
																			return (index<pos.column || index>pos.column+task.taskspan-1)?item:{entry:pos.column,rect:pd.extend({},task.rect)};
																		});
																	}
																}
															})(row.reduce((result,current,index) => {
																if (index>pos.column-1 && index<pos.column+task.taskspan)
																	if (result<current.rect.height) result=current.rect.height;
																return result;
															},0));
														}
														else
														{
															pos.row++;
															set(task);
														}
													})(matrix[pos.row]);
												}
												else
												{
													matrix.push(
														new Array(cells.length).fill().map((item,index) => {
															return (index<pos.column || index>pos.column+task.taskspan-1)?{entry:-1,rect:rect()}:{entry:pos.column,rect:rect(task)};
														})
													);
													pos.row=matrix.length;
												}
											};
											pd.children(cell).each((task,index) => set(task));
										})({column:index,row:0});
									});
								})(row.elms('.pd-matrix-row-cell-task'),[]);
							});
						})((() => {
							var res=[];
							for (var entry of entries)
								((row) => {
									if (!res.includes(row)) res.push(row);
								})(entry.target.closest('tr'));
							return res;
						})());
					});
					table
					.append(pd.create('thead').append(pd.create('tr').addclass('pd-matrix-head')))
					.append(pd.create('tbody').append(pd.create('tr').addclass('pd-matrix-row')))
					.spread(null,null,false).show=(source,view,callback) => {
						((head,template,fields) => {
							var set=(index,records,row,parsed) => {
								if (index<source.rows.length)
								{
									for (var key in records)
									{
										parsed[source.rows[index].field]={value:records[key].caption};
										row=((res) => {
											row.elm('[field-id="'+CSS.escape(source.rows[index].field)+'"]').closest('td').attr('rowspan',res.span);
											((id) => {
												(res.span-1).each((index) => {
													row=row.nextElementSibling;
													row.elm('[field-id="'+CSS.escape(id)+'"]').closest('td').hide();
												});
											})(source.rows[index].field);
											return res.row;
										})(set(index+1,records[key].rows,row,parsed));
										if (Object.keys(records).last()!=key) row=table.insertrow(row);
									}
									return {row:row,span:Object.keys(records).length};
								}
								else
								{
									for (var key in records)
										((cell,records) => {
											records.each((record,index) => {
												((task) => {
													task.taskspan=record.__taskspan.value;
													cell.append(task.css({'width':(parseInt(view.fields.column.width)*record.__taskspan.value).toString()+'px'}));
													resizeObserver.observe(task);
													callback(task,record);
												})(pd.create('div'))
											});
										})(row.elm('.'+key),records[key]);
									pd.record.set(row,{fields:fields},parsed);
									return {row:row,span:1};
								}
							};
							resizeObserver.disconnect();
							table.clearrows();
							source.fields.each((field,index) => {
								head.append(
									pd.create('th').addclass('pd-matrix-head-cell')
									.append(pd.create('span').addclass('pd-matrix-head-caption').html(field.caption))
								);
								template.append(
									((cell) => {
										if (index<source.rows.length) cell.append(pd.ui.field.create(field).addclass('pd-readonly pd-matrix-row-cell'));
										else
										{
											((width,order) => {
												cell.addclass('pd-matrix-row-cell-task '+field.id).css({'max-width':width+'px','width':width+'px','z-index':order});
											})(view.fields.column.width.toString(),(source.fields.length-source.rows.length-index+1).toString());
										}
										return cell;
									})(pd.create('td'))
								);
								fields[field.id]=field;
							});
							if (!Array.isArray(source.records)) set(0,source.records,table.addrow(),{});
						})(table.css({display:'table'}).elm('thead tr').empty(),table.template.empty(),{});
					};
					return table;
				})(pd.create('table').addclass('pd-matrix'));
			}
		};
		this.panel={
			create:(caption,buttons) => {
				var res=pd.create('div').addclass('pd-panel')
				.append(
					((res) => {
						res.append(
							pd.create('span').addclass('pd-panel-caption-label').html(caption)
						);
						if (Array.isArray(buttons)) buttons.each((button,index) => res.append(pd.create('button').addclass(button.icon).on('click',(e) => button.handler(e))));
						return res;
					})(pd.create('span').addclass('pd-panel-caption'))
				)
				.append(
					pd.create('div').addclass('pd-panel-container')
					.append(
						pd.create('div').addclass('pd-panel-contents')
					)
				);
				return res;
			}
		};
		this.table={
			activate:(table,app) => {
				((tableid) => {
					table.elms('[sort-id]').each((element,index) => {
						element.on('click',(e) => {
							((container,fieldinfo,order) => {
								((record) => {
									record[tableid].value.sort((a,b) => {
										var values={
											a:null,
											b:null
										};
										switch (fieldinfo.type)
										{
											case 'checkbox':
												values.a='';
												values.b='';
												if (Array.isArray(a[fieldinfo.id].value))
													if (a[fieldinfo.id].value.length!=0) values.a=a[fieldinfo.id].value.first();
												if (Array.isArray(b[fieldinfo.id].value))
													if (b[fieldinfo.id].value.length!=0) values.b=b[fieldinfo.id].value.first();
												break;
											case 'creator':
											case 'department':
											case 'group':
											case 'modifier':
											case 'user':
												values.a=0;
												values.b=0;
												if (Array.isArray(a[fieldinfo.id].value))
													if (a[fieldinfo.id].value.length!=0) values.a=a[fieldinfo.id].value.first();
												if (Array.isArray(b[fieldinfo.id].value))
													if (b[fieldinfo.id].value.length!=0) values.b=b[fieldinfo.id].value.first();
												break;
											case 'file':
												values.a='';
												values.b='';
												if (Array.isArray(a[fieldinfo.id].value))
													if (a[fieldinfo.id].value.length!=0) values.a=a[fieldinfo.id].value.first().name;
												if (Array.isArray(b[fieldinfo.id].value))
													if (b[fieldinfo.id].value.length!=0) values.b=b[fieldinfo.id].value.first().name;
												break;
											case 'lookup':
												values.a=a[fieldinfo.id].search;
												values.b=b[fieldinfo.id].search;
												break;
											default:
												values.a=a[fieldinfo.id].value;
												values.b=b[fieldinfo.id].value;
												break;
										}
										if (values.a<values.b) return (order=='desc')?1:-1;
										if (values.a>values.b) return (order=='desc')?-1:1;
										return 0;
									});
									pd.event.call(app.id,'pd.row.sort.'+tableid,{
										container:table,
										record:record,
										fieldid:fieldinfo.id
									})
									.then((param) => {
										if (!param.error)
										{
											pd.event.call(app.id,'pd.action.call',{
												record:param.record,
												workplace:(container.closest('.pd-view'))?'view':'record'
											})
											.then((param) => {
												pd.record.set(container,app,param.record);
												((event) => {
													container.attr('unsaved','unsaved').dispatchEvent(event);
												})(new Event('change'));
												table.elms('[sort-id]').each((element,index) => element.attr('sort-order',(element.attr('sort-id')==fieldinfo.id)?order:''));
											});
										}
									});
								})(pd.record.get(container,app,true).record);
							})(table.closest('[form-id=form_'+app.id+']'),app.fields[tableid].fields[element.attr('sort-id')],(element.attr('sort-order')=='asc')?'desc':'asc')
						});
					});
				})(table.attr('field-id'));
				return table.spread((row,index) => {
					((container) => {
						/* event */
						row.elm('.pd-table-row-add').on('click',(e) => {
							table.insertrow(row);
							pd.event.call(app.id,'pd.row.add.'+table.attr('field-id'),{
								container:table,
								record:pd.record.get(container,app,true).record,
								rowindex:parseInt(row.attr('row-id'))+1
							})
							.then((param) => {
								if (!param.error)
								{
									pd.event.call(app.id,'pd.action.call',{
										record:param.record,
										workplace:(container.closest('.pd-view'))?'view':'record'
									})
									.then((param) => {
										pd.record.set(container,app,param.record);
										((event) => {
											container.attr('unsaved','unsaved').dispatchEvent(event);
										})(new Event('change'));
									});
								}
								else table.delrow(row);
							});
						});
						row.elm('.pd-table-row-copy').on('click',(e) => {
							table.insertrow(row);
							pd.event.call(app.id,'pd.row.copy.'+table.attr('field-id'),{
								container:table,
								record:((record,index) => {
									record[table.attr('field-id')].value[index+1]=pd.extend({},record[table.attr('field-id')].value[index]);
									return record;
								})(pd.record.get(container,app,true).record,parseInt(row.attr('row-id'))),
								rowindex:parseInt(row.attr('row-id'))+1
							})
							.then((param) => {
								if (!param.error)
								{
									pd.event.call(app.id,'pd.action.call',{
										record:param.record,
										workplace:(container.closest('.pd-view'))?'view':'record'
									})
									.then((param) => {
										pd.record.set(container,app,param.record);
										((event) => {
											container.attr('unsaved','unsaved').dispatchEvent(event);
										})(new Event('change'));
									});
								}
								else table.delrow(row);
							});
						});
						row.elm('.pd-table-row-del').on('click',(e) => {
							pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
								pd.event.call(app.id,'pd.row.del.'+table.attr('field-id'),{
									container:table,
									record:pd.record.get(container,app,true).record,
									rowindex:parseInt(row.attr('row-id'))
								})
								.then((param) => {
									if (!param.error)
									{
										table.delrow(row);
										pd.event.call(app.id,'pd.action.call',{
											record:pd.record.get(container,app,true).record,
											workplace:(container.closest('.pd-view'))?'view':'record'
										})
										.then((param) => {
											pd.record.set(container,app,param.record);
											((event) => {
												container.attr('unsaved','unsaved').dispatchEvent(event);
											})(new Event('change'));
										});
									}
								});
							});
						});
						/* activation */
						row.elms('.pd-field').each((element,index) => this.field.activate(element,app));
						/* setup row index */
						table.tr.each((element,index) => element.attr('row-id',index));
					})(table.closest('[form-id=form_'+app.id+']'));
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
					else
					{
						/* setup row index */
						table.tr.each((element,index) => element.attr('row-id',index));
					}
				},false);
			},
			create:(table,isform,isview) => {
				return ((res) => {
					if (!isview) res.append(pd.create('thead').append(pd.create('tr')));
					res.append(pd.create('tbody').append(pd.create('tr').addclass('pd-scope')));
					for (var key in table.fields)
						((fieldinfo) => {
							if (!isview)
							{
								res.elm('thead tr').append(((cell) => {
									if (isform) cell.css({cursor:'pointer'}).attr('sort-id',fieldinfo.id).attr('sort-order','');
									return cell;
								})(pd.create('th').append(pd.create('span').html(fieldinfo.caption))));
							}
							res.elm('tbody tr').append(pd.create('td').append(this.field.create(((fieldinfo) => {
								fieldinfo.nocaption=true;
								return fieldinfo;
							})(pd.extend({},fieldinfo)))));
						})(table.fields[key]);
					if (!isview) res.elm('thead tr').append(pd.create('th').addclass('pd-table-button'+((!isform)?'':' pd-table-button-extension')));
					res.elm('tbody tr').append(
						pd.create('td').addclass('pd-table-button'+((!isform)?'':' pd-table-button-extension'))
						.append(pd.create('button').addclass('pd-icon pd-icon-add pd-table-row-add'))
						.append(pd.create('button').addclass('pd-icon pd-icon-copy pd-table-row-copy').css({display:((!isform)?'none':'inline-block')}))
						.append(pd.create('button').addclass('pd-icon pd-icon-del pd-table-row-del'))
					);
					/* setup to readonly field */
					for (var key in table.fields)
						((fieldinfo) => {
							if (fieldinfo.type=='address')
							{
								for (var key in fieldinfo.mapping)
									if (fieldinfo.mapping[key])
										if (res.elm('[field-id="'+CSS.escape(fieldinfo.mapping[key])+'"]')) res.elm('[field-id="'+CSS.escape(fieldinfo.mapping[key])+'"]').addclass('pd-readonly');
							}
						})(table.fields[key]);
					return res.attr('field-id',table.id);
				})(pd.create('table').addclass('pd-table'));
			}
		};
		this.view={
			create:(container,app,viewid) => {
				var style={
					key:() => {
						return 'view_'+app.id+'_'+viewid+'_'+(location.protocol+'//'+location.host+location.pathname).replace(/\/$/g,'').replace(/http(s)?:\/\//g,'').replace(/\//g,'_');
					},
					set:(initialize) => {
						var key=style.key();
						var css='[view-id=view_'+app.id+'_'+viewid+'] .pd-guide{min-width:auto !important;}';
						pd.elm('[view-id=view_'+app.id+'_'+viewid+']').elms('.pd-view-head-resizer').each((element,index) => {
							var cell=element.closest('.pd-view-head-cell');
							((id) => {
								var width=(() => {
									var res=235;
									if (initialize)
									{
										if (id in app.styles)
											if ('width' in app.styles[id])
												((width) => {
													if (pd.isnumeric(width)) res=parseFloat(width);
												})(app.styles[id].width.replace(/px$/g,''));
									}
									else res=(cell.outerwidth(false) || res);
									return res;
								})();
								pd.elm('[view-id=view_'+app.id+'_'+viewid+']').elms('[field-id="'+CSS.escape(id)+'"]').each((element,index) => {
									if (width<element.outerwidth(false)) width=element.outerwidth(false);
								});
								css+='[view-id=view_'+app.id+'_'+viewid+'] [column-id="'+CSS.escape(id)+'"]{max-width:'+width+'px;width:'+width+'px;}';
								css+='[view-id=view_'+app.id+'_'+viewid+'] [field-id="'+CSS.escape(id)+'"]{width:'+width+'px;}';
							})(cell.attr('column-id'));
						});
						/* embed stylesheet */
						if (pd.elm('.pdstyle_'+key))
							pd.elm('head').removeChild(pd.elm('.pdstyle_'+key));
						pd.elm('head').append(
							pd.create('style')
							.addclass('pdstyle_'+key)
							.attr('media','screen')
							.attr('type','text/css')
							.text(css)
						);
						localStorage.setItem(key,css);
					}
				};
				return container.append(
					((res,app,view) => {
						var span=0;
						var resize=(e,id) =>{
							var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
							var keep={
								cell:e.currentTarget.closest('.pd-view-head-cell'),
								position:pointer.pageX,
								width:e.currentTarget.closest('.pd-view-head-cell').outerwidth(false)
							};
							var handler={
								move:(e) => {
									var adjust=false;
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									var width=keep.width+pointer.pageX-keep.position;
									keep.cell.css({'max-width':width.toString()+'px','width':width.toString()+'px'});
									res.elms('[field-id="'+CSS.escape(id)+'"]').each((element,index) => element.css({'width':width.toString()+'px'}));
									res.elms('[field-id="'+CSS.escape(id)+'"]').each((element,index) => {
										if (width<element.outerwidth(false))
										{
											width=element.outerwidth(false);
											adjust=true;
										}
									});
									if (adjust) keep.cell.css({'max-width':width.toString()+'px','width':width.toString()+'px'});
									e.stopPropagation();
									e.preventDefault();
								},
								end:(e) => {
									style.set();
									pd.elm('body').removeclass('pd-resizing');
									window.off('mousemove,touchmove',handler.move);
									window.off('mouseup,touchend',handler.end);
									e.stopPropagation();
									e.preventDefault();
								}
							};
							pd.elm('body').addclass('pd-resizing');
							window.on('mousemove,touchmove',handler.move);
							window.on('mouseup,touchend',handler.end);
							e.stopPropagation();
							e.preventDefault();
						};
						res
						.append(pd.create('thead').append(pd.create('tr').addclass('pd-view-head')))
						.append(pd.create('tbody').append(pd.create('tr').addclass('pd-view-row')));
						res.elm('thead tr').append(pd.create('th').addclass('pd-view-head-cell pd-view-button pd-view-guide'+((['linkage','list'].includes(view.type))?' pd-readonly':'')));
						res.elm('tbody tr').append(
							pd.create('td').addclass('pd-view-button pd-view-guide'+((['linkage','list'].includes(view.type))?' pd-readonly':''))
							.append(pd.create('button').addclass('pd-icon pd-icon-edit pd-view-row-edit'))
							.append(pd.create('button').addclass('pd-icon pd-icon-copy pd-view-row-copy'))
						);
						((fields) => {
							fields.concat(Object.keys(app.fields).shape((item) => (!fields.includes(item))?item:PD_THROW)).each((field,index) => {
								((fieldinfo,unuse) => {
									if (!unuse && ('multiuse' in fieldinfo)) unuse=!fieldinfo.multiuse;
									switch (fieldinfo.type)
									{
										case 'table':
											for (var key in fieldinfo.fields)
											{
												res.elm('thead tr').append(
													((cell,fieldinfo) => {
														if (!unuse) span++;
														return cell.addclass('pd-view-head-cell'+((unuse)?' pd-unuse':'')).attr('column-id',fieldinfo.id)
														.append(pd.create('span').addclass('pd-view-head-caption').html(fieldinfo.caption))
														.append(pd.create('span').addclass('pd-view-head-guide').on('click',(e) => {
															pd.event.call(app.id,'pd.view.guide.call',{id:fieldinfo.id});
															e.stopPropagation();
															e.preventDefault();
														}))
														.append(pd.create('span').addclass('pd-view-head-resizer').on('mousedown,touchstart',(e) => resize(e,fieldinfo.id)));
													})(pd.create('th'),fieldinfo.fields[key])
												);
												fieldinfo.fields[key].nocaption=true;
											}
											if (!['linkage','list'].includes(view.type))
											{
												if (!unuse) span++;
												res.elm('thead tr').append(pd.create('th').addclass('pd-view-head-cell pd-view-button pd-view-button-extension'+((unuse)?' pd-unuse':'')));
											}
											break;
										default:
											res.elm('thead tr').append(
												((cell) => {
													if (!unuse) span++;
													return cell.addclass('pd-view-head-cell'+((unuse)?' pd-unuse':'')).attr('column-id',fieldinfo.id)
													.append(pd.create('span').addclass('pd-view-head-caption').html(fieldinfo.caption))
													.append(pd.create('span').addclass('pd-view-head-guide').on('click',(e) => {
														pd.event.call(app.id,'pd.view.guide.call',{id:fieldinfo.id});
														e.stopPropagation();
														e.preventDefault();
													}))
													.append(pd.create('span').addclass('pd-view-head-resizer').on('mousedown,touchstart',(e) => resize(e,fieldinfo.id)));
												})(pd.create('th'))
											);
											fieldinfo.nocaption=true;
											break;
									}
								})(app.fields[field],(view.fields.length!=0)?!view.fields.includes(field):false);
							});
							res.elm('tbody tr').append(
								((cell) => {
									fields.concat(Object.keys(app.fields).shape((item) => (!fields.includes(item))?item:PD_THROW)).each((field,index) => {
										((fieldinfo,unuse) => {
											if (!unuse && ('multiuse' in fieldinfo)) unuse=!fieldinfo.multiuse;
											switch (fieldinfo.type)
											{
												case 'table':
													cell.append(
														pd.create('div').addclass('pd-view-row-cell'+((unuse)?' pd-unuse':'')).append(
															this.table.create(fieldinfo,true,true)
														)
													);
													break;
												default:
													cell.append(this.field.create(fieldinfo).addclass('pd-view-row-cell'+((unuse)?' pd-unuse':'')));
													break;
											}
										})(app.fields[field],(view.fields.length!=0)?!view.fields.includes(field):false);
									});
									return cell
									.append(pd.create('input').attr('type','hidden').attr('data-type','id'))
									.append(pd.create('input').attr('type','hidden').attr('data-type','autonumber'))
									.append(pd.create('input').attr('type','hidden').attr('data-type','creator'))
									.append(pd.create('input').attr('type','hidden').attr('data-type','createdtime'))
									.append(pd.create('input').attr('type','hidden').attr('data-type','modifier'))
									.append(pd.create('input').attr('type','hidden').attr('data-type','modifiedtime'));
								})(pd.create('td').addclass('pd-scope').attr('form-id','form_'+app.id).attr('colspan',span.toString()))
							);
						})((view.fields.length!=0)?view.fields:Object.keys(app.fields));
						res.elm('thead tr').append(pd.create('th').addclass('pd-view-head-cell pd-view-button'+((view.type=='linkage')?' pd-hidden':((view.type=='list')?' pd-readonly':''))));
						res.elm('tbody tr').append(
							pd.create('td').addclass('pd-view-button'+((view.type=='linkage')?' pd-hidden':((view.type=='list')?' pd-readonly':'')))
							.append(pd.create('button').addclass('pd-icon pd-icon-add pd-view-row-add'))
							.append(pd.create('button').addclass('pd-icon pd-icon-del pd-view-row-del'))
						);
						/* setup to readonly field */
						if (['linkage','list'].includes(view.type))
						{
							res.elms('.pd-field').each((element,index) => element.addclass('pd-readonly'));
							res.elms('.pd-table-button').each((element,index) => element.addclass('pd-readonly'));
						}
						else
						{
							for (var key in app.fields)
								((fieldinfo) => {
									if (fieldinfo.type=='address')
									{
										for (var key in fieldinfo.mapping)
											if (fieldinfo.mapping[key])
												if (res.elm('[field-id="'+CSS.escape(fieldinfo.mapping[key])+'"]')) res.elm('[field-id="'+CSS.escape(fieldinfo.mapping[key])+'"]').addclass('pd-readonly');
									}
								})(app.fields[key]);
						}
						/* setup spread */
						return res.spread((row,index) => {
							/* event */
							row.elm('[form-id=form_'+app.id+']').on('change',(e) => {
								row.addclass('pd-unsaved');
							});
							row.elm('.pd-view-row-add').on('click',(e) => {
								((row) => {
									pd.event.call(app.id,'pd.create.load',{
										container:row.elm('[form-id=form_'+app.id+']'),
										record:pd.record.get(row.elm('[form-id=form_'+app.id+']'),app,true).record,
										viewid:viewid
									})
									.then((param) => {
										if (!param.error)
										{
											pd.event.call(app.id,'pd.action.call',{
												record:param.record,
												workplace:'view'
											})
											.then((param) => {
												pd.record.set(row.elm('[form-id=form_'+app.id+']').attr('unsaved','unsaved'),app,param.record).then((record) => {
													pd.event.call(app.id,'pd.create.load.complete',{container:row.elm('[form-id=form_'+app.id+']'),viewid:viewid});
												});
												((event) => {
													row.elm('[form-id=form_'+app.id+']').dispatchEvent(event);
												})(new Event('change'));
											});
										}
										else res.delrow(row);
									});
								})(res.insertrow(row));
							});
							row.elm('.pd-view-row-del').on('click',(e) => {
								((recordid) => {
									if (recordid)
									{
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											pd.event.call(app.id,'pd.delete.submit',{
												container:row.elm('[form-id=form_'+app.id+']'),
												record:pd.record.get(row.elm('[form-id=form_'+app.id+']'),app,true).record,
												viewid:viewid
											})
											.then((param) => {
												if (!param.error)
													pd.event.call(app.id,'pd.delete.call',{
														recordid:recordid,
														viewid:viewid
													})
													.then((param) => {
														res.delrow(row);
													});
											});
										});
									}
									else res.delrow(row);
								})(row.elm('[data-type=id]').val());
							});
							row.elm('.pd-view-row-edit').on('click',(e) => {
								((recordid) => {
									pd.event.call(app.id,'pd.edit.call',(recordid)?{recordid:recordid}:{record:pd.record.get(row.elm('[form-id=form_'+app.id+']'),app,true).record});
								})((view.type=='linkage')?row.elm('[data-type=id]').val():'');
							});
							row.elm('.pd-view-row-copy').on('click',(e) => {
								pd.confirm(pd.constants.common.message.confirm.copy[pd.lang],() => {
									((record,row) => {
										pd.event.call(app.id,'pd.create.load',{
											container:row.elm('[form-id=form_'+app.id+']'),
											copy:true,
											record:((res) => {
												res['__id'].value='';
												res['__autonumber'].value='';
												return res;
											})(record),
											viewid:viewid
										})
										.then((param) => {
											if (!param.error)
											{
												pd.event.call(app.id,'pd.action.call',{
													record:param.record,
													workplace:'view'
												})
												.then((param) => {
													pd.record.set(row.elm('[form-id=form_'+app.id+']').attr('unsaved','unsaved'),app,param.record).then((record) => {
														pd.event.call(app.id,'pd.create.load.complete',{container:row.elm('[form-id=form_'+app.id+']'),copy:true,viewid:viewid});
													});
													((event) => {
														row.elm('[form-id=form_'+app.id+']').dispatchEvent(event);
													})(new Event('change'));
												});
											}
											else res.delrow(row);
										});
									})(pd.record.get(row.elm('[form-id=form_'+app.id+']'),app,true).record,res.insertrow(row))
								});
							});
							/* activation */
							row.elms('.pd-field').each((element,index) => {
								if (element.closest('.pd-scope').hasAttribute('form-id')) this.field.activate(element,app);
							});
							row.elms('.pd-table').each((element,index) => {
								this.table.activate(element,app).clearrows();
								element.addrow();
							});
						},(table,index) => {},false);
					})(pd.create('table').addclass('pd-view').attr('view-id','view_'+app.id+'_'+viewid),pd.extend({},app),pd.extend({},app).views.filter((item) => item.id==viewid).first())
				)
				.on('show',(e) => {
					var key=style.key();
					if (!pd.elm('.pdstyle_'+key))
					{
						if (localStorage.getItem(key))
						{
							pd.elm('head').append(
								pd.create('style')
								.addclass('pdstyle_'+key)
								.attr('media','screen')
								.attr('type','text/css')
								.text(localStorage.getItem(key))
							);
							style.set();
						}
						else
						{
							if (pd.elm('[view-id=view_'+app.id+'_'+viewid+']').elm('tbody').elms('tr').length!=0)
								style.set(true);
						}
					}
				});
			}
		};
	}
	/* baseuri */
	baseuri(uri){
		if (typeof uri!=='undefined')
		{
			this.uri=uri.replace(/\/$/g,'');
			return this;
		}
		else return this.uri;
	}
	/* create objecturl */
	objecturl(data,type){
		var datas=atob(data);
		var buffer=new Uint8Array(datas.length);
		var url=window.URL || window.webkitURL;
		datas.length.each((index) => buffer[index]=datas.charCodeAt(index));
		return url.createObjectURL(new Blob([buffer.buffer],{type:type}));
	}
};
pd.event=new panda_event();
pd.ready((pd) => {
	pd.filter=new panda_filter();
	pd.formula=new panda_formula();
	pd.record=new panda_record();
	pd.ui=new panda_user_interface();
});
/*
Message definition by language
*/
pd.constants=pd.extend({
	common:{
		caption:{
			sort:{
				asc:{
					en:'asc',
					ja:'昇順'
				},
				desc:{
					en:'desc',
					ja:'降順'
				}
			}
		},
		message:{
			confirm:{
				copy:{
					en:'Are you sure on copy?',
					ja:'コピーしてもよろしいですか？'
				},
				delete:{
					en:'Are you sure on delete?',
					ja:'削除してもよろしいですか？'
				}
			},
			invalid:{
				chart:{
					en:'The charting library was not found',
					ja:'チャート作成ライブラリが見つかりませんでした'
				},
				record:{
					en:'There is an error in the input data',
					ja:'入力内容に誤りがあります'
				},
				upload:{
					en:'The maximum size of files that can be uploaded is %value%',
					ja:'アップロード可能なファイルの最大サイズは%value%です'
				}
			}
		}
	},
	filter:{
		caption:{
			filter:{
				en:'Filter',
				ja:'条件'
			},
			sort:{
				en:'Sort by',
				ja:'並び順'
			}
		},
		pattern:{
			from:{
				today:{
					en:'from today',
					ja:'今日から'
				},
				thisweek:{
					en:'from thisweek',
					ja:'今週から'
				},
				thismonth:{
					en:'from thismonth',
					ja:'今月から'
				},
				thisyear:{
					en:'from thisyear',
					ja:'今年から'
				}
			},
			manually:{
				en:'manually',
				ja:'日付を指定'
			},
			today:{
				en:'today',
				ja:'今日'
			}
		},
		operator:{
			equal:{
				en:'equal',
				ja:'等しい'
			},
			notequal:{
				en:'not equal',
				ja:'等しくない'
			},
			greater:{
				en:'greater than',
				ja:'より後',
				equal:{
					en:'greater than or equal',
					ja:'以降'
				}
			},
			in:{
				en:'any of',
				ja:'いずれかを含む'
			},
			notin:{
				en:'not any of',
				ja:'いずれも含まない'
			},
			like:{
				en:'like',
				ja:'キーワードを含む'
			},
			notlike:{
				en:'not like',
				ja:'キーワードを含まない'
			},
			less:{
				en:'less than',
				ja:'より前',
				equal:{
					en:'less than or equal',
					ja:'以前'
				}
			},
			match:{
				en:'matches id',
				ja:'idが一致'
			},
			notmatch:{
				en:'not matches id',
				ja:'idが一致しない'
			}
		}
	},
	picker:{
		caption:{
			departments:{
				en:'Department',
				ja:'組織'
			},
			groups:{
				en:'Group',
				ja:'グループ'
			},
			users:{
				en:'User',
				ja:'ユーザー'
			}
		}
	}
},pd.constants);
