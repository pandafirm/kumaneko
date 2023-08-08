/*
* FileName "panda.kumaneko.js"
* Version: 1.3.7
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
"use strict";
class panda_kumaneko{
	/* constructor */
	constructor(){}
	/* build kumaneko */
	build(baseuri,setting){
		/* setup properties */
		this.bootups=[];
		this.apps={};
		this.config={};
		this.dashboard={};
		this.project={
			key:((url) => url.hostname)(new URL(baseuri)),
			name:'',
			scripts:[]
		};
		this.queues={
			app:null,
			sort:null
		};
		/* initialize */
		pd.elm('body').addclass(pd.theme);
		pd.ui.baseuri(baseuri);
		/* functions */
		this.app={
			action:(app,record,workplace) => {
				return (app in this.apps)?this.apps[app].actions.value(record,workplace):record;
			},
			bootup:(param) => {
				if (pd.isnumeric(param.app))
					if (param.app in this.apps)
					{
						if (pd.isnumeric(param.record))
						{
							if (param.record=='0') pd.event.call(param.app,'pd.create.call',{activate:true});
							else pd.event.call(param.app,'pd.edit.call',{recordid:param.record});
						}
						else
						{
							if (pd.isnumeric(param.view))
							{
								if (param.view in this.apps[param.app].view.ui)
									pd.event.call(param.app,'pd.app.activate',{viewid:param.view});
							}
							else pd.event.call(param.app,'pd.app.activate',{viewid:'0'});
						}
					}
			},
			fields:(app) => {
				return (app in this.apps)?this.apps[app].app.fields:{};
			}
		};
		this.record={
			get:(app,container) => {
				return (app in this.apps)?pd.record.get(container,this.apps[app].app,true).record:{};
			},
			set:(app,container,record) => {
				if (app in this.apps) pd.record.set(container,this.apps[app].app,this.app.action(app,record,(container.closest('pd-view'))?'view':'record'));
			}
		};
		this.tab={
			activate:(tab) => {
				tab.container.scrollIntoView();
			},
			setup:(target) => {
				((container,scroller) => {
					((buttons) => {
						var observer={
							mutation:null,
							resize:null
						};
						var adjust=(coord=0) => {
							if (container.scrollWidth>container.clientWidth)
							{
								if (container.scrollLeft+coord>0) buttons.prev.removeattr('disabled');
								else buttons.prev.attr('disabled','disabled');
								if (container.scrollLeft+coord<container.scrollWidth-container.clientWidth) buttons.next.removeattr('disabled');
								else buttons.next.attr('disabled','disabled');
								scroller.removeclass('pd-hidden');
							}
							else scroller.addclass('pd-hidden');
						};
						observer.mutation=new MutationObserver(() => adjust());
						observer.mutation.disconnect();
						observer.mutation.observe(container,{childList:true});
						observer.resize=new ResizeObserver(() => adjust());
						observer.resize.disconnect();
						observer.resize.observe(container);
						scroller
						.append(buttons.prev.on('click',(e) => {
							((coord) => {
								adjust(coord);
								container.scrollBy({left:coord});
							})(Math.floor(container.clientWidth/-2));
						}))
						.append(buttons.next.on('click',(e) => {
							((coord) => {
								adjust(coord);
								container.scrollBy({left:coord});
							})(Math.ceil(container.clientWidth/2));
						}));
					})({
						prev:pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-left'),
						next:pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-right')
					});
				})(target.elm('.pd-kumaneko-tab'),target.elm('.pd-kumaneko-tab-scroller'));
				return target;
			}
		};
		this.users={
			login:() => {
				return ((res) => {
					if (this.hasOwnProperty('setting'))
						res=pd.extend({
							account:{value:''},
							name:{value:''},
							pwd:{value:''},
							authority:{value:''},
							available:{value:''},
							__creator:{value:['']},
							__createdtime:{value:''},
							__modifier:{value:[]},
							__modifiedtime:{value:''},
							__autonumber:{value:''}
						},res);
					return res;
				})(pd.extend({},pd.operator));
			}
		};
		this.view={
			query:(app,view) => {
				var res='';
				if (app in this.apps)
				{
					if (this.hasOwnProperty('setting')) res=this.apps[app].app.views.reduce((result,current) => (current.id==view)?(current.query??''):result,'');
					else
					{
						if (view in this.apps[app].view.ui) res=this.apps[app].view.ui[view].query??'';
					}
				}
				return res;
			},
			order:(app,view) => {
				var res='';
				if (app in this.apps)
				{
					if (this.hasOwnProperty('setting')) res=this.apps[app].app.views.reduce((result,current) => (current.id==view)?(current.sort??''):result,'');
					else
					{
						if (view in this.apps[app].view.ui) res=this.apps[app].view.ui[view].sort??'';
					}
				}
				return res;
			}
		};
		try
		{
			var auth=() => {
				var dialog=new pd.modules.auth();
				if (sessionStorage.getItem(this.project.key+'_loginaccount'))
				{
					pd.operator={account:{value:sessionStorage.getItem(this.project.key+'_loginaccount')},pwd:{value:sessionStorage.getItem(this.project.key+'_loginpwd')}};
					pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'users',query:(() => {
						return 'account = "'+pd.operator.account.value+'" and pwd = "'+pd.operator.pwd.value+'" and available = "available"';
					})()})
					.then((resp) => {
						var records=resp.records;
						if (records.length!=0)
						{
							pd.operator=records.first();
							pd.filter.record.load().then((config) => load(config));
						}
						else dialog.show();
					})
					.catch((error) => pd.alert(error.message,() => dialog.show()));
				}
				else dialog.show();
				/* event */
				pd.event.on('0','pd.auth.submit',(e) => {
					pd.operator={account:{value:e.record.account.value},pwd:{value:e.record.pwd.value}};
					pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'users',query:(() => {
						return 'account = "'+pd.operator.account.value+'" and pwd = "'+pd.operator.pwd.value+'" and available = "available"';
					})()})
					.then((resp) => {
						var records=resp.records;
						if (records.length!=0)
						{
							dialog.hide();
							pd.operator=this.session(records.first());
							pd.filter.record.load().then((config) => load(config));
						}
						else pd.alert(pd.constants.common.message.invalid.auth[pd.lang],() => dialog.show());
					})
					.catch((error) => pd.alert(error.message,() => dialog.show()));
				});
			};
			var build=() => {
				((apps) => {
					/* build container */
					pd.elm('body')
					.append(
						((res) => {
							res
							.append(pd.create('span').addclass('pd-kumaneko-header-title').html('kumaneko for '+this.project.name))
							.append(
								((res) => {
									res
									.append(pd.create('button').addclass('pd-icon pd-icon-language'))
									.append(
										pd.create('div').addclass('pd-dropdown pd-kumaneko-header-menu-lang')
										.append(
											((element) => {
												element.assignoption([
													{id:{value:'en'}},
													{id:{value:'ja'}}
												],'id','id')
												.on('change',(e) => {
													localStorage.setItem('kumaneko_lang',element.val());
													pd.alert(pd.constants.common.message.confirm.reboot[pd.lang],() => {
														window.location.reload(true);
													});
												})
												return element.val(pd.lang);
											})(pd.create('select'))
										)
									)
									.append(pd.create('button').addclass('pd-icon pd-icon-theme'))
									.append(
										pd.create('div').addclass('pd-dropdown pd-kumaneko-header-menu-theme')
										.append(
											((element) => {
												element.assignoption([
													{id:{value:'dark'}},
													{id:{value:'light'}}
												],'id','id')
												.on('change',(e) => {
													localStorage.setItem('kumaneko_theme',element.val());
													pd.alert(pd.constants.common.message.confirm.reboot[pd.lang],() => {
														window.location.reload(true);
													});
												})
												return element.val(pd.theme);
											})(pd.create('select'))
										)
									);
									if (pd.operator.authority.value=='Administrator')
										res.append(
											pd.create('button').addclass('pd-icon pd-icon-setting').on('click',(e) => {
												pd.event.call(this.config.apps.system.project.id,'pd.edit.call',{recordid:'1'});
											})
										);
									return res;
								})(pd.create('span').addclass('pd-kumaneko-header-menu'))
							);
							return res;
						})(pd.create('header').addclass('pd-kumaneko-header'))
					)
					.append(
						pd.create('main').addclass('pd-kumaneko-main')
						.append(
							pd.create('nav').addclass('pd-kumaneko-nav')
							.append(pd.create('div').addclass('pd-kumaneko-nav-main').attr('id','pd-kumaneko-space-nav'))
							.append(
								((res) => {
									if (['Administrator','Manager'].includes(pd.operator.authority.value))
										res.append(
											pd.create('button').addclass('pd-icon pd-icon-new pd-kumaneko-nav-icon').on('click',(e) => {
												this.appbuilder.show({});
												e.stopPropagation();
												e.preventDefault();
											})
										);
									return res;
								})(pd.create('div').addclass('pd-kumaneko-nav-footer pd-kumaneko-border-top pd-kumaneko-inset-top'))
							)
						)
						.append(
							this.tab.setup(
								pd.create('div').addclass('pd-kumaneko-block')
								.append(pd.create('div').addclass('pd-hidden pd-kumaneko-tab-scroller pd-kumaneko-border-left pd-kumaneko-inset-left'))
								.append(pd.create('section').addclass('pd-kumaneko-tab pd-kumaneko-border-left').attr('id','pd-kumaneko-space-tab'))
								.append(pd.create('section').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left').attr('id','pd-kumaneko-space-contents'))
							)
						)
					);
					/* build appbuilder */
					this.appbuilder=new pd.modules.builder.app();
					/* build appmanager */
					this.appmanager=new pd.modules.manager.app();
					/* build dashboardmanager */
					this.dashboardmanager=new pd.modules.manager.dashboard();
					/* build importmanager */
					this.importmanager=new pd.modules.manager.import();
					/* build notificationmanager */
					this.notificationmanager=new pd.modules.manager.notification();
					/* event */
					apps.map((item) => item.id).each((id,index) => {
						pd.event.on(id,'pd.app.activate',(e) => {
							this.dashboard.hide();
							for (var key in this.apps)
								((app) => {
									if (key==id)
									{
										var bootup=id;
										if ('viewid' in e)
										{
											app.view.show(e.viewid);
											bootup+='_'+e.viewid;
										}
										else app.record.show();
										if (!this.bootups.includes(bootup)) this.bootups.push(bootup);
									}
									else
									{
										app.view.hide();
										app.record.hide();
									}
								})(this.apps[key]);
						});
						pd.event.on(id,'pd.app.deactivate',(e) => {
							((index) => {
								var bootup='';
								var param={};
								if (index==0)
								{
									if (this.bootups.length==1)
									{
										for (var key in this.apps)
											((app) => {
												app.view.hide();
												app.record.hide();
											})(this.apps[key]);
										e.active=false;
									}
									else
									{
										param=((bootups) => {
											bootup=bootups.first();
											return (bootups.length==1)?{}:{viewid:bootups[1]};
										})(this.bootups[1].split('_'));
									}
								}
								else
								{
									param=((bootups) => {
										bootup=bootups.first();
										return (bootups.length==1)?{}:{viewid:bootups[1]};
									})(this.bootups[index-1].split('_'));
								}
								this.bootups.splice(index,1);
								if (e.active) pd.event.call(bootup,'pd.app.activate',param);
								else
								{
									if (this.bootups.length==0) this.dashboard.show();
								}
							})(this.bootups.indexOf(id+(('viewid' in e)?'_'+e.viewid:'')));
						});
						pd.event.on(id,'pd.app.deleted',(e) => {
							pd.request(pd.ui.baseuri()+'/config.php','GET',{},{})
							.then((resp) => {
								try
								{
									this.config=((config) => {
										if (this.queues.app)
										{
											this.queues.app.each((app,index) => {
												if (app.id!=id) config.apps.user[app.id]=app;
											});
											this.queues.app=null;
										}
										if (this.queues.sort)
										{
											config.apps.sort=this.queues.sort;
											this.queues.sort=null;
										}
										if (id)
										{
											delete config.apps.user[id];
											config.apps.sort=config.apps.sort.filter((item) => item!=id);
										}
										return config;
									})(resp.file);
									pd.request(pd.ui.baseuri()+'/config.php','PUT',{},{config:this.config,app:id,type:'del'})
									.then((resp) => {
										if (resp.result=='ok')
										{
											var verify=() => {
												pd.request(pd.ui.baseuri()+'/config.php','GET',{},{verify:'verify'},true)
												.then((resp) => {
													if (resp.result=='ok')
													{
														pd.loadend();
														pd.alert(pd.constants.common.message.confirm.reboot[pd.lang],() => {
															window.location.reload(true);
														});
														pd.event.call('0','pd.queue.notify',{source:'config'});
													}
													else setTimeout(() => verify(),1000);
												})
												.catch((error) => pd.alert(error.message));
											}
											pd.loadstart();
											setTimeout(() => verify(),1000);
										}
										else pd.alert(pd.constants.common.message.invalid.config.updating[pd.lang]);
									})
									.catch((error) => pd.alert(error.message));
								}
								catch(e){pd.alert(e.message);}
							})
							.catch((error) => pd.alert(error.message));
						});
					});
					pd.event.on('0','pd.app.altered',(e) => {
						((app) => {
							pd.request(pd.ui.baseuri()+'/config.php','GET',{},{})
							.then((resp) => {
								try
								{
									this.config=((config,id) => {
										if (this.queues.app)
										{
											((id) => {
												this.queues.app.each((app,index) => {
													if (app.id!=id) config.apps.user[app.id]=app;
												});
												this.queues.app=null;
											})(app.id);
										}
										if (this.queues.sort)
										{
											config.apps.sort=this.queues.sort;
											this.queues.sort=null;
										}
										if (!app.id)
										{
											config.increments.app++;
											app.id=config.increments.app.toString();
											config.apps.sort.push(app.id);
										}
										config.apps.user[app.id]=app;
										return config;
									})(resp.file,app.id);
									pd.request(pd.ui.baseuri()+'/config.php','PUT',{},{config:this.config,app:app.id,type:'upd'})
									.then((resp) => {
										if (resp.result=='ok')
										{
											var verify=() => {
												pd.request(pd.ui.baseuri()+'/config.php','GET',{},{verify:'verify'},true)
												.then((resp) => {
													if (resp.result=='ok')
													{
														pd.loadend();
														pd.alert(pd.constants.common.message.confirm.reboot[pd.lang],() => {
															window.location.reload(true);
														});
														pd.event.call('0','pd.queue.notify',{source:'config'});
													}
													else setTimeout(() => verify(),1000);
												})
												.catch((error) => pd.alert(error.message));
											}
											pd.loadstart();
											setTimeout(() => verify(),1000);
										}
										else pd.alert(pd.constants.common.message.invalid.config.updating[pd.lang]);
									})
									.catch((error) => pd.alert(error.message));
								}
								catch(e){pd.alert(e.message);}
							})
							.catch((error) => pd.alert(error.message));
						})(e.app);
					});
					pd.event.on('0','pd.apps.altered',(e) => {
						((apps,sort) => {
							pd.request(pd.ui.baseuri()+'/config.php','GET',{},{})
							.then((resp) => {
								try
								{
									this.config=resp.file;
									this.config.apps.user=apps;
									this.config.apps.sort=sort;
									pd.request(pd.ui.baseuri()+'/config.php','PUT',{},{config:this.config,type:'mgt'})
									.then((resp) => {
										if (resp.result=='ok')
										{
											pd.alert(pd.constants.common.message.confirm.reboot[pd.lang],() => {
												window.location.reload(true);
											});
											pd.event.call('0','pd.queue.notify',{source:'config'});
										}
										else pd.alert(pd.constants.common.message.invalid.config.updating[pd.lang]);
									})
									.catch((error) => pd.alert(error.message));
								}
								catch(e){pd.alert(e.message);}
							})
							.catch((error) => pd.alert(error.message));
						})(e.apps,e.sort);
					});
					pd.event.on('0','pd.dashboard.activate',(e) => {
						for (var key in this.apps)
							((app) => {
								app.view.hide();
								app.record.hide();
							})(this.apps[key]);
						this.dashboard.show();
					});
					pd.event.on('0','pd.dashboard.altered',(e) => {
						((dashboard) => {
							pd.request(pd.ui.baseuri()+'/config.php','GET',{},{})
							.then((resp) => {
								try
								{
									this.config=resp.file;
									this.config.dashboard=dashboard;
									pd.request(pd.ui.baseuri()+'/config.php','PUT',{},{config:this.config,type:'mgt'})
									.then((resp) => {
										if (resp.result=='ok')
										{
											pd.alert(pd.constants.common.message.confirm.reboot[pd.lang],() => {
												window.location.reload(true);
											});
											pd.event.call('0','pd.queue.notify',{source:'config'});
										}
										else pd.alert(pd.constants.common.message.invalid.config.updating[pd.lang]);
									})
									.catch((error) => pd.alert(error.message));
								}
								catch(e){pd.alert(e.message);}
							})
							.catch((error) => pd.alert(error.message));
						})(e.dashboard);
					});
					pd.event.on('0','pd.queue.app',(e) => {
						switch (e.action)
						{
							case 'add':
								if (!Array.isArray(this.queues.app)) this.queues.app=[];
								this.queues.app.push(e.app);
								break;
							case 'clear':
								this.queues.app=null;
								break;
							case 'delete':
								this.queues.app=this.queues.app.filter((item) => item.id!=e.app);
								break;
						}
						return e;
					});
					pd.event.on('0','pd.queue.dashboard',(e) => {
						if (e.app+'_'+e.view in this.dashboard.panels) this.apps[e.app].view.load(e.view,null,null,true).catch(() => {});
						return e;
					});
					pd.event.on('0','pd.queue.linkage',(e) => {
						for (var key in this.config.apps.user)
							if (this.bootups.includes(key))
								((app,linkages) => {
									linkages.each((linkage,index) => this.apps[app.id].queues.linkage.push(linkage.id));
								})(this.config.apps.user[key],this.config.apps.user[key].linkages.filter((item) => item.app==e.app));
						return e;
					});
					pd.event.on('0','pd.queue.notify',(e) => {
						if (this.notificationmanager.enabled)
						{
							sessionStorage.setItem(this.project.key+'_notifier','yes');
							this.notificationmanager.push('{\\"source\\":\\"'+e.source+'\\",\\"id\\":\\"'+(('id' in e)?e.id:'')+'\\"}');
						}
						return e;
					});
					pd.event.on('0','pd.queue.notify.pushed',(e) => {
						if (this.notificationmanager.enabled)
							if (e.data)
							{
								var resp=JSON.parse(e.data);
								switch (resp.source)
								{
									case 'app':
										if (sessionStorage.getItem(this.project.key+'_notifier')) sessionStorage.removeItem(this.project.key+'_notifier');
										else
										{
											if (resp.id in this.apps) this.apps[resp.id].notify(true);
										}
										switch (resp.id)
										{
											case 'departments':
											case 'groups':
												pd.filter.record.load();
												break;
											case 'users':
												pd.filter.record.load().then(() => {
													((user) => {
														if (user.length!=0) pd.operator=this.session(user.first());
													})(pd.filter.record.user.filter((item) => item['__id'].value==pd.operator.__id.value));
												});
												break;
										}
										break;
									case 'config':
										if (sessionStorage.getItem(this.project.key+'_notifier')) sessionStorage.removeItem(this.project.key+'_notifier');
										else
										{
											pd.confirm(pd.constants.common.message.confirm.forced[pd.lang],() => {
												window.location.reload(true);
											});
										}
										break;
								}
							}
						return e;
					});
					pd.event.on('0','pd.queue.sort',(e) => {
						this.queues.sort=e.sort;
						return e;
					});
					pd.event.on(this.config.apps.system.project.id,'pd.record.build',(e) => {
						e.header
						.append(
							pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.common.caption.button.management.dashboard[pd.lang]).on('click',(e) => {
								pd.kumaneko.dashboardmanager.show();
							})
						)
						.append(
							pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.common.caption.button.management.apps[pd.lang]).on('click',(e) => {
								pd.kumaneko.appmanager.show();
							})
						)
						.append(
							pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.common.caption.button.management.users[pd.lang]).on('click',(e) => {
								pd.event.call(this.config.apps.system.users.id,'pd.app.activate',{viewid:'0'});
							})
						)
						.append(
							pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.common.caption.button.management.departments[pd.lang]).on('click',(e) => {
								pd.event.call(this.config.apps.system.departments.id,'pd.app.activate',{viewid:'0'});
							})
						)
						.append(
							pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.common.caption.button.management.groups[pd.lang]).on('click',(e) => {
								pd.event.call(this.config.apps.system.groups.id,'pd.app.activate',{viewid:'0'});
							})
						)
						.append(
							pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.common.caption.button.management.storage[pd.lang]).on('click',(e) => {
								pd.confirm(pd.constants.common.message.confirm.cleanup[pd.lang],() => {
									pd.request(pd.ui.baseuri()+'/cleanup.php','POST',{},{})
									.then((resp) => {
										if (resp.result=='ok')
										{
											var verify=() => {
												pd.request(pd.ui.baseuri()+'/cleanup.php','GET',{},{verify:'verify'},true)
												.then((resp) => {
													if (resp.result=='ok')
													{
														pd.loadend();
														pd.alert(pd.constants.common.message.finished.cleanup[pd.lang]);
													}
													else setTimeout(() => verify(),1000);
												})
												.catch((error) => pd.alert(error.message));
											}
											pd.loadstart();
											setTimeout(() => verify(),1000);
										}
										else pd.alert(pd.constants.common.message.invalid.cleanup.processing[pd.lang]);
									})
									.catch((error) => pd.alert(error.message));
								});
							})
						)
						.append(
							pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.common.caption.button.about[pd.lang]).on('click',(e) => {
								pd.request(pd.ui.baseuri()+'/version.php','GET',{},{})
								.then((resp) => {
									pd.create('div')
									.append(
										pd.create('div').addclass('pd-kumaneko-about')
										.append(pd.create('p').addclass('pd-kumaneko-about-title').html('kumaneko'))
										.append(
											((container) => {
												container.append(pd.create('p').html('version:'+resp.my));
												if (resp.latest) container.append(pd.create('p').html(pd.constants.common.prompt.update[pd.lang].replace(/%version%/g,resp.latest)));
												return container.append(
													pd.create('p').html('Copyright '+new Date().format('Y')+' Pandafirm LLC. All rights reserved.')
												);
											})(pd.create('p').addclass('pd-kumaneko-about-overview'))
										)
										.append(
											pd.create('p').addclass('pd-kumaneko-about-buttons')
											.append(
												pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.common.caption.button.update[pd.lang]).on('click',(e) => {
													pd.confirm(pd.constants.common.message.confirm.update[pd.lang],() => {
														pd.request(pd.ui.baseuri()+'/version.php','POST',{},{})
														.then((resp) => {
															pd.alert(pd.constants.common.message.confirm.reboot[pd.lang],() => {
																window.location.reload(true);
															});
														})
														.catch((error) => pd.alert(error.message));
													});
												})
											)
										)
									)
									.popup('600','250').show();
								})
								.catch((error) => pd.alert(error.message));
							})
						);
					});
					pd.event.on(this.config.apps.system.project.id,'pd.edit.submit',(e) => {
						((smtps) => {
							if (smtps.length!=0)
							{
								if (smtps.length!=Array.from(new Set(smtps.map((item) => item.smtp_mail.value))).length)
								{
									pd.alert(pd.constants.project.message.invalid.duplicates[pd.lang]);
									e.error=true;
								}
								else
								{
									smtps.each((smtp,index) => {
										if (!smtp.smtp_host.value)
										{
											pd.alert(pd.constants.project.message.invalid.host[pd.lang]);
											e.error=true;
										}
										if (!smtp.smtp_port.value)
										{
											pd.alert(pd.constants.project.message.invalid.port[pd.lang]);
											e.error=true;
										}
										if (!smtp.smtp_user.value)
										{
											pd.alert(pd.constants.project.message.invalid.user[pd.lang]);
											e.error=true;
										}
										if (!smtp.smtp_pwd.value)
										{
											pd.alert(pd.constants.project.message.invalid.pwd[pd.lang]);
											e.error=true;
										}
										if (!smtp.smtp_secure.value)
										{
											pd.alert(pd.constants.project.message.invalid.secure[pd.lang]);
											e.error=true;
										}
									});
								}
							}
						})(e.record.smtp.value.filter((item) => item.smtp_mail.value));
						return e;
					});
					pd.event.on(this.config.apps.system.users.id,'pd.change.account',(e) => {
						return new Promise((resolve,reject) => {
							e.record.account.value=e.record.account.value.replace(/["']+/g,'');
							pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'users',query:(() => {
								return 'account = "'+e.record.account.value+'" and __id != "'+e.record.__id.value+'"';
							})()})
							.then((resp) => {
								var records=resp.records;
								if (records.length!=0)
								{
									pd.alert(pd.constants.users.message.invalid.account[pd.lang],() => {
										e.record.account.value='';
										resolve(e);
									})
								}
								else resolve(e);
							})
							.catch((error) => pd.alert(error.message));
						});
					});
					pd.event.on(this.config.apps.system.users.id,'pd.change.pwd',(e) => {
						e.record.pwd.value=e.record.pwd.value.replace(/["']+/g,'');
						return e;
					});
					pd.event.on(this.config.apps.system.users.id,'pd.edit.submit.success',(e) => {
						if (e.record['__id'].value==pd.operator.__id.value) pd.operator=this.session(e.record);
						return e;
					});
					pd.event.on(this.config.apps.system.users.id,'pd.view.submit.success',(e) => {
						((user) => {
							if (user.length!=0) pd.operator=this.session(user.first());
						})(e.records.put.filter((item) => item['__id'].value==pd.operator.__id.value));
						return e;
					});
					/* embed scripts */
					embed(0,apps,() => {
						((contents,tab,nav) => {
							/* build applications */
							this.sort(this.config.apps.user,this.config.apps.sort).each((app,index) => {
								this.apps[app.id]=new pd.modules.app(app,contents,tab,nav);
								if (this.permit(app.permissions)=='denied') pd.elm('[nav-id=nav_'+app.id+']').hide();
								/* event */
								pd.event.on(app.id,'pd.view.query.add',(e) => {
									if (pd.operator.authority.value=='Guest') e.query=((e.query)?'('+e.query+') and ':'')+'__creator in ("'+pd.operator.__id.value+'")';
									return e;
								});
							});
							for (var key in this.config.apps.system)
								((app) => {
									this.apps[app.id]=new pd.modules.app(app,contents,tab,null,(key=='project'));
								})(this.config.apps.system[key]);
							/* build dashboard */
							this.dashboard=new pd.modules.dashboard(this.config.dashboard.frames.reduce((result,current) => {
								current.panels=current.panels.reduce((result,current) => {
									if (this.permit(this.config.apps.user[current.app].permissions)!='denied')
										result.push(((app) => {
											current.config={
												app:app,
												view:app.views.filter((item) => item.id==current.view).first()
											}
											switch (current.config.view.type)
											{
												case 'calendar':
													current.calendar=new panda_calendar(true);
													break;
												case 'crosstab':
													current.crosstab=pd.ui.chart.create(current.config.view.type);
													break;
												case 'gantt':
													current.gantt=pd.ui.gantt.create();
													break;
												case 'timeseries':
													current.timeseries=pd.ui.chart.create(current.config.view.type);
													break;
												case 'kanban':
													current.kanban=pd.ui.kanban.create();
													break;
												case 'map':
													current.map=new panda_map();
													break;
												default:
													pd.event.on(app.id,'pd.edit.call',(e) => pd.event.call(current.app,'pd.edit.call',e));
													break;
											}
											return current;
										})(pd.extend({id:'dashboard_'+current.app},this.config.apps.user[current.app])));
									return result;
								},[]);
								if (current.panels.length!=0) result.push(current);
								return result;
							},[]),contents,tab);
							Object.values(this.dashboard.panels).each((panel) => pd.event.call('0','pd.queue.dashboard',{app:panel.app,view:panel.view}));
						})(pd.elm('#pd-kumaneko-space-contents'),pd.elm('#pd-kumaneko-space-tab'),pd.elm('#pd-kumaneko-space-nav'));
					});
				})((() => {
					var res=[];
					for (var key in this.config.apps.user)
						((app) => {
							res.push({
								id:app.id,
								scripts:app.customize.map((item) => {
									return pd.create('script')
									.attr('src',pd.ui.baseuri()+'/storage/customize/'+item.filekey)
									.attr('type','text/javascript')
								})
							});
						})(this.config.apps.user[key]);
					for (var key in this.config.apps.system)
						((app) => {
							res.push({
								id:app.id,
								scripts:app.customize.map((item) => {
									return pd.create('script')
									.attr('src',pd.ui.baseuri()+'/storage/customize/'+item.filekey)
									.attr('type','text/javascript')
								})
							});
						})(this.config.apps.system[key]);
					return res;
				})());
			};
			var embed=(index,apps,callback) => {
				var setup=(index,callback) => {
					var finish=() => {
						index++;
						if (index<this.project.scripts.length) setup(index,callback);
						else
						{
							this.project.scripts=[];
							callback();
						}
					};
					if (this.project.scripts.length!=0)
					{
						pd.elm('body').append(
							this.project.scripts[index].on('load',(e) => finish()).on('error',(e) => finish())
						);
					}
					else callback();
				};
				setup(0,() => {
					if (apps.length!=0)
					{
						((app) => {
							var setup=(index,callback) => {
								var finish=() => {
									index++;
									if (index<app.scripts.length) setup(index,callback);
									else callback();
								};
								if (app.scripts.length!=0)
								{
									pd.elm('body').append(
										app.scripts[index].on('load',(e) => finish()).on('error',(e) => finish())
									);
								}
								else callback();
							};
							if (app.scripts.length!=0) pd.elm('body').append(pd.create('script').html('pd.APP_ID=\''+app.id+'\';'));
							setup(0,() => {
								index++;
								if (index<apps.length) embed(index,apps,callback);
								else
								{
									pd.elm('body').append(pd.create('script').html('delete pd.APP_ID;'));
									callback();
								}
							});
						})(apps[index]);
					}
					else callback();
				});
			};
			var load=(config) => {
				this.config=config;
				pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'project',id:'1'})
				.then((resp) => {
					var apikey='';
					if (resp.total!=0)
						for (var key in resp.record)
							switch(key)
							{
								case 'apikey':
									if (resp.record.apikey.value) apikey=resp.record.apikey.value;
									break;
								case 'customize':
									this.project.scripts=resp.record.customize.value.map((item) => {
										return pd.create('script')
										.attr('src',pd.ui.baseuri()+'/storage/customize/'+item.filekey)
										.attr('type','text/javascript')
									});
									break;
								case 'name':
									this.project.name=resp.record.name.value.replace(/[ 　]/g,'_');
									break;
							}
					pd.chart.ready().then(() => {
						if (apikey) pd.map.ready(apikey).then((map) => map.init()).then(() => build()).catch((error) => pd.alert(error));
						else build();
					}).catch((error) => pd.alert(error));
				})
				.catch((error) => pd.alert(error.message));
			};
			if (setting)
			{
				(() => {
					var build=() => {
						((apps) => {
							/* build container */
							pd.elm('body')
							.append(
								pd.create('div').addclass('pd-container')
								.append(
									((container) => {
										this.setting.ui.container=container;
										return container;
									})(pd.create('div').addclass('pd-kumaneko-injector'))
									.append(
										pd.create('div').addclass('pd-kumaneko-injector-main')
										.append(
											((header) => {
												this.setting.ui.header=header;
												return header;
											})(pd.create('header').addclass('pd-kumaneko-injector-header'))
											.append(pd.create('div').addclass('pd-kumaneko-injector-header-title').html(this.setting.title))
											.append(pd.create('div').addclass('pd-kumaneko-injector-header-description').html((this.setting.description)?this.setting.description.replace(/\n/g,'<br>'):''))
											.append(pd.create('div').addclass('pd-kumaneko-injector-header-space'))
										)
										.append(((body) => {
											this.setting.ui.body=body;
											return body;
										})(pd.create('main').addclass('pd-kumaneko-injector-body')))
										.append(((footer) => {
											this.setting.ui.footer=footer;
											this.setting.ui.buttons={
												ok:pd.create('button').addclass('pd-button pd-kumaneko-injector-button pd-kumaneko-injector-button-submit').html(pd.constants.injector.caption.button.submit[pd.lang])
											};
											return footer.append(this.setting.ui.buttons.ok);
										})(pd.create('footer').addclass('pd-kumaneko-injector-footer')))
									)
								)
							);
							/* embed scripts */
							embed(0,apps,() => {
								/* build applications */
								this.sort(this.config.apps.user,this.config.apps.sort).each((app,index) => {
									this.apps[app.id]=new pd.modules.injector(app,(app.id==this.setting.app)?this.setting:null);
								});
								for (var key in this.config.apps.system)
									((app) => {
										this.apps[app.id]=new pd.modules.injector(app);
									})(this.config.apps.system[key]);
								/* show */
								pd.event.call(this.setting.app,'pd.create.call',{});
							});
						})((() => {
							var res=[];
							for (var key in this.config.apps.user)
								((app) => {
									res.push({
										id:app.id,
										scripts:((customize) => {
											var res=[];
											if (app.id==this.setting.app)
											{
												res=customize.map((item) => {
													return pd.create('script')
													.attr('src',pd.ui.baseuri()+'/storage/customize/'+item.filekey)
													.attr('type','text/javascript')
												})
											};
											return res;
										})(app.customize)
									});
								})(this.config.apps.user[key]);
							for (var key in this.config.apps.system)
								((app) => {
									res.push({
										id:app.id,
										scripts:[]
									});
								})(this.config.apps.system[key]);
							return res;
						})());
					};
					pd.operator={__id:{value:setting.operator.id},department:{value:setting.operator.department},group:{value:setting.operator.group}};
					pd.filter.record.load().then((config) => {
						this.config=config;
						this.setting=pd.extend({app:setting.app,ui:{}},this.config.apps.user[setting.app].injectors.reduce((result,current) => (current.id==setting.id)?current:result,{}));
						pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'project',id:'1'})
						.then((resp) => {
							var apikey='';
							if (resp.total!=0)
								for (var key in resp.record)
									switch(key)
									{
										case 'apikey':
											if (resp.record.apikey.value) apikey=resp.record.apikey.value;
											break;
									}
							pd.chart.ready().then(() => {
								if (apikey) pd.map.ready(apikey).then((map) => map.init()).then(() => build()).catch((error) => pd.alert(error));
								else build();
							}).catch((error) => pd.alert(error));
						})
						.catch((error) => pd.alert(error.message));
					});
				})();
			}
			else auth();
		}
		catch(e){pd.alert(e.message);}
	}
	/* permission */
	permit(permissions){
		var res='public';
		var calculate=(searches) => {
			var res=0;
			var values={
				department:[],
				group:[],
				user:[]
			};
			searches.each((search,index) => {
				switch (search.charAt(0))
				{
					case 'd':
						values.department.push(search.slice(1));
						break;
					case 'g':
						values.group.push(search.slice(1));
						break;
					default:
						values.user.push(search);
						break;
				}
			});
			res+=pd.operator.department.value.filter((item) => values.department.includes(item)).length;
			res+=pd.operator.group.value.filter((item) => values.group.includes(item)).length;
			if (values.user.includes(pd.operator.__id.value.toString())) res++;
			return res;
		}
		if ('owner' in permissions)
			if (permissions.owner.includes(pd.operator.__id.value.toString())) return 'admin';
		if ('admin' in permissions)
			if (calculate(permissions.admin)!=0) return 'admin';
		if ('denied' in permissions)
			if (calculate(permissions.denied)!=0) return 'denied';
		return res;
	}
	/* session */
	session(operator){
		sessionStorage.setItem(this.project.key+'_loginaccount',operator.account.value);
		sessionStorage.setItem(this.project.key+'_loginpwd',operator.pwd.value);
		return operator;
	}
	/* sort */
	sort(apps,sort){
		return sort.filter((item) => (item in apps)).concat(Object.keys(apps).filter((item) => !sort.includes(item))).map((item) => apps[item]);
	}
	/* task */
	task(action,queues){
		return new Promise((resolve,reject) => {
			switch(action)
			{
				case 'delete':
					var run=(index) => {
						pd.file(pd.ui.baseuri()+'/file.php','DELETE',{},{dir:queues.delete[index].dir,filekey:queues.delete[index].filekey})
						.then((resp) => {
							index++;
							if (index<queues.delete.length) run(index);
							else
							{
								queues.delete=[];
								resolve();
							}
						})
						.catch((error) => {
							pd.alert(error.message);
							resolve();
						});
					};
					if (queues.delete.length!=0) run(0);
					else resolve();
					break;
			}
		});
	}
};
class panda_kumaneko_app{
	/* constructor */
	constructor(app){
		/* setup properties */
		this.app=app;
		this.actions={
			button:(action,record,workplace='record') => {
				return new Promise((resolve,reject) => {
					((fieldinfos) => {
						var result=pd.filter.scan(this.app,record,action.filter);
						if (result)
						{
							var actions={
								call:false,
								formula:() => {
									return new Promise((resolve,reject) => {
										action.formula.each((formula,index) => {
											if (formula.field in fieldinfos)
												((fieldinfo) => {
													if (fieldinfo.tableid)
													{
														result[fieldinfo.tableid].value.each((row,index) => {
															row[fieldinfo.id].value=pd.formula.calculate(formula,row,result,record,fieldinfos);
															if (fieldinfo.type=='lookup') row[fieldinfo.id].lookup=true;
														});
													}
													else
													{
														result[fieldinfo.id].value=pd.formula.calculate(formula,result,result,record,fieldinfos);
														if (fieldinfo.type=='lookup') result[fieldinfo.id].lookup=true;
													}
													actions.call=true;
												})(fieldinfos[formula.field]);
										});
										resolve();
									});
								},
								mail:() => {
									return new Promise((resolve,reject) => {
										if (action.mail.to)
										{
											if (action.mail.to in fieldinfos)
											{
												var systems={
													department:[],
													group:[],
													user:[]
												}
												var assign=(target,record,row) => {
													target=target.replace(/\r/g,'').replace(/\n/g,'<br>');
													((handler) => {
														for (var key in record) target=target.replace(new RegExp('%'+key+'%','g'),handler(fieldinfos[key],record[key]));
														for (var key in row) target=target.replace(new RegExp('%'+key+'%','g'),handler(fieldinfos[key],row[key]));
													})((fieldinfo,value) => {
														var res='';
														if (fieldinfo)
															switch (fieldinfo.type)
															{
																case 'canvas':
																case 'spacer':
																case 'table':
																	break;
																case 'checkbox':
																	if (Array.isArray(value.value)) res=value.value.join(',');
																	break;
																case 'creator':
																case 'modifier':
																case 'user':
																	res=value.value.shape((item) => {
																		var id=item;
																		var res=systems.user.filter((item) => {
																			return item.__id.value=id;
																		});
																		return (res.length!=0)?res.first().name.value:PD_THROW;
																	}).join(',');
																	break;
																case 'department':
																	res=value.value.shape((item) => {
																		var id=item;
																		var res=systems.department.filter((item) => {
																			return item.__id.value=id;
																		});
																		return (res.length!=0)?res.first().name.value:PD_THROW;
																	}).join(',');
																	break;
																case 'file':
																	res=value.value.shape((item) => {
																		return (item.name)?item.name:PD_THROW;
																	}).join(',');
																	break;
																case 'lookup':
																	res=value.search;
																	break;
																case 'group':
																	res=value.value.shape((item) => {
																		var id=item;
																		var res=systems.group.filter((item) => {
																			return item.__id.value=id;
																		});
																		return (res.length!=0)?res.first().name.value:PD_THROW;
																	}).join(',');
																	break;
																default:
																	res=value.value;
																	break;
															}
														return res;
													});
													return target;
												};
												pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'departments',query:'',offset:0,limit:0},true)
												.then((resp) => {
													systems.department=resp.records;
													pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'groups',query:'',offset:0,limit:0},true)
													.then((resp) => {
														systems.group=resp.records;
														pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'users',query:'available = "available"',offset:0,limit:0},true)
														.then((resp) => {
															systems.user=resp.records;
															((bodies) => {
																var send=(index) => {
																	var body=bodies[index];
																	var download=(index,callback) => {
																		if (body.attachment.length!=0)
																		{
																			pd.file(pd.ui.baseuri()+'/file.php','GET',{},{dir:'attachment',filekey:body.attachment[index].key},true)
																			.then((resp) => {
																				body.attachment[index].data=resp.file;
																				index++;
																				if (index<body.attachment.length) download(index,callback);
																				else callback();
																			})
																			.catch((error) => pd.alert(error.message));
																		}
																		else callback();
																	}
																	download(0,() => {
																		pd.request(pd.ui.baseuri()+'/limit.php','GET',{},{option:'memory_limit'},true)
																		.then((resp) => {
																			((size) => {
																				if (size>resp.size)
																				{
																					pd.alert(pd.constants.common.message.invalid.memory[pd.lang].replace(/%value%/g,size.parseByteunit()));
																					reject();
																				}
																				else
																				{
																					pd.request(pd.ui.baseuri()+'/mail/'+pd.lang+'.php','POST',{},body,true)
																					.then((resp) => {
																						index++;
																						if (index<bodies.length) send(index);
																						else resolve();
																					})
																					.catch((error) => {
																						pd.alert(error.message);
																						reject();
																					});
																				}
																			})(new Blob([JSON.stringify(body)],{type:'text/plain'}).size*4);
																		})
																		.catch((error) => {
																			pd.alert(error.message);
																			reject();
																		});
																	});
																};
																if (bodies.length!=0) send(0);
															})((() => {
																var res=[];
																((fieldinfos[action.mail.to].tableid)?result[fieldinfos[action.mail.to].tableid].value:[result]).each((record,index) => {
																	res.push({
																		from:action.mail.from,
																		to:record[action.mail.to].value,
																		cc:action.mail.cc,
																		bcc:action.mail.bcc,
																		subject:assign(action.mail.subject,result,(fieldinfos[action.mail.to].tableid)?record:{}),
																		body:assign(action.mail.body,result,(fieldinfos[action.mail.to].tableid)?record:{}),
																		attachment:(() => {
																			var res=[];
																			if (action.mail.attachment)
																				if (action.mail.attachment in fieldinfos)
																					res=((record) => {
																						return record[action.mail.attachment].value.map((item) => {
																							return {
																								data:'',
																								key:item.filekey,
																								name:item.name,
																								type:item.filetype
																							};
																						});
																					})(((fieldinfos[action.mail.attachment].tableid)?record:result));
																			return res;
																		})()
																	});
																});
																return res;
															})());
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
											}
											else
											{
												pd.alert(pd.constants.action.message.notfound.email[pd.lang]);
												reject();
											}
										}
										else resolve();
									});
								},
								report:() => {
									return new Promise((resolve,reject) => {
										if (action.report.spreadsheet)
										{
											if (action.report.saveas in fieldinfos)
											{
												pd.request(
													pd.ui.baseuri()+'/report.php','POST',{},
													{
														app:this.app.id,
														spreadsheet:action.report.spreadsheet,
														size:action.report.size,
														orientation:action.report.orientation,
														template:action.report.template,
														record:result
													},
													true
												)
												.then((resp) => {
													if ('filekey' in resp)
													{
														((filekey) => {
															var verify=() => {
																pd.request(pd.ui.baseuri()+'/report.php','GET',{},{verify:filekey},true)
																.then((resp) => {
																	if (resp.result=='ok')
																	{
																		filekey+='.pdf';
																		pd.file(pd.ui.baseuri()+'/file.php','GET',{},{dir:'report',filekey:filekey},true)
																		.then((resp) => {
																			var finish=(filename) => {
																				filename+=(filename)?'.pdf':'report.pdf';
																				return new Promise((resolve,reject) => {
																					if (action.report.store in fieldinfos)
																					{
																						((files) => {
																							pd.file(pd.ui.baseuri()+'/file.php','POST',{},{dir:'attachment',files:files})
																							.then((resp) => {
																								Array.prototype.push.apply(record[action.report.store].value,resp.files);
																								actions.call=true;
																								resolve();
																							})
																							.catch((error) => {
																								pd.alert(error.message);
																								resolve();
																							});
																						})(((data) => {
																							var datas=atob(data);
																							var buffer=new Uint8Array(datas.length);
																							datas.length.each((index) => buffer[index]=datas.charCodeAt(index));
																							return [new File([buffer.buffer],filename,{type:'application/pdf'})];
																						})(resp.file));
																					}
																					else
																					{
																						var a=pd.create('a')
																						.css({display:'none'})
																						.attr('href',pd.ui.objecturl(resp.file,'application/pdf'))
																						.attr('target','_blank')
																						.attr('download',filename);
																						pd.elm('body').append(a);
																						a.click();
																						document.body.removeChild(a);
																						resolve();
																					}
																				});
																			};
																			finish(record[action.report.saveas].value).then(() => {
																				pd.request(pd.ui.baseuri()+'/report.php','PUT',{},{filekey:filekey},true)
																				.then((resp) => {
																					resolve();
																				})
																				.catch((error) => {
																					pd.alert(error.message);
																					reject();
																				});
																			});
																		})
																		.catch((error) => {
																			pd.alert(error.message);
																			reject();
																		});
																	}
																	else setTimeout(() => verify(),1000);
																})
																.catch((error) => {
																	pd.alert(error.message);
																	reject();
																});
															}
															setTimeout(() => verify(),1000);
														})(resp.filekey);
													}
													else
													{
														pd.alert(pd.constants.action.message.fail.report[pd.lang]);
														reject();
													}
												})
												.catch((error) => {
													pd.alert(error.message);
													reject();
												});
											}
											else
											{
												pd.alert(pd.constants.action.message.notfound.report[pd.lang]);
												reject();
											}
										}
										else resolve();
									});
								},
								rows:() => {
									return new Promise((resolve,reject) => {
										action.rows.del.each((del,index) => {
											if (del.table in this.app.fields)
											{
												record[del.table].value=record[del.table].value.filter((item) => {
													return !result[del.table].value.includes(item);
												});
												result[del.table].value=[];
												actions.call=true;
											}
										});
										action.rows.fill.each((fill,index) => {
											if (fill.table in this.app.fields)
											{
												((range) => {
													range=(pd.isnumeric(range))?parseInt(range)-result[fill.table].value.length:0;
													if (range>0)
													{
														new Array(range).fill().map(() => pd.record.create(this.app.fields[fill.table],false)).each((row,index) => {
															if (record[fill.table]==result[fill.table]) record[fill.table].value.push(row);
															else
															{
																record[fill.table].value.push(row);
																result[fill.table].value.push(row);
															}
														});
														actions.call=true;
													}
												})(pd.formula.calculate({field:'__id',formula:fill.range},result,result,record,pd.ui.field.embed(pd.extend({},fieldinfos))));
											}
										});
										resolve();
									});
								},
								transfer:() => {
									return new Promise((resolve,reject) => {
										if (action.transfer.app)
										{
											pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
											.then((resp) => {
												var config=resp.file;
												var target=config.apps.user[action.transfer.app];
												((fields) => {
													var criterias=[];
													var mappings=[];
													var tables={};
													var increments={
														record:1,
														row:1,
														progress:{
															record:0,
															row:0
														}
													};
													var execute=() => {
														var create={
															field:(fieldinfo,index) => {
																var res=null;
																if (fieldinfo.tableid)
																{
																	if (result[fieldinfo.tableid].value.length>index) res=result[fieldinfo.tableid].value[index][fieldinfo.id];
																	else
																	{
																		switch (fieldinfo.type)
																		{
																			case 'checkbox':
																			case 'creator':
																			case 'department':
																			case 'file':
																			case 'group':
																			case 'modifier':
																			case 'user':
																				res={value:[]};
																				break;
																			case 'lookup':
																				res={search:'',value:''};
																				break;
																			default:
																				res={value:''};
																				break;
																		}
																	}
																}
																else res=result[fieldinfo.id];
																return pd.extend({type:fieldinfo.type},res);
															},
															record:(origin) => {
																increments.row.each((index) => {
																	var record=((param) => {
																		var res=pd.filter.scan(target,origin,param.query);
																		if (!res)
																			if (action.transfer.pattern=='upsert')
																			{
																				for (var key in param.rows)
																					if (pd.filter.result[key].value.length==0)
																					{
																						origin[key].value.push(pd.extend({},param.rows[key]));
																						pd.filter.result[key]={value:[origin[key].value.last()]};
																					}
																				res=pd.filter.result;
																			}
																		return res;
																	})((() => {
																		var res={
																			rows:{},
																			query:[]
																		};
																		increments.progress.row=index;
																		criterias.each((criteria,index) => {
																			if (criteria.external.tableid)
																			{
																				if (!(criteria.external.tableid in res.rows)) res.rows[criteria.external.tableid]=pd.record.create(target.fields[criteria.external.tableid],false);
																				res.rows[criteria.external.tableid][criteria.external.id]=cast(criteria.external,create.field(criteria.internal,increments.progress.row));
																				res.query.push(pd.filter.query.create(criteria.external,criteria.operator,create.field(criteria.internal,increments.progress.row)));
																			}
																		});
																		res.query=res.query.join(' and ');
																		return res;
																	})());
																	if (record)
																	{
																		mappings.each((mapping,index) => {
																			if (mapping.external.tableid)
																			{
																				if (mapping.external.tableid in tables)
																				{
																					origin[mapping.external.tableid]={value:tables[mapping.external.tableid]};
																					tables[mapping.external.tableid].each((row,index) => {
																						row[mapping.external.id]=cast(mapping.external,create.field(mapping.internal,index));
																					});
																				}
																				else
																				{
																					record[mapping.external.tableid].value.each((row,index) => {
																						row[mapping.external.id]=cast(mapping.external,create.field(mapping.internal,increments.progress.row));
																					});
																				}
																			}
																			else origin[mapping.external.id]=cast(mapping.external,create.field(mapping.internal,increments.progress.record));
																		});
																	}
																});
																return pd.kumaneko.app.action(action.transfer.app,origin,'backend');
															}
														};
														var cast=(fieldinfo,value) => {
															var res=value;
															switch (fieldinfo.type)
															{
																case 'lookup':
																	res=pd.extend((!('search' in res))?{lookup:true,search:''}:{lookup:true},res);
																	break;
															}
															return res;
														};
														var finish=() => {
															increments.progress.record++;
															if (increments.progress.record<increments.record) execute();
															else resolve();
														};
														if (action.transfer.pattern=='insert')
														{
															pd.event.call(action.transfer.app,'pd.saving.call',{records:[create.record(pd.record.create(target))]})
															.then((e) => {
																pd.request(pd.ui.baseuri()+'/records.php','POST',{},{app:action.transfer.app,records:e.records,notify:true},true)
																.then((resp) => finish())
																.catch((error) => {
																	pd.alert(error.message);
																	reject();
																});
															})
															.catch(() => reject());
														}
														else
														{
															this.fetch({
																app:action.transfer.app,
																query:criterias.shape((item) => {
																	return (!item.external.tableid)?pd.filter.query.create(item.external,item.operator,create.field(item.internal,increments.progress.record)):PD_THROW;
																}).join(' and '),
																sort:'__id asc',
																offset:0,
																limit:500
															},[],true,(records) => {
																records=((records) => {
																	var res=[];
																	if (records.length!=0) res=records.map((item) => create.record(item));
																	else
																	{
																		if (action.transfer.pattern=='upsert')
																			((criterias) => {
																				res.push(create.record((() => {
																					var res=pd.record.create(target);
																					criterias.each((criteria,index) => {
																						if (criteria.external.tableid) res[criteria.external.tableid]={value:[]};
																						else res[criteria.external.id]=cast(criteria.external,create.field(criteria.internal,increments.progress.record));
																					});
																					return res;
																				})()));
																			})(criterias.filter((item) => !['id','autonumber','creator','createdtime','modifier','modifiedtime'].includes(item.external.type)));
																	}
																	return res;
																})(records);
																pd.event.call(action.transfer.app,'pd.saving.call',{records:records})
																.then((e) => {
																	pd.request(pd.ui.baseuri()+'/records.php','POST',{},{app:action.transfer.app,records:records.filter((item) => !item['__id'].value)},true)
																	.then((resp) => {
																		pd.request(pd.ui.baseuri()+'/records.php','PUT',{},{app:action.transfer.app,records:records.filter((item) => item['__id'].value),notify:true},true)
																		.then((resp) => finish())
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
																.catch(() => reject());
															},() => reject());
														}
													};
													if (action.transfer.mapping.some((item) => !((item.external in fields.external) && (item.internal in fields.internal))))
													{
														pd.alert(pd.constants.action.message.notfound.transfer.field[pd.lang]);
														reject();
													}
													if (action.transfer.criteria.some((item) => !((item.external in fields.external) && (item.internal in fields.internal))))
													{
														pd.alert(pd.constants.action.message.notfound.transfer.field[pd.lang]);
														reject();
													}
													action.transfer.mapping.each((mapping,index) => {
														((external,internal) => {
															if (external.tableid)
															{
																tables[external.tableid]=((rows) => {
																	var range=(rows)?rows.length:1;
																	if (internal.tableid)
																		range=(range<result[internal.tableid].value.length)?result[internal.tableid].value.length:range;
																	return new Array(range).fill().map(() => pd.record.create(target.fields[external.tableid],false));
																})(tables[external.tableid]);
															}
															else
															{
																if (internal.tableid)
																{
																	if (result[internal.tableid].value.length==0) increments.record=0;
																	else increments.record=(increments.record<result[internal.tableid].value.length)?result[internal.tableid].value.length:increments.record;
																}
															}
															mappings.push({
																external:external,
																internal:internal
															});
														})(fields.external[mapping.external],fields.internal[mapping.internal]);
													});
													action.transfer.criteria.each((criteria,index) => {
														((external,operator,internal) => {
															if (external.tableid)
															{
																if (external.tableid in tables) delete tables[external.tableid];
																if (internal.tableid)
																	increments.row=(increments.row<result[internal.tableid].value.length)?result[internal.tableid].value.length:increments.row;
															}
															else
															{
																if (internal.tableid)
																{
																	if (result[internal.tableid].value.length==0) increments.record=0;
																	else increments.record=(increments.record<result[internal.tableid].value.length)?result[internal.tableid].value.length:increments.record;
																}
															}
															criterias.push({
																external:external,
																operator:operator,
																internal:internal
															});
														})(fields.external[criteria.external],criteria.operator,fields.internal[criteria.internal]);
													});
													if (increments.record!=0)
													{
														increments.progress.record=0;
														increments.progress.row=0;
														execute();
													}
													else
													{
														pd.alert(pd.constants.action.message.notfound.transfer.record[pd.lang]);
														reject();
													}
												})({
													external:pd.ui.field.parallelize(target.fields),
													internal:fieldinfos
												});
											})
											.catch((error) => {
												pd.alert(error.message);
												reject();
											});
										}
										else resolve();
									});
								}
							};
							actions.rows().then(() => {
								actions.formula().then(() => {
									actions.report().then(() => {
										actions.transfer().then(() => {
											actions.mail().then(() => {
												resolve((actions.call)?{record:record}:{});
											}).catch(() => reject({}));
										}).catch(() => reject({}));
									}).catch(() => reject({}));
								}).catch(() => reject({}));
							}).catch(() => reject({}));
						}
						else
						{
							if (workplace=='record') pd.alert(pd.constants.action.message.invalid.scan[pd.lang],() => reject({}));
							else resolve({});
						}
					})(pd.ui.field.parallelize(this.app.fields));
				});
			},
			saving:(records) => {
				return new Promise((resolve,reject) => {
					var confirmed=false;
					((actions) => {
						var execute=(index) => {
							var record=records[index];
							var finish=() => {
								index++;
								if (index<records.length) execute(index);
								else resolve(confirmed);
							};
							var scan=(index) => {
								var action=actions[index];
								var result=pd.filter.scan(this.app,record,action.filter);
								if (result)
								{
									if (action.suspend.continue)
									{
										confirmed=true;
										pd.confirm(action.suspend.message,(cancel) => {
											if (cancel) reject();
											else
											{
												index++;
												if (index<actions.length) scan(index);
												else finish();
											}
										},true);
									}
									else pd.alert(action.suspend.message,() => reject())
								}
								else
								{
									index++;
									if (index<actions.length) scan(index);
									else finish();
								}
							};
							scan(0);
						};
						if (actions.length!=0)
						{
							if (records.length!=0) execute(0);
							else resolve(confirmed);
						}
						else resolve(confirmed);
					})(this.app.actions.filter((item) => item.trigger=='saving' && item.suspend.message));
				});
			},
			value:(record,workplace='record') => {
				if (workplace=='record') this.record.ui.body.elms('.pd-box').each((element,index) => element.removeclass('pd-hidden'));
				((actions,fieldinfos) => {
					actions.each((action,index) => {
						var result=pd.filter.scan(this.app,record,action.filter);
						if (result)
						{
							if ((action.user.length!=0)?(pd.kumaneko.permit({admin:action.user})=='admin'):true)
							{
								action.rows.del.each((del,index) => {
									if (del.table in this.app.fields)
									{
										record[del.table].value=record[del.table].value.filter((item) => {
											return !result[del.table].value.includes(item);
										});
										result[del.table].value=[];
									}
								});
								action.rows.fill.each((fill,index) => {
									if (fill.table in this.app.fields)
									{
										((range) => {
											range=(pd.isnumeric(range))?parseInt(range)-result[fill.table].value.length:0;
											if (range>0)
											{
												new Array(range).fill().map(() => pd.record.create(this.app.fields[fill.table],false)).each((row,index) => {
													if (record[fill.table]==result[fill.table]) record[fill.table].value.push(row);
													else
													{
														record[fill.table].value.push(row);
														result[fill.table].value.push(row);
													}
												});
											}
										})(pd.formula.calculate({field:'__id',formula:fill.range},result,result,record,pd.ui.field.embed(pd.extend({},fieldinfos))));
									}
								});
								action.formula.each((formula,index) => {
									if (formula.field in fieldinfos)
										((fieldinfo) => {
											if (fieldinfo.tableid)
											{
												result[fieldinfo.tableid].value.each((row,index) => {
													row[fieldinfo.id].value=pd.formula.calculate(formula,row,result,record,fieldinfos);
													if (fieldinfo.type=='lookup') row[fieldinfo.id].lookup=true;
												});
											}
											else
											{
												result[fieldinfo.id].value=pd.formula.calculate(formula,result,result,record,fieldinfos);
												if (fieldinfo.type=='lookup') result[fieldinfo.id].lookup=true;
											}
										})(fieldinfos[formula.field]);
								});
								if (['record','view'].includes(workplace))
								{
									action.style.each((style,index) => {
										if (style.field in fieldinfos)
											((fieldinfo) => {
												if (fieldinfo.tableid)
												{
													result[fieldinfo.tableid].value.each((row,index) => {
														row[fieldinfo.id].backcolor=style.backcolor;
														row[fieldinfo.id].forecolor=style.forecolor;
													});
												}
												else
												{
													result[fieldinfo.id].backcolor=style.backcolor;
													result[fieldinfo.id].forecolor=style.forecolor;
												}
											})(fieldinfos[style.field]);
									});
									if (action.disabled.record) record['__uneditable']={value:true};
									else
									{
										action.disabled.fields.each((disabled,index) => {
											if (disabled.field in fieldinfos)
											{
												((fieldinfo) => {
													if (fieldinfo.tableid) result[fieldinfo.tableid].value.each((row,index) => row[fieldinfo.id].disabled=true);
													else result[fieldinfo.id].disabled=true;
												})(fieldinfos[disabled.field]);
											}
											else
											{
												if (disabled.field in this.app.fields)
													if (this.app.fields[disabled.field].type=='table') result[this.app.fields[disabled.field].id].disabled=true;
											}
										});
									}
									action.hidden.each((hidden,index) => {
										if (this.app.layout.some((item) => (item.id==hidden.field && item.type=='box')))
										{
											if (workplace=='record')
												if (((box) => {
													if (box) box.addclass('pd-hidden');
													return box;
												})(this.record.ui.body.elm('[field-id="'+CSS.escape(hidden.field)+'"]'))) return;
											((fields) => {
												fields.each((field,index) => {
													if (field in fieldinfos)
													{
														((fieldinfo) => {
															switch (fieldinfo.type)
															{
																case 'spacer':
																	record[fieldinfo.id]={hidden:true};
																	break;
																default:
																	result[fieldinfo.id].hidden=true;
																	break;
															}
														})(fieldinfos[field]);
													}
												});
											})(this.app.layout.reduce((result,current) => {
												if (current.id==hidden.field && current.type=='box') result=result.concat(current.rows.map((item) => item.fields).flat());
												return result;
											},[]));
										}
										else
										{
											if (hidden.field in fieldinfos)
											{
												((fieldinfo) => {
													switch (fieldinfo.type)
													{
														case 'spacer':
															record[fieldinfo.id]={hidden:true};
															break;
														default:
															if (fieldinfo.tableid) result[fieldinfo.tableid].value.each((row,index) => row[fieldinfo.id].hidden=true);
															else result[fieldinfo.id].hidden=true;
															break;
													}
												})(fieldinfos[hidden.field]);
											}
											else
											{
												if (hidden.field in this.app.fields)
													if (this.app.fields[hidden.field].type=='table') result[this.app.fields[hidden.field].id].hidden=true;
											}
										}
									});
									action.option.each((option,index) => {
										if (option.field in fieldinfos)
										{
											((fieldinfo) => {
												switch (fieldinfo.type)
												{
													case 'checkbox':
													case 'dropdown':
													case 'radio':
														if (fieldinfo.tableid)
														{
															result[fieldinfo.tableid].value.each((row,index) => {
																if (!Array.isArray(row[fieldinfo.id].option)) row[fieldinfo.id].option=[];
																row[fieldinfo.id].option=option.options.reduce((result,current) => {
																	if (!result.includes(current)) result.push(current);
																	return result;
																},row[fieldinfo.id].option);
															});
														}
														else
														{
															if (!Array.isArray(result[fieldinfo.id].option)) result[fieldinfo.id].option=[];
															result[fieldinfo.id].option=option.options.reduce((result,current) => {
																if (!result.includes(current)) result.push(current);
																return result;
															},result[fieldinfo.id].option);
														}
														break;
												}
											})(fieldinfos[option.field]);
										}
									});
								}
							}
						}
					});
				})(this.app.actions.filter((item) => item.trigger=='value'),pd.ui.field.parallelize(this.app.fields));
				return record;
			}
		};
		this.record={
			bulk:() => {},
			clear:() => {},
			delete:() => {},
			load:() => {},
			save:() => {},
			truncate:() => {},
			show:() => {},
			hide:() => {},
			id:'',
			ui:{}
		};
		this.view={
			build:() => {},
			load:() => {},
			show:() => {},
			hide:() => {},
			ui:{}
		};
	}
	fetch(body,records,silent,success,fail){
		pd.request(pd.ui.baseuri()+'/records.php','GET',{},body,silent)
		.then((resp) => {
			if (resp.records.length!=0)
			{
				Array.prototype.push.apply(records,resp.records);
				body.offset+=body.limit;
				if (resp.total>body.offset) this.fetch(body,records,silent,success,fail);
				else success(records);
			}
			else success(records);
		})
		.catch((error) => {
			pd.loadend();
			pd.alert(error.message);
			if (fail) fail();
		});
	}
};
pd.modules={
	app:class extends panda_kumaneko_app{
		/* constructor */
		constructor(app,contents,tab,nav,single){
			var create=(viewid) => {
				var param={};
				var res={
					contents:null,
					header:null,
					body:null,
					tab:null,
					buttons:{
						ok:null,
						cancel:null,
						add:null
					},
					init:(attr) => {
						switch (attr)
						{
							case 'copied':
								res.header.attr('copied','copied');
								break;
							default:
								res.header.removeattr('copied');
								break;
						}
						return res.body.removeattr('unsaved').removeclass('pd-unsaved');
					}
				};
				res.contents=(() => {
					return pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-top pd-kumaneko-inset-top')
					.append(
						pd.create('div').addclass('pd-container')
						.append(
							pd.create('div').addclass('pd-contents')
							.append(
								((handler) => {
									res.header=pd.create('div').addclass('pd-kumaneko-app-header')
									.append(
										pd.create('div').addclass('pd-kumaneko-app-header-buttons')
										.append((() => {
											res.buttons.ok=pd.create('button').addclass('pd-button pd-kumaneko-button').html('OK');
											return res.buttons.ok;
										})())
										.append((() => {
											res.buttons.cancel=pd.create('button').addclass('pd-button pd-kumaneko-button').html('Cancel');
											return res.buttons.cancel;
										})())
										.append((() => {
											res.buttons.add=pd.create('button').addclass('pd-icon pd-icon-add').on('click',(e) => {
												pd.event.call(this.app.id,'pd.create.call',{activate:(typeof viewid!=='undefined')});
											});
											return res.buttons.add;
										})())
									)
									.append(pd.create('div').addclass('pd-kumaneko-app-header-space'))
									.on('show',(e) => handler());
									window.on('resize',(e) => handler());
									return res.header;
								})(() => {
									if (res.contents.visible())
									{
										res.header.css({width:(res.contents.innerwidth()-8).toString()+'px'});
										if (typeof viewid!=='undefined')
											((view) => {
												switch (view.type)
												{
													case 'crosstab':
													case 'gantt':
													case 'timeseries':
														if (res.body.elm('.pd-matrix')) res.body.elm('.pd-matrix').elm('thead').css({top:res.header.innerheight().toString()+'px'});
														break;
													case 'edit':
													case 'list':
														if (res.body.elm('.pd-view')) res.body.elm('.pd-view').elm('thead').css({top:res.header.innerheight().toString()+'px'});
														break;
													case 'kanban':
														if (res.body.elm('.pd-parallel'))
															res.body.elm('.pd-parallel').elms('.pd-parallel-head').each((element,index) => {
																element.css({top:res.header.innerheight().toString()+'px'});
															});
														break;
												}
											})(this.app.views.filter((item) => item.id==viewid).first());
									}
								})
							)
							.append((() => {
								res.body=pd.create('div').addclass('pd-kumaneko-app-body');
								return res.body;
							})())
						)
					).hide();
				})();
				if (typeof viewid!=='undefined')
				{
					((view) => {
						res.lib={
							conditions:{
								create:(view) => {
									var fields=(() => {
										var res=[];
										switch (view.type)
										{
											case 'calendar':
											case 'gantt':
											case 'kanban':
											case 'map':
												((title) => {
													if (title in this.app.fields)
														((fieldinfo) => {
															switch (fieldinfo.type)
															{
																case 'address':
																case 'autonumber':
																case 'file':
																case 'lookup':
																case 'postalcode':
																case 'text':
																case 'textarea':
																	res.push(fieldinfo.id);
																	break;
															}
														})(pd.extend({},this.app.fields[title]));
												})(('task' in view.fields)?view.fields.task.title:view.fields.title);
												break;
											case 'edit':
											case 'list':
												((fieldinfos) => {
													for (var key in fieldinfos)
														((fieldinfo) => {
															switch (fieldinfo.type)
															{
																case 'address':
																case 'autonumber':
																case 'file':
																case 'lookup':
																case 'postalcode':
																case 'text':
																case 'textarea':
																	res.push(fieldinfo.id);
																	break;
															}
														})(fieldinfos[key]);
												})(pd.ui.field.parallelize(
													((view.fields.length!=0)?view.fields:Object.keys(this.app.fields)).reduce((result,current) => {
														if (current in this.app.fields) result[current]=this.app.fields[current];
														return result;
													},{})
												));
												break;
										}
										return res;
									})();
									return ((container) => {
										container
										.append(
											pd.create('button').addclass('pd-icon pd-icon-filter').on('click',(e) => {
												this.confirm(() => {
													pd.filter.build(this.app,view.query,view.sort,(query,sort) => {
														view.offset=0;
														this.view.load(viewid,query,sort).catch(() => {});
													});
												},viewid);
											})
										);
										if (fields.length!=0)
										{
											container
											.append(
												pd.create('input').addclass('pd-hidden pd-search').attr('type','text').attr('data-type','text')
												.on('focus',(e) => e.currentTarget.previousValue=e.currentTarget.val())
												.on('change',(e) => {
													((element) => {
														this.confirm((reload,cancel) => {
															if (!cancel)
															{
																view.offset=0;
																this.view.load(viewid).catch(() => {});
															}
															else element.val(element.previousValue);
														},viewid,true);
													})(e.currentTarget);
												})
											)
											.append(
												pd.create('button').addclass('pd-icon pd-icon-search').on('click',(e) => {
													((element) => {
														if (element.hasclass('pd-icon-del'))
														{
															if (element.parentNode.elm('.pd-search').val())
															{
																this.confirm(() => {
																	element.removeclass('pd-icon-del').addclass('pd-icon-search').parentNode.elm('.pd-search').addclass('pd-hidden').val('');
																	view.offset=0;
																	this.view.load(viewid).catch(() => {});
																},viewid);
															}
															else element.removeclass('pd-icon-del').addclass('pd-icon-search').parentNode.elm('.pd-search').addclass('pd-hidden');
														}
														else element.removeclass('pd-icon-search').addclass('pd-icon-del').parentNode.elm('.pd-search').removeclass('pd-hidden').focus();
													})(e.currentTarget);
												})
											);
											pd.event.on(this.app.id,'pd.view.query.add',(e) => {
												if (e.viewid==viewid)
													e.query=container.elm('.pd-search').val().replace(/[　 ]+/g,' ').split(' ').reduce((result,current) => {
														if (current) result.push('('+fields.map((item) => item+' like "'+current+'"').join(' or ')+')');
														return result;
													},(e.query)?[e.query]:[]).join(' and ');
												return e;
											});
										}
										return container;
									})(pd.create('div').addclass('pd-kumaneko-app-header-filter-conditions'));
								}
							}
						};
						res.tab=new pd.modules.tab(this.app.name+'&nbsp;-&nbsp;'+view.name);
						param={viewid:viewid};
						Object.assign(res,{
							type:view.type,
							chart:('chart' in view)?view.chart:{},
							fields:view.fields,
							query:view.query,
							sort:view.sort,
							offset:0,
							limit:25,
							loaded:false,
							calendar:null,
							crosstab:null,
							gantt:null,
							timeseries:null,
							kanban:null,
							map:null,
							monitor:null,
							prev:null,
							next:null
						});
						switch (view.type)
						{
							case 'calendar':
								res.header.insertBefore(
									pd.create('div').addclass('pd-kumaneko-app-header-filter')
									.append(res.lib.conditions.create(res))
									.append((() => {
										res.prev=pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-left').on('click',(e) => {
											res.monitor.html(new Date(res.monitor.text()+'-01').calc('-1 month').format('Y-m'));
											this.view.load(viewid).catch(() => {});
										});
										return res.prev;
									})())
									.append((() => {
										res.next=pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-right').on('click',(e) => {
											res.monitor.html(new Date(res.monitor.text()+'-01').calc('1 month').format('Y-m'));
											this.view.load(viewid).catch(() => {});
										});
										return res.next;
									})())
									.append((() => {
										res.monitor=pd.create('span').addclass('pd-kumaneko-app-header-filter-monitor').html(new Date().format('Y-m'));
										return res.monitor;
									})())
									.append(
										pd.create('button').addclass('pd-icon pd-icon-date').on('click',(e) => {
											pd.pickupdate(res.monitor.text()+'-01',(date) => {
												res.monitor.html(new Date(date).format('Y-m'));
												this.view.load(viewid).catch(() => {});
											});
										})
									),
									res.header.firstChild
								);
								res.calendar=new panda_calendar(true);
								break;
							case 'crosstab':
								res.header.insertBefore(
									pd.create('div').addclass('pd-kumaneko-app-header-filter')
									.append(res.lib.conditions.create(res)),
									res.header.firstChild
								);
								res.crosstab=pd.ui.chart.create(view.type);
								break;
							case 'gantt':
								res.header.insertBefore(
									pd.create('div').addclass('pd-kumaneko-app-header-filter')
									.append(res.lib.conditions.create(res))
									.append((() => {
										res.monitor=pd.create('span').addclass('pd-kumaneko-app-header-filter-monitor').html((() => {
											var res='';
											switch (view.fields.column.period)
											{
												case 'day':
													res=new Date().format('Y-m-d');
													break;
												case 'month':
													res=new Date().format('Y-m');
													break;
											}
											return res;
										})());
										return res.monitor;
									})())
									.append(
										pd.create('button').addclass('pd-icon pd-icon-date').on('click',(e) => {
											switch (view.fields.column.period)
											{
												case 'day':
													pd.pickupdate(res.monitor.text(),(date) => {
														res.monitor.html(new Date(date).format('Y-m-d'));
														this.view.load(viewid).catch(() => {});
													});
													break;
												case 'month':
													pd.pickupdate(res.monitor.text()+'-01',(date) => {
														res.monitor.html(new Date(date).format('Y-m'));
														this.view.load(viewid).catch(() => {});
													});
													break;
											}
										})
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-app-header-filter-cases pd-dropdown')
										.append(
											pd.create('select').assignoption((() => {
												var res=[];
												switch (view.fields.column.period)
												{
													case 'day':
														res=[
															{id:{value:7},caption:{value:'7 days'}},
															{id:{value:14},caption:{value:'14 days'}},
															{id:{value:21},caption:{value:'21 days'}},
															{id:{value:28},caption:{value:'28 days'}},
															{id:{value:56},caption:{value:'56 days'}},
															{id:{value:84},caption:{value:'84 days'}}
														];
														break;
													case 'month':
														res=[
															{id:{value:12},caption:{value:'12 months'}},
															{id:{value:24},caption:{value:'24 months'}},
															{id:{value:36},caption:{value:'36 months'}}
														];
														break;
												}
												return res;
											})(),'caption','id')
											.on('change',(e) => {
												((element) => {
													res.offset=0;
													res.limit=parseInt(element.val());
													this.view.load(viewid).catch(() => {});
												})(e.currentTarget);
											})
										)
									),
									res.header.firstChild
								);
								switch (view.fields.column.period)
								{
									case 'day':
										res.limit=7;
										break;
									case 'month':
										res.limit=12;
										break;
								}
								res.gantt=pd.ui.gantt.create();
								break;
							case 'timeseries':
								res.header.insertBefore(
									pd.create('div').addclass('pd-kumaneko-app-header-filter')
									.append(res.lib.conditions.create(res))
									.append((() => {
										var date=new Date();
										if (date.getDate()>28) date=date.calc('-'+(date.getDate()-28).toString()+' day');
										res.monitor=pd.create('span').addclass('pd-kumaneko-app-header-filter-monitor').html(date.format('Y-m-d'));
										return res.monitor;
									})())
									.append(
										pd.create('button').addclass('pd-icon pd-icon-date').on('click',(e) => {
											pd.pickupdate(res.monitor.text(),(date) => {
												res.monitor.html(new Date(date).format('Y-m-d'));
												this.view.load(viewid).catch(() => {});
											});
										})
									),
									res.header.firstChild
								);
								res.timeseries=pd.ui.chart.create(view.type);
								break;
							case 'kanban':
								if (view.fields.task.date)
								{
									res.header.insertBefore(
										pd.create('div').addclass('pd-kumaneko-app-header-filter')
										.append(res.lib.conditions.create(res))
										.append((() => {
											res.prev=pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-left').on('click',(e) => {
												res.monitor.html(new Date(res.monitor.text()).calc('-1 day').format('Y-m-d'));
												this.view.load(viewid).catch(() => {});
											});
											return res.prev;
										})())
										.append((() => {
											res.next=pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-right').on('click',(e) => {
												res.monitor.html(new Date(res.monitor.text()).calc('1 day').format('Y-m-d'));
												this.view.load(viewid).catch(() => {});
											});
											return res.next;
										})())
										.append((() => {
											res.monitor=pd.create('span').addclass('pd-kumaneko-app-header-filter-monitor').html(new Date().format('Y-m-d'));
											return res.monitor;
										})())
										.append(
											pd.create('button').addclass('pd-icon pd-icon-date').on('click',(e) => {
												pd.pickupdate(res.monitor.text(),(date) => {
													res.monitor.html(new Date(date).format('Y-m-d'));
													this.view.load(viewid).catch(() => {});
												});
											})
										),
										res.header.firstChild
									);
								}
								else
								{
									res.header.insertBefore(
										pd.create('div').addclass('pd-kumaneko-app-header-filter')
										.append(res.lib.conditions.create(res)),
										res.header.firstChild
									);
								}
								res.kanban=pd.ui.kanban.create();
								break;
							case 'map':
								res.header.insertBefore(
									pd.create('div').addclass('pd-kumaneko-app-header-filter')
									.append(res.lib.conditions.create(res)),
									res.header.firstChild
								);
								res.map=new panda_map();
								break;
							default:
								res.header.insertBefore(
									pd.create('div').addclass('pd-kumaneko-app-header-filter')
									.append((() => {
										res.prev=pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-left').on('click',(e) => {
											this.confirm(() => {
												res.offset-=res.limit;
												this.view.load(viewid).catch(() => {});
											},viewid);
										});
										return res.prev;
									})())
									.append((() => {
										res.next=pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-right').on('click',(e) => {
											this.confirm(() => {
												res.offset+=res.limit;
												this.view.load(viewid).catch(() => {});
											},viewid);
										});
										return res.next;
									})())
									.append(res.lib.conditions.create(res))
									.append((() => {
										res.monitor=pd.create('span').addclass('pd-kumaneko-app-header-filter-monitor');
										return res.monitor;
									})())
									.append(
										pd.create('div').addclass('pd-kumaneko-app-header-filter-cases pd-dropdown')
										.append(
											pd.create('select').assignoption([
												{id:{value:25},caption:{value:'/25 rec'}},
												{id:{value:50},caption:{value:'/50 rec'}},
												{id:{value:100},caption:{value:'/100 rec'}}
											],'caption','id')
											.on('focus',(e) => e.currentTarget.previousValue=e.currentTarget.val())
											.on('change',(e) => {
												((element) => {
													this.confirm((reload,cancel) => {
														if (!cancel)
														{
															res.offset=0;
															res.limit=parseInt(element.val());
															this.view.load(viewid).catch(() => {});
														}
														else element.val(element.previousValue);
													},viewid,true);
												})(e.currentTarget);
											})
										)
									),
									res.header.firstChild
								);
								if (!['customize','edit'].includes(view.type))
								{
									var finish=(records) => {
										if (records.length!=0)
										{
											pd.event.call(this.app.id,'pd.view.submit',{
												container:res.body.elm('.pd-view'),
												records:{
													post:[],
													put:records
												},
												viewid:viewid
											})
											.then((param) => {
												if (!param.error)
												{
													this.actions.saving(param.records.put)
													.then((confirmed) => {
														if (confirmed) pd.loadstart();
														var reload=param.records.put.some((item) => item['__id'].value==this.record.id);
														pd.request(pd.ui.baseuri()+'/records.php','PUT',{},{app:this.app.id,records:param.records.put},true)
														.then((resp) => {
															pd.event.call(this.app.id,'pd.view.submit.success',{
																container:res.body.elm('.pd-view'),
																records:param.records,
																viewid:viewid
															})
															.then((param) => {
																if (!param.error)
																{
																	pd.loadend();
																	pd.progressend();
																	pd.alert('Done!',() => {
																		this.notify().then(() => {
																			this.view.load(viewid).then(() => {
																				if (reload) this.record.load(this.record.id,true);
																			}).catch(() => {});
																			pd.event.call('0','pd.queue.notify',{source:'app',id:this.app.id});
																		});
																	});
																}
																else
																{
																	pd.loadend();
																	pd.progressend();
																}
															});
														})
														.catch((error) => {
															pd.loadend();
															pd.progressend();
															pd.alert(error.message);
														});
													})
													.catch(() => pd.progressend());
												}
												else pd.progressend();
											});
										}
										else
										{
											pd.progressend();
											pd.alert('Done!');
										}
									};
									((actions) => {
										actions.each((action,index) => {
											((button) => {
												if ((action.user.length!=0)?(pd.kumaneko.permit({admin:action.user})=='admin'):true)
												{
													res.header.elm('.pd-kumaneko-app-header-space').append(button.html(action.caption).on('click',(e) => {
														pd.confirm(action.message,() => {
															pd.loadstart();
															pd.event.call(this.app.id,'pd.view.query.add',{
																query:res.query,
																viewid:viewid
															})
															.then((param) => {
																var overwrite=(!param.error)?param.query:res.query;
																this.fetch({
																	app:this.app.id,
																	query:overwrite,
																	sort:res.sort,
																	offset:0,
																	limit:500
																},[],true,(records) => {
																	var setup=(index) => {
																		this.actions.button(action,records[index],'view').then((param) => {
																			if ('record' in param) records[index]=this.actions.value(param.record,'backend');
																			else records[index]=null;
																			index++;
																			pd.progressupdate();
																			if (index<records.length) setup(index);
																			else finish(records.filter((item) => item));
																		}).catch(() => pd.progressend());
																	};
																	if (records.length!=0)
																	{
																		pd.progressstart(records.length);
																		setup(0);
																	}
																	else pd.loadend();
																});
															});
														});
													}));
													pd.event.on(this.app.id,'pd.view.load',(e) => {
														if (e.viewid==viewid)
														{
															if (e.total!=0) button.show('inline-block');
															else button.hide();
														}
														return e;
													});
												}
											})(pd.create('button').addclass('pd-button pd-kumaneko-button'));
										});
									})(this.app.actions.filter((item) => item.trigger=='button'));
									((linkages) => {
										linkages.each((linkage,index) => {
											((button) => {
												res.header.elm('.pd-kumaneko-app-header-space').append(button.html(linkage.bulk.caption).on('click',(e) => {
													pd.confirm(linkage.bulk.message,() => {
														pd.loadstart();
														pd.event.call(this.app.id,'pd.view.query.add',{
															query:res.query,
															viewid:viewid
														})
														.then((param) => {
															var overwrite=(!param.error)?param.query:res.query;
															this.fetch({
																app:this.app.id,
																query:overwrite,
																sort:res.sort,
																offset:0,
																limit:500
															},[],true,(records) => {
																var setup=(index) => {
																	this.linkage.load(linkage.id,records[index],(record) => {
																		index++;
																		pd.progressupdate();
																		if (index<records.length) setup(index);
																		else finish(records);
																	});
																};
																if (records.length!=0)
																{
																	pd.progressstart(records.length);
																	setup(0);
																}
																else pd.loadend();
															});
														});
													});
												}));
												pd.event.on(this.app.id,'pd.view.load',(e) => {
													if (e.viewid==viewid)
													{
														if (e.total!=0) button.show('inline-block');
														else button.hide();
													}
													return e;
												});
											})(pd.create('button').addclass('pd-button pd-kumaneko-button'));
										});
									})(this.app.linkages.filter((item) => item.bulk.enable));
								}
								break;
						}
						if (view.type!='edit')
						{
							res.buttons.ok.hide();
							res.buttons.cancel.hide();
						}
					})(this.app.views.filter((item) => item.id==viewid).first());
				}
				else
				{
					res.tab=new pd.modules.tab(this.app.name);
					Object.assign(res,{linkage:{}});
					((actions) => {
						actions.each((action,index) => {
							((button) => {
								if ((action.user.length!=0)?(pd.kumaneko.permit({admin:action.user})=='admin'):true)
								{
									res.header.elm('.pd-kumaneko-app-header-space').append(button.html(action.caption).on('click',(e) => {
										pd.confirm(action.message,() => {
											pd.loadstart();
											this.actions.button(action,pd.record.get(this.record.ui.body,this.app,true).record).then((param) => {
												pd.loadend();
												pd.alert('Done!',() => {
													if ('record' in param)
													{
														pd.record.set(this.record.ui.body,this.app,this.actions.value(param.record)).then(() => {
															this.record.save(true);
														});
													}
												});
											}).catch(() => pd.loadend());
										});
									}));
									pd.event.on(this.app.id,['pd.create.load.complete','pd.edit.load.complete'],(e) => {
										if (!e.viewid)
											((record) => {
												if (pd.filter.scan(this.app,record,action.filter)) button.show('inline-block');
												else button.hide();
											})(e.record);
										return e;
									});
								}
							})(pd.create('button').addclass('pd-button pd-kumaneko-button'));
						});
					})(this.app.actions.filter((item) => item.trigger=='button'));
					((linkages) => {
						if (linkages.length!=0)
							((splitter) => {
								var adjust=(height) => {
									if (height>splitter.parentNode.innerheight()-splitter.outerheight(false)) height=splitter.parentNode.innerheight()-splitter.outerheight(false);
									else height=(height<0)?0:height;
									splitter.previousElementSibling.css({height:'calc(100% - '+(height+splitter.outerheight(false)).toString()+'px)'});
									splitter.nextElementSibling.css({height:height.toString()+'px'});
								};
								var resize=(e) =>{
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									var keep={
										position:pointer.pageY,
										height:splitter.nextElementSibling.outerheight(false)
									};
									var handler={
										move:(e) => {
											var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
											adjust(keep.height+keep.position-pointer.pageY);
											e.stopPropagation();
											e.preventDefault();
										},
										end:(e) => {
											pd.elm('body').css({cursor:''});
											window.off('mousemove,touchmove',handler.move);
											window.off('mouseup,touchend',handler.end);
											e.stopPropagation();
											e.preventDefault();
										}
									};
									pd.elm('body').css({cursor:'row-resize'});
									window.on('mousemove,touchmove',handler.move);
									window.on('mouseup,touchend',handler.end);
									e.stopPropagation();
									e.preventDefault();
								};
								res.contents
								.append(splitter.on('mousedown,touchstart',(e) => resize(e)))
								.append(
									pd.kumaneko.tab.setup(
										pd.create('div').addclass('pd-kumaneko-splitter-block')
										.append(pd.create('div').addclass('pd-hidden pd-kumaneko-tab-scroller pd-kumaneko-border-left pd-kumaneko-inset-left'))
										.append(pd.create('section').addclass('pd-kumaneko-tab'))
										.append(pd.create('section').addclass('pd-kumaneko-block pd-kumaneko-border-top pd-kumaneko-inset-top'))
									)
								);
								pd.event.on(this.app.id,'pd.app.activate',(e) => {
									if (!('viewid' in e))
									{
										adjust(splitter.nextElementSibling.outerheight(false));
										if (!Object.values(res.linkage).some((item) => item.tab.active)) res.linkage[linkages.first().id].tab.container.dispatchEvent(new MouseEvent('click'));
									}
								});
								linkages.each((linkage,index) => {
									((fields) => {
										((app) => {
											var events=[];
											res.linkage[linkage.id]={
												id:linkage.id,
												app:app,
												aggregate:((display,fieldinfos) => {
													var res=[];
													((latlng) => {
														Object.values(fieldinfos).filter((item) => display.includes(item.id)).each((fieldinfo,index) => {
															switch (fieldinfo.type)
															{
																case 'number':
																	if (!latlng.includes(fieldinfo.id)) res.push(fieldinfo.id);
															}
														});
													})(Array.from(new Set(Object.values(fieldinfos).shape((item) => (item.type=='address')?Object.values(item.mapping):PD_THROW).flat())));
													return res;
												})(linkage.display.map((item) => item.external),fields.external),
												criteria:linkage.criteria.map((item) => {
													events.push('pd.change.'+item.internal);
													return {
														external:fields.external[item.external],
														operator:item.operator,
														internal:fields.internal[item.internal]
													};
												}),
												display:linkage.display,
												query:linkage.query,
												sort:linkage.sort,
												contents:((contents) => {
													return contents
													.append(
														pd.create('div').addclass('pd-container')
														.append(pd.ui.view.create(pd.create('div').addclass('pd-contents'),app,'linkage_'+this.app.id+'_'+linkage.id))
													)
													.append(
														pd.create('div').addclass('pd-kumaneko-border-top pd-kumaneko-linkage-guide')
														.append(
															pd.create('button').addclass('pd-icon pd-icon-del').on('click',(e) => {
																e.currentTarget.parentNode.hide();
																contents.css({paddingBottom:'0'});
															})
														)
														.append(pd.create('span').addclass('pd-kumaneko-linkage-guide-label'))
													);
												})(pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-linkage')),
												tab:((tab) => {
													tab.container.on('click',(e) => {
														for (var key in res.linkage)
														{
															if (key==linkage.id)
															{
																res.linkage[key].contents.show();
																res.linkage[key].tab.activate();
															}
															else
															{
																res.linkage[key].contents.hide();
																res.linkage[key].tab.deactivate();
															}
														}
														pd.kumaneko.tab.activate(tab);
														e.stopPropagation();
														e.preventDefault();
													});
													tab.close.hide();
													return tab;
												})(new pd.modules.tab(linkage.name))
											};
											splitter.nextElementSibling.elm('.pd-kumaneko-block').append(res.linkage[linkage.id].contents);
											splitter.nextElementSibling.elm('.pd-kumaneko-tab').append(res.linkage[linkage.id].tab.container);
											/* event */
											pd.event.on(this.app.id,events,(e) => {
												this.linkage.load(linkage.id,e.record);
												return e;
											});
										})({
											id:linkage.app,
											fields:fields.external,
											styles:{},
											views:[{
												id:'linkage_'+this.app.id+'_'+linkage.id,
												type:'linkage',
												fields:linkage.display.map((item) => item.external)
											}]
										});
									})({
										external:pd.ui.field.parallelize(pd.kumaneko.config.apps.user[linkage.app].fields),
										internal:this.app.fields
									});
								});
							})(pd.create('div').addclass('pd-kumaneko-splitter'));
					})(this.app.linkages.filter((item) => (item.app in pd.kumaneko.config.apps.user)?(pd.kumaneko.permit(pd.kumaneko.config.apps.user[item.app].permissions)!='denied'):false));
				}
				res.tab.container.on('click',(e) => {
					pd.event.call(this.app.id,'pd.app.activate',param);
					e.stopPropagation();
					e.preventDefault();
				});
				res.tab.close.on('click',(e) => {
					this.confirm((reload) => {
						if (typeof viewid!=='undefined')
						{
							if (res.body.elm('.pd-view')) res.body.elm('.pd-view').elms('[form-id=form_'+this.app.id+']').each((element,index) => element.removeattr('unsaved').closest('tr').removeclass('pd-unsaved'));
							if (reload) this.view.ui[viewid].loaded=false;
						}
						else res.init();
						res.tab.container.parentNode.removeChild(res.tab.container);
						pd.event.call(this.app.id,'pd.app.deactivate',pd.extend({active:res.tab.active},param));
					},viewid);
					e.stopPropagation();
					e.preventDefault();
				});
				return res;
			};
			super(app);
			/* setup properties */
			this.app=app;
			this.area={
				contents:contents,
				tab:tab,
				nav:nav
			};
			this.queues={
				linkage:[]
			};
			this.linkage={
				load:(ids,record,callback) => {
					ids=((Array.isArray(ids))?pd.extend([],ids):ids.split(',').map((item) => item.trim())).filter((item) => item);
					((linkages,backend) => {
						pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
						.then((resp) => {
							var config=resp.file;
							var build=(index) => {
								((linkage) => {
									((fields) => {
										for (var key in linkage.app.fields) if (!(key in fields.external)) delete linkage.app.fields[key];
										linkage.aggregate=linkage.aggregate.filter((item) => (item in fields.external));
										linkage.criteria=linkage.criteria.filter((item) => ((item.external.id in fields.external) && (item.internal.id in fields.internal)));
										linkage.display=linkage.display.filter((item) => (item.external in fields.external));
										linkage.tableid=Array.from(new Set(linkage.display.shape((item) => (fields.external[item.external].tableid)?fields.external[item.external].tableid:PD_THROW))).join('');
									})({
										external:pd.ui.field.parallelize(config.apps.user[linkage.app.id].fields),
										internal:config.apps.user[this.app.id].fields
									});
									((param) => {
										this.fetch(param,[],true,(records) => {
											var keep={
												container:linkage.contents.elm('.pd-view'),
												records:[],
												aggregates:Object.fromEntries(((head) => {
													return linkage.aggregate.map((item) => {
														head.elm('[column-id="'+CSS.escape(item)+'"]').addclass('pd-view-head-cell-extension');
														return [item,[]];
													});
												})(linkage.contents.elm('.pd-view').elm('thead'))),
												linkageid:linkage.id
											};
											var deploy=(fields,origin) => {
												var tables=Array.from(new Set(fields.map((item) => item.internal.tableid))).reduce((result,current) => {
													origin[current].value=[];
													result[current]={
														fields:fields.filter((item) => item.internal.tableid==current),
														row:pd.record.create({fields:config.apps.user[this.app.id].fields[current].fields})
													};
													return result;
												},{});
												keep.records.each((record,index) => {
													for (var key in tables)
														origin[key].value.push(((row) => {
															tables[key].fields.each((field,index) => {
																switch (field.internal.type)
																{
																	case 'lookup':
																		row[field.internal.id]=((value) => {
																			return {
																				lookup:true,
																				search:(!('search' in value)?'':value.search),
																				value:value.value
																			};
																		})(record[field.external]);
																		break;
																	default:
																		row[field.internal.id].value=record[field.external].value;
																		break;
																}
															});
															return row;
														})(pd.extend({},tables[key].row)));
												});
												return this.actions.value(origin,(backend)?'backend':'record');
											};
											var finish=() => {
												index++;
												if (index<linkages.length) build(index);
												else
												{
													if (backend) callback(record);
												}
											};
											var setup=(index,callback) => {
												((record) => {
													new Array((linkage.tableid)?record[linkage.tableid].value.length:1).fill().map(() => ({})).each((cells,index) => {
														cells['__id']=record['__id'];
														for (var key in linkage.app.fields)
															if (linkage.app.fields[key].type!='spacer')
															{
																if (linkage.app.fields[key].tableid)
																{
																	if (linkage.app.fields[key].tableid==linkage.tableid) cells[key]=record[linkage.tableid].value[index][key];
																}
																else cells[key]=record[key];
																if (key in keep.aggregates) keep.aggregates[key].push((cells[key].value)?parseFloat(cells[key].value):0);
															}
														keep.records.push(cells);
														if (!backend) pd.record.set(linkage.contents.elm('.pd-view').addrow().elm('[form-id=form_'+linkage.app.id+']'),linkage.app,cells);
													});
													index++;
													if (index<records.length) setup(index,callback);
													else callback();
												})(records[index]);
											};
											records=records.shape((item) => {
												var res=pd.filter.scan(config.apps.user[linkage.app.id],pd.kumaneko.app.action(linkage.app.id,item,'view'),param.query);
												return (res)?res:PD_THROW;
											});
											if (records.length!=0)
											{
												if (backend)
												{
													setup(0,() => {
														if (keep.records.length!=0)
															((fieldinfos) => {
																((fields) => {
																	if (fields.length!=0) record=deploy(fields,record);
																})(linkage.display.shape((item) => (item.internal in fieldinfos)?{external:item.external,internal:fieldinfos[item.internal]}:PD_THROW));
															})(pd.ui.field.parallelize(config.apps.user[this.app.id].fields));
														finish();
													});
												}
												else
												{
													linkage.contents.elm('.pd-view').clearrows();
													setup(0,() => {
														linkage.aggregate.each((aggregate,index) => {
															keep.aggregates[aggregate]=((aggregate) => {
																return {
																	avg:((aggregate.length!=0)?aggregate.reduce((a,b) => a+b)/aggregate.length:0),
																	min:((aggregate.length!=0)?aggregate.reduce((a,b) => Math.min(a,b)):0),
																	max:((aggregate.length!=0)?aggregate.reduce((a,b) => Math.max(a,b)):0),
																	sum:((aggregate.length!=0)?aggregate.reduce((a,b) => a+b):0)
																};
															})(keep.aggregates[aggregate]);
															((fieldinfo,cell) => {
																pd.event.off(linkage.app.id,'pd.view.guide.call',cell.handler).on(linkage.app.id,'pd.view.guide.call',(() => {
																	cell.handler=(e) => {
																		if (e.id==aggregate)
																		{
																			((aggregate) => {
																				var res=[];
																				var setup=(key) => {
																					var res=aggregate[key];
																					if (fieldinfo.demiliter) res=Number(res).comma(fieldinfo.decimals);
																					else res=(fieldinfo.decimals)?Number(res).toFixed(parseInt(fieldinfo.decimals)):res;
																					if (fieldinfo.unit)
																					{
																						if (fieldinfo.unitposition=='prefix') return fieldinfo.unit+res;
																						else return res+fieldinfo.unit;
																					}
																					else return res;
																				};
																				linkage.contents.elm('.pd-kumaneko-linkage-guide-label').html(
																					(() => {
																						var res=[];
																						res.push(fieldinfo.caption+'&nbsp;');
																						res.push('Sum&nbsp;'+setup('sum'));
																						res.push('Avg&nbsp;'+setup('avg'));
																						res.push('Min&nbsp;'+setup('min'));
																						res.push('Max&nbsp;'+setup('max'));
																						return res.join(' ');
																					})()
																				);
																				linkage.contents.css({paddingBottom:linkage.contents.elm('.pd-kumaneko-linkage-guide').show().outerheight(false).toString()+'px'});
																			})(keep.aggregates[aggregate])
																		}
																	};
																	return cell.handler;
																})());
															})(linkage.app.fields[aggregate],linkage.contents.elm('.pd-view').elm('thead').elm('[column-id="'+CSS.escape(aggregate)+'"]'));
														});
														if (keep.records.length!=0)
															((fieldinfos) => {
																((fields) => {
																	linkage.contents.elm('.pd-view').elm('th').empty();
																	if (fields.length!=0)
																		linkage.contents.elm('.pd-view').elm('th')
																		.append(
																			pd.create('button').addclass('pd-icon pd-icon-copy').on('click',(e) => {
																				pd.confirm(pd.constants.common.message.confirm.copy[pd.lang],() => {
																					pd.record.set(this.record.ui.body,config.apps.user[this.app.id],deploy(fields,pd.record.get(this.record.ui.body,this.app,true).record));
																					((event) => {
																						this.record.ui.body.attr('unsaved','unsaved').dispatchEvent(event);
																					})(new Event('change'));
																				});
																			})
																		)
																})(linkage.display.shape((item) => (item.internal in fieldinfos)?{external:item.external,internal:fieldinfos[item.internal]}:PD_THROW));
															})(pd.ui.field.parallelize(config.apps.user[this.app.id].fields));
														pd.event.call(this.app.id,'pd.linkage.load.complete',keep);
														((contents,active) => {
															contents.elm('.pd-view').show('table');
															if (active) contents.show();
														})(linkage.contents,linkage.tab.active);
														finish();
													});
												}
											}
											else
											{
												if (!backend) linkage.contents.elm('.pd-view').hide();
												finish();
											}
										});
									})({
										app:linkage.app.id,
										query:((queries) => {
											queries.push(linkage.query);
											return queries.filter((item) => item).join(' and ');
										})(linkage.criteria.map((item) => {
											return pd.filter.query.create(item.external,item.operator,pd.extend({type:item.internal.type},record[item.internal.id]));
										})),
										sort:(linkage.sort)?linkage.sort:'__id asc',
										offset:0,
										limit:500
									});
								})(linkages[index]);
							};
							if (linkages.length!=0) build(0);
							else
							{
								if (backend) callback(record);
							}
						})
						.catch((error) => pd.alert(error.message));
					})((ids.length!=0)?Object.keys(this.record.ui.linkage).shape((item) => (ids.includes(item))?this.record.ui.linkage[item]:PD_THROW):Object.values(this.record.ui.linkage),(typeof callback!=='undefined'));
				}
			};
			this.record={
				clear:() => {
					this.record.id=((body) => {
						pd.record.clear(body,this.app);
						body.focus();
						return '';
					})(this.record.ui.init());
				},
				delete:(recordid) => {
					return new Promise((resolve,reject) => {
						pd.request(pd.ui.baseuri()+'/records.php','DELETE',{},{app:this.app.id,id:recordid})
						.then((resp) => resolve({}))
						.catch((error) => {
							pd.alert(error.message);
							reject({});
						});
					});
				},
				load:(record,issilent) => {
					return new Promise((resolve,reject) => {
						var load=(record) => {
							((recordid) => {
								pd.event.call(this.app.id,'pd.edit.load',{
									container:this.record.ui.body,
									record:record
								})
								.then((param) => {
									if (!param.error)
									{
										pd.record.set(this.record.ui.init(),this.app,this.actions.value(param.record)).then(() => {
											pd.event.call(this.app.id,'pd.edit.load.complete',{container:this.record.ui.body}).then(() => {
												this.linkage.load('',pd.record.get(this.record.ui.body,this.app,true).record);
											});
										});
										if (!issilent) pd.event.call(this.app.id,'pd.app.activate',{}).then((param) => resolve({recordid:recordid}));
										else resolve({recordid:recordid});
									}
									else reject({});
								});
							})(('__id' in record)?record['__id'].value:'');
						};
						if (record instanceof Object) load(record);
						else
						{
							pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:this.app.id,id:record})
							.then((resp) => {
								if (resp.total!=0) load(resp.record);
								else reject({});
							})
							.catch((error) => {
								pd.alert(error.message);
								reject({});
							});
						}
					});
				},
				save:(confirmthrow) => {
					var res=pd.record.get(this.record.ui.body,this.app);
					if (!res.error)
						pd.event.call(this.app.id,(res.record['__id'].value)?'pd.edit.submit':'pd.create.submit',{
							container:this.record.ui.body,
							record:res.record
						})
						.then((param) => {
							if (!param.error)
							{
								var execute=() => {
									pd.request(pd.ui.baseuri()+'/records.php',(param.record['__id'].value)?'PUT':'POST',{},{app:this.app.id,records:[param.record]})
									.then((resp) => {
										if ('id' in resp) this.record.id=resp.id;
										pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:this.app.id,id:this.record.id})
										.then((resp) => {
											pd.event.call(this.app.id,(param.record['__id'].value)?'pd.edit.submit.success':'pd.create.submit.success',{
												container:this.record.ui.body,
												record:((resp.total!=0)?resp.record:param.record)
											})
											.then((param) => {
												if (!param.error)
													this.notify().then(() => {
														if (!single) this.record.load(this.record.id,true);
														else
														{
															pd.alert(pd.constants.common.message.confirm.reboot[pd.lang],() => {
																window.location.reload(true);
															});
														}
														pd.event.call('0','pd.queue.notify',{source:'app',id:this.app.id});
													});
											});
										})
										.catch((error) => pd.alert(error.message));
									})
									.catch((error) => pd.alert(error.message));
								};
								if (confirmthrow) this.actions.saving([param.record]).then((confirmed) => execute()).catch(() => {});
								else pd.confirm(pd.constants.common.message.confirm.submit[pd.lang],() => this.actions.saving([param.record]).then((confirmed) => execute()).catch(() => {}));
							}
						});
				},
				truncate:() => {
					return new Promise((resolve,reject) => {
						pd.request(pd.ui.baseuri()+'/records.php','DELETE',{},{app:this.app.id,truncate:true})
						.then((resp) => {
							this.notify().then(() => {
								this.record.clear();
								for (var key in this.view.ui) this.view.load(key,null,null,true).catch(() => {});
								pd.event.call('0','pd.queue.notify',{source:'app',id:this.app.id});
								resolve({});
							});
						})
						.catch((error) => {
							pd.alert(error.message);
							reject({});
						});
					});
				},
				show:() => {
					this.record.ui.contents.show();
					this.record.ui.body.focus();
					if (this.queues.linkage.length!=0)
					{
						this.linkage.load(this.queues.linkage,pd.record.get(this.record.ui.body,this.app,true).record);
						this.queues.linkage=[];
					}
					((tab) => {
						if (!tab.container.parentNode) this.area.tab.append(tab.container);
						pd.kumaneko.tab.activate(tab);
						return tab;
					})(this.record.ui.tab).activate();
					this.view.hide();
				},
				hide:() => {
					this.record.ui.contents.hide();
					this.record.ui.tab.deactivate();
				},
				id:'',
				ui:{}
			};
			this.view={
				build:(app,view,records,option) => {
					switch (view.type)
					{
						case 'calendar':
							view.calendar.show(new Date(option.date),null,{
								create:(cell,date,style) => {
									cell.append(
										((cell) => {
											cell.append(pd.create('span').addclass('pd-kumaneko-calendar-cell-guide').css(style).html(date.getDate().toString()));
											if (view.fields.title in app.fields)
												((fieldinfo,records) => {
													fieldinfo.nocaption=true;
													records.each((record,index) => {
														((app) => {
															cell.append(
																((cell) => {
																	cell
																	.append(pd.ui.field.activate(pd.ui.field.create(fieldinfo).addclass('pd-picker pd-readonly').css({width:'100%'}),app))
																	.on('click',(e) => {
																		pd.event.call(this.app.id,'pd.edit.call',{recordid:record['__id'].value});
																	});
																	pd.record.set(cell,app,record);
																	return cell;
																})(pd.create('div').addclass('pd-scope pd-kumaneko-calendar-cell-item'))
															);
														})({
															id:app.id,
															fields:(() => {
																var res={};
																res[fieldinfo.id]=fieldinfo;
																return res;
															})()
														});
													});
												})(pd.extend({},app.fields[view.fields.title]),records.filter((item) => new Date(item[view.fields.date].value).getDate()==date.getDate()));
											if (!option.readonly)
												cell.append(
													pd.create('button').addclass('pd-icon pd-icon-add pd-kumaneko-calendar-cell-button').on('click',(e) => {
														this.confirm(() => {
															this.record.clear();
															pd.event.call(
																this.app.id,
																'pd.create.call',
																{
																	activate:true,
																	record:((record) => {
																		record[view.fields.date].value=date.format('Y-m-d');
																		return record;
																	})(pd.record.get(this.record.ui.body,this.app,true).record)
																}
															);
														});
													})
												);
											return cell;
										})(pd.create('div').addclass('pd-kumaneko-calendar-cell'))
									);
								}
							});
							break;
						case 'crosstab':
						case 'timeseries':
							view[view.type].show(records,view);
							break;
						case 'gantt':
						case 'kanban':
							((handler) => {
								switch (view.type)
								{
									case 'gantt':
										view.gantt.show(records,view,handler);
										break;
									case 'kanban':
										view.kanban.show(records,handler);
										break;
								}
							})((task,record) => {
								if (view.fields.task.title in app.fields)
									((fieldinfo) => {
										fieldinfo.nocaption=true;
										((app) => {
											task.addclass('pd-scope')
											.append(pd.ui.field.activate(pd.ui.field.create(fieldinfo).addclass('pd-picker pd-readonly').css({width:'100%'}),app))
											.on('click',(e) => {
												pd.event.call(this.app.id,'pd.edit.call',{recordid:record['__id'].value});
											});
											switch (view.type)
											{
												case 'gantt':
													pd.record.set(task,app,this.actions.value(record,'view'));
													break;
												case 'kanban':
													pd.record.set(task,app,record);
													break;
											}
										})({
											id:app.id,
											fields:(() => {
												var res={};
												res[fieldinfo.id]=fieldinfo;
												return res;
											})()
										});
									})(pd.extend({},app.fields[view.fields.task.title]));
							});
							break;
						case 'map':
							((app) => {
								view.map.reloadmap(((records) => {
									return records.map((item) => {
										return {
											label:item['__id'].value.toString(),
											lat:item[view.fields.lat].value,
											lng:item[view.fields.lng].value,
											backcolor:((view.fields.color in item)?item[view.fields.color].value:''),
											balloon:((balloon) => {
												balloon
												.append(pd.ui.field.activate(pd.ui.field.create(app.fields[view.fields.title]).addclass('pd-picker pd-readonly').css({width:'100%'}),app))
												.on('click',(e) => {
													pd.event.call(this.app.id,'pd.edit.call',{recordid:item['__id'].value});
												});
												pd.record.set(balloon,app,item);
												return balloon;
											})(pd.create('div').addclass('pd-scope pd-kumaneko-map-item'))
										};
									});
								})(records),option.center);
							})({
								id:app.id,
								fields:((fieldinfo) => {
									var res={};
									fieldinfo.nocaption=true;
									res[fieldinfo.id]=fieldinfo;
									return res;
								})(pd.extend({},app.fields[view.fields.title]))
							});
							break;
						case 'customize':
							break;
						default:
							view.body.elm('.pd-view').clearrows();
							if (option.readonly) view.body.elm('.pd-view').elms('thead tr').each((element,index) => element.elms('.pd-view-button').last().addclass('pd-hidden'));
							records.each((record,index) => {
								pd.record.set(((row) => {
									if (option.readonly) row.elms('.pd-view-button').last().addclass('pd-hidden');
									return row;
								})(view.body.elm('.pd-view').addrow()).elm('[form-id=form_'+app.id+']'),app,this.actions.value(record,'view'));
							});
							break;
					}
				},
				load:(viewid,query,sort,deactivate) => {
					return new Promise((resolve,reject) => {
						((view) => {
							var finish=(param) => {
								pd.event.call('0','pd.dashboard.redraw',((param) => {
									if (view.type=='calendar') param.month=view.monitor.text()+'-01';
									return param;
								})({app:this.app.id,view:viewid,records:param.records})).then(() => {
									view.loaded=true;
									if (!deactivate) this.view.show(viewid);
									pd.event.call(this.app.id,'pd.view.load.complete',{container:param.container,viewid:param.viewid});
									resolve({});
								});
							};
							pd.event.call(this.app.id,'pd.view.query.add',{
								query:(typeof query==='string')?query:view.query,
								viewid:viewid
							})
							.then((param) => {
								var overwrite=(!param.error)?param.query:((typeof query==='string')?query:view.query)
								switch (view.type)
								{
									case 'calendar':
										if (!deactivate) pd.loadstart();
										this.fetch({
											app:this.app.id,
											query:((date,query) => {
												var res=view.fields.date+' >= "'+date.format('Y-m-d')+'" and '+view.fields.date+' <= "'+date.calc('1 month,-1 day').format('Y-m-d')+'"';
												return res+((query)?' and ('+query+')':'');
											})(new Date(view.monitor.text()+'-01'),overwrite),
											sort:(typeof sort==='string')?sort:view.sort,
											offset:0,
											limit:500
										},[],true,(records) => {
											if (!deactivate) pd.loadend();
											pd.event.call(this.app.id,'pd.view.load',{
												container:view.calendar.calendar,
												records:records,
												total:records.length,
												viewid:viewid
											})
											.then((param) => {
												if (!param.error)
												{
													((fieldinfos) => {
														param.records=param.records.reduce((result,current) => {
															var res=this.actions.value(current,'view');
															if (fieldinfos[view.fields.title].tableid)
															{
																result=result.concat(res[fieldinfos[view.fields.title].tableid].value.reduce((result,current) => {
																	if (current[view.fields.date].value)
																		if (new Date(current[view.fields.date].value).format('Y-m')==view.monitor.text())
																		{
																			current['__id']={value:res['__id'].value};
																			result.push(current);
																		}
																	return result;
																},[]));
															}
															else result.push(res);
															return result;
														},[]);
														this.view.build(
															((tableid) => {
																return ((tableid)?pd.extend({fields:pd.extend({},this.app.fields[tableid].fields)},this.app):this.app);
															})(fieldinfos[view.fields.title].tableid),
															view,
															param.records,
															{readonly:fieldinfos[view.fields.title].tableid,date:view.monitor.text()+'-01'}
														);
														if (typeof query==='string') view.query=query;
														if (typeof sort==='string') view.sort=sort;
														finish(param);
													})(pd.ui.field.parallelize(this.app.fields));
												}
												else reject({});
											});
										},() => reject({}));
										break;
									case 'crosstab':
									case 'gantt':
									case 'timeseries':
										pd.request(
											pd.ui.baseuri()+'/'+view.type+'.php',
											'POST',
											{},
											pd.extend({
												app:this.app.id,
												query:overwrite,
												sort:(typeof sort==='string')?sort:view.sort,
												column:{
													limit:view.limit,
													starting:(view.monitor)?view.monitor.text():''
												}
											},view.fields),
											deactivate
										)
										.then((resp) => {
											if ('fields' in resp)
											{
												pd.event.call(this.app.id,'pd.view.load',{
													container:view[view.type],
													records:resp,
													viewid:viewid
												})
												.then((param) => {
													if (!param.error)
													{
														this.view.build(this.app,view,resp);
														if (typeof query==='string') view.query=query;
														if (typeof sort==='string') view.sort=sort;
														finish(param);
													}
													else reject({});
												});
											}
											else reject({});
										})
										.catch((error) => {
											pd.alert(error.message);
											reject({});
										});
										break;
									case 'kanban':
										if (!deactivate) pd.loadstart();
										this.fetch({
											app:this.app.id,
											query:((date,query,fieldinfos) => {
												var res=(query)?['('+query+')']:[];
												if (date)
												{
													switch (fieldinfos[view.fields.task.date].type)
													{
														case 'createdtime':
														case 'datetime':
														case 'modifiedtime':
															res.push(view.fields.task.date+' >= "'+[date,'00:00:00'].join(' ').parseDateTime().format('ISO')+'"');
															res.push(view.fields.task.date+' <= "'+[date,'23:59:00'].join(' ').parseDateTime().format('ISO')+'"');
															break;
														case 'date':
															res.push(view.fields.task.date+' = "'+date+'"');
															break;
													}
												}
												return res.join(' and ');
											})((view.fields.task.date)?view.monitor.text():null,overwrite,pd.ui.field.parallelize(this.app.fields)),
											sort:(typeof sort==='string')?sort:view.sort,
											offset:0,
											limit:500
										},[],true,(records) => {
											if (!deactivate) pd.loadend();
											pd.event.call(this.app.id,'pd.view.load',{
												container:view.kanban,
												records:view.fields.groups.reduce((result,current) => {
													result.push({
														caption:current.caption,
														query:current.query,
														width:view.fields.task.width,
														records:records.filter((item) => pd.filter.scan(this.app,item,current.query))
													});
													return result;
												},[]),
												total:records.length,
												viewid:viewid
											})
											.then((param) => {
												if (!param.error)
												{
													((fieldinfos) => {
														param.records=param.records.reduce((result,current) => {
															result.push(((date,group) => {
																group.records=group.records.reduce((result,current) => {
																	var res=this.actions.value(current,'view');
																	if (fieldinfos[view.fields.task.title].tableid)
																	{
																		result=result.concat(pd.filter.scan(this.app,res,group.query)[fieldinfos[view.fields.task.title].tableid].value.reduce((result,current) => {
																			if (date)
																			{
																				if (current[view.fields.task.date].value)
																					if (new Date(current[view.fields.task.date].value).format('Y-m-d')==date)
																					{
																						current['__id']={value:res['__id'].value};
																						result.push(current);
																					}
																			}
																			else
																			{
																				current['__id']={value:res['__id'].value};
																				result.push(current);
																			}
																			return result;
																		},[]));
																	}
																	else result.push(res);
																	return result;
																},[]);
																return group;
															})((view.fields.task.date)?view.monitor.text():null,current));
															return result;
														},[]);
														this.view.build(
															((tableid) => {
																return ((tableid)?pd.extend({fields:pd.extend({},this.app.fields[tableid].fields)},this.app):this.app);
															})(fieldinfos[view.fields.task.title].tableid),
															view,
															param.records
														);
														if (typeof query==='string') view.query=query;
														if (typeof sort==='string') view.sort=sort;
														finish(param);
													})(pd.ui.field.parallelize(this.app.fields));
												}
												else reject({});
											});
										},() => reject({}));
										break;
									case 'map':
										if (!deactivate) pd.loadstart();
										this.fetch({
											app:this.app.id,
											query:((query) => {
												var res=view.fields.lat+' != null and '+view.fields.lng+' != null';
												return res+((query)?' and ('+query+')':'');
											})(overwrite),
											sort:(typeof sort==='string')?sort:view.sort,
											offset:0,
											limit:500
										},[],true,(records) => {
											if (!deactivate) pd.loadend();
											pd.event.call(this.app.id,'pd.view.load',{
												container:view.map.container,
												records:records,
												total:records.length,
												viewid:viewid
											})
											.then((param) => {
												if (!param.error)
												{
													((fieldinfos) => {
														param.records=param.records.reduce((result,current) => {
															var res=this.actions.value(current,'view');
															if (fieldinfos[view.fields.title].tableid)
															{
																result=result.concat(res[fieldinfos[view.fields.title].tableid].value.reduce((result,current) => {
																	if (current[view.fields.lat].value && current[view.fields.lng].value)
																	{
																		current['__id']={value:res['__id'].value};
																		result.push(current);
																	}
																	return result;
																},[]));
															}
															else result.push(res);
															return result;
														},[]);
														this.view.build(
															((tableid) => {
																return ((tableid)?pd.extend({fields:pd.extend({},this.app.fields[tableid].fields)},this.app):this.app);
															})(fieldinfos[view.fields.title].tableid),
															view,
															param.records,
															{center:!view.tab.active}
														);
														if (typeof query==='string') view.query=query;
														if (typeof sort==='string') view.sort=sort;
														finish(param);
													})(pd.ui.field.parallelize(this.app.fields));
												}
												else reject({});
											});
										},() => reject({}));
										break;
									default:
										pd.request(
											pd.ui.baseuri()+'/records.php',
											'GET',
											{},
											{
												app:this.app.id,
												query:overwrite,
												sort:(typeof sort==='string')?sort:view.sort,
												offset:view.offset,
												limit:view.limit
											},
											deactivate
										)
										.then((resp) => {
											pd.event.call(this.app.id,'pd.view.load',{
												container:((view.type=='customize')?view.body:view.body.elm('.pd-view')),
												records:resp.records,
												total:resp.total,
												viewid:viewid
											})
											.then((param) => {
												if (!param.error)
												{
													this.view.build(this.app,view,param.records,{readonly:false});
													view.monitor.html((() => {
														var res='';
														res+=(view.offset+1).comma()+'&nbsp;-&nbsp;'+(view.offset+param.records.length).comma()+'&nbsp;of&nbsp;'+param.total.comma();
														return res;
													})());
													if (view.offset>0) view.prev.removeattr('disabled');
													else view.prev.attr('disabled','disabled');
													if (view.offset+((view.limit==param.records.length)?view.limit:param.records.length)<param.total) view.next.removeattr('disabled');
													else view.next.attr('disabled','disabled');
													if (typeof query==='string') view.query=query;
													if (typeof sort==='string') view.sort=sort;
													finish(param);
												}
												else reject({});
											});
										})
										.catch((error) => {
											pd.alert(error.message);
											reject({});
										});
										break;
								}
							});
						})(this.view.ui[viewid]);
					});
				},
				show:(viewid) => {
					if (!this.view.ui[viewid].loaded) this.view.load(viewid).catch(() => {});
					else
					{
						for (var key in this.view.ui)
							if (key==viewid)
							{
								this.view.ui[key].contents.show();
								((tab) => {
									if (!tab.container.parentNode) this.area.tab.append(tab.container);
									pd.kumaneko.tab.activate(tab);
									return tab;
								})(this.view.ui[key].tab).activate();
							}
							else this.view.hide(key);
						this.record.hide();
					}
				},
				hide:(viewid) => {
					if (typeof viewid!=='undefined')
					{
						((view) => {
							view.contents.hide();
							view.tab.deactivate();
						})(this.view.ui[viewid]);
					}
					else
					{
						for (var key in this.view.ui)
							((view) => {
								view.contents.hide();
								view.tab.deactivate();
							})(this.view.ui[key]);
					}
				},
				ui:{}
			};
			/* integrate elements */
			this.area.contents.append(((record) => {
				this.record.ui=record;
				/* modify elements */
				if (!single)
				{
					((option) => {
						this.record.ui.header
						.append(
							pd.create('button').addclass('pd-icon pd-icon-option').on('click',(e) => {
								option.show().css({bottom:(option.getBoundingClientRect().height*-1).toString()+'px'});
								e.stopPropagation();
								e.preventDefault();
							})
						)
						.append(
							option
							.append(
								pd.create('button').addclass('pd-kumaneko-app-header-option-item')
								.append(pd.create('span').addclass('pd-kumaneko-app-header-option-item-label').html('Copy'))
								.append(pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-right pd-kumaneko-app-header-option-item-icon'))
								.on('click',(e) => {
									option.hide();
									this.confirm(() => {
										pd.event.call(this.app.id,'pd.create.load',{
											container:this.record.ui.body,
											copy:true,
											record:((res) => {
												this.record.id='';
												res['__id'].value='';
												res['__autonumber'].value='';
												res['__creator'].value=[];
												res['__createdtime'].value='';
												res['__modifier'].value=[];
												res['__modifiedtime'].value='';
												return res;
											})(pd.record.get(this.record.ui.body,this.app,true).record)
										})
										.then((param) => {
											if (!param.error)
												pd.record.set(this.record.ui.init('copied'),this.app,this.actions.value(param.record)).then(() => {
													pd.event.call(this.app.id,'pd.create.load.complete',{container:this.record.ui.body,copy:true}).then(() => {
														this.linkage.load('',pd.record.get(this.record.ui.body,this.app,true).record);
													});
												});
										});
									});
								})
							)
							.append(
								pd.create('button').addclass('pd-kumaneko-app-header-option-item').css({borderBottom:'none'})
								.append(pd.create('span').addclass('pd-kumaneko-app-header-option-item-label').html('Delete'))
								.append(pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-right pd-kumaneko-app-header-option-item-icon'))
								.on('click',(e) => {
									option.hide();
									if (this.record.id)
									{
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											pd.event.call(this.app.id,'pd.delete.submit',{
												container:this.record.ui.body,
												record:pd.record.get(this.record.ui.body,this.app,true).record
											})
											.then((param) => {
												if (!param.error)
													this.record.delete(this.record.id).then(() => {
														this.notify().then(() => {
															this.record.clear();
															this.record.ui.tab.close.click();
															pd.event.call('0','pd.queue.notify',{source:'app',id:this.app.id});
														});
													}).catch(() => {});
											});
										});
									}
									else
									{
										this.record.ui.init();
										this.record.ui.tab.close.click();
									}
								})
							)
						);
						window.on('click',(e) => {if (option.visible()) option.hide();});
					})(pd.create('div').addclass('pd-kumaneko-app-header-option'));
				}
				else this.record.ui.buttons.add.hide();
				pd.ui.form.create(this.record.ui.body,this.app);
				/* event */
				this.record.ui.body.on('change',(e) => {
					this.record.ui.body.addclass('pd-unsaved');
				});
				this.record.ui.buttons.ok.on('click',(e) => this.record.save());
				this.record.ui.buttons.cancel.on('click',(e) => {
					this.record.ui.tab.close.click();
				});
				return this.record.ui.contents;
			})(create()));
			pd.event.call(this.app.id,'pd.record.build',{header:this.record.ui.header.elm('.pd-kumaneko-app-header-space'),body:this.record.ui.body});
			if (this.area.nav)
			{
				this.area.nav.append(
					((res) => {
						res.attr('nav-id','nav_'+this.app.id)
						.append(
							((res) => {
								res
								.append(pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-down'))
								.append(pd.create('span').addclass('pd-kumaneko-nav-button-item-label').html(this.app.name));
								if (pd.kumaneko.permit(this.app.permissions)=='admin')
									res.append(
										pd.create('button').addclass('pd-icon pd-icon-setting pd-kumaneko-nav-icon').on('click',(e) => {
											pd.kumaneko.appbuilder.show(this.app);
											e.stopPropagation();
											e.preventDefault();
										})
									);
								return res;
							})(pd.create('span').addclass('pd-kumaneko-nav-button-item')).on('click',(e) => {
								if (res.elm('.pd-kumaneko-nav-button-details').visible())
								{
									res.elm('.pd-kumaneko-nav-button-details').hide();
									res.elm('.pd-icon-arrow').removeclass('pd-icon-arrow-up').addclass('pd-icon-arrow-down');
								}
								else
								{
									res.elm('.pd-kumaneko-nav-button-details').show();
									res.elm('.pd-icon-arrow').removeclass('pd-icon-arrow-down').addclass('pd-icon-arrow-up');
								}
							})
						)
						.append(pd.create('div').addclass('pd-kumaneko-nav-button-details').hide());
						return res;
					})(pd.create('div').addclass('pd-kumaneko-nav-button pd-kumaneko-border-bottom'))
				);
			}
			this.app.views.each((view,index) => {
				((viewid,viewname) => {
					this.area.contents.append(((view,viewid) => {
						this.view.ui[viewid]=view;
						/* modify elements */
						switch (view.type)
						{
							case 'calendar':
								view.body.append(view.calendar.calendar.addclass('pd-kumaneko-calendar'));
								break;
							case 'crosstab':
								if (view.chart.type!='table') view.body.addclass('pd-fixed').closest('.pd-contents').addclass('pd-fixed');
								view.body.append(view.crosstab);
								break;
							case 'gantt':
								view.body.append(view.gantt);
								break;
							case 'timeseries':
								if (view.chart.type!='table') view.body.addclass('pd-fixed').closest('.pd-contents').addclass('pd-fixed');
								view.body.append(view.timeseries);
								break;
							case 'kanban':
								view.body.addclass('pd-stretch').append(view.kanban).closest('.pd-contents').addclass('pd-fixed');
								break;
							case 'map':
								((element) => {
									view.body.addclass('pd-fixed').append(element).closest('.pd-contents').addclass('pd-fixed');
									view.map.init(
										element,
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
										},
										null,
										(address,postalcode,latlng) => {
											if (view.fields.handover)
												this.confirm(() => {
													var finish=() => {
														pd.event.call(this.app.id,'pd.create.call',{activate:true,record:pd.record.get(this.record.ui.body,this.app,true).record});
													};
													this.record.clear();
													pd.record.set(this.record.ui.init(),this.app,(() => {
														var res={};
														if (view.fields.lat in this.app.fields) res[view.fields.lat]={value:latlng.lat()};
														if (view.fields.lng in this.app.fields) res[view.fields.lng]={value:latlng.lng()};
														if (view.fields.address in this.app.fields) res[view.fields.address]={value:address};
														return res;
													})());
													if (view.fields.postalcode in this.app.fields)
													{
														pd.pickuppostal(postalcode.replace(/[^0-9]/g,''),(resp) => {
															if (resp) this.record.ui.body.elm('[field-id="'+CSS.escape(view.fields.postalcode)+'"]').elm('.pd-field-value').set(resp).then(() => finish());
															else finish();
														});
													}
													else finish();
												});
										}
									);
								})(pd.create('div').addclass('pd-kumaneko-map'));
								break;
							case 'customize':
								break;
							default:
								if (!Object.values(this.app.fields).some((item) => item.type=='table'))
								{
									((option) => {
										view.header
										.append(
											pd.create('button').addclass('pd-icon pd-icon-option').on('click',(e) => {
												option.show().css({bottom:(option.getBoundingClientRect().height*-1).toString()+'px'});
												e.stopPropagation();
												e.preventDefault();
											})
										)
										.append(
											option
											.append(
												pd.create('button').addclass('pd-kumaneko-app-header-option-item')
												.append(pd.create('span').addclass('pd-kumaneko-app-header-option-item-label').html(pd.constants.common.caption.button.export[pd.lang]))
												.append(pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-right pd-kumaneko-app-header-option-item-icon'))
												.on('click',(e) => {
													option.hide();
													this.confirm(() => {
														pd.event.call(this.app.id,'pd.view.query.add',{
															query:view.query,
															viewid:viewid
														})
														.then((param) => {
															var overwrite=(!param.error)?param.query:view.query;
															this.fetch({
																app:this.app.id,
																query:overwrite,
																sort:view.sort,
																offset:0,
																limit:500
															},[],false,(records) => {
																((fields) => {
																	pd.downloadtext(records.reduce((result,current) => {
																		return result.concat([[current['__id'].value].concat(fields.shape((item) => {
																			var res='';
																			switch (this.app.fields[item].type)
																			{
																				case 'canvas':
																				case 'file':
																				case 'id':
																				case 'spacer':
																					res=PD_THROW;
																					break;
																				case 'checkbox':
																				case 'creator':
																				case 'department':
																				case 'group':
																				case 'modifier':
																				case 'user':
																					res='"'+current[item].value.join(':')+'"';
																					break;
																				case 'lookup':
																				case 'number':
																					res=current[item].value;
																					break;
																				default:
																					res='"'+current[item].value.replace(/"/g,'""')+'"';
																					break;
																			}
																			return res;
																		})).join(',')]);
																	},[['"Record ID"'].concat(fields.shape((item) => {
																		var res='';
																		switch (this.app.fields[item].type)
																		{
																			case 'canvas':
																			case 'file':
																			case 'id':
																			case 'spacer':
																				res=PD_THROW;
																				break;
																			default:
																				res='"'+this.app.fields[item].caption+'"';
																				break;
																		}
																		return res;
																	}).join(','))]).join('\n'),this.app.name+'.csv');
																})((view.fields.length!=0)?view.fields:Object.keys(this.app.fields));
															},() => reject({}));
														});
													},viewid);
												})
											)
											.append(
												pd.create('button').addclass('pd-kumaneko-app-header-option-item').css({borderBottom:'none'})
												.append(pd.create('span').addclass('pd-kumaneko-app-header-option-item-label').html(pd.constants.common.caption.button.import[pd.lang]))
												.append(pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-right pd-kumaneko-app-header-option-item-icon'))
												.on('click',(e) => {
													option.hide();
													((file) => {
														pd.elm('body').append(file.on('change',(e) => {
															if (e.currentTarget.files) pd.kumaneko.importmanager.show(this.app.id,e.currentTarget.files.first());
															document.body.removeChild(file);
														}));
														file.click();
													})(pd.create('input').attr('type','file').attr('accept','text/csv').css({display:'none'}));
												})
											)
										);
										window.on('click',(e) => {if (option.visible()) option.hide();});
									})(pd.create('div').addclass('pd-kumaneko-app-header-option'));
								}
								pd.ui.view.create(view.body,this.app,viewid);
								break;
						}
						/* event */
						view.buttons.ok.on('click',(e) => {
							var post=[];
							var put=[];
							var res={};
							view.body.elm('.pd-view').elms('[unsaved=unsaved]').each((element,index) => {
								res=pd.record.get(element,this.app);
								if (!res.error)
								{
									if (res.record['__id'].value) put.push(res.record);
									else post.push(res.record);
								}
								else return PD_BREAK;
							});
							if (!res.error)
							{
								if (post.length+put.length!=0)
								{
									pd.event.call(this.app.id,'pd.view.submit',{
										container:view.body.elm('.pd-view'),
										records:{
											post:post,
											put:put
										},
										viewid:viewid
									})
									.then((param) => {
										if (!param.error)
											pd.confirm(pd.constants.common.message.confirm.submit[pd.lang],() => {
												this.actions.saving(param.records.post.concat(param.records.put))
												.then((confirmed) => {
													var reload=param.records.put.some((item) => item['__id'].value==this.record.id);
													pd.request(pd.ui.baseuri()+'/records.php','POST',{},{app:this.app.id,records:param.records.post})
													.then((resp) => {
														param.records.post.each((post,index) => {
															post['__id'].value=resp.id-(param.records.post.length-index-1);
															if ('autonumbers' in resp) post['__autonumber'].value=resp.autonumbers[post['__id'].value.toString()];
														});
														pd.request(pd.ui.baseuri()+'/records.php','PUT',{},{app:this.app.id,records:param.records.put})
														.then((resp) => {
															param.records.put.each((put,index) => {
																if ('autonumbers' in resp) put['__autonumber'].value=resp.autonumbers[put['__id'].value.toString()];
															});
															pd.event.call(this.app.id,'pd.view.submit.success',{
																container:view.body.elm('.pd-view'),
																records:param.records,
																viewid:viewid
															})
															.then((param) => {
																if (!param.error)
																	this.notify().then(() => {
																		this.view.load(viewid).then(() => {
																			if (reload) this.record.load(this.record.id,true);
																		}).catch(() => {});
																		pd.event.call('0','pd.queue.notify',{source:'app',id:this.app.id});
																	});
															});
														})
														.catch((error) => pd.alert(error.message));
													})
													.catch((error) => pd.alert(error.message));
												})
												.catch(() => {});
											});
									});
								}
								else pd.alert(pd.constants.common.message.invalid.submit[pd.lang]);
							}
						});
						view.buttons.cancel.on('click',(e) => {
							this.confirm(() => {
								this.view.load(viewid).catch(() => {});
							},viewid);
						});
						return view.contents;
					})(create(viewid),viewid));
					if (this.area.nav)
						this.area.nav.elm('[nav-id=nav_'+this.app.id+']').elm('.pd-kumaneko-nav-button-details')
						.append(
							pd.create('span').addclass('pd-kumaneko-nav-button-details-item')
							.append(pd.create('span').addclass('pd-kumaneko-nav-button-details-item-label').html(viewname))
							.on('click',(e) => {
								pd.event.call(this.app.id,'pd.app.activate',{viewid:viewid});
							})
						);
					pd.event.call(this.app.id,'pd.view.build',{header:this.view.ui[viewid].header.elm('.pd-kumaneko-app-header-space'),body:this.view.ui[viewid].body,viewid:viewid});
				})(view.id,view.name);
			});
			/* event */
			pd.event.on(this.app.id,'pd.action.call',(e) => {
				return new Promise((resolve,reject) => {
					this.actions.value(e.record,e.workplace);
					resolve(e);
				});
			});
			pd.event.on(this.app.id,'pd.create.call',(e) => {
				return new Promise((resolve,reject) => {
					this.confirm(() => {
						if (!('record' in e))
						{
							this.record.clear();
							e.record=pd.record.get(this.record.ui.body,this.app,true).record;
						}
						pd.event.call(this.app.id,'pd.create.load',{
							container:this.record.ui.body,
							record:e.record
						})
						.then((param) => {
							if (!param.error)
							{
								pd.record.set(this.record.ui.init(),this.app,this.actions.value(param.record)).then(() => {
									pd.event.call(this.app.id,'pd.create.load.complete',{container:this.record.ui.body}).then(() => {
										this.linkage.load('',pd.record.get(this.record.ui.body,this.app,true).record);
									});
								});
								if (e.activate) pd.event.call(this.app.id,'pd.app.activate',{});
							}
						});
					});
				});
			});
			pd.event.on(this.app.id,'pd.delete.call',(e) => {
				return this.record.delete(e.recordid).then(() => {
					this.notify().then(() => {
						if (e.recordid==this.record.id) this.record.clear();
						pd.event.call('0','pd.queue.notify',{source:'app',id:this.app.id});
					});
				}).catch(() => {
					e.error=true;
				});
			});
			pd.event.on(this.app.id,'pd.edit.call',(e) => {
				return new Promise((resolve,reject) => {
					this.confirm(() => {
						resolve(this.record.load(('recordid' in e)?e.recordid:e.record).then((param) => this.record.id=param.recordid));
					});
				});
			});
			pd.event.on(this.app.id,'pd.fields.call',(e) => {
				e.fields=this.app.fields;
				return e;
			});
			pd.event.on(this.app.id,'pd.permit.call',(e) => {
				e.permit=(pd.kumaneko.permit(this.app.permissions)!='denied');
				return e;
			});
			pd.event.on(this.app.id,'pd.preview.call',(e) => {
				return new Promise((resolve,reject) => {
					this.notify().then(() => {
						((view) => {
							view.offset=0;
							this.view.load('0','__modifiedtime>="'+e.modifiedtime+'"','__id asc').then(() => {
								pd.event.call(this.app.id,'pd.app.activate',{viewid:'0'}).then((param) => resolve({}));
							})
							.catch((error) => resolve({}));
							pd.event.call('0','pd.queue.notify',{source:'app',id:this.app.id});
						})(this.view.ui['0']);
					});
				});
			});
			pd.event.on(this.app.id,'pd.saving.call',(e) => {
				return new Promise((resolve,reject) => {
					this.actions.saving(e.records).then((confirmed) => resolve(e)).catch(() => reject(e));
				});
			});
			pd.event.on(this.app.id,'pd.truncate.call',(e) => {
				return new Promise((resolve,reject) => {
					this.record.truncate().then(() => resolve({})).catch(() => reject({}));
				});
			});
			pd.event.on(this.app.id,'pd.view.call',(e) => {
				switch (e.view.type)
				{
					case 'calendar':
					case 'kanban':
					case 'map':
						this.view.build(
							((tableid) => {
								return ((tableid)?pd.extend({fields:pd.extend({},e.app.fields[tableid].fields)},e.app):e.app);
							})(pd.ui.field.parallelize(e.app.fields)[('task' in e.view.fields)?e.view.fields.task.title:e.view.fields.title].tableid),
							e.view,
							e.records,
							('option' in e)?e.option:{}
						);
						break;
					default:
						this.view.build(e.app,e.view,e.records,('option' in e)?e.option:{});
						break;
				}
				return e;
			});
		}
		/* confirmation before execution */
		confirm(action,viewid,cancelcapture){
			var unsaved=(typeof viewid!=='undefined')?this.view.ui[viewid].body.elms('[unsaved=unsaved]').length!=0:this.record.ui.body.hasAttribute('unsaved');
			if (unsaved)
			{
				pd.confirm(pd.constants.common.message.confirm.changed[pd.lang],(cancel) => {
					action(unsaved,cancel);
				},cancelcapture);
			}
			else action(unsaved);
		}
		/* reload notification */
		notify(reload){
			return new Promise((resolve,reject) => {
				for (var key in this.view.ui)
					if (this.view.ui[key].body.elms('[unsaved=unsaved]').length==0)
					{
						this.view.ui[key].loaded=false;
						if (reload)
							if (this.view.ui[key].tab.active)
							{
								this.view.load(key).catch(() => {});
								continue;
							}
						pd.event.call('0','pd.queue.dashboard',{app:this.app.id,view:key});
					}
				pd.event.call('0','pd.queue.linkage',{app:this.app.id});
				resolve({});
			});
		}
	},
	auth:class extends panda_dialog{
		/* constructor */
		constructor(){
			super(999996,false,false);
			/* setup properties */
			this.app={
				id:'auth',
				fields:{
					account:{
						id:'account',
						type:'text',
						caption:'account',
						required:false,
						nocaption:true,
						format:'alphanum',
						placeholder:pd.constants.auth.prompt.account[pd.lang]
					},
					pwd:{
						id:'pwd',
						type:'text',
						caption:'password',
						required:false,
						nocaption:true,
						format:'password',
						placeholder:pd.constants.auth.prompt.pwd[pd.lang]
					}
				},
				layout:[
					{
						type:'row',
						fields:['account']
					},
					{
						type:'row',
						fields:['pwd']
					}
				],
				styles:{}
			};
			this.ok.attr('tabstop','tabstop').on('click',(e) => {
				var res=pd.record.get(pd.elm('[form-id=form_'+this.app.id+']'),this.app);
				if (!res.error)
				{
					if (!res.record.account.value)
					{
						pd.alert(pd.constants.auth.message.invalid.account[pd.lang]);
						return;
					}
					if (!res.record.pwd.value)
					{
						pd.alert(pd.constants.auth.message.invalid.pwd[pd.lang]);
						return;
					}
					pd.event.call('0','pd.auth.submit',{record:res.record});
				}
			});
			this.cancel.on('click',(e) => this.hide());
			/* setup styles */
			this.ok.css({borderRight:'1px solid #42a5f5'});
			/* modify elements */
			pd.ui.form.create(this.contents,this.app);
			this.container.css({height:'165px',width:'300px'});
			this.contents.elms('.pd-field').each((element,index) => element.css({width:'100%'}));
		}
		/* show */
		show(){
			super.show();
			this.container.elms('input').each((element,index) => {
				element.css({
					backgroundColor:this.container.css('--'+pd.theme+'-auth-bg-color'),
					border:'1px solid '+this.container.css('--'+pd.theme+'-auth-border-color')
				});
			});
			this.container.elm('[field-id=account]').elm('.pd-field-value').elm('input').focus();
			return this;
		}
	},
	builder:{
		app:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999994,false,true);
				/* setup properties */
				this.app={};
				this.menus={
					form:{
						id:'form',
						app:{},
						contents:null,
						tab:null,
						lib:{
							activate:(element,fieldinfo,scope,addtrash=false,addduplicate=false,addsetting=false) => {
								var handler=(e) => {
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									pd.event.call(
										'appbuilder_'+this.menus.form.id,
										'pd.drag.start',
										{
											element:element,
											scope:((typeof scope==='undefined')?'':scope),
											page:{
												x:pointer.pageX,
												y:pointer.pageY
											}
										}
									);
									window.off('touchmove,mousemove',handler);
								};
								/* setup properties */
								if ('tableid' in fieldinfo) delete fieldinfo.tableid;
								element.addclass('pd-kumaneko-drag-field pd-kumaneko-drag-field-'+fieldinfo.type).fieldinfo=fieldinfo;
								if (addtrash)
								{
									/* modify elements */
									element.append(
										pd.create('button').addclass('pd-icon pd-icon-trash pd-kumaneko-drag-button')
										.on('touchstart,mousedown',(e) => {
											e.stopPropagation();
										})
										.on('click',(e) => {
											pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
												pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
												.then((resp) => {
													var config=resp.file;
													var error=(index,fieldinfos,callback) => {
														var res=[];
														var fieldinfo=fieldinfos[index];
														((fieldinfos) => {
															for (var key in fieldinfos)
																((fieldinfo) => {
																	switch (fieldinfo.type)
																	{
																		case 'address':
																		case 'lookup':
																		case 'postalcode':
																			for (var key in fieldinfo.mapping) res.push({id:fieldinfo.mapping[key],message:'-&nbsp;'+fieldinfo.caption+'&nbsp;(This app)'});
																			switch (fieldinfo.type)
																			{
																				case 'lookup':
																					((mapping) => {
																						Array.from(new Set(mapping)).each((mapping,index) => res.push({id:mapping,message:'-&nbsp;'+fieldinfo.caption+'&nbsp;(This app)'}));
																					})([
																						...fieldinfo.criteria.map((item) => item.internal),
																						...fieldinfo.table.reduce((result,current) => {
																							return result.concat([current.id.internal]).concat(current.fields.map((item) => item.internal));
																						},[])
																					]);
																					if (fieldinfo.app==this.app.id)
																						((mapping) => {
																							Array.from(new Set(mapping)).each((mapping,index) => res.push({id:mapping,message:'-&nbsp;'+fieldinfo.caption+'&nbsp;(This app)'}));
																						})([
																							...fieldinfo.criteria.map((item) => item.external),
																							...Object.keys(fieldinfo.mapping),
																							...fieldinfo.picker,
																							...fieldinfo.table.reduce((result,current) => {
																								return result.concat([current.id.external]).concat(current.fields.map((item) => item.external));
																							},[]),
																							fieldinfo.search
																						]);
																					break;
																			}
																			break;
																		case 'autonumber':
																			fieldinfo.group.each((group,index) => res.push({id:group,message:'-&nbsp;'+fieldinfo.caption+'&nbsp;(This app)'}));
																			break;
																	}
																})(fieldinfos[key]);
														})(pd.ui.field.parallelize(this.app.fields));
														this.app.views.each((view,index) => {
															switch (view.type)
															{
																case 'calendar':
																	res.push({id:view.fields.date,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	res.push({id:view.fields.title,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	break;
																case 'crosstab':
																	res.push({id:view.fields.column.field,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	res.push({id:view.fields.value.field,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	if (view.fields.rows.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	break;
																case 'gantt':
																	res.push({id:view.fields.task.start,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	res.push({id:view.fields.task.end,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	res.push({id:view.fields.task.title,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	if (view.fields.rows.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	break;
																case 'timeseries':
																	res.push({id:view.fields.column.field,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	if (view.fields.values.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	break;
																case 'kanban':
																	res.push({id:view.fields.task.title,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	if (view.fields.task.date) res.push({id:view.fields.task.date,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	break;
																case 'map':
																	res.push({id:view.fields.lat,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	res.push({id:view.fields.lng,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	res.push({id:view.fields.title,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	if (view.fields.color) res.push({id:view.fields.color,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	if (view.fields.address) res.push({id:view.fields.address,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	if (view.fields.postalcode) res.push({id:view.fields.postalcode,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	break;
																default:
																	if (view.fields.some((item) => item==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+view.name+'&nbsp;(This app)'});
																	break;
															}
														});
														this.app.linkages.each((linkage,index) => {
															if (linkage.criteria.some((item) => item.internal==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+linkage.name+'&nbsp;(This app)'});
															if (linkage.display.some((item) => item.internal==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+linkage.name+'&nbsp;(This app)'});
															if (linkage.app==this.app.id)
															{
																if (linkage.criteria.some((item) => item.external==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+linkage.name+'&nbsp;(This app)'});
																if (linkage.display.some((item) => item.external==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+linkage.name+'&nbsp;(This app)'});
															}
														});
														this.app.actions.each((action,index) => {
															switch (action.trigger)
															{
																case 'button':
																	if (action.rows.del.some((item) => item.table==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.rows.fill.some((item) => item.table==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.formula.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.report.saveas) res.push({id:action.report.saveas,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.report.store) res.push({id:action.report.store,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.transfer.criteria.some((item) => item.internal==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.transfer.mapping.some((item) => item.internal==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.transfer.app==this.app.id)
																	{
																		if (action.transfer.criteria.some((item) => item.external==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																		if (action.transfer.mapping.some((item) => item.external==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	}
																	if (action.mail.to) res.push({id:action.mail.to,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.mail.attachment) res.push({id:action.mail.attachment,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	break;
																case 'value':
																	if (action.rows.del.some((item) => item.table==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.rows.fill.some((item) => item.table==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.formula.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.style.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.disabled.fields.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.hidden.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	if (action.option.some((item) => item.field==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;(This app)'});
																	break;
															}
														});
														this.app.injectors.each((injector,index) => {
															if (injector.fields.some((item) => item.id==fieldinfo.id))
																res.push({id:fieldinfo.id,message:'-&nbsp;'+injector.title+'&nbsp;(This app)'});
														});
														this.app.deduplications.each((deduplication,index) => {
															if (deduplication.criteria.some((item) => (item.external==fieldinfo.id || item.internal==fieldinfo.id)))
																res.push({id:fieldinfo.id,message:'-&nbsp;'+deduplication.name+'&nbsp;(This app)'});
														});
														for (var key in config.apps.user)
															((app) => {
																if (app.id!=this.app.id)
																{
																	((fieldinfos) => {
																		for (var key in fieldinfos)
																			((fieldinfo) => {
																				switch (fieldinfo.type)
																				{
																					case 'lookup':
																						if (fieldinfo.app==this.app.id)
																							((mapping) => {
																								Array.from(new Set(mapping)).each((mapping,index) => res.push({id:mapping,message:'-&nbsp;'+fieldinfo.caption+'&nbsp;('+app.name+')'}));
																							})([
																								...fieldinfo.criteria.map((item) => item.external),
																								...Object.keys(fieldinfo.mapping),
																								...fieldinfo.picker,
																								...fieldinfo.table.reduce((result,current) => {
																									return result.concat([current.id.external]).concat(current.fields.map((item) => item.external));
																								},[]),
																								fieldinfo.search
																							]);
																						break;
																				}
																			})(fieldinfos[key]);
																	})(pd.ui.field.parallelize(app.fields));
																	app.linkages.each((linkage,index) => {
																		if (linkage.app==this.app.id)
																		{
																			if (linkage.criteria.some((item) => item.external==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+linkage.name+'&nbsp;('+app.name+')'});
																			if (linkage.display.some((item) => item.external==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+linkage.name+'&nbsp;('+app.name+')'});
																		}
																	});
																	app.actions.each((action,index) => {
																		switch (action.trigger)
																		{
																			case 'button':
																				if (action.transfer.app==this.app.id)
																				{
																					if (action.transfer.criteria.some((item) => item.external==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;('+app.name+')'});
																					if (action.transfer.mapping.some((item) => item.external==fieldinfo.id)) res.push({id:fieldinfo.id,message:'-&nbsp;'+action.name+'&nbsp;('+app.name+')'});
																				}
																				break;
																		}
																	});
																}
															})(config.apps.user[key]);
														res=((messages) => {
															return (messages.length!=0)?pd.constants.app.message.invalid.field.delete[pd.lang]+'<br>'+messages.join('<br>'):''
														})(res.shape((item) => (item.id==fieldinfo.id)?item.message:PD_THROW));
														if (res) callback(res);
														else
														{
															index++;
															if (index<fieldinfos.length) error(index,fieldinfos,callback);
															else callback('');
														}
													};
													((fieldinfos) => {
														var finish=() => {
															/* move the guide to top level element */
															this.menus.form.contents.elm('.pd-kumaneko-drag').insertBefore(this.menus.form.contents.elm('.pd-kumaneko-drag-guide'),null);
															/* delete */
															element.parentNode.removeChild(element);
														};
														if (fieldinfos.length!=0)
														{
															error(0,fieldinfos,(message) => {
																if (message) pd.alert(message);
																else finish();
																this.menus.form.lib.remodel();
															});
														}
														else
														{
															finish();
															this.menus.form.lib.remodel();
														}
													})((() => {
														var res=[];
														switch (fieldinfo.type)
														{
															case 'box':
																res=this.app.layout.reduce((result,current) => {
																	if (current.id==fieldinfo.id)
																		current.rows.each((row,index) => {
																			Array.prototype.push.apply(result,row.fields.map((item) => this.app.fields[item]));
																		});
																	return result;
																},[]);
																break;
															case 'table':
																res=Object.values(fieldinfo.fields).concat(fieldinfo);
																break;
															default:
																res.push(fieldinfo);
																break;
														}
														return res;
													})());
												})
												.catch((error) => pd.alert(error.message));
											});
										})
									);
								}
								if (addduplicate)
								{
									/* modify elements */
									element.append(
										pd.create('button').addclass('pd-icon pd-icon-duplicate pd-kumaneko-drag-button')
										.on('touchstart,mousedown',(e) => {
											e.stopPropagation();
										})
										.on('click',(e) => {
											/* duplicate field */
											((parent) => {
												pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'field'},true)
												.then((resp) => {
													parent.parentNode.insertBefore(
														this.menus.form.lib.create({id:'row',type:'row'})
														.append(
															this.menus.form.lib.create(((fieldinfo) => {
																switch (fieldinfo.type)
																{
																	case 'address':
																		fieldinfo=pd.extend({
																			mapping:{
																				lat:'',
																				lng:''
																			}
																		},fieldinfo);
																		break;
																	case 'lookup':
																		fieldinfo=pd.extend({
																			app:'',
																			search:'',
																			query:'',
																			sort:'',
																			ignore:true,
																			criteria:[],
																			mapping:{},
																			table:[],
																			picker:[]
																		},fieldinfo);
																		break;
																	case 'postalcode':
																		fieldinfo=pd.extend({
																			mapping:{
																				prefecture:'',
																				prefecturename:'',
																				city:'',
																				cityname:'',
																				streetname:'',
																				address:'',
																				label:''
																			}
																		},fieldinfo);
																		break;
																}
																return fieldinfo;
															})(pd.extend({id:'field_'+resp.id.toString()+'_'},fieldinfo)))
														),
														parent.nextElementSibling
													);
													this.menus.form.lib.remodel();
												})
												.catch((error) => pd.alert(error.message));
											})((element.closest('.pd-box'))?element.closest('.pd-box'):element.parentNode);
										})
									);
								}
								if (addsetting)
								{
									/* build fieldbuilder */
									element.fieldbuilder=new pd.modules.builder.field(fieldinfo);
									/* modify elements */
									element.append(
										pd.create('button').addclass('pd-icon pd-icon-setting pd-kumaneko-drag-button')
										.on('touchstart,mousedown',(e) => {
											e.stopPropagation();
										})
										.on('click',(e) => {
											/* show fieldbuilder */
											element.fieldbuilder.show(this.app.fields,parseFloat(element.css('width')),(width) => {
												switch (fieldinfo.type)
												{
													case 'box':
														element.elm('.pd-box-caption').html(fieldinfo.caption);
														break;
													case 'spacer':
														element.elm('.pd-field-value').html(fieldinfo.contents);
														break;
													case 'table':
														element.elm('.pd-box-caption').html(fieldinfo.caption);
														if (fieldinfo.nocaption) element.elm('.pd-box-caption').addclass('pd-hidden');
														else element.elm('.pd-box-caption').removeclass('pd-hidden');
														break;
													default:
														element.elm('.pd-field-caption').html(fieldinfo.caption);
														if (fieldinfo.nocaption) element.elm('.pd-field-caption').addclass('pd-hidden');
														else element.elm('.pd-field-caption').removeclass('pd-hidden');
														switch (fieldinfo.type)
														{
															case 'checkbox':
																element.elm('.pd-field-value').empty();
																fieldinfo.options.each((option,index) => {
																	element.elm('.pd-field-value')
																	.append(
																		pd.create('label')
																		.append(pd.create('input').attr('type','checkbox').attr('data-type',fieldinfo.type).val(option.option.value))
																		.append(pd.create('span').html(option.option.value))
																	);
																});
																break;
															case 'dropdown':
																element.elm('select').empty().assignoption(fieldinfo.options,'option','option')
																break;
															case 'number':
																((field) => {
																	if (fieldinfo.unit)
																	{
																		((unit) => {
																			if (fieldinfo.unitposition=='prefix') field.insertBefore(unit,field.elm('input'));
																			else field.insertBefore(unit,field.elm('input').nextElementSibling);
																		})((field.elm('.pd-unit'))?field.elm('.pd-unit').html(fieldinfo.unit):pd.create('span').addclass('pd-unit').html(fieldinfo.unit))
																	}
																	else
																	{
																		if (field.elm('.pd-unit')) field.removeChild(field.elm('.pd-unit'));
																	}
																})(element.elm('.pd-field-value'));
																break;
															case 'radio':
																element.elm('.pd-field-value').empty();
																fieldinfo.options.each((option,index) => {
																	element.elm('.pd-field-value')
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
															default:
																element.elms('input,select,textarea').each((element,index) => {
																	if (fieldinfo.lines) element.css({height:'calc('+(parseFloat(fieldinfo.lines)*1.5).toString()+'em + 2px)'});
																	else element.css({height:''});
																	if (fieldinfo.placeholder) element.attr('placeholder',fieldinfo.placeholder);
																	else element.removeattr('placeholder');
																});
																break;
														}
														break;
												}
												if (pd.isnumeric(width)) element.css({width:width+'px'});
												this.menus.form.lib.remodel();
											});
										})
									);
								}
								/* event */
								element
								.on('touchstart,mousedown',(e) => {
									if (element.hasAttribute('disabled'))
									{
										e.stopPropagation();
										e.preventDefault();
										return;
									}
									else
									{
										if (fieldinfo.type=='row')
											if (element.closest('.pd-box'))
											{
												e.stopPropagation();
												e.preventDefault();
												return;
											}
									}
									window.on('touchmove,mousemove',handler);
									e.stopPropagation();
									e.preventDefault();
								})
								.on('touchend,mouseup',(e) => {
									window.off('touchmove,mousemove',handler);
								});
								return element;
							},
							create:(fieldinfo,scope) => {
								var res=null;
								switch (fieldinfo.type)
								{
									case 'box':
									case 'table':
										res=pd.create('div').addclass((fieldinfo.type=='box')?'pd-box':'pd-box pd-flex').attr('field-type',fieldinfo.type)
										.append(
											pd.create('span').addclass('pd-box-caption').html(fieldinfo.caption)
										);
										break;
									case 'row':
										res=pd.create('div').addclass('pd-row pd-flex').attr('field-type',fieldinfo.type);
										break;
									default:
										res=pd.ui.field.create(fieldinfo).attr('field-type','field');
										switch (fieldinfo.type)
										{
											case 'id':
											case 'autonumber':
											case 'creator':
											case 'createdtime':
											case 'modifier':
											case 'modifiedtime':
												res.elm('.pd-guide').html(pd.constants.common.prompt.autofill[pd.lang]);
												break;
											case 'number':
												pd.ui.field.activate(res,{
													id:'appbuilder_'+this.menus.form.id,
													fields:(() => {
														var res={};
														res[fieldinfo.id]=fieldinfo;
														return res;
													})()
												});
												break;
										}
										res.css({width:(fieldinfo.id in this.app.styles)?this.app.styles[fieldinfo.id].width:'235px'});
										break;
								}
								return ((uniques) => {
									return this.menus.form.lib.activate(res,fieldinfo,scope,(fieldinfo.type!='row'),!uniques.includes(fieldinfo.type),(fieldinfo.type!='row'));
								})(['box','row','table','id','autonumber','creator','createdtime','modifier','modifiedtime']);
							},
							init:() => {
								this.menus.form.contents.elm('.pd-kumaneko-drag').insertBefore(this.menus.form.contents.elm('.pd-kumaneko-drag-guide'),null);
								pd.children(this.menus.form.contents.elm('.pd-kumaneko-drag')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide'))
									{
										if (element.fieldbuilder) pd.elm('body').removeChild(element.fieldbuilder.cover);
										element.elms('[field-type=field]').each((element,index) => {
											if (element.fieldbuilder) pd.elm('body').removeChild(element.fieldbuilder.cover);
										});
										element.parentNode.removeChild(element);
									}
								});
							},
							remodel:() => {
								this.app.fields={};
								this.app.styles={};
								this.app.layout=[];
								for (var key in this.menus.form.nav) this.menus.form.nav[key].removeattr('disabled');
								pd.children(this.menus.form.contents.elm('.pd-kumaneko-drag')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide'))
										switch (element.fieldinfo.type)
										{
											case 'box':
												this.app.layout.push({
													id:element.fieldinfo.id,
													type:'box',
													caption:element.fieldinfo.caption,
													rows:(() => {
														var res=[];
														element.elms('.pd-row').each((element,index) => {
															if (element.elm('[field-type=field]'))
																res.push({fields:(() => {
																	var res=[];
																	element.elms('[field-type=field]').each((element,index) => {
																		if (['id','autonumber','creator','createdtime','modifier','modifiedtime'].includes(element.fieldinfo.type))
																			this.menus.form.nav[element.fieldinfo.id].attr('disabled','disabled');
																		res.push(element.fieldinfo.id);
																		this.app.fields[element.fieldinfo.id]=element.fieldinfo;
																		this.app.styles[element.fieldinfo.id]={width:element.css('width')};
																	});
																	return res;
																})()});
														});
														return res;
													})()
												});
												break;
											case 'row':
												if (element.elm('[field-type=field]'))
													this.app.layout.push({
														type:'row',
														fields:(() => {
															var res=[];
															element.elms('[field-type=field]').each((element,index) => {
																switch (element.fieldinfo.type)
																{
																	case 'number':
																		element.elm('.pd-field-value').dispatchEvent(new Event('show'));
																		break;
																	default:
																		if (['id','autonumber','creator','createdtime','modifier','modifiedtime'].includes(element.fieldinfo.type))
																			this.menus.form.nav[element.fieldinfo.id].attr('disabled','disabled');
																		break;
																}
																res.push(element.fieldinfo.id);
																this.app.fields[element.fieldinfo.id]=element.fieldinfo;
																this.app.styles[element.fieldinfo.id]={width:element.css('width')};
															});
															return res;
														})()
													});
												break;
											case 'table':
												if (element.elm('[field-type=field]'))
													((table) => {
														this.app.layout.push({
															id:element.fieldinfo.id,
															type:'table'
														});
														element.elms('[field-type=field]').each((element,index) => {
															switch (element.fieldinfo.type)
															{
																case 'number':
																	element.elm('.pd-field-value').dispatchEvent(new Event('show'));
																	break;
															}
															table.fields[element.fieldinfo.id]=element.fieldinfo;
															this.app.styles[element.fieldinfo.id]={width:element.css('width')};
														});
													})((() => {
														element.fieldinfo.fields={};
														return this.app.fields[element.fieldinfo.id]=element.fieldinfo;
													})());
												break;
										}
								});
							}
						},
						nav:{}
					},
					views:{
						id:'views',
						app:{},
						contents:null,
						tab:null,
						builder:null,
						lib:{
							create:(view) => {
								var res=pd.create('div').addclass('pd-row').attr('field-type','row');
								var handler=(e) => {
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									pd.event.call(
										'appbuilder',
										'pd.drag.start',
										{
											element:res,
											menu:this.menus.views,
											page:{
												x:pointer.pageX,
												y:pointer.pageY
											}
										}
									);
									window.off('touchmove,mousemove',handler);
								};
								var setup=(view) => {
									res.view=view;
									res.elm('.pd-kumaneko-drag-label').empty()
									.append(pd.create('span').css({display:'inline-block',width:'5.5em'}).html(pd.constants.app.caption.view.abbreviation[view.type][pd.lang]))
									.append(pd.create('span').css({display:'inline-block',width:'calc(100% - 5.5em)'}).html(view.name));
									return res;
								};
								/* setup properties */
								res.view=view;
								/* modify elements */
								res
								.append(
									pd.create('button').addclass('pd-icon pd-icon-edit pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										/* show viewbuilder */
										this.menus.views.builder.show(this.app.id,res.view,this.app.fields,(view) => {
											setup(view);
											this.menus.views.lib.remodel();
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-copy pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'view'},true)
										.then((resp) => {
											res.parentNode.insertBefore(this.menus.views.lib.create(pd.extend({id:resp.id.toString(),name:res.view.name+' Copy'},res.view)),res.nextElementSibling);
											this.menus.views.lib.remodel();
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-del pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
											.then((resp) => {
												var config=resp.file;
												if (config.dashboard.frames.map((item) => item.panels).flat().filter((item) => (item.app==this.app.id && item.view==res.view.id)).length==0)
												{
													res.parentNode.removeChild(res);
													this.menus.views.lib.remodel();
												}
												else pd.alert(pd.constants.app.message.invalid.dashboard.view[pd.lang]);
											})
											.catch((error) => pd.alert(error.message));
										});
									})
								)
								.append(pd.create('span').addclass('pd-kumaneko-drag-label'));
								/* event */
								res
								.on('touchstart,mousedown',(e) => {
									window.on('touchmove,mousemove',handler);
									e.stopPropagation();
									e.preventDefault();
								})
								.on('touchend,mouseup',(e) => {
									window.off('touchmove,mousemove',handler);
								});
								return setup(view);
							},
							init:() => {
								this.menus.views.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(this.menus.views.contents.elm('.pd-kumaneko-drag-guide'),null);
								pd.children(this.menus.views.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
								});
							},
							remodel:() => {
								this.app.views=[];
								pd.children(this.menus.views.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) this.app.views.push(element.view);
								});
							}
						}
					},
					linkages:{
						id:'linkages',
						app:{},
						contents:null,
						tab:null,
						builder:null,
						lib:{
							create:(linkage) => {
								var res=pd.create('div').addclass('pd-row').attr('field-type','row');
								var handler=(e) => {
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									pd.event.call(
										'appbuilder',
										'pd.drag.start',
										{
											element:res,
											menu:this.menus.linkages,
											page:{
												x:pointer.pageX,
												y:pointer.pageY
											}
										}
									);
									window.off('touchmove,mousemove',handler);
								};
								var setup=(linkage) => {
									res.linkage=linkage;
									res.elm('.pd-kumaneko-drag-label').empty().append(pd.create('span').html(linkage.name));
									return res;
								};
								/* setup properties */
								res.linkage=linkage;
								/* modify elements */
								res
								.append(
									pd.create('button').addclass('pd-icon pd-icon-edit pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										/* show linkagebuilder */
										this.menus.linkages.builder.show(res.linkage,this.app.fields,this.app.layout,(linkage) => {
											setup(linkage);
											this.menus.linkages.lib.remodel();
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-copy pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'linkage'},true)
										.then((resp) => {
											res.parentNode.insertBefore(this.menus.linkages.lib.create(pd.extend({id:resp.id.toString(),name:res.linkage.name+' Copy'},res.linkage)),res.nextElementSibling);
											this.menus.linkages.lib.remodel();
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-del pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											res.parentNode.removeChild(res);
											this.menus.linkages.lib.remodel();
										});
									})
								)
								.append(pd.create('span').addclass('pd-kumaneko-drag-label'));
								/* event */
								res
								.on('touchstart,mousedown',(e) => {
									window.on('touchmove,mousemove',handler);
									e.stopPropagation();
									e.preventDefault();
								})
								.on('touchend,mouseup',(e) => {
									window.off('touchmove,mousemove',handler);
								});
								return setup(linkage);
							},
							init:() => {
								this.menus.linkages.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(this.menus.linkages.contents.elm('.pd-kumaneko-drag-guide'),null);
								pd.children(this.menus.linkages.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
								});
							},
							remodel:() => {
								this.app.linkages=[];
								pd.children(this.menus.linkages.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) this.app.linkages.push(element.linkage);
								});
							}
						}
					},
					permissions:{
						id:'permissions',
						app:{},
						contents:null,
						tab:null
					},
					customize:{
						id:'customize',
						app:{},
						contents:null,
						tab:null
					},
					actions:{
						id:'actions',
						app:{},
						contents:null,
						tab:null,
						builder:null,
						lib:{
							create:(action) => {
								var res=pd.create('div').addclass('pd-row').attr('field-type','row');
								var handler=(e) => {
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									pd.event.call(
										'appbuilder',
										'pd.drag.start',
										{
											element:res,
											menu:this.menus.actions,
											page:{
												x:pointer.pageX,
												y:pointer.pageY
											}
										}
									);
									window.off('touchmove,mousemove',handler);
								};
								var setup=(action) => {
									res.action=action;
									res.elm('.pd-kumaneko-drag-label').empty()
									.append(pd.create('span').css({display:'inline-block',width:'5em'}).html(pd.constants.app.caption.action.abbreviation[action.trigger][pd.lang]))
									.append(pd.create('span').css({display:'inline-block',width:'calc(100% - 5em)'}).html(action.name));
									return res;
								};
								/* setup properties */
								res.action=action;
								/* modify elements */
								res
								.append(
									pd.create('button').addclass('pd-icon pd-icon-edit pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										/* show actionbuilder */
										this.menus.actions.builder.show(res.action,this.app.fields,this.app.layout,(action) => {
											setup(action);
											this.menus.actions.lib.remodel();
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-copy pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'action'},true)
										.then((resp) => {
											res.parentNode.insertBefore(this.menus.actions.lib.create(pd.extend({id:resp.id.toString(),name:res.action.name+' Copy'},res.action)),res.nextElementSibling);
											this.menus.actions.lib.remodel();
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-del pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											if (this.app.injectors.some((item) => item.saving.action.includes(res.action.id))) pd.alert(pd.constants.app.message.invalid.action.delete[pd.lang]);
											else
											{
												res.parentNode.removeChild(res);
												this.menus.actions.lib.remodel();
											}
										});
									})
								)
								.append(pd.create('span').addclass('pd-kumaneko-drag-label'));
								/* event */
								res
								.on('touchstart,mousedown',(e) => {
									window.on('touchmove,mousemove',handler);
									e.stopPropagation();
									e.preventDefault();
								})
								.on('touchend,mouseup',(e) => {
									window.off('touchmove,mousemove',handler);
								});
								return setup(action);
							},
							init:() => {
								this.menus.actions.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(this.menus.actions.contents.elm('.pd-kumaneko-drag-guide'),null);
								pd.children(this.menus.actions.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
								});
							},
							remodel:() => {
								this.app.actions=[];
								pd.children(this.menus.actions.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) this.app.actions.push(element.action);
								});
							}
						}
					},
					injectors:{
						id:'injectors',
						app:{},
						contents:null,
						tab:null,
						builder:null,
						lib:{
							create:(injector) => {
								var res=pd.create('div').addclass('pd-row').attr('field-type','row');
								var handler=(e) => {
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									pd.event.call(
										'appbuilder',
										'pd.drag.start',
										{
											element:res,
											menu:this.menus.injectors,
											page:{
												x:pointer.pageX,
												y:pointer.pageY
											}
										}
									);
									window.off('touchmove,mousemove',handler);
								};
								var setup=(injector) => {
									res.injector=injector;
									res.elm('.pd-kumaneko-drag-label').empty().append(pd.create('span').html(injector.title));
									pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
									.then((resp) => {
										if (this.app.id in resp.file.apps.user)
											if (resp.file.apps.user[this.app.id].injectors.some((item) => item.id==res.injector.id)) res.elm('.pd-icon-open').css({pointerEvents:'initial'}).removeattr('disabled');
									})
									.catch((error) => pd.alert(error.message));
									return res;
								};
								/* setup properties */
								res.injector=injector;
								/* modify elements */
								res
								.append(
									pd.create('button').addclass('pd-icon pd-icon-edit pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										/* show injectorbuilder */
										this.menus.injectors.builder.show(res.injector,this.app.fields,this.app,(injector) => {
											setup(injector);
											this.menus.injectors.lib.remodel();
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-copy pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'injector'},true)
										.then((resp) => {
											res.parentNode.insertBefore(this.menus.injectors.lib.create(pd.extend({id:resp.id.toString(),title:res.injector.title+' Copy',directory:''},res.injector)),res.nextElementSibling);
											this.menus.injectors.lib.remodel();
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-del pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											res.parentNode.removeChild(res);
											this.menus.injectors.lib.remodel();
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-open pd-kumaneko-drag-button').attr('disabled','disabled')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => window.open(location.protocol+'//'+location.host+location.pathname.replace(/\/[^\/]*$/,'')+'/'+res.injector.directory+'/?lang='+pd.lang))
								)
								.append(pd.create('span').addclass('pd-kumaneko-drag-label'));
								/* event */
								res
								.on('touchstart,mousedown',(e) => {
									window.on('touchmove,mousemove',handler);
									e.stopPropagation();
									e.preventDefault();
								})
								.on('touchend,mouseup',(e) => {
									window.off('touchmove,mousemove',handler);
								});
								return setup(injector);
							},
							init:() => {
								this.menus.injectors.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(this.menus.injectors.contents.elm('.pd-kumaneko-drag-guide'),null);
								pd.children(this.menus.injectors.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
								});
							},
							remodel:() => {
								this.app.injectors=[];
								pd.children(this.menus.injectors.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) this.app.injectors.push(element.injector);
								});
							}
						}
					},
					deduplications:{
						id:'deduplications',
						app:{},
						contents:null,
						tab:null,
						builder:null,
						lib:{
							create:(deduplication) => {
								var res=pd.create('div').addclass('pd-row').attr('field-type','row');
								var handler=(e) => {
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									pd.event.call(
										'appbuilder',
										'pd.drag.start',
										{
											element:res,
											menu:this.menus.deduplications,
											page:{
												x:pointer.pageX,
												y:pointer.pageY
											}
										}
									);
									window.off('touchmove,mousemove',handler);
								};
								var setup=(deduplication) => {
									res.deduplication=deduplication;
									res.elm('.pd-kumaneko-drag-label').empty().append(pd.create('span').html(deduplication.name));
									return res;
								};
								/* setup properties */
								res.deduplication=deduplication;
								/* modify elements */
								res
								.append(
									pd.create('button').addclass('pd-icon pd-icon-edit pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										/* show deduplicationbuilder */
										this.menus.deduplications.builder.show(res.deduplication,this.app.fields,this.app.layout,(deduplication) => {
											setup(deduplication);
											this.menus.deduplications.lib.remodel();
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-copy pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'deduplication'},true)
										.then((resp) => {
											res.parentNode.insertBefore(this.menus.deduplications.lib.create(pd.extend({id:resp.id.toString(),name:res.deduplication.name+' Copy'},res.deduplication)),res.nextElementSibling);
											this.menus.deduplications.lib.remodel();
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-del pd-kumaneko-drag-button')
									.on('touchstart,mousedown',(e) => {
										e.stopPropagation();
									})
									.on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											res.parentNode.removeChild(res);
											this.menus.deduplications.lib.remodel();
										});
									})
								)
								.append(pd.create('span').addclass('pd-kumaneko-drag-label'));
								/* event */
								res
								.on('touchstart,mousedown',(e) => {
									window.on('touchmove,mousemove',handler);
									e.stopPropagation();
									e.preventDefault();
								})
								.on('touchend,mouseup',(e) => {
									window.off('touchmove,mousemove',handler);
								});
								return setup(deduplication);
							},
							init:() => {
								this.menus.deduplications.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(this.menus.deduplications.contents.elm('.pd-kumaneko-drag-guide'),null);
								pd.children(this.menus.deduplications.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
								});
							},
							remodel:() => {
								this.app.deduplications=[];
								pd.children(this.menus.deduplications.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) this.app.deduplications.push(element.deduplication);
								});
							}
						}
					},
					deletion:{
						id:'deletion',
						app:{},
						contents:null,
						tab:null
					}
				};
				this.queues={
					delete:[]
				};
				/* modify elements */
				this.header.addclass('pd-kumaneko-builder-header')
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-title').html('App Settings'))
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-id'));
				this.container.css({
					height:'calc(100% - 1em)',
					width:'calc(100% - 1em)'
				});
				this.contents.addclass('pd-kumaneko-appbuilder').css({
					padding:'0'
				})
				.append(
					pd.ui.field.create({
						id:'name',
						type:'text',
						caption:'',
						required:false,
						nocaption:true,
						placeholder:pd.constants.app.prompt.name[pd.lang],
						format:'text'
					}).addclass('pd-kumaneko-appbuilder-name')
				)
				.append(
					pd.create('button').addclass('pd-button pd-activate pd-kumaneko-button pd-kumaneko-appbuilder-button').html(pd.constants.app.caption.button.update[pd.lang]).on('click',(e) => {
						this.get().then((resp) => {
							if (!resp.error)
								((app) => {
									pd.event.call(app.id,'pd.settings.edit.submit',{
										app:((app) => {
											delete app.permissions;
											delete app.customize;
											delete app.actions;
											delete app.injectors;
											delete app.deduplications;
											return app;
										})(pd.extend({},app))
									})
									.then((param) => {
										if (!param.error)
										{
											pd.request(pd.ui.baseuri()+'/config.php','GET',{},{verify:'verify'},true)
											.then((resp) => {
												if (resp.result=='ok')
												{
													pd.kumaneko.task('delete',this.queues).then(() => {
														pd.event.call('0','pd.app.altered',{app:app});
														this.hide();
													});
												}
												else pd.alert(pd.constants.common.message.invalid.config.updating[pd.lang]);
											})
											.catch((error) => pd.alert(error.message));
										}
									});
								})(resp.app);
						});
					})
				)
				.append(pd.create('button').addclass('pd-button pd-cancel pd-kumaneko-button pd-kumaneko-appbuilder-button').html(pd.constants.app.caption.button.discard[pd.lang]).on('click',(e) => this.hide()))
				.append(
					pd.kumaneko.tab.setup(
						pd.create('main').addclass('pd-kumaneko-main')
						.append(pd.create('div').addclass('pd-hidden pd-kumaneko-tab-scroller pd-kumaneko-border-left pd-kumaneko-inset-left'))
						.append(pd.create('section').addclass('pd-kumaneko-tab').attr('id','pd-kumaneko-appbuilder-space-tab'))
						.append(pd.create('section').addclass('pd-kumaneko-block pd-kumaneko-border-top').attr('id','pd-kumaneko-appbuilder-space-contents'))
					)
				);
				for (var key in this.menus)
					((menu) => {
						menu.contents=pd.create('div').addclass('pd-scope pd-kumaneko-block').attr('form-id','form_appbuilder_'+menu.id);
						menu.tab=new pd.modules.tab(pd.constants.app.caption.tab[menu.id][pd.lang]);
						menu.tab.container.on('click',(e) => {
							for (var key in this.menus)
							{
								if (key==menu.id)
								{
									this.menus[key].contents.show();
									this.menus[key].tab.activate();
								}
								else
								{
									this.menus[key].contents.hide();
									this.menus[key].tab.deactivate();
								}
							}
							pd.kumaneko.tab.activate(menu.tab);
							e.stopPropagation();
							e.preventDefault();
						});
						menu.tab.close.hide();
						switch (menu.id)
						{
							case 'form':
								menu.contents
								.append(
									pd.create('nav').addclass('pd-kumaneko-nav')
									.append(
										((nav) => {
											var fields=[
												{type:'text',icon:'text'},
												{type:'textarea',icon:'textarea'},
												{type:'number',icon:'number'},
												{type:'date',icon:'date'},
												{type:'datetime',icon:'datetime'},
												{type:'time',icon:'time'},
												{type:'radio',icon:'radio'},
												{type:'dropdown',icon:'dropdown'},
												{type:'checkbox',icon:'checkbox'},
												{type:'file',icon:'file'},
												{type:'user',icon:'user'},
												{type:'department',icon:'department'},
												{type:'group',icon:'group'},
												{type:'lookup',icon:'lookup'},
												{type:'postalcode',icon:'postalcode'},
												{type:'address',icon:'address'},
												{type:'color',icon:'color'},
												{type:'canvas',icon:'canvas'},
												{type:'table',icon:'table'},
												{type:'spacer',icon:'spacer'},
												{type:'box',icon:'box'},
												{type:'id',icon:'number'},
												{type:'autonumber',icon:'number'},
												{type:'creator',icon:'user'},
												{type:'createdtime',icon:'datetime'},
												{type:'modifier',icon:'user'},
												{type:'modifiedtime',icon:'datetime'}
											];
											fields.each((field,index) => {
												((fieldinfo,icon) => {
													nav.append(
														pd.create('div').addclass('pd-kumaneko-nav-button pd-kumaneko-border-bottom')
														.append(
															((res) => {
																if (fieldinfo.type=='text') res.addclass('pd-kumaneko-border-top')
																this.menus.form.nav[fieldinfo.id]=res;
																return menu.lib.activate(res,fieldinfo)
																.append(pd.create('button').addclass('pd-icon pd-icon-'+icon+' pd-kumaneko-nav-icon'))
																.append(pd.create('span').addclass('pd-kumaneko-nav-button-item-label').html(fieldinfo.type));
															})(pd.create('span').addclass('pd-kumaneko-nav-button-item'))
														)
													);
													if (fieldinfo.type=='postalcode')
														if (pd.lang!='ja') pd.children(nav).last().hide();
												})((() => {
													var res={
														id:'',
														type:field.type,
														caption:field.type,
														required:false,
														nocaption:false
													};
													switch (field.type)
													{
														case 'address':
															res=pd.extend({
																placeholder:'',
																mapping:{
																	lat:'',
																	lng:''
																}
															},res);
															break;
														case 'box':
															delete res.required;
															delete res.nocaption;
															break;
														case 'checkbox':
														case 'radio':
															res=pd.extend({
																options:[
																	{option:{value:'option1'}},
																	{option:{value:'option2'}}
																]
															},res);
															break;
														case 'dropdown':
															res=pd.extend({
																options:[
																	{option:{value:''}},
																	{option:{value:'option1'}},
																	{option:{value:'option2'}}
																]
															},res);
															break;
														case 'lookup':
															res=pd.extend({
																placeholder:'',
																app:'',
																search:'',
																query:'',
																sort:'',
																ignore:true,
																criteria:[],
																mapping:{},
																table:[],
																picker:[]
															},res);
															break;
														case 'number':
															res=pd.extend({
																placeholder:'',
																demiliter:false,
																decimals:'',
																unit:'',
																unitposition:'suffix'
															},res);
															break;
														case 'postalcode':
															res=pd.extend({
																placeholder:'',
																mapping:{
																	prefecture:'',
																	prefecturename:'',
																	city:'',
																	cityname:'',
																	streetname:'',
																	address:'',
																	label:''
																}
															},res);
															break;
														case 'spacer':
															delete res.required;
															res=pd.extend({
																nocaption:true,
																multiuse:false,
																contents:pd.constants.app.prompt.spacer[pd.lang]
															},res);
															break;
														case 'table':
															delete res.required;
															res=pd.extend({
																fields:{}
															},res);
															break;
														case 'text':
															res=pd.extend({
																placeholder:'',
																format:'text'
															},res);
															break;
														case 'textarea':
															res=pd.extend({
																placeholder:'',
																lines:''
															},res);
															break;
														case 'id':
															res.id='__id';
															break;
														case 'autonumber':
															res=pd.extend({
																id:'__autonumber',
																fixed:'10',
																group:[]
															},res);
															break;
														case 'creator':
															res.id='__creator';
															break;
														case 'createdtime':
															res.id='__createdtime';
															break;
														case 'modifier':
															res.id='__modifier';
															break;
														case 'modifiedtime':
															res.id='__modifiedtime';
															break;
													}
													return res;
												})(),field.icon);
											});
											return nav;
										})(pd.create('div').addclass('pd-kumaneko-nav-main'))
									)
								)
								.append(
									pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left')
									.append(
										pd.create('div').addclass('pd-container')
										.append(
											((container,guide) => {
												let observer=new MutationObserver(() => {
													if (guide.visible()) container.addclass('pd-dragging');
													else container.removeclass('pd-dragging');
												});
												observer.observe(guide,{attributes:true});
												return container.append(guide);
											})(pd.create('div').addclass('pd-contents pd-kumaneko-drag').attr('field-type','form'),pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
										)
									)
								);
								/* drag event */
								pd.event.on('appbuilder_'+menu.id,'pd.drag.start',(e) => {
									var keep={
										element:((fieldinfo) => {
											var res=null;
											switch (fieldinfo.id)
											{
												case '':
													break;
												case '__id':
												case '__autonumber':
												case '__creator':
												case '__createdtime':
												case '__modifier':
												case '__modifiedtime':
													res=(e.element.hasclass('pd-field'))?e.element:null;
													break;
												default:
													res=e.element;
													break;
											}
											return res;
										})(e.element.fieldinfo),
										fieldinfo:pd.extend({},e.element.fieldinfo),
										guide:menu.contents.elm('.pd-kumaneko-drag-guide'),
										scope:e.scope
									};
									var handler={
										move:(e) => {
											var element=document.elementFromPoint(e.pageX,e.pageY);
											if (element)
											{
												if (element!=keep.guide)
													((rect,containers,uniques) => {
														var guide={
															nesting:(parent) => {
																var references=pd.children(parent).filter((item) => {
																	var rect=item.getBoundingClientRect();
																	return !item.hasclass('pd-kumaneko-drag-guide') && (e.pageY<rect.top+rect.height*0.5);
																});
																if (references.length==0) guide.setup(parent,null);
																else guide.setup(parent,references.first());
															},
															setup:(parent,reference) => {
																switch (parent.attr('field-type'))
																{
																	case 'box':
																	case 'form':
																		keep.guide.css({height:''});
																		break;
																	case 'row':
																	case 'table':
																		keep.guide.css({height:parent.innerheight().toString()+'px'});
																		break;
																}
																parent.insertBefore(keep.guide.removeclass('pd-hidden'),reference);
															}
														};
														switch (element.attr('field-type'))
														{
															case 'box':
																if (keep.scope && keep.scope!='form') return;
																if (!containers.includes(keep.fieldinfo.type)) guide.nesting(element);
																else guide.setup(element.parentNode,element.nextElementSibling);
																break;
															case 'field':
																if (keep.scope)
																{
																	switch (keep.scope)
																	{
																		case 'form':
																			if (element.parentNode.attr('field-type')=='table') return;
																			break;
																		default:
																			if (element.closest('.pd-box'))
																			{
																				if (element.closest('.pd-box').fieldinfo.id!=keep.scope) return;
																			}
																			else return;
																			break;
																	}
																}
																if (!containers.includes(keep.fieldinfo.type))
																{
																	if (element.parentNode.attr('field-type')=='table')
																		if (uniques.includes(keep.fieldinfo.type)) return;
																	if (e.pageX<rect.left+rect.width*0.5) guide.setup(element.parentNode,element);
																	else guide.setup(element.parentNode,element.nextElementSibling);
																}
																else
																{
																	if (element.closest('.pd-box')) guide.setup(element.closest('.pd-box').parentNode,element.closest('.pd-box').nextElementSibling);
																	else guide.setup(element.parentNode.parentNode,element.parentNode.nextElementSibling);
																}
																break;
															case 'form':
																if (keep.scope && keep.scope!='form') return;
																guide.nesting(element);
																break;
															case 'row':
																if (keep.scope && keep.scope!='form') return;
																if (!containers.includes(keep.fieldinfo.type)) guide.setup(element,null);
																else
																{
																	if (element.closest('.pd-box')) guide.setup(element.closest('.pd-box').parentNode,element.closest('.pd-box').nextElementSibling);
																	else guide.setup(element.parentNode,element.nextElementSibling);
																}
																break;
															case 'table':
																if (keep.scope=='form') return;
																else
																{
																	if (keep.scope && keep.scope!=element.fieldinfo.id) return;
																}
																if (!containers.concat(uniques).includes(keep.fieldinfo.type))
																{
																	if (element!=keep.guide.parentNode || !keep.guide.visible()) guide.setup(element,null);
																}
																else guide.setup(element.parentNode,element.nextElementSibling);
																break;
															default:
																if (!keep.element) keep.guide.addclass('pd-hidden');
																break;
														}
													})(element.getBoundingClientRect(),['box','row','table'],['id','autonumber','creator','createdtime','modifier','modifiedtime','spacer']);
											}
											else
											{
												if (!keep.element) keep.guide.addclass('pd-hidden');
											}
										},
										end:(e) => {
											if (keep.guide.visible())
											{
												var setup=() => {
													return new Promise((resolve,reject) => {
														if (!keep.element)
														{
															if (!keep.fieldinfo.id)
															{
																pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'field'},true)
																.then((resp) => {
																	keep.fieldinfo.id='field_'+resp.id.toString()+'_';
																	resolve(menu.lib.create(keep.fieldinfo));
																})
																.catch((error) => {
																	pd.alert(error.message,() => {
																		resolve();
																	});
																});
															}
															else resolve(menu.lib.create(keep.fieldinfo));
														}
														else resolve(keep.element.removeclass('pd-hidden'));
													});
												}
												((row) => {
													if (!['box','row','table'].includes(keep.fieldinfo.type))
														if (['box','form'].includes(keep.guide.parentNode.attr('field-type')))
														{
															keep.guide.parentNode.insertBefore(row,keep.guide.nextElementSibling);
															row.append(keep.guide);
														}
													setup().then((element) => {
														if (element) keep.guide.parentNode.insertBefore(element,keep.guide.nextElementSibling);
														keep.guide.addclass('pd-hidden');
														menu.lib.remodel();
													});
												})(menu.lib.create({id:'row',type:'row'}));
											}
											else
											{
												if (keep.element) keep.element.removeclass('pd-hidden');
											}
											window.off('mousemove,touchmove',handler.move);
											window.off('mouseup,touchend',handler.end);
											e.stopPropagation();
											e.preventDefault();
										}
									};
									if (keep.element)
									{
										((rect) => {
											keep.guide.css({height:rect.height.toString()+'px',width:rect.width.toString()+'px'});
											keep.element.addclass('pd-hidden').parentNode.insertBefore(keep.guide.removeclass('pd-hidden'),keep.element.nextElementSibling);
										})(keep.element.getBoundingClientRect());
									}
									else keep.guide.css({height:'',width:''});
									/* event */
									window.on('mousemove,touchmove',handler.move);
									window.on('mouseup,touchend',handler.end);
								});
								break;
							case 'views':
								menu.app={
									id:'appbuilder_'+menu.id,
									fields:{
										type:{
											id:'type',
											type:'radio',
											caption:'',
											required:true,
											nocaption:true,
											options:((map) => {
												var res=[
													{option:{value:'list'}},
													{option:{value:'calendar'}},
													{option:{value:'crosstab'}},
													{option:{value:'gantt'}},
													{option:{value:'timeseries'}},
													{option:{value:'kanban'}}
												];
												if (map) res.push({option:{value:'map'}});
												res.push({option:{value:'customize'}});
												return res;
											})(pd.map.loaded)
										}
									}
								};
								menu.builder=new pd.modules.builder.view();
								menu.contents.addclass('pd-container')
								.append(
									pd.create('div').css({padding:'0.25em 0'})
									.append(pd.ui.field.activate(((res) => {
										res.elms('[data-name='+menu.app.fields.type.id+']').each((element,index) => {
											element.closest('label').elm('span').html(pd.constants.app.caption.view.title[element.val()][pd.lang]);
										});
										return res;
									})(pd.ui.field.create(menu.app.fields.type)),menu.app))
									.append(
										pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.app.caption.button.add.view[pd.lang]).on('click',(e) => {
											/* show viewbuilder */
											((type) => {
												pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'view'},true)
												.then((resp) => {
													menu.builder.show(this.app.id,(() => {
														var res={
															id:resp.id.toString(),
															name:'New '+pd.constants.app.caption.view.name[type][pd.lang],
															type:type,
															fields:[],
															query:'',
															sort:''
														};
														switch (type)
														{
															case 'calendar':
																res.fields={
																	date:'',
																	title:''
																};
																break;
															case 'crosstab':
																delete res.sort;
																res.chart={
																	type:'table'
																};
																res.fields={
																	column:{
																		field:'',
																		format:'',
																		sort:'asc'
																	},
																	rows:[],
																	value:{
																		field:'',
																		func:'CNT'
																	}
																};
																break;
															case 'gantt':
																res.fields={
																	column:{
																		period:'day',
																		width:64
																	},
																	rows:[],
																	task:{
																		start:'',
																		end:'',
																		title:''
																	}
																};
																break;
															case 'timeseries':
																delete res.sort;
																res.chart={
																	type:'table'
																};
																res.fields={
																	column:{
																		field:'',
																		period:''
																	},
																	rows:[],
																	values:[]
																};
																break;
															case 'kanban':
																res.fields={
																	groups:[],
																	task:{
																		title:'',
																		date:'',
																		width:200
																	}
																};
																break;
															case 'map':
																res.fields={
																	lat:'',
																	lng:'',
																	title:'',
																	color:'',
																	address:'',
																	postalcode:'',
																	handover:false
																};
																break;
														}
														return res;
													})(),this.app.fields,(view) => {
														menu.contents.elm('.pd-kumaneko-drag-vertical').append(menu.lib.create(view));
														menu.lib.remodel();
													});
												})
												.catch((error) => {
													pd.alert(error.message);
												});
											})(pd.record.get(menu.contents,menu.app,true).record.type.value)
										})
									)
								)
								.append(
									pd.create('div').addclass('pd-kumaneko-drag-vertical').attr('field-type','form')
									.append(pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
								);
								break;
							case 'linkages':
								menu.builder=new pd.modules.builder.linkage();
								menu.contents.addclass('pd-container')
								.append(
									pd.create('div').css({padding:'0.25em'})
									.append(
										pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.app.caption.button.add.linkage[pd.lang]).on('click',(e) => {
											/* show linkagebuilder */
											pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'linkage'},true)
											.then((resp) => {
												menu.builder.show({
													id:resp.id.toString(),
													name:'New '+pd.constants.app.caption.linkage[pd.lang],
													app:'',
													query:'',
													sort:'',
													criteria:[],
													display:[],
													bulk:{
														enable:false,
														caption:'',
														message:''
													}
												},this.app.fields,this.app.layout,(linkage) => {
													menu.contents.elm('.pd-kumaneko-drag-vertical').append(menu.lib.create(linkage));
													menu.lib.remodel();
												});
											})
											.catch((error) => {
												pd.alert(error.message);
											});
										})
									)
								)
								.append(
									pd.create('div').addclass('pd-kumaneko-drag-vertical').attr('field-type','form')
									.append(pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
								);
								break;
							case 'permissions':
								menu.app={
									id:'appbuilder_'+menu.id,
									fields:{
										owner:{
											id:'owner',
											type:'user',
											caption:pd.constants.app.caption.permissions.owner[pd.lang],
											required:false,
											nocaption:false
										},
										admin:{
											id:'admin',
											type:'user',
											caption:pd.constants.app.caption.permissions.admin[pd.lang],
											required:false,
											nocaption:false,
											unify:true
										},
										denied:{
											id:'denied',
											type:'user',
											caption:pd.constants.app.caption.permissions.denied[pd.lang],
											required:false,
											nocaption:false,
											unify:true
										}
									}
								};
								menu.contents.addclass('pd-container')
								.append(pd.ui.field.activate(pd.ui.field.create(menu.app.fields.owner).addclass('pd-readonly').css({width:'100%'}),menu.app))
								.append(pd.ui.field.activate(pd.ui.field.create(menu.app.fields.admin).css({width:'100%'}),menu.app))
								.append(pd.ui.field.activate(pd.ui.field.create(menu.app.fields.denied).css({width:'100%'}),menu.app));
								break;
							case 'customize':
								menu.app={
									id:'appbuilder_'+menu.id,
									fields:{
										customize:{
											id:'customize',
											type:'file',
											caption:pd.constants.app.caption.customize[pd.lang],
											accept:'text/javascript',
											dir:'customize',
											required:false,
											nocaption:false
										}
									}
								};
								menu.contents.addclass('pd-container').append(pd.ui.field.activate(pd.ui.field.create(menu.app.fields.customize),menu.app));
								/* queue event */
								pd.event.on('appbuilder_'+menu.id,'pd.file.delete.call',(e) => {
									((file) => {
										pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
										.then((resp) => {
											var config=resp.file;
											if (!(() => {
												var res=[];
												for (var key in config.apps.user)
													((app) => {
														if (app.id!=this.app.id) app.customize.each((customize,index) => res.push(customize.filekey));
													})(config.apps.user[key]);
												return res;
											})().includes(file.filekey)) this.queues.delete.push(file);
										})
										.catch((error) => pd.alert(error.message));
									})(e);
									return e;
								});
								break;
							case 'actions':
								menu.app={
									id:'appbuilder_'+menu.id,
									fields:{
										trigger:{
											id:'trigger',
											type:'radio',
											caption:'',
											required:true,
											nocaption:true,
											options:[
												{option:{value:'button'}},
												{option:{value:'value'}},
												{option:{value:'saving'}}
											]
										}
									}
								};
								menu.builder=new pd.modules.builder.action();
								menu.contents.addclass('pd-container')
								.append(
									pd.create('div').css({padding:'0.25em 0'})
									.append(pd.ui.field.activate(((res) => {
										res.elms('[data-name='+menu.app.fields.trigger.id+']').each((element,index) => {
											element.closest('label').elm('span').html(pd.constants.app.caption.action.title[element.val()][pd.lang]);
										});
										return res;
									})(pd.ui.field.create(menu.app.fields.trigger)),menu.app))
									.append(
										pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.app.caption.button.add.action[pd.lang]).on('click',(e) => {
											/* show actionbuilder */
											((trigger) => {
												pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'action'},true)
												.then((resp) => {
													menu.builder.show((() => {
														var res={
															id:resp.id.toString(),
															name:'New '+pd.constants.app.caption.action.name[trigger][pd.lang],
															trigger:trigger,
															filter:'',
															user:[]
														};
														switch (trigger)
														{
															case 'button':
																res=pd.extend({
																	caption:'',
																	message:'',
																	rows:{
																		del:[],
																		fill:[]
																	},
																	formula:[],
																	report:{
																		spreadsheet:'',
																		saveas:'',
																		store:'',
																		size:'',
																		orientation:'',
																		template:[]
																	},
																	transfer:{
																		app:'',
																		pattern:'insert',
																		criteria:[],
																		mapping:[]
																	},
																	mail:{
																		from:'',
																		to:'',
																		cc:'',
																		bcc:'',
																		attachment:'',
																		subject:'',
																		body:''
																	}
																},res);
																break;
															case 'saving':
																res=pd.extend({
																	suspend:{
																		message:'',
																		continue:false
																	}
																},res);
																break;
															case 'value':
																res=pd.extend({
																	rows:{
																		del:[],
																		fill:[]
																	},
																	formula:[],
																	style:[],
																	disabled:{
																		record:false,
																		fields:[]
																	},
																	hidden:[],
																	option:[]
																},res);
																break;
														}
														return res;
													})(),this.app.fields,this.app.layout,(action) => {
														menu.contents.elm('.pd-kumaneko-drag-vertical').append(menu.lib.create(action));
														menu.lib.remodel();
													});
												})
												.catch((error) => {
													pd.alert(error.message);
												});
											})(pd.record.get(menu.contents,menu.app,true).record.trigger.value)
										})
									)
								)
								.append(
									pd.create('div').addclass('pd-kumaneko-drag-vertical').attr('field-type','form')
									.append(pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
								);
								break;
							case 'injectors':
								menu.builder=new pd.modules.builder.injector();
								menu.contents.addclass('pd-container')
								.append(
									pd.create('div').css({padding:'0.25em'})
									.append(
										pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.app.caption.button.add.injector[pd.lang]).on('click',(e) => {
											/* show injectorbuilder */
											pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'injector'},true)
											.then((resp) => {
												menu.builder.show({
													id:resp.id.toString(),
													title:'New '+this.app.name+' Injector',
													description:'',
													directory:'',
													operator:'',
													colors:{
														body:'#a1cae3',
														button:'#e08e45'
													},
													saving:{
														action:[]
													},
													fields:[]
												},this.app.fields,this.app,(injector) => {
													menu.contents.elm('.pd-kumaneko-drag-vertical').append(menu.lib.create(injector));
													menu.lib.remodel();
												});
											})
											.catch((error) => {
												pd.alert(error.message);
											});
										})
									)
								)
								.append(
									pd.create('div').addclass('pd-kumaneko-drag-vertical').attr('field-type','form')
									.append(pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
								);
								break;
							case 'deduplications':
								menu.builder=new pd.modules.builder.deduplication();
								menu.contents.addclass('pd-container')
								.append(
									pd.create('div').css({padding:'0.25em'})
									.append(
										pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.app.caption.button.add.deduplication[pd.lang]).on('click',(e) => {
											/* show deduplicationbuilder */
											pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'deduplication'},true)
											.then((resp) => {
												menu.builder.show({
													id:resp.id.toString(),
													name:'New '+pd.constants.app.caption.deduplication[pd.lang],
													message:'',
													criteria:[]
												},this.app.fields,this.app.layout,(deduplication) => {
													menu.contents.elm('.pd-kumaneko-drag-vertical').append(menu.lib.create(deduplication));
													menu.lib.remodel();
												});
											})
											.catch((error) => {
												pd.alert(error.message);
											});
										})
									)
								)
								.append(
									pd.create('div').addclass('pd-kumaneko-drag-vertical').attr('field-type','form')
									.append(pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
								);
								break;
							case 'deletion':
								menu.contents.addclass('pd-container')
								.append(
									((res) => {
										res.elm('.pd-field-value')
										.append(
											pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.app.caption.button.delete[pd.lang]).on('click',(e) => {
												pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
													if (this.app.id)
													{
														pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
														.then((resp) => {
															var config=resp.file;
															var filekeys=[];
															var error=(() => {
																var res=[];
																config.dashboard.frames.map((item) => item.panels).flat().filter((item) => item.app==this.app.id).each((panel,index) => {
																	res.push('-&nbsp;'+config.apps.user[this.app.id].views.filter((item) => item.id==panel.view).first().name+'&nbsp;(Dashboard)');
																});
																for (var key in config.apps.user)
																	((app) => {
																		if (app.id!=this.app.id)
																		{
																			((fieldinfos) => {
																				for (var key in fieldinfos)
																					switch (fieldinfos[key].type)
																					{
																						case 'lookup':
																							if (fieldinfos[key].app==this.app.id) res.push('-&nbsp;'+fieldinfos[key].caption+'&nbsp;('+app.name+')');
																							break;
																					}
																			})(pd.ui.field.parallelize(app.fields));
																			app.linkages.each((linkage,index) => {
																				if (linkage.app==this.app.id) res.push('-&nbsp;'+linkage.name+'&nbsp;('+app.name+')');
																			});
																			app.customize.each((customize,index) => {
																				filekeys.push(customize.filekey);
																			});
																			app.actions.each((action,index) => {
																				switch (action.trigger)
																				{
																					case 'button':
																						if (action.transfer.app==this.app.id) res.push('-&nbsp;'+action.name+'&nbsp;('+app.name+')');
																						break;
																				}
																			});
																		}
																	})(config.apps.user[key]);
																return (res.length!=0)?pd.constants.app.message.invalid.delete[pd.lang]+'<br>'+res.join('<br>'):'';
															})();
															if (error) pd.alert(error);
															else
															{
																pd.request(pd.ui.baseuri()+'/config.php','GET',{},{verify:'verify'},true)
																.then((resp) => {
																	if (resp.result=='ok')
																	{
																		this.app.customize.each((customize,index) => {
																			if (!filekeys.includes(customize.filekey)) this.queues.delete.push({dir:'customize',filekey:customize.filekey});
																		});
																		pd.kumaneko.task('delete',this.queues).then(() => {
																			pd.event.call(this.app.id,'pd.app.deleted',{});
																			this.hide();
																		});
																	}
																	else pd.alert(pd.constants.common.message.invalid.config.updating[pd.lang]);
																})
																.catch((error) => pd.alert(error.message));
															}
														})
														.catch((error) => pd.alert(error.message));
													}
													else this.hide();
												});
											})
										);
										return res;
									})(pd.ui.field.create({
										id:'deletion',
										type:'spacer',
										caption:pd.constants.app.caption.delete[pd.lang],
										required:false,
										nocaption:false
									}).css({width:'100%'}))
								)
								.append(
									((res) => {
										res.elm('.pd-field-value')
										.append(
											pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.app.caption.button.truncate[pd.lang]).on('click',(e) => {
												pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
													if (this.app.id) pd.event.call(this.app.id,'pd.truncate.call',{}).then(() => this.hide()).catch(() => {});
													else this.hide();
												});
											})
										);
										return res;
									})(pd.ui.field.create({
										id:'truncate',
										type:'spacer',
										caption:pd.constants.app.caption.truncate[pd.lang],
										required:false,
										nocaption:false
									}).css({width:'100%'}))
								);
								break;
						}
						this.contents.elm('#pd-kumaneko-appbuilder-space-contents').append(menu.contents);
						this.contents.elm('#pd-kumaneko-appbuilder-space-tab').append(menu.tab.container);
					})(this.menus[key]);
				/* drag event */
				pd.event.on('appbuilder','pd.drag.start',(e) => {
					var keep={
						element:e.element,
						guide:e.menu.contents.elm('.pd-kumaneko-drag-guide'),
						menu:e.menu
					};
					var handler={
						move:(e) => {
							var element=document.elementFromPoint(e.pageX,e.pageY);
							if (element)
								if (element!=keep.guide)
									((rect) => {
										switch (element.attr('field-type'))
										{
											case 'row':
												element.parentNode.insertBefore(keep.guide.removeclass('pd-hidden'),(e.pageY<rect.top+rect.height*0.5)?element:element.nextElementSibling);
												break;
											case 'form':
												element.insertBefore(keep.guide.removeclass('pd-hidden'),null);
												break;
										}
									})(element.getBoundingClientRect());
						},
						end:(e) => {
							if (keep.guide.visible())
							{
								keep.guide.parentNode.insertBefore(keep.element.removeclass('pd-hidden'),keep.guide.nextElementSibling);
								keep.menu.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(keep.guide.addclass('pd-hidden'),null);
								keep.menu.lib.remodel();
							}
							else
							{
								keep.element.removeclass('pd-hidden');
								keep.menu.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(keep.guide.addclass('pd-hidden'),null);
							}
							window.off('mousemove,touchmove',handler.move);
							window.off('mouseup,touchend',handler.end);
							e.stopPropagation();
							e.preventDefault();
						}
					};
					((rect) => {
						keep.guide.css({height:rect.height.toString()+'px',width:rect.width.toString()+'px'});
						keep.element.addclass('pd-hidden').parentNode.insertBefore(keep.guide.removeclass('pd-hidden'),keep.element.nextElementSibling);
					})(keep.element.getBoundingClientRect());
					/* event */
					window.on('mousemove,touchmove',handler.move);
					window.on('mouseup,touchend',handler.end);
				});
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					var res={
						error:false,
						app:pd.extend({},this.app)
					};
					pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
					.then((resp) => {
						var config=resp.file;
						if (!this.contents.elm('.pd-kumaneko-appbuilder-name').elm('input').val())
						{
							res.error=true;
							pd.alert(pd.constants.app.message.invalid.name[pd.lang],() => {
								resolve(res);
							})
						}
						res.app.name=this.contents.elm('.pd-kumaneko-appbuilder-name').elm('input').val();
						((app,fieldinfos) => {
							var error='';
							/* get fields */
							error=(() => {
								var res={
									missing:[],
									used:[]
								};
								for (var key in fieldinfos)
									((fieldinfo) => {
										var added=false;
										switch (fieldinfo.type)
										{
											case 'address':
											case 'lookup':
											case 'postalcode':
												for (var key in fieldinfo.mapping)
													if (fieldinfo.mapping[key])
														if (fieldinfos[fieldinfo.mapping[key]].tableid!=fieldinfo.tableid)
														{
															res.missing.push('-&nbsp;'+fieldinfo.caption);
															added=true;
															break;
														}
												switch (fieldinfo.type)
												{
													case 'address':
														if (!added && !fieldinfo.mapping.lat)
														{
															res.missing.push('-&nbsp;'+fieldinfo.caption);
															break;
														}
														if (!added && !fieldinfo.mapping.lng)
														{
															res.missing.push('-&nbsp;'+fieldinfo.caption);
															break;
														}
														break;
													case 'lookup':
														if (!added && !fieldinfo.app)
														{
															res.missing.push('-&nbsp;'+fieldinfo.caption);
															break;
														}
														if (!added && !fieldinfo.search)
														{
															res.missing.push('-&nbsp;'+fieldinfo.caption);
															break;
														}
														if (!added)
														{
															fieldinfo.table.some((item) => {
																((tableid) => {
																	if (tableid==fieldinfo.tableid)
																	{
																		res.missing.push('-&nbsp;'+fieldinfo.caption);
																		added=true;
																	}
																	else
																	{
																		item.fields.some((item) => {
																			if (tableid!=fieldinfos[item.internal].tableid)
																			{
																				res.missing.push('-&nbsp;'+fieldinfo.caption);
																				added=true;
																			}
																			return added;
																		});
																	}
																})(item.id.internal);
																return added;
															});
														}
														if (!added)
															((app) => {
																if (app)
																{
																	((mapping) => {
																		if (Array.from(new Set(mapping)).some((item) => !(item in app.fields)))
																		{
																			res.missing.push('-&nbsp;'+fieldinfo.caption);
																			added=true;
																		}
																	})([
																		...fieldinfo.criteria.map((item) => item.external),
																		...Object.keys(fieldinfo.mapping),
																		...fieldinfo.picker,
																		...fieldinfo.table.map((item) => item.id.external),
																		fieldinfo.search
																	]);
																}
																else
																{
																	res.missing.push('-&nbsp;'+fieldinfo.caption);
																	added=true;
																}
															})(config.apps.user[fieldinfo.app]);
														if (!added)
															((fieldinfos) => {
																((mapping) => {
																	if (Array.from(new Set(mapping)).some((item) => !(item in fieldinfos))) res.missing.push('-&nbsp;'+fieldinfo.caption);
																})(fieldinfo.table.reduce((result,current) => result.concat(current.fields.map((item) => item.external)),[]));
															})(pd.ui.field.parallelize(config.apps.user[fieldinfo.app].fields));
														break;
												}
												break;
											case 'autonumber':
												fieldinfo.group.each((group,index) => {
													if (group)
														if (fieldinfos[group].tableid!=fieldinfo.tableid)
														{
															res.missing.push('-&nbsp;'+fieldinfo.caption);
															return PD_BREAK;
														}
												});
												break;
										}
									})(fieldinfos[key]);
								return ((missing,used) => {
									var res=[];
									if (missing.length!=0) res.push(pd.constants.app.message.invalid.field.missing[pd.lang]+'<br>'+missing.join('<br>'));
									if (used.length!=0) res.push(pd.constants.app.message.invalid.field.used[pd.lang]+'<br>'+used.join('<br>'));
									return res.join('<br><br>');
								})(res.missing,res.used);
							})();
							if (error)
							{
								res.error=true;
								pd.alert(error,() => {
									resolve(res);
								});
								return;
							}
							/* get deleted fields */
							error=(() => {
								var res=[];
								for (var key in config.apps.user)
									((app) => {
										if (app.id!=this.app.id)
										{
											((fields) => {
												for (var key in fields.external)
													((fieldinfo) => {
														switch (fieldinfo.type)
														{
															case 'lookup':
																if (fieldinfo.app==this.app.id)
																{
																	((mapping) => {
																		Array.from(new Set(mapping)).each((mapping,index) => {
																			if (!(mapping in fields.internal)) res.push('-&nbsp;'+fieldinfo.caption+'&nbsp;('+app.name+')');
																		});
																	})([
																		...fieldinfo.criteria.map((item) => item.external),
																		...Object.keys(fieldinfo.mapping),
																		...fieldinfo.picker,
																		...fieldinfo.table.reduce((result,current) => result.concat(current.fields.map((item) => item.external)),[]),
																		fieldinfo.search
																	]);
																	((mapping,tables) => {
																		Array.from(new Set(mapping)).each((mapping,index) => {
																			if (!tables.includes(mapping)) res.push('-&nbsp;'+fieldinfo.caption+'&nbsp;('+app.name+')');
																		});
																	})(fieldinfo.table.map((item) => item.id.external),Array.from(new Set(Object.values(fields.internal).map((item) => item.tableid))));
																}
																break;
														}
													})(fields.external[key]);
											})({
												external:pd.ui.field.parallelize(app.fields),
												internal:fieldinfos
											});
											app.linkages.each((linkage,index) => {
												if (linkage.app==this.app.id)
												{
													linkage.criteria.each((criteria,index) => {
														if (!(criteria.external in fieldinfos)) res.push('-&nbsp;'+linkage.name+'&nbsp;('+app.name+')');
													});
													linkage.display.each((display,index) => {
														if (!(display.external in fieldinfos)) res.push('-&nbsp;'+linkage.name+'&nbsp;('+app.name+')');
													});
												}
											});
											app.actions.each((action,index) => {
												switch (action.trigger)
												{
													case 'button':
														if (action.transfer.app==this.app.id)
														{
															action.transfer.criteria.each((criteria,index) => {
																if (!(criteria.external in fieldinfos)) res.push('-&nbsp;'+action.name+'&nbsp;('+app.name+')');
															});
															action.transfer.mapping.each((mapping,index) => {
																if (!(mapping.external in fieldinfos)) res.push('-&nbsp;'+action.name+'&nbsp;('+app.name+')');
															});
														}
														break;
												}
											});
										}
									})(config.apps.user[key]);
								return (res.length!=0)?pd.constants.app.message.invalid.field.delete[pd.lang]+'<br>'+res.join('<br>'):''
							})();
							if (error)
							{
								res.error=true;
								pd.alert(error,() => {
									resolve(res);
								});
								return;
							}
							/* get views */
							error=(() => {
								var res=[];
								app.views.each((view,index) => {
									switch (view.type)
									{
										case 'calendar':
											var tables=Array.from(new Set((() => {
												var res=[];
												if (view.fields.date) res.push(fieldinfos[view.fields.date].tableid);
												if (view.fields.title) res.push(fieldinfos[view.fields.title].tableid);
												return res;
											})()));
											if (tables.length>1)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											break;
										case 'crosstab':
											if ((view.fields.column.field in fieldinfos)?fieldinfos[view.fields.column.field].tableid:false)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											if ((view.fields.value.field in fieldinfos)?fieldinfos[view.fields.value.field].tableid:false)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											if (view.fields.rows.some((item) => (item.field in fieldinfos)?fieldinfos[item.field].tableid:false))
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											break;
										case 'gantt':
											if ((view.fields.task.start in fieldinfos)?fieldinfos[view.fields.task.start].tableid:false)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											if ((view.fields.task.end in fieldinfos)?fieldinfos[view.fields.task.end].tableid:false)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											if ((view.fields.task.title in fieldinfos)?fieldinfos[view.fields.task.title].tableid:false)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											if (view.fields.rows.some((item) => (item.field in fieldinfos)?fieldinfos[item.field].tableid:false))
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											break;
										case 'timeseries':
											if ((view.fields.column.field in fieldinfos)?fieldinfos[view.fields.column.field].tableid:false)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											if (view.fields.values.some((item) => (item.field in fieldinfos)?fieldinfos[item.field].tableid:false))
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											break;
										case 'kanban':
											var tables=Array.from(new Set((() => {
												var res=[];
												if (view.fields.task.title) res.push(fieldinfos[view.fields.task.title].tableid);
												if (view.fields.task.date) res.push(fieldinfos[view.fields.task.date].tableid);
												return res;
											})()));
											if (tables.length>1)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											break;
										case 'map':
											var tables=Array.from(new Set((() => {
												var res=[];
												if (view.fields.lat) res.push(fieldinfos[view.fields.lat].tableid);
												if (view.fields.lng) res.push(fieldinfos[view.fields.lng].tableid);
												if (view.fields.title) res.push(fieldinfos[view.fields.title].tableid);
												if (view.fields.color) res.push(fieldinfos[view.fields.color].tableid);
												if (view.fields.address) res.push(fieldinfos[view.fields.address].tableid);
												if (view.fields.postalcode) res.push(fieldinfos[view.fields.postalcode].tableid);
												return res;
											})()));
											if (tables.length>1)
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											else
											{
												if (view.fields.handover && tables.join(''))
												{
													res.push('-&nbsp;'+view.name);
													return PD_BREAK;
												}
											}
											break;
										default:
											if (view.fields.some((item) => (item in fieldinfos)?fieldinfos[item].tableid:false))
											{
												res.push('-&nbsp;'+view.name);
												return PD_BREAK;
											}
											break;
									}
								});
								return (res.length!=0)?pd.constants.app.message.invalid.view[pd.lang]+'<br>'+res.join('<br>'):'';
							})();
							if (error)
							{
								res.error=true;
								pd.alert(error,() => {
									resolve(res);
								});
								return;
							}
							else
							{
								app.views.push({
									id:'0',
									name:'all',
									type:'list',
									fields:[],
									query:'',
									sort:''
								});
							}
							/* get linkages */
							error=(() => {
								var res=[];
								app.linkages.each((linkage,index) => {
									if (linkage.app)
									{
										((fields) => {
											if (linkage.criteria.some((item) => (!(item.external in fields.external))?true:fields.internal[item.internal].tableid))
											{
												res.push('-&nbsp;'+linkage.name);
												return;
											}
											if (linkage.display.some((item) => (!(item.external in fields.external))?true:((!(item.internal in fields.internal))?false:(!fields.internal[item.internal].tableid))))
											{
												res.push('-&nbsp;'+linkage.name);
												return;
											}
											if (Array.from(new Set(linkage.display.shape((item) => (fields.external[item.external].tableid)?fields.external[item.external].tableid:PD_THROW))).length>1)
											{
												res.push('-&nbsp;'+linkage.name);
												return;
											}
										})({
											external:pd.ui.field.parallelize(config.apps.user[linkage.app].fields),
											internal:fieldinfos
										});
									}
									else res.push('-&nbsp;'+linkage.name);
								});
								return (res.length!=0)?pd.constants.app.message.invalid.linkage[pd.lang]+'<br>'+res.join('<br>'):'';
							})();
							if (error)
							{
								res.error=true;
								pd.alert(error,() => {
									resolve(res);
								});
								return;
							}
							/* get permissions */
							((record) => {
								app.permissions.owner=record.owner.value;
								app.permissions.admin=record.admin.value;
								app.permissions.denied=record.denied.value;
							})(pd.record.get(this.menus.permissions.contents,this.menus.permissions.app,true).record);
							/* get customize */
							app.customize=pd.record.get(this.menus.customize.contents,this.menus.customize.app,true).record.customize.value;
							/* get actions */
							error=(() => {
								var res=[];
								var mappings=(() => {
									var res=[];
									for (var key in fieldinfos)
										((fieldinfo) => {
											switch (fieldinfo.type)
											{
												case 'address':
													for (var key in fieldinfo.mapping)
														if (fieldinfo.mapping[key]) res.push(fieldinfo.mapping[key]);
													break;
											}
										})(fieldinfos[key]);
									return res;
								})();
								app.actions.each((action,index) => {
									if (['button','value'].includes(action.trigger))
										if (action.formula.some((item) => mappings.includes(item.field)))
										{
											res.push('-&nbsp;'+action.name);
											return;
										}
									switch (action.trigger)
									{
										case 'button':
											if (action.transfer.app)
											{
												((fields) => {
													if (action.transfer.criteria.some((item) => !(item.external in fields.external)))
													{
														res.push('-&nbsp;'+action.name);
														return;
													}
													if (action.transfer.mapping.some((item) => !(item.external in fields.external)))
													{
														res.push('-&nbsp;'+action.name);
														return;
													}
													if ((() => {
														var res={
															divide:[],
															table:{}
														};
														action.transfer.criteria.each((criteria,index) => {
															((tables) => {
																if (tables.internal)
																{
																	if (tables.external)
																	{
																		if (!(tables.external in res.table)) res.table[tables.external]=[];
																		res.table[tables.external].push(tables.internal);
																	}
																	else res.divide.push(tables.internal);
																}
															})({
																external:fields.external[criteria.external].tableid,
																internal:fields.internal[criteria.internal].tableid
															})
														});
														res.divide=Array.from(new Set(res.divide)).filter((item) => item);
														for (var key in res.table) res.table[key]=Array.from(new Set(res.table[key])).filter((item) => item);
														if (res.divide.length>1) return true;
														else
														{
															if (Array.from(new Set(Object.values(res.table).flat())).filter((item) => item).length>1) return true;
															else
															{
																for (var key in res.table)
																	if (res.table[key].length>1) return true;
																	else
																	{
																		if (res.table[key].join('')==res.divide.join('')) return true;
																	}
															}
														}
														return (((criteria) => {
															var res={
																divide:[],
																table:{}
															};
															action.transfer.mapping.each((mapping,index) => {
																((tables) => {
																	if (tables.internal)
																	{
																		if (tables.external)
																		{
																			if (!(tables.external in res.table)) res.table[tables.external]=[];
																			res.table[tables.external].push(tables.internal);
																		}
																		else res.divide.push(tables.internal);
																	}
																})({
																	external:fields.external[mapping.external].tableid,
																	internal:fields.internal[mapping.internal].tableid
																})
															});
															res.divide=Array.from(new Set(res.divide)).filter((item) => item);
															for (var key in res.table) res.table[key]=Array.from(new Set(res.table[key])).filter((item) => item);
															if (res.divide.length>1) return true;
															else
															{
																for (var key in res.table)
																	if (res.table[key].length>1) return true;
																	else
																	{
																		if (res.table[key].join('')==res.divide.join('') || res.table[key].join('')==criteria.divide.join('')) return true;
																	}
															}
															switch (action.transfer.pattern)
															{
																case 'update':
																case 'upsert':
																	if (res.divide.length!=0)
																	{
																		if (criteria.divide.length==0) return true;
																		else
																		{
																			if (res.divide.join('')!=criteria.divide.join('')) return true;
																		}
																	}
																	break;
															}
															return false;
														})(res));
													})())
													{
														res.push('-&nbsp;'+action.name);
														return;
													}
												})({
													external:pd.ui.field.parallelize(config.apps.user[action.transfer.app].fields),
													internal:fieldinfos
												});
											}
											if (action.mail.attachment)
											{
												if (fieldinfos[action.mail.to].tableid)
												{
													if (fieldinfos[action.mail.attachment].tableid)
														if (fieldinfos[action.mail.attachment].tableid!=fieldinfos[action.mail.to].tableid) res.push('-&nbsp;'+action.name);
												}
												else
												{
													if (fieldinfos[action.mail.attachment].tableid) res.push('-&nbsp;'+action.name);
												}
											}
											break;
									}
								});
								return (res.length!=0)?pd.constants.app.message.invalid.action[pd.lang]+'<br>'+res.join('<br>'):'';
							})();
							if (error)
							{
								res.error=true;
								pd.alert(error,() => {
									resolve(res);
								});
								return;
							}
							/* get injectors */
							error=(() => {
								var res=[];
								((directories) => {
									app.injectors.each((injector,index) => {
										if (directories.map((item) => item.directory).includes(injector.directory))
										{
											directories.each((directory,index) => {
												if (directory.directory==injector.directory)
													res.push('-&nbsp;'+injector.title+'&nbsp;(The directory name already used in '+directory.name+')');
											});
											return PD_BREAK;
										}
										else
										{
											if (!injector.directory)
											{
												res.push('-&nbsp;'+injector.title);
												return PD_BREAK;
											}
											else
											{
												if (app.injectors.filter((item) => item.id!=injector.id && item.directory==injector.directory).length!=0)
												{
													res.push('-&nbsp;'+injector.title+'&nbsp;(The directory name already used in this app)');
													return PD_BREAK;
												}
											}
										}
										if (injector.fields.some((item) => (item.id in fieldinfos)?fieldinfos[item.id].tableid:(item.type!='table')))
										{
											res.push('-&nbsp;'+injector.title);
											return PD_BREAK;
										}
									});
								})((() => {
									var res=[];
									for (var key in config.apps.user)
										((app) => {
											if (app.id!=this.app.id) res=res.concat(app.injectors.map((item) => ({name:app.name,directory:item.directory})))
										})(config.apps.user[key]);
									return res;
								})());
								return (res.length!=0)?pd.constants.app.message.invalid.injector[pd.lang]+'<br>'+res.join('<br>'):'';
							})();
							if (error)
							{
								res.error=true;
								pd.alert(error,() => {
									resolve(res);
								});
								return;
							}
							/* get deduplications */
							error=(() => {
								var res=[];
								app.deduplications.each((deduplication,index) => {
									if (deduplication.criteria.some((item) => (fieldinfos[item.external].tableid || fieldinfos[item.internal].tableid)))
									{
										res.push('-&nbsp;'+deduplication.name);
										return;
									}
								});
								return (res.length!=0)?pd.constants.app.message.invalid.deduplication[pd.lang]+'<br>'+res.join('<br>'):'';
							})();
							if (error)
							{
								res.error=true;
								pd.alert(error,() => {
									resolve(res);
								});
								return;
							}
						})(res.app,pd.ui.field.parallelize(res.app.fields));
						if (!res.error) resolve(res);
					})
					.catch((error) => {
						res.error=true;
						pd.alert(error.message,() => {
							resolve(res);
						});
					});
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					this.header.elm('.pd-kumaneko-builder-header-id').html('id&nbsp;'+this.app.id.toString()).off('click').on('click',(e) => {
						navigator.clipboard.writeText(this.app.id.toString()).then(() => {
							pd.alert(pd.constants.common.message.clipboard[pd.lang]);
						})
					});
					this.contents.elm('.pd-kumaneko-appbuilder-name').elm('input').val(this.app.name);
					/* setup fields */
					((form,fieldinfos) => {
						var setup=(index,row,parent,fields) => {
							((row) => {
								parent.insertBefore(row,null);
								fields[index].fields.each((field,index) => {
									((fieldinfo) => {
										if (fieldinfo) row.append(this.menus.form.lib.create(fieldinfo,(fieldinfo.tableid)?fieldinfo.tableid:'form'));
									})(fieldinfos[field]);
								});
								index++;
								if (index<fields.length) setup(index,null,parent,fields);
							})((!row)?this.menus.form.lib.create({id:'row',type:'row'}):row);
						}
						this.app.layout.each((layout,index) => {
							switch (layout.type)
							{
								case 'box':
									((box) => {
										form.insertBefore(box,null);
										setup(0,null,box,layout.rows);
									})(this.menus.form.lib.create({id:layout.id,type:layout.type,caption:layout.caption}));
									break;
								case 'row':
									setup(0,null,form,[layout]);
									break;
								case 'table':
									setup(0,this.menus.form.lib.create(this.app.fields[layout.id]),form,[{fields:Object.keys(this.app.fields[layout.id].fields)}]);
									break;
							}
						});
						this.menus.form.lib.remodel();
					})(this.menus.form.contents.elm('.pd-kumaneko-drag'),pd.ui.field.parallelize(this.app.fields));
					/* setup views */
					this.app.views.each((view,index) => this.menus.views.contents.elm('.pd-kumaneko-drag-vertical').append(this.menus.views.lib.create(view)));
					this.menus.views.lib.remodel();
					/* setup linkages */
					this.app.linkages.each((linkage,index) => this.menus.linkages.contents.elm('.pd-kumaneko-drag-vertical').append(this.menus.linkages.lib.create(linkage)));
					this.menus.linkages.lib.remodel();
					/* setup permissions */
					((permissions) => {
						pd.record.set(this.menus.permissions.contents,this.menus.permissions.app,{owner:{value:permissions.owner},admin:{value:permissions.admin},denied:{value:permissions.denied}});
					})(this.app.permissions);
					/* setup customize */
					pd.record.set(this.menus.customize.contents,this.menus.customize.app,{customize:{value:this.app.customize}});
					/* setup actions */
					this.app.actions.each((action,index) => this.menus.actions.contents.elm('.pd-kumaneko-drag-vertical').append(this.menus.actions.lib.create(action)));
					this.menus.actions.lib.remodel();
					/* setup injectors */
					this.app.injectors.each((injector,index) => this.menus.injectors.contents.elm('.pd-kumaneko-drag-vertical').append(this.menus.injectors.lib.create(injector)));
					this.menus.injectors.lib.remodel();
					/* setup deduplications */
					this.app.deduplications.each((deduplication,index) => this.menus.deduplications.contents.elm('.pd-kumaneko-drag-vertical').append(this.menus.deduplications.lib.create(deduplication)));
					this.menus.deduplications.lib.remodel();
					resolve();
				});
			}
			/* show */
			show(app){
				if (app instanceof Object)
				{
					var show=() => {
						this.queues.delete=[];
						/* set configuration */
						this.set().then(() => {
							/* show */
							super.show();
							/* activate */
							this.menus.form.tab.container.click();
						});
					};
					/* initialize elements */
					this.menus.form.lib.init();
					this.menus.views.lib.init();
					this.menus.linkages.lib.init();
					this.menus.actions.lib.init();
					this.menus.injectors.lib.init();
					this.menus.deduplications.lib.init();
					/* setup properties */
					if (Object.keys(app).length==0)
					{
						pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'app'},true)
						.then((resp) => {
							this.app={
								id:resp.id.toString(),
								name:'new application',
								fields:{},
								styles:{},
								layout:[],
								views:[],
								linkages:[],
								permissions:{'owner':[pd.operator.__id.value.toString()],'admin':[],'denied':[]},
								customize:[],
								actions:[],
								injectors:[],
								deduplications:[]
							};
							show();
						})
						.catch((error) => {
							pd.alert(error.message);
						});
					}
					else
					{
						this.app=pd.extend({},app);
						this.app.views=this.app.views.filter((item) => item.id!='0');
						show();
					}
				}
				else pd.alert(pd.constants.common.message.invalid.config.corrupted[pd.lang]);
			}
		},
		action:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999995,false,false);
				/* setup properties */
				this.app={
					id:'actionbuilder',
					fields:{
						name:{
							id:'name',
							type:'text',
							caption:pd.constants.action.caption.name[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.action.prompt.name[pd.lang]
						},
						caption:{
							id:'caption',
							type:'text',
							caption:pd.constants.action.caption.caption[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.action.prompt.caption[pd.lang]
						},
						message:{
							id:'message',
							type:'text',
							caption:pd.constants.action.caption.message[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.action.prompt.message[pd.lang]
						},
						user:{
							id:'user',
							type:'user',
							caption:pd.constants.action.caption.user[pd.lang],
							required:false,
							nocaption:false,
							unify:true
						},
						del:{
							id:'del',
							type:'table',
							caption:'',
							nocaption:true,
							fields:{
								table:{
									id:'table',
									type:'dropdown',
									caption:'',
									required:false,
									nocaption:true,
									options:[]
								}
							}
						},
						fill:{
							id:'fill',
							type:'table',
							caption:'',
							nocaption:true,
							fields:{
								table:{
									id:'table',
									type:'dropdown',
									caption:'',
									required:false,
									nocaption:true,
									options:[]
								},
								range:{
									id:'range',
									type:'text',
									caption:'',
									required:false,
									nocaption:true,
									placeholder:pd.constants.action.prompt.rows.range[pd.lang]
								}
							}
						},
						spreadsheet:{
							id:'spreadsheet',
							type:'text',
							caption:pd.constants.action.caption.report.spreadsheet[pd.lang],
							required:false,
							nocaption:false
						},
						saveas:{
							id:'saveas',
							type:'dropdown',
							caption:pd.constants.action.caption.report.saveas[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						store:{
							id:'store',
							type:'dropdown',
							caption:pd.constants.action.caption.report.store[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						size:{
							id:'size',
							type:'dropdown',
							caption:pd.constants.action.caption.report.size[pd.lang],
							required:false,
							nocaption:false,
							options:[
								{option:{value:''}},
								{option:{value:'0'}},
								{option:{value:'1'}},
								{option:{value:'2'}},
								{option:{value:'6'}},
								{option:{value:'7'}},
								{option:{value:'8'}},
								{option:{value:'9'}},
								{option:{value:'10'}}
							]
						},
						orientation:{
							id:'orientation',
							type:'dropdown',
							caption:pd.constants.action.caption.report.orientation[pd.lang],
							required:false,
							nocaption:false,
							options:[
								{option:{value:''}},
								{option:{value:'portrait'}},
								{option:{value:'landscape'}}
							]
						},
						app:{
							id:'app',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						pattern:{
							id:'pattern',
							type:'radio',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'insert'}},
								{option:{value:'update'}},
								{option:{value:'upsert'}}
							]
						},
						from:{
							id:'from',
							type:'dropdown',
							caption:pd.constants.action.caption.mail.from[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						to:{
							id:'to',
							type:'dropdown',
							caption:pd.constants.action.caption.mail.to[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						cc:{
							id:'cc',
							type:'text',
							caption:pd.constants.action.caption.mail.cc[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.action.prompt.mail.cc[pd.lang]
						},
						bcc:{
							id:'bcc',
							type:'text',
							caption:pd.constants.action.caption.mail.bcc[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.action.prompt.mail.bcc[pd.lang]
						},
						attachment:{
							id:'attachment',
							type:'dropdown',
							caption:pd.constants.action.caption.mail.attachment[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						subject:{
							id:'subject',
							type:'text',
							caption:pd.constants.action.caption.mail.subject[pd.lang],
							required:false,
							nocaption:false
						},
						body:{
							id:'body',
							type:'textarea',
							caption:pd.constants.action.caption.mail.body[pd.lang],
							required:false,
							nocaption:false
						},
						style:{
							id:'style',
							type:'table',
							caption:'',
							nocaption:true,
							fields:{
								field:{
									id:'field',
									type:'dropdown',
									caption:'',
									required:false,
									nocaption:true,
									options:[]
								},
								backcolor:{
									id:'backcolor',
									type:'color',
									caption:'',
									required:false,
									nocaption:true,
									placeholder:pd.constants.action.prompt.style.backcolor[pd.lang]
								},
								forecolor:{
									id:'forecolor',
									type:'color',
									caption:'',
									required:false,
									nocaption:true,
									placeholder:pd.constants.action.prompt.style.forecolor[pd.lang]
								}
							}
						},
						record:{
							id:'record',
							type:'checkbox',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'record'}}
							]
						},
						disabled:{
							id:'disabled',
							type:'table',
							caption:'',
							nocaption:true,
							fields:{
								field:{
									id:'field',
									type:'dropdown',
									caption:'',
									required:false,
									nocaption:true,
									options:[]
								}
							}
						},
						hidden:{
							id:'hidden',
							type:'table',
							caption:'',
							nocaption:true,
							fields:{
								field:{
									id:'field',
									type:'dropdown',
									caption:'',
									required:false,
									nocaption:true,
									options:[]
								}
							}
						},
						suspend:{
							id:'suspend',
							type:'text',
							caption:pd.constants.action.caption.suspend.message[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.action.prompt.suspend.message[pd.lang]
						},
						continue:{
							id:'continue',
							type:'checkbox',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'continue'}}
							]
						}
					}
				};
				this.keep={
					layout:[],
					mail:[],
					action:{},
					config:{},
					fields:{},
					filter:{
						monitor:null,
						show:() => {
							pd.filter.build({fields:this.keep.fields},this.keep.action.filter,null,(query,sort) => {
								this.keep.filter.monitor.html(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;filters');
								this.keep.action.filter=query;
							})
						}
					},
					sections:{
						trigger:{
							caption:null,
							message:null
						},
						del:{
							container:null,
							table:null
						},
						fill:{
							container:null,
							table:null
						},
						formula:{
							container:null,
							table:null
						},
						report:{
							container:null,
							table:null
						},
						transfer:{
							container:null,
							tables:{
								criteria:null,
								mapping:null
							}
						},
						mail:{
							container:null
						},
						style:{
							container:null,
							table:null
						},
						disabled:{
							container:null,
							table:null
						},
						hidden:{
							container:null,
							table:null
						},
						option:{
							container:null,
							table:null
						},
						suspend:{
							container:null
						}
					}
				};
				/* modify elements */
				this.keep.sections.formula.table=pd.ui.table.create({
					id:'formulas',
					type:'table',
					caption:'',
					nocaption:true,
					fields:{
						field:{
							id:'field',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						formula:{
							id:'formula',
							type:'spacer',
							caption:'',
							required:false,
							nocaption:true
						}
					}
				}).spread((row,index) => {
					/* event */
					row.elm('.pd-table-row-add').on('click',(e) => {
						this.keep.sections.formula.table.insertrow(row);
					});
					row.elm('.pd-table-row-del').on('click',(e) => {
						pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
							this.keep.sections.formula.table.delrow(row);
						});
					});
					/* modify elements */
					((cells) => {
						cells.field.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
							return new Promise((resolve,reject) => {
								cells.formula.empty();
								if (cells.field.val())
								{
									((fieldinfo) => {
										cells.formula.append(
											((field) => {
												switch (fieldinfo.type)
												{
													case 'checkbox':
														field.addclass('pd-lookup').append(
															pd.create('button').addclass('pd-icon pd-icon-lookup pd-search').on('click',(e) => {
																pd.pickupmultiple(
																	fieldinfo.options.map((item) => ({option:{value:item.option.value}})),
																	{option:{align:'left',text:'option'}},
																	(resp) => field.elm('input').val(JSON.stringify(resp.map((item) => item.option.value)))
																);
															})
														);
														break;
													case 'color':
														field.addclass('pd-lookup').append(
															pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search').on('click',(e) => {
																pd.pickupcolor((color) => field.elm('input').val('"'+color+'"'));
															})
														);
														break;
													case 'department':
													case 'group':
													case 'user':
														((picker) => {
															field.addclass('pd-lookup').append(
																pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search').on('click',(e) => {
																	picker.show({
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
																		((fieldinfo.type=='user')?[{__id:{value:'LOGIN_USER'},account:{value:'LOGIN_USER'},name:{value:'Login user'}}]:[]),
																		(records) => {
																			((value) => {
																				field.elm('input').val(value.replace(/["']{1}LOGIN_USER["']{1}/g,'LOGIN_USER'));
																			})(JSON.stringify(records.map((item) => item['__id'].value.toString())));
																		}
																	);
																})
															);
														})(new panda_recordpicker(true));
														break;
													case 'dropdown':
													case 'radio':
														field.addclass('pd-lookup').append(
															pd.create('button').addclass('pd-icon pd-icon-lookup pd-search').on('click',(e) => {
																pd.pickupsingle(
																	fieldinfo.options.filter((item) => item.option.value),
																	{option:{align:'left',text:'option'}},
																	(resp) => field.elm('input').val('"'+resp.option.value+'"')
																);
															})
														);
														break;
													case 'lookup':
														((fieldinfo,picker) => {
															field.addclass('pd-lookup').append(
																pd.create('button').addclass('pd-icon pd-icon-'+fieldinfo.type+' pd-search').on('click',(e) => {
																	if (Array.isArray(fieldinfo.picker))
																	{
																		pd.event.call(fieldinfo.app,'pd.fields.call',{fields:{}})
																		.then((param) => {
																			fieldinfo.picker=((picker) => {
																				var res={};
																				picker.each((picker,index) => {
																					if (picker in param.fields) res[picker]=pd.extend({},param.fields[picker]);
																				});
																				if (Object.keys(res).length==0)
																					if (fieldinfo.search in param.fields) res[fieldinfo.search]=pd.extend({},param.fields[fieldinfo.search]);
																				if (Object.keys(res).length==0) res['__id']={id:'__id',type:'id',caption:'id',required:false,nocaption:false};
																				return res;
																			})(fieldinfo.picker);
																			picker.show(fieldinfo,[],(record) => {
																				field.elm('input').val(record['__id'].value);
																			});
																		});
																	}
																	else
																	{
																		picker.show(fieldinfo,[],(record) => {
																			field.elm('input').val(record['__id'].value);
																		});
																	}
																})
															);
														})(pd.extend({},fieldinfo),new panda_recordpicker());
														break;
												}
												return field;
											})(pd.create('div').addclass('pd-field-value').append(pd.create('input').attr('type','text').attr('data-type','text')))
										);
									})(pd.ui.field.parallelize(this.keep.fields)[cells.field.val()]);
								}
								resolve({});
							});
						};
					})({
						field:row.elm('[field-id=field]').elm('select'),
						formula:row.elm('[field-id=formula]')
					});
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
				},false);
				this.keep.sections.report.table=pd.ui.table.create({
					id:'templates',
					type:'table',
					caption:'',
					nocaption:true,
					fields:{
						template:{
							id:'template',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						}
					}
				}).spread((row,index) => {
					/* event */
					row.elm('.pd-table-row-add').on('click',(e) => {
						this.keep.sections.report.table.insertrow(row);
					});
					row.elm('.pd-table-row-del').on('click',(e) => {
						pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
							this.keep.sections.report.table.delrow(row);
						});
					});
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
				},false);
				this.keep.sections.transfer.tables.criteria=pd.ui.table.create({
					id:'criterias',
					type:'table',
					caption:'',
					nocaption:true,
					fields:{
						external:{
							id:'external',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						operator:{
							id:'operator',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						internal:{
							id:'internal',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						}
					}
				}).spread((row,index) => {
					/* event */
					row.elm('.pd-table-row-add').on('click',(e) => {
						this.keep.sections.transfer.tables.criteria.insertrow(row);
					});
					row.elm('.pd-table-row-del').on('click',(e) => {
						pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
							this.keep.sections.transfer.tables.criteria.delrow(row);
						});
					});
					/* modify elements */
					((cells) => {
						cells.external.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
							return new Promise((resolve,reject) => {
								cells.operator.empty();
								cells.internal.empty().append(pd.create('option').attr('value','').html(pd.constants.action.caption.transfer.source[pd.lang]));
								if (cells.external.val())
								{
									resolve(((fields) => {
										var res={};
										cells.operator.assignoption(pd.filter.query.operator(fields.external[cells.external.val()]),'caption','id');
										for (var key in fields.internal)
											((fieldinfo) => {
												if (pd.ui.field.typing(fieldinfo,fields.external[cells.external.val()],true))
												{
													cells.internal.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
													res[fieldinfo.id]=fieldinfo;
												}
											})(fields.internal[key]);
										return res;
									})({
										external:pd.ui.field.parallelize(this.keep.config.apps.user[this.contents.elm('[field-id=app]').elm('select').val()].fields),
										internal:pd.ui.field.parallelize(this.keep.fields)
									}));
								}
								else resolve({});
							});
						};
					})({
						external:row.elm('[field-id=external]').elm('select'),
						operator:row.elm('[field-id=operator]').elm('select'),
						internal:row.elm('[field-id=internal]').elm('select')
					});
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
				},false);
				this.keep.sections.transfer.tables.mapping=pd.ui.table.create({
					id:'mappings',
					type:'table',
					caption:'',
					nocaption:true,
					fields:{
						external:{
							id:'external',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						guide:{
							id:'guide',
							type:'spacer',
							caption:'',
							required:false,
							nocaption:true,
							contents:'<span class="pd-icon pd-icon-arrow pd-icon-arrow-left"></span>'
						},
						internal:{
							id:'internal',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						}
					}
				}).addclass('pd-mapping').spread((row,index) => {
					/* event */
					row.elm('.pd-table-row-add').on('click',(e) => {
						this.keep.sections.transfer.tables.mapping.insertrow(row);
					});
					row.elm('.pd-table-row-del').on('click',(e) => {
						pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
							this.keep.sections.transfer.tables.mapping.delrow(row);
						});
					});
					/* modify elements */
					((cells) => {
						cells.external.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
							return new Promise((resolve,reject) => {
								cells.internal.empty().append(pd.create('option'));
								if (cells.external.val())
								{
									resolve(((fields) => {
										var res={};
										for (var key in fields.internal)
											((fieldinfo) => {
												if (pd.ui.field.typing(fieldinfo,fields.external[cells.external.val()]))
												{
													cells.internal.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
													res[fieldinfo.id]=fieldinfo;
												}
											})(fields.internal[key]);
										return res;
									})({
										external:pd.ui.field.parallelize(this.keep.config.apps.user[this.contents.elm('[field-id=app]').elm('select').val()].fields),
										internal:pd.ui.field.parallelize(this.keep.fields)
									}));
								}
								else resolve({});
							});
						};
					})({
						external:row.elm('[field-id=external]').elm('select'),
						internal:row.elm('[field-id=internal]').elm('select')
					});
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
				},false);
				this.keep.sections.option.table=pd.ui.table.create({
					id:'options',
					type:'table',
					caption:'',
					nocaption:true,
					fields:{
						field:{
							id:'field',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						option:{
							id:'option',
							type:'spacer',
							caption:'',
							required:false,
							nocaption:true
						}
					}
				}).spread((row,index) => {
					/* event */
					row.elm('.pd-table-row-add').on('click',(e) => {
						this.keep.sections.option.table.insertrow(row);
					});
					row.elm('.pd-table-row-del').on('click',(e) => {
						pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
							this.keep.sections.option.table.delrow(row);
						});
					});
					/* modify elements */
					((cells) => {
						cells.field.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
							return new Promise((resolve,reject) => {
								cells.option.empty();
								if (cells.field.val())
								{
									((fieldinfo) => {
										cells.option.append(
											((field) => {
												fieldinfo.options.each((option,index) => {
													field
													.append(
														pd.create('label')
														.append(pd.create('input').attr('type','checkbox').attr('data-type',fieldinfo.type).val(option.option.value))
														.append(pd.create('span').html((option.option.value)?option.option.value:'&#9251;'))
													);
												});
												return field;
											})(pd.create('div').addclass('pd-field-value'))
										);
									})(pd.ui.field.parallelize(this.keep.fields)[cells.field.val()]);
								}
								resolve({});
							});
						};
					})({
						field:row.elm('[field-id=field]').elm('select'),
						option:row.elm('[field-id=option]')
					});
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
				},false);
				this.keep.sections.del.table=pd.ui.table.activate(pd.ui.table.create(this.app.fields.del),this.app);
				this.keep.sections.fill.table=pd.ui.table.activate(pd.ui.table.create(this.app.fields.fill),this.app);
				this.keep.sections.style.table=pd.ui.table.activate(pd.ui.table.create(this.app.fields.style),this.app);
				this.keep.sections.disabled.table=pd.ui.table.activate(pd.ui.table.create(this.app.fields.disabled),this.app);
				this.keep.sections.hidden.table=pd.ui.table.activate(pd.ui.table.create(this.app.fields.hidden),this.app);
				this.header.addclass('pd-kumaneko-builder-header')
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-title').html('Action Settings'))
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-id'));
				this.container.addclass('pd-kumaneko-main').css({
					height:'calc(100% - 1em)',
					width:'55em'
				});
				this.contents.addclass('pd-kumaneko-actionbuilder').css({
					padding:'0'
				})
				.append(
					((contents) => {
						contents
						.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.name).css({width:'100%'}),this.app))
						.append(((res) => {
							this.keep.sections.trigger.caption=res;
							return res;
						})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.caption).css({width:'100%'}),this.app)))
						.append(((res) => {
							this.keep.sections.trigger.message=res;
							return res;
						})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.message).css({width:'100%'}),this.app)))
						.append(
							((res) => {
								res.elm('.pd-field-value')
								.append(pd.create('button').addclass('pd-icon pd-icon-filter').on('click',(e) => this.keep.filter.show()))
								.append(
									((monitor) => {
										this.keep.filter.monitor=monitor;
										return monitor;
									})(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
								)
								return res;
							})(pd.ui.field.create({
								id:'monitor',
								type:'spacer',
								caption:pd.constants.action.caption.filter[pd.lang],
								required:false,
								nocaption:false
							}).css({width:'100%'}))
						)
						.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.user).css({width:'100%'}),this.app))
						.append(
							((container) => {
								this.keep.sections.del.container=container;
								container.elm('.pd-box-container').append(this.keep.sections.del.table);
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.del[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.fill.container=container;
								container.elm('.pd-box-container').append(this.keep.sections.fill.table);
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.fill[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.formula.container=container;
								container.elm('.pd-box-container').append(this.keep.sections.formula.table);
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.formula[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.report.container=container
								container.elm('.pd-box-container')
								.append(
									((res) => {
										res.elm('.pd-field-value').addclass('pd-spreadsheet')
										.insertBefore(
											((res) => {
												res.on('click',(e) => e.currentTarget.rebuild()).rebuild=() => {
													return new Promise((resolve,reject) => {
														((templates) => {
															templates.clearrows();
															templates.template.elm('[field-id=template]').elm('select').empty().append(pd.create('option'));
															if (res.closest('.pd-spreadsheet').elm('input').val())
															{
																pd.request(pd.ui.baseuri()+'/report.php','GET',{},{spreadsheet:res.closest('.pd-spreadsheet').elm('input').val()},true)
																.then((resp) => {
																	var sheets=((sheets) => {
																		if (Array.isArray(sheets))
																			sheets=sheets.reduce((result,current,index) => {
																				result[index.toString()]=current;
																				return result;
																			},{});
																		return sheets;
																	})(resp.sheets);
																	for (var key in sheets) templates.template.elm('select').append(pd.create('option').attr('value',key).html(sheets[key]));
																	templates.addrow();
																	resolve(sheets);
																})
																.catch((error) => {
																	pd.alert(error.message);
																	templates.addrow();
																	resolve({});
																});
															}
															else
															{
																templates.addrow();
																resolve({});
															}
														})(this.keep.sections.report.table)
													});
												};
												return res;
											})(pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.action.caption.button.get[pd.lang])),
											res.elm('input').nextElementSibling
										);
										return res;
									})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.spreadsheet).css({width:'100%'}),this.app))
								)
								.append(
									((container) => {
										container.elm('.pd-field-value').append(this.keep.sections.report.table);
										return container;
									})(pd.ui.field.create({
										id:'templates',
										type:'spacer',
										caption:pd.constants.action.caption.report.template[pd.lang],
										required:false,
										nocaption:false
									}))
								)
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.saveas).css({width:'50%'}),this.app))
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.store).css({width:'50%'}),this.app))
								.append(pd.ui.field.activate(((res) => {
									res.elms('option').each((element,index) => {
										if (element.val()) element.html(pd.constants.action.caption.report.size[element.val()][pd.lang]);
									});
									return res;
								})(pd.ui.field.create(this.app.fields.size).css({width:'50%'})),this.app))
								.append(pd.ui.field.activate(((res) => {
									res.elms('option').each((element,index) => {
										if (element.val()) element.html(pd.constants.action.caption.report.orientation[element.val()][pd.lang]);
									});
									return res;
								})(pd.ui.field.create(this.app.fields.orientation).css({width:'50%'})),this.app));
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.report[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.transfer.container=container
								container.elm('.pd-box-container')
								.append(
									((res) => {
										res.elm('select').on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
											return new Promise((resolve,reject) => {
												((criterias,mappings) => {
													criterias.clearrows();
													criterias.template.elm('[field-id=external]').elm('select').empty().append(pd.create('option').attr('value','').html(pd.constants.action.caption.transfer.destination[pd.lang]));
													criterias.template.elm('[field-id=operator]').elm('select').empty();
													criterias.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option').attr('value','').html(pd.constants.action.caption.transfer.source[pd.lang]));
													mappings.clearrows();
													mappings.template.elm('[field-id=external]').elm('select').empty().append(pd.create('option'));
													mappings.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option'));
													mappings.template.elm('[field-id=guide]').parentNode.addclass('pd-mapping-guide');
													if (res.elm('select').val())
													{
														resolve(((fieldinfos) => {
															var res={
																criteria:{},
																mapping:{}
															};
															for (var key in fieldinfos)
																((fieldinfo) => {
																	switch (fieldinfo.type)
																	{
																		case 'canvas':
																		case 'file':
																			mappings.template.elm('[field-id=external]').elm('select')
																			.append(
																				pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption)
																			);
																			res.mapping[fieldinfo.id]=fieldinfo;
																			break;
																		case 'id':
																		case 'autonumber':
																		case 'creator':
																		case 'createdtime':
																		case 'modifier':
																		case 'modifiedtime':
																			criterias.template.elm('[field-id=external]').elm('select')
																			.append(
																				pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption)
																			);
																			res.criteria[fieldinfo.id]=fieldinfo;
																			break;
																		case 'spacer':
																			break;
																		default:
																			criterias.template.elm('[field-id=external]').elm('select')
																			.append(
																				pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption)
																			);
																			mappings.template.elm('[field-id=external]').elm('select')
																			.append(
																				pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption)
																			);
																			res.criteria[fieldinfo.id]=fieldinfo;
																			res.mapping[fieldinfo.id]=fieldinfo;
																			break;
																	}
																})(fieldinfos[key]);
															criterias.addrow();
															mappings.addrow();
															return res;
														})(pd.ui.field.parallelize(this.keep.config.apps.user[res.elm('select').val()].fields)));
													}
													else
													{
														criterias.addrow();
														mappings.addrow();
														resolve({
															criteria:{},
															mapping:{}
														});
													}
												})(this.keep.sections.transfer.tables.criteria,this.keep.sections.transfer.tables.mapping)
											});
										};
										return res;
									})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.app).css({width:'50%'}),this.app))
								)
								.append(pd.ui.field.activate(((res) => {
									res.elms('[data-name='+this.app.fields.pattern.id+']').each((element,index) => {
										element.closest('label').elm('span').html(pd.constants.action.caption.transfer.pattern[element.val()][pd.lang]);
									});
									return res;
								})(pd.ui.field.create(this.app.fields.pattern).css({width:'50%'})),this.app))
								.append(
									((container) => {
										container.elm('.pd-field-value').append(this.keep.sections.transfer.tables.criteria);
										return container;
									})(pd.ui.field.create({
										id:'criteria',
										type:'spacer',
										caption:pd.constants.action.caption.transfer.criteria[pd.lang],
										required:false,
										nocaption:false
									}))
								)
								.append(
									((container) => {
										container.elm('.pd-field-value').append(this.keep.sections.transfer.tables.mapping);
										return container;
									})(pd.ui.field.create({
										id:'mapping',
										type:'spacer',
										caption:pd.constants.action.caption.transfer.mapping[pd.lang],
										required:false,
										nocaption:false
									}))
								);
								/* event */
								pd.event.on(this.app.id,'pd.change.pattern',(e) => {
									switch (e.record.pattern.value)
									{
										case 'insert':
											this.keep.sections.transfer.tables.criteria.closest('.pd-field').hide();
											break;
										default:
											this.keep.sections.transfer.tables.criteria.closest('.pd-field').show();
											break;
									}
									return e;
								});
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.transfer[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.mail.container=container
								container.elm('.pd-box-container')
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.from).css({width:'100%'}),this.app))
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.to).css({width:'100%'}),this.app))
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.cc).css({width:'100%'}),this.app))
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.bcc).css({width:'100%'}),this.app))
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.attachment).css({width:'100%'}),this.app))
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.subject).css({width:'100%'}),this.app))
								.append(
									((res) => {
										res.elm('.pd-field-value').css({height:'15em'});
										return res;
									})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.body).css({width:'100%'}),this.app))
								);
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.mail[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.style.container=container;
								container.elm('.pd-box-container').append(this.keep.sections.style.table);
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.style[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.disabled.container=container;
								container.elm('.pd-box-container')
								.append(pd.ui.field.activate(((res) => {
									res.elm('input').closest('label').elm('span').html(pd.constants.action.caption.disabled.record[pd.lang]);
									return res;
								})(pd.ui.field.create(this.app.fields.record)).css({width:'100%'}),this.app))
								.append(this.keep.sections.disabled.table);
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.disabled[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.hidden.container=container;
								container.elm('.pd-box-container').append(this.keep.sections.hidden.table);
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.hide[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.option.container=container;
								container.elm('.pd-box-container').append(this.keep.sections.option.table);
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.option[pd.lang]).addclass('pd-kumaneko-section'))
						)
						.append(
							((container) => {
								this.keep.sections.suspend.container=container
								container.elm('.pd-box-container')
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.suspend).css({width:'100%'}),this.app))
								.append(pd.ui.field.activate(((res) => {
									res.elm('input').closest('label').elm('span').html(pd.constants.action.caption.suspend.continue[pd.lang]);
									return res;
								})(pd.ui.field.create(this.app.fields.continue)).css({width:'100%'}),this.app));
								return container;
							})(pd.ui.box.create('',pd.constants.action.caption.suspend[pd.lang]).addclass('pd-kumaneko-section'))
						);
						/* event */
						pd.event.on(this.app.id,'pd.change.record',(e) => {
							if (e.record.record.value.length!=0) this.keep.sections.disabled.table.hide();
							else this.keep.sections.disabled.table.show('table');
							return e;
						});
						return contents;
					})(pd.create('div').addclass('pd-scope').attr('form-id','form_'+this.app.id))
				);
				this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					var res=pd.record.get(this.contents,this.app);
					if (!res.error)
					{
						((record) => {
							var res={
								error:false,
								action:this.keep.action
							};
							if (!record.name.value)
							{
								res.error=true;
								pd.alert(pd.constants.action.message.invalid.name[pd.lang],() => {
									resolve(res);
								});
							}
							else
							{
								if (['button','value'].includes(res.action.trigger))
								{
									var formula=this.keep.sections.formula.table.tr.reduce((result,current) => {
										if (!res.error)
											if (current.elm('[field-id=field]').elm('select').val())
											{
												if (current.elm('[field-id=formula]').elm('input').val().match(/(class |fetch\(|function\(|XMLHttpRequest\(|=>|var |let |const )/g))
												{
													res.error=true;
													pd.alert(pd.constants.action.message.invalid.formula[pd.lang],() => {
														resolve(res);
													});
												}
												else
												{
													result.push({
														field:current.elm('[field-id=field]').elm('select').val(),
														formula:current.elm('[field-id=formula]').elm('input').val()
													});
												}
											}
										return result;
									},[]);
									if (!res.error) res.action.formula=formula;
								}
								if (!res.error)
								{
									switch (res.action.trigger)
									{
										case 'button':
											if (!record.caption.value)
											{
												res.error=true;
												pd.alert(pd.constants.action.message.invalid.caption[pd.lang],() => {
													resolve(res);
												});
												break;
											}
											if (!record.message.value)
											{
												res.error=true;
												pd.alert(pd.constants.action.message.invalid.message[pd.lang],() => {
													resolve(res);
												});
												break;
											}
											if (!res.error)
											{
												if (record.spreadsheet.value)
												{
													var template=this.keep.sections.report.table.tr.shape((item) => (item.elm('[field-id=template]').elm('select').val())?item.elm('[field-id=template]').elm('select').val():PD_THROW);
													if (template.length==0)
													{
														res.error=true;
														pd.alert(pd.constants.action.message.invalid.report.template[pd.lang],() => {
															resolve(res);
														});
													}
													else
													{
														if (!record.saveas.value)
														{
															res.error=true;
															pd.alert(pd.constants.action.message.invalid.report.saveas[pd.lang],() => {
																resolve(res);
															});
															return;
														}
														if (!record.size.value)
														{
															res.error=true;
															pd.alert(pd.constants.action.message.invalid.report.size[pd.lang],() => {
																resolve(res);
															});
															return;
														}
														if (!record.orientation.value)
														{
															res.error=true;
															pd.alert(pd.constants.action.message.invalid.report.orientation[pd.lang],() => {
																resolve(res);
															});
															return;
														}
														if (!res.error)
														{
															res.action.report.spreadsheet=record.spreadsheet.value;
															res.action.report.saveas=record.saveas.value;
															res.action.report.store=record.store.value;
															res.action.report.size=record.size.value;
															res.action.report.orientation=record.orientation.value;
															res.action.report.template=template;
														}
													}
												}
												else
												{
													res.action.report.spreadsheet='';
													res.action.report.saveas='';
													res.action.report.store='';
													res.action.report.size='';
													res.action.report.orientation='';
													res.action.report.template=[];
												}
											}
											if (!res.error)
											{
												if (record.app.value)
												{
													((fields) => {
														var criteria={
															config:[],
															divide:[],
															table:{}
														};
														var mapping={
															config:[],
															divide:[],
															table:{}
														};
														((pattern) => {
															switch (pattern)
															{
																case 'update':
																case 'upsert':
																	this.keep.sections.transfer.tables.criteria.tr.each((element,index) => {
																		if (element.elm('[field-id=external]').elm('select').val() && element.elm('[field-id=internal]').elm('select').val())
																			((values) => {
																				criteria.config.push(values);
																				((tables) => {
																					if (tables.internal)
																					{
																						if (tables.external)
																						{
																							if (!(tables.external in criteria.table)) criteria.table[tables.external]=[];
																							criteria.table[tables.external].push(tables.internal);
																						}
																						else criteria.divide.push(tables.internal);
																					}
																				})({
																					external:fields.external[values.external].tableid,
																					internal:fields.internal[values.internal].tableid
																				})
																			})({
																				external:element.elm('[field-id=external]').elm('select').val(),
																				operator:element.elm('[field-id=operator]').elm('select').val(),
																				internal:element.elm('[field-id=internal]').elm('select').val()
																			});
																	});
																	if (criteria.config.length==0)
																	{
																		res.error=true;
																		pd.alert(pd.constants.action.message.invalid.transfer.criteria[pd.lang],() => {
																			resolve(res);
																		});
																	}
																	else
																	{
																		criteria.divide=Array.from(new Set(criteria.divide)).filter((item) => item);
																		for (var key in criteria.table) criteria.table[key]=Array.from(new Set(criteria.table[key])).filter((item) => item);
																		if (criteria.divide.length>1)
																		{
																			res.error=true;
																			pd.alert(pd.constants.action.message.invalid.transfer.dividing[pd.lang],() => {
																				resolve(res);
																			});
																		}
																		else
																		{
																			if (Array.from(new Set(Object.values(criteria.table).flat())).filter((item) => item).length>1)
																			{
																				res.error=true;
																				pd.alert(pd.constants.action.message.invalid.transfer.multiple[pd.lang],() => {
																					resolve(res);
																				});
																			}
																			else
																			{
																				for (var key in criteria.table)
																					if (criteria.table[key].join('')==criteria.divide.join(''))
																					{
																						res.error=true;
																						pd.alert(pd.constants.action.message.invalid.transfer.diversion[pd.lang],() => {
																							resolve(res);
																						});
																						break;
																					}
																			}
																		}
																	}
																	break;
															}
															if (!res.error)
															{
																this.keep.sections.transfer.tables.mapping.tr.each((element,index) => {
																	if (element.elm('[field-id=external]').elm('select').val() && element.elm('[field-id=internal]').elm('select').val())
																		((values) => {
																			mapping.config.push(values);
																			((tables) => {
																				if (tables.internal)
																				{
																					if (tables.external)
																					{
																						if (!(tables.external in mapping.table)) mapping.table[tables.external]=[];
																						mapping.table[tables.external].push(tables.internal);
																					}
																					else mapping.divide.push(tables.internal);
																				}
																			})({
																				external:fields.external[values.external].tableid,
																				internal:fields.internal[values.internal].tableid
																			})
																		})({
																			external:element.elm('[field-id=external]').elm('select').val(),
																			internal:element.elm('[field-id=internal]').elm('select').val()
																		});
																});
																if (mapping.config.length==0)
																{
																	res.error=true;
																	pd.alert(pd.constants.action.message.invalid.transfer.mapping[pd.lang],() => {
																		resolve(res);
																	});
																}
																else
																{
																	mapping.divide=Array.from(new Set(mapping.divide)).filter((item) => item);
																	for (var key in mapping.table) mapping.table[key]=Array.from(new Set(mapping.table[key])).filter((item) => item);
																	if (mapping.divide.length>1)
																	{
																		res.error=true;
																		pd.alert(pd.constants.action.message.invalid.transfer.dividing[pd.lang],() => {
																			resolve(res);
																		});
																	}
																	else
																	{
																		for (var key in mapping.table)
																		{
																			if (mapping.table[key].length>1)
																			{
																				res.error=true;
																				pd.alert(pd.constants.action.message.invalid.transfer.various[pd.lang],() => {
																					resolve(res);
																				});
																				break;
																			}
																			else
																			{
																				if (mapping.table[key].join('')==mapping.divide.join('') || mapping.table[key].join('')==criteria.divide.join(''))
																				{
																					res.error=true;
																					pd.alert(pd.constants.action.message.invalid.transfer.diversion[pd.lang],() => {
																						resolve(res);
																					});
																					break;
																				}
																			}
																		}
																		if (!res.error)
																		{
																			switch (pattern)
																			{
																				case 'update':
																				case 'upsert':
																					if (mapping.divide.length!=0)
																					{
																						if (criteria.divide.length==0)
																						{
																							res.error=true;
																							pd.alert(pd.constants.action.message.invalid.transfer.unmatch[pd.lang],() => {
																								resolve(res);
																							});
																						}
																						else
																						{
																							if (mapping.divide.join('')!=criteria.divide.join(''))
																							{
																								res.error=true;
																								pd.alert(pd.constants.action.message.invalid.transfer.dividing[pd.lang],() => {
																									resolve(res);
																								});
																							}
																						}
																					}
																					break;
																			}
																			if (!res.error)
																			{
																				res.action.transfer.app=record.app.value;
																				res.action.transfer.pattern=pattern;
																				res.action.transfer.criteria=criteria.config;
																				res.action.transfer.mapping=mapping.config;
																			}
																		}
																	}
																}
															}
														})(record.pattern.value);
													})({
														external:pd.ui.field.parallelize(this.keep.config.apps.user[record.app.value].fields),
														internal:pd.ui.field.parallelize(this.keep.fields)
													});
												}
												else
												{
													res.action.transfer.app='';
													res.action.transfer.pattern='insert';
													res.action.transfer.criteria=[];
													res.action.transfer.mapping=[];
												}
											}
											if (!res.error)
											{
												if (record.to.value)
												{
													((fieldinfos) => {
														if (!record.from.value)
														{
															res.error=true;
															pd.alert(pd.constants.action.message.invalid.mail.from[pd.lang],() => {
																resolve(res);
															});
															return;
														}
														if (!record.subject.value)
														{
															res.error=true;
															pd.alert(pd.constants.action.message.invalid.mail.subject[pd.lang],() => {
																resolve(res);
															});
															return;
														}
														if (!record.body.value)
														{
															res.error=true;
															pd.alert(pd.constants.action.message.invalid.mail.body[pd.lang],() => {
																resolve(res);
															});
															return;
														}
														if (record.attachment.value)
														{
															if (fieldinfos[record.to.value].tableid)
															{
																if (fieldinfos[record.attachment.value].tableid)
																	if (fieldinfos[record.attachment.value].tableid!=fieldinfos[record.to.value].tableid)
																	{
																		res.error=true;
																		pd.alert(pd.constants.action.message.invalid.mail.unmatch.intable[pd.lang],() => {
																			resolve(res);
																		});
																		return;
																	}
															}
															else
															{
																if (fieldinfos[record.attachment.value].tableid)
																{
																	res.error=true;
																	pd.alert(pd.constants.action.message.invalid.mail.unmatch.outtable[pd.lang],() => {
																		resolve(res);
																	});
																	return;
																}
															}
														}
													})(pd.ui.field.parallelize(this.keep.fields));
													if (!res.error)
													{
														res.action.mail.from=record.from.value;
														res.action.mail.to=record.to.value;
														res.action.mail.cc=record.cc.value;
														res.action.mail.bcc=record.bcc.value;
														res.action.mail.attachment=record.attachment.value;
														res.action.mail.subject=record.subject.value;
														res.action.mail.body=record.body.value;
													}
												}
												else
												{
													res.action.mail.from='';
													res.action.mail.to='';
													res.action.mail.cc='';
													res.action.mail.bcc='';
													res.action.mail.attachment='';
													res.action.mail.subject='';
													res.action.mail.body='';
												}
											}
											break;
										case 'value':
											var option=this.keep.sections.option.table.tr.reduce((result,current) => {
												if (!res.error)
													if (current.elm('[field-id=field]').elm('select').val())
													{
														var options=current.elm('[field-id=option]').elms('input').reduce((result,current) => {
															if (current.checked) result.push(current.val());
															return result
														},[])
														if (options.length==0)
														{
															res.error=true;
															pd.alert(pd.constants.action.message.invalid.option[pd.lang],() => {
																resolve(res);
															});
														}
														else
														{
															result.push({
																field:current.elm('[field-id=field]').elm('select').val(),
																options:options
															});
														}
													}
												return result;
											},[]);
											if (!res.error) res.action.option=option;
											break;
									}
								}
							}
							res.action.name=record.name.value;
							res.action.user=record.user.value;
							if (['button','value'].includes(res.action.trigger))
							{
								res.action.rows={
									del:((rows) => {
										var res=[];
										rows.each((row,index) => {
											if (row.table.value)
												res.push({
													table:row.table.value
												});
										});
										return res;
									})(record.del.value),
									fill:((rows) => {
										var res=[];
										rows.each((row,index) => {
											if (row.table.value)
												res.push({
													table:row.table.value,
													range:row.range.value
												});
										});
										return res;
									})(record.fill.value)
								};
							}
							switch (res.action.trigger)
							{
								case 'button':
									res.action.caption=record.caption.value;
									res.action.message=record.message.value;
									break;
								case 'saving':
									res.action.suspend={
										message:record.suspend.value,
										continue:(record.continue.value.length!=0)
									}
									break;
								case 'value':
									res.action.style=((rows) => {
										var res=[];
										rows.each((row,index) => {
											if (row.field.value)
												res.push({
													field:row.field.value,
													backcolor:row.backcolor.value,
													forecolor:row.forecolor.value
												});
										});
										return res;
									})(record.style.value);
									res.action.disabled=((rows) => {
										var res={record:(record.record.value.length!=0),fields:[]};
										if (!res.record)
											rows.each((row,index) => {
												if (row.field.value)
													res.fields.push({
														field:row.field.value
													});
											});
										return res;
									})(record.disabled.value);
									res.action.hidden=((rows) => {
										var res=[];
										rows.each((row,index) => {
											if (row.field.value)
												res.push({
													field:row.field.value
												});
										});
										return res;
									})(record.hidden.value);
									break;
							}
							if (!res.error) resolve(res);
						})(res.record);
					}
					else resolve(res);
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					((fieldinfos) => {
						var fields=(addcontainer,addtable,excludefields,excludetypes) => {
							var res=[];
							res.push({
								id:{value:''},
								caption:{value:''}
							});
							for (var key in fieldinfos)
								if (addcontainer || fieldinfos[key].type!='spacer')
								{
									if (excludefields)
										if (excludefields.includes(key)) continue;
									if (excludetypes)
										if (excludetypes.includes(fieldinfos[key].type)) continue;
									res.push({
										id:{value:key},
										caption:{value:fieldinfos[key].caption}
									});
								}
							if (addtable)
								for (var key in this.keep.fields)
									if (this.keep.fields[key].type=='table')
										res.push({
											id:{value:key},
											caption:{value:this.keep.fields[key].caption}
										});
							if (addcontainer)
								this.keep.layout.each((layout,index) => {
									if (layout.type=='box')
										res.push({
											id:{value:layout.id},
											caption:{value:layout.caption}
										});
								});
							return res;
						};
						this.header.elm('.pd-kumaneko-builder-header-id').html('id&nbsp;'+this.keep.action.id.toString()).off('click').on('click',(e) => {
							navigator.clipboard.writeText(this.keep.action.id.toString()).then(() => {
								pd.alert(pd.constants.common.message.clipboard[pd.lang]);
							})
						});
						pd.record.set(this.contents,this.app,(() => {
							var formulainfos=pd.extend({},fieldinfos);
							var res={
								name:{value:this.keep.action.name},
								user:{value:this.keep.action.user},
								del:{value:[]},
								fill:{value:[]},
								style:{value:[]},
								disabled:{value:[]},
								hidden:{value:[]}
							};
							if (['button','value'].includes(this.keep.action.trigger))
							{
								((tables) => {
									res['del']={value:((dels) => {
										var res=[];
										this.keep.sections.del.table.clearrows();
										this.keep.sections.del.table.template.elm('[field-id=table]').elm('select').empty().assignoption(tables,'caption','id');
										this.keep.sections.del.table.addrow();
										dels.each((del,index) => {
											if (del.table in this.keep.fields)
												res.push({
													table:{value:del.table}
												});
										});
										return res;
									})(this.keep.action.rows.del)};
									res['fill']={value:((fills) => {
										var res=[];
										this.keep.sections.fill.table.clearrows();
										this.keep.sections.fill.table.template.elm('[field-id=table]').elm('select').empty().assignoption(tables,'caption','id');
										this.keep.sections.fill.table.addrow();
										fills.each((fill,index) => {
											if (fill.table in this.keep.fields)
												res.push({
													table:{value:fill.table},
													range:{value:fill.range}
												});
										});
										return res;
									})(this.keep.action.rows.fill)};
								})(Object.values(this.keep.fields).reduce((result,current) => {
									if (['table'].includes(current.type))
									{
										result.push({
											id:{value:current.id},
											caption:{value:current.caption}
										});
									}
									return result;
								},[{id:{value:''},caption:{value:''}}]));
								this.keep.sections.formula.table.clearrows();
								this.keep.sections.formula.table.template.elm('[field-id=field]').elm('select').empty().assignoption(fields(false,false,(() => {
									var res=[];
									for (var key in fieldinfos)
										((fieldinfo) => {
											switch (fieldinfo.type)
											{
												case 'address':
													for (var key in fieldinfo.mapping)
														if (fieldinfo.mapping[key])
														{
															res.push(fieldinfo.mapping[key]);
															delete formulainfos[fieldinfo.mapping[key]];
														}
													break;
											}
										})(fieldinfos[key]);
									return res;
								})(),['canvas','file','id','autonumber','creator','createdtime','modifier','modifiedtime']),'caption','id');
								this.keep.action.formula.each((values,index) => {
									if (values.field in formulainfos)
										((row) => {
											row.elm('[field-id=field]').elm('select').val(values.field).rebuild().then(() => {
												row.elm('[field-id=formula]').elm('input').val(values.formula);
											});
										})(this.keep.sections.formula.table.addrow());
								});
								if (this.keep.sections.formula.table.tr.length==0) this.keep.sections.formula.table.addrow();
							}
							switch (this.keep.action.trigger)
							{
								case 'button':
									res['caption']={value:this.keep.action.caption};
									res['message']={value:this.keep.action.message};
									res['spreadsheet']={value:this.keep.action.report.spreadsheet};
									res['saveas']={value:this.keep.action.report.saveas};
									res['store']={value:this.keep.action.report.store};
									res['size']={value:this.keep.action.report.size};
									res['orientation']={value:this.keep.action.report.orientation};
									res['pattern']={value:((pattern) => {
										switch (pattern)
										{
											case 'insert':
												this.keep.sections.transfer.tables.criteria.closest('.pd-field').hide();
												break;
											case 'update':
												this.keep.sections.transfer.tables.criteria.closest('.pd-field').show();
												break;
											case 'upsert':
												this.keep.sections.transfer.tables.criteria.closest('.pd-field').show();
												break;
										}
										return pattern;
									})(this.keep.action.transfer.pattern)};
									res['from']={value:this.keep.action.mail.from};
									res['to']={value:this.keep.action.mail.to};
									res['cc']={value:this.keep.action.mail.cc};
									res['bcc']={value:this.keep.action.mail.bcc};
									res['attachment']={value:this.keep.action.mail.attachment};
									res['subject']={value:this.keep.action.mail.subject};
									res['body']={value:this.keep.action.mail.body};
									((elements) => {
										elements.spreadsheet.val(this.keep.action.report.spreadsheet).closest('.pd-spreadsheet').elm('button').rebuild().then((sheets) => {
											elements.tables.template.clearrows();
											this.keep.action.report.template.each((values,index) => {
												if (values in sheets) elements.tables.template.addrow().elm('[field-id=template]').elm('select').val(values);
											});
											if (elements.tables.template.tr.length==0) elements.tables.template.addrow();
										});
										elements.saveas.empty().assignoption((() => {
											var res=[];
											res.push({
												id:{value:''},
												caption:{value:''}
											});
											for (var key in fieldinfos)
												((fieldinfo) => {
													switch (fieldinfo.type)
													{
														case 'autonumber':
														case 'dropdown':
														case 'radio':
														case 'text':
															if (!fieldinfo.tableid)
																res.push({
																	id:{value:fieldinfo.id},
																	caption:{value:fieldinfo.caption}
																});
															break;
													}
												})(fieldinfos[key]);
											return res;
										})(),'caption','id');
										elements.store.empty().assignoption((() => {
											var res=[];
											res.push({
												id:{value:''},
												caption:{value:''}
											});
											for (var key in fieldinfos)
												((fieldinfo) => {
													switch (fieldinfo.type)
													{
														case 'file':
															if (!fieldinfo.tableid)
																res.push({
																	id:{value:fieldinfo.id},
																	caption:{value:fieldinfo.caption}
																});
															break;
													}
												})(fieldinfos[key]);
											return res;
										})(),'caption','id');
										elements.app.empty().assignoption((() => {
											var res=[];
											res.push({
												id:{value:''},
												caption:{value:pd.constants.action.prompt.transfer.app[pd.lang]}
											});
											pd.kumaneko.sort(this.keep.config.apps.user,this.keep.config.apps.sort).each((app,index) => {
												res.push({
													id:{value:app.id},
													caption:{value:app.name}
												});
											});
											return res;
										})(),'caption','id').val(this.keep.action.transfer.app).rebuild().then((fields) => {
											elements.tables.criteria.clearrows();
											this.keep.action.transfer.criteria.each((values,index) => {
												if (values.external in fields.criteria)
													((row) => {
														row.elm('[field-id=external]').elm('select').val(values.external).rebuild().then((fields) => {
															if (values.internal in fields)
															{
																row.elm('[field-id=operator]').elm('select').val(values.operator);
																row.elm('[field-id=internal]').elm('select').val(values.internal);
															}
														});
													})(elements.tables.criteria.addrow());
											});
											if (elements.tables.criteria.tr.length==0) elements.tables.criteria.addrow();
											elements.tables.mapping.clearrows();
											this.keep.action.transfer.mapping.each((values,index) => {
												if (values.external in fields.mapping)
													((row) => {
														row.elm('[field-id=external]').elm('select').val(values.external).rebuild().then((fields) => {
															if (values.internal in fields) row.elm('[field-id=internal]').elm('select').val(values.internal);
														});
													})(elements.tables.mapping.addrow());
											});
											if (elements.tables.mapping.tr.length==0) elements.tables.mapping.addrow();
										});
										elements.from.empty().assignoption((() => {
											var res=[];
											res.push({
												id:{value:''},
												caption:{value:''}
											});
											Array.prototype.push.apply(res,this.keep.mail.map((item) => ({id:{value:item},caption:{value:item}})));
											return res;
										})(),'caption','id');
										elements.to.empty().assignoption((() => {
											var res=[];
											res.push({
												id:{value:''},
												caption:{value:''}
											});
											for (var key in fieldinfos)
												((fieldinfo) => {
													switch (fieldinfo.type)
													{
														case 'text':
															if (fieldinfo.format=='mail')
																res.push({
																	id:{value:fieldinfo.id},
																	caption:{value:fieldinfo.caption}
																});
															break;
													}
												})(fieldinfos[key]);
											return res;
										})(),'caption','id');
										elements.attachment.empty().assignoption((() => {
											var res=[];
											res.push({
												id:{value:''},
												caption:{value:''}
											});
											for (var key in fieldinfos)
												((fieldinfo) => {
													switch (fieldinfo.type)
													{
														case 'file':
															res.push({
																id:{value:fieldinfo.id},
																caption:{value:fieldinfo.caption}
															});
															break;
													}
												})(fieldinfos[key]);
											return res;
										})(),'caption','id');
									})({
										spreadsheet:this.contents.elm('[field-id=spreadsheet]').elm('input'),
										saveas:this.contents.elm('[field-id=saveas]').elm('select'),
										store:this.contents.elm('[field-id=store]').elm('select'),
										app:this.contents.elm('[field-id=app]').elm('select'),
										from:this.contents.elm('[field-id=from]').elm('select'),
										to:this.contents.elm('[field-id=to]').elm('select'),
										attachment:this.contents.elm('[field-id=attachment]').elm('select'),
										tables:pd.extend({template:this.keep.sections.report.table},this.keep.sections.transfer.tables)
									});
									break;
								case 'saving':
									res['suspend']={value:this.keep.action.suspend.message};
									res['continue']={value:(this.keep.action.suspend.continue)?[this.app.fields.continue.options.first().option.value]:[]};
									break;
								case 'value':
									res['record']={value:((record) => {
										if (record.length!=0)
										{
											this.keep.action.disabled.fields=[{field:''}];
											this.keep.sections.disabled.table.hide();
										}
										else this.keep.sections.disabled.table.show('table');
										return record;
									})((this.keep.action.disabled.record)?[this.app.fields.record.options.first().option.value]:[])};
									res['style']={value:((styles) => {
										var res=[];
										this.keep.sections.style.table.clearrows();
										this.keep.sections.style.table.template.elm('[field-id=field]').elm('select').empty().assignoption(fields(false,false),'caption','id');
										this.keep.sections.style.table.addrow();
										styles.each((style,index) => {
											if (style.field in fieldinfos)
												res.push({
													field:{value:style.field},
													backcolor:{value:style.backcolor},
													forecolor:{value:style.forecolor}
												});
										});
										return res;
									})(this.keep.action.style)};
									res['disabled']={value:((disableds) => {
										var res=[];
										this.keep.sections.disabled.table.clearrows();
										this.keep.sections.disabled.table.template.elm('[field-id=field]').elm('select').empty().assignoption(fields(false,true),'caption','id');
										this.keep.sections.disabled.table.addrow();
										disableds.each((disabled,index) => {
											((containers) => {
												if ((disabled.field in fieldinfos) || containers.some((item) => (item.id==disabled.field && ['table'].includes(item.type))))
													res.push({
														field:{value:disabled.field}
													});
											})(Object.values(this.keep.fields));
										});
										return res;
									})(this.keep.action.disabled.fields)};
									res['hidden']={value:((hiddens) => {
										var res=[];
										this.keep.sections.hidden.table.clearrows();
										this.keep.sections.hidden.table.template.elm('[field-id=field]').elm('select').empty().assignoption(fields(true,true),'caption','id');
										this.keep.sections.hidden.table.addrow();
										hiddens.each((hidden,index) => {
											((containers) => {
												if ((hidden.field in fieldinfos) || containers.some((item) => (item.id==hidden.field && ['box','table'].includes(item.type))))
													res.push({
														field:{value:hidden.field}
													});
											})(Object.values(this.keep.fields).concat(this.keep.layout));
										});
										return res;
									})(this.keep.action.hidden)};
									this.keep.sections.option.table.clearrows();
									this.keep.sections.option.table.template.elm('[field-id=field]').elm('select').empty().assignoption((() => {
										var res=[];
										res.push({
											id:{value:''},
											caption:{value:''}
										});
										for (var key in fieldinfos)
											((fieldinfo) => {
												switch (fieldinfo.type)
												{
													case 'checkbox':
													case 'dropdown':
													case 'radio':
														res.push({
															id:{value:fieldinfo.id},
															caption:{value:fieldinfo.caption}
														});
														break;
												}
											})(fieldinfos[key]);
										return res;
									})(),'caption','id');
									this.keep.action.option.each((values,index) => {
										if (values.field in fieldinfos)
											((row) => {
												row.elm('[field-id=field]').elm('select').val(values.field).rebuild().then(() => {
													row.elm('[field-id=option]').elms('input').each((element,index) => element.checked=values.options.includes(element.val()));
												});
											})(this.keep.sections.option.table.addrow());
									});
									if (this.keep.sections.option.table.tr.length==0) this.keep.sections.option.table.addrow();
									break;
							}
							return res;
						})());
					})(pd.ui.field.parallelize(this.keep.fields));
					this.keep.filter.monitor.html(((query) => {
						var res=[];
						res.push(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;filters');
						switch (this.keep.action.trigger)
						{
							case 'button':
								if (this.keep.action.rows.del.length!=0) this.keep.sections.del.container.open();
								else this.keep.sections.del.container.close();
								if (this.keep.action.rows.fill.length!=0) this.keep.sections.fill.container.open();
								else this.keep.sections.fill.container.close();
								if (this.keep.action.formula.length!=0) this.keep.sections.formula.container.open();
								else this.keep.sections.formula.container.close();
								if (this.keep.action.report.spreadsheet) this.keep.sections.report.container.open();
								else this.keep.sections.report.container.close();
								if (this.keep.action.transfer.app) this.keep.sections.transfer.container.open();
								else this.keep.sections.transfer.container.close();
								if (this.keep.action.mail.to) this.keep.sections.mail.container.open();
								else this.keep.sections.mail.container.close();
								this.keep.sections.trigger.caption.show();
								this.keep.sections.trigger.message.show();
								this.keep.sections.del.container.show();
								this.keep.sections.fill.container.show();
								this.keep.sections.formula.container.show();
								this.keep.sections.report.container.show();
								this.keep.sections.transfer.container.show();
								this.keep.sections.mail.container.show();
								this.keep.sections.style.container.hide();
								this.keep.sections.disabled.container.hide();
								this.keep.sections.hidden.container.hide();
								this.keep.sections.option.container.hide();
								this.keep.sections.suspend.container.hide();
								break;
							case 'saving':
								if (this.keep.action.suspend.message) this.keep.sections.suspend.container.open();
								else this.keep.sections.suspend.container.close();
								this.keep.sections.trigger.caption.hide();
								this.keep.sections.trigger.message.hide();
								this.keep.sections.del.container.hide();
								this.keep.sections.fill.container.hide();
								this.keep.sections.formula.container.hide();
								this.keep.sections.report.container.hide();
								this.keep.sections.transfer.container.hide();
								this.keep.sections.mail.container.hide();
								this.keep.sections.style.container.hide();
								this.keep.sections.disabled.container.hide();
								this.keep.sections.hidden.container.hide();
								this.keep.sections.option.container.hide();
								this.keep.sections.suspend.container.show();
								break;
							case 'value':
								if (this.keep.action.rows.del.length!=0) this.keep.sections.del.container.open();
								else this.keep.sections.del.container.close();
								if (this.keep.action.rows.fill.length!=0) this.keep.sections.fill.container.open();
								else this.keep.sections.fill.container.close();
								if (this.keep.action.formula.length!=0) this.keep.sections.formula.container.open();
								else this.keep.sections.formula.container.close();
								if (this.keep.action.style.length!=0) this.keep.sections.style.container.open();
								else this.keep.sections.style.container.close();
								if (this.keep.action.disabled.fields.length!=0) this.keep.sections.disabled.container.open();
								else this.keep.sections.disabled.container.close();
								if (this.keep.action.hidden.length!=0) this.keep.sections.hidden.container.open();
								else this.keep.sections.hidden.container.close();
								if (this.keep.action.option.length!=0) this.keep.sections.option.container.open();
								else this.keep.sections.option.container.close();
								this.keep.sections.trigger.caption.hide();
								this.keep.sections.trigger.message.hide();
								this.keep.sections.del.container.show();
								this.keep.sections.fill.container.show();
								this.keep.sections.formula.container.show();
								this.keep.sections.report.container.hide();
								this.keep.sections.transfer.container.hide();
								this.keep.sections.mail.container.hide();
								this.keep.sections.style.container.show();
								this.keep.sections.disabled.container.show();
								this.keep.sections.hidden.container.show();
								this.keep.sections.option.container.show();
								this.keep.sections.suspend.container.hide();
								break;
						}
						return res.join('&nbsp;');
					})(this.keep.action.filter));
					resolve();
				});
			}
			/* show */
			show(action,fields,layout,callback){
				if (action instanceof Object)
				{
					pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
					.then((resp) => {
						/* setup properties */
						this.keep.action=pd.extend({},action);
						this.keep.config=resp.file;
						this.keep.fields=fields;
						this.keep.layout=layout;
						pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:'project',id:'1'})
						.then((resp) => {
							this.keep.mail=(resp.total!=0)?resp.record.smtp.value.shape((item) => (item.smtp_mail.value)?item.smtp_mail.value:PD_THROW):[];
							/* modify elements */
							this.contents.elms('input,select,textarea').each((element,index) => {
								if (element.alert) element.alert.hide();
							});
							/* setup handler */
							if (this.handler)
							{
								this.ok.off('click',this.handler);
								this.cancel.off('click');
							}
							this.handler=(e) => {
								this.get().then((resp) => {
									if (!resp.error)
									{
										callback(this.keep.action);
										this.hide();
									}
								});
							};
							this.ok.on('click',this.handler);
							this.cancel.on('click',(e) => this.hide());
							/* set configuration */
							this.set().then(() => {
								/* show */
								super.show();
							});
						})
						.catch((error) => pd.alert(error.message));
					})
					.catch((error) => pd.alert(error.message));
				}
				else pd.alert(pd.constants.common.message.invalid.config.corrupted[pd.lang]);
			}
		},
		deduplication:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999995,false,false);
				/* setup properties */
				this.app={
					id:'deduplicationbuilder',
					fields:{
						name:{
							id:'name',
							type:'text',
							caption:pd.constants.deduplication.caption.name[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.deduplication.prompt.name[pd.lang]
						},
						message:{
							id:'message',
							type:'text',
							caption:pd.constants.deduplication.caption.message[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.deduplication.prompt.message[pd.lang]
						}
					}
				};
				this.keep={
					layout:[],
					fields:{},
					deduplication:{}
				};
				this.tables={
					criteria:null
				};
				/* modify elements */
				this.tables.criteria=pd.ui.table.create({
					id:'criterias',
					type:'table',
					caption:'',
					nocaption:true,
					fields:{
						external:{
							id:'external',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						operator:{
							id:'operator',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						internal:{
							id:'internal',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						}
					}
				}).spread((row,index) => {
					/* event */
					row.elm('.pd-table-row-add').on('click',(e) => {
						this.tables.criteria.insertrow(row);
					});
					row.elm('.pd-table-row-del').on('click',(e) => {
						pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
							this.tables.criteria.delrow(row);
						});
					});
					/* modify elements */
					((cells) => {
						cells.external.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
							return new Promise((resolve,reject) => {
								cells.operator.empty();
								cells.internal.empty().append(pd.create('option').attr('value','').html(pd.constants.deduplication.caption.internal[pd.lang]));
								if (cells.external.val())
								{
									resolve(((fields) => {
										var res={};
										cells.operator.assignoption(pd.filter.query.operator(fields[cells.external.val()]),'caption','id');
										for (var key in fields)
											((fieldinfo) => {
												if (pd.ui.field.typing(fieldinfo,fields[cells.external.val()],true))
												{
													cells.internal.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
													res[fieldinfo.id]=fieldinfo;
												}
											})(fields[key]);
										return res;
									})(this.keep.fields));
								}
								else resolve({});
							});
						};
					})({
						external:row.elm('[field-id=external]').elm('select'),
						operator:row.elm('[field-id=operator]').elm('select'),
						internal:row.elm('[field-id=internal]').elm('select')
					});
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
				},false);
				this.header.addclass('pd-kumaneko-builder-header')
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-title').html('Deduplication Settings'))
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-id'));
				this.container.addclass('pd-kumaneko-main').css({
					height:'calc(100% - 1em)',
					width:'55em'
				});
				this.contents.addclass('pd-kumaneko-deduplicationbuilder').css({
					padding:'0'
				})
				.append(
					((contents) => {
						contents
						.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.name).css({width:'100%'}),this.app))
						.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.message).css({width:'100%'}),this.app))
						.append(
							pd.create('div').addclass('pd-kumaneko-section')
							.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.deduplication.caption.criteria[pd.lang]))
							.append(this.tables.criteria)
						);
						return contents;
					})(pd.create('div').addclass('pd-scope').attr('form-id','form_'+this.app.id))
				);
				this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					var res=pd.record.get(this.contents,this.app);
					if (!res.error)
					{
						((record) => {
							var res={
								error:false,
								deduplication:this.keep.deduplication
							};
							if (!record.name.value)
							{
								res.error=true;
								pd.alert(pd.constants.deduplication.message.invalid.name[pd.lang],() => {
									resolve(res);
								});
							}
							if (!record.message.value)
							{
								res.error=true;
								pd.alert(pd.constants.deduplication.message.invalid.message[pd.lang],() => {
									resolve(res);
								});
							}
							if (!res.error)
							{
								var criteria=(() => {
									var res=[];
									this.tables.criteria.tr.each((element,index) => {
										if (element.elm('[field-id=external]').elm('select').val() && element.elm('[field-id=internal]').elm('select').val())
											res.push({
												external:element.elm('[field-id=external]').elm('select').val(),
												operator:element.elm('[field-id=operator]').elm('select').val(),
												internal:element.elm('[field-id=internal]').elm('select').val()
											});
									});
									return res;
								})();
								if (criteria.length==0)
								{
									res.error=true;
									pd.alert(pd.constants.deduplication.message.invalid.criteria[pd.lang],() => {
										resolve(res);
									});
								}
								else res.deduplication.criteria=criteria;
							}
							res.deduplication.name=record.name.value;
							res.deduplication.message=record.message.value;
							if (!res.error) resolve(res);
						})(res.record);
					}
					else resolve(res);
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					this.header.elm('.pd-kumaneko-builder-header-id').html('id&nbsp;'+this.keep.deduplication.id.toString()).off('click').on('click',(e) => {
						navigator.clipboard.writeText(this.keep.deduplication.id.toString()).then(() => {
							pd.alert(pd.constants.common.message.clipboard[pd.lang]);
						})
					});
					pd.record.set(this.contents,this.app,(() => {
						var res={
							name:{value:this.keep.deduplication.name},
							message:{value:this.keep.deduplication.message}
						};
						((criterias) => {
							criterias.clearrows();
							criterias.template.elm('[field-id=external]').elm('select').empty().append(pd.create('option').attr('value','').html(pd.constants.deduplication.caption.external[pd.lang]));
							criterias.template.elm('[field-id=operator]').elm('select').empty();
							criterias.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option').attr('value','').html(pd.constants.deduplication.caption.internal[pd.lang]));
							for (var key in this.keep.fields)
							{
								switch (this.keep.fields[key].type)
								{
									case 'canvas':
									case 'file':
									case 'spacer':
									case 'table':
										break;
									default:
										criterias.template.elm('select').append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
										break;
								}
							}
							this.keep.deduplication.criteria.each((values,index) => {
								if (values.external in this.keep.fields)
									((row) => {
										row.elm('[field-id=external]').elm('select').val(values.external).rebuild().then((fields) => {
											if (values.internal in fields)
											{
												row.elm('[field-id=operator]').elm('select').val(values.operator);
												row.elm('[field-id=internal]').elm('select').val(values.internal);
											}
										});
									})(criterias.addrow());
							});
							if (criterias.tr.length==0) criterias.addrow();
						})(this.tables.criteria);
						return res;
					})());
					resolve();
				});
			}
			/* show */
			show(deduplication,fields,layout,callback){
				if (deduplication instanceof Object)
				{
					/* setup properties */
					this.keep.deduplication=pd.extend({},deduplication);
					this.keep.fields=fields;
					this.keep.layout=layout;
					/* modify elements */
					this.contents.elms('input,select,textarea').each((element,index) => {
						if (element.alert) element.alert.hide();
					});
					/* setup handler */
					if (this.handler)
					{
						this.ok.off('click',this.handler);
						this.cancel.off('click');
					}
					this.handler=(e) => {
						this.get().then((resp) => {
							if (!resp.error)
							{
								callback(this.keep.deduplication);
								this.hide();
							}
						});
					};
					this.ok.on('click',this.handler);
					this.cancel.on('click',(e) => this.hide());
					/* set configuration */
					this.set().then(() => {
						/* show */
						super.show();
					});
				}
				else pd.alert(pd.constants.common.message.invalid.config.corrupted[pd.lang]);
			}
		},
		field:class extends panda_dialog{
			/* constructor */
			constructor(fieldinfo){
				super(999995,false,false);
				/* setup properties */
				this.fieldinfo=fieldinfo;
				this.app={
					id:'fieldbuilder_'+this.fieldinfo.id.toString(),
					fields:{
						id:{
							id:'id',
							type:'text',
							caption:pd.constants.field.caption.id[pd.lang],
							required:false,
							nocaption:false,
							format:'text'
						},
						caption:{
							id:'caption',
							type:'text',
							caption:pd.constants.field.caption.caption[pd.lang],
							required:true,
							nocaption:false,
							format:'text'
						},
						nocaption:{
							id:'nocaption',
							type:'checkbox',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'nocaption'}}
							]
						},
						required:{
							id:'required',
							type:'checkbox',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'required'}}
							]
						},
						placeholder:{
							id:'placeholder',
							type:'text',
							caption:pd.constants.field.caption.placeholder[pd.lang],
							required:false,
							nocaption:false,
							format:'text'
						},
						format:{
							id:'format',
							type:'dropdown',
							caption:pd.constants.field.caption.format[pd.lang],
							required:true,
							nocaption:false,
							options:[
								{option:{value:'text'}},
								{option:{value:'alphabet'}},
								{option:{value:'alphanum'}},
								{option:{value:'mail'}},
								{option:{value:'password'}},
								{option:{value:'tel'}},
								{option:{value:'url'}}
							]
						},
						lines:{
							id:'lines',
							type:'number',
							caption:pd.constants.field.caption.lines[pd.lang],
							required:false,
							nocaption:false,
							demiliter:false,
							decimals:'0'
						},
						options:{
							id:'options',
							type:'table',
							caption:'',
							nocaption:true,
							fields:{
								option:{
									id:'option',
									type:'text',
									caption:'',
									required:false,
									nocaption:true,
									format:'text'
								}
							}
						},
						multiuse:{
							id:'multiuse',
							type:'checkbox',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'multiuse'}}
							]
						},
						contents:{
							id:'contents',
							type:'textarea',
							caption:pd.constants.field.caption.contents[pd.lang],
							required:false,
							nocaption:false
						},
						demiliter:{
							id:'demiliter',
							type:'checkbox',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'demiliter'}}
							]
						},
						decimals:{
							id:'decimals',
							type:'number',
							caption:pd.constants.field.caption.decimals[pd.lang],
							required:false,
							nocaption:false,
							demiliter:false,
							decimals:'0'
						},
						unit:{
							id:'unit',
							type:'text',
							caption:pd.constants.field.caption.unit[pd.lang],
							required:false,
							nocaption:false,
							format:'text'
						},
						unitposition:{
							id:'unitposition',
							type:'radio',
							caption:pd.constants.field.caption.unitposition[pd.lang],
							required:true,
							nocaption:false,
							options:[
								{option:{value:'prefix'}},
								{option:{value:'suffix'}}
							]
						},
						lat:{
							id:'lat',
							type:'dropdown',
							caption:pd.constants.field.caption.address.lat[pd.lang],
							required:true,
							nocaption:false,
							options:[]
						},
						lng:{
							id:'lng',
							type:'dropdown',
							caption:pd.constants.field.caption.address.lng[pd.lang],
							required:true,
							nocaption:false,
							options:[]
						},
						app:{
							id:'app',
							type:'dropdown',
							caption:pd.constants.field.caption.lookup.app[pd.lang],
							required:true,
							nocaption:false,
							options:[]
						},
						search:{
							id:'search',
							type:'dropdown',
							caption:pd.constants.field.caption.lookup.search[pd.lang],
							required:true,
							nocaption:false,
							options:[]
						},
						ignore:{
							id:'ignore',
							type:'checkbox',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'ignore'}}
							]
						},
						prefecture:{
							id:'prefecture',
							type:'dropdown',
							caption:pd.constants.field.caption.postalcode.prefecture[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						prefecturename:{
							id:'prefecturename',
							type:'dropdown',
							caption:pd.constants.field.caption.postalcode.prefecturename[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						city:{
							id:'city',
							type:'dropdown',
							caption:pd.constants.field.caption.postalcode.city[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						cityname:{
							id:'cityname',
							type:'dropdown',
							caption:pd.constants.field.caption.postalcode.cityname[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						streetname:{
							id:'streetname',
							type:'dropdown',
							caption:pd.constants.field.caption.postalcode.streetname[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						address:{
							id:'address',
							type:'dropdown',
							caption:pd.constants.field.caption.postalcode.address[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						fixed:{
							id:'fixed',
							type:'number',
							caption:pd.constants.field.caption.fixed[pd.lang],
							required:true,
							nocaption:false,
							demiliter:false,
							decimals:'0'
						},
						width:{
							id:'width',
							type:'number',
							caption:pd.constants.field.caption.width[pd.lang],
							required:true,
							nocaption:false,
							demiliter:false,
							decimals:'0',
							unit:'px',
							unitposition:'suffix'
						}
					}
				};
				this.builder={
					lookup:class extends panda_dialog{
						/* constructor */
						constructor(){
							super(999996,false,false);
							/* setup properties */
							this.keep={
								fields:{}
							};
							this.tables={
								field:null
							};
							/* modify elements */
							this.tables.field=pd.ui.table.create({
								id:'fields',
								type:'table',
								caption:'',
								nocaption:true,
								fields:{
									external:{
										id:'external',
										type:'dropdown',
										caption:'',
										required:false,
										nocaption:true,
										options:[]
									},
									guide:{
										id:'guide',
										type:'spacer',
										caption:'',
										required:false,
										nocaption:true,
										contents:'<span class="pd-icon pd-icon-arrow pd-icon-arrow-right"></span>'
									},
									internal:{
										id:'internal',
										type:'dropdown',
										caption:'',
										required:false,
										nocaption:true,
										options:[]
									}
								}
							}).addclass('pd-mapping').spread((row,index) => {
								/* event */
								row.elm('.pd-table-row-add').on('click',(e) => {
									this.tables.field.insertrow(row);
								});
								row.elm('.pd-table-row-del').on('click',(e) => {
									pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
										this.tables.field.delrow(row);
									});
								});
								/* modify elements */
								((cells) => {
									cells.external.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
										return new Promise((resolve,reject) => {
											cells.internal.empty().append(pd.create('option'));
											if (cells.external.val())
											{
												resolve(((elements) => {
													var res={};
													if (elements.internal.val())
														((fields) => {
															for (var key in fields.internal)
																((fieldinfo) => {
																	if (pd.ui.field.typing(fields.external[cells.external.val()],fieldinfo))
																	{
																		cells.internal.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																		res[fieldinfo.id]=fieldinfo;
																	}
																})(fields.internal[key]);
														})({
															external:this.keep.fields.external[elements.external.val()].fields,
															internal:this.keep.fields.internal[elements.internal.val()].fields
														});
													return res;
												})({
													external:this.contents.elm('[field-id=external]').elm('select'),
													internal:this.contents.elm('[field-id=internal]').elm('select')
												}));
											}
											else resolve({});
										});
									};
								})({
									external:row.elm('[field-id=external]').elm('select'),
									internal:row.elm('[field-id=internal]').elm('select')
								});
							},(table,index) => {
								if (table.tr.length==0) table.addrow();
							},false);
							this.header.css({paddingLeft:'0.25em',textAlign:'left'}).html('Lookup Table Settings');
							this.container.addclass('pd-kumaneko-main').css({
								height:'calc(100% - 1em)',
								width:'45em'
							});
							this.contents.addclass('pd-kumaneko-fieldbuilder').css({
								padding:'0'
							})
							.append(
								((contents) => {
									contents
									.append(
										((res) => {
											res.elm('select').on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
												return new Promise((resolve,reject) => {
													this.tables.field.clearrows();
													this.tables.field.template.elm('[field-id=external]').elm('select').empty().append(pd.create('option'));
													this.tables.field.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option'));
													this.tables.field.template.elm('[field-id=guide]').parentNode.addclass('pd-mapping-guide');
													if (res.elm('select').val())
													{
														resolve(((fieldinfos) => {
															for (var key in fieldinfos)
																((fieldinfo) => {
																	switch (fieldinfo.type)
																	{
																		case 'spacer':
																			break;
																		default:
																			this.tables.field.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																			break;
																	}
																})(fieldinfos[key]);
															this.tables.field.addrow();
															return {};
														})(this.keep.fields.external[res.elm('select').val()].fields));
													}
													else
													{
														this.tables.field.addrow();
														resolve({});
													}
												});
											};
											return res;
										})(pd.ui.field.create({
											id:'external',
											type:'dropdown',
											caption:pd.constants.field.caption.lookup.table.builder.external[pd.lang],
											required:false,
											nocaption:false,
											options:[]
										}).css({width:'50%'}))
									)
									.append(
										((res) => {
											res.elm('select').on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
												return new Promise((resolve,reject) => {
													this.tables.field.clearrows();
													this.tables.field.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option'));
													this.tables.field.template.elm('[field-id=guide]').parentNode.addclass('pd-mapping-guide');
													this.tables.field.addrow();
													resolve({});
												});
											};
											return res;
										})(pd.ui.field.create({
											id:'internal',
											type:'dropdown',
											caption:pd.constants.field.caption.lookup.table.builder.internal[pd.lang],
											required:false,
											nocaption:false,
											options:[]
										}).css({width:'50%'}))
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-section')
										.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.field.caption.lookup.table.builder.fields[pd.lang]))
										.append(this.tables.field)
									);
									return contents;
								})(pd.create('div').addclass('pd-scope'))
							);
							this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
						}
						/* get configuration */
						get(){
							return new Promise((resolve,reject) => {
								var res={
									error:false,
									table:{
										id:{
											external:this.contents.elm('[field-id=external]').elm('select').val(),
											internal:this.contents.elm('[field-id=internal]').elm('select').val()
										},
										fields:this.tables.field.tr.reduce((result,current) => {
											if (current.elm('[field-id=external]').elm('select').val() && current.elm('[field-id=internal]').elm('select').val())
												result.push({
													external:current.elm('[field-id=external]').elm('select').val(),
													internal:current.elm('[field-id=internal]').elm('select').val()
												});
											return result;
										},[])
									}
								};
								if (!res.error)
									if (!res.table.id.external)
									{
										res.error=true;
										pd.alert(pd.constants.field.message.invalid.lookup.table.builder.external[pd.lang],() => {
											resolve(res);
										});
									}
								if (!res.error)
									if (!res.table.id.internal)
									{
										res.error=true;
										pd.alert(pd.constants.field.message.invalid.lookup.table.builder.internal[pd.lang],() => {
											resolve(res);
										});
									}
								if (!res.error)
									if (res.table.fields.length==0)
									{
										res.error=true;
										pd.alert(pd.constants.field.message.invalid.lookup.table.builder.fields[pd.lang],() => {
											resolve(res);
										});
									}
								if (!res.error) resolve(res);
							});
						}
						/* set configuration */
						set(table){
							return new Promise((resolve,reject) => {
								((elements,fields) => {
									elements.external.empty().assignoption((() => {
										var res=[];
										res.push({
											id:{value:''},
											caption:{value:''}
										});
										for (var key in fields.external)
											((fieldinfo) => {
												res.push({
													id:{value:fieldinfo.id},
													caption:{value:fieldinfo.caption}
												});
											})(fields.external[key]);
										return res;
									})(),'caption','id').val(table.id.external).rebuild().then(() => {
										elements.internal.empty().assignoption((() => {
											var res=[];
											res.push({
												id:{value:''},
												caption:{value:''}
											});
											for (var key in fields.internal)
												((fieldinfo) => {
													res.push({
														id:{value:fieldinfo.id},
														caption:{value:fieldinfo.caption}
													});
												})(fields.internal[key]);
											return res;
										})(),'caption','id').val(table.id.internal).rebuild().then(() => resolve(fields));
									});
								})(
									{
										external:this.contents.elm('[field-id=external]').elm('select'),
										internal:this.contents.elm('[field-id=internal]').elm('select')
									},
									{
										external:this.keep.fields.external,
										internal:this.keep.fields.internal
									}
								);
							});
						}
						/* show */
						show(table,fields,callback){
							if (table instanceof Object)
							{
								/* setup properties */
								this.keep.fields=fields;
								/* modify elements */
								this.contents.elms('input,select,textarea').each((element,index) => {
									if (element.alert) element.alert.hide();
								});
								/* setup handler */
								if (this.handler)
								{
									this.ok.off('click',this.handler);
									this.cancel.off('click');
								}
								this.handler=(e) => {
									this.get().then((resp) => {
										if (!resp.error)
										{
											callback(resp.table);
											this.hide();
										}
									});
								};
								this.ok.on('click',this.handler);
								this.cancel.on('click',(e) => this.hide());
								/* set configuration */
								this.set(table).then((fields) => {
									this.tables.field.clearrows();
									if (table.id.external in fields.external)
										((fields) => {
											table.fields.each((values,index) => {
												if (values.external in fields)
													((row) => {
														row.elm('[field-id=external]').elm('select').val(values.external).rebuild().then((fields) => {
															if (values.internal in fields) row.elm('[field-id=internal]').elm('select').val(values.internal);
														});
													})(this.tables.field.addrow());
											});
										})(fields.external[table.id.external].fields);
									if (this.tables.field.tr.length==0) this.tables.field.addrow();
									/* show */
									super.show();
								});
							}
							else pd.alert(pd.constants.common.message.invalid.config.corrupted[pd.lang]);
						}
					}
				};
				this.keep={
					config:{},
					fields:{},
					parallelize:{},
					tables:{},
					lookup:{
						builder:null,
						monitor:null,
						query:'',
						sort:'',
						lib:{
							create:(app,table) => {
								var res=pd.create('div').addclass('pd-row');
								var setup=(table) => {
									res.table=table;
									res.elm('.pd-row-label').html(((label) => {
										return label.replace(/%external%/g,app.fields[table.id.external].caption).replace(/%internal%/g,this.keep.tables[table.id.internal].caption);
									})(pd.constants.field.caption.lookup.table.label[pd.lang]));
									return res;
								};
								/* setup properties */
								res.table=table;
								/* modify elements */
								res
								.append(
									pd.create('button').addclass('pd-icon pd-icon-edit pd-row-button')
									.on('click',(e) => {
										/* show tablebuilder */
										this.keep.lookup.builder.show(
											res.table,
											{
												external:((fields) => {
													var res={};
													for (var key in fields)
														if (fields[key].type=='table') res[key]=pd.extend({},fields[key]);
													return res;
												})(app.fields),
												internal:((fields) => {
													var res={};
													for (var key in fields)
														if (key!=this.keep.parallelize[this.fieldinfo.id].tableid)
															res[key]=pd.extend({},fields[key]);
													return res;
												})(this.keep.tables)
											},
											(table) => setup(table)
										);
									})
								)
								.append(
									pd.create('button').addclass('pd-icon pd-icon-del pd-row-button')
									.on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => res.parentNode.removeChild(res));
									})
								)
								.append(pd.create('span').addclass('pd-row-label'));
								return setup(table);
							}
						}
					}
				};
				this.tables={
					criteria:null,
					mapping:null,
					picker:null,
					group:null,
					option:null,
					table:null
				};
				/* modify elements */
				this.header.css({paddingLeft:'0.25em',textAlign:'left'}).html(this.fieldinfo.type.slice(0,1).toUpperCase()+this.fieldinfo.type.slice(1)+' Settings');
				this.container.addclass('pd-kumaneko-main').css({
					height:'calc(100% - 1em)',
					width:'45em'
				});
				this.contents.addclass('pd-kumaneko-fieldbuilder').css({
					padding:'0'
				})
				.append(
					((contents) => {
						contents
						.append(
							((res) => {
								res.elm('input').val(this.fieldinfo.id);
								res.elm('.pd-guide').css({cursor:'pointer'}).html(this.fieldinfo.id).off('click').on('click',(e) => {
									navigator.clipboard.writeText(this.fieldinfo.id).then(() => {
										pd.alert(pd.constants.common.message.clipboard[pd.lang]);
									})
								});
								return res;
							})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.id).addclass('pd-readonly').css({width:'100%'}),this.app))
						)
						.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.caption).css({width:'100%'}),this.app));
						if (!['box','spacer'].includes(this.fieldinfo.type))
						{
							contents.append(pd.ui.field.activate(((res) => {
								res.elm('input').closest('label').elm('span').html(pd.constants.field.caption.nocaption[pd.lang]);
								return res;
							})(pd.ui.field.create(this.app.fields.nocaption)).css({width:'100%'}),this.app));
							switch (this.fieldinfo.type)
							{
								case 'id':
								case 'autonumber':
								case 'creator':
								case 'createdtime':
								case 'modifier':
								case 'modifiedtime':
								case 'table':
									break;
								default:
									contents.append(pd.ui.field.activate(((res) => {
										res.elm('input').closest('label').elm('span').html(pd.constants.field.caption.required[pd.lang]);
										return res;
									})(pd.ui.field.create(this.app.fields.required)).css({width:'100%'}),this.app));
									if (this.fieldinfo.type=='number')
										contents.append(pd.ui.field.activate(((res) => {
											res.elm('input').closest('label').elm('span').html(pd.constants.field.caption.demiliter[pd.lang]);
											return res;
										})(pd.ui.field.create(this.app.fields.demiliter)).css({width:'100%'}),this.app));
									break;
							}
						}
						switch (this.fieldinfo.type)
						{
							case 'address':
							case 'lookup':
							case 'number':
							case 'postalcode':
							case 'text':
							case 'textarea':
								contents.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.placeholder).css({width:'100%'}),this.app));
								switch (this.fieldinfo.type)
								{
									case 'address':
										contents
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.lat).css({width:'50%'}),this.app))
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.lng).css({width:'50%'}),this.app));
										break;
									case 'lookup':
										this.tables.criteria=pd.ui.table.create({
											id:'criterias',
											type:'table',
											caption:'',
											nocaption:true,
											fields:{
												external:{
													id:'external',
													type:'dropdown',
													caption:'',
													required:false,
													nocaption:true,
													options:[]
												},
												operator:{
													id:'operator',
													type:'dropdown',
													caption:'',
													required:false,
													nocaption:true,
													options:[]
												},
												internal:{
													id:'internal',
													type:'dropdown',
													caption:'',
													required:false,
													nocaption:true,
													options:[]
												}
											}
										}).spread((row,index) => {
											/* event */
											row.elm('.pd-table-row-add').on('click',(e) => {
												this.tables.criteria.insertrow(row);
											});
											row.elm('.pd-table-row-del').on('click',(e) => {
												pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
													this.tables.criteria.delrow(row);
												});
											});
											/* modify elements */
											((cells) => {
												cells.external.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
													return new Promise((resolve,reject) => {
														cells.operator.empty();
														cells.internal.empty().append(pd.create('option').attr('value','').html(pd.constants.field.caption.lookup.internal[pd.lang]));
														if (cells.external.val())
														{
															resolve(((fields) => {
																var res={};
																cells.operator.assignoption(pd.filter.query.operator(fields.external[cells.external.val()]),'caption','id');
																for (var key in fields.internal)
																	((fieldinfo) => {
																		if (fieldinfo.tableid)
																			if (!(fieldinfo.id in this.keep.fields)) return;
																		if (pd.ui.field.typing(fieldinfo,fields.external[cells.external.val()],true))
																		{
																			cells.internal.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																			res[fieldinfo.id]=fieldinfo;
																		}
																	})(fields.internal[key]);
																return res;
															})({
																external:this.keep.config.apps.user[contents.elm('[field-id=app]').elm('select').val()].fields,
																internal:this.keep.parallelize
															}));
														}
														else resolve({});
													});
												};
											})({
												external:row.elm('[field-id=external]').elm('select'),
												operator:row.elm('[field-id=operator]').elm('select'),
												internal:row.elm('[field-id=internal]').elm('select')
											});
										},(table,index) => {
											if (table.tr.length==0) table.addrow();
										},false);
										this.tables.mapping=pd.ui.table.create({
											id:'mappings',
											type:'table',
											caption:'',
											nocaption:true,
											fields:{
												external:{
													id:'external',
													type:'dropdown',
													caption:'',
													required:false,
													nocaption:true,
													options:[]
												},
												guide:{
													id:'guide',
													type:'spacer',
													caption:'',
													required:false,
													nocaption:true,
													contents:'<span class="pd-icon pd-icon-arrow pd-icon-arrow-right"></span>'
												},
												internal:{
													id:'internal',
													type:'dropdown',
													caption:'',
													required:false,
													nocaption:true,
													options:[]
												}
											}
										}).addclass('pd-mapping').spread((row,index) => {
											/* event */
											row.elm('.pd-table-row-add').on('click',(e) => {
												this.tables.mapping.insertrow(row);
											});
											row.elm('.pd-table-row-del').on('click',(e) => {
												pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
													this.tables.mapping.delrow(row);
												});
											});
											/* modify elements */
											((cells) => {
												cells.external.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
													return new Promise((resolve,reject) => {
														cells.internal.empty().append(pd.create('option'));
														if (cells.external.val())
														{
															resolve(((fields) => {
																var res={};
																for (var key in fields.internal)
																	((fieldinfo) => {
																		if (pd.ui.field.typing(fields.external[cells.external.val()],fieldinfo))
																		{
																			cells.internal.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																			res[fieldinfo.id]=fieldinfo;
																		}
																	})(fields.internal[key]);
																return res;
															})({
																external:this.keep.config.apps.user[contents.elm('[field-id=app]').elm('select').val()].fields,
																internal:this.keep.fields
															}));
														}
														else resolve({});
													});
												};
											})({
												external:row.elm('[field-id=external]').elm('select'),
												internal:row.elm('[field-id=internal]').elm('select')
											});
										},(table,index) => {
											if (table.tr.length==0) table.addrow();
										},false);
										this.tables.picker=pd.ui.table.create({
											id:'pickers',
											type:'table',
											caption:'',
											nocaption:true,
											fields:{
												picker:{
													id:'picker',
													type:'dropdown',
													caption:'',
													required:false,
													nocaption:true,
													options:[]
												}
											}
										}).spread((row,index) => {
											/* event */
											row.elm('.pd-table-row-add').on('click',(e) => {
												this.tables.picker.insertrow(row);
											});
											row.elm('.pd-table-row-del').on('click',(e) => {
												pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
													this.tables.picker.delrow(row);
												});
											});
										},(table,index) => {
											if (table.tr.length==0) table.addrow();
										},false);
										contents
										.append(
											((res) => {
												res.elm('select').on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
													return new Promise((resolve,reject) => {
														((search,criterias,mappings,tables,pickers) => {
															search.empty().append(pd.create('option'));
															criterias.clearrows();
															criterias.template.elm('[field-id=external]').elm('select').empty().append(pd.create('option').attr('value','').html(pd.constants.field.caption.lookup.external[pd.lang]));
															criterias.template.elm('[field-id=operator]').elm('select').empty();
															criterias.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option').attr('value','').html(pd.constants.field.caption.lookup.internal[pd.lang]));
															mappings.clearrows();
															mappings.template.elm('[field-id=external]').elm('select').empty().append(pd.create('option'));
															mappings.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option'));
															mappings.template.elm('[field-id=guide]').parentNode.addclass('pd-mapping-guide');
															pickers.clearrows();
															pickers.template.elm('select').empty().append(pd.create('option'));
															this.keep.lookup.monitor.html('0&nbsp;Filters,&nbsp;0&nbsp;Sorts');
															this.keep.lookup.query='';
															this.keep.lookup.sort='';
															if (res.elm('select').val())
															{
																resolve(((fieldinfos) => {
																	var res={
																		origin:fieldinfos,
																		result:{}
																	};
																	for (var key in fieldinfos)
																		((fieldinfo) => {
																			switch (fieldinfo.type)
																			{
																				case 'canvas':
																				case 'file':
																					mappings.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																					pickers.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																					res.result[fieldinfo.id]=fieldinfo;
																					break;
																				case 'spacer':
																				case 'table':
																					break;
																				default:
																					criterias.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																					mappings.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																					pickers.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																					res.result[fieldinfo.id]=fieldinfo;
																					switch (fieldinfo.type)
																					{
																						case 'checkbox':
																						case 'creator':
																						case 'createdtime':
																						case 'department':
																						case 'group':
																						case 'lookup':
																						case 'modifier':
																						case 'modifiedtime':
																						case 'textarea':
																						case 'user':
																							break;
																						default:
																							search.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																							break;
																					}
																					break;
																			}
																		})(fieldinfos[key]);
																	criterias.addrow();
																	mappings.addrow();
																	pickers.addrow();
																	return res;
																})(this.keep.config.apps.user[res.elm('select').val()].fields));
															}
															else
															{
																criterias.addrow();
																mappings.addrow();
																pickers.addrow();
																resolve({origin:{},result:{}});
															}
														})(contents.elm('[field-id=search]').elm('select'),this.tables.criteria,this.tables.mapping,this.tables.table.empty(),this.tables.picker)
													});
												};
												return res;
											})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.app).css({width:'50%'}),this.app))
										)
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.search).css({width:'50%'}),this.app))
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.field.caption.lookup.mapping[pd.lang]))
												.append(this.tables.mapping);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
										.append(
											((res) => {
												/* build tablebuilder */
												this.keep.lookup.builder=new this.builder.lookup();
												/* modify elements */
												res.elm('.pd-field-value')
												.append(
													pd.create('button').addclass('pd-button pd-kumaneko-button').html(pd.constants.field.caption.button.lookup.table[pd.lang]).on('click',(e) => {
														/* show tablebuilder */
														((app) => {
															if (app)
															{
																this.keep.lookup.builder.show(
																	{
																		id:{
																			external:'',
																			internal:''
																		},
																		fields:[]
																	},
																	{
																		external:((fields) => {
																			var res={};
																			for (var key in fields)
																				if (fields[key].type=='table') res[key]=pd.extend({},fields[key]);
																			return res;
																		})(this.keep.config.apps.user[app].fields),
																		internal:((fields) => {
																			var res={};
																			for (var key in fields)
																				if (key!=this.keep.parallelize[this.fieldinfo.id].tableid)
																					res[key]=pd.extend({},fields[key]);
																			return res;
																		})(this.keep.tables)
																	},
																	(table) => this.tables.table.append(this.keep.lookup.lib.create(this.keep.config.apps.user[app],table))
																);
															}
															else pd.alert(pd.constants.field.message.invalid.lookup.app[pd.lang]);
														})(contents.elm('[field-id=app]').elm('select').val());
													})
												)
												.append(
													((tables) => {
														this.tables.table=tables;
														return tables;
													})(pd.create('div').addclass('pd-kumaneko-section').css({display:'block'}))
												)
												return res;
											})(pd.ui.field.create({
												id:'tables',
												type:'spacer',
												caption:pd.constants.field.caption.lookup.table[pd.lang],
												required:false,
												nocaption:false
											}).css({width:'100%'}))
										)
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.field.caption.lookup.picker[pd.lang]))
												.append(this.tables.picker);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.field.caption.lookup.criteria[pd.lang]))
												.append(this.tables.criteria);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
										.append(pd.ui.field.activate(((res) => {
											res.elm('input').closest('label').elm('span').html(pd.constants.field.caption.lookup.ignore[pd.lang]);
											return res;
										})(pd.ui.field.create(this.app.fields.ignore)).css({width:'100%'}),this.app))
										.append(
											((res) => {
												res.elm('.pd-field-value')
												.append(
													pd.create('button').addclass('pd-icon pd-icon-filter').on('click',(e) => {
														((app) => {
															if (app)
															{
																pd.filter.build(this.keep.config.apps.user[app],this.keep.lookup.query,this.keep.lookup.sort,(query,sort) => {
																	this.keep.lookup.monitor.html(((query,sort) => {
																		var res=[];
																		res.push(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
																		res.push(sort.split(',').filter((item) => item).length.toString()+'&nbsp;Sorts');
																		return res.join(',&nbsp;');
																	})(query,sort));
																	this.keep.lookup.query=query;
																	this.keep.lookup.sort=sort;
																})
															}
															else pd.alert(pd.constants.field.message.invalid.lookup.app[pd.lang]);
														})(contents.elm('[field-id=app]').elm('select').val());
													})
												)
												.append(
													((monitor) => {
														this.keep.lookup.monitor=monitor;
														return monitor;
													})(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
												)
												return res;
											})(pd.ui.field.create({
												id:'filters',
												type:'spacer',
												caption:pd.constants.field.caption.lookup.filter[pd.lang],
												required:false,
												nocaption:false
											}).css({width:'100%'}))
										);
										break;
									case 'number':
										contents
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.decimals).css({width:'100%'}),this.app))
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.unit).css({width:'50%'}),this.app))
										.append(pd.ui.field.activate(((res) => {
											res.elms('[data-name='+this.app.fields.unitposition.id+']').each((element,index) => {
												element.closest('label').elm('span').html(pd.constants.field.caption.unitposition[element.val()][pd.lang]);
											});
											return res;
										})(pd.ui.field.create(this.app.fields.unitposition)).css({width:'50%'}),this.app));
										break;
									case 'postalcode':
										contents
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.prefecturename).css({width:'50%'}),this.app))
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.prefecture).css({width:'50%'}),this.app))
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.cityname).css({width:'50%'}),this.app))
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.city).css({width:'50%'}),this.app))
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.streetname).css({width:'50%'}),this.app))
										.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.address).css({width:'50%'}),this.app));
										break;
									case 'text':
										contents.append(pd.ui.field.activate(((res) => {
											res.elms('option').each((element,index) => {
												if (element.val()) element.html(pd.constants.field.caption.format[element.val()][pd.lang]);
											});
											return res;
										})(pd.ui.field.create(this.app.fields.format).css({width:'100%'})),this.app));
										break;
									case 'textarea':
										contents.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.lines).css({width:'100%'}),this.app));
										break;
								}
								break;
							case 'autonumber':
								this.tables.group=pd.ui.table.create({
									id:'groups',
									type:'table',
									caption:'',
									nocaption:true,
									fields:{
										group:{
											id:'group',
											type:'dropdown',
											caption:'',
											required:false,
											nocaption:true,
											options:[]
										}
									}
								}).spread((row,index) => {
									/* event */
									row.elm('.pd-table-row-add').on('click',(e) => {
										this.tables.group.insertrow(row);
									});
									row.elm('.pd-table-row-del').on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											this.tables.group.delrow(row);
										});
									});
								},(table,index) => {
									if (table.tr.length==0) table.addrow();
								},false);
								contents
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.fixed).css({width:'100%'}),this.app))
								.append(
									((container) => {
										container
										.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.field.caption.group[pd.lang]))
										.append(this.tables.group);
										return container;
									})(pd.create('div').addclass('pd-kumaneko-section'))
								);
								break;
							case 'checkbox':
							case 'dropdown':
							case 'radio':
								this.tables.option=pd.ui.table.activate(pd.ui.table.create(this.app.fields.options),this.app);
								contents
								.append(
									((container) => {
										container
										.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.field.caption.option[pd.lang]))
										.append(this.tables.option);
										return container;
									})(pd.create('div').addclass('pd-kumaneko-section'))
								);
								break;
							case 'spacer':
								contents.css({
									height:'100%'
								})
								.append(pd.ui.field.activate(((res) => {
									res.elm('input').closest('label').elm('span').html(pd.constants.field.caption.multiuse[pd.lang]);
									return res;
								})(pd.ui.field.create(this.app.fields.multiuse)).css({width:'100%'}),this.app))
								.append(
									((res) => {
										res.elm('.pd-field-value').css({height:'calc(100% - (1.75em + 1px))'});
										return res;
									})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.contents).css({height:'calc(100% - (13.25em + 7px))',width:'100%'}),this.app))
								);
								break;
						}
						if (!['box','table'].includes(this.fieldinfo.type))
							contents.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.width).css({width:'100%'}),this.app));
						return contents;
					})(pd.create('div').addclass('pd-scope').attr('form-id','form_'+this.app.id))
				);
				this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					var res=pd.record.get(this.contents,this.app);
					if (!res.error)
					{
						((record) => {
							var res=false;
							switch (this.fieldinfo.type)
							{
								case 'checkbox':
								case 'dropdown':
								case 'radio':
									record.options.value=Array.from(new Set(record.options.value.shape((item) => (item.option.value)?item.option.value:PD_THROW)));
									if (record.options.value.length==0)
									{
										pd.alert(pd.constants.field.message.invalid.option[pd.lang]);
										res=true;
									}
									else
									{
										this.fieldinfo.options=record.options.value.map((item) => ({option:{value:item}}));
										if (this.fieldinfo.type=='dropdown') this.fieldinfo.options=[{option:{value:''}}].concat(this.fieldinfo.options);
									}
									break;
								case 'number':
									if (record.decimals.value)
										if (parseFloat(record.decimals.value)<0 || parseFloat(record.decimals.value)>100)
										{
											pd.alert(pd.constants.field.message.invalid.decimals[pd.lang]);
											res=true;
										}
									break;
								case 'textarea':
									if (record.lines.value)
										if (parseFloat(record.lines.value)<2)
										{
											pd.alert(pd.constants.field.message.invalid.textarea[pd.lang]);
											res=true;
										}
									break;
							}
							if (!res)
							{
								this.fieldinfo.caption=record.caption.value;
								if (!['box','spacer'].includes(this.fieldinfo.type))
								{
									this.fieldinfo.nocaption=(record.nocaption.value.length!=0);
									switch (this.fieldinfo.type)
									{
										case 'id':
										case 'autonumber':
										case 'creator':
										case 'createdtime':
										case 'modifier':
										case 'modifiedtime':
										case 'table':
											break;
										default:
											this.fieldinfo.required=(record.required.value.length!=0);
											break;
									}
								}
								switch (this.fieldinfo.type)
								{
									case 'address':
									case 'lookup':
									case 'number':
									case 'postalcode':
									case 'text':
									case 'textarea':
										this.fieldinfo.placeholder=record.placeholder.value;
										switch (this.fieldinfo.type)
										{
											case 'address':
												this.fieldinfo.mapping.lat=record.lat.value;
												this.fieldinfo.mapping.lng=record.lng.value;
												break;
											case 'lookup':
												this.fieldinfo.criteria=(() => {
													var res=[];
													this.tables.criteria.tr.each((element,index) => {
														if (element.elm('[field-id=external]').elm('select').val() && element.elm('[field-id=internal]').elm('select').val())
															res.push({
																external:element.elm('[field-id=external]').elm('select').val(),
																operator:element.elm('[field-id=operator]').elm('select').val(),
																internal:element.elm('[field-id=internal]').elm('select').val()
															});
													});
													return res;
												})();
												this.fieldinfo.mapping=(() => {
													var res={};
													this.tables.mapping.tr.each((element,index) => {
														if (element.elm('[field-id=external]').elm('select').val() && element.elm('[field-id=internal]').elm('select').val())
															if (!(element.elm('[field-id=external]').elm('select').val() in res))
																res[element.elm('[field-id=external]').elm('select').val()]=element.elm('[field-id=internal]').elm('select').val();
													});
													return res;
												})();
												this.fieldinfo.table=(() => {
													var res=[];
													pd.children(this.tables.table).each((element,index) => {
														res.push(element.table);
													});
													return res;
												})();
												this.fieldinfo.picker=(() => {
													var res=[];
													this.tables.picker.tr.each((element,index) => {
														((picker) => {
															if (picker)
																if (!res.includes(picker)) res.push(picker);
														})(element.elm('select').val());
													});
													return res;
												})();
												this.fieldinfo.app=record.app.value;
												this.fieldinfo.search=record.search.value;
												this.fieldinfo.query=this.keep.lookup.query;
												this.fieldinfo.sort=this.keep.lookup.sort;
												this.fieldinfo.ignore=(record.ignore.value.length!=0);
												break;
											case 'number':
												this.fieldinfo.demiliter=(record.demiliter.value.length!=0);
												this.fieldinfo.decimals=record.decimals.value;
												this.fieldinfo.unit=record.unit.value;
												this.fieldinfo.unitposition=record.unitposition.value;
												break;
											case 'postalcode':
												this.fieldinfo.mapping.prefecture=record.prefecture.value;
												this.fieldinfo.mapping.prefecturename=record.prefecturename.value;
												this.fieldinfo.mapping.city=record.city.value;
												this.fieldinfo.mapping.cityname=record.cityname.value;
												this.fieldinfo.mapping.streetname=record.streetname.value;
												this.fieldinfo.mapping.address=record.address.value;
												break;
											case 'text':
												this.fieldinfo.format=record.format.value;
												break;
											case 'textarea':
												this.fieldinfo.lines=record.lines.value;
												break;
										}
										break;
									case 'autonumber':
										this.fieldinfo.fixed=record.fixed.value;
										this.fieldinfo.group=(() => {
											var res=[];
											this.tables.group.tr.each((element,index) => {
												((group) => {
													if (group)
														if (!res.includes(group)) res.push(group);
												})(element.elm('select').val());
											});
											return res;
										})();
										break;
									case 'spacer':
										this.fieldinfo.multiuse=(record.multiuse.value.length!=0);
										this.fieldinfo.contents=record.contents.value;
										break;
								}
							}
							resolve(res);
						})(res.record);
					}
					else resolve(res.error);
				});
			}
			/* set configuration */
			set(width){
				return new Promise((resolve,reject) => {
					pd.record.set(this.contents,this.app,(() => {
						var res={caption:{value:this.fieldinfo.caption}};
						if (!['box','spacer'].includes(this.fieldinfo.type))
						{
							res['nocaption']={value:(this.fieldinfo.nocaption)?[this.app.fields.nocaption.options.first().option.value]:[]};
							switch (this.fieldinfo.type)
							{
								case 'id':
								case 'autonumber':
								case 'creator':
								case 'createdtime':
								case 'modifier':
								case 'modifiedtime':
								case 'table':
									break;
								default:
									res['required']={value:(this.fieldinfo.required)?[this.app.fields.required.options.first().option.value]:[]};
									break;
							}
						}
						switch (this.fieldinfo.type)
						{
							case 'address':
							case 'lookup':
							case 'number':
							case 'postalcode':
							case 'text':
							case 'textarea':
								res['placeholder']={value:this.fieldinfo.placeholder};
								switch (this.fieldinfo.type)
								{
									case 'address':
										((elements) => {
											elements.lat.empty().append(pd.create('option'));
											elements.lng.empty().append(pd.create('option'));
											for (var key in this.keep.fields)
											{
												switch (this.keep.fields[key].type)
												{
													case 'number':
														elements.lat.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
														elements.lng.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
														break;
												}
											}
											res['lat']={value:this.fieldinfo.mapping.lat};
											res['lng']={value:this.fieldinfo.mapping.lng};
										})({
											lat:this.contents.elm('[field-id=lat]').elm('select'),
											lng:this.contents.elm('[field-id=lng]').elm('select')
										});
										break;
									case 'lookup':
										((elements) => {
											elements.app.empty().assignoption((() => {
												var res=[];
												res.push({
													id:{value:''},
													caption:{value:''}
												});
												pd.kumaneko.sort(this.keep.config.apps.user,this.keep.config.apps.sort).each((app,index) => {
													res.push({
														id:{value:app.id},
														caption:{value:app.name}
													});
												});
												return res;
											})(),'caption','id').val(this.fieldinfo.app).rebuild().then((fields) => {
												if (this.fieldinfo.search in fields.result) elements.search.val(this.fieldinfo.search);
												elements.tables.criteria.clearrows();
												this.fieldinfo.criteria.each((values,index) => {
													if (values.external in fields.result)
														((row) => {
															row.elm('[field-id=external]').elm('select').val(values.external).rebuild().then((fields) => {
																if (values.internal in fields)
																{
																	row.elm('[field-id=operator]').elm('select').val(values.operator);
																	row.elm('[field-id=internal]').elm('select').val(values.internal);
																}
															});
														})(elements.tables.criteria.addrow());
												});
												if (elements.tables.criteria.tr.length==0) elements.tables.criteria.addrow();
												elements.tables.mapping.clearrows();
												for (var key in this.fieldinfo.mapping)
													((values) => {
														if (values.external in fields.result)
															((row) => {
																row.elm('[field-id=external]').elm('select').val(values.external).rebuild().then((fields) => {
																	if (values.internal in fields) row.elm('[field-id=internal]').elm('select').val(values.internal);
																});
															})(elements.tables.mapping.addrow());
													})({external:key,internal:this.fieldinfo.mapping[key]});
												if (elements.tables.mapping.tr.length==0) elements.tables.mapping.addrow();
												elements.tables.table.empty();
												this.fieldinfo.table.each((table,index) => {
													if (table.id.external in fields.origin)
														this.tables.table.append(this.keep.lookup.lib.create({fields:fields.origin},table));
												});
												elements.tables.picker.clearrows();
												this.fieldinfo.picker.each((picker,index) => {
													if (picker in fields.result) elements.tables.picker.addrow().elm('select').val(picker);
												});
												if (elements.tables.picker.tr.length==0) elements.tables.picker.addrow();
												elements.ignore.checked=this.fieldinfo.ignore;
											});
										})({
											app:this.contents.elm('[field-id=app]').elm('select'),
											search:this.contents.elm('[field-id=search]').elm('select'),
											ignore:this.contents.elm('[field-id=ignore]').elm('input'),
											tables:this.tables
										});
										this.keep.lookup.monitor.html(((query,sort) => {
											var res=[];
											res.push(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
											res.push(sort.split(',').filter((item) => item).length.toString()+'&nbsp;Sorts');
											return res.join(',&nbsp;');
										})(this.fieldinfo.query,this.fieldinfo.sort));
										this.keep.lookup.query=this.fieldinfo.query;
										this.keep.lookup.sort=this.fieldinfo.sort;
										break;
									case 'number':
										res['demiliter']={value:(this.fieldinfo.demiliter)?[this.app.fields.demiliter.options.first().option.value]:[]};
										res['decimals']={value:this.fieldinfo.decimals};
										res['unit']={value:this.fieldinfo.unit};
										res['unitposition']={value:this.fieldinfo.unitposition};
										break;
									case 'postalcode':
										((elements) => {
											elements.prefecture.empty().append(pd.create('option'));
											elements.prefecturename.empty().append(pd.create('option'));
											elements.city.empty().append(pd.create('option'));
											elements.cityname.empty().append(pd.create('option'));
											elements.streetname.empty().append(pd.create('option'));
											elements.address.empty().append(pd.create('option'));
											for (var key in this.keep.fields)
											{
												switch (this.keep.fields[key].type)
												{
													case 'address':
														elements.address.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
														break;
													case 'text':
														if (this.keep.fields[key].format=='text')
														{
															elements.prefecture.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
															elements.prefecturename.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
															elements.city.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
															elements.cityname.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
															elements.streetname.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
															elements.address.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
														}
														break;
												}
											}
											res['prefecture']={value:this.fieldinfo.mapping.prefecture};
											res['prefecturename']={value:this.fieldinfo.mapping.prefecturename};
											res['city']={value:this.fieldinfo.mapping.city};
											res['cityname']={value:this.fieldinfo.mapping.cityname};
											res['streetname']={value:this.fieldinfo.mapping.streetname};
											res['address']={value:this.fieldinfo.mapping.address};
										})({
											prefecture:this.contents.elm('[field-id=prefecture]').elm('select'),
											prefecturename:this.contents.elm('[field-id=prefecturename]').elm('select'),
											city:this.contents.elm('[field-id=city]').elm('select'),
											cityname:this.contents.elm('[field-id=cityname]').elm('select'),
											streetname:this.contents.elm('[field-id=streetname]').elm('select'),
											address:this.contents.elm('[field-id=address]').elm('select')
										});
										break;
									case 'text':
										res['format']={value:this.fieldinfo.format};
										break;
									case 'textarea':
										res['lines']={value:this.fieldinfo.lines};
										break;
								}
								break;
							case 'autonumber':
								res['fixed']={value:this.fieldinfo.fixed};
								this.tables.group.clearrows();
								this.tables.group.template.elm('[field-id=group]').elm('select').empty().assignoption((() => {
									var res=[];
									res.push({
										id:{value:''},
										caption:{value:''}
									});
									for (var key in this.keep.fields)
										((fieldinfo) => {
											switch (fieldinfo.type)
											{
												case 'dropdown':
												case 'number':
												case 'radio':
													res.push({
														id:{value:fieldinfo.id},
														caption:{value:fieldinfo.caption}
													});
													break;
												case 'text':
													if (['alphabet','alphanum','text'].includes(fieldinfo.format))
														res.push({
															id:{value:fieldinfo.id},
															caption:{value:fieldinfo.caption}
														});
													break;
											}
										})(this.keep.fields[key]);
									return res;
								})(),'caption','id');
								this.fieldinfo.group.each((group,index) => {
									if (group in this.keep.fields) this.tables.group.addrow().elm('select').val(group);
								});
								if (this.tables.group.tr.length==0) this.tables.group.addrow();
								break;
							case 'checkbox':
							case 'dropdown':
							case 'radio':
								res['options']={value:this.fieldinfo.options.shape((item) => (item.option.value)?{option:{value:item.option.value}}:PD_THROW)};
								break;
							case 'spacer':
								res['multiuse']={value:(this.fieldinfo.multiuse)?[this.app.fields.multiuse.options.first().option.value]:[]};
								res['contents']={value:this.fieldinfo.contents};
								break;
						}
						if (!['box','table'].includes(this.fieldinfo.type)) res['width']={value:width};
						return res;
					})());
					resolve();
				});
			}
			/* show */
			show(fields,width,callback){
				if (fields instanceof Object)
				{
					pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
					.then((resp) => {
						/* setup properties */
						this.keep.config=resp.file;
						this.keep.fields=((fieldinfos) => {
							this.keep.parallelize=fieldinfos;
							this.keep.tables=(() => {
								var res={};
								for (var key in fields)
									if (fields[key].type=='table') res[key]=fields[key];
								return res;
							})();
							return (this.fieldinfo.id in fieldinfos)?((fieldinfos[this.fieldinfo.id].tableid)?fields[fieldinfos[this.fieldinfo.id].tableid].fields:fields):fields;
						})(pd.ui.field.parallelize(fields));
						/* modify elements */
						this.contents.elms('input,select,textarea').each((element,index) => {
							if (element.alert) element.alert.hide();
						});
						/* setup handler */
						if (this.handler)
						{
							this.ok.off('click',this.handler);
							this.cancel.off('click');
						}
						this.handler=(e) => {
							this.get().then((error) => {
								if (!error)
								{
									if (!['box','table'].includes(this.fieldinfo.type)) callback(this.contents.elm('[field-id=width]').elm('input').val());
									else callback();
									this.hide();
								}
							});
						};
						this.ok.on('click',this.handler);
						this.cancel.on('click',(e) => this.hide());
						/* set configuration */
						this.set(width).then(() => {
							/* show */
							super.show();
						});
					})
					.catch((error) => pd.alert(error.message));
				}
				else pd.alert(pd.constants.common.message.invalid.config.corrupted[pd.lang]);
			}
		},
		injector:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999995,false,false);
				/* setup properties */
				this.app={
					id:'injectorbuilder',
					fields:{
						title:{
							id:'title',
							type:'text',
							caption:pd.constants.injector.caption.title[pd.lang],
							required:true,
							nocaption:false,
							format:'text'
						},
						description:{
							id:'description',
							type:'textarea',
							caption:pd.constants.injector.caption.description[pd.lang],
							required:false,
							nocaption:false,
							lines:'5'
						},
						directory:{
							id:'directory',
							type:'text',
							caption:pd.constants.injector.caption.directory[pd.lang],
							required:true,
							nocaption:false,
							format:'text'
						},
						operator:{
							id:'operator',
							type:'dropdown',
							caption:pd.constants.injector.caption.operator[pd.lang],
							required:true,
							nocaption:false,
							options:[]
						},
						bodycolor:{
							id:'bodycolor',
							type:'color',
							caption:pd.constants.injector.caption.colors.body[pd.lang],
							required:false,
							nocaption:false
						},
						buttoncolor:{
							id:'buttoncolor',
							type:'color',
							caption:pd.constants.injector.caption.colors.button[pd.lang],
							required:false,
							nocaption:false
						},
						action:{
							id:'action',
							type:'checkbox',
							caption:pd.constants.injector.caption.saving.action[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						}
					}
				};
				this.keep={
					app:{},
					fields:{},
					injector:{},
					nav:{}
				};
				this.lib={
					activate:(element,fieldinfo,addtrash=false) => {
						var handler=(e) => {
							var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
							pd.event.call(
								'injectorbuilder',
								'pd.drag.start',
								{
									element:element,
									page:{
										x:pointer.pageX,
										y:pointer.pageY
									}
								}
							);
							window.off('touchmove,mousemove',handler);
						};
						/* setup properties */
						element.fieldinfo=fieldinfo;
						if (addtrash)
						{
							/* modify elements */
							element.append(
								pd.create('button').addclass('pd-icon pd-icon-trash pd-kumaneko-drag-button')
								.on('touchstart,mousedown',(e) => {
									e.stopPropagation();
								})
								.on('click',(e) => {
									pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
										/* delete */
										element.parentNode.removeChild(element);
										/* remodel */
										this.lib.remodel();
									});
								})
							);
						}
						/* event */
						element
						.on('touchstart,mousedown',(e) => {
							if (element.hasAttribute('disabled'))
							{
								e.stopPropagation();
								e.preventDefault();
								return;
							}
							window.on('touchmove,mousemove',handler);
							e.stopPropagation();
							e.preventDefault();
						})
						.on('touchend,mouseup',(e) => {
							window.off('touchmove,mousemove',handler);
						});
						return element;
					},
					create:(fieldinfo) => {
						var res=null;
						switch (fieldinfo.type)
						{
							case 'table':
								res=pd.ui.table.activate(pd.ui.table.create(fieldinfo,true,false,true),pd.extend({id:this.app.id},this.keep.app));
								if (!this.keep.app.fields[fieldinfo.id].nocaption)
									((caption) => {
										res.insertBefore(caption,res.elm('tbody'))
									})(pd.create('span').addclass('pd-table-caption').html(this.keep.app.fields[fieldinfo.id].caption));
								break;
							default:
								res=pd.ui.field.create(pd.extend({},fieldinfo));
								switch (fieldinfo.type)
								{
									case 'number':
										pd.ui.field.activate(res,{
											id:'injectorbuilder',
											fields:(() => {
												var res={};
												res[fieldinfo.id]=fieldinfo;
												return res;
											})()
										});
										break;
								}
								break;
						}
						return this.lib.activate(res.attr('field-type','field'),fieldinfo,true);
					},
					init:() => {
						this.contents.elm('.pd-kumaneko-drag').insertBefore(this.contents.elm('.pd-kumaneko-drag-guide'),null);
						pd.children(this.contents.elm('.pd-kumaneko-drag')).each((element,index) => {
							if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
						});
					},
					remodel:() => {
						this.keep.injector.fields=[];
						for (var key in this.keep.nav) this.keep.nav[key].removeattr('disabled');
						pd.children(this.contents.elm('.pd-kumaneko-drag')).each((element,index) => {
							if (!element.hasclass('pd-kumaneko-drag-guide'))
							{
								switch (element.fieldinfo.type)
								{
									case 'number':
										element.elm('.pd-field-value').dispatchEvent(new Event('show'));
										break;
									case 'table':
										if (element.tr.length==0) element.addrow();
										break;
								}
								this.keep.nav[element.fieldinfo.id].attr('disabled','disabled');
								this.keep.injector.fields.push({id:element.fieldinfo.id,type:element.fieldinfo.type});
							}
						});
					}
				};
				/* modify elements */
				this.header.addclass('pd-kumaneko-builder-header')
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-title').html('Injector Settings'))
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-id'));
				this.container.css({
					height:'calc(100% - 1em)',
					width:'calc(100% - 1em)'
				});
				this.contents.addclass('pd-kumaneko-injectorbuilder').css({
					padding:'0'
				})
				.append(
					pd.create('main').addclass('pd-kumaneko-main')
					.append(
						((contents) => {
							contents
							.append(
								pd.create('nav').addclass('pd-kumaneko-nav')
								.append(pd.create('div').addclass('pd-kumaneko-nav-main'))
							)
							.append(
								pd.create('div').addclass('pd-kumaneko-block')
								.append(
									pd.create('div').addclass('pd-container pd-kumaneko-border-vertical')
									.append(
										pd.create('div').addclass('pd-kumaneko-injector')
										.append(
											pd.create('div').addclass('pd-kumaneko-injector-main')
											.append(
												pd.create('header').addclass('pd-kumaneko-injector-header')
												.append(pd.create('div').addclass('pd-kumaneko-injector-header-title'))
												.append(pd.create('div').addclass('pd-kumaneko-injector-header-description'))
											)
											.append(
												pd.create('main').addclass('pd-kumaneko-injector-body')
												.append(
													((container,guide) => {
														let observer=new MutationObserver(() => {
															if (guide.visible()) container.addclass('pd-dragging');
															else container.removeclass('pd-dragging');
														});
														observer.observe(guide,{attributes:true});
														return container.append(guide);
													})(pd.create('div').addclass('pd-kumaneko-drag').attr('field-type','form'),pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
												)
											)
											.append(
												pd.create('footer').addclass('pd-kumaneko-injector-footer')
												.append(pd.create('button').addclass('pd-button pd-kumaneko-injector-button').html(pd.constants.injector.caption.button.submit[pd.lang]))
											)
										)
									)
								)
							)
							.append(
								pd.create('nav').addclass('pd-kumaneko-nav')
								.append(
									pd.create('div').addclass('pd-kumaneko-nav-main')
									.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.title).css({width:'100%'}),this.app))
									.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.description).css({width:'100%'}),this.app))
									.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.directory).css({width:'100%'}),this.app))
									.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.operator).css({width:'100%'}),this.app))
									.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.bodycolor).css({width:'100%'}),this.app))
									.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.buttoncolor).css({width:'100%'}),this.app))
									.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.action).css({width:'100%'}),this.app))
								)
							);
							/* event */
							pd.event.on(this.app.id,'pd.change.title',(e) => {
								e.container.elm('.pd-kumaneko-injector-header-title').html((e.record.title.value)?e.record.title.value:'');
								return e;
							});
							pd.event.on(this.app.id,'pd.change.description',(e) => {
								e.container.elm('.pd-kumaneko-injector-header-description').html((e.record.description.value)?e.record.description.value.replace(/\n/g,'<br>'):'');
								return e;
							});
							pd.event.on(this.app.id,'pd.change.directory',(e) => {
								if (e.record.directory.value)
									pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
									.then((resp) => {
										var config=resp.file;
										((directories) => {
											if (directories.includes(e.record.directory.value))
											{
												pd.alert(pd.constants.injector.message.invalid.used[pd.lang]);
												pd.record.set(this.contents,this.app,((res) => {
													res.directory.value='';
													return res;
												})(e.record));
											}
										})((() => {
											var res=[];
											for (var key in config.apps.user)
												((app) => {
													if (app.id!=this.keep.app.id) res=res.concat(app.injectors.map((item) => item.directory))
												})(config.apps.user[key]);
											res=res.concat(this.keep.app.injectors.reduce((result,current) => {
												if (current.id!=this.keep.injector.id) result.push(current.directory);
												return result;
											},[]));
											return res;
										})());
									})
									.catch((error) => pd.alert(error.message));
								return e;
							});
							pd.event.on(this.app.id,'pd.change.bodycolor',(e) => {
								e.container.elm('.pd-kumaneko-injector').css({backgroundColor:(e.record.bodycolor.value)?e.record.bodycolor.value:''});
								return e;
							});
							pd.event.on(this.app.id,'pd.change.buttoncolor',(e) => {
								e.container.elm('.pd-kumaneko-injector-button').css({backgroundColor:(e.record.buttoncolor.value)?e.record.buttoncolor.value:''});
								return e;
							});
							/* drag event */
							pd.event.on('injectorbuilder','pd.drag.start',(e) => {
								var keep={
									element:(e.element.parentNode.hasclass('pd-kumaneko-drag'))?e.element:null,
									fieldinfo:pd.extend({},e.element.fieldinfo),
									guide:this.contents.elm('.pd-kumaneko-drag-guide')
								};
								var handler={
									move:(e) => {
										var element=document.elementFromPoint(e.pageX,e.pageY);
										if (element)
										{
											if (element!=keep.guide)
												((rect) => {
													var guide={
														setup:(parent,reference) => {
															parent.insertBefore(keep.guide.removeclass('pd-hidden'),reference);
														}
													};
													switch (element.attr('field-type'))
													{
														case 'field':
															if (e.pageY<rect.top+rect.height*0.5) guide.setup(element.parentNode,element);
															else guide.setup(element.parentNode,element.nextElementSibling);
															break;
														case 'form':
															if (!keep.element) guide.setup(element,null);
															break;
														default:
															if (!keep.element) keep.guide.addclass('pd-hidden');
															break;
													}
												})(element.getBoundingClientRect());
										}
										else
										{
											if (!keep.element) keep.guide.addclass('pd-hidden');
										}
									},
									end:(e) => {
										if (keep.guide.visible())
										{
											keep.guide.parentNode.insertBefore((() => {
												return (keep.element)?keep.element.removeclass('pd-hidden'):this.lib.create(keep.fieldinfo);
											})(),keep.guide.nextElementSibling);
											this.contents.elm('.pd-kumaneko-drag').insertBefore(keep.guide.addclass('pd-hidden'),null);
											this.lib.remodel();
										}
										else
										{
											if (keep.element) keep.element.removeclass('pd-hidden');
											this.contents.elm('.pd-kumaneko-drag').insertBefore(keep.guide.addclass('pd-hidden'),null);
										}
										window.off('mousemove,touchmove',handler.move);
										window.off('mouseup,touchend',handler.end);
										e.stopPropagation();
										e.preventDefault();
									}
								};
								if (keep.element)
								{
									((rect) => {
										keep.guide.css({height:rect.height.toString()+'px'});
										keep.element.addclass('pd-hidden').parentNode.insertBefore(keep.guide.removeclass('pd-hidden'),keep.element.nextElementSibling);
									})(keep.element.getBoundingClientRect());
								}
								else keep.guide.css({height:''});
								/* event */
								window.on('mousemove,touchmove',handler.move);
								window.on('mouseup,touchend',handler.end);
							});
							return contents;
						})(pd.create('div').addclass('pd-scope pd-kumaneko-block').attr('form-id','form_injectorbuilder'))
					)
				);
				this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					var res={
						error:false,
						injector:this.keep.injector
					};
					res.error=((res,injector) => {
						if (!res.error)
						{
							if (injector.fields.length==0)
							{
								res.error=true;
								pd.alert(pd.constants.injector.message.invalid.field[pd.lang]);
							}
							else
							{
								if (injector.fields.some((item) => !(item.id in this.keep.fields)))
								{
									res.error=true;
									pd.alert(pd.constants.injector.message.invalid.unknown[pd.lang]);
								}
							}
							if (!res.error)
							{
								if (!res.record.directory.value.match(/^[0-9a-z-_.!\']+$/g))
								{
									res.error=true;
									pd.alert(pd.constants.injector.message.invalid.characters[pd.lang]);
								}
								else
								{
									if (['api','static'].includes(res.record.directory.value))
									{
										res.error=true;
										pd.alert(pd.constants.injector.message.invalid.reserved[pd.lang]);
									}
									else
									{
										injector.title=res.record.title.value;
										injector.description=res.record.description.value;
										injector.directory=res.record.directory.value;
										injector.operator=res.record.operator.value;
										injector.colors.body=res.record.bodycolor.value;
										injector.colors.button=res.record.buttoncolor.value;
										injector.saving.action=res.record.action.value;
									}
								}
							}
						}
						return res.error;
					})(pd.record.get(this.contents,this.app),res.injector);
					resolve(res);
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					this.header.elm('.pd-kumaneko-builder-header-id').html('id&nbsp;'+this.keep.injector.id.toString()).off('click').on('click',(e) => {
						navigator.clipboard.writeText(this.keep.injector.id.toString()).then(() => {
							pd.alert(pd.constants.common.message.clipboard[pd.lang]);
						})
					});
					pd.record.set(this.contents,this.app,(() => {
						var res={
							title:{value:this.keep.injector.title},
							description:{value:this.keep.injector.description},
							directory:{value:this.keep.injector.directory},
							operator:{value:this.keep.injector.operator},
							bodycolor:{value:this.keep.injector.colors.body},
							buttoncolor:{value:this.keep.injector.colors.button},
							action:{value:this.keep.injector.saving.action}
						};
						((elements) => {
							elements.options.action.elms('label').each((label,index) => label.parentNode.removeChild(label));
							this.keep.app.actions.each((action,index) => {
								if (action.trigger=='button')
									elements.options.action
									.append(
										pd.create('label')
										.append(pd.create('input').attr('type','checkbox').attr('data-type','checkbox').val(action.id))
										.append(pd.create('span').html(action.name))
									);
							});
							elements.options.operator.empty().append(pd.create('option'));
							pd.filter.record.user.each((user,index) => {
								if (!this.keep.app.permissions.denied.includes(user.__id.value.toString()))
									elements.options.operator.append(pd.create('option').attr('value',user.__id.value).html(user.name.value));
							});
							elements.guides.title.html((res.title.value)?res.title.value:'')
							elements.guides.description.html((res.description.value)?res.description.value.replace(/\n/g,'<br>'):'')
							elements.guides.colors.body.css({backgroundColor:(res.bodycolor.value)?res.bodycolor.value:''})
							elements.guides.colors.button.css({backgroundColor:(res.buttoncolor.value)?res.buttoncolor.value:''})
						})({
							guides:{
								title:this.contents.elm('.pd-kumaneko-injector-header-title'),
								description:this.contents.elm('.pd-kumaneko-injector-header-description'),
								colors:{
									body:this.contents.elm('.pd-kumaneko-injector'),
									button:this.contents.elm('.pd-kumaneko-injector-button')
								}
							},
							options:{
								action:this.contents.elm('[field-id=action]').elm('.pd-field-value'),
								operator:this.contents.elm('[field-id=operator]').elm('select')
							}
						});
						((nav) => {
							for (var key in this.keep.fields)
								((fieldinfo) => {
									switch (fieldinfo.type)
									{
										case 'id':
										case 'autonumber':
										case 'creator':
										case 'createdtime':
										case 'modifier':
										case 'modifiedtime':
											break;
										default:
											nav.append(
												pd.create('div').addclass('pd-kumaneko-nav-button pd-kumaneko-border-bottom')
												.append(
													((res) => {
														this.keep.nav[fieldinfo.id]=res;
														return this.lib.activate(res,fieldinfo).append(pd.create('span').addclass('pd-kumaneko-nav-button-item-label').html(fieldinfo.caption));
													})(pd.create('span').addclass('pd-kumaneko-nav-button-item'))
												)
											);
											break;
									}
								})(this.keep.fields[key]);
							return nav;
						})(this.contents.elm('.pd-kumaneko-nav-main').empty());
						((fields) => {
							fields.each((field,index) => {
								if (field.id in this.keep.fields) this.contents.elm('.pd-kumaneko-drag').append(this.lib.create(this.keep.fields[field.id]));
							});
							this.lib.remodel();
						})(this.keep.injector.fields);
						return res;
					})());
					resolve();
				});
			}
			/* show */
			show(injector,fields,app,callback){
				if (injector instanceof Object)
				{
					/* initialize elements */
					this.lib.init();
					/* setup properties */
					this.keep.app=app;
					this.keep.fields=fields;
					this.keep.injector=pd.extend({},injector);
					this.keep.nav={};
					/* modify elements */
					this.contents.elms('input,select,textarea').each((element,index) => {
						if (element.alert) element.alert.hide();
					});
					/* setup handler */
					if (this.handler)
					{
						this.ok.off('click',this.handler);
						this.cancel.off('click');
					}
					this.handler=(e) => {
						this.get().then((resp) => {
							if (!resp.error)
							{
								callback(this.keep.injector);
								this.hide();
							}
						});
					};
					this.ok.on('click',this.handler);
					this.cancel.on('click',(e) => this.hide());
					/* set configuration */
					this.set().then(() => {
						/* show */
						super.show();
					});
				}
				else pd.alert(pd.constants.common.message.invalid.config.corrupted[pd.lang]);
			}
		},
		linkage:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999995,false,false);
				/* setup properties */
				this.app={
					id:'linkagebuilder',
					fields:{
						name:{
							id:'name',
							type:'text',
							caption:pd.constants.linkage.caption.name[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.linkage.prompt.name[pd.lang]
						},
						app:{
							id:'app',
							type:'dropdown',
							caption:pd.constants.linkage.caption.app[pd.lang],
							required:false,
							nocaption:false,
							options:[]
						},
						enable:{
							id:'enable',
							type:'checkbox',
							caption:'',
							required:false,
							nocaption:true,
							options:[
								{option:{value:'enable'}}
							]
						},
						caption:{
							id:'caption',
							type:'text',
							caption:pd.constants.linkage.caption.bulk.caption[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.linkage.prompt.bulk.caption[pd.lang]
						},
						message:{
							id:'message',
							type:'text',
							caption:pd.constants.linkage.caption.bulk.message[pd.lang],
							required:false,
							nocaption:false,
							placeholder:pd.constants.linkage.prompt.bulk.message[pd.lang]
						}
					}
				};
				this.keep={
					layout:[],
					config:{},
					fields:{},
					linkage:{},
					filter:{
						monitor:null,
						query:'',
						sort:''
					}
				};
				this.tables={
					criteria:null,
					display:null
				};
				/* modify elements */
				this.tables.criteria=pd.ui.table.create({
					id:'criterias',
					type:'table',
					caption:'',
					nocaption:true,
					fields:{
						external:{
							id:'external',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						operator:{
							id:'operator',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						internal:{
							id:'internal',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						}
					}
				}).spread((row,index) => {
					/* event */
					row.elm('.pd-table-row-add').on('click',(e) => {
						this.tables.criteria.insertrow(row);
					});
					row.elm('.pd-table-row-del').on('click',(e) => {
						pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
							this.tables.criteria.delrow(row);
						});
					});
					/* modify elements */
					((cells) => {
						cells.external.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
							return new Promise((resolve,reject) => {
								cells.operator.empty();
								cells.internal.empty().append(pd.create('option').attr('value','').html(pd.constants.linkage.caption.internal[pd.lang]));
								if (cells.external.val())
								{
									resolve(((fields) => {
										var res={};
										cells.operator.assignoption(pd.filter.query.operator(fields.external[cells.external.val()]),'caption','id');
										for (var key in fields.internal)
											((fieldinfo) => {
												if (pd.ui.field.typing(fieldinfo,fields.external[cells.external.val()],true))
												{
													cells.internal.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
													res[fieldinfo.id]=fieldinfo;
												}
											})(fields.internal[key]);
										return res;
									})({
										external:pd.ui.field.parallelize(this.keep.config.apps.user[this.contents.elm('[field-id=app]').elm('select').val()].fields),
										internal:this.keep.fields
									}));
								}
								else resolve({});
							});
						};
					})({
						external:row.elm('[field-id=external]').elm('select'),
						operator:row.elm('[field-id=operator]').elm('select'),
						internal:row.elm('[field-id=internal]').elm('select')
					});
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
				},false);
				this.tables.display=pd.ui.table.create({
					id:'displays',
					type:'table',
					caption:'',
					nocaption:true,
					fields:{
						external:{
							id:'external',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						},
						guide:{
							id:'guide',
							type:'spacer',
							caption:'',
							required:false,
							nocaption:true,
							contents:'<span class="pd-icon pd-icon-arrow pd-icon-arrow-right"></span>'
						},
						internal:{
							id:'internal',
							type:'dropdown',
							caption:'',
							required:false,
							nocaption:true,
							options:[]
						}
					}
				}).addclass('pd-mapping').spread((row,index) => {
					/* event */
					row.elm('.pd-table-row-add').on('click',(e) => {
						this.tables.display.insertrow(row);
					});
					row.elm('.pd-table-row-del').on('click',(e) => {
						pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
							this.tables.display.delrow(row);
						});
					});
					/* modify elements */
					((cells) => {
						cells.external.on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
							return new Promise((resolve,reject) => {
								cells.internal.empty().append(pd.create('option'));
								if (cells.external.val())
								{
									resolve(((fields) => {
										var res={};
										for (var key in fields.internal)
											((fieldinfo) => {
												if (pd.ui.field.typing(fields.external[cells.external.val()],fieldinfo))
												{
													cells.internal.append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
													res[fieldinfo.id]=fieldinfo;
												}
											})(fields.internal[key]);
										return res;
									})({
										external:pd.ui.field.parallelize(this.keep.config.apps.user[this.contents.elm('[field-id=app]').elm('select').val()].fields),
										internal:Object.values(pd.ui.field.parallelize(this.keep.fields)).reduce((result,current) => {
											if (current.tableid) result[current.id]=current;
											return result;
										},{})
									}));
								}
								else resolve({});
							});
						};
					})({
						external:row.elm('[field-id=external]').elm('select'),
						internal:row.elm('[field-id=internal]').elm('select')
					});
				},(table,index) => {
					if (table.tr.length==0) table.addrow();
				},false);
				this.header.addclass('pd-kumaneko-builder-header')
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-title').html('Linkage View Settings'))
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-id'));
				this.container.addclass('pd-kumaneko-main').css({
					height:'calc(100% - 1em)',
					width:'55em'
				});
				this.contents.addclass('pd-kumaneko-linkagebuilder').css({
					padding:'0'
				})
				.append(
					((contents) => {
						contents
						.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.name).css({width:'100%'}),this.app))
						.append(
							((res) => {
								res.elm('select').on('change',(e) => e.currentTarget.rebuild()).rebuild=() => {
									return new Promise((resolve,reject) => {
										((criterias,displays) => {
											criterias.clearrows();
											criterias.template.elm('[field-id=external]').elm('select').empty().append(pd.create('option').attr('value','').html(pd.constants.linkage.caption.external[pd.lang]));
											criterias.template.elm('[field-id=operator]').elm('select').empty();
											criterias.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option').attr('value','').html(pd.constants.linkage.caption.internal[pd.lang]));
											displays.clearrows();
											displays.template.elm('[field-id=external]').elm('select').empty().append(pd.create('option'));
											displays.template.elm('[field-id=internal]').elm('select').empty().append(pd.create('option'));
											displays.template.elm('[field-id=guide]').parentNode.addclass('pd-mapping-guide');
											this.keep.filter.monitor.html('0&nbsp;Filters,&nbsp;0&nbsp;Sorts');
											this.keep.filter.query='';
											this.keep.filter.sort='';
											if (res.elm('select').val())
											{
												resolve(((fieldinfos) => {
													var res={
														criteria:{},
														display:{}
													};
													for (var key in fieldinfos)
														((fieldinfo) => {
															switch (fieldinfo.type)
															{
																case 'canvas':
																case 'file':
																	displays.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																	res.display[fieldinfo.id]=fieldinfo;
																	break;
																case 'spacer':
																	break;
																default:
																	criterias.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																	displays.template.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																	res.criteria[fieldinfo.id]=fieldinfo;
																	res.display[fieldinfo.id]=fieldinfo;
																	break;
															}
														})(fieldinfos[key]);
													criterias.addrow();
													displays.addrow();
													return res;
												})(pd.ui.field.parallelize(this.keep.config.apps.user[res.elm('select').val()].fields)));
											}
											else
											{
												criterias.addrow();
												displays.addrow();
												resolve({
													criteria:{},
													display:{}
												});
											}
										})(this.tables.criteria,this.tables.display)
									});
								};
								return res;
							})(pd.ui.field.activate(pd.ui.field.create(this.app.fields.app).css({width:'100%'}),this.app))
						)
						.append(
							pd.create('div').addclass('pd-kumaneko-section')
							.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.linkage.caption.criteria[pd.lang]))
							.append(this.tables.criteria)
						)
						.append(
							((res) => {
								res.elm('.pd-field-value')
								.append(pd.create('button').addclass('pd-icon pd-icon-filter').on('click',(e) => {
									((app) => {
										if (app)
										{
											pd.filter.build(this.keep.config.apps.user[app],this.keep.filter.query,this.keep.filter.sort,(query,sort) => {
												this.keep.filter.monitor.html(((query,sort) => {
													var res=[];
													res.push(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
													res.push(sort.split(',').filter((item) => item).length.toString()+'&nbsp;Sorts');
													return res.join(',&nbsp;');
												})(query,sort));
												this.keep.filter.query=query;
												this.keep.filter.sort=sort;
											})
										}
										else pd.alert(pd.constants.linkage.message.invalid.app[pd.lang]);
									})(this.contents.elm('[field-id=app]').elm('select').val());
								}))
								.append(
									((monitor) => {
										this.keep.filter.monitor=monitor;
										return monitor;
									})(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
								)
								return res;
							})(pd.ui.field.create({
								id:'filters',
								type:'spacer',
								caption:pd.constants.linkage.caption.filter[pd.lang],
								required:false,
								nocaption:false
							}).css({width:'100%'}))
						)
						.append(
							pd.create('div').addclass('pd-kumaneko-section')
							.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.linkage.caption.display[pd.lang]))
							.append(this.tables.display)
						)
						.append(
							((res) => {
								res.elm('.pd-field-value')
								.append(pd.ui.field.activate(((res) => {
									res.elm('input').closest('label').elm('span').html(pd.constants.linkage.caption.bulk.enable[pd.lang]);
									return res;
								})(pd.ui.field.create(this.app.fields.enable)).css({width:'100%'}),this.app))
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.caption).css({width:'100%'}),this.app))
								.append(pd.ui.field.activate(pd.ui.field.create(this.app.fields.message).css({width:'100%'}),this.app))
								return res;
							})(pd.ui.field.create({
								id:'bulk',
								type:'spacer',
								caption:pd.constants.linkage.caption.bulk[pd.lang],
								required:false,
								nocaption:false
							}).css({width:'100%'}))
						);
						return contents;
					})(pd.create('div').addclass('pd-scope').attr('form-id','form_'+this.app.id))
				);
				this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					var res=pd.record.get(this.contents,this.app);
					if (!res.error)
					{
						((record) => {
							var res={
								error:false,
								linkage:this.keep.linkage
							};
							if (!record.name.value)
							{
								res.error=true;
								pd.alert(pd.constants.linkage.message.invalid.name[pd.lang],() => {
									resolve(res);
								});
							}
							else
							{
								if (record.app.value)
								{
									((fields) => {
										var criteria=(() => {
											var res=[];
											this.tables.criteria.tr.each((element,index) => {
												if (element.elm('[field-id=external]').elm('select').val() && element.elm('[field-id=internal]').elm('select').val())
													res.push({
														external:element.elm('[field-id=external]').elm('select').val(),
														operator:element.elm('[field-id=operator]').elm('select').val(),
														internal:element.elm('[field-id=internal]').elm('select').val()
													});
											});
											return res;
										})();
										var display=(() => {
											var res=[];
											this.tables.display.tr.each((element,index) => {
												if (element.elm('[field-id=external]').elm('select').val())
													res.push({
														external:element.elm('[field-id=external]').elm('select').val(),
														internal:element.elm('[field-id=internal]').elm('select').val()
													});
											});
											return res;
										})();
										if (criteria.length==0)
										{
											res.error=true;
											pd.alert(pd.constants.linkage.message.invalid.criteria[pd.lang],() => {
												resolve(res);
											});
										}
										if (!res.error)
										{
											if (display.length==0)
											{
												res.error=true;
												pd.alert(pd.constants.linkage.message.invalid.display[pd.lang],() => {
													resolve(res);
												});
											}
											else
											{
												if (Array.from(new Set(display.shape((item) => (fields.external[item.external].tableid)?fields.external[item.external].tableid:PD_THROW))).length>1)
												{
													res.error=true;
													pd.alert(pd.constants.linkage.message.invalid.table[pd.lang],() => {
														resolve(res);
													});
												}
												if (!res.error)
												{
													if (record.enable.value.length!=0)
													{
														(() => {
															if (display.filter((item) => item.internal).length==0)
															{
																res.error=true;
																pd.alert(pd.constants.linkage.message.invalid.bulk[pd.lang],() => {
																	resolve(res);
																});
																return;
															}
															if (!record.caption.value)
															{
																res.error=true;
																pd.alert(pd.constants.linkage.message.invalid.bulk.caption[pd.lang],() => {
																	resolve(res);
																});
																return;
															}
															if (!record.message.value)
															{
																res.error=true;
																pd.alert(pd.constants.linkage.message.invalid.bulk.message[pd.lang],() => {
																	resolve(res);
																});
																return;
															}
														})();
													}
													if (!res.error)
													{
														res.linkage.app=record.app.value;
														res.linkage.criteria=criteria;
														res.linkage.display=display;
														res.linkage.bulk.enable=(record.enable.value.length!=0);
														res.linkage.bulk.caption=record.caption.value;
														res.linkage.bulk.message=record.message.value;
													}
												}
											}
										}
									})({
										external:pd.ui.field.parallelize(this.keep.config.apps.user[record.app.value].fields),
										internal:this.keep.fields
									});
								}
								else
								{
									res.error=true;
									pd.alert(pd.constants.linkage.message.invalid.app[pd.lang],() => {
										resolve(res);
									});
								}
							}
							res.linkage.name=record.name.value;
							res.linkage.query=this.keep.filter.query;
							res.linkage.sort=this.keep.filter.sort;
							if (!res.error) resolve(res);
						})(res.record);
					}
					else resolve(res);
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					this.header.elm('.pd-kumaneko-builder-header-id').html('id&nbsp;'+this.keep.linkage.id.toString()).off('click').on('click',(e) => {
						navigator.clipboard.writeText(this.keep.linkage.id.toString()).then(() => {
							pd.alert(pd.constants.common.message.clipboard[pd.lang]);
						})
					});
					pd.record.set(this.contents,this.app,(() => {
						var res={
							name:{value:this.keep.linkage.name},
							enable:{value:(this.keep.linkage.bulk.enable)?[this.app.fields.enable.options.first().option.value]:[]},
							caption:{value:this.keep.linkage.bulk.caption},
							message:{value:this.keep.linkage.bulk.message}
						};
						((elements) => {
							elements.app.empty().assignoption((() => {
								var res=[];
								res.push({
									id:{value:''},
									caption:{value:''}
								});
								pd.kumaneko.sort(this.keep.config.apps.user,this.keep.config.apps.sort).each((app,index) => {
									res.push({
										id:{value:app.id},
										caption:{value:app.name}
									});
								});
								return res;
							})(),'caption','id').val(this.keep.linkage.app).rebuild().then((fields) => {
								elements.tables.criteria.clearrows();
								this.keep.linkage.criteria.each((values,index) => {
									if (values.external in fields.criteria)
										((row) => {
											row.elm('[field-id=external]').elm('select').val(values.external).rebuild().then((fields) => {
												if (values.internal in fields)
												{
													row.elm('[field-id=operator]').elm('select').val(values.operator);
													row.elm('[field-id=internal]').elm('select').val(values.internal);
												}
											});
										})(elements.tables.criteria.addrow());
								});
								if (elements.tables.criteria.tr.length==0) elements.tables.criteria.addrow();
								elements.tables.display.clearrows();
								this.keep.linkage.display.each((values,index) => {
									if (values.external in fields.display)
										((row) => {
											row.elm('[field-id=external]').elm('select').val(values.external).rebuild().then((fields) => {
												if (values.internal in fields) row.elm('[field-id=internal]').elm('select').val(values.internal);
											});
										})(elements.tables.display.addrow());
								});
								if (elements.tables.display.tr.length==0) elements.tables.display.addrow();
							});
						})({
							app:this.contents.elm('[field-id=app]').elm('select'),
							tables:this.tables
						});
						this.keep.filter.monitor.html(((query,sort) => {
							var res=[];
							res.push(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
							res.push(sort.split(',').filter((item) => item).length.toString()+'&nbsp;Sorts');
							return res.join(',&nbsp;');
						})(this.keep.linkage.query,this.keep.linkage.sort));
						this.keep.filter.query=this.keep.linkage.query;
						this.keep.filter.sort=this.keep.linkage.sort;
						return res;
					})());
					resolve();
				});
			}
			/* show */
			show(linkage,fields,layout,callback){
				if (linkage instanceof Object)
				{
					pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
					.then((resp) => {
						/* setup properties */
						this.keep.linkage=pd.extend({},linkage);
						this.keep.config=resp.file;
						this.keep.fields=fields;
						this.keep.layout=layout;
						/* modify elements */
						this.contents.elms('input,select,textarea').each((element,index) => {
							if (element.alert) element.alert.hide();
						});
						/* setup handler */
						if (this.handler)
						{
							this.ok.off('click',this.handler);
							this.cancel.off('click');
						}
						this.handler=(e) => {
							this.get().then((resp) => {
								if (!resp.error)
								{
									callback(this.keep.linkage);
									this.hide();
								}
							});
						};
						this.ok.on('click',this.handler);
						this.cancel.on('click',(e) => this.hide());
						/* set configuration */
						this.set().then(() => {
							/* show */
							super.show();
						});
					})
					.catch((error) => pd.alert(error.message));
				}
				else pd.alert(pd.constants.common.message.invalid.config.corrupted[pd.lang]);
			}
		},
		view:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999995,false,false);
				/* setup properties */
				this.keep={
					app:'',
					fields:{},
					parallelize:{},
					nav:{},
					view:{},
					filter:{
						monitor:null,
						show:() => {
							pd.filter.build({fields:this.keep.fields},this.keep.view.query,this.keep.view.sort,(query,sort) => {
								this.keep.filter.monitor.html(((query,sort) => {
									var res=[];
									res.push(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
									if (!['crosstab','timeseries'].includes(this.keep.view.type)) res.push(sort.split(',').filter((item) => item).length.toString()+'&nbsp;Sorts');
									return res.join(',&nbsp;');
								})(query,sort));
								this.keep.view.query=query;
								switch (this.keep.view.type)
								{
									case 'crosstab':
									case 'timeseries':
										this.menus[this.keep.view.type].lib.load();
										break;
									case 'gantt':
									case 'kanban':
										this.menus[this.keep.view.type].lib.load();
										this.keep.view.sort=sort;
										break;
									default:
										this.keep.view.sort=sort;
										break;
								}
							})
						}
					}
				};
				this.menus={
					list:{
						id:'list',
						contents:null,
						lib:{
							activate:(element,fieldinfo,addtrash=false) => {
								var handler=(e) => {
									var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
									pd.event.call(
										'viewbuilder_'+this.menus.list.id,
										'pd.drag.start',
										{
											element:element,
											page:{
												x:pointer.pageX,
												y:pointer.pageY
											}
										}
									);
									window.off('touchmove,mousemove',handler);
								};
								/* setup properties */
								element.fieldinfo=fieldinfo;
								if (addtrash)
								{
									/* modify elements */
									element.append(
										pd.create('button').addclass('pd-icon pd-icon-trash pd-kumaneko-drag-button')
										.on('touchstart,mousedown',(e) => {
											e.stopPropagation();
										})
										.on('click',(e) => {
											pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
												/* delete */
												element.parentNode.removeChild(element);
												/* remodel */
												this.menus.list.lib.remodel();
											});
										})
									);
								}
								/* event */
								element
								.on('touchstart,mousedown',(e) => {
									if (element.hasAttribute('disabled'))
									{
										e.stopPropagation();
										e.preventDefault();
										return;
									}
									window.on('touchmove,mousemove',handler);
									e.stopPropagation();
									e.preventDefault();
								})
								.on('touchend,mouseup',(e) => {
									window.off('touchmove,mousemove',handler);
								});
								return element;
							},
							create:(fieldinfo) => {
								var res=null;
								switch (fieldinfo.type)
								{
									case 'table':
										res=pd.ui.field.create({
											id:fieldinfo.id,
											type:'spacer',
											caption:fieldinfo.caption,
											required:false,
											nocaption:false,
											contents:'Table'
										});
										break;
									default:
										res=pd.ui.field.create(((fieldinfo) => {
											fieldinfo.nocaption=false;
											return fieldinfo;
										})(pd.extend({},fieldinfo)));
										switch (fieldinfo.type)
										{
											case 'id':
											case 'autonumber':
											case 'creator':
											case 'createdtime':
											case 'modifier':
											case 'modifiedtime':
												res.elm('.pd-guide').html(pd.constants.common.prompt.autofill[pd.lang]);
												break;
											case 'number':
												pd.ui.field.activate(res,{
													id:'viewbuilder_'+this.menus.list.id,
													fields:(() => {
														var res={};
														res[fieldinfo.id]=fieldinfo;
														return res;
													})()
												});
												break;
										}
										break;
								}
								return this.menus.list.lib.activate(res.css({width:'235px'}).attr('field-type','field'),fieldinfo,true);
							},
							init:() => {
								this.menus.list.contents.elm('.pd-box').parentNode.insertBefore(this.menus.list.contents.elm('.pd-kumaneko-drag-guide'),null);
								pd.children(this.menus.list.contents.elm('.pd-box')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
								});
							},
							remodel:() => {
								this.keep.view.fields=[];
								for (var key in this.keep.nav) this.keep.nav[key].removeattr('disabled');
								pd.children(this.menus.list.contents.elm('.pd-box')).each((element,index) => {
									if (!element.hasclass('pd-kumaneko-drag-guide'))
									{
										switch (element.fieldinfo.type)
										{
											case 'number':
												element.elm('.pd-field-value').dispatchEvent(new Event('show'));
												break;
										}
										this.keep.nav[element.fieldinfo.id].attr('disabled','disabled');
										this.keep.view.fields.push(element.fieldinfo.id);
									}
								});
							}
						}
					},
					calendar:{
						id:'calendar',
						app:{},
						contents:null,
						calendar:null
					},
					crosstab:{
						id:'crosstab',
						app:{},
						contents:null,
						preview:null,
						table:null,
						lib:{
							load:(view) => {
								view=pd.extend({},(view instanceof Object)?view:this.menus.crosstab.lib.remodel());
								if (this.keep.app)
									if (view.fields.column.field)
									{
										pd.request(
											pd.ui.baseuri()+'/crosstab.php',
											'POST',
											{},
											pd.extend({
												app:this.keep.app,
												fields:this.keep.fields,
												query:this.keep.view.query,
												limit:10
											},view.fields)
										)
										.then((resp) => {
											this.menus.crosstab.preview.show(resp,pd.extend({name:this.contents.elm('.pd-kumaneko-viewbuilder-name').elm('input').val()},view));
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									}
							},
							remodel:() => {
								var res={
									chart:{
										type:''
									},
									fields:{
										column:{
											field:'',
											format:'',
											sort:''
										},
										rows:[],
										value:{
											field:'',
											func:''
										}
									}
								};
								return ((record) => {
									if ((record.valuefunc.value!='CNT')?record.valuefield.value:true)
									{
										res.chart.type=record.charttype.value;
										res.fields.column.field=record.columnfield.value;
										res.fields.column.format=record.columnformat.value;
										res.fields.column.sort=record.columnsort.value;
										res.fields.value.field=record.valuefield.value;
										res.fields.value.func=record.valuefunc.value;
										res.fields.rows=(() => {
											var res=[];
											this.menus.crosstab.table.tr.each((element,index) => {
												if (element.elm('[field-id=rowfield]').elm('select').val())
													res.push({
														field:element.elm('[field-id=rowfield]').elm('select').val(),
														format:element.elm('[field-id=rowformat]').elm('select').val(),
														sort:element.elm('[field-id=rowsort]').elm('select').val()
													});
											});
											return res;
										})();
									}
									return res;
								})(pd.record.get(this.menus.crosstab.contents,this.menus.crosstab.app,true).record);
							}
						}
					},
					gantt:{
						id:'gantt',
						app:{},
						contents:null,
						preview:null,
						table:null,
						lib:{
							load:(view) => {
								view=pd.extend({},(view instanceof Object)?view:this.menus.gantt.lib.remodel());
								if (this.keep.app)
									if (view.fields.task.start && view.fields.task.end && view.fields.task.title)
									{
										pd.request(
											pd.ui.baseuri()+'/gantt.php',
											'POST',
											{},
											pd.extend({
												app:this.keep.app,
												fields:this.keep.fields,
												query:this.keep.view.query,
												sort:this.keep.view.sort,
												column:{
													limit:((view.fields.column.period=='month')?12:7),
													starting:((view.fields.column.period=='month')?new Date().format('Y-01'):new Date().format('Y-m-01'))
												}
											},view.fields)
										)
										.then((resp) => {
											this.menus.gantt.preview.show(resp,view,(task,record) => {
												((fieldinfo) => {
													fieldinfo.nocaption=true;
													((app) => {
														task.addclass('pd-scope').append(pd.ui.field.activate(pd.ui.field.create(fieldinfo).addclass('pd-picker pd-readonly').css({width:'100%'}),app));
														pd.record.set(task,app,pd.kumaneko.app.action(app.id,record,'view'));
													})({
														id:this.keep.app,
														fields:(() => {
															var res={};
															res[fieldinfo.id]=fieldinfo;
															return res;
														})()
													});
												})(pd.extend({},this.keep.fields[view.fields.task.title]));
											});
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									}
							},
							remodel:() => {
								var res={
									fields:{
										column:{
											period:'',
											width:0
										},
										rows:[],
										task:{
											start:'',
											end:'',
											title:''
										}
									}
								};
								return ((record) => {
									res.fields.column.period=record.columnperiod.value;
									res.fields.column.width=record.columnwidth.value;
									res.fields.task.start=record.taskstart.value;
									res.fields.task.end=record.taskend.value;
									res.fields.task.title=record.tasktitle.value;
									res.fields.rows=(() => {
										var res=[];
										this.menus.gantt.table.tr.each((element,index) => {
											if (element.elm('[field-id=rowfield]').elm('select').val())
												res.push({
													field:element.elm('[field-id=rowfield]').elm('select').val(),
													format:element.elm('[field-id=rowformat]').elm('select').val(),
													sort:element.elm('[field-id=rowsort]').elm('select').val()
												});
										});
										return res;
									})();
									return res;
								})(pd.record.get(this.menus.gantt.contents,this.menus.gantt.app,true).record);
							}
						}
					},
					timeseries:{
						id:'timeseries',
						app:{},
						contents:null,
						preview:null,
						tables:{
							row:null,
							value:null
						},
						lib:{
							load:(view) => {
								view=pd.extend({},(view instanceof Object)?view:this.menus.timeseries.lib.remodel());
								if (this.keep.app)
									if (view.fields.column.field && view.fields.rows.length!=0 && view.fields.values.length!=0)
									{
										pd.request(
											pd.ui.baseuri()+'/timeseries.php',
											'POST',
											{},
											pd.extend({
												app:this.keep.app,
												fields:this.keep.fields,
												query:this.keep.view.query,
												column:{
													starting:((view.fields.column.period=='month')?new Date().format('Y-01-01'):new Date().format('Y-m-01'))
												},
												limit:10
											},view.fields)
										)
										.then((resp) => {
											this.menus.timeseries.preview.show(resp,pd.extend({name:this.contents.elm('.pd-kumaneko-viewbuilder-name').elm('input').val()},view));
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									}
							},
							remodel:() => {
								var res={
									chart:{
										type:''
									},
									fields:{
										column:{
											field:'',
											period:''
										},
										rows:[],
										values:[]
									}
								};
								return ((record) => {
									res.chart.type=record.charttype.value;
									res.fields.column.field=record.columnfield.value;
									res.fields.column.period=record.columnperiod.value;
									res.fields.rows=(() => {
										var res=[];
										this.menus.timeseries.tables.row.tr.each((element,index) => {
											if (element.elm('[field-id=rowcaption]').elm('input').val() && element.elm('[field-id=rowformula]').elm('input').val())
												res.push({
													caption:element.elm('[field-id=rowcaption]').elm('input').val(),
													formula:element.elm('[field-id=rowformula]').elm('input').val()
												});
										});
										return res;
									})();
									res.fields.values=(() => {
										var res=[];
										this.menus.timeseries.tables.value.tr.each((element,index) => {
											if ((element.elm('[field-id=valuefunc]').elm('select').val().slice(-3)!='CNT')?element.elm('[field-id=valuefield]').elm('select').val():true)
												res.push({
													id:element.elm('[field-id=valueid]').elm('.pd-field-value').text(),
													field:element.elm('[field-id=valuefield]').elm('select').val(),
													func:element.elm('[field-id=valuefunc]').elm('select').val(),
													query:element.elm('[field-id=valuequery]').filter.query
												});
										});
										return res;
									})();
									return res;
								})(pd.record.get(this.menus.timeseries.contents,this.menus.timeseries.app,true).record);
							}
						}
					},
					kanban:{
						id:'kanban',
						app:{},
						contents:null,
						preview:null,
						table:null,
						lib:{
							load:(view) => {
								view=pd.extend({},(view instanceof Object)?view:this.menus.kanban.lib.remodel());
								if (this.keep.app)
									if (view.fields.task.title && view.fields.groups.length!=0)
									{
										pd.request(
											pd.ui.baseuri()+'/records.php',
											'GET',
											{},
											{
												app:this.keep.app,
												query:((date,query) => {
													var res=(query)?['('+query+')']:[];
													if (date)
													{
														switch (this.keep.parallelize[view.fields.task.date].type)
														{
															case 'createdtime':
															case 'datetime':
															case 'modifiedtime':
																res.push(view.fields.task.date+' >= "'+[date,'00:00:00'].join(' ').parseDateTime().format('ISO')+'"');
																res.push(view.fields.task.date+' <= "'+[date,'23:59:00'].join(' ').parseDateTime().format('ISO')+'"');
																break;
															case 'date':
																res.push(view.fields.task.date+' = "'+date+'"');
																break;
														}
													}
													return res.join(' and ');
												})((view.fields.task.date)?new Date().format('Y-m-d'):null,this.keep.view.query),
												sort:this.keep.view.sort,
												offset:0,
												limit:10
											}
										)
										.then((resp) => {
											this.menus.kanban.preview.show(view.fields.groups.reduce((result,current) => {
												result.push({
													caption:current.caption,
													width:view.fields.task.width,
													records:((date,query) => {
														return resp.records.reduce((result,current) => {
															var res=pd.filter.scan({fields:this.keep.fields},pd.kumaneko.app.action(this.keep.app,current,'view'),query);
															if (res)
															{
																if (this.keep.parallelize[view.fields.task.title].tableid)
																{
																	result=result.concat(res[this.keep.parallelize[view.fields.task.title].tableid].value.reduce((result,current) => {
																		if (date)
																		{
																			if (view.fields.task.date in current)
																				if (current[view.fields.task.date].value)
																					if (new Date(current[view.fields.task.date].value).format('Y-m-d')==date)
																					{
																						current['__id']={value:res['__id'].value};
																						result.push(current);
																					}
																		}
																		else
																		{
																			current['__id']={value:res['__id'].value};
																			result.push(current);
																		}
																		return result;
																	},[]));
																}
																else result.push(res);
															}
															return result;
														},[]);
													})((view.fields.task.date)?new Date().format('Y-m-d'):null,current.query)
												});
												return result;
											},[]),(task,record) => {
												((fieldinfo) => {
													fieldinfo.nocaption=true;
													((app) => {
														task.addclass('pd-scope').append(pd.ui.field.activate(pd.ui.field.create(fieldinfo).addclass('pd-picker pd-readonly').css({width:'100%'}),app));
														pd.record.set(task,app,record);
													})({
														id:this.keep.app,
														fields:(() => {
															var res={};
															res[fieldinfo.id]=fieldinfo;
															return res;
														})()
													});
												})(pd.extend({},this.keep.parallelize[view.fields.task.title]));
											});
										})
										.catch((error) => {
											pd.alert(error.message);
										});
									}
							},
							remodel:() => {
								var res={
									fields:{
										groups:[],
										task:{
											title:'',
											date:'',
											width:200
										}
									}
								};
								return ((record) => {
									res.fields.task.title=record.tasktitle.value;
									res.fields.task.date=record.taskdate.value;
									res.fields.task.width=record.taskwidth.value;
									res.fields.groups=(() => {
										var res=[];
										this.menus.kanban.table.tr.each((element,index) => {
											if (element.elm('[field-id=groupcaption]').elm('input').val())
												res.push({
													caption:element.elm('[field-id=groupcaption]').elm('input').val(),
													query:element.elm('[field-id=groupquery]').filter.query
												});
										});
										return res;
									})();
									return res;
								})(pd.record.get(this.menus.kanban.contents,this.menus.kanban.app,true).record);
							}
						}
					},
					map:{
						id:'map',
						app:{},
						contents:null,
						map:null
					},
					customize:{
						id:'customize',
						app:{},
						contents:null
					}
				};
				/* modify elements */
				this.header.addclass('pd-kumaneko-builder-header')
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-title').html('View Settings'))
				.append(pd.create('span').addclass('pd-kumaneko-builder-header-id'));
				this.container.css({
					height:'calc(100% - 1em)',
					width:'calc(100% - 1em)'
				});
				this.contents.addclass('pd-kumaneko-viewbuilder').css({
					padding:'0'
				})
				.append(
					pd.ui.field.create({
						id:'name',
						type:'text',
						caption:'',
						required:false,
						nocaption:true,
						placeholder:pd.constants.view.prompt.name[pd.lang],
						format:'text'
					}).addclass('pd-kumaneko-viewbuilder-name').css({width:'100%'})
				)
				.append(
					pd.create('main').addclass('pd-kumaneko-main')
					.append(pd.create('section').addclass('pd-kumaneko-block pd-kumaneko-border-top').attr('id','pd-kumaneko-viewbuilder-space-contents'))
				);
				for (var key in this.menus)
					((menu) => {
						menu.contents=pd.create('div').addclass('pd-scope pd-kumaneko-block').attr('form-id','form_viewbuilder_'+menu.id).hide();
						switch (menu.id)
						{
							case 'list':
								menu.contents
								.append(
									pd.create('nav').addclass('pd-kumaneko-nav')
									.append(pd.create('div').addclass('pd-kumaneko-nav-main'))
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-footer pd-kumaneko-border-top pd-kumaneko-inset-top')
										.append(
											pd.create('button').addclass('pd-icon pd-icon-filter pd-kumaneko-nav-icon').on('click',(e) => {
												this.keep.filter.show();
												e.stopPropagation();
												e.preventDefault();
											})
										)
										.append(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
									)
								)
								.append(
									pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left')
									.append(
										pd.create('div').addclass('pd-container')
										.append(((res) => {
											res.elm('input').closest('label').elm('span').html(pd.constants.view.caption.list.readonly[pd.lang]);
											return res;
										})(pd.ui.field.create({
											id:'readonly',
											type:'checkbox',
											caption:'',
											required:false,
											nocaption:true,
											options:[
												{option:{value:'readonly'}}
											]
										}).css({width:'100%'})))
										.append(
											((container,contents,guide) => {
												let observer=new MutationObserver(() => {
													if (guide.visible()) container.addclass('pd-dragging');
													else container.removeclass('pd-dragging');
												});
												observer.observe(guide,{attributes:true});
												return container.append(contents).append(guide);
											})(
												pd.create('div').addclass('pd-contents pd-kumaneko-drag pd-kumaneko-'+menu.id).attr('field-type','form'),
												pd.create('div').addclass('pd-box pd-flex').attr('field-type','table'),
												pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide')
											)
										)
									)
								);
								/* drag event */
								pd.event.on('viewbuilder_'+menu.id,'pd.drag.start',(e) => {
									var keep={
										element:(e.element.parentNode.hasclass('pd-box'))?e.element:null,
										fieldinfo:pd.extend({},e.element.fieldinfo),
										guide:menu.contents.elm('.pd-kumaneko-drag-guide')
									};
									var handler={
										move:(e) => {
											var element=document.elementFromPoint(e.pageX,e.pageY);
											if (element)
											{
												if (element!=keep.guide)
													((rect) => {
														var guide={
															setup:(parent,reference) => {
																switch (parent.attr('field-type'))
																{
																	case 'table':
																		keep.guide.css({height:parent.innerheight().toString()+'px'});
																		break;
																}
																parent.insertBefore(keep.guide.removeclass('pd-hidden'),reference);
															}
														};
														switch (element.attr('field-type'))
														{
															case 'field':
																if (e.pageX<rect.left+rect.width*0.5) guide.setup(element.parentNode,element);
																else guide.setup(element.parentNode,element.nextElementSibling);
																break;
															case 'table':
																if (!keep.element) guide.setup(element,null);
																break;
															default:
																if (!keep.element) keep.guide.addclass('pd-hidden');
																break;
														}
													})(element.getBoundingClientRect());
											}
											else
											{
												if (!keep.element) keep.guide.addclass('pd-hidden');
											}
										},
										end:(e) => {
											if (keep.guide.visible())
											{
												keep.guide.parentNode.insertBefore((() => {
													return (keep.element)?keep.element.removeclass('pd-hidden'):menu.lib.create(keep.fieldinfo);
												})(),keep.guide.nextElementSibling);
												menu.contents.elm('.pd-box').parentNode.insertBefore(keep.guide.addclass('pd-hidden'),null);
												menu.lib.remodel();
											}
											else
											{
												if (keep.element) keep.element.removeclass('pd-hidden');
												menu.contents.elm('.pd-box').parentNode.insertBefore(keep.guide.addclass('pd-hidden'),null);
											}
											window.off('mousemove,touchmove',handler.move);
											window.off('mouseup,touchend',handler.end);
											e.stopPropagation();
											e.preventDefault();
										}
									};
									if (keep.element)
									{
										((rect) => {
											keep.guide.css({height:rect.height.toString()+'px',width:rect.width.toString()+'px'});
											keep.element.addclass('pd-hidden').parentNode.insertBefore(keep.guide.removeclass('pd-hidden'),keep.element.nextElementSibling);
										})(keep.element.getBoundingClientRect());
									}
									else keep.guide.css({height:'',width:''});
									/* event */
									window.on('mousemove,touchmove',handler.move);
									window.on('mouseup,touchend',handler.end);
								});
								break;
							case 'calendar':
								menu.app={
									id:'viewbuilder_'+menu.id,
									fields:{
										date:{
											id:'date',
											type:'dropdown',
											caption:pd.constants.view.caption.calendar.date[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										},
										title:{
											id:'title',
											type:'dropdown',
											caption:pd.constants.view.caption.calendar.title[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										}
									}
								};
								menu.calendar=new panda_calendar(true);
								menu.contents
								.append(
									pd.create('nav').addclass('pd-kumaneko-nav')
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main')
										.append(pd.ui.field.create(menu.app.fields.date))
										.append(pd.ui.field.create(menu.app.fields.title))
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-footer pd-kumaneko-border-top pd-kumaneko-inset-top')
										.append(
											pd.create('button').addclass('pd-icon pd-icon-filter pd-kumaneko-nav-icon').on('click',(e) => {
												this.keep.filter.show();
												e.stopPropagation();
												e.preventDefault();
											})
										)
										.append(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
									)
								)
								.append(
									((element) => {
										element.append(
											pd.create('div').addclass('pd-container')
											.append(menu.calendar.calendar.addclass('pd-kumaneko-'+menu.id))
										);
										menu.calendar.show(new Date(new Date().format('Y-m')+'-01'),null,{
											create:(cell,date,style) => {
												cell.append(
													((cell) => {
														cell.append(pd.create('span').addclass('pd-kumaneko-calendar-cell-guide').css(style).html(date.getDate().toString()));
														if (date.format('Y-m-d')==new Date().format('Y-m-d'))
															cell.append(pd.create('div').addclass('pd-kumaneko-calendar-cell-item').html(pd.constants.view.prompt.calendar.title[pd.lang]));
														return cell;
													})(pd.create('div').addclass('pd-kumaneko-calendar-cell'))
												);
											}
										});
										return element;
									})(pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left'))
								);
								break;
							case 'crosstab':
								menu.app={
									id:'viewbuilder_'+menu.id,
									fields:{
										charttype:{
											id:'charttype',
											type:'dropdown',
											caption:pd.constants.view.caption.crosstab.type[pd.lang],
											required:true,
											nocaption:false,
											options:pd.ui.chart.types.map((item) => ({option:{value:item}}))
										},
										valuefield:{
											id:'valuefield',
											type:'dropdown',
											caption:'',
											required:false,
											nocaption:true,
											options:[]
										},
										valuefunc:{
											id:'valuefunc',
											type:'dropdown',
											caption:'',
											required:false,
											nocaption:true,
											options:[]
										},
										columnfield:{
											id:'columnfield',
											type:'dropdown',
											caption:'',
											required:true,
											nocaption:true,
											options:[]
										},
										columnformat:{
											id:'columnformat',
											type:'dropdown',
											caption:'',
											required:false,
											nocaption:true,
											options:[]
										},
										columnsort:{
											id:'columnsort',
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
								};
								menu.preview=pd.ui.chart.create(menu.id);
								menu.table=pd.ui.table.create({
									id:'rows',
									type:'table',
									caption:'',
									nocaption:true,
									fields:{
										rowfield:{
											id:'rowfield',
											type:'dropdown',
											caption:'',
											required:true,
											nocaption:true,
											options:[]
										},
										rowformat:{
											id:'rowformat',
											type:'dropdown',
											caption:'',
											required:false,
											nocaption:true,
											options:[]
										},
										rowsort:{
											id:'rowsort',
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
								}).addclass('pd-table-rows').spread((row,index) => {
									/* event */
									row.elm('.pd-table-row-add').on('click',(e) => {
										menu.table.insertrow(row);
									});
									row.elm('.pd-table-row-del').on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											menu.table.delrow(row);
										});
									});
									/* modify elements */
									((cells) => {
										cells.field.on('change',(e) => e.currentTarget.rebuild().then(() => menu.lib.load())).rebuild=() => {
											return new Promise((resolve,reject) => {
												cells.format.empty().append(pd.create('option'));
												if (cells.field.val())
												{
													((fieldinfo) => {
														switch (fieldinfo.type)
														{
															case 'createdtime':
															case 'date':
															case 'datetime':
															case 'modifiedtime':
																((format) => {
																	format.closest('td').show();
																	return format;
																})(cells.format)
																.append(pd.create('option').attr('value','year').html(pd.constants.common.caption.grouping.date.year[pd.lang]))
																.append(pd.create('option').attr('value','month').html(pd.constants.common.caption.grouping.date.month[pd.lang]))
																.append(pd.create('option').attr('value','day').html(pd.constants.common.caption.grouping.date.day[pd.lang]));
																break;
															case 'time':
																((format) => {
																	format.closest('td').show();
																	return format;
																})(cells.format)
																.append(pd.create('option').attr('value','hour').html(pd.constants.common.caption.grouping.date.hour[pd.lang]));
																break;
															default:
																cells.format.closest('td').hide();
																break;
														}
													})(this.keep.fields[cells.field.val()]);
												}
												else cells.format.closest('td').hide();
												resolve({});
											});
										};
										cells.format.on('change',(e) => menu.lib.load()).closest('td').hide();
										cells.sort.on('change',(e) => menu.lib.load());
									})({
										field:row.elm('[field-id=rowfield]').elm('select'),
										format:row.elm('[field-id=rowformat]').elm('select'),
										sort:row.elm('[field-id=rowsort]').elm('select')
									});
								},(table,index) => {
									if (table.tr.length==0) table.addrow();
									menu.lib.load();
								},false);
								menu.table.template.elm('[field-id=rowsort]').elms('option').each((element,index) => {
									if (element.val()) element.html(pd.constants.common.caption.sort[element.val()][pd.lang]);
								});
								menu.contents
								.append(
									pd.create('nav').addclass('pd-kumaneko-nav pd-kumaneko-nav-extension')
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main')
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.view.caption.crosstab.function[pd.lang]))
												.append(
													((res) => {
														res.elm('select')
														.append(pd.create('option').attr('value','CNT').html(pd.constants.common.caption.function.count[pd.lang]))
														.append(pd.create('option').attr('value','SUM').html(pd.constants.common.caption.function.sum[pd.lang]))
														.append(pd.create('option').attr('value','AVG').html(pd.constants.common.caption.function.average[pd.lang]))
														.append(pd.create('option').attr('value','MAX').html(pd.constants.common.caption.function.maximum[pd.lang]))
														.append(pd.create('option').attr('value','MIN').html(pd.constants.common.caption.function.minimum[pd.lang]))
														.on('change',(e) => e.currentTarget.rebuild().then(() => menu.lib.load())).rebuild=() => {
															return new Promise((resolve,reject) => {
																switch (res.elm('select').val())
																{
																	case 'CNT':
																		resolve(((field) => {
																			field.elm('select').removeattr('required').empty().append(pd.create('option'));
																			return {};
																		})(menu.contents.elm('[field-id=valuefield]').hide()));
																		break;
																	case 'SUM':
																	case 'AVG':
																		resolve(((field) => {
																			var res={};
																			field.elm('select').attr('required','required').empty().append(pd.create('option'));
																			for (var key in this.keep.fields)
																				((fieldinfo) => {
																					switch (fieldinfo.type)
																					{
																						case 'number':
																							field.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																							res[fieldinfo.id]=fieldinfo;
																							break;
																					}
																				})(this.keep.fields[key]);
																			return res;
																		})(menu.contents.elm('[field-id=valuefield]').show()));
																		break;
																	case 'MAX':
																	case 'MIN':
																		resolve(((field) => {
																			var res={};
																			field.elm('select').attr('required','required').empty().append(pd.create('option'));
																			for (var key in this.keep.fields)
																				((fieldinfo) => {
																					switch (fieldinfo.type)
																					{
																						case 'autonumber':
																						case 'createdtime':
																						case 'date':
																						case 'datetime':
																						case 'id':
																						case 'modifiedtime':
																						case 'number':
																						case 'time':
																							field.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																							res[fieldinfo.id]=fieldinfo;
																							break;
																					}
																				})(this.keep.fields[key]);
																			return res;
																		})(menu.contents.elm('[field-id=valuefield]').show()));
																		break;
																}
															});
														};
														return res;
													})(pd.ui.field.create(menu.app.fields.valuefunc))
												)
												.append(
													((res) => {
														res.elm('select').on('change',(e) => menu.lib.load());
														return res;
													})(pd.ui.field.create(menu.app.fields.valuefield))
												);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.view.caption.crosstab.column[pd.lang]))
												.append(
													((res) => {
														res.elm('select').on('change',(e) => e.currentTarget.rebuild().then(() => menu.lib.load())).rebuild=() => {
															return new Promise((resolve,reject) => {
																menu.contents.elm('[field-id=columnformat]').elm('select').empty().append(pd.create('option'));
																if (res.elm('select').val())
																{
																	((fieldinfo) => {
																		switch (fieldinfo.type)
																		{
																			case 'createdtime':
																			case 'date':
																			case 'datetime':
																			case 'modifiedtime':
																				((format) => {
																					format.closest('.pd-field').show();
																					return format;
																				})(menu.contents.elm('[field-id=columnformat]').elm('select'))
																				.append(pd.create('option').attr('value','year').html(pd.constants.common.caption.grouping.date.year[pd.lang]))
																				.append(pd.create('option').attr('value','month').html(pd.constants.common.caption.grouping.date.month[pd.lang]))
																				.append(pd.create('option').attr('value','day').html(pd.constants.common.caption.grouping.date.day[pd.lang]));
																				break;
																			case 'time':
																				((format) => {
																					format.closest('.pd-field').show();
																					return format;
																				})(menu.contents.elm('[field-id=columnformat]').elm('select'))
																				.append(pd.create('option').attr('value','hour').html(pd.constants.common.caption.grouping.date.hour[pd.lang]));
																				break;
																			default:
																				menu.contents.elm('[field-id=columnformat]').elm('select').closest('.pd-field').hide();
																				break;
																		}
																	})(this.keep.fields[res.elm('select').val()]);
																}
																else menu.contents.elm('[field-id=columnformat]').elm('select').closest('.pd-field').hide();
																resolve({});
															});
														};
														return res;
													})(pd.ui.field.create(menu.app.fields.columnfield))
												)
												.append(
													((res) => {
														res.elm('select').on('change',(e) => menu.lib.load());
														return res;
													})(pd.ui.field.create(menu.app.fields.columnformat))
												)
												.append(
													((res) => {
														res.elm('select').on('change',(e) => menu.lib.load()).elms('option').each((element,index) => {
															if (element.val()) element.html(pd.constants.common.caption.sort[element.val()][pd.lang]);
														});
														return res;
													})(pd.ui.field.create(menu.app.fields.columnsort))
												);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main pd-kumaneko-border-left pd-kumaneko-inset-left')
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.view.caption.crosstab.row[pd.lang]))
												.append(menu.table);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-footer pd-kumaneko-border-top pd-kumaneko-inset-top')
										.append(
											pd.create('button').addclass('pd-icon pd-icon-filter pd-kumaneko-nav-icon').on('click',(e) => {
												this.keep.filter.show();
												e.stopPropagation();
												e.preventDefault();
											})
										)
										.append(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
									)
								)
								.append(
									((element) => {
										element.append(
											pd.create('div').addclass('pd-container')
											.append(pd.ui.field.activate(((res) => {
												res.elm('select').elms('option').each((element,index) => {
													if (element.val()) element.html(pd.constants.view.caption.chart.type[element.val()][pd.lang]);
												});
												return res;
											})(pd.ui.field.create(menu.app.fields.charttype).css({width:'100%'})),menu.app))
											.append(
												pd.create('div').addclass('pd-contents pd-kumaneko-'+menu.id)
												.append(menu.preview)
											)
										);
										return element;
									})(pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left'))
								);
								/* event */
								pd.event.on(menu.app.id,'pd.change.charttype',(e) => {
									this.menus.crosstab.lib.load();
									return e;
								});
								break;
							case 'gantt':
								menu.app={
									id:'viewbuilder_'+menu.id,
									fields:{
										columnperiod:{
											id:'columnperiod',
											type:'dropdown',
											caption:pd.constants.view.caption.gantt.period[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										},
										columnwidth:{
											id:'columnwidth',
											type:'number',
											caption:pd.constants.view.caption.gantt.width[pd.lang],
											required:true,
											nocaption:false,
											demiliter:false,
											decimals:'0',
											unit:'px',
											unitposition:'suffix'
										},
										taskstart:{
											id:'taskstart',
											type:'dropdown',
											caption:pd.constants.view.caption.gantt.start[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										},
										taskend:{
											id:'taskend',
											type:'dropdown',
											caption:pd.constants.view.caption.gantt.end[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										},
										tasktitle:{
											id:'tasktitle',
											type:'dropdown',
											caption:pd.constants.view.caption.gantt.title[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										}
									}
								};
								menu.preview=pd.ui.gantt.create();
								menu.table=pd.ui.table.create({
									id:'rows',
									type:'table',
									caption:'',
									nocaption:true,
									fields:{
										rowfield:{
											id:'rowfield',
											type:'dropdown',
											caption:'',
											required:true,
											nocaption:true,
											options:[]
										},
										rowformat:{
											id:'rowformat',
											type:'dropdown',
											caption:'',
											required:false,
											nocaption:true,
											options:[]
										},
										rowsort:{
											id:'rowsort',
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
								}).addclass('pd-table-rows').spread((row,index) => {
									/* event */
									row.elm('.pd-table-row-add').on('click',(e) => {
										menu.table.insertrow(row);
									});
									row.elm('.pd-table-row-del').on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											menu.table.delrow(row);
										});
									});
									/* modify elements */
									((cells) => {
										cells.field.on('change',(e) => e.currentTarget.rebuild().then(() => menu.lib.load())).rebuild=() => {
											return new Promise((resolve,reject) => {
												cells.format.empty().append(pd.create('option'));
												if (cells.field.val())
												{
													((fieldinfo) => {
														switch (fieldinfo.type)
														{
															case 'createdtime':
															case 'date':
															case 'datetime':
															case 'modifiedtime':
																((format) => {
																	format.closest('td').show();
																	return format;
																})(cells.format)
																.append(pd.create('option').attr('value','year').html(pd.constants.common.caption.grouping.date.year[pd.lang]))
																.append(pd.create('option').attr('value','month').html(pd.constants.common.caption.grouping.date.month[pd.lang]))
																.append(pd.create('option').attr('value','day').html(pd.constants.common.caption.grouping.date.day[pd.lang]));
																break;
															case 'time':
																((format) => {
																	format.closest('td').show();
																	return format;
																})(cells.format)
																.append(pd.create('option').attr('value','hour').html(pd.constants.common.caption.grouping.date.hour[pd.lang]));
																break;
															default:
																cells.format.closest('td').hide();
																break;
														}
													})(this.keep.fields[cells.field.val()]);
												}
												else cells.format.closest('td').hide();
												resolve({});
											});
										};
										cells.format.on('change',(e) => menu.lib.load()).closest('td').hide();
										cells.sort.on('change',(e) => menu.lib.load());
									})({
										field:row.elm('[field-id=rowfield]').elm('select'),
										format:row.elm('[field-id=rowformat]').elm('select'),
										sort:row.elm('[field-id=rowsort]').elm('select')
									});
								},(table,index) => {
									if (table.tr.length==0) table.addrow();
									menu.lib.load();
								},false);
								menu.table.template.elm('[field-id=rowsort]').elms('option').each((element,index) => {
									if (element.val()) element.html(pd.constants.common.caption.sort[element.val()][pd.lang]);
								});
								menu.contents
								.append(
									pd.create('nav').addclass('pd-kumaneko-nav pd-kumaneko-nav-extension')
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main')
										.append(
											((res) => {
												res.elm('select').on('change',(e) => menu.lib.load());
												return res;
											})(pd.ui.field.create(menu.app.fields.taskstart))
										)
										.append(
											((res) => {
												res.elm('select').on('change',(e) => menu.lib.load());
												return res;
											})(pd.ui.field.create(menu.app.fields.taskend))
										)
										.append(
											((res) => {
												res.elm('select').on('change',(e) => menu.lib.load());
												return res;
											})(pd.ui.field.create(menu.app.fields.tasktitle))
										)
										.append(
											((res) => {
												res.elm('select')
												.append(pd.create('option').attr('value','month').html(pd.constants.common.caption.grouping.date.month[pd.lang]))
												.append(pd.create('option').attr('value','day').html(pd.constants.common.caption.grouping.date.day[pd.lang]))
												.on('change',(e) => menu.lib.load());
												return res;
											})(pd.ui.field.create(menu.app.fields.columnperiod))
										)
										.append(pd.ui.field.activate(pd.ui.field.create(menu.app.fields.columnwidth),menu.app))
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main pd-kumaneko-border-left pd-kumaneko-inset-left')
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.view.caption.gantt.row[pd.lang]))
												.append(menu.table);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-footer pd-kumaneko-border-top pd-kumaneko-inset-top')
										.append(
											pd.create('button').addclass('pd-icon pd-icon-filter pd-kumaneko-nav-icon').on('click',(e) => {
												this.keep.filter.show();
												e.stopPropagation();
												e.preventDefault();
											})
										)
										.append(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
									)
								)
								.append(
									((element) => {
										element.append(
											pd.create('div').addclass('pd-container')
											.append(
												pd.create('div').addclass('pd-contents pd-kumaneko-'+menu.id)
												.append(menu.preview)
											)
										);
										return element;
									})(pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left'))
								);
								/* event */
								pd.event.on(menu.app.id,'pd.change.columnwidth',(e) => {
									if (pd.isnumeric(e.record.columnwidth.value))
									{
										if (parseInt(e.record.columnwidth.value)<64 || isNaN(e.record.columnwidth.value))
										{
											pd.alert(pd.constants.view.message.invalid.gantt.width[pd.lang]);
											e.record.columnwidth.value=64;
										}
										else this.menus.gantt.lib.load();
									}
									else e.record.columnwidth.value=64;
									return e;
								});
								break;
							case 'timeseries':
								menu.app={
									id:'viewbuilder_'+menu.id,
									fields:{
										charttype:{
											id:'charttype',
											type:'dropdown',
											caption:pd.constants.view.caption.timeseries.type[pd.lang],
											required:true,
											nocaption:false,
											options:pd.ui.chart.types.map((item) => ({option:{value:item}}))
										},
										columnfield:{
											id:'columnfield',
											type:'dropdown',
											caption:'',
											required:true,
											nocaption:true,
											options:[]
										},
										columnperiod:{
											id:'columnperiod',
											type:'dropdown',
											caption:'',
											required:true,
											nocaption:true,
											options:[]
										}
									}
								};
								menu.preview=pd.ui.chart.create(menu.id);
								menu.tables.row=pd.ui.table.create({
									id:'rows',
									type:'table',
									caption:'',
									nocaption:true,
									fields:{
										rowcaption:{
											id:'rowcaption',
											type:'text',
											caption:'',
											required:false,
											nocaption:true,
											placeholder:pd.constants.view.prompt.timeseries.caption[pd.lang],
											format:'text'
										},
										rowformula:{
											id:'rowformula',
											type:'text',
											caption:'',
											required:false,
											nocaption:true,
											placeholder:pd.constants.view.prompt.timeseries.formula[pd.lang],
											format:'text'
										}
									}
								}).addclass('pd-table-rows').spread((row,index) => {
									/* event */
									row.elm('.pd-table-row-add').on('click',(e) => {
										menu.tables.row.insertrow(row);
									});
									row.elm('.pd-table-row-del').on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											menu.tables.row.delrow(row);
										});
									});
									/* modify elements */
									row.elm('[field-id=rowcaption]').elm('input').on('change',(e) => menu.lib.load());
									row.elm('[field-id=rowformula]').elm('input').on('change',(e) => menu.lib.load());
								},(table,index) => {
									if (table.tr.length==0) table.addrow();
									menu.lib.load();
								},false);
								menu.tables.value=pd.ui.table.create({
									id:'values',
									type:'table',
									caption:'',
									nocaption:true,
									fields:{
										valueid:{
											id:'valueid',
											type:'spacer',
											caption:'',
											required:false,
											nocaption:true
										},
										valuefunc:{
											id:'valuefunc',
											type:'dropdown',
											caption:'',
											required:false,
											nocaption:true,
											options:[]
										},
										valuefield:{
											id:'valuefield',
											type:'dropdown',
											caption:'',
											required:true,
											nocaption:true,
											options:[]
										},
										valuequery:{
											id:'valuequery',
											type:'spacer',
											caption:'',
											required:false,
											nocaption:true
										}
									}
								}).addclass('pd-table-values').spread((row,index) => {
									/* event */
									row.elm('.pd-table-row-add').on('click',(e) => {
										menu.tables.value.insertrow(row);
									});
									row.elm('.pd-table-row-del').on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											menu.tables.value.delrow(row);
										});
									});
									/* modify elements */
									((cells) => {
										cells.id.elm('.pd-field-value').html((() => {
											var res=menu.tables.value.tr.shape((item) => {
												return (item.elm('[field-id=valueid]').elm('.pd-field-value').text())?parseInt(item.elm('[field-id=valueid]').elm('.pd-field-value').text().replace(/[^0-9]+/g,'')):PD_THROW;
											});
											return 'F'+((res.length>0)?(res.numbersort().last()+1).toString():'1')+'_';
										})());
										cells.func.elm('select')
										.append(pd.create('option').attr('value','CNT').html(pd.constants.common.caption.function.count[pd.lang]))
										.append(pd.create('option').attr('value','SUM').html(pd.constants.common.caption.function.sum[pd.lang]))
										.append(pd.create('option').attr('value','AVG').html(pd.constants.common.caption.function.average[pd.lang]))
										.append(pd.create('option').attr('value','MAX').html(pd.constants.common.caption.function.maximum[pd.lang]))
										.append(pd.create('option').attr('value','MIN').html(pd.constants.common.caption.function.minimum[pd.lang]))
										.append(pd.create('option').attr('value','PPCNT').html(pd.constants.common.caption.function.previous.count[pd.lang]))
										.append(pd.create('option').attr('value','PPSUM').html(pd.constants.common.caption.function.previous.sum[pd.lang]))
										.append(pd.create('option').attr('value','PPAVG').html(pd.constants.common.caption.function.previous.average[pd.lang]))
										.append(pd.create('option').attr('value','PPMAX').html(pd.constants.common.caption.function.previous.maximum[pd.lang]))
										.append(pd.create('option').attr('value','PPMIN').html(pd.constants.common.caption.function.previous.minimum[pd.lang]))
										.on('change',(e) => e.currentTarget.rebuild().then(() => menu.lib.load())).rebuild=() => {
											return new Promise((resolve,reject) => {
												switch (cells.func.elm('select').val().slice(-3))
												{
													case 'CNT':
														cells.id.removeclass('pd-table-values-guide-extension');
														resolve(((field) => {
															field.closest('td').hide().elm('select').empty().append(pd.create('option'));
															return {};
														})(cells.field));
														break;
													default:
														cells.id.addclass('pd-table-values-guide-extension');
														resolve(((field) => {
															var res={};
															field.closest('td').show().elm('select').empty().append(pd.create('option'));
															for (var key in this.keep.fields)
																((fieldinfo) => {
																	switch (fieldinfo.type)
																	{
																		case 'number':
																			field.elm('select').append(pd.create('option').attr('value',fieldinfo.id).html(fieldinfo.caption));
																			res[fieldinfo.id]=fieldinfo;
																			break;
																	}
																})(this.keep.fields[key]);
															return res;
														})(cells.field));
														break;
												}
											});
										};
										cells.field.on('change',(e) => menu.lib.load()).closest('td').hide();
										((cell) => {
											cell.filter={
												monitor:pd.create('span').addclass('pd-kumaneko-filter-monitor').html('0&nbsp;Filters'),
												query:'',
												show:() => {
													pd.filter.build({fields:this.keep.fields},cell.filter.query,null,(query,sort) => {
														cell.filter.monitor.html(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
														cell.filter.query=query;
														menu.lib.load();
													})
												}
											};
											return cell.elm('.pd-field-value');
										})(cells.query)
										.append(pd.create('button').addclass('pd-icon pd-icon-filter').on('click',(e) => cells.query.filter.show()))
										.append(cells.query.filter.monitor);
									})({
										id:row.elm('[field-id=valueid]'),
										field:row.elm('[field-id=valuefield]'),
										func:row.elm('[field-id=valuefunc]'),
										query:row.elm('[field-id=valuequery]')
									});
								},(table,index) => {
									if (table.tr.length==0) table.addrow();
									menu.lib.load();
								},false);
								menu.tables.value.template.elm('[field-id=valueid]').addclass('pd-table-values-guide');
								menu.contents
								.append(
									pd.create('nav').addclass('pd-kumaneko-nav pd-kumaneko-nav-extension')
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main')
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.view.caption.timeseries.function[pd.lang]))
												.append(menu.tables.value);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.view.caption.timeseries.column[pd.lang]))
												.append(
													((res) => {
														res.elm('select').on('change',(e) => menu.lib.load());
														return res;
													})(pd.ui.field.create(menu.app.fields.columnfield))
												)
												.append(
													((res) => {
														res.elm('select')
														.append(pd.create('option').attr('value','month').html(pd.constants.common.caption.grouping.date.month[pd.lang]))
														.append(pd.create('option').attr('value','day').html(pd.constants.common.caption.grouping.date.day[pd.lang]))
														.on('change',(e) => menu.lib.load());
														return res;
													})(pd.ui.field.create(menu.app.fields.columnperiod))
												);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main pd-kumaneko-border-left pd-kumaneko-inset-left')
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.view.caption.timeseries.row[pd.lang]))
												.append(menu.tables.row);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-footer pd-kumaneko-border-top pd-kumaneko-inset-top')
										.append(
											pd.create('button').addclass('pd-icon pd-icon-filter pd-kumaneko-nav-icon').on('click',(e) => {
												this.keep.filter.show();
												e.stopPropagation();
												e.preventDefault();
											})
										)
										.append(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
									)
								)
								.append(
									((element) => {
										element.append(
											pd.create('div').addclass('pd-container')
											.append(pd.ui.field.activate(((res) => {
												res.elm('select').elms('option').each((element,index) => {
													if (element.val()) element.html(pd.constants.view.caption.chart.type[element.val()][pd.lang]);
												});
												return res;
											})(pd.ui.field.create(menu.app.fields.charttype).css({width:'100%'})),menu.app))
											.append(
												pd.create('div').addclass('pd-contents pd-kumaneko-'+menu.id)
												.append(menu.preview)
											)
										);
										return element;
									})(pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left'))
								);
								/* event */
								pd.event.on(menu.app.id,'pd.change.charttype',(e) => {
									this.menus.timeseries.lib.load();
									return e;
								});
								break;
							case 'kanban':
								menu.app={
									id:'viewbuilder_'+menu.id,
									fields:{
										tasktitle:{
											id:'tasktitle',
											type:'dropdown',
											caption:pd.constants.view.caption.kanban.title[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										},
										taskdate:{
											id:'taskdate',
											type:'dropdown',
											caption:pd.constants.view.caption.kanban.date[pd.lang],
											required:false,
											nocaption:false,
											options:[]
										},
										taskwidth:{
											id:'taskwidth',
											type:'number',
											caption:pd.constants.view.caption.kanban.width[pd.lang],
											required:true,
											nocaption:false,
											demiliter:false,
											decimals:'0',
											unit:'px',
											unitposition:'suffix'
										}
									}
								};
								menu.preview=pd.ui.kanban.create();
								menu.table=pd.ui.table.create({
									id:'groups',
									type:'table',
									caption:'',
									nocaption:true,
									fields:{
										groupcaption:{
											id:'groupcaption',
											type:'text',
											caption:'',
											required:false,
											nocaption:true,
											placeholder:pd.constants.view.prompt.kanban.caption[pd.lang],
											format:'text'
										},
										groupquery:{
											id:'groupquery',
											type:'spacer',
											caption:'',
											required:false,
											nocaption:true
										}
									}
								}).addclass('pd-table-rows').spread((row,index) => {
									/* event */
									row.elm('.pd-table-row-add').on('click',(e) => {
										menu.table.insertrow(row);
									});
									row.elm('.pd-table-row-del').on('click',(e) => {
										pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
											menu.table.delrow(row);
										});
									});
									/* modify elements */
									((cells) => {
										cells.caption.elm('input').on('change',(e) => menu.lib.load());
										((cell) => {
											cell.filter={
												monitor:pd.create('span').addclass('pd-kumaneko-filter-monitor').html('0&nbsp;Filters'),
												query:'',
												show:() => {
													pd.filter.build({fields:this.keep.fields},cell.filter.query,null,(query,sort) => {
														cell.filter.monitor.html(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
														cell.filter.query=query;
														menu.lib.load();
													})
												}
											};
											return cell.elm('.pd-field-value');
										})(cells.query)
										.append(pd.create('button').addclass('pd-icon pd-icon-filter').on('click',(e) => cells.query.filter.show()))
										.append(cells.query.filter.monitor);
									})({
										caption:row.elm('[field-id=groupcaption]'),
										query:row.elm('[field-id=groupquery]')
									});
								},(table,index) => {
									if (table.tr.length==0) table.addrow();
									menu.lib.load();
								},false);
								menu.contents
								.append(
									pd.create('nav').addclass('pd-kumaneko-nav pd-kumaneko-nav-extension')
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main')
										.append(
											((container) => {
												container
												.append(pd.create('span').addclass('pd-table-caption').html(pd.constants.view.caption.kanban.group[pd.lang]))
												.append(menu.table);
												return container;
											})(pd.create('div').addclass('pd-kumaneko-section'))
										)
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main pd-kumaneko-border-left pd-kumaneko-inset-left')
										.append(
											((res) => {
												res.elm('select').on('change',(e) => menu.lib.load());
												return res;
											})(pd.ui.field.create(menu.app.fields.tasktitle))
										)
										.append(
											((res) => {
												res.elm('select').on('change',(e) => menu.lib.load());
												return res;
											})(pd.ui.field.create(menu.app.fields.taskdate))
										)
										.append(pd.ui.field.activate(pd.ui.field.create(menu.app.fields.taskwidth),menu.app))
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-footer pd-kumaneko-border-top pd-kumaneko-inset-top')
										.append(
											pd.create('button').addclass('pd-icon pd-icon-filter pd-kumaneko-nav-icon').on('click',(e) => {
												this.keep.filter.show();
												e.stopPropagation();
												e.preventDefault();
											})
										)
										.append(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
									)
								)
								.append(
									((element) => {
										element.append(
											pd.create('div').addclass('pd-container')
											.append(
												pd.create('div').addclass('pd-contents pd-stretch pd-kumaneko-'+menu.id)
												.append(menu.preview)
											)
										);
										return element;
									})(pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left'))
								);
								/* event */
								pd.event.on(menu.app.id,'pd.change.taskwidth',(e) => {
									if (pd.isnumeric(e.record.taskwidth.value))
									{
										if (parseInt(e.record.taskwidth.value)<200 || isNaN(e.record.taskwidth.value))
										{
											pd.alert(pd.constants.view.message.invalid.kanban.width[pd.lang]);
											e.record.taskwidth.value=200;
										}
										else this.menus.kanban.lib.load();
									}
									else e.record.taskwidth.value=200;
									return e;
								});
								break;
							case 'map':
								menu.app={
									id:'viewbuilder_'+menu.id,
									fields:{
										lat:{
											id:'lat',
											type:'dropdown',
											caption:pd.constants.view.caption.map.lat[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										},
										lng:{
											id:'lng',
											type:'dropdown',
											caption:pd.constants.view.caption.map.lng[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										},
										title:{
											id:'title',
											type:'dropdown',
											caption:pd.constants.view.caption.map.title[pd.lang],
											required:true,
											nocaption:false,
											options:[]
										},
										color:{
											id:'color',
											type:'dropdown',
											caption:pd.constants.view.caption.map.color[pd.lang],
											required:false,
											nocaption:false,
											options:[]
										},
										address:{
											id:'address',
											type:'dropdown',
											caption:pd.constants.view.caption.map.address[pd.lang],
											required:false,
											nocaption:false,
											options:[]
										},
										postalcode:{
											id:'postalcode',
											type:'dropdown',
											caption:pd.constants.view.caption.map.postalcode[pd.lang],
											required:false,
											nocaption:false,
											options:[]
										},
										handover:{
											id:'handover',
											type:'checkbox',
											caption:'',
											required:false,
											nocaption:true,
											options:[
												{option:{value:'handover'}}
											]
										}
									}
								};
								menu.map=new panda_map();
								menu.contents
								.append(
									pd.create('nav').addclass('pd-kumaneko-nav')
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-main')
										.append(pd.ui.field.create(menu.app.fields.lat))
										.append(pd.ui.field.create(menu.app.fields.lng))
										.append(pd.ui.field.create(menu.app.fields.title))
										.append(pd.ui.field.create(menu.app.fields.color))
										.append(pd.ui.field.create(menu.app.fields.address))
										.append(pd.ui.field.create(menu.app.fields.postalcode))
										.append(((res) => {
											res.elm('input').closest('label').elm('span').html(pd.constants.view.caption.map.handover[pd.lang]);
											return res;
										})(pd.ui.field.create(menu.app.fields.handover)))
									)
									.append(
										pd.create('div').addclass('pd-kumaneko-nav-footer pd-kumaneko-border-top pd-kumaneko-inset-top')
										.append(
											pd.create('button').addclass('pd-icon pd-icon-filter pd-kumaneko-nav-icon').on('click',(e) => {
												this.keep.filter.show();
												e.stopPropagation();
												e.preventDefault();
											})
										)
										.append(pd.create('span').addclass('pd-kumaneko-filter-monitor'))
									)
								)
								.append(
									((element) => {
										element.append(
											pd.create('div').addclass('pd-container')
											.append(
												((element) => {
													if (pd.map.loaded)
													{
														menu.map.init(
															element,
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
														menu.map.reloadmap([{
															label:'1',
															lat:((pd.lang!='ja')?40.7484:35.6585805),
															lng:((pd.lang!='ja')?-73.9857:139.7454329),
															balloon:pd.create('p').addclass('pd-kumaneko-map-item').html(pd.constants.view.prompt.map.title[pd.lang])
														}],true);
													}
													return element;
												})(pd.create('div').addclass('pd-kumaneko-'+menu.id))
											)
										);
										return element;
									})(pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left'))
								);
								if (pd.lang!='ja') menu.contents.elm('[field-id=postalcode]').hide();
								break;
							case 'customize':
								menu.contents
								.append(
									((res) => {
										res.elm('.pd-field-value')
										.append(pd.create('button').addclass('pd-icon pd-icon-filter').on('click',(e) => {
											this.keep.filter.show();
											e.stopPropagation();
											e.preventDefault();
										}))
										.append(pd.create('span').addclass('pd-kumaneko-filter-monitor'));
										return res;
									})(pd.ui.field.create({
										id:'monitor',
										type:'spacer',
										caption:pd.constants.view.caption.customize.filter[pd.lang],
										required:false,
										nocaption:false
									}).css({width:'100%'}))
								)
								break;
						}
						this.contents.elm('#pd-kumaneko-viewbuilder-space-contents').append(menu.contents);
					})(this.menus[key]);
				this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					var res={
						error:false,
						view:this.keep.view
					};
					if (!this.contents.elm('.pd-kumaneko-viewbuilder-name').elm('input').val())
					{
						res.error=true;
						pd.alert(pd.constants.view.message.invalid.name[pd.lang],() => {
							resolve(res);
						});
					}
					res.view.name=this.contents.elm('.pd-kumaneko-viewbuilder-name').elm('input').val();
					switch (res.view.type)
					{
						case 'calendar':
							res.error=((res,view) => {
								if (!res.error)
								{
									var tables=((record) => {
										return Array.from(new Set((() => {
											var res=[];
											if (record.date.value) res.push(this.keep.parallelize[record.date.value].tableid);
											if (record.title.value) res.push(this.keep.parallelize[record.title.value].tableid);
											return res;
										})()));
									})(res.record);
									if (tables.length>1)
									{
										res.error=true;
										pd.alert(pd.constants.view.message.invalid.calendar.table[pd.lang]);
									}
									else
									{
										view.fields.date=res.record.date.value;
										view.fields.title=res.record.title.value;
									}
								}
								return res.error;
							})(pd.record.get(this.menus.calendar.contents,this.menus.calendar.app),res.view);
							break;
						case 'crosstab':
							res.error=((res,view) => {
								if (!res.error)
								{
									var config=this.menus.crosstab.lib.remodel();
									view.chart=config.chart;
									view.fields=config.fields;
								}
								return res.error;
							})(pd.record.get(this.menus.crosstab.contents,this.menus.crosstab.app),res.view);
							break;
						case 'gantt':
							res.error=((res,view) => {
								if (!res.error)
								{
									var config=this.menus.gantt.lib.remodel();
									view.fields=config.fields;
								}
								return res.error;
							})(pd.record.get(this.menus.gantt.contents,this.menus.gantt.app),res.view);
							break;
						case 'timeseries':
							res.error=((res,view) => {
								if (!res.error)
								{
									var config=this.menus.timeseries.lib.remodel();
									if (config.fields.rows.length==0)
									{
										res.error=true;
										pd.alert(pd.constants.view.message.invalid.timeseries.row[pd.lang]);
									}
									else
									{
										if (Array.from(new Set(config.fields.rows.shape((item) => (item.caption)?item.caption:PD_THROW))).length!=config.fields.rows.length)
										{
											res.error=true;
											pd.alert(pd.constants.view.message.invalid.timeseries.caption[pd.lang]);
										}
										else
										{
											if (config.fields.values.length==0)
											{
												res.error=true;
												pd.alert(pd.constants.view.message.invalid.timeseries.function[pd.lang]);
											}
											else
											{
												view.chart=config.chart;
												view.fields=config.fields;
											}
										}
									}
								}
								return res.error;
							})(pd.record.get(this.menus.timeseries.contents,this.menus.timeseries.app),res.view);
							break;
						case 'kanban':
							res.error=((res,view) => {
								if (!res.error)
								{
									var config=this.menus.kanban.lib.remodel();
									if (config.fields.groups.length==0)
									{
										res.error=true;
										pd.alert(pd.constants.view.message.invalid.kanban.group[pd.lang]);
									}
									else
									{
										var tables=Array.from(new Set((() => {
											var res=[];
											if (config.fields.task.title) res.push(this.keep.parallelize[config.fields.task.title].tableid);
											if (config.fields.task.date) res.push(this.keep.parallelize[config.fields.task.date].tableid);
											return res;
										})()));
										if (tables.length>1)
										{
											res.error=true;
											pd.alert(pd.constants.view.message.invalid.kanban.table[pd.lang]);
										}
										else view.fields=config.fields;
									}
								}
								return res.error;
							})(pd.record.get(this.menus.kanban.contents,this.menus.kanban.app),res.view);
							break;
						case 'map':
							res.error=((res,view) => {
								if (!res.error)
								{
									var tables=((record) => {
										return Array.from(new Set((() => {
											var res=[];
											if (record.lat.value) res.push(this.keep.parallelize[record.lat.value].tableid);
											if (record.lng.value) res.push(this.keep.parallelize[record.lng.value].tableid);
											if (record.title.value) res.push(this.keep.parallelize[record.title.value].tableid);
											if (record.color.value) res.push(this.keep.parallelize[record.color.value].tableid);
											if (record.address.value) res.push(this.keep.parallelize[record.address.value].tableid);
											if (record.postalcode.value) res.push(this.keep.parallelize[record.postalcode.value].tableid);
											return res;
										})()));
									})(res.record);
									if (tables.length>1)
									{
										res.error=true;
										pd.alert(pd.constants.view.message.invalid.map.table[pd.lang]);
									}
									else
									{
										if (res.record.handover.value.length!=0 && tables.join(''))
										{
											res.error=true;
											pd.alert(pd.constants.view.message.invalid.map.handover[pd.lang]);
										}
										else
										{
											view.fields.lat=res.record.lat.value;
											view.fields.lng=res.record.lng.value;
											view.fields.title=res.record.title.value;
											view.fields.color=res.record.color.value;
											view.fields.address=res.record.address.value;
											view.fields.postalcode=res.record.postalcode.value;
											view.fields.handover=(res.record.handover.value.length!=0);
										}
									}
								}
								return res.error;
							})(pd.record.get(this.menus.map.contents,this.menus.map.app),res.view);
							break;
						case 'customize':
							break;
						default:
							if (res.view.fields.length==0)
							{
								res.error=true;
								pd.alert(pd.constants.view.message.invalid.list.field[pd.lang]);
							}
							else
							{
								if (res.view.fields.some((item) => !(item in this.keep.fields)))
								{
									res.error=true;
									pd.alert(pd.constants.view.message.invalid.list.unknown[pd.lang]);
								}
							}
							if (!res.error) res.view.type=this.menus.list.contents.elm('[field-id=readonly]').elm('input').checked?'list':'edit';
							break;
					}
					resolve(res);
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					this.header.elm('.pd-kumaneko-builder-header-id').html('id&nbsp;'+this.keep.view.id.toString()).off('click').on('click',(e) => {
						navigator.clipboard.writeText(this.keep.view.id.toString()).then(() => {
							pd.alert(pd.constants.common.message.clipboard[pd.lang]);
						})
					});
					this.container.css({
						height:(this.keep.view.type=='customize')?'calc(12em + 1px)':'calc(100% - 1em)',
						width:(this.keep.view.type=='customize')?'55em':'calc(100% - 1em)'
					});
					this.contents.elm('.pd-kumaneko-viewbuilder-name').elm('input').val(this.keep.view.name);
					switch (this.keep.view.type)
					{
						case 'calendar':
							pd.record.set(this.menus.calendar.contents,this.menus.calendar.app,(() => {
								var res={
									date:{value:this.keep.view.fields.date},
									title:{value:this.keep.view.fields.title}
								};
								((elements) => {
									elements.date.empty().append(pd.create('option'));
									elements.title.empty().append(pd.create('option'));
									for (var key in this.keep.parallelize)
									{
										switch (this.keep.parallelize[key].type)
										{
											case 'box':
											case 'spacer':
												break;
											case 'date':
											case 'datetime':
											case 'createdtime':
											case 'modifiedtime':
												elements.date.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
												elements.title.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
												break;
											default:
												elements.title.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
												break;
										}
									}
								})({
									date:this.menus.calendar.contents.elm('[field-id=date]').elm('select'),
									title:this.menus.calendar.contents.elm('[field-id=title]').elm('select')
								});
								return res;
							})());
							for (var key in this.menus)
							{
								if (key==this.keep.view.type) this.menus[key].contents.show();
								else this.menus[key].contents.hide();
							}
							this.keep.filter.monitor=this.menus.calendar.contents.elm('.pd-kumaneko-filter-monitor');
							break;
						case 'crosstab':
							pd.record.set(this.menus.crosstab.contents,this.menus.crosstab.app,((elements) => {
								elements.column.field.empty().append(pd.create('option'));
								elements.rows.field.empty().append(pd.create('option'));
								for (var key in this.keep.fields)
								{
									switch (this.keep.fields[key].type)
									{
										case 'box':
										case 'canvas':
										case 'file':
										case 'spacer':
										case 'table':
										case 'textarea':
											break;
										default:
											elements.column.field.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											elements.rows.field.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											break;
									}
								}
								elements.column.field.val(this.keep.view.fields.column.field).rebuild().then(() => {
									elements.column.format.val(this.keep.view.fields.column.format);
									elements.column.sort.val(this.keep.view.fields.column.sort);
								});
								elements.rows.table.clearrows();
								this.keep.view.fields.rows.each((values,index) => {
									if (values.field in this.keep.fields)
										((row) => {
											row.elm('[field-id=rowfield]').elm('select').val(values.field).rebuild().then(() => {
												row.elm('[field-id=rowformat]').elm('select').val(values.format);
												row.elm('[field-id=rowsort]').elm('select').val(values.sort);
											});
										})(elements.rows.table.addrow());
								});
								if (elements.rows.table.tr.length==0) elements.rows.table.addrow().elm('[field-id=rowfield]').elm('select').val('').rebuild();
								elements.value.func.val(this.keep.view.fields.value.func).rebuild().then((fields) => {
									if (this.keep.view.fields.value.field in fields) elements.value.field.val(this.keep.view.fields.value.field);
								});
								return {charttype:{value:this.keep.view.chart.type}};
							})({
								column:{
									field:this.menus.crosstab.contents.elm('[field-id=columnfield]').elm('select'),
									format:this.menus.crosstab.contents.elm('[field-id=columnformat]').elm('select'),
									sort:this.menus.crosstab.contents.elm('[field-id=columnsort]').elm('select')
								},
								value:{
									field:this.menus.crosstab.contents.elm('[field-id=valuefield]').elm('select'),
									func:this.menus.crosstab.contents.elm('[field-id=valuefunc]').elm('select')
								},
								rows:{
									field:this.menus.crosstab.table.template.elm('[field-id=rowfield]').elm('select'),
									table:this.menus.crosstab.table
								}
							}));
							for (var key in this.menus)
							{
								if (key==this.keep.view.type) this.menus[key].contents.show();
								else this.menus[key].contents.hide();
							}
							this.keep.filter.monitor=this.menus.crosstab.contents.elm('.pd-kumaneko-filter-monitor');
							if (this.keep.view.fields.column.field) this.menus.crosstab.lib.load(this.keep.view);
							else
							{
								this.menus.crosstab.preview.hide();
								this.menus.crosstab.preview.chart.hide();
							}
							break;
						case 'gantt':
							pd.record.set(this.menus.gantt.contents,this.menus.gantt.app,((elements) => {
								elements.task.start.empty().append(pd.create('option'));
								elements.task.end.empty().append(pd.create('option'));
								elements.task.title.empty().append(pd.create('option'));
								elements.rows.field.empty().append(pd.create('option'));
								for (var key in this.keep.fields)
								{
									switch (this.keep.fields[key].type)
									{
										case 'box':
										case 'spacer':
										case 'table':
											break;
										case 'canvas':
										case 'file':
										case 'textarea':
											elements.task.title.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											break;
										case 'createdtime':
										case 'date':
										case 'datetime':
										case 'modifiedtime':
											elements.task.start.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											elements.task.end.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											elements.task.title.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											elements.rows.field.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											break;
										default:
											elements.task.title.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											elements.rows.field.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											break;
									}
								}
								elements.column.period.val(this.keep.view.fields.column.period);
								elements.column.width.val(this.keep.view.fields.column.width);
								elements.task.start.val(this.keep.view.fields.task.start);
								elements.task.end.val(this.keep.view.fields.task.end);
								elements.task.title.val(this.keep.view.fields.task.title);
								elements.rows.table.clearrows();
								this.keep.view.fields.rows.each((values,index) => {
									if (values.field in this.keep.fields)
										((row) => {
											row.elm('[field-id=rowfield]').elm('select').val(values.field).rebuild().then(() => {
												row.elm('[field-id=rowformat]').elm('select').val(values.format);
												row.elm('[field-id=rowsort]').elm('select').val(values.sort);
											});
										})(elements.rows.table.addrow());
								});
								if (elements.rows.table.tr.length==0) elements.rows.table.addrow().elm('[field-id=rowfield]').elm('select').val('').rebuild();
								return {};
							})({
								column:{
									period:this.menus.gantt.contents.elm('[field-id=columnperiod]').elm('select'),
									width:this.menus.gantt.contents.elm('[field-id=columnwidth]').elm('input')
								},
								task:{
									start:this.menus.gantt.contents.elm('[field-id=taskstart]').elm('select'),
									end:this.menus.gantt.contents.elm('[field-id=taskend]').elm('select'),
									title:this.menus.gantt.contents.elm('[field-id=tasktitle]').elm('select')
								},
								rows:{
									field:this.menus.gantt.table.template.elm('[field-id=rowfield]').elm('select'),
									table:this.menus.gantt.table
								}
							}));
							for (var key in this.menus)
							{
								if (key==this.keep.view.type) this.menus[key].contents.show();
								else this.menus[key].contents.hide();
							}
							this.keep.filter.monitor=this.menus.gantt.contents.elm('.pd-kumaneko-filter-monitor');
							if (this.keep.view.fields.task.start && this.keep.view.fields.task.end && this.keep.view.fields.task.title) this.menus.gantt.lib.load(this.keep.view);
							else this.menus.gantt.preview.hide();
							break;
						case 'timeseries':
							pd.record.set(this.menus.timeseries.contents,this.menus.timeseries.app,((elements) => {
								elements.column.field.empty().append(pd.create('option'));
								for (var key in this.keep.fields)
								{
									switch (this.keep.fields[key].type)
									{
										case 'createdtime':
										case 'date':
										case 'datetime':
										case 'modifiedtime':
											elements.column.field.append(pd.create('option').attr('value',this.keep.fields[key].id).html(this.keep.fields[key].caption));
											break;
									}
								}
								elements.column.field.val(this.keep.view.fields.column.field)
								elements.column.period.val(this.keep.view.fields.column.period);
								elements.rows.table.clearrows();
								this.keep.view.fields.rows.each((values,index) => {
									((row) => {
										row.elm('[field-id=rowcaption]').elm('input').val(values.caption);
										row.elm('[field-id=rowformula]').elm('input').val(values.formula);
									})(elements.rows.table.addrow());
								});
								if (elements.rows.table.tr.length==0) elements.rows.table.addrow();
								elements.values.table.clearrows();
								this.keep.view.fields.values.each((values,index) => {
									((row) => {
										row.elm('[field-id=valueid]').elm('.pd-field-value').html(values.id);
										row.elm('[field-id=valuefunc]').elm('select').val(values.func).rebuild().then((fields) => {
											if (values.field in fields)
											{
												row.elm('[field-id=valuefield]').elm('select').val(values.field);
												((element,query) => {
													element.filter.monitor.html(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
													element.filter.query=query;
												})(row.elm('[field-id=valuequery]'),values.query);
											}
										});
									})(elements.values.table.addrow());
								});
								if (elements.values.table.tr.length==0) elements.values.table.addrow().elm('[field-id=valuefunc]').elm('select').val('CNT').rebuild();
								return {charttype:{value:this.keep.view.chart.type}};
							})({
								column:{
									field:this.menus.timeseries.contents.elm('[field-id=columnfield]').elm('select'),
									period:this.menus.timeseries.contents.elm('[field-id=columnperiod]').elm('select')
								},
								rows:{
									table:this.menus.timeseries.tables.row
								},
								values:{
									table:this.menus.timeseries.tables.value
								}
							}));
							for (var key in this.menus)
							{
								if (key==this.keep.view.type) this.menus[key].contents.show();
								else this.menus[key].contents.hide();
							}
							this.keep.filter.monitor=this.menus.timeseries.contents.elms('.pd-kumaneko-filter-monitor').last();
							if (this.keep.view.fields.column.field) this.menus.timeseries.lib.load(this.keep.view);
							else
							{
								this.menus.timeseries.preview.hide();
								this.menus.timeseries.preview.chart.hide();
							}
							break;
						case 'kanban':
							pd.record.set(this.menus.kanban.contents,this.menus.kanban.app,((elements) => {
								elements.task.title.empty().append(pd.create('option'));
								elements.task.date.empty().append(pd.create('option'));
								for (var key in this.keep.parallelize)
								{
									switch (this.keep.parallelize[key].type)
									{
										case 'box':
										case 'spacer':
											break;
										case 'createdtime':
										case 'date':
										case 'datetime':
										case 'modifiedtime':
											elements.task.date.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
											elements.task.title.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
											break;
										default:
											elements.task.title.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
											break;
									}
								}
								elements.task.title.val(this.keep.view.fields.task.title);
								elements.task.date.val(this.keep.view.fields.task.date);
								elements.task.width.val(this.keep.view.fields.task.width);
								elements.groups.table.clearrows();
								this.keep.view.fields.groups.each((values,index) => {
									((row) => {
										row.elm('[field-id=groupcaption]').elm('input').val(values.caption);
										((element,query) => {
											element.filter.monitor.html(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
											element.filter.query=query;
										})(row.elm('[field-id=groupquery]'),values.query);
									})(elements.groups.table.addrow());
								});
								if (elements.groups.table.tr.length==0) elements.groups.table.addrow();
								return {};
							})({
								task:{
									title:this.menus.kanban.contents.elm('[field-id=tasktitle]').elm('select'),
									date:this.menus.kanban.contents.elm('[field-id=taskdate]').elm('select'),
									width:this.menus.kanban.contents.elm('[field-id=taskwidth]').elm('input')
								},
								groups:{
									table:this.menus.kanban.table
								}
							}));
							for (var key in this.menus)
							{
								if (key==this.keep.view.type) this.menus[key].contents.show();
								else this.menus[key].contents.hide();
							}
							this.keep.filter.monitor=this.menus.kanban.contents.elms('.pd-kumaneko-filter-monitor').last();
							if (this.keep.view.fields.task.title) this.menus.kanban.lib.load(this.keep.view);
							else this.menus.kanban.preview.hide();
							break;
						case 'map':
							pd.record.set(this.menus.map.contents,this.menus.map.app,(() => {
								var res={
									lat:{value:this.keep.view.fields.lat},
									lng:{value:this.keep.view.fields.lng},
									title:{value:this.keep.view.fields.title},
									color:{value:this.keep.view.fields.color},
									address:{value:this.keep.view.fields.address},
									postalcode:{value:this.keep.view.fields.postalcode},
									handover:{value:(this.keep.view.fields.handover)?[this.menus.map.app.fields.handover.options.first().option.value]:[]}
								};
								((elements) => {
									elements.lat.empty().append(pd.create('option'));
									elements.lng.empty().append(pd.create('option'));
									elements.title.empty().append(pd.create('option'));
									elements.color.empty().append(pd.create('option'));
									elements.address.empty().append(pd.create('option'));
									elements.postalcode.empty().append(pd.create('option'));
									for (var key in this.keep.parallelize)
									{
										switch (this.keep.parallelize[key].type)
										{
											case 'box':
											case 'spacer':
												break;
											case 'color':
												elements.color.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
												break;
											case 'number':
												elements.lat.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
												elements.lng.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
												elements.title.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
												break;
											default:
												elements.title.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
												switch (this.keep.parallelize[key].type)
												{
													case 'address':
														elements.address.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
														break;
													case 'postalcode':
														elements.postalcode.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
														break;
													case 'text':
														if (this.keep.parallelize[key].format=='text')
															elements.address.append(pd.create('option').attr('value',this.keep.parallelize[key].id).html(this.keep.parallelize[key].caption));
														break;
												}
												break;
										}
									}
								})({
									lat:this.menus.map.contents.elm('[field-id=lat]').elm('select'),
									lng:this.menus.map.contents.elm('[field-id=lng]').elm('select'),
									title:this.menus.map.contents.elm('[field-id=title]').elm('select'),
									color:this.menus.map.contents.elm('[field-id=color]').elm('select'),
									address:this.menus.map.contents.elm('[field-id=address]').elm('select'),
									postalcode:this.menus.map.contents.elm('[field-id=postalcode]').elm('select')
								});
								return res;
							})());
							for (var key in this.menus)
							{
								if (key==this.keep.view.type) this.menus[key].contents.show();
								else this.menus[key].contents.hide();
							}
							this.keep.filter.monitor=this.menus.map.contents.elm('.pd-kumaneko-filter-monitor');
							break;
						case 'customize':
							this.keep.filter.monitor=this.menus.customize.contents.elm('.pd-kumaneko-filter-monitor');
							for (var key in this.menus)
							{
								if (key==this.keep.view.type) this.menus[key].contents.show();
								else this.menus[key].contents.hide();
							}
							break;
						default:
							((nav) => {
								for (var key in this.keep.fields)
									((fieldinfo) => {
										nav.append(
											pd.create('div').addclass('pd-kumaneko-nav-button pd-kumaneko-border-bottom')
											.append(
												((res) => {
													this.keep.nav[fieldinfo.id]=res;
													return this.menus.list.lib.activate(res,fieldinfo).append(pd.create('span').addclass('pd-kumaneko-nav-button-item-label').html(fieldinfo.caption));
												})(pd.create('span').addclass('pd-kumaneko-nav-button-item'))
											)
										);
									})(this.keep.fields[key]);
								return nav;
							})(this.menus.list.contents.elm('.pd-kumaneko-nav-main').empty());
							((fields) => {
								fields.each((field,index) => {
									if (field in this.keep.fields) this.menus.list.contents.elm('.pd-box').append(this.menus.list.lib.create(this.keep.fields[field]));
								});
								this.menus.list.lib.remodel();
							})(this.keep.view.fields);
							this.menus.list.contents.elm('[field-id=readonly]').elm('input').checked=(this.keep.view.type=='list');
							for (var key in this.menus)
							{
								if (key=='list') this.menus[key].contents.show();
								else this.menus[key].contents.hide();
							}
							this.keep.filter.monitor=this.menus.list.contents.elm('.pd-kumaneko-filter-monitor');
							break;
					}
					this.keep.filter.monitor.html(((query,sort) => {
						var res=[];
						res.push(query.split(' and ').filter((item) => item).length.toString()+'&nbsp;Filters');
						if (!['crosstab','timeseries'].includes(this.keep.view.type)) res.push(sort.split(',').filter((item) => item).length.toString()+'&nbsp;Sorts');
						return res.join(',&nbsp;');
					})(this.keep.view.query,this.keep.view.sort));
					resolve();
				});
			}
			/* show */
			show(app,view,fields,callback){
				if (view instanceof Object)
				{
					/* initialize elements */
					this.menus.list.lib.init();
					/* setup properties */
					this.keep.app=app;
					this.keep.fields=fields;
					this.keep.parallelize=pd.ui.field.parallelize(fields);
					this.keep.nav={};
					this.keep.view=pd.extend({},view);
					/* modify elements */
					this.contents.elms('input,select,textarea').each((element,index) => {
						if (element.alert) element.alert.hide();
					});
					/* setup handler */
					if (this.handler)
					{
						this.ok.off('click',this.handler);
						this.cancel.off('click');
					}
					this.handler=(e) => {
						this.get().then((resp) => {
							if (!resp.error)
							{
								callback(this.keep.view);
								this.hide();
							}
						});
					};
					this.ok.on('click',this.handler);
					this.cancel.on('click',(e) => this.hide());
					/* set configuration */
					this.set().then(() => {
						/* show */
						super.show();
					});
				}
				else pd.alert(pd.constants.common.message.invalid.config.corrupted[pd.lang]);
			}
		}
	},
	dashboard:class{
		/* constructor */
		constructor(frames,contents,tab){
			/* setup properties */
			this.area={
				contents:contents,
				tab:tab
			};
			this.panels={};
			this.ui=(() => {
				var res={
					contents:null,
					space:null,
					tab:null
				};
				res.contents=(() => {
					return pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-top pd-kumaneko-inset-top')
					.append(
						pd.create('div').addclass('pd-container')
						.append((() => {
							res.space=pd.create('div').addclass('pd-kumaneko-section');
							return res.space;
						})())
						.append(pd.create('div').addclass('pd-kumaneko-dashboard'))
					).hide();
				})();
				res.tab=new pd.modules.tab(pd.constants.common.caption.tab.dashboard[pd.lang]);
				res.tab.container.on('click',(e) => {
					pd.event.call('0','pd.dashboard.activate',{});
					e.stopPropagation();
					e.preventDefault();
				});
				res.tab.close.hide();
				return res;
			})();
			/* integrate elements */
			this.area.contents.insertBefore(this.ui.contents,null);
			this.area.tab.insertBefore(this.ui.tab.container,null);
			/* event */
			pd.event.on('0','pd.dashboard.redraw',(e) => {
				((panel) => {
					if (panel)
						((app,view) => {
							switch (view.type)
							{
								case 'calendar':
									pd.event.call(panel.app,'pd.view.call',{app:app,view:pd.extend({calendar:panel.calendar},view),records:e.records,option:{readonly:true,date:e.month}});
									break;
								case 'crosstab':
									pd.event.call(panel.app,'pd.view.call',{app:app,view:pd.extend({crosstab:panel.crosstab},view),records:e.records});
									break;
								case 'gantt':
									pd.event.call(panel.app,'pd.view.call',{app:app,view:pd.extend({gantt:panel.gantt},view),records:e.records});
									break;
								case 'timeseries':
									pd.event.call(panel.app,'pd.view.call',{app:app,view:pd.extend({timeseries:panel.timeseries},view),records:e.records});
									break;
								case 'kanban':
									pd.event.call(panel.app,'pd.view.call',{app:app,view:pd.extend({kanban:panel.kanban},view),records:e.records});
									break;
								case 'map':
									pd.event.call(panel.app,'pd.view.call',{app:app,view:pd.extend({map:panel.map},view),records:e.records,option:{center:true}});
									break;
								default:
									pd.event.call(panel.app,'pd.view.call',{app:app,view:pd.extend({body:panel.body},view),records:e.records,option:{readonly:true}}).then(() => panel.body.parentNode.show());
									break;
							}
						})(panel.config.app,panel.config.view);
				})(this.panels[e.app+'_'+e.view]);
			});
			/* setup panels */
			((dashboard) => {
				frames.each((frame,index) => {
					dashboard.append(
						((flex) => {
							frame.panels.each((panel,index) => {
								flex.append(
									((container) => {
										((body) => {
											panel.body=body;
											/* modify elements */
											switch (panel.config.view.type)
											{
												case 'calendar':
													panel.body.append(panel.calendar.calendar.addclass('pd-kumaneko-calendar'));
													break;
												case 'crosstab':
													if (panel.config.view.chart.type!='table') panel.body.addclass('pd-fixed');
													panel.body.append(panel.crosstab);
													break;
												case 'gantt':
													panel.body.append(panel.gantt);
													break;
												case 'timeseries':
													if (panel.config.view.chart.type!='table') panel.body.addclass('pd-fixed');
													panel.body.append(panel.timeseries);
													break;
												case 'kanban':
													panel.body.append(panel.kanban);
													break;
												case 'map':
													((element) => {
														panel.body.addclass('pd-fixed').append(element);
														panel.map.init(
															element,
															{
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
																zoom:14
															}
														);
													})(pd.create('div').addclass('pd-kumaneko-map'));
													break;
												default:
													pd.ui.view.create(panel.body,panel.config.app,panel.view);
													break;
											}
											this.panels[panel.app+'_'+panel.view]=panel;
											return panel.body;
										})(container.elm('.pd-panel-contents'))
										return (index<frame.panels.length-1)?container.addclass('pd-kumaneko-border-right'):container;
									})(pd.ui.panel.create(
										panel.config.view.name,
										[
											{
												icon:'pd-icon pd-icon-open',
												handler:(e) => pd.event.call(panel.app,'pd.app.activate',{viewid:panel.view})
											}
										]
									).css({width:panel.styles.width}))
								);
							});
							return flex.css({height:(frame.styles.height)?frame.styles.height:'auto'});
						})(pd.create('div').addclass('pd-flex pd-kumaneko-border-top'))
					);
				});
				return dashboard;
			})(this.ui.contents.elm('.pd-kumaneko-dashboard'));
			pd.event.call('0','pd.dashboard.build',{space:this.ui.space}).then(() => {
				this.show();
				pd.kumaneko.app.bootup(pd.queries());
			});
		}
		/* show */
		show(){
			this.ui.contents.show();
			this.ui.tab.activate();
		}
		/* hide */
		hide(){
			this.ui.contents.hide();
			this.ui.tab.deactivate();
		}
	},
	injector:class extends panda_kumaneko_app{
		/* constructor */
		constructor(app,setting){
			super(app);
			/* setup properties */
			this.setting=setting;
			this.record={
				clear:() => {
					this.record.id=((body) => {
						pd.record.clear(body,this.app);
						body.focus();
						return '';
					})(this.record.ui.body.removeattr('unsaved'));
				},
				save:() => {
					var res=pd.record.get(this.record.ui.body,this.app);
					if (!res.error)
						pd.event.call(this.app.id,'pd.create.submit',{
							container:this.record.ui.body,
							record:res.record
						})
						.then((param) => {
							if (!param.error)
							{
								((actions) => {
									pd.confirm(pd.constants.common.message.confirm.submit[pd.lang],() => {
										this.actions.saving([param.record])
										.then((confirmed) => {
											pd.loadstart();
											pd.request(pd.ui.baseuri()+'/records.php','POST',{},{app:this.app.id,records:[param.record],notify:true},true)
											.then((resp) => {
												pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:this.app.id,id:resp.id},true)
												.then((resp) => {
													((record,update) => {
														var action=(index,callback) => {
															this.actions.button(actions[index],record).then((param) => {
																if ('record' in param)
																{
																	record=this.actions.value(param.record,'backend');
																	update=true;
																}
																index++;
																if (index<actions.length) action(index,callback);
																else callback();
															}).catch(() => pd.loadend());
														};
														var finish=() => {
															pd.loadend();
															pd.event.call(this.app.id,'pd.create.submit.success',{
																container:this.record.ui.body,
																record:record
															})
															.then((param) => {
																if (!param.error)
																	pd.alert(pd.constants.common.message.finished.submit[pd.lang],() => {
																		pd.event.call(this.app.id,'pd.create.call',{});
																	});
															});
														};
														if (actions.length!=0)
														{
															action(0,() => {
																if (update)
																{
																	this.actions.saving([record])
																	.then((confirmed) => {
																		if (confirmed) pd.loadstart();
																		pd.request(pd.ui.baseuri()+'/records.php','PUT',{},{app:this.app.id,records:[record],notify:true},true)
																		.then((resp) => {
																			pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:this.app.id,id:record['__id'].value},true)
																			.then((resp) => finish())
																			.catch((error) => pd.alert(error.message));
																		})
																		.catch((error) => pd.alert(error.message));
																	})
																	.catch(() => pd.loadend());
																}
																else finish();
															});
														}
														else finish();
													})(((resp.total!=0)?resp.record:param.record),false);
												})
												.catch((error) => pd.alert(error.message));
											})
											.catch((error) => pd.alert(error.message));
										})
										.catch(() => {})
									});
								})(this.app.actions.filter((item) => item.trigger=='button' && this.setting.saving.action.includes(item.id)));
							}
						});
				},
				ui:((this.setting)?this.setting.ui:{})
			};
			if (this.setting)
			{
				/* modify elements */
				pd.ui.form.create(this.record.ui.body,((app) => {
					var fields=this.setting.fields.reduce((result,current) => {
						if (current.id in app.fields)
							switch (current.type)
							{
								case 'table':
									result.push({type:'table',id:current.id});
									break;
								default:
									result.push({type:'row',fields:[current.id]});
									break;
							}
						return result;
					},[]);
					var unuses=Object.values(app.fields).reduce((result,current) => {
						if (!this.setting.fields.some((item) => item.id==current.id))
							switch (current.type)
							{
								case 'table':
									result.push({type:'table',id:current.id,unuse:true});
									break;
								default:
									result.push({type:'row',fields:[current.id],unuse:true});
									break;
							}
						return result;
					},[]);
					app.layout=fields.concat(unuses);
					return app;
				})(pd.extend({},this.app)),true);
				/* event */
				this.record.ui.buttons.ok.on('click',(e) => this.record.save());
				/* call event */
				pd.event.call(this.app.id,'pd.record.build',{
					header:this.record.ui.header.elm('.pd-kumaneko-injector-header-space'),
					body:this.record.ui.body
				});
			}
			/* event */
			pd.event.on(this.app.id,'pd.action.call',(e) => {
				return new Promise((resolve,reject) => {
					this.actions.value(e.record,e.workplace);
					resolve(e);
				});
			});
			pd.event.on(this.app.id,'pd.create.call',(e) => {
				return new Promise((resolve,reject) => {
					pd.event.call(this.app.id,'pd.create.load',{
						container:this.record.ui.body,
						record:(() => {
							this.record.clear();
							return pd.record.get(this.record.ui.body,this.app,true).record;
						})()
					})
					.then((param) => {
						if (!param.error)
						{
							pd.record.set(this.record.ui.body.removeattr('unsaved'),this.app,this.actions.value(param.record)).then(() => {
								pd.event.call(this.app.id,'pd.create.load.complete',{container:this.record.ui.body});
							});
						}
					});
				});
			});
			pd.event.on(this.app.id,'pd.fields.call',(e) => {
				e.fields=this.app.fields;
				return e;
			});
			pd.event.on(this.app.id,'pd.permit.call',(e) => {
				e.permit=(pd.kumaneko.permit(this.app.permissions)!='denied');
				return e;
			});
			pd.event.on(this.app.id,'pd.saving.call',(e) => {
				return new Promise((resolve,reject) => {
					this.actions.saving(e.records).then((confirmed) => resolve(e)).catch(() => reject(e));
				});
			});
			if (this.setting)
			{
				/* beforeunload event */
				window.on('beforeunload',(e) => {
					if (this.record.ui.body.hasAttribute('unsaved')) e.returnValue=pd.constants.common.message.confirm.changed[pd.lang];
				});
			}
		}
	},
	manager:{
		app:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999993,false,false);
				/* setup properties */
				this.apps={};
				this.sort=[];
				this.lib={
					create:(app,isduplicate=false) => {
						var res=pd.create('div').addclass('pd-row').attr('field-type','row');
						var handler=(e) => {
							var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
							pd.event.call(
								'appmanager',
								'pd.drag.start',
								{
									element:res,
									page:{
										x:pointer.pageX,
										y:pointer.pageY
									}
								}
							);
							window.off('touchmove,mousemove',handler);
						};
						/* setup properties */
						res.app=app;
						/* modify elements */
						res
						.append(
							pd.create('button').addclass('pd-icon pd-icon-setting pd-kumaneko-drag-button')
							.on('touchstart,mousedown',(e) => {
								e.stopPropagation();
							})
							.on('click',(e) => {
								pd.kumaneko.appbuilder.show(res.app);
							})
						)
						.append(
							pd.create('button').addclass('pd-icon pd-icon-duplicate pd-kumaneko-drag-button')
							.on('touchstart,mousedown',(e) => {
								e.stopPropagation();
							})
							.on('click',(e) => {
								pd.request(pd.ui.baseuri()+'/increment.php','PUT',{},{target:'app'},true)
								.then((resp) => {
									((duplicate) => {
										res.parentNode.insertBefore(this.lib.create(duplicate,true),res.nextElementSibling);
										pd.event.call('0','pd.queue.app',{action:'add',app:duplicate}).then(() => {
											this.apps[duplicate.id]=duplicate;
											this.lib.remodel();
										});
									})(pd.extend({id:resp.id.toString(),name:res.app.name+' Copy',permissions:{'owner':[pd.operator.__id.value.toString()]}},res.app));
								})
								.catch((error) => {
									pd.alert(error.message);
								});
							})
						)
						.append(pd.create('span').addclass('pd-kumaneko-drag-label').html(app.name));
						/* event */
						res
						.on('touchstart,mousedown',(e) => {
							window.on('touchmove,mousemove',handler);
							e.stopPropagation();
							e.preventDefault();
						})
						.on('touchend,mouseup',(e) => {
							window.off('touchmove,mousemove',handler);
						});
						if (isduplicate)
						{
							pd.event.on(app.id,'pd.app.deleted',(e) => {
								pd.event.call('0','pd.queue.app',{action:'delete',app:app.id}).then(() => {
									res.parentNode.removeChild(res);
									this.lib.remodel();
								});
							});
						}
						return res;
					},
					init:() => {
						this.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(this.contents.elm('.pd-kumaneko-drag-guide'),null);
						pd.children(this.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
							if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
						});
					},
					remodel:() => {
						this.sort=[];
						pd.children(this.contents.elm('.pd-kumaneko-drag-vertical')).each((element,index) => {
							if (!element.hasclass('pd-kumaneko-drag-guide')) this.sort.push(element.app.id.toString());
						});
						pd.event.call('0','pd.queue.sort',{sort:this.sort});
					}
				};
				/* modify elements */
				this.header.css({paddingLeft:'0.25em',paddingRight:'4em',textAlign:'left'})
				.append(pd.create('span').css({lineHeight:'2em'}).html('App Management'))
				.append(
					((icon) => {
						icon.css({
							right:'2em',
							top:'0'
						})
						.on('click',(e) => {
							pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
							.then((resp) => {
								delete resp.file.dashboard;
								delete resp.file.increments;
								pd.downloadtext(JSON.stringify(resp.file,null,'\t'),'config.json');
							})
							.catch((error) => pd.alert(error.message));
							e.stopPropagation();
							e.preventDefault();
						});
						switch (pd.theme)
						{
							case 'dark':
								icon.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAtFJREFUeNpiYKA6+A8EyHwmfJI4dQKZBjA+C9EmICm6T5KjAQKIHn7H6vr/EGCAroARl18ZgYB8vwIEEE29/h6EyQ43fBHLhEPTfmLEsNoEBAFY5AIIuQSkKOE/bpBAtQAFCKDhiAhlXiZKDKe+ZuRCCD2jEsrmMIWGSLQALgNgmhygtrzHk8NAwAGbzTBBARzmC6CpQy1XSSpfYQUUsRoxCi08YaAA9aPC4Eu+AAE0iugGGKlRxBCd7KhVitCl+ELKIxhVFVptRJs8BCsWsQADalqyHt10LA4wwOFzEFhPqoUNBGt/EtoyIPNIjmMsvjgPxAJoagSg4v9xpQOisxO09UiNhPIAmNsUKY3z+f/xg/mjReOgAwABNIpGwSggujM79FsgI9ti5PoYvW6m1bAKIfB+ICx/PxA+p5lP5yO3LtAsf49LHbmWJeAbOkIfSiOkntRmKcltKWztMqq0h2naNqekR4Cv90GOxcigAIv6AnwaiG7QU9p1IWbYBleRGUhFewPJKpNBY7//SQf7qVaGQwfw8BaZyIN3tCrJGqiR5UbBKKAJAAjQrhXYMAgCQUk6gCO4QjeoGziCo7iBK3SDjlA3qBvQDXSDFpJr2hKoovii/YvGaBS4/wfkHj4YDMamIKgrhHiffTzS+up9z4SH9zrsUYP4O9GFCRPhsFA/dS1gTq71iLo0jvVlE70VkWzsHvPQBc2ORkx8e0QnEo+fKHYKaHFJjknYO4h3jvdskKgvoyJYjgxRaVPeDELXXx4dMKRpsHJpZedL16TaeQiDXxztqKjmYR1e6dLJF5SfJmH2R8zysCvM6qmDEEK+9hzhyTxsg/aE7sM3S/gXBrnCDFP9Hb4PHjXCx+poSKw4qr+yNpiHdWECULe5Os/q7Fci16P+XLzRkrYAc3I1cirxgUS5WRI7kK4pPVI2V7y/2IgvVjLES+YhlXcYDAZjc3gC2vR/IwVkWLEAAAAASUVORK5CYII=');
								break;
							case 'light':
								icon.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA5RJREFUeNpiYKA6KJy15j8ynwmfJE6dQLYBjM9CtAlIiu6T5GiAAKKH37G6HiQA8iu6AmQ/nwcKUsmvAAFEU6+/B2Fc8iwE9Avgk2TCYeN+YsRwJZ9AENGfFsKIJD0RJg8TZ8RiQwKQmo/DpYlAjQuoEqAAATQcEaHMy0SJ4RRpZsThXFDGPI8kZAiM3wsEbUbK0YZItAByTsewGSjpAKRA6fcD0BZBbDkMmlEcgfIH0G12IJCTBNDUYc+SRJWvODIGTo1ouQx7aEMNUQBSoAJNEajpweBKvgABNIroBhipUcSgJzualyJ08TFSHiEEiMpDjGQEMXqxiLd4JMtioCXrgVQAtmIEyQFwC7EUPxuAcoGkFPYNQKqe3ISDJQE2As1pIKURhM0XF6Dl/QckNQLQesKA4qCGth4VqJCAHwAdqUhR4gI6BtSuSsCjZAHQksTR4nFQAYAAGkWjYBSgd+n/k6t/wFogoxYTG78C2Ni0auy9JzQ6gqvDSHFjj4DlRFtKbisTm+UkWUq0xdCWBwOsdYFmOdxSdHXktrlATRz0IST40BFsGA3JUrzqiW3e/ie3LYWtXYatiUyoeYvRHiYEoA5MRG6bYwOELK4HGlCPr0dATO+DHIthIAAp+AuBjpiAZlkByLOkhAwLGYVOP9CifgYKAa4iM5CBeiCQ5HwMLYdBceZAomUHQBYi968oKasdoI7AWWRCLTtAszEQtKxCcpYbBaOApgAgQLtWdIQgDEOD5wCMwAiOoBPIBoygbqATcI7ABnUC2URGcASNRK5WWltoq5x5Jz981L40JM1L+MdgMCaFJPYfksifSa+amA2x+ReMfPmm4Wf/5tJMmIPWsMCkq7CWmhL9QFVWX3lf+9xbqKCFVdsZPqtwndzQYwhcYzWptERdVhfiHVGXNvDP5WFL4kGJeiFMlwhUsTbQ3+R9adhriL8RNQwA4AXlCK3S1gQnTMpoaeGij42pyptCCNfZ6U6UVDqdIVXP2NkOArrIS3tNhBX35xRj8pAMvoZ+bdRKbfKRh/EE0qHNFweyKXlWNmYdH2lpQU8pzQKjm+GJV0OCELl8Aa2u79WQofIwbhK/wa0yEC3ICEIilxO5HCLAhbAAQyPDEkgqN06FD4cIlpbo6vg8lRTi4yp5i9PVM/EYVDL65grwM3glp7gK2r7eaKEg9NUyJS8owK5lUxM5YWrVTEriUWSehuedGQwGw4Ab4kZ8FrSVRGEAAAAASUVORK5CYII=');
								break;
						}
						return icon;
					})(this.parts.icon.clone())
				);
				this.container.addclass('pd-kumaneko-main').css({
					height:'calc(100% - 1em)',
					width:'calc(100% - 1em)'
				});
				this.contents.addclass('pd-kumaneko-appmanager').css({
					padding:'0'
				})
				.append(
					pd.create('div').addclass('pd-kumaneko-drag-vertical').attr('field-type','form')
					.append(pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
				);
				/* event */
				pd.event.on('appmanager','pd.drag.start',(e) => {
					var keep={
						element:e.element,
						guide:this.contents.elm('.pd-kumaneko-drag-guide')
					};
					var handler={
						move:(e) => {
							var element=document.elementFromPoint(e.pageX,e.pageY);
							if (element)
								if (element!=keep.guide)
									((rect) => {
										switch (element.attr('field-type'))
										{
											case 'row':
												element.parentNode.insertBefore(keep.guide.removeclass('pd-hidden'),(e.pageY<rect.top+rect.height*0.5)?element:element.nextElementSibling);
												break;
											case 'form':
												element.insertBefore(keep.guide.removeclass('pd-hidden'),null);
												break;
										}
									})(element.getBoundingClientRect());
						},
						end:(e) => {
							if (keep.guide.visible())
							{
								keep.guide.parentNode.insertBefore(keep.element.removeclass('pd-hidden'),keep.guide.nextElementSibling);
								this.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(keep.guide.addclass('pd-hidden'),null);
								this.lib.remodel();
							}
							else
							{
								keep.element.removeclass('pd-hidden');
								this.contents.elm('.pd-kumaneko-drag-vertical').insertBefore(keep.guide.addclass('pd-hidden'),null);
							}
							window.off('mousemove,touchmove',handler.move);
							window.off('mouseup,touchend',handler.end);
							e.stopPropagation();
							e.preventDefault();
						}
					};
					((rect) => {
						keep.guide.css({height:rect.height.toString()+'px',width:rect.width.toString()+'px'});
						keep.element.addclass('pd-hidden').parentNode.insertBefore(keep.guide.removeclass('pd-hidden'),keep.element.nextElementSibling);
					})(keep.element.getBoundingClientRect());
					/* event */
					window.on('mousemove,touchmove',handler.move);
					window.on('mouseup,touchend',handler.end);
				});
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					this.lib.remodel();
					resolve({apps:this.apps,sort:this.sort});
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					pd.kumaneko.sort(this.apps,this.sort).each((app,index) => {
						this.contents.elm('.pd-kumaneko-drag-vertical').append(this.lib.create(app));
					});
					resolve();
				});
			}
			/* show */
			show(){
				pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
				.then((resp) => {
					/* initialize elements */
					this.lib.init();
					/* setup properties */
					this.apps=resp.file.apps.user;
					this.sort=resp.file.apps.sort;
					/* setup handler */
					if (this.handler)
					{
						this.ok.off('click',this.handler);
						this.cancel.off('click');
					}
					this.handler=(e) => {
						this.get().then((resp) => {
							((apps,sort) => {
								pd.request(pd.ui.baseuri()+'/config.php','GET',{},{verify:'verify'},true)
								.then((resp) => {
									if (resp.result=='ok')
									{
										pd.event.call('0','pd.queue.app',{action:'clear'}).then(() => {
											pd.event.call('0','pd.queue.sort',{sort:null}).then(() => {
												pd.event.call('0','pd.apps.altered',{apps:apps,sort:sort});
												this.hide();
											});
										});
									}
									else pd.alert(pd.constants.common.message.invalid.config.updating[pd.lang]);
								})
								.catch((error) => pd.alert(error.message));
							})(resp.apps,resp.sort);
						});
					};
					this.ok.on('click',this.handler);
					this.cancel.on('click',(e) => {
						pd.event.call('0','pd.queue.app',{action:'clear'}).then(() => {
							pd.event.call('0','pd.queue.sort',{sort:null}).then(() => {
								this.hide();
							});
						});
					});
					/* set configuration */
					this.set().then(() => {
						/* show */
						super.show();
					});
				})
				.catch((error) => pd.alert(error.message));
			}
		},
		dashboard:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999995,false,false);
				/* setup properties */
				this.keep={
					config:{},
					nav:{}
				};
				this.lib={
					activate:(element,panelinfo,addtrash=false,addsetting=false) => {
						var handler=(e) => {
							var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
							pd.event.call(
								'dashboardmanager',
								'pd.drag.start',
								{
									element:element,
									page:{
										x:pointer.pageX,
										y:pointer.pageY
									}
								}
							);
							window.off('touchmove,mousemove',handler);
						};
						/* setup properties */
						element.panelinfo=panelinfo;
						if (addtrash)
						{
							/* modify elements */
							element.append(
								pd.create('button').addclass('pd-icon pd-icon-trash pd-kumaneko-drag-button')
								.on('touchstart,mousedown',(e) => {
									e.stopPropagation();
								})
								.on('click',(e) => {
									pd.confirm(pd.constants.common.message.confirm.delete[pd.lang],() => {
										/* move the guide to top level element */
										this.contents.elm('.pd-kumaneko-drag').insertBefore(this.contents.elm('.pd-kumaneko-drag-guide'),null);
										/* delete */
										element.parentNode.removeChild(element);
										/* remodel */
										this.lib.remodel();
									});
								})
							);
						}
						if (addsetting)
						{
							/* modify elements */
							element.append(
								pd.create('button').addclass('pd-icon pd-icon-setting pd-kumaneko-drag-button')
								.on('touchstart,mousedown',(e) => {
									e.stopPropagation();
								})
								.on('click',(e) => {
									switch (element.panelinfo.type)
									{
										case 'row':
											pd.input(pd.constants.dashboard.prompt.row[pd.lang],(value) => {
												if (value)
												{
													value=value.replace(/ /g,'');
													if (pd.isnumeric(value)) value+='px';
													if (value.match(/^[0-9.]+px$/g))
													{
														element.css({height:value}).panelinfo.styles.height=value;
														this.lib.remodel();
													}
													else pd.alert(pd.constants.dashboard.message.invalid.row[pd.lang]);
												}
												else
												{
													element.css({height:''}).panelinfo.styles.height='';
													this.lib.remodel();
												}
											},'text',element.panelinfo.styles.height);
											break;
										default:
											pd.input(pd.constants.dashboard.prompt.panel[pd.lang],(value) => {
												if (value)
												{
													value=value.replace(/ /g,'');
													if (pd.isnumeric(value)) value+='px';
													if (value.match(/^[0-9.]+(px|%)$/g))
													{
														element.css({width:value}).panelinfo.styles.width=value;
														this.lib.remodel();
													}
													else pd.alert(pd.constants.dashboard.message.invalid.panel[pd.lang]);
												}
												else
												{
													element.css({width:''}).panelinfo.styles.width='';
													this.lib.remodel();
												}
											},'text',element.panelinfo.styles.width);
											break;
									}
								})
							);
						}
						/* event */
						element
						.on('touchstart,mousedown',(e) => {
							if (element.hasAttribute('disabled'))
							{
								e.stopPropagation();
								e.preventDefault();
								return;
							}
							window.on('touchmove,mousemove',handler);
							e.stopPropagation();
							e.preventDefault();
						})
						.on('touchend,mouseup',(e) => {
							window.off('touchmove,mousemove',handler);
						});
						return element;
					},
					create:(panelinfo) => {
						var res=null;
						switch (panelinfo.type)
						{
							case 'row':
								res=pd.create('div').addclass('pd-row pd-flex pd-kumaneko-border-bottom').css({height:panelinfo.styles.height}).attr('field-type',panelinfo.type);
								break;
							default:
								((view) => {
									res=pd.ui.panel.create(view.name).addclass('pd-kumaneko-border-right').css({width:panelinfo.styles.width}).attr('field-type',panelinfo.type);
								})(this.keep.config.apps.user[panelinfo.app].views.filter((item) => item.id==panelinfo.view).first());
								break;
						}
						return this.lib.activate(res,panelinfo,true,true);
					},
					init:() => {
						this.contents.elm('.pd-kumaneko-drag').insertBefore(this.contents.elm('.pd-kumaneko-drag-guide'),null);
						pd.children(this.contents.elm('.pd-kumaneko-drag')).each((element,index) => {
							if (!element.hasclass('pd-kumaneko-drag-guide')) element.parentNode.removeChild(element);
						});
					},
					remodel:() => {
						this.keep.config.dashboard.frames=[];
						for (var key in this.keep.nav) this.keep.nav[key].removeattr('disabled');
						pd.children(this.contents.elm('.pd-kumaneko-drag')).each((element,index) => {
							if (!element.hasclass('pd-kumaneko-drag-guide'))
							{
								switch (element.panelinfo.type)
								{
									case 'row':
										if (element.elm('[field-type=panel]'))
										{
											this.keep.config.dashboard.frames.push({
												styles:{
													height:element.panelinfo.styles.height
												},
												panels:(() => {
													var res=[];
													element.elms('[field-type=panel]').each((element,index) => {
														this.keep.nav[element.panelinfo.app+'_'+element.panelinfo.view].attr('disabled','disabled');
														((panelinfo) => {
															delete panelinfo.type;
															res.push(panelinfo);
														})(pd.extend({},element.panelinfo));
													});
													return res;
												})()
											});
										}
										else element.parentNode.removeChild(element);
										break;
								}
							}
						});
					}
				};
				/* modify elements */
				this.header.css({paddingLeft:'0.25em',textAlign:'left'}).html('Dashboard Management');
				this.container.addclass('pd-kumaneko-main').css({
					height:'calc(100% - 1em)',
					width:'calc(100% - 1em)'
				});
				this.contents.addclass('pd-kumaneko-dashboardmanager').css({
					padding:'0'
				})
				.append(
					((contents) => {
						contents
						.append(
							pd.create('nav').addclass('pd-kumaneko-nav')
							.append(pd.create('div').addclass('pd-kumaneko-nav-main'))
						)
						.append(
							pd.create('div').addclass('pd-kumaneko-block pd-kumaneko-border-left pd-kumaneko-inset-left')
							.append(
								pd.create('div').addclass('pd-container')
								.append(
									((container,guide) => {
										let observer=new MutationObserver(() => {
											if (guide.visible()) container.addclass('pd-dragging');
											else container.removeclass('pd-dragging');
										});
										observer.observe(guide,{attributes:true});
										return container.append(guide);
									})(pd.create('div').addclass('pd-contents pd-kumaneko-drag').attr('field-type','form'),pd.create('div').addclass('pd-hidden pd-kumaneko-drag-guide'))
								)
							)
						);
						/* drag event */
						pd.event.on('dashboardmanager','pd.drag.start',(e) => {
							var keep={
								element:((panelinfo) => {
									var res=null;
									switch (panelinfo.type)
									{
										case '':
											break;
										case 'panel':
											res=(e.element.hasclass('pd-panel'))?e.element:null;
											break;
										default:
											res=e.element;
											break;
									}
									return res;
								})(e.element.panelinfo),
								height:((panelinfo) => {
									var res='';
									switch (panelinfo.type)
									{
										case '':
											break;
										case 'panel':
											res=(e.element.hasclass('pd-panel'))?e.element.parentNode.panelinfo.styles.height:'';
											break;
										default:
											res=panelinfo.styles.height;
											break;
									}
									return res;
								})(e.element.panelinfo),
								panelinfo:pd.extend({},e.element.panelinfo),
								guide:this.contents.elm('.pd-kumaneko-drag-guide')
							};
							var handler={
								move:(e) => {
									var element=document.elementFromPoint(e.pageX,e.pageY);
									if (element)
									{
										if (element!=keep.guide)
											((rect) => {
												var guide={
													nesting:(parent) => {
														var references=pd.children(parent).filter((item) => {
															var res=false;
															var rect=item.getBoundingClientRect();
															if (!item.hasclass('pd-kumaneko-drag-guide'))
															{
																if (pd.children(item).filter((item) => item.visible()).length==0) item.addclass('pd-hidden');
																res=(e.pageY<rect.top+rect.height*0.5);
															}
															return res;
														});
														if (references.length==0) guide.setup(parent,null);
														else guide.setup(parent,references.first());
													},
													setup:(parent,reference) => {
														switch (parent.attr('field-type'))
														{
															case 'form':
																keep.guide.css({height:''});
																break;
															case 'row':
																keep.guide.css({height:parent.innerheight().toString()+'px'});
															break;
														}
														parent.insertBefore(keep.guide.removeclass('pd-hidden'),reference);
													}
												};
												switch (element.attr('field-type'))
												{
													case 'form':
														guide.nesting(element);
														break;
													case 'panel':
														if (keep.panelinfo.type=='panel')
														{
															if (e.pageX<rect.left+rect.width*0.5) guide.setup(element.parentNode,element);
															else guide.setup(element.parentNode,element.nextElementSibling);
														}
														else guide.setup(element.parentNode.parentNode,element.parentNode.nextElementSibling);
														break;
													case 'row':
														if (keep.panelinfo.type=='panel')
														{
															if (element!=keep.guide.parentNode || !keep.guide.visible()) guide.setup(element,null);
														}
														else guide.setup(element.parentNode,element.nextElementSibling);
														break;
													default:
														if (!keep.element) keep.guide.addclass('pd-hidden');
														break;
												}
											})(element.getBoundingClientRect());
									}
									else
									{
										if (!keep.element) keep.guide.addclass('pd-hidden');
									}
								},
								end:(e) => {
									if (keep.guide.visible())
									{
										((row) => {
											if (keep.panelinfo.type=='panel')
												if (keep.guide.parentNode.attr('field-type')=='form')
												{
													keep.guide.parentNode.insertBefore(row,keep.guide.nextElementSibling);
													row.append(keep.guide);
												}
											((element) => {
												if (element) keep.guide.parentNode.insertBefore(element,keep.guide.nextElementSibling);
												keep.guide.addclass('pd-hidden');
												this.lib.remodel();
											})((keep.element)?keep.element.removeclass('pd-hidden'):this.lib.create(keep.panelinfo));
										})(this.lib.create({type:'row',styles:{height:keep.height}}));
									}
									else
									{
										if (keep.element) keep.element.removeclass('pd-hidden');
									}
									window.off('mousemove,touchmove',handler.move);
									window.off('mouseup,touchend',handler.end);
									e.stopPropagation();
									e.preventDefault();
								}
							};
							if (keep.element)
							{
								((rect) => {
									keep.guide.css({height:rect.height.toString()+'px',width:rect.width.toString()+'px'});
									keep.element.addclass('pd-hidden').parentNode.insertBefore(keep.guide.removeclass('pd-hidden'),keep.element.nextElementSibling);
								})(keep.element.getBoundingClientRect());
							}
							else keep.guide.css({height:'',width:''});
							/* event */
							window.on('mousemove,touchmove',handler.move);
							window.on('mouseup,touchend',handler.end);
						});
						return contents;
					})(pd.create('div').addclass('pd-scope pd-kumaneko-block').attr('form-id','form_dashboardmanager'))
				);
				this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					this.lib.remodel();
					resolve({dashboard:this.keep.config.dashboard});
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					((nav) => {
						pd.kumaneko.sort(this.keep.config.apps.user,this.keep.config.apps.sort).each((app,index) => {
							nav.append(
								((res) => {
									res
									.append(
										pd.create('span').addclass('pd-kumaneko-nav-button-item')
										.append(pd.create('button').addclass('pd-icon pd-icon-arrow pd-icon-arrow-down'))
										.append(pd.create('span').addclass('pd-kumaneko-nav-button-item-label').html(app.name))
										.on('click',(e) => {
											if (res.elm('.pd-kumaneko-nav-button-details').visible())
											{
												res.elm('.pd-kumaneko-nav-button-details').hide();
												res.elm('.pd-icon-arrow').removeclass('pd-icon-arrow-up').addclass('pd-icon-arrow-down');
											}
											else
											{
												res.elm('.pd-kumaneko-nav-button-details').show();
												res.elm('.pd-icon-arrow').removeclass('pd-icon-arrow-down').addclass('pd-icon-arrow-up');
											}
										})
									)
									.append(pd.create('div').addclass('pd-kumaneko-nav-button-details').hide());
									app.views.shape((item) => (!['customize','edit'].includes(item.type))?item:PD_THROW).each((view,index) => {
										res.elm('.pd-kumaneko-nav-button-details')
										.append(
											((res) => {
												this.keep.nav[app.id+'_'+view.id]=res;
												return this.lib.activate(res,{type:'panel',app:app.id,view:view.id,styles:{width:'235px'}})
												.append(pd.create('span').addclass('pd-kumaneko-nav-button-details-item-label').html(view.name));
											})(pd.create('span').addclass('pd-kumaneko-nav-button-details-item'))
										);
									});
									return res;
								})(pd.create('div').addclass('pd-kumaneko-nav-button pd-kumaneko-border-bottom'))
							);
						});
						return nav;
					})(this.contents.elm('.pd-kumaneko-nav-main').empty());
					((form) => {
						this.keep.config.dashboard.frames.each((frame,index) => {
							((row) => {
								form.insertBefore(row,null);
								frame.panels.each((panel,index) => {
									((app) => {
										if (app.views.filter((item) => item.id==panel.view).length!=0) row.append(this.lib.create(pd.extend({type:'panel'},panel)));
									})(this.keep.config.apps.user[panel.app]);
								});
							})(this.lib.create({type:'row',styles:{height:frame.styles.height}}));
						});
						this.lib.remodel();
					})(this.contents.elm('.pd-kumaneko-drag'));
					resolve();
				});
			}
			/* show */
			show(){
				pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
				.then((resp) => {
					/* initialize elements */
					this.lib.init();
					/* setup properties */
					this.keep.config=resp.file;
					this.keep.nav={};
					/* modify elements */
					this.contents.elms('input,select,textarea').each((element,index) => {
						if (element.alert) element.alert.hide();
					});
					/* setup handler */
					if (this.handler)
					{
						this.ok.off('click',this.handler);
						this.cancel.off('click');
					}
					this.handler=(e) => {
						this.get().then((resp) => {
							((dashboard) => {
								pd.request(pd.ui.baseuri()+'/config.php','GET',{},{verify:'verify'},true)
								.then((resp) => {
									if (resp.result=='ok')
									{
										pd.event.call('0','pd.dashboard.altered',{dashboard:dashboard});
										this.hide();
									}
									else pd.alert(pd.constants.common.message.invalid.config.updating[pd.lang]);
								})
								.catch((error) => pd.alert(error.message));
							})(resp.dashboard);
						});
					};
					this.ok.on('click',this.handler);
					this.cancel.on('click',(e) => this.hide());
					/* set configuration */
					this.set().then(() => {
						/* show */
						super.show();
					});
				})
				.catch((error) => pd.alert(error.message));
			}
		},
		import:class extends panda_dialog{
			/* constructor */
			constructor(){
				super(999993,false,false);
				/* setup properties */
				this.app={
					id:'importmanager',
					fields:{
						skip:{
							id:'skip',
							type:'radio',
							caption:pd.constants.import.caption.skip[pd.lang],
							required:true,
							nocaption:false,
							options:[
								{option:{value:'yes'}},
								{option:{value:'no'}}
							]
						},
						separator:{
							id:'separator',
							type:'radio',
							caption:pd.constants.import.caption.separator[pd.lang],
							required:true,
							nocaption:false,
							options:[
								{option:{value:'comma'}},
								{option:{value:'tab'}}
							]
						},
						fields:{
							id:'fields',
							type:'table',
							caption:'',
							nocaption:true,
							fields:{
								app:{
									id:'app',
									type:'dropdown',
									caption:pd.constants.import.caption.app[pd.lang],
									required:false,
									nocaption:false,
									options:[]
								},
								csv:{
									id:'csv',
									type:'dropdown',
									caption:pd.constants.import.caption.csv[pd.lang],
									required:false,
									nocaption:false,
									options:[]
								}
							}
						},
					}
				};
				this.keep={
					app:null,
					buffer:null,
					table:null,
					csv:[],
					fields:{}
				};
				this.lib={
					remodel:(skip) => {
						this.keep.table.clearrows();
						this.keep.table.template.elm('[field-id=app]').addclass('pd-readonly').elm('select').empty().assignoption((() => {
							var res=[];
							res.push({
								id:{value:'__id'},
								caption:{value:'Record ID'}
							});
							for (var key in this.keep.fields)
								((fieldinfo) => {
									switch (fieldinfo.type)
									{
										case 'autonumber':
										case 'canvas':
										case 'creator':
										case 'createdtime':
										case 'file':
										case 'id':
										case 'modifier':
										case 'modifiedtime':
										case 'spacer':
										case 'table':
											break;
										default:
											res.push({
												id:{value:fieldinfo.id},
												caption:{value:fieldinfo.caption}
											});
											break;
									}
								})(this.keep.fields[key]);
							return res;
						})(),'caption','id');
						this.keep.table.template.elm('[field-id=csv]').elm('select').empty().assignoption((() => {
							var res=[];
							res.push({
								id:{value:''},
								caption:{value:''}
							});
							this.keep.csv.first().each((cell,index) => {
								res.push({
									id:{value:index},
									caption:{value:(skip=='yes')?cell:'Col '+(index+1).toString()}
								});
							});
							return res;
						})(),'caption','id');
						this.keep.table.addrow();
					}
				};
				/* modify elements */
				this.header.css({paddingLeft:'0.25em',textAlign:'left'}).html('Import Management');
				this.container.addclass('pd-kumaneko-main').css({
					height:'calc(100% - 1em)',
					width:'45em'
				});
				this.contents.addclass('pd-kumaneko-importmanager').css({
					padding:'0'
				})
				.append(
					((contents) => {
						this.keep.table=pd.ui.table.activate(pd.ui.table.create(this.app.fields.fields),this.app);
						contents
						.append(pd.ui.field.activate(((res) => {
							res.elms('[data-name='+this.app.fields.skip.id+']').each((element,index) => {
								element.closest('label').elm('span').html(pd.constants.common.caption.yesno[element.val()][pd.lang]);
							});
							return res;
						})(pd.ui.field.create(this.app.fields.skip)).css({width:'50%'}),this.app))
						.append(pd.ui.field.activate(((res) => {
							res.elms('[data-name='+this.app.fields.separator.id+']').each((element,index) => {
								element.closest('label').elm('span').html(pd.constants.import.caption.separator[element.val()][pd.lang]);
							});
							return res;
						})(pd.ui.field.create(this.app.fields.separator)).css({width:'50%'}),this.app))
						.append(this.keep.table);
						/* event */
						pd.event.on(this.app.id,'pd.change.skip',(e) => {
							this.lib.remodel(e.record.skip.value);
							return e;
						});
						pd.event.on(this.app.id,'pd.change.separator',(e) => {
							this.keep.csv=this.keep.buffer.target.result.parseCSV((e.record.separator.value=='comma')?',':'\t');
							this.lib.remodel(e.record.skip.value);
							return e;
						});
						return contents;
					})(pd.create('div').addclass('pd-scope').attr('form-id','form_'+this.app.id))
				);
				this.contents.elms('input,select,textarea').each((element,index) => element.initialize());
			}
			/* get configuration */
			get(){
				return new Promise((resolve,reject) => {
					var res=pd.record.get(this.contents,this.app);
					if (!res.error)
					{
						((record) => {
							var res={
								error:false,
								records:{
									post:[],
									put:[]
								}
							};
							((skip,rows) => {
								var fields={};
								var build=(index,callback) => {
									var except=(index) => {
										if (!res.error)
											((column) => {
												res.error=true;
												pd.alert(pd.constants.import.message.invalid.file[pd.lang].replace(/\*\*\*/g,column),() => {
													callback();
												});
											})((skip=='yes')?this.keep.csv.first()[index]:'Col '+(parseInt(index)+1).toString());
									};
									var finish=() => {
										index++;
										if (index<this.keep.csv.length) build(index,callback);
										else callback();
									};
									((cells) => {
										var setup=(record) => {
											return new Promise((resolve,reject) => {
												for (var key in this.keep.fields)
													((fieldinfo,value) => {
														switch (fieldinfo.type)
														{
															case 'autonumber':
															case 'canvas':
															case 'creator':
															case 'createdtime':
															case 'file':
															case 'modifier':
															case 'modifiedtime':
															case 'spacer':
															case 'table':
																break;
															case 'checkbox':
																if (value) record[key].value=value.split(':');
																break;
															case 'date':
																if (value)
																{
																	if (!isNaN(Date.parse(value))) record[key].value=value.parseDateTime().format('Y-m-d');
																	else except(fields[key]);
																}
																break;
															case 'datetime':
																if (value)
																{
																	if (!isNaN(Date.parse(value))) record[key].value=value.parseDateTime().format('ISO');
																	else except(fields[key]);
																}
																break;
															case 'department':
															case 'group':
															case 'user':
																if (value)
																{
																	if (pd.isnumeric(value.replace(/:/g,''))) record[key].value=value.split(':');
																	else except(fields[key]);
																}
																break;
															case 'id':
															case 'number':
																if (value)
																{
																	if (pd.isnumeric(value)) record[key].value=value;
																	else except(fields[key]);
																}
																break;
															case 'lookup':
																if (value)
																{
																	if (pd.isnumeric(value)) record[key]={lookup:true,search:'',value:value};
																	else except(fields[key]);
																}
																break;
															case 'time':
																if (value)
																{
																	if (value.match(/[0-9]{2}:[0-9]{2}/g)) record[key].value=value;
																	else except(fields[key]);
																}
																break;
															default:
																if (value) record[key].value=value;
																break;
														}
													})(this.keep.fields[key],(key in fields)?cells[fields[key]]:'');
												((record) => {
													if (record['__id'].value) res.records.put.push(record);
													else res.records.post.push(record);
													resolve();
												})(pd.kumaneko.app.action(this.keep.app,record,'backend'));
											});
										};
										if (index!=0 || skip=='no')
										{
											if (('__id' in fields)?cells[fields['__id']]:false)
											{
												pd.request(pd.ui.baseuri()+'/records.php','GET',{},{app:this.keep.app,id:cells[fields['__id']]},true)
												.then((resp) => {
													if (resp.total!=0) setup(resp.record).then(() => finish());
													else
													{
														cells[fields['__id']]='';
														setup(pd.record.create({fields:this.keep.fields})).then(() => finish());
													}
												})
												.catch((error) => {
													pd.alert(error.message);
													reject({});
												});
											}
											else setup(pd.record.create({fields:this.keep.fields})).then(() => finish());
										}
										else finish();
									})(this.keep.csv[index]);
								};
								rows.each((row,index) => {
									if (row.csv.value) fields[row.app.value]=row.csv.value;
								});
								if (Object.keys(fields)==0)
								{
									res.error=true;
									pd.alert(pd.constants.import.message.notfound.field[pd.lang],() => {
										resolve(res);
									});
								}
								else build(0,() => resolve(res));
							})(record.skip.value,record.fields.value);
						})(res.record);
					}
					else resolve(res);
				});
			}
			/* set configuration */
			set(){
				return new Promise((resolve,reject) => {
					pd.record.set(this.contents,this.app,(() => {
						var res={
							skip:{value:'yes'},
							fields:{value:(() => {
								var res=[];
								return res;
							})()}
						};
						res['fields']={value:((skip) => {
							var res=[];
							this.lib.remodel(skip);
							res.push({
								app:{value:'__id'},
								csv:{value:''}
							});
							for (var key in this.keep.fields)
								((fieldinfo) => {
									switch (fieldinfo.type)
									{
										case 'autonumber':
										case 'canvas':
										case 'creator':
										case 'createdtime':
										case 'file':
										case 'id':
										case 'modifier':
										case 'modifiedtime':
										case 'spacer':
										case 'table':
											break;
										default:
											res.push({
												app:{value:fieldinfo.id},
												csv:{value:''}
											});
											break;
									}
								})(this.keep.fields[key]);
							return res;
						})(res.skip.value)};
						return res;
					})());
					resolve();
				});
			}
			/* show */
			show(app,file){
				var reader=new FileReader();
				reader.onload=((readData) => {
					((csv) => {
						if (csv.length!=0)
						{
							this.keep.app=app;
							this.keep.buffer=readData;
							this.keep.csv=csv;
							pd.request(pd.ui.baseuri()+'/config.php','GET',{},{},true)
							.then((resp) => {
								/* setup properties */
								this.keep.fields=resp.file.apps.user[this.keep.app].fields;
								/* setup handler */
								if (this.handler)
								{
									this.ok.off('click',this.handler);
									this.cancel.off('click');
								}
								this.handler=(e) => {
									pd.confirm(pd.constants.common.message.confirm.submit[pd.lang],() => {
										pd.loadstart();
										this.get().then((resp) => {
											if (!resp.error)
											{
												((modifiedtime,records) => {
													pd.event.call(this.keep.app,'pd.saving.call',{records:records.post.concat(records.put)})
													.then((e) => {
														pd.request(pd.ui.baseuri()+'/records.php','POST',{},{app:this.keep.app,records:records.post})
														.then((resp) => {
															records.post.each((post,index) => {
																post['__id'].value=resp.id-(records.post.length-index-1);
																if ('autonumbers' in resp) post['__autonumber'].value=resp.autonumbers[post['__id'].value.toString()];
															});
															pd.request(pd.ui.baseuri()+'/records.php','PUT',{},{app:this.keep.app,records:records.put})
															.then((resp) => {
																records.put.each((put,index) => {
																	if ('autonumbers' in resp) put['__autonumber'].value=resp.autonumbers[put['__id'].value.toString()];
																});
																pd.event.call(this.keep.app,'pd.import.submit.success',{
																	records:records
																})
																.then((param) => {
																	if (!param.error)
																		pd.event.call(this.keep.app,'pd.preview.call',{modifiedtime:modifiedtime}).then(() => {
																			pd.loadend();
																			this.hide();
																		});
																});
															})
															.catch((error) => pd.alert(error.message));
														})
														.catch((error) => pd.alert(error.message));
													})
													.catch(() => pd.loadend());
												})(new Date().format('ISOSEC'),resp.records);
											}
										});
									});
								};
								this.ok.on('click',this.handler);
								this.cancel.on('click',(e) => this.hide());
								/* set configuration */
								this.set().then(() => {
									/* show */
									super.show();
								});
							})
							.catch((error) => pd.alert(error.message));
						}
						else pd.alert(pd.constants.import.message.invalid.nodata[pd.lang]);
					})(readData.target.result.parseCSV());
				});
				reader.readAsText(file);
			}
		},
		notification:class{
			/* constructor */
			constructor(){
				this.enabled=(() => {
					var res=false;
					if ('serviceWorker' in navigator)
						if ('PushManager' in window)
							if (location.protocol=='https:' || location.hostname=='localhost' || location.hostname=='127.0.0.1') res=true;
					return res;
				})();
				if (this.enabled)
				{
					navigator.serviceWorker.register('./sw.js')
					.then((registration) => {
						navigator.serviceWorker.ready
						.then((registration) => {
							registration.pushManager.getSubscription()
							.then((subscription) => {
								var handler=(subscription) => {
									pd.request(pd.ui.baseuri()+'/notify.php','POST',{},{
										endpoint:subscription.endpoint,
										publicKey:window.btoa(String.fromCharCode.apply(null,new Uint8Array(subscription.getKey('p256dh')))).replace(/\+/g, '-').replace(/\//g, '_'),
										authToken:window.btoa(String.fromCharCode.apply(null,new Uint8Array(subscription.getKey('auth')))).replace(/\+/g, '-').replace(/\//g, '_')
									},true)
									.then((resp) => {})
									.catch((error) => pd.alert(error.message));
								};
								if (!subscription)
								{
									pd.request(pd.ui.baseuri()+'/notify.php','GET',{},{},true)
									.then((resp) => {
										registration.pushManager.subscribe({
											userVisibleOnly:true,
											applicationServerKey:((key) => {
												var datas=window.atob((key+'='.repeat((4-key.length%4)%4)).replace(/\-/g,'+').replace(/_/g,'/'));
												var buffer=new Uint8Array(datas.length);
												datas.length.each((index) => buffer[index]=datas.charCodeAt(index));
												return buffer;
											})(resp.key)
										})
										.then((subscription) => handler(subscription))
										.catch((error) => console.log('Failed to subscribe: ',error));
									})
									.catch((error) => pd.alert(error.message));
								}
								else handler(subscription);
							});
						});
					})
					.catch((error) => console.log('Failed to register: ',error));
					/* event */
					navigator.serviceWorker.addEventListener('message',(e) => {
						pd.event.call('0','pd.queue.notify.pushed',{data:e.data});
					});
				}
			}
			/* push */
			push(data){
				if (this.enabled)
					pd.request(pd.ui.baseuri()+'/notify.php','PUT',{},{payload:data,subject:(location.protocol+'//'+location.host+location.pathname).replace(/\/[^\/]*$/g,'')+'/'},true)
					.then((resp) => {})
					.catch((error) => pd.alert(error.message));
			}
		}
	},
	tab:class{
		/* constructor */
		constructor(caption){
			/* setup properties */
			this.active=false;
			this.container=pd.create('div').addclass('pd-kumaneko-tab-item')
			.append(
				(() => {
					this.canvas=pd.create('canvas').css({
						display:'block',
						left:'-1px',
						position:'absolute',
						top:'0'
					});
					return this.canvas;
				})()
			)
			.append(
				(() => {
					this.label=pd.create('span').addclass('pd-kumaneko-tab-item-label').html(caption);
					return this.label;
				})()
			)
			.append(
				(() => {
					this.close=pd.create('button').addclass('pd-icon pd-close');
					return pd.create('span').addclass('pd-kumaneko-tab-item-close').append(this.close);
				})()
			);
			this.context=this.canvas.getContext('2d');
			/* resize event */
			window.on('resize',(e) => {
				this.redraw();
			});
		}
		/* activate */
		activate(){
			this.active=true;
			return this.redraw();
		}
		/* deactivate */
		deactivate(){
			this.active=false;
			return this.redraw();
		}
		/* draw */
		redraw(){
			var rect={
				label:this.label.getBoundingClientRect(),
				close:this.close.closest('span').getBoundingClientRect()
			};
			var draw=(ctx,points,fill) => {
				ctx.beginPath();
				ctx.moveTo(points[0].x,points[0].y);
				ctx.lineTo(points[1].x,points[1].y);
				ctx.lineTo(points[2].x,points[2].y);
				ctx.lineTo(points[3].x,points[3].y);
				if (fill)
				{
					ctx.fillStyle=this.container.css('--'+pd.theme+'-main-bg-color');
					ctx.fill();
				}
				else ctx.stroke();
			};
			this.canvas.width=rect.label.width+rect.close.width+2;
			this.canvas.height=rect.label.height+6;
			this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
			if (this.active)
			{
				draw(
					this.context,
					[
						{x:0,y:this.canvas.height},
						{x:this.canvas.height/2,y:0},
						{x:this.canvas.width-this.canvas.height/2,y:0},
						{x:this.canvas.width,y:this.canvas.height}
					],
					true
				);
				this.context.lineWidth=2;
				this.context.strokeStyle=this.container.css('--'+pd.theme+'-emphasis-color');
				this.context.beginPath();
				this.context.moveTo(this.canvas.height/2,this.context.lineWidth/2);
				this.context.lineTo(this.canvas.width-this.canvas.height/2,this.context.lineWidth/2);
				this.context.stroke();
			}
			this.context.lineWidth=1;
			this.context.strokeStyle=this.container.css('--'+pd.theme+'-tab-highlight-color');
			draw(
				this.context,
				[
					{x:this.context.lineWidth/2+2,y:this.canvas.height-2},
					{x:this.canvas.height/2+1,y:this.context.lineWidth/2+1},
					{x:this.canvas.width-this.canvas.height/2-1,y:this.context.lineWidth/2+1},
					{x:this.canvas.width-this.context.lineWidth/2-2,y:this.canvas.height-2}
				]
			);
			this.context.strokeStyle=this.container.css('--'+pd.theme+'-tab-shadow-color');
			draw(
				this.context,
				[
					{x:this.context.lineWidth/2+1,y:this.canvas.height-2},
					{x:this.canvas.height/2,y:this.context.lineWidth/2},
					{x:this.canvas.width-this.canvas.height/2,y:this.context.lineWidth/2},
					{x:this.canvas.width-this.context.lineWidth/2-1,y:this.canvas.height-2}
				]
			);
			this.label.css({color:this.active?this.container.css('--'+pd.theme+'-main-fr-color'):this.container.css('--'+pd.theme+'-fr-color')});
			return this;
		}
	}
}
pd.kumaneko=new panda_kumaneko();
/*
Message definition by language
*/
pd.constants=pd.extend({
	common:{
		caption:{
			button:{
				about:{
					en:'About kumaneko',
					ja:'kumanekoについて'
				},
				export:{
					en:'Export to File',
					ja:'ファイルに書き出す'
				},
				import:{
					en:'Import from File',
					ja:'ファイルから読み込む'
				},
				management:{
					apps:{
						en:'App Mgmt',
						ja:'アプリ管理'
					},
					dashboard:{
						en:'Dashboard Mgmt',
						ja:'ダッシュボード管理'
					},
					departments:{
						en:'Department Mgmt',
						ja:'組織管理'
					},
					groups:{
						en:'Group Mgmt',
						ja:'グループ管理'
					},
					storage:{
						en:'Storage Mgmt',
						ja:'ストレージ管理'
					},
					users:{
						en:'User Mgmt',
						ja:'ユーザー管理'
					}
				},
				update:{
					en:'Update kumaneko',
					ja:'システムアップデート'
				}
			},
			function:{
				count:{
					en:'Count',
					ja:'件数'
				},
				sum:{
					en:'Sum',
					ja:'合計'
				},
				average:{
					en:'Average',
					ja:'平均'
				},
				maximum:{
					en:'Maximum',
					ja:'最大'
				},
				minimum:{
					en:'Minimum',
					ja:'最小'
				},
				previous:{
					count:{
						en:'Count on PP',
						ja:'前期件数'
					},
					sum:{
						en:'Sum on PP',
						ja:'前期合計'
					},
					average:{
						en:'Average on PP',
						ja:'前期平均'
					},
					maximum:{
						en:'Maximum on PP',
						ja:'前期最大'
					},
					minimum:{
						en:'Minimum on PP',
						ja:'前期最小'
					}
				}
			},
			grouping:{
				date:{
					day:{
						en:'by the day',
						ja:'日次'
					},
					hour:{
						en:'by the hour',
						ja:'時次'
					},
					month:{
						en:'by the month',
						ja:'月次'
					},
					year:{
						en:'by the year',
						ja:'年次'
					}
				}
			},
			tab:{
				dashboard:{
					en:'dashboard',
					ja:'ダッシュボード'
				}
			},
			yesno:{
				yes:{
					en:'yes',
					ja:'はい'
				},
				no:{
					en:'no',
					ja:'いいえ'
				}
			}
		},
		message:{
			clipboard:{
				en:'Copied it to the clipboard',
				ja:'クリップボードにコピーしました'
			},
			confirm:{
				changed:{
					en:'Your changes have not been saved.<br>Can I continue?',
					ja:'変更が保存されていません。<br>このまま続行しますか？'
				},
				cleanup:{
					en:'Free up storage space by deleting attachments you no longer need',
					ja:'不要となった添付ファイルを削除して、ストレージの空き容量を増やします'
				},
				copy:{
					en:'Are you sure you want to copy?',
					ja:'コピーしてもよろしいですか？'
				},
				forced:{
					en:'Another user has changed the settings of kumaneko.<br>Would you like to reboot now?',
					ja:'他のユーザーがkumanekoの設定を変更しました。<br>今すぐ再起動しますか？'
				},
				reboot:{
					en:'Reboot the kumaneko',
					ja:'kumanekoを再起動します'
				},
				submit:{
					en:'Are you sure on submit?',
					ja:'送信してもよろしいですか？'
				},
				update:{
					en:'Start system update',
					ja:'システムのアップデートを開始します'
				}
			},
			finished:{
				cleanup:{
					en:'Storage cleanup is complete',
					ja:'ストレージのクリーンアップが完了しました'
				},
				submit:{
					en:'Complete!',
					ja:'送信完了'
				}
			},
			invalid:{
				auth:{
					en:'Please check your account or password',
					ja:'アカウントまたはパスワードを確認して下さい'
				},
				cleanup:{
					processing:{
						en:'Another user is processing',
						ja:'他のユーザーが処理中です'
					}
				},
				config:{
					corrupted:{
						en:'The configuration file is corrupted',
						ja:'構成ファイルが破損しています'
					},
					updating:{
						en:'Another user is updating',
						ja:'他のユーザーが更新中です'
					}
				},
				memory:{
					en:'memory_limit must be at least %value%',
					ja:'memory_limitを%value%以上にする必要があります'
				},
				submit:{
					en:'No data to submit was found',
					ja:'編集中のデータがありません'
				}
			}
		},
		prompt:{
			autofill:{
				en:'Auto filled',
				ja:'自動入力'
			},
			update:{
				en:'To update to the new version %version% of kumaneko, click to [Update kumaneko]',
				ja:'システムアップデートをクリックして新しいバージョン%version%にアップデートして下さい'
			}
		}
	},
	action:{
		caption:{
			button:{
				get:{
					en:'Getting',
					ja:'取得'
				}
			},
			caption:{
				en:'Button Text',
				ja:'ボタンラベル'
			},
			del:{
				en:'Delete Table Rows',
				ja:'テーブル行削除'
			},
			disabled:{
				en:'Disable Fields',
				ja:'編集不可',
				record:{
					en:'Make all fields uneditable',
					ja:'全てのフィールドを編集不可にする',
				}
			},
			fill:{
				en:'Filling Table Rows',
				ja:'テーブル行追加'
			},
			filter:{
				en:'Filters to perform',
				ja:'実行条件'
			},
			formula:{
				en:'Formula',
				ja:'関数&nbsp;/&nbsp;計算式'
			},
			hide:{
				en:'Hide Fields',
				ja:'非表示'
			},
			mail:{
				en:'Send EMail',
				ja:'メール送信',
				attachment:{
					en:'Attachment',
					ja:'添付ファイルフィールド'
				},
				bcc:{
					en:'BCC EMail Addresss',
					ja:'BCCメールアドレス'
				},
				body:{
					en:'Body',
					ja:'本文'
				},
				cc:{
					en:'CC EMail Addresss',
					ja:'CCメールアドレス'
				},
				from:{
					en:'Sender EMail Address',
					ja:'送信元メールアドレス'
				},
				subject:{
					en:'Subject',
					ja:'件名'
				},
				to:{
					en:'Recipient EMail Address',
					ja:'送信先メールアドレスフィールド'
				}
			},
			message:{
				en:'Confirm Message',
				ja:'確認メッセージ'
			},
			name:{
				en:'Action Name',
				ja:'アクション名'
			},
			option:{
				en:'Switch Options',
				ja:'選択項目の表示制限'
			},
			report:{
				en:'Report',
				ja:'レポート',
				orientation:{
					en:'Orientation',
					ja:'用紙の向き',
					portrait:{
						en:'portrait',
						ja:'縦'
					},
					landscape:{
						en:'landscape',
						ja:'横'
					}
				},
				saveas:{
					en:'Report File Name Field',
					ja:'レポート名フィールド'
				},
				size:{
					en:'Paper Size',
					ja:'用紙サイズ',
					'0':{
						en:'letter',
						ja:'レター'
					},
					'1':{
						en:'tabloid',
						ja:'タブロイド'
					},
					'2':{
						en:'legal',
						ja:'リーガル'
					},
					'6':{
						en:'A3',
						ja:'A3'
					},
					'7':{
						en:'A4',
						ja:'A4'
					},
					'8':{
						en:'A5',
						ja:'A5'
					},
					'9':{
						en:'B4',
						ja:'B4'
					},
					'10':{
						en:'B5',
						ja:'B5'
					},
				},
				spreadsheet:{
					en:'Google Spreadsheet ID',
					ja:'Google スプレッドシートID'
				},
				store:{
					en:'Report File Stored Field',
					ja:'レポート保存フィールド'
				},
				template:{
					en:'Template Sheets',
					ja:'テンプレートシート'
				}
			},
			style:{
				en:'Color Scheme of Fields',
				ja:'フィールドカラー'
			},
			suspend:{
				en:'Abort Save',
				ja:'保存の中断',
				message:{
					en:'Message',
					ja:'メッセージ',
				},
				continue:{
					en:'Make it possible to decide whether to continue processing',
					ja:'処理を続行するかどうか判断出来るようにする',
				}
			},
			transfer:{
				en:'Transfer to another app',
				ja:'レコード転送',
				criteria:{
					en:'Fetch Criteria',
					ja:'転送するレコードの関連付け'
				},
				destination:{
					en:'Destination',
					ja:'転送先アプリのフィールド'
				},
				mapping:{
					en:'Field Mappings',
					ja:'転送するフィールド'
				},
				pattern:{
					insert:{
						en:'Insert only',
						ja:'コピーのみ'
					},
					update:{
						en:'Update only',
						ja:'更新のみ'
					},
					upsert:{
						en:'Upsert',
						ja:'更新出来なければコピー'
					}
				},
				source:{
					en:'Source',
					ja:'このアプリのフィールド'
				}
			},
			user:{
				en:'You can limit the users who can perform this action.',
				ja:'アクション実行可能ユーザーを制限したい場合は、それらのユーザーを指定して下さい'
			}
		},
		message:{
			invalid:{
				caption:{
					en:'Please enter the button text',
					ja:'ボタンラベルを入力して下さい'
				},
				formula:{
					en:'Contains characters that cannot be used in the formula',
					ja:'計算式に使用出来ない文字が含まれています'
				},
				message:{
					en:'Please enter the confirm message',
					ja:'確認メッセージを入力して下さい'
				},
				mail:{
					body:{
						en:'Please enter the email body',
						ja:'本文を入力して下さい'
					},
					from:{
						en:'Please specify the sender email address',
						ja:'送信元メールアドレスを指定して下さい'
					},
					subject:{
						en:'Please enter the email subject',
						ja:'件名を入力して下さい'
					},
					unmatch:{
						intable:{
							en:'You must specify the attachment field in the same table when you specify the recipient email address field in a table',
							ja:'送信先メールアドレスフィールドがテーブル内フィールドである場合は、添付ファイルフィールドも同じテーブル内フィールドである必要があります'
						},
						outtable:{
							en:'You must specify the out of table attachment field when you specify the out of table recipient email address field',
							ja:'送信先メールアドレスフィールドがテーブル外フィールドである場合は、添付ファイルフィールドもテーブル外フィールドである必要があります'
						}
					}
				},
				name:{
					en:'Please enter the action name',
					ja:'アクション名を入力して下さい'
				},
				option:{
					en:'Please specify one or more display options',
					ja:'表示する選択項目を指定して下さい'
				},
				report:{
					orientation:{
						en:'Please specify orientation',
						ja:'用紙の向きを指定して下さい'
					},
					saveas:{
						en:'Please specify the report file name field',
						ja:'レポート名フィールドを指定して下さい'
					},
					size:{
						en:'Please specify paper size',
						ja:'用紙サイズを指定して下さい'
					},
					template:{
						en:'Please specify one or more template',
						ja:'テンプレートシートを指定して下さい'
					}
				},
				scan:{
					en:'Does not meet the conditions to perform this action',
					ja:'このアクションを実行するための条件を満たしていません'
				},
				transfer:{
					criteria:{
						en:'Please specify one or more criteria',
						ja:'転送するレコードの関連付けを指定して下さい'
					},
					diversion:{
						en:'Field in the table which the field specified for dividing a record belongs cannot be specified for linkage between tables',
						ja:'レコードの分割転送を行う場合は、分割転送するフィールドが属するテーブル内のフィールドをテーブル同士の転送に指定することは出来ません'
					},
					dividing:{
						en:'You must specify the fields in the same table when dividing a record based on a table field',
						ja:'レコードの分割転送を行う場合は、分割転送するフィールドが同じテーブル内に属する必要があります'
					},
					mapping:{
						en:'Please specify one or more mappings',
						ja:'転送するフィールドを指定して下さい'
					},
					multiple:{
						en:'You cannot specify a multiple tables to the source',
						ja:'転送するレコードの関連付けに異なるテーブル内のフィールドを指定することは出来ません'
					},
					unmatch:{
						en:'You must specify the same in criteria when there is a field specified for dividing a record in mappings',
						ja:'レコードの分割転送を行う場合は、転送するレコードの関連付けにも分割転送に合致した関連付けを指定する必要があります'
					},
					various:{
						en:'You cannot specify the field in the same table of the destination from multiple tables in the source',
						ja:'異なるテーブル内のフィールドを組み合わせて、同じテーブルに転送することは出来ません'
					}
				}
			},
			fail:{
				report:{
					en:'Failed to create Report',
					ja:'レポート作成に失敗しました'
				}
			},
			notfound:{
				email:{
					en:'No recipient email address field was found',
					ja:'送信先メールアドレスフィールドが見つかりませんでした'
				},
				report:{
					en:'No report file name field was found',
					ja:'レポート名フィールドが見つかりませんでした'
				},
				transfer:{
					field:{
						en:'No field to transfer was found',
						ja:'レコード転送に指定したフィールドが見つかりませんでした'
					},
					record:{
						en:'No data to transfer was found',
						ja:'転送可能なレコードを作成出来ませんでした'
					}
				}
			}
		},
		prompt:{
			caption:{
				en:'Enter the text to be displayed on the button',
				ja:'ボタンに表示するテキストを入力'
			},
			mail:{
				bcc:{
					en:'If you enter multiple email addresses, separate them with commas',
					ja:'複数のメールアドレスはカンマ区切りで入力'
				},
				cc:{
					en:'If you enter multiple email addresses, separate them with commas',
					ja:'複数のメールアドレスはカンマ区切りで入力'
				}
			},
			message:{
				en:'Enter the message to be displayed in the confirmation dialog',
				ja:'アクション実行前の確認ダイアログに表示するメッセージを入力'
			},
			name:{
				en:'Enter the action name',
				ja:'アクション名を入力'
			},
			rows:{
				range:{
					en:'Enter the lower limit number of rows or formula',
					ja:'下限行数または計算式を入力'
				}
			},
			style:{
				backcolor:{
					en:'BackColor',
					ja:'背景色'
				},
				forecolor:{
					en:'ForeColor',
					ja:'前景色'
				}
			},
			suspend:{
				message:{
					en:'Enter the message to be displayed in the dialog',
					ja:'ダイアログに表示するメッセージを入力'
				}
			},
			transfer:{
				app:{
					en:'Target app',
					ja:'転送先アプリ'
				}
			}
		}
	},
	app:{
		caption:{
			action:{
				abbreviation:{
					button:{
						en:'button',
						ja:'ボタン'
					},
					saving:{
						en:'saving',
						ja:'保存前'
					},
					value:{
						en:'value',
						ja:'値変更'
					}
				},
				name:{
					button:{
						en:'Button Action',
						ja:'ボタンアクション'
					},
					saving:{
						en:'Record Saving Action',
						ja:'保存前アクション'
					},
					value:{
						en:'Value Change Action',
						ja:'値変更アクション'
					}
				},
				title:{
					button:{
						en:'Action by Button click',
						ja:'ボタントリガー'
					},
					saving:{
						en:'Action by Record saving',
						ja:'保存トリガー'
					},
					value:{
						en:'Action by Value change',
						ja:'値変更トリガー'
					}
				}
			},
			button:{
				add:{
					action:{
						en:'Add new action',
						ja:'追加'
					},
					deduplication:{
						en:'Add new deduplication',
						ja:'追加'
					},
					injector:{
						en:'Add new injector',
						ja:'追加'
					},
					linkage:{
						en:'Add new linkage view',
						ja:'追加'
					},
					view:{
						en:'Add new view',
						ja:'追加'
					}
				},
				delete:{
					en:'Delete this app',
					ja:'アプリを削除'
				},
				discard:{
					en:'Discard Changes',
					ja:'変更を中止'
				},
				truncate:{
					en:'Delete all records',
					ja:'全レコードを削除'
				},
				update:{
					en:'Update App',
					ja:'アプリを更新'
				}
			},
			customize:{
				en:'Upload Javascript files for customize.',
				ja:'カスタマイズ用のJavascriptファイルをアップロードして下さい。'
			},
			deduplication:{
				en:'Deduplication',
				ja:'重複制御'
			},
			delete:{
				en:'You cannot cancel the deletion.<br>By deleting the app, all data in the app also becomes unavailable.',
				ja:'削除をキャンセルすることは出来ません。<br>アプリを削除すると、アプリ内のすべてのデータも利用出来なくなります。'
			},
			injector:{
				en:'Injector',
				ja:'インジェクター'
			},
			linkage:{
				en:'Linkage view',
				ja:'リンクビュー'
			},
			permissions:{
				admin:{
					en:'Administrative users<br>&nbsp;You can specify the users who can manage this app other than creator.',
					ja:'管理ユーザー<br>&nbsp;作成者以外にこのアプリの設定を変更可能としたいユーザーがいれば、そのユーザーを指定して下さい。'
				},
				denied:{
					en:'Denied users<br>&nbsp;You can specify the users who can\'t use this app.',
					ja:'拒否ユーザー<br>&nbsp;このアプリの使用を禁止としたいユーザーがいれば、そのユーザーを指定して下さい。'
				},
				owner:{
					en:'Create by',
					ja:'作成者'
				}
			},
			tab:{
				form:{
					en:'form',
					ja:'フォーム'
				},
				views:{
					en:'views',
					ja:'ビュー'
				},
				linkages:{
					en:'linkage views',
					ja:'リンクビュー'
				},
				permissions:{
					en:'permissions',
					ja:'アクセス権限'
				},
				customize:{
					en:'customize',
					ja:'カスタマイズ'
				},
				actions:{
					en:'actions',
					ja:'アクション'
				},
				injectors:{
					en:'injectors',
					ja:'インジェクター'
				},
				deduplications:{
					en:'deduplication',
					ja:'重複制御'
				},
				deletion:{
					en:'deletion',
					ja:'削除'
				}
			},
			truncate:{
				en:'Bulk deletion of records',
				ja:'レコードの一括削除'
			},
			view:{
				abbreviation:{
					edit:{
						en:'edit',
						ja:'編集一覧'
					},
					list:{
						en:'list',
						ja:'一覧'
					},
					calendar:{
						en:'calendar',
						ja:'カレンダー'
					},
					crosstab:{
						en:'crosstab',
						ja:'クロス集計'
					},
					gantt:{
						en:'gantt',
						ja:'ガント'
					},
					timeseries:{
						en:'timeseries',
						ja:'時系列集計'
					},
					kanban:{
						en:'kanban',
						ja:'カンバン'
					},
					map:{
						en:'map',
						ja:'地図'
					},
					customize:{
						en:'customize',
						ja:'カスタム'
					}
				},
				name:{
					list:{
						en:'List view',
						ja:'一覧'
					},
					calendar:{
						en:'Calendar view',
						ja:'カレンダー'
					},
					crosstab:{
						en:'Crosstab view',
						ja:'クロス集計'
					},
					gantt:{
						en:'Gantt view',
						ja:'ガントチャート'
					},
					timeseries:{
						en:'Time series calculation view',
						ja:'時系列集計'
					},
					kanban:{
						en:'Kanban view',
						ja:'カンバン'
					},
					map:{
						en:'Map view',
						ja:'地図'
					},
					customize:{
						en:'Customize view',
						ja:'カスタマイズ'
					}
				},
				title:{
					list:{
						en:'List view',
						ja:'一覧形式'
					},
					calendar:{
						en:'Calendar view',
						ja:'カレンダー形式'
					},
					crosstab:{
						en:'Crosstab view',
						ja:'クロス集計形式'
					},
					gantt:{
						en:'Gantt view',
						ja:'ガントチャート形式'
					},
					timeseries:{
						en:'Time series calculation view',
						ja:'時系列集計形式'
					},
					kanban:{
						en:'Kanban view',
						ja:'カンバン形式'
					},
					map:{
						en:'Map view',
						ja:'地図形式'
					},
					customize:{
						en:'Customize view',
						ja:'カスタマイズ形式'
					}
				}
			}
		},
		message:{
			invalid:{
				action:{
					en:'There is a defect in some actions',
					ja:'設定に不備があるアクションがあります',
					delete:{
						en:'The action could not be deleted because a referencing injector was found',
						ja:'参照しているインジェクターが見つかったため、アクションを削除出来ませんでした'
					}
				},
				dashboard:{
					view:{
						en:'This view is using in the dashboard',
						ja:'このビューはダッシュボードで使用されています'
					}
				},
				deduplication:{
					en:'There is a defect in some deduplications',
					ja:'設定に不備がある重複制御があります'
				},
				delete:{
					en:'This app is referenced in other apps or dashboard<br>Please delete after changing the settings of the following apps or dashboard',
					ja:'このアプリは他のアプリやダッシュボードで参照されています<br>以下のアプリまたはダッシュボードの設定を変更した上で、削除を行って下さい'
				},
				field:{
					delete:{
						en:'The field could not be deleted because a referencing app or field was found',
						ja:'参照しているアプリまたはフィールドが見つかったため、フィールドを削除出来ませんでした'
					},
					missing:{
						en:'Necessary settings are missing in some items',
						ja:'必要な設定が不足しているフィールドがあります'
					},
					used:{
						en:'an action(s) that transfer to this app\'s unedittable field was found',
						ja:'このアプリの編集不可能なフィールドに対して、コピーまたは更新の設定をしているアクションがあります'
					}
				},
				injector:{
					en:'There is a defect in some injectors',
					ja:'設定に不備があるインジェクターがあります'
				},
				linkage:{
					en:'There is a defect in some linkages',
					ja:'設定に不備があるリンクビューがあります'
				},
				name:{
					en:'Please enter the application name',
					ja:'アプリ名を入力して下さい'
				},
				view:{
					en:'There is a defect in some views',
					ja:'設定に不備があるビューがあります'
				}
			}
		},
		prompt:{
			name:{
				en:'Enter the application name',
				ja:'アプリ名を入力'
			},
			spacer:{
				en:'Write text or HTML tags',
				ja:'テキストまたはHTMLタグを入力'
			}
		}
	},
	auth:{
		message:{
			invalid:{
				account:{
					en:'Please enter account',
					ja:'アカウントを入力して下さい'
				},
				pwd:{
					en:'Please enter password',
					ja:'パスワードを入力して下さい'
				}
			}
		},
		prompt:{
			account:{
				en:'account',
				ja:'アカウント'
			},
			pwd:{
				en:'password',
				ja:'パスワード'
			}
		}
	},
	dashboard:{
		message:{
			invalid:{
				panel:{
					en:'You can only enter numbers and the trailing [px] or [%]',
					ja:'入力できるのは、数字と末尾の[px]または[％]のみです'
				},
				row:{
					en:'You can only enter numbers and the trailing [px]',
					ja:'入力できるのは数字と末尾の[px]のみです'
				}
			}
		},
		prompt:{
			panel:{
				en:'Please enter the width of the panel',
				ja:'パネルの幅を入力して下さい'
			},
			row:{
				en:'Please enter the height of the panel row',
				ja:'パネル行の高さを入力して下さい'
			}
		}
	},
	deduplication:{
		caption:{
			criteria:{
				en:'Fetch Criteria',
				ja:'比較条件'
			},
			external:{
				en:'This App',
				ja:'アプリ内のフィールド'
			},
			internal:{
				en:'This Record',
				ja:'レコード内のフィールド'
			},
			message:{
				en:'Error Message',
				ja:'エラーメッセージ'
			},
			name:{
				en:'Deduplication Name',
				ja:'重複制御名'
			}
		},
		message:{
			invalid:{
				criteria:{
					en:'Please specify one or more criteria',
					ja:'リンクするレコードの関連付けを指定して下さい'
				},
				message:{
					en:'Please enter the error message',
					ja:'エラーメッセージを入力して下さい'
				},
				name:{
					en:'Please enter the deduplication name',
					ja:'重複制御名を入力して下さい'
				}
			}
		},
		prompt:{
			message:{
				en:'Enter the message to be displayed when a record that meets the specified conditions is registered.',
				ja:'指定した条件に該当するレコードが登録された時に表示するメッセージを入力'
			},
			name:{
				en:'Enter the deduplication name',
				ja:'重複制御名を入力'
			}
		}
	},
	field:{
		caption:{
			id:{
				en:'ID',
				ja:'ID'
			},
			address:{
				lat:{
					en:'Latitude Field',
					ja:'緯度フィールド'
				},
				lng:{
					en:'Longitude Field',
					ja:'経度フィールド'
				}
			},
			button:{
				lookup:{
					table:{
						en:'Add table mapping',
						ja:'コピーするテーブルを追加'
					}
				}
			},
			caption:{
				en:'Name',
				ja:'フィールド名'
			},
			contents:{
				en:'Contents',
				ja:'表示内容'
			},
			demiliter:{
				en:'Use thousands separators',
				ja:'桁区切りを表示する'
			},
			decimals:{
				en:'Number of Decimal Places to Display',
				ja:'小数点以下の表示桁数'
			},
			fixed:{
				en:'Fixed number of digits in serial number',
				ja:'連番の桁数'
			},
			format:{
				en:'Input Format',
				ja:'入力形式',
				alphabet:{
					en:'alphabet',
					ja:'英字'
				},
				alphanum:{
					en:'alphanum',
					ja:'英数字'
				},
				mail:{
					en:'mail',
					ja:'メールアドレス'
				},
				password:{
					en:'password',
					ja:'パスワード'
				},
				tel:{
					en:'tel',
					ja:'電話番号'
				},
				text:{
					en:'text',
					ja:'フリー'
				},
				url:{
					en:'url',
					ja:'URL'
				}
			},
			group:{
				en:'Fields for grouping',
				ja:'グループ化のフィールド'
			},
			lines:{
				en:'Visible line count',
				ja:'可視行数'
			},
			lookup:{
				app:{
					en:'Datasource App',
					ja:'参照元アプリ'
				},
				criteria:{
					en:'Fetch Criteria',
					ja:'参照するレコードの関連付け'
				},
				external:{
					en:'Datasource App',
					ja:'参照元アプリのフィールド'
				},
				filter:{
					en:'Filter Setting',
					ja:'参照するレコードの絞り込み条件'
				},
				ignore:{
					en:'Ignore if the fields in this app are empty',
					ja:'このアプリの関連付けフィールドが空である場合は、その関連付けを無視する'
				},
				internal:{
					en:'This App',
					ja:'このアプリのフィールド'
				},
				mapping:{
					en:'Field Mappings',
					ja:'コピーするフィールド'
				},
				picker:{
					en:'Fields Shown in Lookup Picker',
					ja:'参照するレコードの選択時に表示するフィールド'
				},
				search:{
					en:'Key Field',
					ja:'参照元フィールド'
				},
				table:{
					en:'Table Mappings',
					ja:'コピーするテーブル',
					label:{
						en:'Copy from "%external%" to "%internal%"',
						ja:'"%external%" から "%internal%" へコピー'
					},
					builder:{
						external:{
							en:'Datasource App\'s Table',
							ja:'参照元アプリのテーブル'
						},
						fields:{
							en:'Field Mappings',
							ja:'コピーするフィールド'
						},
						internal:{
							en:'This App\'s Table',
							ja:'このアプリのテーブル'
						}
					}
				}
			},
			multiuse:{
				en:'Also use in views',
				ja:'一覧画面でも使用する'
			},
			nocaption:{
				en:'Hide field name',
				ja:'フィールド名を表示しない'
			},
			option:{
				en:'Options',
				ja:'選択項目'
			},
			placeholder:{
				en:'Placeholder',
				ja:'入力ヒント'
			},
			postalcode:{
				address:{
					en:'Formatted Address Field',
					ja:'住所フィールド'
				},
				city:{
					en:'City Code Field',
					ja:'市区町村コードフィールド'
				},
				cityname:{
					en:'City Field',
					ja:'市区町村名フィールド'
				},
				prefecture:{
					en:'Prefecture Code Field',
					ja:'都道府県コードフィールド'
				},
				prefecturename:{
					en:'Prefecture Field',
					ja:'都道府県名フィールド'
				},
				streetname:{
					en:'Street Field',
					ja:'町名フィールド'
				}
			},
			required:{
				en:'Required field',
				ja:'必須項目にする'
			},
			unit:{
				en:'Measurement Unit',
				ja:'単位記号'
			},
			unitposition:{
				en:'Position of Measurement Unit',
				ja:'単位記号の表示位置',
				prefix:{
					en:'Prefix',
					ja:'接頭'
				},
				suffix:{
					en:'Suffix',
					ja:'接尾'
				}
			},
			width:{
				en:'Width',
				ja:'フィールド幅'
			}
		},
		message:{
			invalid:{
				decimals:{
					en:'Number of decimal places to display must be between 0 and 100',
					ja:'小数点以下の表示桁数は0以上100以下にする必要があります'
				},
				lookup:{
					app:{
						en:'Please specify an app from [Datasource App] dropdown',
						ja:'参照元アプリを指定して下さい'
					},
					table:{
						builder:{
							external:{
								en:'Please specify a datasource app\'s table',
								ja:'参照元アプリのテーブルを指定して下さい'
							},
							fields:{
								en:'Please specify one or more field mappings',
								ja:'コピーするフィールドを指定して下さい'
							},
							internal:{
								en:'Please specify a this app\'s table',
								ja:'このアプリのテーブルを指定して下さい'
							}
						}
					}
				},
				option:{
					en:'Please enter one or more options',
					ja:'選択項目を入力して下さい'
				},
				textarea:{
					en:'Visible line count must be at least 2 lines',
					ja:'可視行数は2行以上にする必要があります'
				}
			}
		}
	},
	import:{
		caption:{
			app:{
				en:'Field in App',
				ja:'アプリのフィールド'
			},
			csv:{
				en:'Column in File',
				ja:'ファイルの列'
			},
			separator:{
				en:'Delimiter',
				ja:'区切り文字',
				comma:{
					en:'Comma',
					ja:'カンマ区切り'
				},
				tab:{
					en:'Tab',
					ja:'タブ区切り'
				}
			},
			skip:{
				en:'Use First Row as Headers',
				ja:'最初の行をヘッダーとして使用する'
			}
		},
		message:{
			invalid:{
				file:{
					en:'The format of field "***" of the file is invalid',
					ja:'ファイルのフィールド「***」の値を確認して下さい'
				},
				nodata:{
					en:'Failed to convert CSV data',
					ja:'CSVデータの変換に失敗しました'
				}
			},
			notfound:{
				field:{
					en:'Column for mapping required',
					ja:'読み込むフィールドが指定されていません'
				}
			}
		}
	},
	injector:{
		caption:{
			button:{
				submit:{
					en:'Submit',
					ja:'送信'
				}
			},
			colors:{
				body:{
					en:'Background Color',
					ja:'ページ背景色'
				},
				button:{
					en:'Button Color',
					ja:'ボタン背景色'
				}
			},
			directory:{
				en:'Directory Name',
				ja:'ディレクトリ名'
			},
			description:{
				en:'Description',
				ja:'説明'
			},
			saving:{
				action:{
					en:'Action after saving',
					ja:'保存後のアクション'
				}
			},
			title:{
				en:'Title',
				ja:'タイトル'
			},
			operator:{
				en:'Registered User',
				ja:'登録ユーザー'
			}
		},
		message:{
			invalid:{
				characters:{
					en:'The directory name contains characters that cannot be used',
					ja:'ディレクトリ名に使用出来ない文字が含まれています'
				},
				field:{
					en:'Please place one or more fields',
					ja:'フィールドを配置して下さい'
				},
				reserved:{
					en:'The directory name entered cannot be used',
					ja:'入力されたディレクトリ名は使用出来ません'
				},
				unknown:{
					en:'Unknown field found in this view',
					ja:'不明なフィールドが配置されています'
				},
				used:{
					en:'The directory name you entered is already in use',
					ja:'入力したディレクトリ名は既にに使用されています'
				}
			}
		}
	},
	linkage:{
		caption:{
			app:{
				en:'Datasource App',
				ja:'リンク元アプリ'
			},
			bulk:{
				en:'Bulk Copy',
				ja:'一括コピー',
				enable:{
					en:'Make it possible to copy the retrieved results also on the list view',
					ja:'一覧形式ビュー上でもテーブル内フィールドへのコピーを可能にする'
				},
				caption:{
					en:'Button Text',
					ja:'ボタンラベル'
				},
				message:{
					en:'Confirm Message',
					ja:'確認メッセージ'
				}
			},
			criteria:{
				en:'Fetch Criteria',
				ja:'リンクするレコードの関連付け'
			},
			display:{
				en:'Datasource App Fields to Display and Mappings',
				ja:'表示するフィールドとコピー先テーブル内フィールド'
			},
			external:{
				en:'Datasource App',
				ja:'リンク元アプリのフィールド'
			},
			filter:{
				en:'Filter Setting',
				ja:'リンクするレコードの絞り込み条件'
			},
			internal:{
				en:'This App',
				ja:'このアプリのフィールド'
			},
			name:{
				en:'Linkage View Name',
				ja:'リンクビュー名'
			}
		},
		message:{
			invalid:{
				app:{
					en:'Please specify an app from [Datasource App] dropdown',
					ja:'リンク元アプリを指定して下さい'
				},
				bulk:{
					en:'If you want to allow bulk copy, you must specify the destination field',
					ja:'一括コピーを可能にする場合は、コピー先フィールドを指定する必要があります',
					caption:{
						en:'Please enter the button text',
						ja:'ボタンラベルを入力して下さい'
					},
					message:{
						en:'Please enter the confirm message',
						ja:'確認メッセージを入力して下さい'
					}
				},
				criteria:{
					en:'Please specify one or more criteria',
					ja:'リンクするレコードの関連付けを指定して下さい'
				},
				display:{
					en:'Please specify one or more display fields',
					ja:'表示するフィールドを指定して下さい'
				},
				name:{
					en:'Please enter the linkage view name',
					ja:'リンクビュー名を入力して下さい'
				},
				table:{
					en:'You must specify the fields in the same table',
					ja:'異なるテーブル内のフィールドを組み合わせて、表示することは出来ません'
				}
			}
		},
		prompt:{
			bulk:{
				caption:{
					en:'Enter the text to be displayed on the button',
					ja:'ボタンに表示するテキストを入力'
				},
				message:{
					en:'Enter the message to be displayed in the confirmation dialog before executing bulk copy',
					ja:'一括コピー実行前の確認ダイアログに表示するメッセージを入力'
				}
			},
			name:{
				en:'Enter the linkage view name',
				ja:'リンクビュー名を入力'
			}
		}
	},
	project:{
		message:{
			invalid:{
				duplicates:{
					en:'You cannot enter the same email address in Sender EMail Address',
					ja:'Sender EMail Address に同じメールアドレスを入力することは出来ません'
				},
				host:{
					en:'Please enter Server Name',
					ja:'Server Name を入力して下さい'
				},
				port:{
					en:'Please enter Port',
					ja:'Port を入力して下さい'
				},
				user:{
					en:'Please enter User Name',
					ja:'User Name を入力して下さい'
				},
				pwd:{
					en:'Please enter Password',
					ja:'Password を入力して下さい'
				},
				secure:{
					en:'Please specify Connection Security',
					ja:'Connection Security を指定して下さい'
				}
			}
		}
	},
	users:{
		message:{
			invalid:{
				account:{
					en:'The account you entered is already in use',
					ja:'入力したアカウントは既にに使用されています'
				}
			}
		}
	},
	view:{
		caption:{
			calendar:{
				date:{
					en:'Date Field',
					ja:'日付フィールド'
				},
				title:{
					en:'Title Field',
					ja:'タイトルフィールド'
				}
			},
			chart:{
				type:{
					table:{
						en:'table',
						ja:'表'
					},
					bar:{
						en:'bar chart',
						ja:'横棒グラフ'
					},
					stacking_bar:{
						en:'stacked bar chart',
						ja:'積み上げ横棒グラフ'
					},
					stacking_percent_bar:{
						en:'stacked percentage bar chart',
						ja:'100%積み上げ横棒グラフ'
					},
					column:{
						en:'column chart',
						ja:'縦棒グラフ'
					},
					stacking_column:{
						en:'stacked column chart',
						ja:'積み上げ縦棒グラフ'
					},
					stacking_percent_column:{
						en:'stacked percentage column chart',
						ja:'100%積み上げ縦棒グラフ'
					},
					pie:{
						en:'pie chart',
						ja:'円グラフ'
					},
					line:{
						en:'line chart',
						ja:'折れ線グラフ'
					},
					spline:{
						en:'spline chart',
						ja:'曲線グラフ'
					},
					area:{
						en:'area chart',
						ja:'面グラフ'
					},
					scatter:{
						en:'scatter',
						ja:'散布図'
					}
				}
			},
			crosstab:{
				column:{
					en:'Column',
					ja:'列'
				},
				function:{
					en:'Function',
					ja:'集計方法'
				},
				row:{
					en:'Rows',
					ja:'行'
				},
				type:{
					en:'Chart Type',
					ja:'グラフの種類'
				}
			},
			customize:{
				filter:{
					en:'Filter Setting',
					ja:'取得するレコードの絞り込み条件'
				}
			},
			gantt:{
				end:{
					en:'End date Field',
					ja:'終了日付フィールド'
				},
				period:{
					en:'Display in',
					ja:'表示単位'
				},
				row:{
					en:'Rows',
					ja:'行'
				},
				start:{
					en:'Start date Field',
					ja:'開始日付フィールド'
				},
				title:{
					en:'Title Field',
					ja:'タイトルフィールド'
				},
				width:{
					en:'Column Width',
					ja:'列幅'
				}
			},
			kanban:{
				date:{
					en:'Date Field',
					ja:'日付フィールド'
				},
				group:{
					en:'Groups',
					ja:'グループ'
				},
				title:{
					en:'Title Field',
					ja:'タイトルフィールド'
				},
				width:{
					en:'Column Width',
					ja:'列幅'
				}
			},
			list:{
				readonly:{
					en:'Read-only',
					ja:'読み取り専用'
				}
			},
			map:{
				address:{
					en:'Address Field',
					ja:'住所フィールド'
				},
				color:{
					en:'Marker Color Field',
					ja:'マーカーカラーフィールド'
				},
				handover:{
					en:'Register the click location',
					ja:'クリック位置を登録する'
				},
				lat:{
					en:'Latitude Field',
					ja:'緯度フィールド'
				},
				lng:{
					en:'Longitude Field',
					ja:'経度フィールド'
				},
				postalcode:{
					en:'Postalcode Field',
					ja:'郵便番号フィールド'
				},
				title:{
					en:'Title Field',
					ja:'タイトルフィールド'
				}
			},
			timeseries:{
				column:{
					en:'Column',
					ja:'列'
				},
				function:{
					en:'Functions',
					ja:'集計方法'
				},
				row:{
					en:'Rows',
					ja:'行'
				},
				type:{
					en:'Chart Type',
					ja:'グラフの種類'
				}
			}
		},
		message:{
			invalid:{
				calendar:{
					table:{
						en:'If any field is designated as a field within a certain table, all other fields must also be within that same table',
						ja:'いずれかのフィールドにテーブル内フィールドを指定した場合は、他の全てのフィールドを同じテーブル内フィールドにする必要があります'
					}
				},
				gantt:{
					width:{
						en:'Column width must be at least 64px',
						ja:'列幅は64px以上にする必要があります'
					}
				},
				kanban:{
					group:{
						en:'Please specify one or more groups',
						ja:'グループを指定して下さい'
					},
					table:{
						en:'If any field is designated as a field within a certain table, all other fields must also be within that same table',
						ja:'いずれかのフィールドにテーブル内フィールドを指定した場合は、他の全てのフィールドを同じテーブル内フィールドにする必要があります'
					},
					width:{
						en:'Column width must be at least 200px',
						ja:'列幅は200px以上にする必要があります'
					}
				},
				list:{
					field:{
						en:'Please place one or more fields',
						ja:'フィールドを配置して下さい'
					},
					unknown:{
						en:'Unknown field found in this view',
						ja:'不明なフィールドが配置されています'
					}
				},
				map:{
					handover:{
						en:'If "Register the click location" is checked, you cannot specify fields in the table',
						ja:'「クリック位置を登録する」にチェックが付いている場合は、テーブル内フィールドを指定出来ません'
					},
					table:{
						en:'If any field is designated as a field within a certain table, all other fields must also be within that same table',
						ja:'いずれかのフィールドにテーブル内フィールドを指定した場合は、他の全てのフィールドを同じテーブル内フィールドにする必要があります'
					}
				},
				name:{
					en:'Please enter the view name',
					ja:'ビュー名を入力して下さい'
				},
				timeseries:{
					caption:{
						en:'Duplicate row captions are not allowed',
						ja:'重複した行タイトルは登録出来ません'
					},
					function:{
						en:'Please specify one or more functions',
						ja:'集計方法を指定して下さい'
					},
					row:{
						en:'Please specify one or more rows',
						ja:'行を指定して下さい'
					}
				}
			}
		},
		prompt:{
			calendar:{
				title:{
					en:'here show a tilte field value',
					ja:'ここにタイトルフィールドの値が表示されます'
				}
			},
			kanban:{
				caption:{
					en:'Name',
					ja:'グループ名を入力'
				}
			},
			map:{
				title:{
					en:'here show a tilte field value',
					ja:'ここにタイトルフィールドの値が表示されます'
				}
			},
			name:{
				en:'Enter the view name',
				ja:'ビュー名を入力'
			},
			timeseries:{
				caption:{
					en:'Title',
					ja:'行タイトルを入力'
				},
				formula:{
					en:'Formula',
					ja:'計算式を入力'
				}
			}
		}
	}
},pd.constants);
