/*
* FileName "panda.js"
* Version: 1.2.3
* Copyright (c) 2020 Pandafirm LLC
* Distributed under the terms of the GNU Lesser General Public License.
* https://opensource.org/licenses/LGPL-2.1
*/
"use strict";
const PD_BREAK='__pd_break';
const PD_CONTINUE='__pd__continue';
const PD_SKIP='__pd__skip';
const PD_THROW='__pd__throw';
class panda{
	/* constructor */
	constructor(){
		/* setup properties */
		this.window={
			alert:null,
			loader:null,
			progress:null,
			addresspicker:null,
			coloradjuster:null,
			colorpicker:null,
			datepicker:null,
			multipicker:null,
			singlepicker:null,
			panelizer:null
		}
		this.eventhandlers={};
		this.lang='en';
		this.theme='light';
		this.operator={};
	}
	/* show coloradjuster */
	adjustcolor(color,callback){
		this.window.coloradjuster.show(color,callback);
	}
	/* show alert */
	alert(message,callback){
		this.loadend();
		this.progressend();
		this.window.alert.alert(message,callback);
	}
	/* calculate tax */
	calculatetax(normal,reduced,free,date,outside,taxround){
		var freeprice=0;
		var normalprice=0;
		var normaltax=0;
		var reducedprice=0;
		var reducedtax=0;
		var taxrate=this.taxrate(date);
		if (outside)
		{
			//outside
			switch (taxround)
			{
				case 'floor':
					normalprice=Math.floor(normal*(1+taxrate.normalrate));
					normaltax=Math.floor((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.floor(reduced*(1+taxrate.reducedrate));
					reducedtax=Math.floor((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
				case 'ceil':
					normalprice=Math.ceil(normal*(1+taxrate.normalrate));
					normaltax=Math.ceil((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.ceil(reduced*(1+taxrate.reducedrate));
					reducedtax=Math.ceil((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
				case 'round':
					normalprice=Math.round(normal*(1+taxrate.normalrate));
					normaltax=Math.round((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.round(reduced*(1+taxrate.reducedrate));
					reducedtax=Math.round((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
			}
		}
		else
		{
			//inside
			switch (taxround)
			{
				case 'floor':
					normalprice=Math.floor(normal);
					normaltax=Math.floor((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.floor(reduced);
					reducedtax=Math.floor((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
				case 'ceil':
					normalprice=Math.ceil(normal);
					normaltax=Math.ceil((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.ceil(reduced);
					reducedtax=Math.ceil((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
				case 'round':
					normalprice=Math.round(normal);
					normaltax=Math.round((normalprice*taxrate.normalrate*100)/(100+(taxrate.normalrate*100)));
					reducedprice=Math.round(reduced);
					reducedtax=Math.round((reducedprice*taxrate.reducedrate*100)/(100+(taxrate.reducedrate*100)));
					break;
			}
		}
		switch (taxround)
		{
			case 'floor':
				freeprice=Math.floor(free);
				break;
			case 'ceil':
				freeprice=Math.ceil(free);
				break;
			case 'round':
				freeprice=Math.round(free);
				break;
		}
		return {
			subtotal:normalprice-normaltax+reducedprice-reducedtax+freeprice,
			tax:normaltax+reducedtax,
			total:normalprice+reducedprice+freeprice,
			normaltotal:normalprice-normaltax+freeprice,
			reducedtotal:reducedprice-reducedtax,
			normaltax:normaltax,
			reducedtax:reducedtax
		}
	}
	/* get children */
	children(element){
		return Array.from(element.children);
	}
	/* copy to clipboard */
	clipboard(value){
		var input=pd.create('input').attr('type','text').val(value);
		pd.elm('body').append(input);
		input.select();
		document.execCommand('copy');
		document.body.removeChild(input);
	}
	/* show confirm */
	confirm(message,callback,cancelcapture){
		this.loadend();
		this.progressend();
		this.window.alert.confirm(message,callback,cancelcapture);
	}
	/* create element */
	create(tagname){
		return document.createElement(tagname);
	}
	/* check device */
	device(){
		var ua=navigator.userAgent;
		if (ua.indexOf('iPhone')>0 || ua.indexOf('iPod')>0 || ua.indexOf('Android')>0 && ua.indexOf('Mobile')>0 || ua.indexOf('Windows Phone')>0) return 'sp';
		if (ua.indexOf('iPad')>0 || ua.indexOf('Android')>0) return 'tab';
		return 'other';
	}
	/* download text file */
	downloadtext(values,filename){
		var blob=new Blob([new Uint8Array([0xEF,0xBB,0xBF]),values],{type:'text/plain'});
		if (window.navigator.msSaveBlob) window.navigator.msSaveOrOpenBlob(blob,filename);
		else
		{
			var url=window.URL || window.webkitURL;
			var a=pd.create('a')
			.attr('href',url.createObjectURL(blob))
			.attr('target','_blank')
			.attr('download',filename)
			.css({display:'none'});
			pd.elm('body').append(a);
			a.click();
			document.body.removeChild(a);
		}
	}
	/* get elements */
	elm(selectors){
		return document.querySelector(selectors);
	}
	elms(selectors){
		return Array.from(document.querySelectorAll(selectors));
	}
	/* extend array */
	extend(target,source){
		var copy=(target,source) => {
			if (source instanceof Function) return source;
			if (source instanceof HTMLElement) return source;
			if (Array.isArray(source)) target=source.map((item) => copy({},item));
			else
			{
				if (source instanceof Object)
				{
					for (var key in source)
					{
						if (key!=='__proto__')
						{
							if (key in target)
							{
								if ([source[key],target[key]].every((item) => (item instanceof Object && !(item instanceof Array)))) target[key]=copy(target[key],source[key]);
							}
							else
							{
								if (source[key] instanceof Object) target[key]=copy({},source[key]);
								else target[key]=source[key];
							}
						}
					}
				}
				else return source;
			}
			return target;
		};
		return copy(target,source);
	}
	/* send file request */
	file(url,method,headers,body,silent=false){
		return new Promise((resolve,reject) => {
			var init={};
			var files=[];
			var param=[];
			var filedata=new FormData();
			var request=(success,fail) => {
				fetch(url,init)
				.then((response) => {
					response.json().then((json) => {
						switch (response.status)
						{
							case 200:
								if (json.seek)
								{
									url=url.replace(/[&?]{1}seek=[0-9]+/g,'')+((url.match(/\?/g))?'&':'?')+'seek='+json.seek.toString();
									files.push(json.file);
									request(success,fail);
								}
								else
								{
									if (files.length!=0)
									{
										files.push(json.file);
										json.file=files.join('');
									}
									success(json);
								}
								break;
							default:
								var message=('message' in json)?json.message:(('error' in json)?json.error.message:'');
								fail({message:message,status:response.status});
								break;
						}
					});
				})
				.catch((e) => {
					if (!silent) this.loadend();
					((error) => {
						switch (error.status)
						{
							case 400:
								fail({message:'INVALID_TOKEN',status:error.status});
								break;
							case 401:
								fail({message:'UNAUTHORIZED',status:error.status});
								break;
							case 500:
								fail({message:'INTERNAL_SERVER_ERROR',status:error.status});
								break;
							case 502:
								fail({message:'BAD_GATEWAY',status:error.status});
								break;
							case 404:
								fail({message:'NOT_FOUND',status:error.status});
								break;
							default:
								fail({message:'UNHANDLED_ERROR',status:error.status});
								break;
						}
					})(Error(e));
				});
			};
			body['timezone']=this.timezone();
			switch (method)
			{
				case 'GET':
					for (var key in body)
					{
						if (body[key] instanceof Object) param.push(key+'='+encodeURIComponent(JSON.stringify(body[key])));
						else param.push(key+'='+encodeURIComponent(body[key]));
					}
					if (param.length!=0) url+=((url.match(/\?/g))?'&':'?')+param.join('&');
					init={
						method:method,
						headers:((res) => {
							if (!('X-Requested-With' in res)) res['X-Requested-With']='XMLHttpRequest';
							if (('account' in this.operator) && ('pwd' in this.operator)) res['X-Authorization']=window.btoa(this.operator.account.value+':'+this.operator.pwd.value);
							return res;
						})(headers)
					};
					break;
				case 'POST':
					for (var key in body)
					{
						switch (key)
						{
							case 'files':
								Array.from(body[key]).each((file,index) => {
									var blob=new Blob([file],{type:file.type});
									filedata.append('file[]',blob,file.name);
								});
								break;
							default:
								if (body[key] instanceof Object) param.push(key+'='+JSON.stringify(body[key]));
								else param.push(key+'='+body[key]);
								break;
						}
					}
					param.push('name=file');
					if (param.length!=0) url+=((url.match(/\?/g))?'&':'?')+param.join('&');
					init={
						method:method,
						headers:((res) => {
							if (!('X-Requested-With' in res)) res['X-Requested-With']='XMLHttpRequest';
							if (('account' in this.operator) && ('pwd' in this.operator)) res['X-Authorization']=window.btoa(this.operator.account.value+':'+this.operator.pwd.value);
							return res;
						})(headers),
						body:filedata
					};
					break;
				default:
					init={
						method:method,
						headers:((res) => {
							if (!('X-Requested-With' in res)) res['X-Requested-With']='XMLHttpRequest';
							if (('account' in this.operator) && ('pwd' in this.operator)) res['X-Authorization']=window.btoa(this.operator.account.value+':'+this.operator.pwd.value);
							return res;
						})(headers),
						body:JSON.stringify(body)
					};
					break;
			}
			if (!silent) this.loadstart();
			request(
				(response) => {
					if (!silent) this.loadend();
					resolve(response);
				},
				(response) => {
					if (!silent) this.loadend();
					reject(response);
				}
			);
		});
	}
	/* show input */
	input(message,callback,type,defaults){
		this.loadend();
		this.progressend();
		this.window.alert.input(message,callback,type,defaults);
	}
	/* check number */
	isnumeric(value){
		if (typeof value==='string') return value.match(/^-?[0-9]+(\.[0-9]+)*$/g);
		if (typeof value==='number') return true;
		return false;
	}
	/* hide loader */
	loadend(){
		this.window.loader.hide();
	}
	/* show loader */
	loadstart(){
		this.progressend();
		this.window.loader.show();
	}
	/* show panelizer */
	panelize(elements){
		this.window.panelizer.show(elements);
	}
	/* show addresspicker */
	pickupaddress(prefecture,city,callback){
		this.window.addresspicker.show(prefecture,city,callback);
	}
	/* show colorpicker */
	pickupcolor(callback){
		this.window.colorpicker.show(callback);
	}
	/* show datepicker */
	pickupdate(activedate,callback){
		this.window.datepicker.show(activedate,callback,true);
	}
	/* show multipicker */
	pickupmultiple(records,columninfos,callback,selected){
		this.window.multipicker.show(records,columninfos,callback,selected);
	}
	/* show addresspicker */
	pickuppostal(postalcode,callback){
		if (postalcode) this.window.addresspicker.pickuppostal(postalcode,callback);
		else callback(null);
	}
	/* show singlepicker */
	pickupsingle(records,columninfos,callback){
		this.window.singlepicker.show(records,columninfos,callback);
	}
	/* get phonetic */
	phonetic(text,callback){
		this.request('https://api.tricky-lab.com/phonetic','POST',{'X-Requested-With':'XMLHttpRequest'},{text:text},true)
		.then((resp) => {
			if (callback) callback(resp.response);
		})
		.catch((error) => this.alert(error.message));
	}
	/* hide progress */
	progressend(){
		this.window.progress.hide();
	}
	/* show progress */
	progressstart(max){
		this.loadend();
		this.window.progress.show(max);
	}
	/* update progress */
	progressupdate(){
		this.window.progress.update();
	}
	/* get query strings */
	queries(){
		var res={};
		var searches=decodeURI(window.location.search).split('?');
		if (searches.length>1)
		{
			searches=searches.last().replace(/#.*$/g,'').split('&');
			for(var i=0;i<searches.length;i++)
			{
				var search=searches[i].split('=');
				res[search[0]]=search[1];
			}
		}
		return res;
	}
	/* document loaded */
	ready(callback){
		document.on('DOMContentLoaded',(e) => {
			if (!this.window.alert)
			{
				/* setup properties */
				this.window.panelizer=new panda_panelizer();
				this.window.singlepicker=new panda_singlepicker();
				this.window.multipicker=new panda_multipicker();
				this.window.datepicker=new panda_datepicker();
				this.window.colorpicker=new panda_colorpicker();
				this.window.coloradjuster=new panda_coloradjuster();
				this.window.addresspicker=new panda_addresspicker();
				this.window.progress=new panda_progress();
				this.window.loader=new panda_loader();
				this.window.alert=new panda_alert();
				/* setup validation method */
				pd.elms('input,select,textarea').each((element,index) => element.initialize());
				/* create chart */
				this.chart=new panda_chart();
				/* create map */
				this.map=new panda_map();
			}
			/* embed stylesheet */
			if (!pd.elm('.pdstyle_scrollbar'))
			{
				pd.elm('head').append(
					pd.create('style')
					.addclass('pdstyle_scrollbar')
					.attr('media','screen')
					.attr('type','text/css')
					.text((() => {
						var res='';
						res+='*::-webkit-scrollbar{height:8px;width:8px;}';
						res+='*::-webkit-scrollbar-corner{background:transparent;}';
						res+='*::-webkit-scrollbar-thumb{background:rgba(128,128,128,1);border-radius:4px;}';
						res+='*::-webkit-scrollbar-track{border:none;border-radius:4px;box-shadow:inset 0 0 2px rgba(128,128,128,0.5);}';
						return res;
					})())
				);
			}
			/* platform */
			switch (navigator.platform.replace(/^(iPad|iPhone|Linux|Mac|Win).*$/g,'$1'))
			{
				case 'iPad':
				case 'iPhone':
				case 'Mac':
					pd.elm('body').addclass('mac');
					break;
				case 'Linux':
					pd.elm('body').addclass('linux');
					break;
				case 'Win':
					pd.elm('body').addclass('win');
					break;
			}
			if (callback) callback(this);
		});
	}
	/* send request */
	request(url,method,headers,body,silent=false,addcontenttype=true){
		return new Promise((resolve,reject) => {
			var init={};
			if (addcontenttype)
				if (!('Content-Type' in headers)) headers['Content-Type']='application/json';
			body['timezone']=this.timezone();
			if (method=='GET')
			{
				var param=[];
				for (var key in body)
				{
					if (body[key] instanceof Object) param.push(key+'='+encodeURIComponent(JSON.stringify(body[key])));
					else param.push(key+'='+encodeURIComponent(body[key]));
				}
				if (param.length!=0) url+=((url.match(/\?/g))?'&':'?')+param.join('&');
				init={
					method:method,
					headers:((res) => {
						if (!('X-Requested-With' in res)) res['X-Requested-With']='XMLHttpRequest';
						if (('account' in this.operator) && ('pwd' in this.operator)) res['X-Authorization']=window.btoa(this.operator.account.value+':'+this.operator.pwd.value);
						return res;
					})(headers)
				};
			}
			else
			{
				init={
					method:method,
					headers:((res) => {
						if (!('X-Requested-With' in res)) res['X-Requested-With']='XMLHttpRequest';
						if (('account' in this.operator) && ('pwd' in this.operator)) res['X-Authorization']=window.btoa(this.operator.account.value+':'+this.operator.pwd.value);
						return res;
					})(headers),
					body:JSON.stringify(body)
				};
			}
			if (!silent) this.loadstart();
			fetch(url,init)
			.then((response) => {
				if (!silent) this.loadend();
				response.json().then((json) => {
					switch (response.status)
					{
						case 200:
							resolve(json);
							break;
						default:
							var message=('message' in json)?json.message:(('error' in json)?json.error.message:'');
							reject({message:message,status:response.status});
							break;
					}
				});
			})
			.catch((e) => {
				if (!silent) this.loadend();
				((error) => {
					switch (error.status)
					{
						case 400:
							reject({message:'INVALID_TOKEN',status:error.status});
							break;
						case 401:
							reject({message:'UNAUTHORIZED',status:error.status});
							break;
						case 500:
							reject({message:'INTERNAL_SERVER_ERROR',status:error.status});
							break;
						case 502:
							reject({message:'BAD_GATEWAY',status:error.status});
							break;
						case 404:
							reject({message:'NOT_FOUND',status:error.status});
							break;
						default:
							reject({message:'UNHANDLED_ERROR',status:error.status});
							break;
					}
				})(Error(e));
			});
		});
	}
	/* scroll to element */
	scroll(pos,duration){
		var counter=0;
		var keep=performance.now();
		var param=(window.pageYOffset-pos)/2;
		var step=(timestamp) => {
			var diff=timestamp-keep;
			if (diff>100) diff=30;
			counter+=Math.PI/(duration/diff);
			if (counter>=Math.PI) return;
			window.scrollTo(0,Math.round(pos+param+param*Math.cos(counter)));
			keep=timestamp;
			window.requestAnimationFrame(step);
		}
		window.requestAnimationFrame(step);
	}
	scrollTo(pos,duration){
		this.scroll(window.pageYOffset+pos,duration);
	}
	scrollTop(duration){
		this.scroll(0,duration);
	}
	/* get tax rate */
	taxrate(date){
		var tax=[
			{startdate:'1900-01-01',normalrate:0,reducedrate:0},
			{startdate:'1989-04-01',normalrate:0.03,reducedrate:0.03},
			{startdate:'1997-04-01',normalrate:0.05,reducedrate:0.05},
			{startdate:'2014-04-01',normalrate:0.08,reducedrate:0.08},
			{startdate:'2019-10-01',normalrate:0.1,reducedrate:0.08}
		];
		var today=new Date().format('Y/m/d');
		return tax.filter((item) => (new Date(item.startdate.replace(/-/g,'\/'))<new Date((date)?date.replace(/-/g,'\/'):today))).last();
	}
	/* themecolor */
	themecolor(){
		var res={
			backcolor:'',
			forecolor:''
		};
		switch (this.theme)
		{
			case 'dark':
				res={
					backcolor:'#303030',
					forecolor:'#ffffff'
				};
				break;
			case 'light':
				res={
					backcolor:'#f0f0f0',
					forecolor:'#263238'
				};
				break;
		}
		return res;
	}
	/* timezone */
	timezone(){
		return ((offset) => {
			var res='';
			if (offset==0) res='UTC';
			else res='Etc/GMT'+((offset>0)?'+':'-')+Math.floor(Math.abs(offset)).toString();
			return res;
		})(new Date().getTimezoneOffset()/60);
	}
};
class panda_dialog{
	/* constructor */
	constructor(zIndex,disuseheader,disusefooter){
		/* setup properties */
		this.parts={
			button:pd.create('button').addclass('pd_dialog_button').css({
				backgroundColor:'transparent',
				border:'none',
				boxSizing:'border-box',
				color:'#42a5f5',
				cursor:'pointer',
				display:'inline-block',
				fontSize:'1em',
				height:'2em',
				lineHeight:'2em',
				outline:'none',
				margin:'0',
				padding:'0',
				position:'relative',
				textAlign:'center',
				verticalAlign:'top',
				width:'50%'
			}),
			div:pd.create('div').css({
				boxSizing:'border-box',
				position:'relative',
				verticalAlign:'top'
			}),
			icon:pd.create('img').css({
				backgroundColor:'transparent',
				border:'none',
				boxSizing:'border-box',
				cursor:'pointer',
				display:'block',
				height:'1.5em',
				margin:'0.25em',
				position:'absolute',
				width:'1.5em'
			}),
			input:pd.create('input').css({
				backgroundColor:'transparent',
				border:'none',
				boxSizing:'border-box',
				display:'inline-block',
				fontSize:'1em',
				height:'2em',
				lineHeight:'1.5em',
				margin:'0',
				outline:'none',
				padding:'0.25em',
				position:'relative',
				verticalAlign:'top',
				width:'100%'
			}),
			select:pd.create('select').css({
				backgroundColor:'transparent',
				border:'none',
				boxSizing:'border-box',
				display:'inline-block',
				fontSize:'1em',
				height:'2em',
				lineHeight:'1.5em',
				margin:'0',
				outline:'none',
				padding:'0.25em',
				position:'relative',
				verticalAlign:'top',
				width:'100%',
				appearance:'none',
				mozAppearance:'none',
				webkitAppearance:'none'
			}),
			span:pd.create('span').css({
				boxSizing:'border-box',
				display:'inline-block',
				margin:'0',
				padding:'0',
				position:'relative',
				verticalAlign:'top'
			}),
			table:pd.create('table').css({
				border:'none',
				borderCollapse:'collapse',
				margin:'0',
				width:'100%'
			}),
			td:pd.create('td').css({
				border:'none',
				borderBottom:'1px solid #42a5f5',
				boxSizing:'border-box',
				lineHeight:'1.5em',
				margin:'0',
				padding:'0.25em 0.5em',
				textAlign:'left'
			}),
			th:pd.create('th').css({
				border:'none',
				boxSizing:'border-box',
				fontWeight:'normal',
				lineHeight:'2em',
				margin:'0',
				padding:'0',
				position:'-webkit-sticky',
				position:'sticky',
				textAlign:'center',
				top:'0',
				zIndex:'2'
			})
		};
		this.cover=this.parts.div.clone().css({
			alignItems:'center',
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			justifyContent:'center',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:zIndex
		});
		this.container=this.parts.div.clone().css({
			borderRadius:'0.25em',
			boxShadow:'0 0 3px rgba(0,0,0,0.35)',
			cursor:'default',
			maxHeight:'calc(100% - 1em)',
			maxWidth:'calc(100% - 1em)',
			padding:'2em 0 calc(2em + 1px) 0'
		});
		this.contents=this.parts.div.clone().css({
			height:'100%',
			overflowX:'hidden',
			overflowY:'auto',
			padding:'1em',
			width:'100%'
		});
		this.header=this.parts.div.clone().css({
			borderTopLeftRadius:'0.25em',
			borderTopRightRadius:'0.25em',
			boxShadow:'0 1px 0 #42a5f5',
			height:'2em',
			left:'0',
			lineHeight:'2em',
			overflow:'hidden',
			padding:'0 2em 0 0',
			position:'absolute',
			textAlign:'center',
			textOverflow:'ellipsis',
			top:'0',
			whiteSpace:'nowrap',
			width:'100%'
		});
		this.footer=this.parts.div.clone().css({
			borderTop:'1px solid #42a5f5',
			bottom:'0',
			left:'0',
			position:'absolute',
			textAlign:'center',
			width:'100%'
		});
		this.ok=this.parts.button.clone().html('OK');
		this.cancel=this.parts.button.clone().html('Cancel');
		this.close=this.parts.icon.clone().css({
			right:'0',
			top:'0'
		})
		.on('click',(e) => {
			this.hide();
			e.stopPropagation();
			e.preventDefault();
		});
		/* integrate elements */
		pd.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(this.contents)
			)
			.on('mousedown,touchstart',(e) => e.stopPropagation())
		);
		if (!disuseheader)
		{
			this.container
			.append(this.header)
			.append(this.close)
		}
		else this.container.css({paddingTop:'0'});
		if (!disusefooter)
		{
			this.container.append(
				this.footer
				.append(this.ok.css({
					borderBottomLeftRadius:'0.25em'
				}))
				.append(this.cancel.css({
					borderBottomRightRadius:'0.25em'
				}))
			);
		}
		else this.container.css({paddingBottom:'0'});
		/* embed stylesheet */
		if (!pd.elm('.pd_dialog_style_button'))
		{
			pd.elm('head').append(
				pd.create('style')
				.addclass('pd_dialog_style_button')
				.attr('media','screen')
				.attr('type','text/css')
				.text((() => {
					var res='';
					res+='.pd_dialog_button:hover{background-color:#42a5f5 !important;color:rgba(255,255,255,1) !important;}';
					return res;
				})())
			);
		}
	}
	/* show */
	show(){
		this.container.css({
			backgroundColor:pd.themecolor().backcolor,
			color:pd.themecolor().forecolor
		});
		this.container.elms('input,select').each((element,index) => {
			element.css({
				backgroundColor:pd.themecolor().backcolor,
				color:pd.themecolor().forecolor
			});
		});
		switch (pd.theme)
		{
			case 'dark':
				this.close.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAuZJREFUeNpiYKAa+P////v/SACbgv8wGlkRE7oiRiBAFmPCYdIFIBbEag0UCBDteIAAoo7/kcF7kBgLsr9BAOQ1rP5GlkCWBPnvAtbghBotgDO8sQGAAKKJtwX+YwIBYjWdx6L5PLohjNjSEXLQ4RNnwuUKWJhjS3NY0x5U0Qd025DYH3AZRDIACKDhhNDLBlj+wIgRXGUGrujDGVVIGgvR9BViMxhXIgHFdSKUnQiLe5yJBGhoA5L4fCitiMZHUcdEScDiyhiJSDYis1ECDZfNAkhOnQ/l0zCq0HMWcugPrtwEEEAjDzGSmdsdgJQDktABYDweoEWxsv4/aWA9vS2k3AFYCs8CqHgCDksSoPIFxBS6OOMQjy8S0ByQQMBB/6FpgiiLG4gIRgWoWgUi1DbgrdSRUykedyVCiyIHaDnnAOUn4tFzYHDH8YCmalrn48Fdcg0rABBAo2gUDLoWSAFSwxXUjJxAy85NAzm1ENk+hvaMSS3oBYGh8AGfAiYClhqQYSkIvIfqJc/HlI5t4OtCMOGrj9GEHImwy5GAGfh9jC1ecQ1uECGPNb5x+Xg9rmDHFnwEHLWeFB8T7DOiO4SUfiZZFmMziFT1ZHfscQwrkQSYKM0m5Pa6mci1FHkMkxzLSWrQY0tIRFh+YPDnY6jCD9g6cvgSHJbO2QdclcXgK6uhwJACew0HZX08eFsgA97mGgVDFgAEaNd8TwAEgSgeTdAojtAojuBIbeIIjdII/UMhxDDPUxPfjz5Fgo8703seHgAAsGcHY/LqSAtUm3FTCyKVx+FOZbMu+V9Eipd+hhysIVMld8qWEuoTTkp5aj2uzNleVEosYSw0VSKyoTpifnwriRGUbm3KUbNQxMrYCdcYxymYHKmAAKrQPVvzmudilEN4slD3grfk2iWnXqLQqLU8Dp0RIzjFLrobGE4WX0pf7z80NOScH35afW5L3R08mLYoTspVUa0WDygPYQDA4gEAgHocYFaz12jcUhYAAAAASUVORK5CYII=');
				break;
			case 'light':
				this.close.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA9pJREFUeNpiYKAUMMIY/VMmvgdSAjB+YU4+WI4JSbFAQXYeA5KG/+gKGCZMncSArAhDAUyRm7MriCmI4gZkY0GSQDd8IMoXAAFEHf//RxL/ALRbkAldAuo1AQxvgSRA3kL3syDIn8gS6HaCjHqPHN54AUAAUceraMENdwISwAh6RmyaQJ7btXc3ik4kMbgh6CkAbBtMIyjoYEkGybD3OJMPephjS3M4/YyezNEAONqpEtoAATREEa5Egh5oWAMKW2j/x2UTeoJnwqYxMyUdRROMj24wzkQC04BuEDJgRrK1AUg5gNhnzp1lMDUyYbCxtGb4+/cvw/Q5M+EaPLw8GXdu23EAr80kA5CfQPjHjx9gjM4m2s8wpyI7mXZRhaTgA5bcxDh40jZAAI3mZmLToQMsF0DBAWBEHqC6xUCL1gOpABLM3QB0SCDZFpNhIdEOYMRjKUrhCSqJ2NnZGX7+/Ik1h+KRJ67QRYrD/biKRGQLCDkIChzR0wALDoUOhMol5BofvW2Ew7wDxBR8B/BVAiALQT4EWQiiQXx8lQI28wZXHA9oqh7QfEzLkmvkAYAAGkWjYNC1QAqQilNQkTiBZhZDG/31BJQ1Ah3RQBWLcXS5CQGCoyFMBCw1IMNScE8cqpc8i4HgPAXp5zxZFkPrY5ShAlERUZwGgeTQhxDQzSBoMTReMYYWosMjsVoOEgPJYQECULOI9vF6dIGlK5djtRzZUpgaQmbhsxijsff6zWsMy9EtBakhtuFIUv8a3XIiLCU7VWO1HHk0DMQm1VKyLAYFL3Q8FT4Ehy+1U8Vi9DjFleAosfgAIUtBwYstwRHbOcBlcSC2PIwtIaFbToxZOC2GFvAfsOVlbAkJ2XIsIy8fyOkf/6ekssc33EMocRlSYK/hoKyPB28LhFZtrlEw/AFAgPas6AZBIIZeiAM5gNG4gTH+KyM4gSPoBuq/MW5gNA7AJrCBXrEm98HJtQVE6Av9BO6l7bV91UehUHRfhQismlAxQfpcmi/St6chPZq3FJq1mjC2Bhvj35tzkGFPs2sFYRQ59taGDURkYi225JPGCWPIXhsiWkR8ygn5SBC66Y/IGvxviueo18Nlc4SrcMHm6XQ5kwQKmKwXs3m+ufqgZH8XPLOQCVuyK8xX0oFDiHPfQ0BeH+og/JR4qoiAkGjQ4M8diSFfttQU8BG6Pe5mMhqLibqcQ0rXgPBBVm2Fw8MG2SUO5uqBQqKk80WmZ6B4mNXmhYQ0GMiPQk9nemkJPZxf/1WXJV+OEz0ea+NRZS/NLVE1YE2dono3POh4qAJAxyQehUKh+Cu8AL45fzrg+n0KAAAAAElFTkSuQmCC');
				break;
		}
		this.cover.show('flex');
		return this;
	}
	/* hide */
	hide(){
		this.cover.hide();
		return this;
	}
};
class panda_alert extends panda_dialog{
	/* constructor */
	constructor(){
		super(999999,true,false);
		/* setup properties */
		this.handler=null;
		this.prompt=this.parts.input.clone().css({
			border:'1px solid #42a5f5',
			marginTop:'0.25em'
		})
		.on('keydown',(e) => {
			var code=e.keyCode||e.which;
			if (code==13)
			{
				this.ok.focus();
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
		});
		this.cancel.on('click',(e) => this.hide());
		/* resize event */
		window.on('resize',(e) => {
			this.contents
			.css({height:'auto'})
			.css({height:this.container.innerheight().toString()+'px'});
		});
	}
	/* show alert */
	alert(message,callback){
		/* setup handler */
		if (this.handler)
		{
			this.ok.off('click',this.handler);
			this.cancel.off('click',this.handler);
		}
		this.handler=(e) => {
			this.hide();
			if (callback) callback();
		};
		this.ok.on('click',this.handler);
		/* setup styles */
		this.ok.css({
			borderBottomRightRadius:'0.25em',
			borderRight:'none',
			width:'100%'
		});
		this.cancel.css({display:'none'});
		/* setup message */
		if (message.nodeName) this.contents.empty().append(message);
		else this.contents.html(message);
		/* modify elements */
		this.container.css({minWidth:''});
		/* show */
		this.show();
	}
	/* show confirm */
	confirm(message,callback,cancelcapture){
		/* setup handler */
		if (this.handler)
		{
			this.ok.off('click',this.handler);
			this.cancel.off('click',this.handler);
		}
		this.handler=(e) => {
			this.hide();
			if (callback) callback(e.currentTarget==this.cancel);
		};
		this.ok.on('click',this.handler);
		if (cancelcapture) this.cancel.on('click',this.handler);
		/* setup styles */
		this.ok.css({
			borderBottomRightRadius:'0',
			borderRight:'1px solid #42a5f5',
			width:'50%'
		});
		this.cancel.css({display:'inline-block'});
		/* setup message */
		if (message.nodeName) this.contents.empty().append(message);
		else this.contents.html(message);
		/* modify elements */
		this.container.css({minWidth:'8em'});
		/* show */
		this.show();
	}
	/* show input */
	input(message,callback,type,defaults){
		/* setup handler */
		if (this.handler)
		{
			this.ok.off('click',this.handler);
			this.cancel.off('click',this.handler);
		}
		this.handler=(e) => {
			this.hide();
			if (callback) callback(this.prompt.val());
		};
		this.ok.on('click',this.handler);
		/* setup styles */
		this.ok.css({
			borderBottomRightRadius:'0',
			borderRight:'1px solid #42a5f5',
			width:'50%'
		});
		this.cancel.css({display:'inline-block'});
		/* setup message */
		if (message.nodeName) this.contents.empty().append(message);
		else this.contents.empty().append(this.parts.span.clone().html(message));
		this.contents.append(this.prompt.attr('type',(type)?type:'password').val((defaults)?defaults:''))
		/* modify elements */
		this.container.css({minWidth:'8em'});
		/* show */
		this.show();
	}
	/* show */
	show(){
		super.show();
		this.contents
		.css({height:'auto'})
		.css({height:this.container.innerheight().toString()+'px'});
		this.ok.focus();
		return this;
	}
};
class panda_addresspicker extends panda_dialog{
	/* constructor */
	constructor(){
		super(999997,true,true);
		/* setup properties */
		this.callback=null;
		this.table=null;
		this.prefecture=this.parts.select.clone().css({
			borderBottom:'1px solid #42a5f5',
			borderTopLeftRadius:'0.25em',
			borderTopRightRadius:'0.25em',
			left:'0',
			paddingRight:'2.25em',
			position:'absolute',
			top:'0'
		})
		.on('change',(e) => this.pickupcity(this.prefecture.val()));
		this.city=this.parts.select.clone().css({
			borderBottom:'1px solid #42a5f5',
			left:'0',
			position:'absolute',
			top:'calc(2em + 1px)'
		})
		.on('change',(e) => this.pickupstreet(this.city.val()));
		/* modify elements */
		this.container.css({
			height:'calc(32em + 15px)',
			paddingTop:'calc(4em + 2px)',
			width:'20em'
		})
		.append(this.prefecture)
		.append(this.city)
		.append(this.close);
		this.contents.css({
			padding:'0',
		});
	}
	/* search prefecture */
	pickupprefecture(callback){
		/* initialize elements */
		this.prefecture.empty()
		.append(
			pd.create('option')
			.attr('value','')
			.html(pd.constants.dialog.address.prompt.prefecture[pd.lang])
		);
		this.city.empty()
		.append(
			pd.create('option')
			.attr('value','')
			.html(pd.constants.dialog.address.prompt.city[pd.lang])
		);
		this.table.clearrows();
		/* setup elements */
		pd.request('https://api.tricky-lab.com/place/prefecture','GET',{'X-Requested-With':'XMLHttpRequest'},{},true)
		.then((resp) => {
			var records=resp.records;
			this.prefecture.assignoption(records,'name','id');
			if (callback) callback(records);
		})
		.catch((error) => pd.alert(error.message));
	}
	/* search city */
	pickupcity(prefecture,callback){
		/* initialize elements */
		this.city.empty()
		.append(
			pd.create('option')
			.attr('value','')
			.html(pd.constants.dialog.address.prompt.city[pd.lang])
		);
		this.table.clearrows();
		/* setup elements */
		if (prefecture)
		{
			pd.request('https://api.tricky-lab.com/place/city?prefecture='+prefecture,'GET',{'X-Requested-With':'XMLHttpRequest'},{},true)
			.then((resp) => {
				var records=resp.records;
				this.city.assignoption(records,'name','id');
				if (callback) callback(records);
			})
			.catch((error) => pd.alert(error.message));
		}
		else
		{
			if (callback) callback();
		}
	}
	/* search street */
	pickupstreet(city,callback){
		/* initialize elements */
		this.table.clearrows();
		/* setup elements */
		if (city)
		{
			pd.request('https://api.tricky-lab.com/place/street?city='+city,'GET',{'X-Requested-With':'XMLHttpRequest'},{},true)
			.then((resp) => {
				var records=resp.records;
				/* append records */
				if (this.table)
					records.each((record,index) => {
						var row=this.table.addrow();
						row.elm('td').html((record.label.value)?record.label.value:'&nbsp;');
						row.elm('#id').val(record.id.value);
						row.elm('#name').val(record.name.value);
						row.elm('#resourceid').val(record.resourceid.value);
					});
				if (callback) callback(records);
			})
			.catch((error) => pd.alert(error.message));
		}
		else
		{
			if (callback) callback();
		}
	}
	/* search postalcode */
	pickuppostal(postalcode,callback){
		pd.request('https://api.tricky-lab.com/place/postal?id='+postalcode,'GET',{'X-Requested-With':'XMLHttpRequest'},{},true)
		.then((resp) => {
			if (callback)
			{
				if (resp.records.length>1)
				{
					pd.pickupsingle(
						resp.records,
						{
							label:{
								align:'left',
								text:pd.constants.common.prompt.multiple[pd.lang],
								width:'30em'
							}
						},
						(resp) => callback({
							prefecture:{
								id:resp.prefecture.value,
								name:resp.prefecturename.value
							},
							city:{
								id:resp.city.value,
								name:resp.cityname.value
							},
							street:{
								id:resp.street.value,
								name:resp.streetname.value
							},
							address:resp.name.value,
							postalcode:((resp.id.value.length==7)?resp.id.value.substr(0,3)+'-'+resp.id.value.substr(3,4):resp.id.value),
							label:resp.label.value,
							resourceid:resp.resourceid.value
						})
					);
				}
				else
				{
					callback({
						prefecture:{
							id:(resp.records.length==0)?'':resp.records.first().prefecture.value,
							name:(resp.records.length==0)?'':resp.records.first().prefecturename.value
						},
						city:{
							id:(resp.records.length==0)?'':resp.records.first().city.value,
							name:(resp.records.length==0)?'':resp.records.first().cityname.value
						},
						street:{
							id:(resp.records.length==0)?'':resp.records.first().street.value,
							name:(resp.records.length==0)?'':resp.records.first().streetname.value
						},
						address:(resp.records.length==0)?'':resp.records.first().name.value,
						postalcode:(resp.records.length==0)?'':((resp.records.first().id.value.length==7)?resp.records.first().id.value.substr(0,3)+'-'+resp.records.first().id.value.substr(3,4):resp.records.first().id.value),
						label:(resp.records.length==0)?'':resp.records.first().label.value,
						resourceid:(resp.records.length==0)?'':resp.records.first().resourceid.value
					});
				}
			}
		})
		.catch((error) => pd.alert(error.message));
	}
	/* show records */
	show(prefecture,city,callback){
		/* setup callback */
		if (callback) this.callback=callback;
		/* setup elements */
		if (!this.table)
		{
			this.contents.append(
				(() => {
					this.table=this.parts.table.clone().css({marginBottom:'0.5em'})
					.append(
						pd.create('tbody').append(
							pd.create('tr')
							.append(
								this.parts.td.clone().css({cursor:'pointer'})
							)
							.append(pd.create('input').attr('type','hidden').attr('id','id'))
							.append(pd.create('input').attr('type','hidden').attr('id','name'))
							.append(pd.create('input').attr('type','hidden').attr('id','resourceid'))
						)
					)
					.spread((row,index) => {
						row.on('click',(e) => {
							var id=e.currentTarget.elm('#id').val();
							var name=e.currentTarget.elm('#name').val();
							var label=e.currentTarget.elm('td').text();
							var resourceid=e.currentTarget.elm('#resourceid').val();
							if (this.callback) this.callback({
								prefecture:{
									id:this.prefecture.val(),
									name:this.prefecture.selectedtext()
								},
								city:{
									id:this.city.val(),
									name:this.city.selectedtext()
								},
								street:{
									id:id,
									name:name
								},
								address:this.prefecture.selectedtext()+this.city.selectedtext()+name,
								postalcode:((id.length==7)?id.substr(0,3)+'-'+id.substr(3,4):id),
								label:(label==name)?this.prefecture.selectedtext()+this.city.selectedtext()+name:label,
								resourceid:resourceid
							});
							this.hide();
						});
					});
					return this.table;
				})()
			);
		}
		else this.table.clearrows();
		this.pickupprefecture((prefectures) => {
			if (prefecture)
				for (var key in prefectures)
					if (prefectures[key].name.value==prefecture)
					{
						this.prefecture.val(prefectures[key].id.value);
						break;
					}
			this.pickupcity(this.prefecture.val(),(cities) => {
				if (city)
					for (var key in cities)
						if (cities[key].name.value==city)
						{
							this.city.val(cities[key].id.value);
							break;
						}
				this.pickupstreet(this.city.val(),() => {
					super.show();
				});
			});
		});
	}
};
class panda_calendar{
	/* constructor */
	constructor(minimalise){
		/* setup properties */
		this.minimalise=minimalise;
		this.calendar=pd.create('table').css({
			borderCollapse:'collapse',
			margin:'0',
			width:'100%'
		});
		/* create cells */
		((cell,weeks) => {
			this.calendar.append(
				((head) => {
					head.append(pd.create('tr'));
					weeks.each((week,index) => head.elm('tr').append(cell.clone().html(week)));
					return head;
				})(pd.create('thead'))
			);
			this.calendar.append(
				((body) => {
					(weeks.length*6).each((index) => {
						if (index%weeks.length==0) body.append(pd.create('tr'));
						body.elms('tr').last().append(cell.clone());
					});
					return body;
				})(pd.create('tbody'))
			);
		})(pd.create('td').css({
			boxSizing:'border-box',
			margin:'0',
			padding:'0',
			textAlign:'center',
			width:'calc(100% / 7)'
		}),pd.constants.weeks[pd.lang]);
	}
	/* show calendar */
	show(month,activedate,callback){
		var cell=0;
		var styles={
			active:{
				backgroundColor:'#42a5f5',
				color:'#ffffff'
			},
			normal:{
				backgroundColor:'',
				color:pd.themecolor().forecolor
			},
			saturday:{
				backgroundColor:'',
				color:'#42a5f5'
			},
			sunday:{
				backgroundColor:'',
				color:'#fa8273'
			},
			today:{
				backgroundColor:'#ffb46e',
				color:'#ffffff'
			}
		};
		this.calendar.elms('tbody tr').each((element,index) => {
			element.css({display:'table-row'});
			element.elms('td').each((element,index) => {
				var day=month;
				var span=cell-month.getDay();
				var style=styles.normal;
				/* initialize */
				element.empty();
				/* not process if it less than the first of this month */
				if (span<0)
				{
					element.css(style).html('&nbsp;').off('click');
					cell++;
					return;
				}
				else day=day.calc(span.toString()+' day');
				/* not process it if it exceeds the end of this month */
				if (day.format('Y-m')!=month.format('Y-m'))
				{
					element.css(style).html('&nbsp;').off('click');
					cell++;
					if (this.minimalise)
						if (cell%7==1) element.closest('tr').hide();
					return;
				}
				/* setup styles */
				switch ((cell+1)%7)
				{
					case 0:
						style=styles.saturday;
						break;
					case 1:
						style=styles.sunday;
						break;
				}
				if (day.format('Y-m-d')==new Date().format('Y-m-d')) style=styles.today;
				if (activedate)
					if (day.format('Y-m-d')==activedate.format('Y-m-d')) style=styles.active;
				element.off('click').on('click',(e) => {
					if (callback)
						if (callback.select) callback.select(element,day);
				});
				if (callback)
					if (callback.create) callback.create(element,day,style);
				cell++;
			});
		});
	}
};
class panda_coloradjuster extends panda_dialog{
	/* constructor */
	constructor(){
		super(999997,false,true);
		var handler=(e) => {
			var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
			var iscanvas=false;
			var rect={
				container:null,
				handle:null
			};
			var handler={
				move:(e) => {
					var pointer=(e.changedTouches)?Array.from(e.changedTouches).first():e;
					var position=pointer.pageX+this.params.down-this.params.keep;
					var rect={
						canvas:this.params.canvas.getBoundingClientRect(),
						container:this.params.container.getBoundingClientRect()
					};
					if (pointer.pageX<rect.canvas.left) position=rect.canvas.left-rect.container.left;
					if (pointer.pageX>rect.canvas.right) position=rect.canvas.right-rect.container.left;
					this.params.handle.css({'left':position.toString()+'px'});
					/* adjust volume */
					this.adjustvolume();
					e.stopPropagation();
					e.preventDefault();
				},
				end:(e) => {
					window.off('touchmove,mousemove',handler.move);
					window.off('touchend,mouseup',handler.end);
					e.stopPropagation();
					e.preventDefault();
				}
			};
			if (e.currentTarget==this.hue.canvas) {this.params.target='hue';iscanvas=true;}
			if (e.currentTarget==this.saturation.canvas) {this.params.target='saturation';iscanvas=true;}
			if (e.currentTarget==this.brightness.canvas) {this.params.target='brightness';iscanvas=true;}
			if (e.currentTarget==this.hue.handle) this.params.target='hue';
			if (e.currentTarget==this.saturation.handle) this.params.target='saturation';
			if (e.currentTarget==this.brightness.handle) this.params.target='brightness';
			switch(this.params.target)
			{
				case 'hue':
					this.params.canvas=this.hue.canvas;
					this.params.container=this.hue.container;
					this.params.handle=this.hue.handle;
					break;
				case 'saturation':
					this.params.canvas=this.saturation.canvas;
					this.params.container=this.saturation.container;
					this.params.handle=this.saturation.handle;
					break;
				case 'brightness':
					this.params.canvas=this.brightness.canvas;
					this.params.container=this.brightness.container;
					this.params.handle=this.brightness.handle;
					break;
			}
			rect.container=this.params.container.getBoundingClientRect();
			rect.handle=this.params.handle.getBoundingClientRect();
			this.params.keep=pointer.pageX;
			if (iscanvas)
			{
				this.params.down=pointer.pageX-rect.container.left;
				this.params.handle.css({'left':this.params.down.toString()+'px'});
			}
			else this.params.down=rect.handle.left+rect.handle.width/2-rect.container.left;
			/* mouse event */
			window.on('touchmove,mousemove',handler.move);
			window.on('touchend,mouseup',handler.end);
			/* adjust volume */
			this.adjustvolume();
			e.stopPropagation();
			e.preventDefault();
		};
		/* setup properties */
		this.callback=null;
		this.params={
			target:'',
			down:0,
			keep:0,
			canvas:null,
			container:null,
			handle:null
		};
		this.canvas=pd.create('canvas').css({
			borderRadius:'0.25em',
			boxSizing:'border-box',
			cursor:'crosshair',
			display:'none',
			margin:'0px',
			position:'relative',
			verticalAlign:'top'
		});
		this.handle=this.parts.icon.clone().css({
			bottom:'0',
			height:'0.75em',
			left:'4em',
			margin:'0px 0px 0px -0.5em',
			transition:'none',
			width:'1em'
		});
		this.span=this.parts.span.clone().css({
			fontSize:'0.8em',
			lineHeight:'1.875em',
			padding:'0px 0.5em 0px 0px',
			width:'6.25em'
		});
		this.informations=this.parts.div.clone().css({
			border:'1px solid #42a5f5',
			borderRadius:'0.25em',
			display:'inline-block',
			lineHeight:'1.5em',
			margin:'0px 0px 1em 4em',
			padding:'1em',
			verticalAlign:'top',
			width:'calc(50% - 4em)'
		});
		this.thumbnail=this.parts.div.clone().css({
			borderRadius:'0.25em',
			display:'inline-block',
			height:'8em',
			margin:'0px 10% 1em 10%',
			verticalAlign:'top',
			width:'30%'
		});
		this.hex=this.parts.input.clone().css({
			border:'1px solid #42a5f5',
			borderRadius:'0.25em',
			fontSize:'0.8em',
			height:'1.5625em',
			lineHeight:'1.5625em',
			margin:'0.125em 0px',
			padding:'0px 0.25em',
			width:'calc(100% - 6.25em)'
		})
		.attr('type','text')
		.on('change',(e) => {
			var color=e.currentTarget.val().replace(/#/g,'');
			if (color.length==6)
			{
				/* convert HSB color */
				this.toHSB(color)
				/* attach volume */
				this.attachvolume();
				if (this.callback) this.callback('#'+color);
			}
		});
		/* setup hue properties */
		this.hue={
			caption:this.span.clone().html(pd.constants.dialog.color.caption.hue[pd.lang]),
			canvas:this.canvas.clone().on('touchstart,mousedown',handler),
			container:this.parts.div.clone().css({height:'2.25em',margin:'1em 0px 0px 0px',padding:'0px 1em 0.75em 1em',width:'100%'}),
			handle:this.handle.clone().on('touchstart,mousedown',handler),
			monitor:this.span.clone().css({width:'calc(100% - 6.25em)'}),
			max:359,
			volume:0
		};
		/* setup saturation properties */
		this.saturation={
			caption:this.span.clone().html(pd.constants.dialog.color.caption.saturation[pd.lang]),
			canvas:this.canvas.clone().on('touchstart,mousedown',handler),
			container:this.parts.div.clone().css({height:'2.25em',margin:'1em 0px 0px 0px',padding:'0px 1em 0.75em 1em',width:'100%'}),
			handle:this.handle.clone().on('touchstart,mousedown',handler),
			monitor:this.span.clone().css({width:'calc(100% - 6.25em)'}),
			max:100,
			volume:0
		};
		/* setup brightness properties */
		this.brightness={
			caption:this.span.clone().html(pd.constants.dialog.color.caption.brightness[pd.lang]),
			canvas:this.canvas.clone().on('touchstart,mousedown',handler),
			container:this.parts.div.clone().css({height:'2.25em',margin:'1em 0px 0px 0px',padding:'0px 1em 0.75em 1em',width:'100%'}),
			handle:this.handle.clone().on('touchstart,mousedown',handler),
			monitor:this.span.clone().css({width:'calc(100% - 6.25em)'}),
			max:100,
			volume:0
		};
		/* modify elements */
		this.container.css({
			height:'23em',
			width:'550px'
		});
		this.contents
		.append(
			this.informations
			.append(this.span.clone().html(pd.constants.dialog.color.caption.hue[pd.lang]))
			.append(this.hue.monitor.css({padding:'0px',textAlign:'left'}))
			.append(this.span.clone().html(pd.constants.dialog.color.caption.saturation[pd.lang]))
			.append(this.saturation.monitor.css({padding:'0px',textAlign:'left'}))
			.append(this.span.clone().html(pd.constants.dialog.color.caption.brightness[pd.lang]))
			.append(this.brightness.monitor.css({padding:'0px',textAlign:'left'}))
			.append(this.span.clone().css({textAlign:'right'}).html('#'))
			.append(this.hex)
		)
		.append(this.thumbnail)
		.append(
			this.hue.container
			.append(this.hue.caption)
			.append(this.hue.canvas)
			.append(this.hue.handle)
		)
		.append(
			this.saturation.container
			.append(this.saturation.caption)
			.append(this.saturation.canvas)
			.append(this.saturation.handle)
		)
		.append(
			this.brightness.container
			.append(this.brightness.caption)
			.append(this.brightness.canvas)
			.append(this.brightness.handle)
		);
		/* resize event */
		window.on('resize',(e) => {
			/* attach volume */
			this.attachvolume();
		});
	}
	/* adjust volume */
	adjustvolume(){
		var position=parseInt(this.params.handle.css('left'));
		var rect={
			canvas:this.params.canvas.getBoundingClientRect(),
			container:this.params.container.getBoundingClientRect()
		};
		position-=rect.canvas.left-rect.container.left;
		switch(this.params.target)
		{
			case 'hue':
				this.hue.volume=Math.ceil((position/rect.canvas.width)*this.hue.max);
				break;
			case 'saturation':
				this.saturation.volume=Math.ceil((position/rect.canvas.width)*this.saturation.max);
				break;
			case 'brightness':
				this.brightness.volume=Math.ceil((position/rect.canvas.width)*this.brightness.max);
				break;
		}
		/* draw canvas */
		this.redraw();
		/* convert HEX color */
		this.toHEX();
		if (this.callback) this.callback('#'+this.hex.val());
	}
	/* attach volume */
	attachvolume(){
		var volumes=[this.hue,this.saturation,this.brightness];
		/* draw canvas */
		this.redraw();
		volumes.each((volume,index) => {
			var position=0;
			var rect={
				canvas:volume.canvas.getBoundingClientRect(),
				container:volume.container.getBoundingClientRect(),
				handle:volume.handle.getBoundingClientRect()
			};
			position+=rect.canvas.left-rect.container.left;
			position+=rect.canvas.width*(volume.volume/volume.max);
			volume.handle.css({'left':position.toString()+'px'});
		});
	}
	/* draw canvas */
	redraw(){
		var context=null;
		var height=0;
		var width=0;
		/* hue */
		height=this.hue.caption.outerheight(true);
		width=this.hue.container.innerwidth()-this.hue.caption.outerwidth(true);
		this.hue.canvas.css({display:'inline-block'}).attr('height',height.toString()+'px').attr('width',width.toString()+'px');
		if (this.hue.canvas.getContext)
		{
			context=this.hue.canvas.getContext('2d');
			width.each((index) => {
				context.fillStyle='hsl('+(index*this.hue.max/width).toString()+',50%,50%)';
				context.fillRect(index,0,index,height);
			});
		}
		/* saturation */
		height=this.saturation.caption.outerheight(true);
		width=this.saturation.container.innerwidth()-this.saturation.caption.outerwidth(true);
		this.saturation.canvas.css({display:'inline-block'}).attr('height',height.toString()+'px').attr('width',width.toString()+'px');
		if (this.saturation.canvas.getContext)
		{
			context=this.saturation.canvas.getContext('2d');
			width.each((index) => {
				context.fillStyle='hsl('+this.hue.volume.toString()+','+(index*this.saturation.max/width)+'%,50%)';
				context.fillRect(index,0,index,height);
			});
		}
		/* brightness */
		height=this.brightness.caption.outerheight(true);
		width=this.brightness.container.innerwidth()-this.brightness.caption.outerwidth(true);
		this.brightness.canvas.css({display:'inline-block'}).attr('height',height.toString()+'px').attr('width',width.toString()+'px');
		if (this.brightness.canvas.getContext)
		{
			context=this.brightness.canvas.getContext('2d');
			width.each((index) => {
				context.fillStyle='hsl(0,0%,'+(index*this.brightness.max/width)+'%)';
				context.fillRect(index,0,index,height);
			});
		}
	}
	/* convert HEX color */
	toHEX(){
		var color='';
		var hsb={h:this.hue.volume,s:this.saturation.volume,b:this.brightness.volume};
		var rgb={r:0,g:0,b:0};
		var hex=(value) => {
			var sin="0123456789ABCDEF";
			if(value>255) return 'FF';
			if(value<0) return '00';
			return sin.charAt(Math.floor(value/16))+sin.charAt(value%16);
		};
		hsb.h/=60;
		hsb.s/=100;
		hsb.b/=100;
		rgb.r=hsb.b;
		rgb.g=hsb.b;
		rgb.b=hsb.b;
		if (hsb.s>0)
		{
			var index=Math.floor(hsb.h);
			switch (index)
			{
				case 0:
					rgb.g=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					rgb.b=hsb.b*(1-hsb.s);
					break;
				case 1:
					rgb.r=hsb.b*(1-hsb.s*(hsb.h-index));
					rgb.b=hsb.b*(1-hsb.s);
					break;
				case 2:
					rgb.r=hsb.b*(1-hsb.s);
					rgb.b=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					break;
				case 3:
					rgb.r=hsb.b*(1-hsb.s);
					rgb.g=hsb.b*(1-hsb.s*(hsb.h-index));
					break;
				case 4:
					rgb.r=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					rgb.g=hsb.b*(1-hsb.s);
					break;
				case 5:
					rgb.g=hsb.b*(1-hsb.s);
					rgb.b=hsb.b*(1-hsb.s*(hsb.h-index));
					break;
			}
		}
		color+=hex(Math.round(rgb.r*255));
		color+=hex(Math.round(rgb.g*255));
		color+=hex(Math.round(rgb.b*255));
		this.hue.monitor.html(this.hue.volume);
		this.saturation.monitor.html(this.saturation.volume);
		this.brightness.monitor.html(this.brightness.volume);
		this.hex.val(color);
		this.thumbnail.css({'background-color':'#'+color});
	}
	/* convert HSB color */
	toHSB(color){
		var colors=[];
		var hsb={h:0,s:0,b:0};
		var rgb={r:0,g:0,b:0};
		var diff={check:0,r:0,g:0,b:0};
		var max=0;
		var min=0;
		color=color.replace(/(#|rgba|rgb|\(|\))/g,'');
		colors=color.split(',').map((item) => item.trim());
		if (colors.length==1)
		{
			switch (color.length)
			{
				case 3:
					rgb.r=parseInt(color.substr(0,1),16);
					rgb.g=parseInt(color.substr(1,1),16);
					rgb.b=parseInt(color.substr(2,1),16);
					break;
				case 6:
					rgb.r=parseInt(color.substr(0,2),16);
					rgb.g=parseInt(color.substr(2,2),16);
					rgb.b=parseInt(color.substr(4,2),16);
					break;
			}
		}
		else
		{
			rgb.r=parseInt(colors[0]);
			rgb.g=parseInt(colors[1]);
			rgb.b=parseInt(colors[2]);
		}
		rgb.r/=255;
		rgb.g/=255;
		rgb.b/=255;
		hsb.b=Math.max(rgb.r,rgb.g,rgb.b);
		diff.check=hsb.b-Math.min(rgb.r,rgb.g,rgb.b);
		diff.r=(hsb.b-rgb.r)/6/diff.check+1/2;
		diff.g=(hsb.b-rgb.g)/6/diff.check+1/2;
		diff.b=(hsb.b-rgb.b)/6/diff.check+1/2;
		if (diff.check!==0)
		{
			hsb.s=diff.check/hsb.b;
			if (rgb.r===hsb.b) hsb.h=diff.b-diff.g;
			else if (rgb.g===hsb.b) hsb.h=(1/3)+diff.r-diff.b;
			else if (rgb.b===hsb.b) hsb.h=(2/3)+diff.g-diff.r;
			if (hsb.h < 0) hsb.h+=1;
			else if (hsb.h > 1) hsb.h-=1;
		}
		hsb.h=Math.round(hsb.h*360);
		hsb.s=Math.round(hsb.s*100);
		hsb.b=Math.round(hsb.b*100);
		this.hue.volume=hsb.h;
		this.saturation.volume=hsb.s;
		this.brightness.volume=hsb.b;
		this.toHEX();
	}
	/* show color */
	show(color,callback){
		/* setup callback */
		if (callback) this.callback=callback;
		/* setup styles */
		switch (pd.theme)
		{
			case 'dark':
				this.hue.handle.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjxJREFUeNpiYCAV/AcCZD4TPkkMBdgUMuHTjdMEZA1M+HTjNQGmESCAqOR/krzGRLaXGPFK4vMPQAAR8tp8ECZXIwzMJ1cj8Qbg0EjYAAIacRtApEZMA0jUCDcAIAAn9ZICAAgCAbSZk3XTrlqLIpHMj5uggodh4/XfW7W8Afn9tyFXczY9FavCstYsHdFeXzo99bePzAtrnRHVOkc2yKTOqPq6h0p8Hp0ZVevIh/bVWQq4rU8BeKmDGwBAEIaidv+lPZkYIyi00AXe6XcwS9+yF1UEtaKTw7/NSeFIcjI4WpwEzgRHw9neKJhKxsFRhb5wVKIejmrUwtGB3nB0oSeOTnTH0Y2uTQGosYMbAGEYhqKS99+5bABJ/J0KiSMteuJi+3/PuOkAHz7OL5IbXaZqJAhMEogcraPGEkhXLVc7VaPRp6MWoZ2o8cxVVYvSdt+NhL2KWqS2cyaWMr/UorXVs9F4+6ZWQlu5I56rrcEqoV4J9NZQRqvXmoQ10JHq1QpjDYOUer07WYMkob5S2qwh1FU/ApRnLzcIAzEQhvV3svRfFCklEUJCQAj78CqZsS++WfpuM/JZha88q1fJ0G7LxzepZML6og+wfugKrA+6AauP7sDqogewU9HMwm7rHnDqtoWU5dLgQOwUNBfHhqMRwIaiEcGGoRHChqARww6jEcQOoRHFdqMRxnahEcc2ozHANqExwVajMcJWoTHD/kVjiD1EY4r9icYYu4vGHPuFJgH2DU0S7AudCPuYFQDh5S+pTKh6AAAAAElFTkSuQmCC');
				this.saturation.handle.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjxJREFUeNpiYCAV/AcCZD4TPkkMBdgUMuHTjdMEZA1M+HTjNQGmESCAqOR/krzGRLaXGPFK4vMPQAAR8tp8ECZXIwzMJ1cj8Qbg0EjYAAIacRtApEZMA0jUCDcAIAAn9ZICAAgCAbSZk3XTrlqLIpHMj5uggodh4/XfW7W8Afn9tyFXczY9FavCstYsHdFeXzo99bePzAtrnRHVOkc2yKTOqPq6h0p8Hp0ZVevIh/bVWQq4rU8BeKmDGwBAEIaidv+lPZkYIyi00AXe6XcwS9+yF1UEtaKTw7/NSeFIcjI4WpwEzgRHw9neKJhKxsFRhb5wVKIejmrUwtGB3nB0oSeOTnTH0Y2uTQGosYMbAGEYhqKS99+5bABJ/J0KiSMteuJi+3/PuOkAHz7OL5IbXaZqJAhMEogcraPGEkhXLVc7VaPRp6MWoZ2o8cxVVYvSdt+NhL2KWqS2cyaWMr/UorXVs9F4+6ZWQlu5I56rrcEqoV4J9NZQRqvXmoQ10JHq1QpjDYOUer07WYMkob5S2qwh1FU/ApRnLzcIAzEQhvV3svRfFCklEUJCQAj78CqZsS++WfpuM/JZha88q1fJ0G7LxzepZML6og+wfugKrA+6AauP7sDqogewU9HMwm7rHnDqtoWU5dLgQOwUNBfHhqMRwIaiEcGGoRHChqARww6jEcQOoRHFdqMRxnahEcc2ozHANqExwVajMcJWoTHD/kVjiD1EY4r9icYYu4vGHPuFJgH2DU0S7AudCPuYFQDh5S+pTKh6AAAAAElFTkSuQmCC');
				this.brightness.handle.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjxJREFUeNpiYCAV/AcCZD4TPkkMBdgUMuHTjdMEZA1M+HTjNQGmESCAqOR/krzGRLaXGPFK4vMPQAAR8tp8ECZXIwzMJ1cj8Qbg0EjYAAIacRtApEZMA0jUCDcAIAAn9ZICAAgCAbSZk3XTrlqLIpHMj5uggodh4/XfW7W8Afn9tyFXczY9FavCstYsHdFeXzo99bePzAtrnRHVOkc2yKTOqPq6h0p8Hp0ZVevIh/bVWQq4rU8BeKmDGwBAEIaidv+lPZkYIyi00AXe6XcwS9+yF1UEtaKTw7/NSeFIcjI4WpwEzgRHw9neKJhKxsFRhb5wVKIejmrUwtGB3nB0oSeOTnTH0Y2uTQGosYMbAGEYhqKS99+5bABJ/J0KiSMteuJi+3/PuOkAHz7OL5IbXaZqJAhMEogcraPGEkhXLVc7VaPRp6MWoZ2o8cxVVYvSdt+NhL2KWqS2cyaWMr/UorXVs9F4+6ZWQlu5I56rrcEqoV4J9NZQRqvXmoQ10JHq1QpjDYOUer07WYMkob5S2qwh1FU/ApRnLzcIAzEQhvV3svRfFCklEUJCQAj78CqZsS++WfpuM/JZha88q1fJ0G7LxzepZML6og+wfugKrA+6AauP7sDqogewU9HMwm7rHnDqtoWU5dLgQOwUNBfHhqMRwIaiEcGGoRHChqARww6jEcQOoRHFdqMRxnahEcc2ozHANqExwVajMcJWoTHD/kVjiD1EY4r9icYYu4vGHPuFJgH2DU0S7AudCPuYFQDh5S+pTKh6AAAAAElFTkSuQmCC');
				break;
			case 'light':
				this.hue.handle.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmNJREFUeNpiYCAV9E+Z+B+Zz4RPEkMBNoVM+HTjNAFZAxM+3XhNgGkECCAq+Z8krzGR7SVGvJL4/AMQQIS8Nh+Ecckz4tMIpBKg3AWFOfmJRGlG08iAywBGIjViNYCRBI0YBjCSqBHFAEYyNMINAAggQlHlgE+eiYDp+8nSDEsc+BIJPpsT0GgGYrPEfHx8QjYnEODjzMbziXENLpsTiHQNRgE6n1AWxWczoVSWgFUzIVuxqWMiwVYMdUyk2IpuOxOJtqLYzkhmdgRnSYAAvNTbDQAhDAPB2/6bPn6QEIJAADsNjPLyd1PHsRwlbwYtiYQFHnWaxXk53gzO653u4igOaQdHdb0rHOXLRDgqdIWjRCMcNTrDcaAjHBfa4zjRFseN1voFoMZOcgAGYRiKSv+kPVqP2m0HIGRwpCKWxNbbAf/b1kvHWiS6j+DtI158l0bVJLTea2KueCSMqElqw2qy2qiaAm1ITYU2oqZI61ZTpfWepVDrOkul1jNDsXZ7hmrt7iwC7dYsCu1OBiKtmYFKa2Uh1C6zUGpXmYi100zU2lk2DdphNh3aUQdN2k8HXdq3mkbtQ535CM2s8xKg/Dq5ARAIASjqtxLtvygtxfGgiXGfhQHmJ4QjeUfoKhSwQ1hTmDH8yrPkbSpit0TRVMaKo1GAFUWjBCuGRhFWBI0ybHE0CrFF0SjFFkOjGFsEjXJsdjQGsFnRGMFmQ2MImwWNMWwyGoPYJDRGsdFoDGOj0BjH/kbjAPsLjRPsZzSOsJ/QOMO+onGIfUTjFHuLxjH2Eo1z7AlNA9gDmkawO7pvCLs2Ld3EiIvCsygIAAAAAElFTkSuQmCC');
				this.saturation.handle.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmNJREFUeNpiYCAV9E+Z+B+Zz4RPEkMBNoVM+HTjNAFZAxM+3XhNgGkECCAq+Z8krzGR7SVGvJL4/AMQQIS8Nh+Ecckz4tMIpBKg3AWFOfmJRGlG08iAywBGIjViNYCRBI0YBjCSqBHFAEYyNMINAAggQlHlgE+eiYDp+8nSDEsc+BIJPpsT0GgGYrPEfHx8QjYnEODjzMbziXENLpsTiHQNRgE6n1AWxWczoVSWgFUzIVuxqWMiwVYMdUyk2IpuOxOJtqLYzkhmdgRnSYAAvNTbDQAhDAPB2/6bPn6QEIJAADsNjPLyd1PHsRwlbwYtiYQFHnWaxXk53gzO653u4igOaQdHdb0rHOXLRDgqdIWjRCMcNTrDcaAjHBfa4zjRFseN1voFoMZOcgAGYRiKSv+kPVqP2m0HIGRwpCKWxNbbAf/b1kvHWiS6j+DtI158l0bVJLTea2KueCSMqElqw2qy2qiaAm1ITYU2oqZI61ZTpfWepVDrOkul1jNDsXZ7hmrt7iwC7dYsCu1OBiKtmYFKa2Uh1C6zUGpXmYi100zU2lk2DdphNh3aUQdN2k8HXdq3mkbtQ535CM2s8xKg/Dq5ARAIASjqtxLtvygtxfGgiXGfhQHmJ4QjeUfoKhSwQ1hTmDH8yrPkbSpit0TRVMaKo1GAFUWjBCuGRhFWBI0ybHE0CrFF0SjFFkOjGFsEjXJsdjQGsFnRGMFmQ2MImwWNMWwyGoPYJDRGsdFoDGOj0BjH/kbjAPsLjRPsZzSOsJ/QOMO+onGIfUTjFHuLxjH2Eo1z7AlNA9gDmkawO7pvCLs2Ld3EiIvCsygIAAAAAElFTkSuQmCC');
				this.brightness.handle.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAmNJREFUeNpiYCAV9E+Z+B+Zz4RPEkMBNoVM+HTjNAFZAxM+3XhNgGkECCAq+Z8krzGR7SVGvJL4/AMQQIS8Nh+Ecckz4tMIpBKg3AWFOfmJRGlG08iAywBGIjViNYCRBI0YBjCSqBHFAEYyNMINAAggQlHlgE+eiYDp+8nSDEsc+BIJPpsT0GgGYrPEfHx8QjYnEODjzMbziXENLpsTiHQNRgE6n1AWxWczoVSWgFUzIVuxqWMiwVYMdUyk2IpuOxOJtqLYzkhmdgRnSYAAvNTbDQAhDAPB2/6bPn6QEIJAADsNjPLyd1PHsRwlbwYtiYQFHnWaxXk53gzO653u4igOaQdHdb0rHOXLRDgqdIWjRCMcNTrDcaAjHBfa4zjRFseN1voFoMZOcgAGYRiKSv+kPVqP2m0HIGRwpCKWxNbbAf/b1kvHWiS6j+DtI158l0bVJLTea2KueCSMqElqw2qy2qiaAm1ITYU2oqZI61ZTpfWepVDrOkul1jNDsXZ7hmrt7iwC7dYsCu1OBiKtmYFKa2Uh1C6zUGpXmYi100zU2lk2DdphNh3aUQdN2k8HXdq3mkbtQ535CM2s8xKg/Dq5ARAIASjqtxLtvygtxfGgiXGfhQHmJ4QjeUfoKhSwQ1hTmDH8yrPkbSpit0TRVMaKo1GAFUWjBCuGRhFWBI0ybHE0CrFF0SjFFkOjGFsEjXJsdjQGsFnRGMFmQ2MImwWNMWwyGoPYJDRGsdFoDGOj0BjH/kbjAPsLjRPsZzSOsJ/QOMO+onGIfUTjFHuLxjH2Eo1z7AlNA9gDmkawO7pvCLs2Ld3EiIvCsygIAAAAAElFTkSuQmCC');
				break;
		}
		/* show */
		super.show();
		/* convert HSB color */
		this.toHSB(color)
		/* attach volume */
		this.attachvolume();
	}
};
class panda_colorpicker extends panda_dialog{
	/* constructor */
	constructor(){
		super(999997,false,false);
		/* setup properties */
		this.callback=null;
		this.colors={
			hue:[
				'#d93636',
				'#d95136',
				'#d96c36',
				'#d98736',
				'#d9a336',
				'#d9be36',
				'#d9d936',
				'#bed936',
				'#a3d936',
				'#87d936',
				'#6cd936',
				'#51d936',
				'#36d936',
				'#36d951',
				'#36d96c',
				'#36d987',
				'#36d9a3',
				'#36d9be',
				'#36d9d9',
				'#36bed9',
				'#36a3d9',
				'#3687d9',
				'#366cd9',
				'#3651d9',
				'#3636d9',
				'#5136d9',
				'#6c36d9',
				'#8736d9',
				'#a336d9',
				'#be36d9',
				'#d936d9',
				'#d936be',
				'#d936a3',
				'#d93687',
				'#d9366c',
				'#d93651',
				'#ffffff',
				'#eeeeee',
				'#bdbdbd',
				'#757575',
				'#424242',
				'#000000'
			],
			mellow:[
				'#72afd5',
				'#4394c7',
				'#9ebdb5',
				'#8b8bbb',
				'#6565a4',
				'#b2b2d2',
				'#afdea6',
				'#7ac86a',
				'#8ed081',
				'#fde549',
				'#fef19a',
				'#fde75e',
				'#6b999e',
				'#6d9c92',
				'#598288',
				'#a1cae3',
				'#cf6371',
				'#e7b1b8',
				'#d8838d',
				'#ef6643',
				'#d1b1c8',
				'#e08e45',
				'#9ec5ab',
				'#e3c567',
				'#baab68',
				'#ed1c24',
				'#77966d',
				'#a69888',
				'#f2f7f2',
				'#426b69',
				'#bcaa99',
				'#f0803c',
				'#bf211e',
				'#ea9010',
				'#437c90',
				'#e85f5c',
				'#ffffff',
				'#eeeeee',
				'#bdbdbd',
				'#757575',
				'#424242',
				'#000000'
			],
			forest:[
				'#347321',
				'#44780a',
				'#558620',
				'#1b5e20',
				'#8ba03e',
				'#90b566',
				'#638538',
				'#79ae37',
				'#87bc42',
				'#61964b',
				'#3d7085',
				'#64988e',
				'#345644',
				'#6b7f5c',
				'#b0b17c',
				'#ecddba',
				'#e1c584',
				'#b4a18f',
				'#c89660',
				'#a17d5e',
				'#796e63',
				'#89542f',
				'#692f11',
				'#913636',
				'#ad5f52',
				'#473c31',
				'#473731',
				'#786159',
				'#ad9b95',
				'#a39a8e',
				'#6e6262',
				'#70624d',
				'#997e6e',
				'#bdb1a4',
				'#bdbca4',
				'#87866c',
				'#ffffff',
				'#eeeeee',
				'#bdbdbd',
				'#757575',
				'#424242',
				'#000000'
			],
			emotion:[
				'#f8b195',
				'#f67280',
				'#c06c84',
				'#6c5b7b',
				'#355c7d',
				'#99b898',
				'#feceab',
				'#ff847c',
				'#e84a5f',
				'#a8a7a7',
				'#cc527a',
				'#e8175d',
				'#a8e6ce',
				'#dcedc2',
				'#ffd3b5',
				'#ffaaa6',
				'#ff8c94',
				'#a7226e',
				'#ec2049',
				'#f26b38',
				'#f7db4f',
				'#2f9599',
				'#e1f5c4',
				'#ede574',
				'#f9d423',
				'#fc913a',
				'#ff4e50',
				'#e5fcc2',
				'#9de0ad',
				'#45ada8',
				'#547980',
				'#fe4365',
				'#fc9d9a',
				'#f9cdad',
				'#c8c8a9',
				'#83af9b',
				'#ffffff',
				'#eeeeee',
				'#bdbdbd',
				'#757575',
				'#424242',
				'#000000'
			]
		};
		this.input=this.parts.input.clone().css({
			borderBottomLeftRadius:'0.25em',
			width:'calc(100% - 5em)'
		})
		.attr('placeholder',pd.constants.dialog.color.prompt[pd.lang])
		.attr('type','text');
		this.theme=this.parts.select.clone().css({
			textAlign:'center',
			width:'calc(100% + 2em)'
		})
		.assignoption(Object.keys(this.colors).map((item) => ({id:{value:item}})),'id','id')
		.on('change',(e) => {
			this.contents.elms('div').each((element,index) => {
				element.css({
					backgroundColor:this.colors[this.theme.val()][index]
				})
			});
		});
		this.ok.css({
			borderBottomLeftRadius:'',
			borderBottomRightRadius:'0.25em',
			width:'5em'
		})
		.on('click',(e) => {
			if (!this.input.val()) pd.alert(pd.constants.dialog.color.message.invalid[pd.lang]);
			else
			{
				if (this.callback) this.callback('#'+this.input.val().replace(/#/g,''));
				this.hide();
			}
		});
		this.cancel.css({display:'none'});
		/* modify elements */
		this.container.css({
			height:'calc(352px + 4em)',
			width:'300px'
		});
		this.contents.css({
			padding:'3px 2px 2px 2px',
			textAlign:'center'
		});
		this.header.append(this.theme);
		this.footer.insertBefore(this.input,this.ok);
		/* create cells */
		this.colors.hue.each((color,index) => {
			this.contents.append(
				this.parts.div.clone().css({
					backgroundColor:color,
					cursor:'pointer',
					display:'inline-block',
					height:'calc((100% / 7) - 4px)',
					margin:'2px',
					width:'calc((100% / 6) - 4px)'
				})
				.on('click',(e) => {
					if (this.callback) this.callback(this.colors[this.theme.val()][index]);
					this.hide();
				})
			);
		});
	}
	/* show color */
	show(callback){
		/* setup callback */
		if (callback) this.callback=callback;
		/* setup elements */
		this.input.val('');
		/* show */
		super.show();
	}
};
class panda_datepicker extends panda_dialog{
	/* constructor */
	constructor(){
		super(999997,false,true);
		/* setup properties */
		this.callback=null;
		this.activedate=null;
		this.month=new Date().calc('first-of-month');
		this.feed=this.parts.icon.clone().css({top:'0px'});
		this.calendar=new panda_calendar();
		this.caption=this.parts.span.clone().css({
			display:'block',
			lineHeight:'2em',
			padding:'0px 2em',
			textAlign:'center',
			width:'100%'
		});
		this.prev=this.feed.clone()
		.css({left:'0px'})
		.on('click',(e) => {
			/* calc months */
			this.month=this.month.calc('-1 month,first-of-month');
			/* show calendar */
			this.show();
		});
		this.next=this.feed.clone()
		.css({right:'0px'})
		.on('click',(e) => {
			/* calc months */
			this.month=this.month.calc('1 month,first-of-month');
			/* show calendar */
			this.show();
		});
		/* modify elements */
		this.calendar.calendar.css({marginTop:'0.25em',width:'calc(17.5em + 8px)'}).elms('td').each((element,index) => {
			element.css({
				border:'1px solid #42a5f5',
				height:'2.5em',
				lineHeight:'2.5em',
				width:'2.5em'
			});
		});
		this.container.css({
			height:'calc(22.25em + 8px)'
		});
		this.contents.css({padding:'0 0.5em'})
		.append(
			this.parts.div.clone()
			.append(this.caption)
			.append(this.prev)
			.append(this.next)
		)
		.append(this.calendar.calendar);
		this.header.css({boxShadow:'none'});
	}
	/* show calendar */
	show(activedate,callback,init){
		/* setup properties */
		if (activedate)
		{
			if (activedate.match(/^[0-9]{4}(-|\/){1}[0-1]?[0-9]{1}(-|\/){1}[0-3]?[0-9]{1}$/g))
			{
				this.activedate=new Date(activedate.replace(/-/g,'\/'));
				this.month=this.activedate.calc('first-of-month');
			}
		}
		else
		{
			if (init)
			{
				this.activedate=null;
				this.month=new Date().calc('first-of-month');
			}
		}
		if (callback) this.callback=callback;
		/* setup styles */
		switch (pd.theme)
		{
			case 'dark':
				this.prev.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAf1JREFUeNpiYKAJ+A8EMDYTmkQDsiQIMOLSyQgEGCbABKkLAAKIun6/D/MFCy6voXgLXQJnkOJVSJQpAAFE12BAcQ4LqRoIaibWw0zYBKHJqJGqUU7VKAAIoOGOgGH1nqh4JjbemQhoWk9yCiM2lTFh0RRAUfIkFjCS4mz0ohOnzVCFG6hSCFCUKbAlkoEDAAE0iqiZ+wvoaVnAfyRAa8sU/uMA+PSxkGmZAJCiKI+wkJEhBagRUkxEWLYfKegEqBVFjLT0Mb4GKiMt45imLWNyU/XQzceDouQaEgAggEbRKBgFRBUcdC+1QLUXXYtLoD0GdK8ggHacJ6dmYqHAQoraXUxkWtpP18YeKaMsVPMxtbMJsWMKVGvWEm0xrbIGwaCGthQ/0N1iqOWCQKqQmhYz0ipVE2pTk5yPoQZOoLuPiS25qO5jJIM/QA2/MJB1sMGAdV8GpD4e8BbIKBgFyAAgQLvmdgIgCAVQkwZwhEZolEZphDZolEZqFBNS8CsK7yWVc1D89Qh1H8oAAFAK8VOqhnuWdOlC9/d+sLLk7h/oRXTzL2lZcs1z/y6F4/3MZ8mmhGMJeXohSvYyKkpOYTnCnGs6fCss6bJ3QWdtsiLCeRgxd99nqfnzsgbkMyNpSvY4KMqr/bRaeHZcTVgi8SC1pHigPKQBQIsHAECICye3aWBxWa7dAAAAAElFTkSuQmCC');
				this.next.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAdFJREFUeNpiYKAa+A8B99HFGZEVwAWBAMZmwmUajM2CYSSSbpy6SAIAAUQl/6OLMWEJoAaiAoaJaD+TBAACiPZexgUYCWnG50FGUmxGN4iJSBc2EhXE/xHgPk0DFyCAhgsCBtR7SgsVolIZEwFD1lOUPPElUSYSvBJAlmZcgIWorEemszfgyxAspNpGu0RCNwAQQKMIW8QVDFjdgwQCBspiZKBAibmMxFhMhDmCwPz3YSAshoEPQAcIUlRgkwkEkKJiP8WlJi18TC2LSY7jAUvVgzofD0zJNewAQACNolEwMps+/wekEEEqLt8PlMUwYDCQba7zlJpLadOH7HqY0qbPe6C7+geylUlyN49poLIdtZu3RDf4aGExUUHPRIMc+IGY+Ka2xYX0blcPSKqeQM6ICaU+pnvJdYERAj4w0AoMhtppQOrj0W7MKBg6ACDARtEoGAWjYEQOFpyn+XjqIPMwMlgPxAIjycPIoH/Yef4/8aBhpHkY3h8Y0s3z/5SB93SdzxkEHkYG9+nR/WSkhodp4K4LQBwI7Ow/GM4xjAsMrmruP30BxdUcE8MoGN5JerTQGu7V0mjDY7RpOdp5GO0ejsgBgJEzxDMKRsEoGAX0BADL1BWfwMZOPAAAAABJRU5ErkJggg==');
				break;
			case 'light':
				this.prev.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjZJREFUeNpiYKAJ6J8y8T+MzYIm0QCk6pHFmNA016ObhqKgMCefkfoOBggg6vr9Psz/LLgCBcVb6BI4gxSvQqJMAQggugYDinNYSNVAUDOxHmbCJghNRo2ENDMSG+VASoGq6RMggIY7Agbae6Limdh4ZyGgaT2QCiAphRGbyliwaALZtJ7s5EksYCTF2ehJE6fNUIUbqFIIUFQuYUskAwcAAmgUUTP3F5CUpSi0DD07TqCZxUDLQBXBfVL1sZBpmQCQoiiPsJCRIQWoES3ENAn2AykHaic+Rlr6GF8DgJGWcUx1i4lN1TS1GF8+HpC2FqGSa+QBgAAaRaNgFBBVcJDVm6BCL4uo2ouFShYaAKnzNG/6oFkKstCALm0uarS7mMi0tJ+ujT1i+79UtRhav/ZTKwewUDubULN5S5MRO4KJC9pu+kB3i6GWC4KoAWvQkxL0hFqYJOdjqIET6BLUWCwHBbsg3S2GWv4B6vsLdLUYyQGGQMqQ5omL2IKG6omL3tluFIwCkgFAgPbN6AZAGASi1XQQR3BD3aSrGhLilzZqoQK9iwu8RLnrUfFAEORKbla63NNSRbq21KPZOCQFqJIqC133wAxJt2FU+uZsCHRPF9d+QgFzq7FJlwymgHk/U3pCdgfmgpMm7PL3p5MVIU8bsTQUpbtxcRsxB6xtI9Ka02CaPL7SLdFSLUtrDi2TwJq2ZB5YOni4ApaIlm6Bvx4eQgC/8fVQwE9sLizwnc3hbwMIgobRAdIK28oCHbudAAAAAElFTkSuQmCC');
				this.next.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAi1JREFUeNpiYKAa6J8y8T8Q30cXZ0LjK4AU4lMANw3GZkGXLMzJZ2QgpIskABBAVPI/Xr9DA6gBn7/rcUri9DNJACCAaO9lXICRkGZ8HmQkxWZ0g5iIdGEjNhew4NHwAKhBkWaBCxBAwwUBo+o9sWqxRZUAsamMiUDJtJ4szVAQgM8VTMRmFiAOIEszLsBCjCJcOYuQzRvwZUkWUm2jWiIZOAAQQKMIW8QV0MJcRmKyExI3EJjsNgyExchAEeiIBwNhMTIQBDriw0BYDAMfgA4QHAiLkcEBoCMcKSo1aeFjallMchxTYjFFqZpUi6mWjwes5Bp5ACCARtEoGJlNn/+0KESI7RD0U7vRTEpPRADqewN6WwwD54GWnx/Ixh5Z9TBVOn1A8B7osP6BsBgECshplzENVLZjona2JzbbUdtiogdDaGHxB2K69dS2uJDe7WqSBy+o4eMJ5IyYUOpjsksuci2+ALTQkBIXk2OxIdDSC5TGDwuJ2USQWomRidrZZBSMggEHAAHaNaMbAEEYiBLDgo7AJo7gaI7gCI5giMSAn0LLNb0XBuAlhF4LXIQQU3Q/vZfcnsPI2jNPtSZck+e66W/utCjcpPzw/DC4vAjXZPHNk/DbDxT53YvwVz6pvecACNec5aY/vAg3zb5UmUMVFitzFoSHlrklOCMa2OPQI40qLHZpIQmrlKXZwurBI06SnBYtNYUhmgdpYbj2UEIYegAwStjMiIcQQkxxA49895hLUEtfAAAAAElFTkSuQmCC');
				break;
		}
		/* setup calendar */
		this.caption.html(this.month.format('Y-m'));
		this.calendar.show(this.month,this.activedate,{
			create:(cell,date,style) => {
				cell.css(style).css({cursor:'pointer',fontWeight:((pd.theme=='dark')?'bold':'normal')}).html(date.getDate().toString());
			},
			select:(cell,date) => {
				if (this.callback) this.callback(date.format('Y-m-d'));
				this.hide();
			}
		});
		/* show */
		super.show();
	}
};
class panda_multipicker extends panda_dialog{
	/* constructor */
	constructor(){
		super(999997,true,false);
		/* setup properties */
		this.callback=null;
		this.table=null;
		this.columninfos={};
		this.records=[];
		this.selection=[];
		this.ok.css({
			borderRight:'1px solid #42a5f5'
		}).on('click',(e) => {
			if (this.callback) this.callback(this.selection.map((item) => this.records[item]));
			this.hide();
		});
		this.cancel.on('click',(e) => this.hide());
		/* modify elements */
		this.container.css({
			height:'calc(34.5em + 15px)',
			minWidth:'16em'
		});
		this.contents.css({
			padding:'0px'
		});
	}
	/* show records */
	show(records,columninfos,callback,selected){
		var cell=null;
		var row=null;
		var div=this.parts.div.clone().css({
			borderBottom:'1px solid #42a5f5',
			padding:'0px 0.5em'
		});
		var td=this.parts.td.clone().css({cursor:'pointer'});
		var th=this.parts.th.clone().css({
			backgroundColor:pd.themecolor().backcolor,
			lineHeight:'2.5em'
		});
		/* check records */
		if(records instanceof Array)
		{
			if (records.length!=0)
			{
				/* setup properties */
				this.callback=callback;
				this.columninfos=columninfos;
				this.records=records;
				this.selection=[];
				/* create table */
				this.table=this.parts.table.clone()
				.append(pd.create('thead').append(pd.create('tr')))
				.append(pd.create('tbody').append(pd.create('tr')));
				for (var key in this.columninfos)
				{
					this.table.elm('thead tr').append(
						th.clone().css({
							display:(('display' in this.columninfos[key])?this.columninfos[key].display:'table-cell'),
							width:(('width' in this.columninfos[key])?this.columninfos[key].width:'auto')
						})
						.append(div.clone().html(('text' in this.columninfos[key])?this.columninfos[key].text:''))
					);
					cell=td.clone().css({
						display:(('display' in this.columninfos[key])?this.columninfos[key].display:'table-cell'),
						textAlign:(('align' in this.columninfos[key])?this.columninfos[key].align:'left')
					})
					.attr('id',key);
					if ('decimals' in this.columninfos[key]) cell.attr('data-decimals',this.columninfos[key].decimals);
					this.table.elm('tbody tr').append(cell);
				}
				this.table.elms('thead tr th').first().css({
					borderTopLeftRadius:'0.25em'
				});
				this.table.elms('thead tr th').last().css({
					borderTopRightRadius:'0.25em'
				});
				this.contents.empty().append(
					this.table.spread((row,index) => {
						row.on('click',(e) => {
							if (!this.selection.includes(index))
							{
								this.selection.push(index);
								row.css({
									backgroundColor:'rgba(66,165,245,0.5)',
									color:''
								});
							}
							else
							{
								this.selection=this.selection.filter((item) => item!=index);
								row.css({
									backgroundColor:'transparent',
									color:pd.themecolor().forecolor
								});
							}
						});
					})
				);
				/* append records */
				this.table.clearrows();
				this.records.each((record,index) => {
					row=this.table.addrow();
					for (var key in this.columninfos)
					{
						if (row.elm('#'+key).hasAttribute('data-decimals'))
						{
							if (record[key].value) row.elm('#'+key).html(Number(record[key].value).comma(row.elm('#'+key).attr('data-decimals')));
							else row.elm('#'+key).html(record[key].value);
						}
						else row.elm('#'+key).html(record[key].value);
					}
					if (selected)
					{
						if (selected.some((item) => {
							var exists=true;
							for (var key in item) if (item[key].value!=record[key].value) exists=false;
							return exists;
						}))
						{
							this.selection.push(index);
							row.css({
								backgroundColor:'rgba(66,165,245,0.5)',
								color:''
							});
						}
					}
				});
				/* show */
				super.show();
			}
			else pd.alert(pd.constants.common.message.notfound[pd.lang]);
		}
		else pd.alert(pd.constants.common.message.invalid.parameter[pd.lang]);
	}
};
class panda_singlepicker extends panda_dialog{
	/* constructor */
	constructor(){
		super(999997,false,true);
		/* setup properties */
		this.limit=50;
		this.offset=0;
		this.table=null;
		this.columninfos={};
		this.filter=[];
		this.records=[];
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
		var row=null;
		var records=this.records;
		if (this.input.val())
		{
			var keywords=this.input.val().replace(/[　 ]+/g,' ').split(' ').filter((item) => item);
			records=records.filter((record) => {
				var exists=false;
				for (var key in record)
					if (record[key].value)
					{
						exists=keywords.some((item) => (record[key].value.toString().match(new RegExp(item,'ig'))));
						if (exists) break;
					}
				return exists;
			});
		}
		/* append records */
		this.filter=[];
		this.table.clearrows();
		for (var i=this.offset;i<this.offset+this.limit;i++)
			if (i<records.length)
			{
				row=this.table.addrow();
				for (var key in this.columninfos)
				{
					if (row.elm('#'+key).hasAttribute('data-decimals'))
					{
						if (records[i][key].value) row.elm('#'+key).html(Number(records[i][key].value).comma(row.elm('#'+key).attr('data-decimals')));
						else row.elm('#'+key).html(records[i][key].value);
					}
					else row.elm('#'+key).html(records[i][key].value);
				}
				this.filter.push(records[i]);
			}
		if (records.length>this.limit)
		{
			if (this.offset>0) this.prev.show();
			else this.prev.hide();
			if (this.offset+this.limit<records.length) this.next.show();
			else this.next.hide();
			this.input.css({paddingRight:'6.5em'});
		}
		else
		{
			this.prev.hide();
			this.next.hide();
			this.input.css({paddingRight:'2.5em'});
		}
		if (callback) callback();
	}
	/* show records */
	show(records,columninfos,callback){
		var cell=null;
		var div=this.parts.div.clone().css({
			borderTop:'1px solid #42a5f5',
			borderBottom:'1px solid #42a5f5',
			padding:'0px 0.5em'
		});
		var td=this.parts.td.clone().css({cursor:'pointer'});
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
		/* check records */
		if(records instanceof Array)
		{
			if (records.length!=0)
			{
				/* setup properties */
				this.offset=0;
				this.columninfos=columninfos;
				this.records=records;
				/* setup elements */
				this.input.val('');
				/* create table */
				this.table=this.parts.table.clone().css({marginBottom:'0.5em'})
				.append(pd.create('thead').append(pd.create('tr')))
				.append(pd.create('tbody').append(pd.create('tr')));
				for (var key in this.columninfos)
				{
					this.table.elm('thead tr').append(
						th.clone().css({
							width:(('width' in this.columninfos[key])?this.columninfos[key].width:'auto')
						})
						.append(div.clone().html(('text' in this.columninfos[key])?this.columninfos[key].text:''))
					);
					cell=td.clone().css({
						textAlign:(('align' in this.columninfos[key])?this.columninfos[key].align:'left')
					})
					.attr('id',key);
					if ('decimals' in this.columninfos[key]) cell.attr('data-decimals',this.columninfos[key].decimals);
					this.table.elm('tbody tr').append(cell);
				}
				this.contents.empty().append(
					this.table.spread((row,index) => {
						row.on('click',(e) => {
							if (callback) callback(this.filter[index]);
							this.hide();
						});
					})
				);
				/* show */
				this.search(() => super.show());
			}
			else pd.alert(pd.constants.common.message.notfound[pd.lang]);
		}
		else pd.alert(pd.constants.common.message.invalid.parameter[pd.lang]);
	}
};
class panda_chart{
	/* constructor */
	constructor(){
		/* setup properties */
		this.loaded=false;
		this.types=[
			'bar',
			'stacking_bar',
			'stacking_percent_bar',
			'column',
			'stacking_column',
			'stacking_percent_column',
			'pie',
			'line',
			'spline',
			'area',
			'scatter'
		];
	}
	/* chart script loaded */
	ready(){
		return new Promise((resolve,reject) => {
			if (!this.loaded)
			{
				/* load api */
				pd.elm('head').append(
					pd.create('script')
					.attr('src','https://www.gstatic.com/charts/loader.js')
					.attr('type','text/javascript')
					.on('load',(e) => {
						this.loaded=true;
						google.charts.load('current',{'packages':['corechart']});
						google.charts.setOnLoadCallback(() => resolve());
					})
					.on('error',(e) => {
						reject('Connect to network');
					})
				);
			}
			else resolve();
		});
	}
	/* reload chart */
	reloadchart(container,body){
		switch (body.type)
		{
			case 'area':
				new google.visualization.AreaChart(container).draw(google.visualization.arrayToDataTable(body.data),body.options);
				break;
			case 'bar':
				new google.visualization.BarChart(container).draw(google.visualization.arrayToDataTable(body.data),body.options);
				break;
			case 'stacking_bar':
				new google.visualization.BarChart(container).draw(google.visualization.arrayToDataTable(body.data),pd.extend({isStacked:true},body.options));
				break;
			case 'stacking_percent_bar':
				new google.visualization.BarChart(container).draw(google.visualization.arrayToDataTable(body.data),pd.extend({isStacked:'percent'},body.options));
				break;
			case 'column':
				new google.visualization.ColumnChart(container).draw(google.visualization.arrayToDataTable(body.data),body.options);
				break;
			case 'stacking_column':
				new google.visualization.ColumnChart(container).draw(google.visualization.arrayToDataTable(body.data),pd.extend({isStacked:true},body.options));
				break;
			case 'stacking_percent_column':
				new google.visualization.ColumnChart(container).draw(google.visualization.arrayToDataTable(body.data),pd.extend({isStacked:'percent'},body.options));
				break;
			case 'line':
				new google.visualization.LineChart(container).draw(google.visualization.arrayToDataTable(body.data),body.options);
				break;
			case 'pie':
				new google.visualization.PieChart(container).draw(google.visualization.arrayToDataTable(body.data),body.options);
				break;
			case 'scatter':
				new google.visualization.ScatterChart(container).draw(google.visualization.arrayToDataTable(body.data),body.options);
				break;
			case 'spline':
				new google.visualization.LineChart(container).draw(google.visualization.arrayToDataTable(body.data),pd.extend({curveType:'function'},body.options));
				break;
		}
	}
};
class panda_map{
	/* constructor */
	constructor(){
		/* setup properties */
		this.loaded=false;
		this.container=null;
		this.map=null;
		this.centerlocation=null;
		this.directionsRenderer=null;
		this.directionsService=null;
		this.geocoder=null;
		this.watchID=null;
		this.watchaccuracy=null;
		this.watchcurrent=new Date();
		this.watchstart=new Date();
		this.balloons=[];
		this.markers=[];
	}
	/* initialize */
	init(container,mapoption,idle,clicked,zoom){
		if (container)
		{
			this.container=container;
			this.map=new google.maps.Map(this.container,mapoption);
			this.directionsRenderer=new google.maps.DirectionsRenderer({suppressMarkers:true});
			this.directionsService=new google.maps.DirectionsService();
			/* idle event */
			google.maps.event.addListener(this.map,'idle',() => {
				this.centerlocation=((latlng) => {
					return (latlng)?new google.maps.LatLng(latlng.lat(),latlng.lng()):null;
				})(this.map.getCenter());
				if (idle) idle();
			});
			/* click event */
			if (clicked) google.maps.event.addListener(this.map,'click',(e) => this.searchaddress(e.latLng.lat(),e.latLng.lng(),(address,postalcode) => clicked(address,postalcode,e.latLng)));
			/* zoom event */
			if (zoom) google.maps.event.addListener(this.map,'zoom_changed',(e) => zoom(this.map.getZoom()));
			/* resize event */
			window.on('resize',(e) => this.map.setCenter(this.centerlocation));
		}
		this.geocoder=new google.maps.Geocoder();
	}
	/* get bounds */
	bounds(){
		var bounds=this.map.getBounds();
		var res={
			north:0,
			south:0,
			east:0,
			west:0,
			distance:{
				horizontal:0,
				vertical:0
			}
		};
		if (bounds)
		{
			res.north=bounds.getNorthEast().lat();
			res.south=bounds.getSouthWest().lat();
			res.east=bounds.getNorthEast().lng();
			res.west=bounds.getSouthWest().lng();
			res.distance.horizontal=(google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(res.north,res.east),new google.maps.LatLng(res.north,res.west)) / 1000).toFixed(2);
			res.distance.vertical=(google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(res.north,res.east),new google.maps.LatLng(res.south,res.east)) / 1000).toFixed(2);
		}
		return res;
	}
	/* close information widnow */
	closeinfowindow(){
		this.balloons.each((balloon,index) => balloon.close());
	}
	/* open information widnow */
	openinfowindow(){
		this.balloons.each((balloon,index) => {
			if (this.markers.length>index) balloon.open(this.map,this.markers[index]);
		});
	}
	/* map script loaded */
	ready(apikey){
		return new Promise((resolve,reject) => {
			if (!apikey) reject(pd.constants.map.message.invalid[pd.lang]);
			else
			{
				if (!this.loaded)
				{
					/* load api */
					pd.elm('head').append(
						pd.create('script')
						.attr('src','https://maps.googleapis.com/maps/api/js?libraries=geometry&key='+apikey+'&callback=pd.map.init')
						.attr('type','text/javascript')
						.on('load',(e) => {
							this.loaded=true;
							resolve(this);
						})
						.on('error',(e) => {
							reject('Connect to network');
						})
					);
				}
				else resolve(this);
			}
		});
	}
	/* reload map */
	reloadmap(markers,setupcenter=false,addroute=false,callback){
		/*
		* parameters
		* @markeroptions
		*	-backcolor
		*	-forecolor
		*	-fontsize
		*	-label
		*	-click
		*	-balloon
		*/
		var addmarker=(markeroptions,index) => {
			var backcolor=(markeroptions.backcolor || '#e60012');
			var forecolor=(markeroptions.forecolor || '#000000');
			var fontsize=(markeroptions.fontsize || '11')+'px';
			var marker=new google.maps.Marker({
				map:this.map,
				position:new google.maps.LatLng(markeroptions.lat,markeroptions.lng)
			});
			marker.setIcon({
				anchor:new google.maps.Point(17,34),
				fillColor:backcolor,
				fillOpacity:1,
				labelOrigin:new google.maps.Point(17,11),
				path:'M26.837,9.837C26.837,17.765,17,19.89,17,34 c0-14.11-9.837-16.235-9.837-24.163C7.163,4.404,11.567,0,17,0C22.432,0,26.837,4.404,26.837,9.837z',
				scale:1,
				strokeColor:"#696969"
			});
			if ('label' in markeroptions)
				if (markeroptions.label)
					marker.setLabel({
						color:forecolor,
						fontSize:fontsize,
						text:markeroptions.label
					});
			if ('click' in markeroptions) google.maps.event.addListener(marker,'click',(e) => markeroptions.click(index));
			else
			{
				/* append balloons */
				if ('balloon' in markeroptions)
				{
					var balloon=new google.maps.InfoWindow({content:markeroptions.balloon,disableAutoPan:true});
					balloon.open(this.map,marker);
					google.maps.event.addListener(marker,'click',(e) => {
						if (!balloon.getMap()) balloon.open(this.map,marker);
					});
					this.balloons.push(balloon);
				}
			}
			this.markers.push(marker);
		};
		/* initialize markers */
		this.markers.each((marker,index) => marker.setMap(null));
		this.markers=[];
		/* initialize balloons */
		this.balloons.each((balloon,index) => balloon.setMap(null));
		this.balloons=[];
		/* initialize renderer */
		this.directionsRenderer.setMap(null);
		switch (markers.length)
		{
			case 0:
				if (setupcenter) this.map.setCenter(new google.maps.LatLng(0,0));
				if (callback) callback();
				break;
			case 1:
				/* append markers */
				addmarker(markers.first(),0);
				/* setup center position */
				if (setupcenter) this.map.setCenter(new google.maps.LatLng(markers.first().lat,markers.first().lng));
				if (callback) callback();
				break;
			default:
				if (addroute)
				{
					/* setup routes */
					var origin=null;
					var destination=null;
					var waypoints=[];
					markers.each((marker,index) => {
						switch (index)
						{
							case 0:
								origin=new google.maps.LatLng(marker.lat,marker.lng);
								break;
							case markers.length-1:
								destination=new google.maps.LatLng(marker.lat,marker.lng);
								break;
							default:
								waypoints.push({
									location:new google.maps.LatLng(marker.lat,marker.lng),
									stopover:true
								});
								break;
						}
					});
					/* setup center position */
					if (setupcenter) this.map.setCenter(new google.maps.LatLng(markers.first().lat,markers.first().lng));
					/* display routes */
					this.directionsService.route({
						origin:origin,
						destination:destination,
						waypoints:waypoints,
						travelMode:google.maps.TravelMode.DRIVING
					},
					(result,status) => {
						if (status==google.maps.DirectionsStatus.OK)
						{
							/* append markers */
							markers.each((marker,index) => addmarker(marker,index));
							this.directionsRenderer.setDirections(result);
							this.directionsRenderer.setMap(this.map);
							if (callback) callback();
						}
					});
				}
				else
				{
					/* append markers */
					markers.each((marker,index) => addmarker(marker,index));
					/* setup center position */
					if (setupcenter) this.map.setCenter(new google.maps.LatLng(markers.first().lat,markers.first().lng));
					if (callback) callback();
				}
				break;
		}
	}
	/* search address */
	searchaddress(lat,lng,callback){
		this.geocoder.geocode({location:new google.maps.LatLng(lat,lng)},(results,status) => {
			switch (status)
			{
				case google.maps.GeocoderStatus.ZERO_RESULTS:
					if (callback) callback('','');
					break;
				case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
					pd.alert('OVER_QUERY_LIMIT');
					break;
				case google.maps.GeocoderStatus.REQUEST_DENIED:
					pd.alert('REQUEST_DENIED');
					break;
				case google.maps.GeocoderStatus.INVALID_REQUEST:
					pd.alert('INVALID_REQUEST');
					break;
				case 'OK':
					if (callback) callback(
						(() => {
							var res='';
							switch (pd.lang)
							{
								case 'en':
									res=results.first().formatted_address.replace(/[ ]*[0-9]+[^0-9]+$/g,'');
									break;
								case 'ja':
									res=results.first().formatted_address.replace(/^[^0-9]+[0-9]{3}-[0-9]{4}[ ]*/g,'');
									break;
							}
							return res;
						})(),
						((address_component) => {
							var filter=address_component.filter((item) => item.types.includes('postal_code'));
							return (filter.length!=0)?filter.first().long_name:'';
						})(results.first().address_components)
					);
					break;
			}
		});
	}
	/* search location */
	searchlocation(address,callback){
		this.geocoder.geocode({address:address,region:pd.locale[pd.lang]},(results,status) => {
			switch (status)
			{
				case google.maps.GeocoderStatus.ZERO_RESULTS:
					if (callback) callback('','');
					break;
				case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
					pd.alert('OVER_QUERY_LIMIT');
					break;
				case google.maps.GeocoderStatus.REQUEST_DENIED:
					pd.alert('REQUEST_DENIED');
					break;
				case google.maps.GeocoderStatus.INVALID_REQUEST:
					pd.alert('INVALID_REQUEST');
					break;
				case 'OK':
					if (callback) callback(results.first().geometry.location.lat(),results.first().geometry.location.lng());
					break;
			}
		});
	}
	/* watch location */
	watchlocation(continuous,callback){
		if (navigator.geolocation)
		{
			var userAgent=window.navigator.userAgent.toLowerCase();
			if (userAgent.indexOf('msie')!=-1 || userAgent.indexOf('trident')!=-1) alert(pd.constants.common.message.invalid.uncompatible[pd.lang]);
			this.watchaccuracy=Number.MAX_SAFE_INTEGER;
			this.watchstart=new Date();
			this.watchID=navigator.geolocation.watchPosition(
				(pos) => {
					if (continuous) callback(new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude));
					else
					{
						this.watchcurrent=new Date();
						if (this.watchaccuracy>pos.coords.accuracy) this.centerlocation=new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
						if (pos.coords.accuracy<300 || this.watchcurrent.getTime()-this.watchstart.getTime()>500)
						{
							callback(this.centerlocation);
							this.unwatchlocation();
						}
					}
				},
				(error) => {
					switch (error.code)
					{
						case 1:
							pd.alert('PERMISSION_DENIED<br>'+error.message);
							break;
						case 2:
							pd.alert('POSITION_UNAVAILABLE<br>'+error.message);
							break;
					}
					this.unwatchlocation();
				},
				{
					enableHighAccuracy:true,
					maximumAge:0,
					timeout:500
				}
			);
		}
		else pd.alert(pd.constants.common.message.invalid.uncompatible[pd.lang]);
	}
	/* clear watch location */
	unwatchlocation(){
		if (navigator.geolocation) navigator.geolocation.clearWatch(this.watchID);
		this.watchID=null;
	}
};
class panda_panelizer{
	/* constructor */
	constructor(){
		var div=pd.create('div');
		/* initialize valiable */
		div.css({
			boxSizing:'border-box',
			position:'relative'
		});
		/* setup properties */
		this.cover=div.clone().css({
			backgroundColor:'rgba(0,0,0,0.5)',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999997'
		})
		.on('click',(e) => this.hide());
		this.container=div.clone().css({
			height:'100%',
			overflowX:'auto',
			overflowY:'hidden',
			padding:'1em 0.5em',
			textAlign:'center',
			verticalAlign:'middle',
			whiteSpace:'nowrap',
			width:'100%'
		});
		/* integrate elements */
		pd.elm('body')
		.append(
			this.cover
			.append(this.container)
		);
	}
	/* show images */
	show(elements){
		var img=pd.create('img');
		/* clear images */
		this.container.empty();
		/* create images */
		elements.each((element,index) => {
			if (element.tagName.toLowerCase()=='img')
				if (element.src)
					this.container.append(
						img.clone().css({
							boxSizing:'border-box',
							display:'inline-block',
							margin:'0px 0.5em',
							maxHeight:'100%',
							maxWidth:'calc(100% - 2em)',
							position:'relative',
							verticalAlign:'middle'
						})
						.attr('src',element.src)
						.on('click',(e) => this.hide())
					);
		});
		/* create elements for adjusting the height */
		this.container.append(
			pd.create('div').css({
				boxSizing:'border-box',
				display:'inline-block',
				height:'100%',
				verticalAlign:'middle',
				width:'0px'
			})
		);
		/* show */
		this.cover.css({display:'block',zIndex:pd.window.alert.cover.style.zIndex-2});
	}
	/* hide */
	hide(){
		this.cover.css({display:'none'});
	}
};
class panda_popupwindow extends panda_dialog{
	/* constructor */
	constructor(innerElements,width,height,buttons,callback){
		super(999996,false,true);
		/* setup properties */
		if (pd.isnumeric(width)) this.container.css({width:width+'px'});
		else
		{
			if (width=='full') this.container.css({width:'100%'});
		}
		if (pd.isnumeric(height)) this.container.css({height:height+'px'});
		else
		{
			if (height=='full') this.container.css({height:'100%'});
		}
		this.close.off('click').on('click',(e) => {
			this.hide();
			if (callback) callback();
			e.stopPropagation();
			e.preventDefault();
		});
		/* modify elements */
		if (Array.isArray(buttons))
		{
			this.header.css({textAlign:'left'});
			buttons.each((button,index) => this.header.append(this.parts.icon.clone().attr('src',button.src)).on('click',(e) => button.handler()));
		}
		this.contents.css({overflow:'auto',padding:'0.5em'}).append(innerElements.css({margin:'0px auto'}))
	}
};
class panda_loader{
	/* constructor */
	constructor(){
		var span=pd.create('span');
		var keyframes={};
		var vendors=['-webkit-',''];
		/* initialize valiable */
		keyframes['0%']={
			'transform':'translateY(0);'
		};
		keyframes['25%']={
			'transform':'translateY(0);'
		};
		keyframes['50%']={
			'transform':'translateY(-0.5em);'
		};
		keyframes['100%']={
			'transform':'translateY(0);'
		};
		span.css({
			color:'#ffffff',
			display:'inline-block',
			lineHeight:'2em',
			padding:'0px 1px',
			verticalAlign:'top',
			WebkitAnimationName:'loading',
			WebkitAnimationDuration:'1s',
			WebkitAnimationTimingFunction:'ease-out',
			WebkitAnimationIterationCount:'infinite',
			animationName:'loading',
			animationDuration:'1s',
			animationTimingFunction:'ease-out',
			animationIterationCount:'infinite'
		});
		/* setup properties */
		this.cover=pd.create('div').css({
			backgroundColor:'rgba(0,0,0,0.5)',
			boxSizing:'border-box',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999998'
		});
		this.container=pd.create('p').css({
			bottom:'0',
			fontSize:'0.8em',
			height:'2em',
			left:'0',
			margin:'auto',
			maxHeight:'100%',
			maxWidth:'100%',
			overflow:'hidden',
			padding:'0px',
			position:'absolute',
			right:'0',
			textAlign:'center',
			top:'0',
			width:'100%'
		});
		/* append styles */
		pd.elm('head').append(
			pd.create('style')
			.attr('media','screen')
			.attr('type','text/css')
			.text(vendors.map((item) => '@'+item+'keyframes loading'+JSON.stringify(keyframes).replace(/:{/g,'{').replace(/[,"]/g,'')).join(' '))
		);
		/* integrate elements */
		pd.elm('body')
		.append(
			this.cover
			.append(
				this.container
				.append(
					pd.create('span').css({
						color:'#ffffff',
						display:'inline-block',
						lineHeight:'2em',
						paddingRight:'0.25em',
						verticalAlign:'top'
					})
					.html('Please wait a moment')
				)
				.append(span.clone().css({animationDelay:'0s'}).html('.'))
				.append(span.clone().css({animationDelay:'0.1s'}).html('.'))
				.append(span.clone().css({animationDelay:'0.2s'}).html('.'))
				.append(span.clone().css({animationDelay:'0.3s'}).html('.'))
				.append(span.clone().css({animationDelay:'0.4s'}).html('.'))
			)
		);
	}
	/* show */
	show(){
		this.cover.css({display:'block',zIndex:pd.window.alert.cover.style.zIndex-1});
	}
	/* hide */
	hide(){
		this.cover.css({display:'none'});
	}
};
class panda_progress{
	/* constructor */
	constructor(){
		/* setup properties */
		this.counter=0;
		this.cover=pd.create('div').css({
			backgroundColor:'rgba(0,0,0,0.5)',
			boxSizing:'border-box',
			display:'none',
			height:'100%',
			left:'0px',
			position:'fixed',
			top:'0px',
			width:'100%',
			zIndex:'999998'
		});
		this.container=pd.create('p').css({
			bottom:'0',
			fontSize:'0.8em',
			height:'2em',
			left:'0',
			margin:'auto',
			maxHeight:'100%',
			maxWidth:'100%',
			overflow:'hidden',
			padding:'0px',
			position:'absolute',
			right:'0',
			textAlign:'center',
			top:'0',
			width:'100%'
		});
		this.monitor=pd.create('span').css({
			color:'#ffffff',
			display:'inline-block',
			lineHeight:'2em',
			verticalAlign:'top'
		});
		this.progress=pd.create('div').css({
			backgroundColor:'#ffffff',
			bottom:'0',
			display:'inline-block',
			height:'1em',
			left:'0',
			position:'absolute',
			width:'0'
		});
		/* integrate elements */
		pd.elm('body')
		.append(
			this.cover
			.append(this.container.append(this.monitor))
			.append(this.progress)
		);
	}
	/* update */
	update(){
		this.counter++;
		this.monitor.html(Math.ceil((this.counter/this.max)*100).toString()+'% complete');
		this.progress.css({width:'calc(100% * '+(this.counter/this.max).toString()+')'});
		this.cover.css({display:'block'});
	}
	/* show */
	show(max){
		this.counter=0;
		this.max=(max)?max:1;
		this.monitor.html('');
		this.progress.css({width:'0'});
		this.cover.css({display:'block',zIndex:pd.window.alert.cover.style.zIndex-1});
	}
	/* hide */
	hide(){
		this.cover.css({display:'none'});
	}
};
var pd=new panda();
/*
DOM extention
*/
HTMLDocument.prototype.off=function(type,handler){
	((Array.isArray(type))?type:type.split(',').map((item) => item.trim())).each((type,index) => {
		if (type)
		{
			if (handler) this.removeEventListener(type,handler);
			else
			{
				if (this in pd.eventhandlers)
					if (type in pd.eventhandlers[this])
						pd.eventhandlers[this][type].each((handler,index) => this.removeEventListener(type,handler));
			}
		}
	});
	return this;
}
HTMLDocument.prototype.on=function(type,handler){
	((Array.isArray(type))?type:type.split(',').map((item) => item.trim())).each((type,index) => {
		if (type)
		{
			if (!(this in pd.eventhandlers)) pd.eventhandlers[this]={};
			if (!(type in pd.eventhandlers[this])) pd.eventhandlers[this][type]=[];
			pd.eventhandlers[this][type].push(handler);
			this.addEventListener(type,handler);
		}
	});
	return this;
}
HTMLElement.prototype.addclass=function(classname){
	classname.split(' ').each((classname,index) => {
		if (classname) this.classList.add(classname);
	});
	return this;
}
HTMLElement.prototype.append=function(element){
	this.appendChild(element);
	return this;
}
HTMLElement.prototype.attr=function(name,value){
	if (typeof value!=='undefined')
	{
		this.setAttribute(name,value);
		return this;
	}
	else return this.getAttribute(name);
}
HTMLElement.prototype.clone=function(){
	var clone=this.cloneNode(true);
	if (this.tagName.toLowerCase()=='select') clone.value=this.value;
	else clone.elms('select').each((element,index) => element.value=this.elms('select')[index].value);
	return clone;
}
HTMLElement.prototype.closest=function(selectors){
	var search=(element) => {
		if (!(element.parentNode instanceof HTMLDocument))
		{
			if (element.parentNode.matches(selectors)) return element.parentNode;
			else return search(element.parentNode);
		}
		else return null;
	};
	return search(this);
}
HTMLElement.prototype.css=function(properties){
	if (typeof properties!=='string')
	{
		for (var key in properties) this.style[key]=properties[key];
		return this;
	}
	else return (this.currentStyle)?this.currentStyle[properties]:document.defaultView.getComputedStyle(this,null).getPropertyValue(properties);
}
HTMLElement.prototype.elm=function(selectors){
	return this.querySelector(selectors);
}
HTMLElement.prototype.elms=function(selectors){
	return Array.from(this.querySelectorAll(selectors));
}
HTMLElement.prototype.empty=function(){
	this.innerHTML='';
	return this;
}
HTMLElement.prototype.hasclass=function(className){
	return this.classList.contains(className);
}
HTMLElement.prototype.hide=function(){
	var event=new Event('hide');
	this.css({display:'none'});
	this.elms('*').each((element,index) => {
		if (typeof element.visible==='function')
			if (!element.visible()) element.dispatchEvent(event);
	});
	return this;
}
HTMLElement.prototype.html=function(value){
	if (typeof value!=='undefined')
	{
		this.innerHTML=value;
		return this;
	}
	else return this.innerHTML;
}
HTMLElement.prototype.innerheight=function(){
	var paddingTop=this.css('padding-top');
	var paddingBottom=this.css('padding-bottom');
	if (!paddingTop) paddingTop='0';
	if (!paddingBottom) paddingBottom='0';
	return this.clientHeight-parseFloat(paddingTop)-parseFloat(paddingBottom);
}
HTMLElement.prototype.innerwidth=function(){
	var paddingLeft=this.css('padding-left');
	var paddingRight=this.css('padding-right');
	if (!paddingLeft) paddingLeft='0';
	if (!paddingRight) paddingRight='0';
	return this.clientWidth-parseFloat(paddingLeft)-parseFloat(paddingRight);
}
HTMLElement.prototype.initialize=function(){
	this.alert=pd.create('div').css({
		display:'none',
		margin:'-0.5em 0px 0px 0px',
		transition:'none',
		zIndex:pd.window.alert.cover.style.zIndex-4
	})
	.append(
		pd.create('img').css({
			display:'block',
			height:'0.75em',
			margin:'0px 0px 0px 1.5em',
			position:'relative',
			width:'0.75em'
		})
		.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QkVGNzA3QTE1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QkVGNzA3QTI1RTc4MTFFOEI5MDA5RUE2NDFCQTUzNDciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCRUY3MDc5RjVFNzgxMUU4QjkwMDlFQTY0MUJBNTM0NyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCRUY3MDdBMDVFNzgxMUU4QjkwMDlFQTY0MUJBNTM0NyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PkBlNTAAAADNSURBVHja7NHBCcJAFATQZNBcYwmSmycPlpI2bCVgAVqAVmAFHmxqncAKQVyz+/N/grADc0iyy0Be6ZwrlgiKhZKH83Ae/v/h1X23l9499vfZk2hYOHpgO7ZkH+xzjl9dsze2Ytfsld3MMXxhm8Hzlj1bD/eu7Zf3rf9mMvx2DaXzZ1SHh66hVP5MrTn86RpK48+qDIdcQ4nyxkRXsTcmuoq9oeAq8oaSa7I3FF2TvKHomuQNZddobxi4RnnDyHXUG0auo94wdP3p/RJgAMw4In5GE/6/AAAAAElFTkSuQmCC')
	)
	.append(
		pd.create('span').css({
			backgroundColor:'#b7282e',
			borderRadius:'0.25em',
			color:'#ffffff',
			display:'block',
			lineHeight:'2em',
			margin:'0px',
			padding:'0px 0.5em',
			position:'relative'
		})
	);
	var transition=(e) => {
		var code=e.keyCode||e.which;
		if (code==13)
		{
			var elements=pd.elms('button[tabstop=tabstop],input,select,textarea').filter((element) => {
				var exists=0;
				if (element.visible())
				{
					if (element.hasAttribute('tabindex'))
						if (element.attr('tabindex')=='-1') exists++;
					if (element.tagName.toLowerCase()=='input')
						if (element.type.toLowerCase().match(/(color|file)/g)) exists++;
				}
				else exists++;
				return exists==0;
			});
			var total=elements.length;
			var index=elements.indexOf(e.currentTarget)+(e.shiftKey?-1:1);
			elements[(index<0)?total-1:((index>total-1)?0:index)].focus();
			e.stopPropagation();
			e.preventDefault();
			return false;
		}
	};
	/* setup focus transition */
	switch (this.tagName.toLowerCase())
	{
		case 'input':
			switch (this.type.toLowerCase())
			{
				case 'button':
				case 'color':
				case 'file':
				case 'image':
				case 'reset':
					break;
				default:
					this
					.on('keydown',transition)
					.on('focus',(e) => this.beforevalue=e.currentTarget.val())
					.on('blur',(e) => {
						if (e.currentTarget.hasAttribute('data-padding'))
						{
							var param=e.currentTarget.attr('data-padding').split(':');
							var value=e.currentTarget.val();
							if (param.length==3)
							{
								if (value===undefined || value===null) value='';
								if (param[2]=='L') e.currentTarget.val(value.toString().lpad(param[0],param[1]));
								else  e.currentTarget.val(value.toString().rpad(param[0],param[1]));
							}
						}
					});
					break;
			}
			break;
		case 'select':
			this
			.on('keydown',transition)
			.on('focus',(e) => this.beforevalue=e.currentTarget.val());
			break;
	}
	/* setup required */
	if (this.hasAttribute('required'))
	{
		var placeholder=this.attr('placeholder');
		if (placeholder) placeholder=placeholder.replace(/^required /g,'')
		this.attr('placeholder','* '+((placeholder)?placeholder:''));
	}
	/* setup validation */
	if (this.hasAttribute('data-type'))
		switch (this.attr('data-type'))
		{
			case 'alphabet':
				this.attr('pattern','^[A-Za-z!"#$%&\'()*,\\-.\\/:;<>?@\\[\\\\\\]\\^_`{|}~ ]+$');
				break;
			case 'alphanum':
				this.attr('pattern','^[0-9A-Za-z!"#$%&\'()*,\\-.\\/:;<>?@\\[\\\\\\]\\^_`{|}~ ]+$');
				break;
			case 'color':
				this.attr('pattern','^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$');
				break;
			case 'date':
				this.attr('pattern','^[1-9][0-9]{3}[\\-.\\/]+([1-9]{1}|0[1-9]{1}|1[0-2]{1})[\\-.\\/]+([1-9]{1}|[0-2]{1}[0-9]{1}|3[01]{1})$')
				.on('focus',(e) => e.currentTarget.val(e.currentTarget.val().replace(/[^0-9]+/g,'')))
				.on('blur',(e) => {
					var value=e.currentTarget.val().replace(/[^0-9]+/g,'');
					if (value.length==8) e.currentTarget.val(value.substr(0,4)+'-'+value.substr(4,2)+'-'+value.substr(6,2));
				});
				break;
			case 'datetime':
				this.attr('pattern','^[1-9][0-9]{3}[\\-.\\/]+([1-9]{1}|0[1-9]{1}|1[0-2]{1})[\\-.\\/]+([1-9]{1}|[0-2]{1}[0-9]{1}|3[01]{1}) [0-9]{1,2}:[0-9]{1,2}$');
				break;
			case 'mail':
				this.attr('pattern','^[0-9A-Za-z]+[0-9A-Za-z.!#$%&\'*+\\-\\/?\\\\\\^_`{|}~]*@[0-9A-Za-z]+[0-9A-Za-z._-]*\\.[a-z]+$');
				break;
			case 'number':
				this.attr('pattern','^[0-9,\\-.]+$')
				.css({textAlign:'right'})
				.on('focus',(e) => e.currentTarget.val(e.currentTarget.val().replace(/[^-0-9.]+/g,'')))
				.on('blur',(e) => {
					var value=e.currentTarget.val().replace(/[^-0-9.]+/g,'');
					if (value) e.currentTarget.val(Number(value).comma(this.attr('data-decimals')));
				});
				break;
			case 'nondemiliternumber':
				this.attr('pattern','^[0-9\\-.]+$').css({textAlign:'right'});
				break;
			case 'postalcode':
				this.attr('pattern','^[0-9]{3}-?[0-9]{4}$')
				.on('focus',(e) => e.currentTarget.val(e.currentTarget.val().replace(/[^0-9]+/g,'')))
				.on('blur',(e) => {
					var value=e.currentTarget.val().replace(/[^0-9]+/g,'');
					if (value.length==7) e.currentTarget.val(value.substr(0,3)+'-'+value.substr(3,4));
				});
				break;
			case 'tel':
				this.attr('pattern','^0[0-9]{1,3}-?[0-9]{2,4}-?[0-9]{3,4}$');
				break;
			case 'time':
				this.attr('pattern','^[0-9]{1,2}:[0-9]{1,2}$');
				break;
			case 'url':
				this.attr('pattern','^https?:\\/\\/[0-9A-Za-z!"#$%&\'()*,\\-.\\/:;<>?@\\[\\\\\\]\\^_`{|}~=]+$');
				break;
			case 'urldirectory':
				this.attr('pattern','^[0-9a-z\\-_.!\']+$');
				break;
		}
	/* integrate elements */
	switch (this.tagName.toLowerCase())
	{
		case 'select':
			this.parentNode.parentNode.append(this.alert);
			break;
		default:
			this.parentNode.append(this.alert);
			break;
	}
	/* validation event */
	return this.on('invalid',(e) => {
		/* validate required */
		if (e.currentTarget.validity.valueMissing) this.alert.elm('span').html(pd.constants.common.message.invalid.required[pd.lang]).parentNode.show();
		/* validate pattern */
		if (e.currentTarget.validity.patternMismatch) this.alert.elm('span').html(pd.constants.common.message.invalid.unmatch.pattern[pd.lang]).parentNode.show();
		/* validate type */
		if (e.currentTarget.validity.typeMismatch) this.alert.elm('span').html(pd.constants.common.message.invalid.unmatch.format[pd.lang]).parentNode.show();
	}).on('focus',(e) => this.alert.hide());
}
HTMLElement.prototype.isempty=function(){
	var exists=false;
	this.elms('input,select,textarea').each((element,index) => {
		switch (element.tagName.toLowerCase())
		{
			case 'input':
				switch (element.type.toLowerCase())
				{
					case 'button':
					case 'image':
					case 'radio':
					case 'reset':
						break;
					case 'checkbox':
						if (!exists) exists=element.checked;
						break;
					case 'color':
						if (!exists) exists=(element.val()!='#000000');
						break;
					case 'range':
						var max=(element.max)?parseFloat(element.max):100;
						var min=(element.min)?parseFloat(element.min):0;
						if (!exists) exists=(element.val()!=(max-min)/2);
						break;
					default:
						if (!exists) exists=(element.val());
						break;
				}
				break;
			case 'select':
				if (!exists) exists=(element.selectedIndex);
				break;
			default:
				if (!exists) exists=(element.val());
				break;
		}
	});
	return !exists;
}
HTMLElement.prototype.off=function(type,handler){
	((Array.isArray(type))?type:type.split(',').map((item) => item.trim())).each((type,index) => {
		if (type)
		{
			if (handler) this.removeEventListener(type,handler);
			else
			{
				if (this in pd.eventhandlers)
					if (type in pd.eventhandlers[this])
						pd.eventhandlers[this][type].each((handler,index) => this.removeEventListener(type,handler));
			}
		}
	});
	return this;
}
HTMLElement.prototype.on=function(type,handler){
	((Array.isArray(type))?type:type.split(',').map((item) => item.trim())).each((type,index) => {
		if (type)
		{
			if (!(this in pd.eventhandlers)) pd.eventhandlers[this]={};
			if (!(type in pd.eventhandlers[this])) pd.eventhandlers[this][type]=[];
			pd.eventhandlers[this][type].push(handler);
			this.addEventListener(type,handler);
		}
	});
	return this;
}
HTMLElement.prototype.outerheight=function(includemargin){
	if (includemargin)
	{
		var marginTop=this.css('margin-top');
		var marginBottom=this.css('margin-bottom');
		if (!marginTop) marginTop='0';
		if (!marginBottom) marginBottom='0';
		return this.getBoundingClientRect().height+parseFloat(marginTop)+parseFloat(marginBottom);
	}
	return this.getBoundingClientRect().height;
}
HTMLElement.prototype.outerwidth=function(includemargin){
	if (includemargin)
	{
		var marginLeft=this.css('margin-left');
		var marginRight=this.css('margin-right');
		if (!marginLeft) marginLeft='0';
		if (!marginRight) marginRight='0';
		return this.getBoundingClientRect().width+parseFloat(marginLeft)+parseFloat(marginRight);
	}
	return this.getBoundingClientRect().width;
}
HTMLElement.prototype.pager=function(offset,limit,records,total,callback){
	var error=false;
	var img=pd.create('img').css({
		backgroundColor:'transparent',
		border:'none',
		boxSizing:'border-box',
		cursor:'pointer',
		display:'inline-block',
		height:'2em',
		position:'relative',
		width:'2em'
	});
	var span=pd.create('span').css({
		display:'inline-block',
		lineHeight:'2em',
		padding:'0px 0.25em',
		verticalAlign:'top'
	});
	if (!pd.isnumeric(offset)) error=true;
	if (!pd.isnumeric(limit)) error=true;
	if (!pd.isnumeric(records)) error=true;
	if (!pd.isnumeric(total)) error=true;
	if (!error)
	{
		this.empty();
		if (parseInt(offset)>0)
		{
			this.append(
				img.clone()
				.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjZJREFUeNpiYKAJ6J8y8T+MzYIm0QCk6pHFmNA016ObhqKgMCefkfoOBggg6vr9Psz/LLgCBcVb6BI4gxSvQqJMAQggugYDinNYSNVAUDOxHmbCJghNRo2ENDMSG+VASoGq6RMggIY7Agbae6Limdh4ZyGgaT2QCiAphRGbyliwaALZtJ7s5EksYCTF2ehJE6fNUIUbqFIIUFQuYUskAwcAAmgUUTP3F5CUpSi0DD07TqCZxUDLQBXBfVL1sZBpmQCQoiiPsJCRIQWoES3ENAn2AykHaic+Rlr6GF8DgJGWcUx1i4lN1TS1GF8+HpC2FqGSa+QBgAAaRaNgFBBVcJDVm6BCL4uo2ouFShYaAKnzNG/6oFkKstCALm0uarS7mMi0tJ+ujT1i+79UtRhav/ZTKwewUDubULN5S5MRO4KJC9pu+kB3i6GWC4KoAWvQkxL0hFqYJOdjqIET6BLUWCwHBbsg3S2GWv4B6vsLdLUYyQGGQMqQ5omL2IKG6omL3tluFIwCkgFAgPbN6AZAGASi1XQQR3BD3aSrGhLilzZqoQK9iwu8RLnrUfFAEORKbla63NNSRbq21KPZOCQFqJIqC133wAxJt2FU+uZsCHRPF9d+QgFzq7FJlwymgHk/U3pCdgfmgpMm7PL3p5MVIU8bsTQUpbtxcRsxB6xtI9Ka02CaPL7SLdFSLUtrDi2TwJq2ZB5YOni4ApaIlm6Bvx4eQgC/8fVQwE9sLizwnc3hbwMIgobRAdIK28oCHbudAAAAAElFTkSuQmCC')
				.on('click',(e) => {
					if (callback) callback(parseInt(offset)-parseInt(limit));
				})
			);
		}
		this.append(span.clone().html((parseInt(offset)+1).comma()));
		this.append(span.clone().html('-'));
		this.append(span.clone().html((parseInt(offset)+parseInt(records)).comma()));
		this.append(span.clone().html('in'));
		this.append(span.clone().html(parseInt(total).comma()));
		if (parseInt(offset)+parseInt(records)<total)
		{
			this.append(
				img.clone()
				.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAi1JREFUeNpiYKAa6J8y8T8Q30cXZ0LjK4AU4lMANw3GZkGXLMzJZ2QgpIskABBAVPI/Xr9DA6gBn7/rcUri9DNJACCAaO9lXICRkGZ8HmQkxWZ0g5iIdGEjNhew4NHwAKhBkWaBCxBAwwUBo+o9sWqxRZUAsamMiUDJtJ4szVAQgM8VTMRmFiAOIEszLsBCjCJcOYuQzRvwZUkWUm2jWiIZOAAQQKMIW8QV0MJcRmKyExI3EJjsNgyExchAEeiIBwNhMTIQBDriw0BYDAMfgA4QHAiLkcEBoCMcKSo1aeFjallMchxTYjFFqZpUi6mWjwes5Bp5ACCARtEoGJlNn/+0KESI7RD0U7vRTEpPRADqewN6WwwD54GWnx/Ixh5Z9TBVOn1A8B7osP6BsBgECshplzENVLZjona2JzbbUdtiogdDaGHxB2K69dS2uJDe7WqSBy+o4eMJ5IyYUOpjsksuci2+ALTQkBIXk2OxIdDSC5TGDwuJ2USQWomRidrZZBSMggEHAAHaNaMbAEEYiBLDgo7AJo7gaI7gCI5giMSAn0LLNb0XBuAlhF4LXIQQU3Q/vZfcnsPI2jNPtSZck+e66W/utCjcpPzw/DC4vAjXZPHNk/DbDxT53YvwVz6pvecACNec5aY/vAg3zb5UmUMVFitzFoSHlrklOCMa2OPQI40qLHZpIQmrlKXZwurBI06SnBYtNYUhmgdpYbj2UEIYegAwStjMiIcQQkxxA49895hLUEtfAAAAAElFTkSuQmCC')
				.on('click',(e) => {
					if (callback) callback(parseInt(offset)+parseInt(limit));
				})
			);
		}
	}
	else pd.alert(pd.constants.common.message.invalid.parameter[pd.lang]);
	return this;
}
HTMLElement.prototype.popup=function(width,height,buttons,callback){
	return new panda_popupwindow(this,width,height,buttons,callback);
}
HTMLElement.prototype.removeattr=function(name){
	this.removeAttribute(name);
	return this;
}
HTMLElement.prototype.removeclass=function(className){
	this.classList.remove(className);
	return this;
}
HTMLElement.prototype.show=function(type='block'){
	var event=new Event('show');
	this.css({display:type});
	this.elms('*').each((element,index) => {
		if (typeof element.visible==='function')
			if (element.visible()) element.dispatchEvent(event);
	});
	return this;
}
HTMLElement.prototype.siblings=function(selectors){
	var elements=(typeof selectors!=='undefined')?Array.from(this.parentNode.querySelectorAll(selectors)):pd.children(this.parentNode);
	return elements.filter((item) => item!=this);
}
HTMLElement.prototype.spread=function(addcallback,delcallback,autoadd=true){
	/* setup properties */
	this.container=this.elm('tbody');
	this.tr=pd.children(this.container);
	this.template=this.tr.first().clone();
	this.addrow=(putcallback=true) => {
		var row=this.template.clone();
		this.container.append(row);
		/* setup properties */
		this.tr=pd.children(this.container);
		/* setup handler */
		var handler=(e) => {
			if (autoadd)
				if (e.currentTarget.value)
					if (!this.tr.last().isempty()) this.addrow();
		};
		row.elms('input,select,textarea').each((element,index) => {
			switch (element.initialize().tagName.toLowerCase())
			{
				case 'input':
					switch (element.type.toLowerCase())
					{
						case 'button':
						case 'image':
						case 'radio':
						case 'reset':
							break;
						case 'checkbox':
						case 'color':
						case 'date':
						case 'datetime-local':
						case 'file':
						case 'month':
						case 'range':
						case 'time':
						case 'week':
							element.on('change',handler);
							break;
						case 'number':
							element.on('mouseup,keyup',handler);
							break;
						default:
							element.on('keyup',handler);
							break;
					}
					break;
				case 'select':
					element.on('change',handler);
					break;
				case 'textarea':
					element.on('keyup',handler);
					break;
			}
		});
		if (putcallback)
			if (addcallback) addcallback(row,this.tr.length-1);
		return row;
	};
	this.delrow=(row) => {
		var index=this.tr.indexOf(row);
		this.container.removeChild(row);
		/* setup properties */
		this.tr=pd.children(this.container);
		if (autoadd)
		{
			if (this.tr.length==0) this.addrow();
			else
			{
				if (!this.tr.last().isempty()) this.addrow();
			}
		}
		if (delcallback) delcallback(this,index);
	};
	this.insertrow=(row) => {
		var add=this.addrow(false);
		this.container.insertBefore(add,row.nextSibling);
		/* setup properties */
		this.tr=pd.children(this.container);
		if (addcallback) addcallback(add,this.tr.indexOf(add));
		return add;
	};
	this.clearrows=() => {
		this.tr.each((element,index) => this.container.removeChild(element));
		/* setup properties */
		this.tr=[];
	};
	/* setup rows */
	this.clearrows();
	if (autoadd) this.addrow();
	return this;
}
HTMLElement.prototype.text=function(value){
	if (typeof value!=='undefined')
	{
		this.textContent=value;
		return this;
	}
	else
	{
		var value=this.textContent;
		if (value)
			if (this.hasAttribute('data-type'))
				switch (this.attr('data-type'))
				{
					case 'date':
						if (value.length==8)
							if (pd.isnumeric(value))
								value=value.substr(0,4)+'-'+value.substr(4,2)+'-'+value.substr(6,2);
						break;
					case 'number':
						value=value.replace(/,/g,'');
						break;
				}
		return value;
	}
}
HTMLElement.prototype.val=function(value){
	if (typeof value!=='undefined')
	{
		this.value=value;
		return this;
	}
	else
	{
		var value=this.value;
		if (value)
			if (this.hasAttribute('data-type'))
				switch (this.attr('data-type'))
				{
					case 'date':
						if (value.length==8)
							if (pd.isnumeric(value))
								value=value.substr(0,4)+'-'+value.substr(4,2)+'-'+value.substr(6,2);
						break;
					case 'number':
						value=value.replace(/,/g,'');
						break;
				}
		return value;
	}
}
HTMLElement.prototype.visible=function(){
	return !(this.getBoundingClientRect().width==0 && this.getBoundingClientRect().height==0);
}
HTMLImageElement.prototype.assignfile=function(file){
	var reader=new FileReader();
	reader.onload=((readData) => {
		this.attr('src',readData.target.result);
	});
	reader.readAsDataURL(file);
	return this;
}
HTMLSelectElement.prototype.assignoption=function(records,label,value){
	records.each((record,index) => {
		this.append(
			pd.create('option')
			.attr('value',record[value].value)
			.html(record[label].value)
		);
	});
	return this;
}
HTMLSelectElement.prototype.filteroption=function(options){
	this.elms('option').each((element,index) => {
		if (element.parentNode.tagName.toLowerCase()=='span')
		{
			((span) => {
				this.insertBefore(element,span);
				this.removeChild(span);
			})(element.parentNode);
		}
	});
	if (((Array.isArray(options))?options:[]).length!=0)
	{
		this.elms('option').each((element,index) => {
			if (!options.includes(element.val()))
			{
				if (element.parentNode.tagName.toLowerCase()!='span')
					((span) => {
						element.parentNode.insertBefore(span,element);
						span.append(element);
					})(pd.create('span').css({display:'none'}));
			}
		});
	}
	return this;
}
HTMLSelectElement.prototype.selectedtext=function(){
	if (this.options.length!=0)	return (this.selectedIndex!=-1)?this.options[this.selectedIndex].textContent:'';
	else return '';
}
Window.prototype.off=function(type,handler){
	((Array.isArray(type))?type:type.split(',').map((item) => item.trim())).each((type,index) => {
		if (type)
		{
			if (handler) this.removeEventListener(type,handler);
			else
			{
				if (this in pd.eventhandlers)
					if (type in pd.eventhandlers[this])
						pd.eventhandlers[this][type].each((handler,index) => this.removeEventListener(type,handler));
			}
		}
	});
	return this;
}
Window.prototype.on=function(type,handler){
	((Array.isArray(type))?type:type.split(',').map((item) => item.trim())).each((type,index) => {
		if (type)
		{
			if (!(this in pd.eventhandlers)) pd.eventhandlers[this]={};
			if (!(type in pd.eventhandlers[this])) pd.eventhandlers[this][type]=[];
			pd.eventhandlers[this][type].push(handler);
			this.addEventListener(type,handler);
		}
	});
	return this;
}
/*
Array extention
*/
Array.prototype.each=function(handler){
	for (var i=0;i<this.length;i++)
	{
		var result=handler(this[i],i);
		if (result===PD_BREAK) break;
		if (result===PD_SKIP) i++;
	}
}
Array.prototype.first=function(){
	return this[0];
}
Array.prototype.last=function(){
	return this[this.length-1];
}
Array.prototype.numbersort=function(order){
	return (order=='desc')?this.sort((a,b) => b-a):this.sort((a,b) => a-b);
}
Array.prototype.shape=function(handler){
	var res=[];
	for (var i=0;i<this.length;i++)
	{
		var result=handler(this[i]);
		if (result!=PD_THROW) res.push(result);
	}
	return res;
}
/*
Date extention
*/
Date.prototype.calc=function(pattern){
	var date=this;
	pattern.split(',').map((item) => item.trim()).each((pattern,index) => {
		var year=date.getFullYear();
		var month=date.getMonth()+1;
		var day=date.getDate();
		var hour=date.getHours();
		var minute=date.getMinutes();
		var second=date.getSeconds();
		//first day of year
		if (pattern.match(/^first-of-year$/g)) {month=1;day=1};
		//first day of month
		if (pattern.match(/^first-of-month$/g)) day=1;
		//add years
		if (pattern.match(/^-?[0-9]+[ ]*year$/g)) year+=parseInt(pattern.match(/^-?[0-9]+/g));
		//add months
		if (pattern.match(/^-?[0-9]+[ ]*month$/g))
		{
			month+=parseInt(pattern.match(/^-?[0-9]+/g));
			//check of next year
			while (month<1) {year--;month+=12;}
			while (month>12) {year++;month-=12;}
			//check of next month
			var check=new Date(year,(month-1),day);
			if (check.getMonth()+1!=month)
			{
				check=new Date(year,month,1);
				check.setDate(0);
				day=check.getDate();
			}
		}
		//add day
		if (pattern.match(/^-?[0-9]+[ ]*day$/g)) day+=parseInt(pattern.match(/^-?[0-9]+/g));
		//add hour
		if (pattern.match(/^-?[0-9]+[ ]*hour$/g)) hour+=parseInt(pattern.match(/^-?[0-9]+/g));
		//add minute
		if (pattern.match(/^-?[0-9]+[ ]*minute$/g)) minute+=parseInt(pattern.match(/^-?[0-9]+/g));
		//add second
		if (pattern.match(/^-?[0-9]+[ ]*second$/g)) second+=parseInt(pattern.match(/^-?[0-9]+/g));
		date=new Date(year,(month-1),day,hour,minute,second);
	});
	return date;
}
Date.prototype.format=function(pattern){
	var year=this.getFullYear().toString();
	var month=('0'+(this.getMonth()+1)).slice(-2);
	var day=('0'+this.getDate()).slice(-2);
	var hour=('0'+this.getHours()).slice(-2);
	var minute=('0'+this.getMinutes()).slice(-2);
	var second=('0'+this.getSeconds()).slice(-2);
	//iso 8601
	if (pattern.match(/^ISO$/g)) return this.toISOString().replace(/[0-9]{2}\.[0-9]{3}Z$/g,'00Z');
	//iso 8601
	if (pattern.match(/^ISOSEC$/g)) return this.toISOString().replace(/\.[0-9]{3}Z$/g,'Z');
	//Others
	return pattern.replace(/Y/g,year).replace(/y/g,year.slice(-2)).replace(/m/g,month).replace(/d/g,day).replace(/H/g,hour).replace(/h/g,(hour%12).toString()).replace(/i/g,minute).replace(/s/g,second);
}
/*
FileList extention
*/
FileList.prototype.first=function(){
	return this[0];
}
FileList.prototype.last=function(){
	return this[this.length-1];
}
/*
Number extention
*/
Number.prototype.comma=function(decimals){
	var res=(pd.isnumeric(decimals))?this.toFixed(parseInt(decimals)).split('.'):String(this).split('.');
	res[0]=res[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1,');
	res=res.join('.');
	return res;
}
Number.prototype.parseByteunit=function(){
	if (this==0) return '0 Bytes';
	const units=['Bytes','KB','MB','GB','TB','PB'];
	const exponent=Math.floor(Math.log(this)/Math.log(1024));
	return (this/Math.pow(1024,exponent)).toFixed()+units[exponent];
}
Number.prototype.each=function(handler){
	for (var i=0;i<this;i++)
	{
		var result=handler(i);
		if (result===PD_BREAK) break;
		if (result===PD_SKIP) i++;
	}
}
/*
String extention
*/
String.prototype.bytelength=function(){
	var res=0;
	this.length.each((index) => {
		var char=this.charCodeAt(index);
		if ((char>=0x0 && char<0x81) || (char===0xf8f0) || (char>=0xff61 && char<0xffa0) || (char>=0xf8f1 && char<0xf8f4)) res+=1;
		else res+=2;
	});
	return res;
}
String.prototype.lpad=function(pattern,length){
	var padding='';
	length.each((index) => padding+=pattern);
	return (padding+this).slice(length*-1);
}
String.prototype.rpad=function(pattern,length){
	var padding='';
	length.each((index) => padding+=pattern);
	return (this+padding).slice(0,length);
}
String.prototype.parseCSV=function(separator=','){
	var buffer='';
	var quoted=false;
	var row=[];
	var rows=[];
	((csv) => {
		csv.length.each((index) => {
			return ((char) => {
				if (quoted)
				{
					if (char=='"')
					{
						if (csv.charAt(index+1)=='"')
						{
							buffer+=char;
							return PD_SKIP;
						}
						else quoted=false;
					}
					else buffer+=char;
				}
				else
				{
					switch (char)
					{
						case '"':
							buffer='';
							quoted=true;
							break;
						case separator:
							row.push(buffer);
							buffer='';
							break;
						case '\n':
							row.push(buffer);
							rows.push(row);
							buffer='';
							row=[];
							break;
						default:
							buffer+=char;
							break;
					}
				}
			})(csv.charAt(index));
		});
	})(this.replace(/\r/g,'').replace(/^[\n]+/g,'').replace(/[\n]+$/g,'')+'\n');
	return rows;
}
String.prototype.parseDateTime=function(){
	var format=this;
	if (isNaN(Date.parse(format)))
	{
		if (format.match(/T/g))
		{
			format=format.replace(/\//g,'-');
			if (!format.match(/(\+[0-9]{2}:?[0-9]{2}|Z$)/g)) format+='Z';
		}
		else format=format.replace(/-/g,'\/');
	}
	return new Date(format);
}
/*
Locale definition
*/
pd.locale={
	en:'US',
	ja:'JP'
};
/*
Message definition by language
*/
pd.constants={
	common:{
		message:{
			invalid:{
				parameter:{
					en:'There is a defect in the specified parameter',
					ja:'指定されたパラメータに不備があります'
				},
				required:{
					en:'Required',
					ja:'必須項目です'
				},
				uncompatible:{
					en:'This service is not compatible with the browser you are using',
					ja:'このサービスは、使用しているブラウザと互換性がありません'
				},
				unmatch:{
					format:{
						en:'Input value not matched to its input format',
						ja:'入力形式と一致していません'
					},
					pattern:{
						en:'Input value not matched to its input pattern',
						ja:'入力パターンと一致していません'
					}
				}
			},
			notfound:{
				en:'No data was found that matches your request',
				ja:'入力内容に一致するデータが見つかりませんでした'
			}
		},
		prompt:{
			keyword:{
				en:'Enter a keyword',
				ja:'キーワードを入力'
			},
			multiple:{
				en:'There are multiple choices',
				ja:'複数の選択候補があります'
			}
		}
	},
	dialog:{
		address:{
			prompt:{
				city:{
					en:'Select a city',
					ja:'市区町村'
				},
				prefecture:{
					en:'Select a prefecture',
					ja:'都道府県'
				}
			}
		},
		color:{
			caption:{
				hue:{
					en:'hue',
					ja:'色相'
				},
				saturation:{
					en:'saturation',
					ja:'彩度'
				},
				brightness:{
					en:'brightness',
					ja:'輝度'
				}
			},
			message:{
				invalid:{
					en:'Please Enter a color code',
					ja:'カラーコードを入力して下さい'
				}
			},
			prompt:{
				en:'Enter hexadecimal color code',
				ja:'16進数のカラーコードを入力'
			}
		}
	},
	map:{
		message:{
			invalid:{
				en:'Please Get the Google Map API key',
				ja:'Google MapAPIキーを取得してください'
			}
		}
	},
	weeks:{
		en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
		ja:['日','月','火','水','木','金','土']
	}
};
