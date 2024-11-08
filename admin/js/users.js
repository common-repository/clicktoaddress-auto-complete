/*
* Fetchify plugin for WooCommerce
*
* @author		ClearCourse Business Services Ltd t/a Fetchify
* @link			https://fetchify.com
* @copyright	Copyright (c) 2021, ClearCourse Business Services Ltd
* @license		Licensed under the terms of the AGPLv3 license.
* @version		1.8.1
*/

if (typeof window.cc_c2a_functions == 'undefined') {
	window.cc_c2a_functions = {
		autocomplete: {},
		email: {},
		phone: {},
		postcode: {}
	};
}

window.cc_c2a_functions.autocomplete.add_autocomplete = function() {
	if (!window.cc_c2a_config.autocomplete.enabled) {
		return;
	}
	window.cc_c2a_fields_visible = 1;
	var c2a_enabled_countries = window.cc_c2a_functions.autocomplete.countries_by_wc();
	var c2a_autocomplete_config = {
		tag:						'w1-3-0u',
		accessToken:				window.cc_c2a_config.autocomplete.access_token,
		domMode:					'object',
		gfxMode:					"1",
		style: {
			ambient:				window.cc_c2a_config.autocomplete.ambient,
			accent:					window.cc_c2a_config.autocomplete.accent
		},
		showLogo:					window.cc_c2a_config.autocomplete.show_logo,
		texts: {
			default_placeholder:	window.cc_c2a_config.autocomplete.default_placeholder,
			country_placeholder:	window.cc_c2a_config.autocomplete.country_placeholder,
			country_button:			window.cc_c2a_config.autocomplete.country_button,
			generic_error:			window.cc_c2a_config.autocomplete.generic_error,
			no_results:				window.cc_c2a_config.autocomplete.no_results
		},
		countryLanguage:			window.cc_c2a_config.autocomplete.language,
		onResultSelected: function(c2a, elements, address) {
			// Set the country
			jQuery(elements.country).val(address.country.iso_3166_1_alpha_2);
			if (address.country.iso_3166_1_alpha_2 == 'GB') {
				var postcode = address.postal_code.substring(0, 2);
				if (postcode == 'GY' && jQuery.inArray('GG', c2a_enabled_countries) > -1) {
					jQuery(elements.country).val('GG');
				}
				if (postcode == 'JE' && jQuery.inArray('JE', c2a_enabled_countries) > -1) {
					jQuery(elements.country).val('JE');
				}
				if (postcode == 'IM' && jQuery.inArray('IM', c2a_enabled_countries) > -1) {
					jQuery(elements.country).val('IM');
				}
			}
			jQuery(elements.country).trigger('change');
			if (address.country.iso_3166_1_alpha_2 == 'GB' && !window.cc_c2a_config.autocomplete.fill_uk_counties) {
				jQuery(elements.county.selector).val('');
			}
			else {
				// Set the county
				c2a.setCounty(jQuery(elements.county.selector)[0], {
					'code':			address.province_code,
					'name':			(address.country.iso_3166_1_alpha_2 === 'GR') ? address.administrative_area_latin : address.province_name,
					'preferred':	(address.country.iso_3166_1_alpha_2 === 'GR') ? address.administrative_area_latin : address.province,
				});
				jQuery(elements.county.selector).trigger('change');
			}
			// Reveal the hidden fields
			if (!window.cc_c2a_config.autocomplete.search_line_1) {
				if (window.cc_c2a_config.autocomplete.hide_fields) {
					var form = jQuery(elements.country).closest('.form-table');
					window.cc_c2a_functions.autocomplete.show_fields(form, true);
				}
				else {
					jQuery(elements.search).val('');
				}
			}
		},
		onError: function(c2a, elements, address) {
			// Reveal the hidden fields when an error occurs
			if (!window.cc_c2a_config.autocomplete.search_line_1) {
				if (window.cc_c2a_config.autocomplete.hide_fields) {
					// Access token error, in this case elements is not defined, reveal all hidden fields
					if (typeof elements === 'undefined') {
						jQuery('table[id^="fieldset-"]').each(function(index, elem) {
							window.cc_c2a_functions.autocomplete.show_fields(jQuery(elem), true);
						});
					}
					// Reveal hidden fields for this form only
					else {
						var form = jQuery(elements.country).closest('.form-table');
						window.cc_c2a_functions.autocomplete.show_fields(form, true);
					}
				}
				else if (typeof elements !== 'undefined') {
					jQuery(elements.search).val('');
				}
			}
			// Prevent any further field hiding
			window.cc_c2a_config.autocomplete.hide_fields = 0;
		},
		countryMatchWith: 'iso_2',
		excludeAreas: window.cc_c2a_config.autocomplete.exclude_areas.split(/[\r\n]+/),
	};
	if (window.cc_c2a_config.autocomplete.language == 'native') {
		c2a_autocomplete_config.countryLanguage = 'en';
		c2a_autocomplete_config.texts.country_name_overrides = window.cc_c2a_native_countries;
	}
	if (window.cc_c2a_config.autocomplete.transliterate == 1) {
		c2a_autocomplete_config.transliterate = 1;
	}
	if (window.cc_c2a_config.autocomplete.match_countries) {
		c2a_autocomplete_config.enabledCountries = c2a_enabled_countries;
	}
	if (window.cc_c2a_config.autocomplete.lock_country) {
		c2a_autocomplete_config.countrySelector = false;
		c2a_autocomplete_config.onSearchFocus = function(c2a, dom) {
			var currentCountry = dom.country.options[dom.country.selectedIndex].value;
			if (currentCountry !== '') {
				var countryCode = getCountryCode(c2a, currentCountry, 'iso_2');
				c2a.selectCountry(countryCode);
			}
		};
	}

	window.cc_c2a = new clickToAddress(c2a_autocomplete_config);

	setInterval(function() {
		// Add lookup to billing form
		if (jQuery('#billing_postcode').length && jQuery('#billing_address_1').attr('cc-applied') != "1") {
			window.cc_c2a_functions.autocomplete.add_autocomplete_form('billing');
		}
		// Add lookup to shipping form
		if (jQuery('#shipping_postcode').length && jQuery('#shipping_address_1').attr('cc-applied') != "1") {
			window.cc_c2a_functions.autocomplete.add_autocomplete_form('shipping');
		}
	}, 200);
}

window.cc_c2a_functions.autocomplete.add_autocomplete_form = function(prefix) {
	var dom = {
		line_1:		jQuery('#' + prefix + '_address_1')[0],
		line_2:		jQuery('#' + prefix + '_address_2')[0],
		town:		jQuery('#' + prefix + '_city')[0],
		postcode:	jQuery('#' + prefix + '_postcode')[0],
		county:		jQuery('#' + prefix + '_state')[0],
		country:	jQuery('#' + prefix + '_country')[0]
	};

	jQuery(dom.line_1).attr('cc-applied', "1");
	if (!window.cc_c2a_config.autocomplete.search_line_1) {
		// Add the address search field
		var tmp_html = jQuery(	'<tr>' +
									'<th>' +
										'<label for="' + prefix + '_cc_c2a_search_input" id="fetchify_find_label_' + prefix + '">' +
											window.cc_c2a_config.autocomplete.search_label +
										'</label>' +
									'</th>' +
									'<td>' +
										'<input ' +
											'id="' + prefix + '_cc_c2a_search_input" ' +
											'class="regular-text cc_c2a_search_input" ' +
											'type="text">' +
										'</input>' +
									'</td>' +
								'</tr>');
		tmp_html.insertBefore(jQuery(dom.line_1).closest('tr'));
	}

	if (window.cc_c2a_config.autocomplete.hide_fields && !window.cc_c2a_config.autocomplete.search_line_1) {
		// Get checkout / account form
		var form = jQuery(dom.line_1).closest('.form-table');
		// Add reveal/hide buttons
		var cc_manual_button = jQuery(	'<br>' +
										'<span class="description cc_c2a_manual">' +
											window.cc_c2a_config.autocomplete.reveal_button +
										'</span>');
		var cc_hide_button = jQuery(	'<br>' +
										'<span class="description cc_c2a_hide">' +
											window.cc_c2a_config.autocomplete.hide_button +
										'</span>');
		window.cc_c2a_functions.autocomplete.add_button_css(jQuery(cc_manual_button[1]));
		window.cc_c2a_functions.autocomplete.add_button_css(jQuery(cc_hide_button[1]));
		cc_manual_button.insertAfter(jQuery('#' + prefix + '_cc_c2a_search_input'));
		cc_hide_button.insertAfter(dom.line_1);

		// Mark with an attribute all the dom elements to be hidden
		var domKeys = Object.keys(dom);
		for (var iDom = 0; iDom < domKeys.length; iDom++) {
			if (!window.cc_c2a_config.autocomplete.lock_country || domKeys[iDom] != 'country') {
				jQuery(dom[domKeys[iDom]]).closest('tr').attr('cc-c2a-hide', 1);
			}
		}

		// Initial setup
		if (jQuery(dom.line_1).val() == '') {
			setTimeout(function(){
				if (window.cc_c2a_config.autocomplete.hide_fields) { // Check again in case an error has occurred
					form.find('[cc-c2a-hide="1"]').hide();
					window.cc_c2a_fields_visible = 0;
					cc_manual_button.show();
				}
			}, 250);
		}
		else {
			form.find('.cc_c2a_search_input').closest('tr').hide();
			window.cc_c2a_fields_visible = 1;
			cc_hide_button.show();
		}

		cc_manual_button.on('click', function() {
			jQuery(this).hide(200);
			cc_hide_button.show(200);
			form.find('.cc_c2a_search_input').closest('tr').hide(200);
			window.cc_c2a_functions.autocomplete.show_fields(form, false);
		});
		cc_hide_button.on('click', function() {
			window.cc_c2a_fields_visible = 0;
			jQuery(this).hide(200);
			cc_manual_button.show(200);
			form.find('.cc_c2a_search_input').closest('tr').show(200);
			form.find('[cc-c2a-hide=1]').hide(200);
		});
		if (window.cc_c2a_config.autocomplete.lock_country) {
			jQuery(dom.country).on('change', function(){
				if (window.cc_c2a_fields_visible === 0) {
					form.find('[cc-c2a-hide=1]').hide();
				}
			});
		}
	}
	dom.company = jQuery('#' + prefix + '_company')[0];
	dom.county = {selector: '#' + prefix + '_state'};
	if (!window.cc_c2a_config.autocomplete.search_line_1) {
		dom.search = jQuery('#' + prefix + '_cc_c2a_search_input')[0];
	}
	else {
		dom.search = dom.line_1;
	}
	if (window.cc_c2a_config.autocomplete.lock_country) {
		jQuery(dom.search).closest('tr').before(jQuery(dom.country).closest('tr'));
	}
	window.cc_c2a.addAddressComplete(dom);
}

window.cc_c2a_functions.autocomplete.show_fields = function(form, buttons) {
	window.cc_c2a_fields_visible = 1;
	
	var fieldsToShow = form.find('[cc-c2a-hide="1"]');
	// We need to check that each field exists for this country before showing
	for (var i = 0; i < fieldsToShow.length; i++) {
		if (jQuery(fieldsToShow[i]).find('input, select').attr('type') != 'hidden') {
			jQuery(fieldsToShow[i]).show(200);
		}
	}
	if (!window.cc_c2a_config.autocomplete.hide_buttons) {
		form.find('.cc_c2a_search_input').closest('tr').hide(200);
	}
	// Show / hide the buttons
	if (buttons) {
		form.find('.cc_c2a_manual').hide(200);
		if (!window.cc_c2a_config.autocomplete.hide_buttons) {
			form.find('.cc_c2a_hide').show(200);
		}
	}
}

window.cc_c2a_functions.autocomplete.countries_by_wc = function() {
	var country_elems = [jQuery('#billing_country'), jQuery('#shipping_country')];
	var countryNames = [];
	for (var i = 0; i < country_elems.length; i++) {
		if (country_elems[i].length) {
			jQuery(country_elems[i]).find('option').each(function(index, elem) {
				var country_val = jQuery(elem).val();
				if (country_val !== '') {
					countryNames.push(country_val);
				}
			});
		}
	}
	return countryNames;
}

window.cc_c2a_functions.autocomplete.add_button_css = function(elem) {
	elem.css({
		display:	'none',
		cursor:		'pointer'
	});
}

window.cc_c2a_functions.email.add_email = function() {
	if (!window.cc_c2a_config.email.enabled) {
		return;
	}

	if (!window.cc_c2a) {
		window.cc_c2a = new clickToAddress({
			accessToken: window.cc_c2a_config.email.access_token
		});
	}

	setInterval(function() {
		window.cc_c2a_functions.email.add_email_form('email');
		window.cc_c2a_functions.email.add_email_form('billing_email');
	}, 200);
}

window.cc_c2a_functions.email.add_email_form = function(id) {
	// Add lookup to billing form
	if (jQuery('#' + id).length && jQuery('#' + id).attr('cc-applied') != "1") {
		window.cc_c2a.addEmailVerify({
			email: '#' + id
		});
		jQuery('#' + id).attr('cc-applied', "1");
	}
}

window.cc_c2a_functions.phone.add_phone = function() {
	if (!window.cc_c2a_config.phone.enabled) {
		return;
	}

	if (!window.cc_c2a) {
		window.cc_c2a = new clickToAddress({
			accessToken: window.cc_c2a_config.phone.access_token
		});
	}

	var cc_phone_interval = setInterval(function() {
		// Add lookup to billing form
		if (jQuery('#billing_phone').length && jQuery('#billing_phone').attr('cc-applied') != "1") {
			window.cc_c2a.addPhoneVerify({
				phone: '#billing_phone',
				country: function() {
					return jQuery('#billing_country').val();
				},
				can_correct: window.cc_c2a_config.phone.can_correct,
				allowed_type: window.cc_c2a_config.phone.allowed_type
			});
			jQuery('#billing_phone').attr('cc-applied', "1");
			clearInterval(cc_phone_interval);
		}
	}, 200);
}

if(!_cp_js_included){var _cp_js_included=1;var _cp_instances=[],_cp_instance_idx=0,_cp_pl=["FLAT","SHOP","UNIT","BLOCK","STALL","SUITE","APARTMENT","MAISONETTE","HOUSE NUMBER"];function CraftyPostcodeCreate(){_cp_instance_idx++;_cp_instances[_cp_instance_idx]=new CraftyPostcodeClass();_cp_instances[_cp_instance_idx].obj_idx=_cp_instance_idx;return _cp_instances[_cp_instance_idx]}function _cp_sp(b){var d="",c;for(c=0;c<_cp_pl.length;c++){d=_cp_pl[c];if(d==b.substr(0,d.length).toUpperCase()){return(b.substr(d.length))}}return("")}function _cp_eh(a){var b="";while(b=a.shift()){if(!isNaN(parseInt(b))){return(parseInt(b))}}return""}function _cp_kp(a){var b;if(!a){a=window.event}if(a.keyCode){b=a.keyCode}else{if(a.which){b=a.which}}if(b==13){this.onclick()}}function CraftyPostcodeClass(){this.config={lookup_url:"pcls1.craftyclicks.co.uk/js/",access_token:"",basic_address:0,traditional_county:0,busy_img_url:"crafty_postcode_busy.gif",hide_result:0,org_uppercase:1,town_uppercase:1,county_uppercase:0,addr_uppercase:0,delimiter:", ",msg1:"Please wait while we find the address",err_msg1:"This postcode could not be found, please try again or enter your address manually",err_msg2:"This postcode is not valid, please try again or enter your address manually",err_msg3:"Unable to connect to address lookup server, please enter your address manually.",err_msg4:"An unexpected error occured, please enter your address manually.",res_autoselect:1,res_select_on_change:1,debug_mode:0,lookup_timeout:10000,form:"",elements:"",max_width:"400px",max_lines:1,first_res_line:"---- please select your address ----",result_elem_id:"",on_result_ready:null,on_result_selected:null,on_error:null,pre_populate_common_address_parts:0,elem_company:"crafty_out_company",elem_house_num:"",elem_street1:"crafty_out_street1",elem_street2:"crafty_out_street2",elem_street3:"crafty_out_street3",elem_town:"crafty_out_town",elem_county:"crafty_out_county",elem_postcode:"crafty_in_out_postcode",elem_udprn:"crafty_out_udprn",single_res_autoselect:0,single_res_notice:"---- address found, see below ----",elem_search_house:"crafty_in_search_house",elem_search_street:"crafty_in_search_street",elem_search_town:"crafty_in_search_town",max_results:25,err_msg5:"The house name/number could not be found, please try again.",err_msg6:"No results found, please modify your search and try again.",err_msg7:"Too many results, please modify your search and try again.",err_msg9:"Please provide more data and try again.",err_msg8:"Trial account limit reached, please use AA11AA, AA11AB, AA11AD or AA11AE."};this.xmlhttp=null;this.res_arr=null;this.disp_arr=null;this.res_arr_idx=0;this.dummy_1st_line=0;this.cc=0;this.flexi_search=0;this.lookup_timeout=null;this.obj_name="";this.house_search=0;this.set=function(a,b){this.config[a]=b};this.res_clicked=function(a){this.cc++;if(this.res_selected(a)){if(0!=this.config.hide_result&&((2>=this.config.max_lines&&1<this.cc)||(2<this.config.max_lines))){this.update_res(null);this.cc=0}}};this.res_selected=function(a){if(1==this.dummy_1st_line){if(0==a){return 0}else{a--}}a=this.disp_arr[a]["index"];this.populate_form_fields(this.res_arr[a]);if(this.config.on_result_selected){this.config.on_result_selected(a)}return 1};this.populate_form_fields=function(j){var b=[];var o=this.config.delimiter;for(var e=0;e<8;e++){b[e]=this.get_elem(e)}b[11]=this.get_elem(11);if(b[11]){b[11].value=j.udprn}if(b[0]){if(b[0]==b[1]&&""!=j.org){b[1].value=j.org;b[1]=b[2];b[2]=b[3];b[3]=null}else{b[0].value=j.org}}var n=j.housename2;if(""!=n&&""!=j.housename1){n+=o}n+=j.housename1;var k=j.housenumber;if(b[7]){b[7].value=n;if(""!=n&&""!=k){b[7].value+=o}b[7].value+=k;n="";k=""}var d=j.street1;var c=j.street2;if(""!=k){if(""!=c){c=k+" "+c}else{if(""!=d){d=k+" "+d}else{d=k}}}var g=c+(c==""?"":(d==""?"":o))+d;var m=j.locality_dep;var h=j.locality;if(""!=g&&parseInt(g)==g){if(""!=m){m=parseInt(g)+" "+m}else{h=parseInt(g)+" "+h}g="";d=""}var f=m+(m==""||h==""?"":o)+h;var a=g+(g==""||f==""?"":o)+f;if(b[1]&&b[2]&&b[3]){if(""!=j.pobox||""!=n){if(""!=j.pobox){b[1].value=j.pobox}else{b[1].value=n}if(""==f){if(""==c){b[2].value=d;b[3].value=""}else{b[2].value=c;b[3].value=d}}else{if(""==g){if(""==m){b[2].value=h;b[3].value=""}else{b[2].value=m;b[3].value=h}}else{b[2].value=g;b[3].value=f}}}else{if(""==g){if(""==m){b[1].value=h;b[2].value="";b[3].value=""}else{b[1].value=m;b[2].value=h;b[3].value=""}}else{if(""==f){if(""==c){b[1].value=d;b[2].value="";b[3].value=""}else{b[1].value=c;b[2].value=d;b[3].value=""}}else{if(""==c){b[1].value=d;if(""==m){b[2].value=h;b[3].value=""}else{b[2].value=m;b[3].value=h}}else{if(""==m){b[1].value=c;b[2].value=d;b[3].value=h}else{if(g.length<f.length){b[1].value=g;b[2].value=m;b[3].value=h}else{b[1].value=c;b[2].value=d;b[3].value=f}}}}}}}else{if(b[1]&&b[2]){if(""!=j.pobox){b[1].value=j.pobox;b[2].value=a}else{if(""!=n&&""!=g&&""!=f){if((n.length+g.length)<(g.length+f.length)){b[1].value=n+(n==""?"":o)+g;b[2].value=f}else{b[1].value=n;b[2].value=g+(g==""?"":o)+f}}else{if(""!=n&&""!=g){b[1].value=n;b[2].value=g}else{if(""==n&&""!=g){if(""==f){if(""!=c){b[1].value=c;b[2].value=d}else{b[1].value=g;b[2].value=""}}else{b[1].value=g;b[2].value=f}}else{if(""==g&&""!=n){b[1].value=n;b[2].value=f}else{b[1].value=f;b[2].value=""}}}}}}else{var l;if(b[1]){l=b[1]}else{if(b[2]){l=b[2]}else{l=b[3]}}if(""!=j.pobox){l.value=j.pobox+o+f}else{l.value=n+(n==""||a==""?"":o)+a}}}if(b[4]){b[4].value=j.town}if(b[5]){b[5].value=j.county}if(b[6]){b[6].value=j.postcode}return 1};this.show_busy=function(){var b=document.createElement("img");var a=document.createAttribute("src");a.value=this.config.busy_img_url;b.setAttributeNode(a);a=document.createAttribute("title");a.value=this.config.msg1;b.setAttributeNode(a);this.update_res(b)};this.disp_err=function(d,b){var a=null;var e="";if(""!=d){switch(d){case"0001":e=this.config.err_msg1;break;case"0002":e=this.config.err_msg2;break;case"9001":e=this.config.err_msg3;break;case"0003":e=this.config.err_msg9;break;case"0004":e=this.config.err_msg6;break;case"0005":e=this.config.err_msg7;break;case"7001":e=this.config.err_msg8;break;default:e="("+d+") "+this.config.err_msg4;break}if(this.config.debug_mode){var c="";switch(d){case"8000":c=" :: No Access Token ";break;case"8001":c=" :: Invalid Token Format ";break;case"8002":c=" :: Invalid Token ";break;case"8003":c=" :: Out of Credits ";break;case"8004":c=" :: Restricted by rules ";break;case"8005":c=" :: Token suspended ";break}e+=c+" :: DBG :: "+b}a=document.createTextNode(e)}this.update_res(a);if(this.config.on_error){this.config.on_error(e)}};this.disp_err_msg=function(b){var a=null;if(""!=b){a=document.createTextNode(b)}this.update_res(a);if(this.config.on_error){this.config.on_error(b)}};this.display_res_line=function(d,c){var b=document.getElementById("crafty_postcode_lookup_result_option"+this.obj_idx);var e=document.createElement("option");e.appendChild(document.createTextNode(d));if(null!=b){b.appendChild(e)}else{var a=document.createElement("select");a.id="crafty_postcode_lookup_result_option"+this.obj_idx;a.onchange=Function("_cp_instances["+this.obj_idx+"].res_clicked(this.selectedIndex);");a.onkeypress=_cp_kp;if(0!=this.config.res_select_on_change){a.onchange=Function("_cp_instances["+this.obj_idx+"].res_selected(this.selectedIndex);")}if(this.config.max_width&&""!=this.config.max_width){a.style.width=this.config.max_width}var f=this.res_arr_idx;if(1==this.dummy_1st_line){f++}if((navigator.appName=="Microsoft Internet Explorer")&&(parseFloat(navigator.appVersion)<=4)){a.size=0}else{if(f>=this.config.max_lines){a.size=this.config.max_lines}else{a.size=f}}a.appendChild(e);this.update_res(a)}};this.update_res=function(a){if(this.lookup_timeout){clearTimeout(this.lookup_timeout)}try{if(document.getElementById){var b=document.getElementById(this.config.result_elem_id);if(b.hasChildNodes()){while(b.firstChild){b.removeChild(b.firstChild)}}if(null!=a){b.appendChild(a)}}}catch(c){}};this.str_trim=function(b){var a=0;var c=b.length-1;while(a<b.length&&b[a]==" "){a++}while(c>a&&b[c]==" "){c-=1}return b.substring(a,c+1)};this.cp_uc=function(e){if("PC"==e||"UK"==e||"EU"==e){return(e)}var d="ABCDEFGHIJKLMNOPQRSTUVWXYZ";var c="";var f=1;var b=0;for(var a=0;a<e.length;a++){if(-1!=d.indexOf(e.charAt(a))){if(f||b){c=c+e.charAt(a);f=0}else{c=c+e.charAt(a).toLowerCase()}}else{c=c+e.charAt(a);if(a+2>=e.length&&"'"==e.charAt(a)){f=0}else{if("("==e.charAt(a)){close_idx=e.indexOf(")",a+1);if(a+3<close_idx){b=0;f=1}else{b=1}}else{if(")"==e.charAt(a)){b=0;f=1}else{if("-"==e.charAt(a)){close_idx=e.indexOf("-",a+1);if((-1!=close_idx&&a+3>=close_idx)||a+3>=e.length){b=0;f=0}else{b=0;f=1}}else{if(a+2<e.length&&"0"<=e.charAt(a)&&"9">=e.charAt(a)){f=0}else{f=1}}}}}}}return(c)};this.leading_caps=function(a,b){if(0!=b||2>a.length){return(a)}var d="";var f=a.split(" ");for(var c=0;c<f.length;c++){var e=this.str_trim(f[c]);if(""!=e){if(""!=d){d=d+" "}d=d+this.cp_uc(e)}}return(d)};this.new_res_line=function(){var a=[];a.org="";a.housename1="";a.housename2="";a.pobox="";a.housenumber="";a.street1="";a.street2="";a.locality_dep="";a.locality="";a.town="";a.county="";a.postcode="";a.udprn="";return(a)};this.res_arr_compare=function(e,c){if(e.match_quality>c.match_quality){return(1)}if(e.match_quality<c.match_quality){return(-1)}if(e.street1>c.street1){return(1)}if(e.street1<c.street1){return(-1)}if(e.street2>c.street2){return(1)}if(e.street2<c.street2){return(-1)}var h;if(""==e.housenumber){h=_cp_eh(Array(e.housename1,e.housename2))}else{h=parseInt(e.housenumber)}var g;if(""==c.housenumber){g=_cp_eh(Array(c.housename1,c.housename2))}else{g=parseInt(c.housenumber)}if(""==h&&""!=g){return(1)}else{if(""!=h&&""==g){return(-1)}else{if(h>g){return(1)}if(h<g){return(-1)}}}var f=_cp_sp(e.housename1);if(!isNaN(parseInt(f))){f=parseInt(f)}var d=_cp_sp(c.housename1);if(!isNaN(parseInt(d))){d=parseInt(d)}if(f>d){return(1)}if(f<d){return(-1)}var f=_cp_sp(e.housename2);if(!isNaN(parseInt(f))){f=parseInt(f)}var d=_cp_sp(c.housename2);if(!isNaN(parseInt(d))){d=parseInt(d)}if(f>d){return(1)}if(f<d){return(-1)}f=e.housename2+e.housename1;d=c.housename2+c.housename1;if(f>d){return(1)}if(f<d){return(-1)}if(e.org>c.org){return(1)}if(e.org<c.org){return(-1)}return(1)};this.disp_res_arr=function(){this.res_arr=this.res_arr.sort(this.res_arr_compare);if(0!=this.config.res_autoselect){this.populate_form_fields(this.res_arr[0])}var a=this.config.delimiter;this.disp_arr=[];for(var c=0;c<this.res_arr_idx;c++){var e=this.res_arr[c];var b=e.org+(e.org!=""?a:"")+e.housename2+(e.housename2!=""?a:"")+e.housename1+(e.housename1!=""?a:"")+e.pobox+(e.pobox!=""?a:"")+e.housenumber+(e.housenumber!=""?" ":"")+e.street2+(e.street2!=""?a:"")+e.street1+(e.street1!=""?a:"")+e.locality_dep+(e.locality_dep!=""?a:"")+e.locality+(e.locality!=""?a:"")+e.town;if(this.flexi_search){b+=a+e.postcode}var d=[];d.index=c;d.str=b;this.disp_arr[c]=d}this.dummy_1st_line=0;if(""!=this.config.first_res_line){this.dummy_1st_line=1;this.display_res_line(this.config.first_res_line,-1)}for(var c=0;c<this.res_arr_idx;c++){this.display_res_line(this.disp_arr[c]["str"],c)}if(this.config.pre_populate_common_address_parts){var f=this.new_res_line();f.org=this.res_arr[0]["org"];f.housename1=this.res_arr[0]["housename1"];f.housename2=this.res_arr[0]["housename2"];f.pobox=this.res_arr[0]["pobox"];f.housenumber=this.res_arr[0]["housenumber"];f.street1=this.res_arr[0]["street1"];f.street2=this.res_arr[0]["street2"];f.locality_dep=this.res_arr[0]["locality_dep"];f.locality=this.res_arr[0]["locality"];f.town=this.res_arr[0]["town"];f.county=this.res_arr[0]["county"];f.postcode=this.res_arr[0]["postcode"];f.udprn=this.res_arr[0]["udprn"];for(var c=1;c<this.res_arr_idx;c++){if(this.res_arr[c]["org"]!=f.org){f.org=""}if(this.res_arr[c]["housename2"]!=f.housename2){f.housename2=""}if(this.res_arr[c]["housename1"]!=f.housename1){f.housename1=""}if(this.res_arr[c]["pobox"]!=f.pobox){f.pobox=""}if(this.res_arr[c]["housenumber"]!=f.housenumber){f.housenumber=""}if(this.res_arr[c]["street1"]!=f.street1){f.street1=""}if(this.res_arr[c]["street2"]!=f.street2){f.street2=""}if(this.res_arr[c]["locality_dep"]!=f.locality_dep){f.locality_dep=""}if(this.res_arr[c]["locality"]!=f.locality){f.locality=""}if(this.res_arr[c]["town"]!=f.town){f.town=""}if(this.res_arr[c]["county"]!=f.county){f.county=""}if(this.res_arr[c]["postcode"]!=f.postcode){f.postcode=""}if(this.res_arr[c]["udprn"]!=f.udprn){f.udprn=""}}this.populate_form_fields(f)}};this.get_elem=function(a){var d="";var c=null;if(""!=this.config.elements){var b=this.config.elements.split(",");d=b[a]}else{switch(a){case 0:d=this.config.elem_company;break;case 1:d=this.config.elem_street1;break;case 2:d=this.config.elem_street2;break;case 3:d=this.config.elem_street3;break;case 4:d=this.config.elem_town;break;case 5:d=this.config.elem_county;break;case 6:default:d=this.config.elem_postcode;break;case 7:d=this.config.elem_house_num;break;case 8:d=this.config.elem_search_house;break;case 9:d=this.config.elem_search_street;break;case 10:d=this.config.elem_search_town;break;case 11:d=this.config.elem_udprn;break}}if(""!=d){if(""!=this.config.form){c=document.forms[this.config.form].elements[d]}else{if(document.getElementById){c=document.getElementById(d)}}}return(c)};this.doHouseSearch=function(){var a=this.get_elem(8);if(a&&0<a.value.length){this.house_search=1}this.doLookup()};this.doLookup=function(){this.xmlhttp=null;var a=this.get_elem(6);var b=null;if(a){this.show_busy();this.lookup_timeout=setTimeout("_cp_instances["+this.obj_idx+"].lookup_timeout_err()",this.config.lookup_timeout);b=this.validate_pc(a.value)}if(null!=b){this.direct_xml_fetch(0,b)}else{this.disp_err("0002","invalid postcode format")}};this.flexiSearch=function(){this.xmlhttp=null;var a="";if(this.get_elem(8)&&""!=this.get_elem(8).value){a+="&search_house="+this.get_elem(8).value}if(this.get_elem(9)&&""!=this.get_elem(9).value){a+="&search_street="+this.get_elem(9).value}if(this.get_elem(10)&&""!=this.get_elem(10).value){a+="&search_town="+this.get_elem(10).value}if(""!=a){this.show_busy();this.lookup_timeout=setTimeout("_cp_instances["+this.obj_idx+"].lookup_timeout_err()",this.config.lookup_timeout);this.direct_xml_fetch(1,a)}else{this.disp_err("0003","search string too short")}};this.validate_pc=function(c){var b="";do{b=c;c=c.replace(/[^A-Za-z0-9]/,"")}while(b!=c);b=c.toUpperCase();if(7>=b.length&&5<=b.length){var d=b.substring(b.length-3,b.length);var a=b.substring(0,b.length-3);if(true==/[CIKMOV]/.test(d)){return null}if("0"<=d.charAt(0)&&"9">=d.charAt(0)&&"A"<=d.charAt(1)&&"Z">=d.charAt(1)&&"A"<=d.charAt(2)&&"Z">=d.charAt(2)){switch(a.length){case 2:if("A"<=a.charAt(0)&&"Z">=a.charAt(0)&&"0"<=a.charAt(1)&&"9">=a.charAt(1)){return(b)}break;case 3:if("A"<=a.charAt(0)&&"Z">=a.charAt(0)){if("0"<=a.charAt(1)&&"9">=a.charAt(1)&&"0"<=a.charAt(2)&&"9">=a.charAt(2)){return(b)}else{if("A"<=a.charAt(1)&&"Z">=a.charAt(1)&&"0"<=a.charAt(2)&&"9">=a.charAt(2)){return(b)}else{if("0"<=a.charAt(1)&&"9">=a.charAt(1)&&"A"<=a.charAt(2)&&"Z">=a.charAt(2)){return(b)}}}}break;case 4:if("A"<=a.charAt(0)&&"Z">=a.charAt(0)&&"A"<=a.charAt(1)&&"Z">=a.charAt(1)&&"0"<=a.charAt(2)&&"9">=a.charAt(2)){if("0"<=a.charAt(3)&&"9">=a.charAt(3)){return(b)}else{if("A"<=a.charAt(3)&&"Z">=a.charAt(3)){return(b)}}}break;default:break}}}return null};this.direct_xml_fetch=function(d,a){try{var e=document.getElementById(this.config.result_elem_id);var b="";if("https:"==document.location.protocol){b="https://"}else{b="http://"}if(0==d){b+=this.config.lookup_url;if(this.config.basic_address){b+="basicaddress"}else{b+="rapidaddress"}b+="?postcode="+a+"&callback=_cp_instances["+this.obj_idx+"].handle_js_response&callback_id=0"}else{if(this.config.basic_address){this.disp_err("1207","BasicAddress can't be used for Flexi Search!");return}else{b+=this.config.lookup_url+"flexiaddress?callback=_cp_instances["+this.obj_idx+"].handle_js_response&callback_id=1";b+="&max_results="+this.config.max_results;b+=a}}if(""!=this.config.access_token){b+="&key="+this.config.access_token}var c=document.createElement("script");c.src=encodeURI(b);c.type="text/javascript";e.appendChild(c)}catch(f){this.disp_err("1206",f)}};this.handle_js_response=function(c,d,e){if(!d){var f=e.error_code;var a=e.error_msg;this.disp_err(f,a)}else{this.res_arr=[];this.res_arr_idx=0;if(0==c){this.flexi_search=0;if(this.house_search){e=this.filter_data_by_house_name(e);if(null==e){this.disp_err_msg(this.config.err_msg5);return}}this.add_to_res_array(e)}else{this.flexi_search=1;this.res_arr.total_postcode_count=e.total_postcode_count;this.res_arr.total_thoroughfare_count=e.total_thoroughfare_count;this.res_arr.total_delivery_point_count=e.total_delivery_point_count;for(var i=1;i<=e.total_postcode_count;i++){this.add_to_res_array(e[i])}}if(this.res_arr_idx){var b=false;if(1==this.res_arr_idx&&this.config.single_res_autoselect){var g=null;if(""!=this.config.single_res_notice){g=document.createTextNode(this.config.single_res_notice)}this.update_res(g);this.populate_form_fields(this.res_arr[0]);b=true}else{this.disp_res_arr();document.getElementById("crafty_postcode_lookup_result_option"+this.obj_idx).focus()}if(0==c&&""!=e.postcode){var h=this.get_elem(6);h.value=e.postcode}if(this.config.on_result_ready){this.config.on_result_ready()}if(b&&this.config.on_result_selected){this.config.on_result_selected(0)}}else{this.disp_err("1205","no result to display")}}};this.add_to_res_array=function(f){for(var d=1;d<=f.thoroughfare_count;d++){var e=f[d]["thoroughfare_name"];if(""!=f[d]["thoroughfare_descriptor"]){e+=" "+f[d]["thoroughfare_descriptor"]}e=this.leading_caps(e,this.config.addr_uppercase);var c=f[d]["dependent_thoroughfare_name"];if(""!=f[d]["dependent_thoroughfare_descriptor"]){c+=" "+f[d]["dependent_thoroughfare_descriptor"]}c=this.leading_caps(c,this.config.addr_uppercase);if("delivery_point_count" in f[d]&&0<f[d]["delivery_point_count"]){for(var a=1;a<=f[d]["delivery_point_count"];a++){var g=this.new_res_line();g.street1=e;g.street2=c;var b=f[d][a];if("match_quality" in b){g.match_quality=b.match_quality}else{g.match_quality=1}g.housenumber=b.building_number;g.housename2=this.leading_caps(b.sub_building_name,this.config.addr_uppercase);g.housename1=this.leading_caps(b.building_name,this.config.addr_uppercase);g.org=b.department_name;if(""!=g.org&&""!=b.organisation_name){g.org+=this.config.delimiter}g.org=this.leading_caps(g.org+b.organisation_name,this.config.org_uppercase);g.pobox=this.leading_caps(b.po_box_number,this.config.addr_uppercase);g.postcode=f.postcode;g.town=this.leading_caps(f.town,this.config.town_uppercase);g.locality=this.leading_caps(f.dependent_locality,this.config.addr_uppercase);g.locality_dep=this.leading_caps(f.double_dependent_locality,this.config.addr_uppercase);if(this.config.traditional_county){g.county=this.leading_caps(f.traditional_county,this.config.county_uppercase)}else{g.county=this.leading_caps(f.postal_county,this.config.county_uppercase)}g.udprn=b.udprn;this.res_arr[this.res_arr_idx]=g;this.res_arr_idx++}}else{var g=this.new_res_line();g.street1=e;g.street2=c;g.postcode=f.postcode;g.town=this.leading_caps(f.town,this.config.town_uppercase);g.locality=this.leading_caps(f.dependent_locality,this.config.addr_uppercase);g.locality_dep=this.leading_caps(f.double_dependent_locality,this.config.addr_uppercase);if(this.config.traditional_county){g.county=this.leading_caps(f.traditional_county,this.config.county_uppercase)}else{g.county=this.leading_caps(f.postal_county,this.config.county_uppercase)}g.match_quality=2;this.res_arr[this.res_arr_idx]=g;this.res_arr_idx++}}};this.filter_data_by_house_name=function(f){var g=this.get_elem(8);if(!g||!g.value.length){return f}var j=g.value.toUpperCase();var k=-1;if(parseInt(j)==j){k=parseInt(j)}var l=" "+j;var e=[];var i=1;var b=0;for(var c=1;c<=f.thoroughfare_count;c++){e[i]=[];b=0;for(var d=1;d<=f[c]["delivery_point_count"];d++){var h=f[c][d];var a=" "+h.sub_building_name+" "+h.building_name+" ";if(-1!=a.indexOf(l)||k==parseInt(h.building_number)){b++;e[i][b]=[];e[i][b]["building_number"]=h.building_number;e[i][b]["sub_building_name"]=h.sub_building_name;e[i][b]["building_name"]=h.building_name;e[i][b]["department_name"]=h.department_name;e[i][b]["organisation_name"]=h.organisation_name;e[i][b]["po_box_number"]=h.po_box_number;e[i][b]["udprn"]=h.udprn}}if(b){e[i]["delivery_point_count"]=b;e[i]["thoroughfare_name"]=f[c]["thoroughfare_name"];e[i]["thoroughfare_descriptor"]=f[c]["thoroughfare_descriptor"];e[i]["dependent_thoroughfare_name"]=f[c]["dependent_thoroughfare_name"];e[i]["dependent_thoroughfare_descriptor"]=f[c]["dependent_thoroughfare_descriptor"];i++}}if(1<i){e.thoroughfare_count=i-1;e.town=f.town;e.dependent_locality=f.dependent_locality;e.double_dependent_locality=f.double_dependent_locality;e.traditional_county=f.traditional_county;e.postal_county=f.postal_county;e.postcode=f.postcode;return e}return null};this.lookup_timeout_err=function(){this.disp_err("9001","Internal Timeout after "+this.config.lookup_timeout+"ms")}}};
{};

var cc_c2a_suffix = 0;

window.cc_c2a_functions.postcode.add_postcode = function() {
	// Don't allow Auto-Complete and Postcode Lookup to be active at the same time
	if (window.cc_c2a_config.postcode.enabled && !window.cc_c2a_config.autocomplete.enabled) {
		jQuery('#billing_address_1').closest('tr')
			.before(jQuery('#billing_country').closest('tr'));
		jQuery('#shipping_address_1').closest('tr')
			.before(jQuery('#shipping_country').closest('tr'));
		window.cc_c2a_functions.postcode.add_postcode_form('billing');
		window.cc_c2a_functions.postcode.add_postcode_form('shipping');
		jQuery('#billing_country').on('change', function(){
			window.cc_c2a_functions.postcode.add_postcode_form('billing');
		});
		jQuery('#shipping_country').on('change', function(){
			window.cc_c2a_functions.postcode.add_postcode_form('shipping');
		});
	}
}

window.cc_c2a_functions.postcode.add_postcode_form = function(prefix) {
	if (jQuery('#' + prefix + '_state').length && typeof CraftyPostcodeCreate !== 'undefined') {
		var craftyCountry = jQuery('#' + prefix + '_country').val();
		if (craftyCountry == 'GB' || craftyCountry == 'JE' || craftyCountry == 'GG' || craftyCountry == 'IM') {
			if (!jQuery('#' + prefix + '_cp_button').length) {
				var cp_obj = CraftyPostcodeCreate();
				var tmp_html =
					jQuery(	'<tr class="crafty_' + prefix + '">' +
						'<th><label for="' + prefix + '_postcode_search">Postcode Search</label></th>' +
						'<td>' +
							'<input type="text" ' +
								'name="' + prefix + '_postcode_search" ' +
								'id="' + prefix + '_postcode_search" ' +
								'value="" ' +
								'class="regular-text">' +
							'<button id="' + prefix + '_cp_button" type="button" class="button">' +
								window.cc_c2a_config.postcode.button_text +
							'</button>' +
						'</td>' +
					'</tr>' +
					'<tr id="cp_result_row_' + prefix + '">' +
						'<th></th>' +
						'<td>' +
							'<span id="crafty_postcode_result_display_' + prefix + '" style="float:left"></span>' +
						'</td>' +
					'</tr>');

				tmp_html.find('#' + prefix + '_cp_button').css({
					marginLeft: '1em'
				}).on('click', function() {
					cp_obj.doLookup();
				});

				jQuery('#' + prefix + '_address_1').closest('tr').before(tmp_html);

				jQuery(tmp_html[1]).css({
					display: 'none'
				});

				cc_c2a_suffix++;
				var suffix = cc_c2a_suffix;

				var _cp_max_width = jQuery('#' + prefix + '_address_1').css('width');

				cp_obj.set("access_token",			window.cc_c2a_config.postcode.access_token);
				cp_obj.set("result_elem_id",		"crafty_postcode_result_display_"+prefix);
				cp_obj.set("form",					"");
				cp_obj.set("busy_img_url",			window.cc_c2a_config.postcode.busy_img_url);
				cp_obj.set("elem_company",			prefix + "_company");
				cp_obj.set("elem_street1",			prefix + "_address_1");
				cp_obj.set("elem_street2",			prefix + "_address_2");
				cp_obj.set("elem_town",				prefix + "_city");
				cp_obj.set("elem_county",			prefix + "_state");
				cp_obj.set("elem_postcode",			prefix + "_postcode_search");
				cp_obj.set("traditional_county",	window.cc_c2a_config.postcode.counties);
				cp_obj.set("msg1",					window.cc_c2a_config.postcode.msg1);
				cp_obj.set("err_msg1",				window.cc_c2a_config.postcode.err_msg1);
				cp_obj.set("err_msg2",				window.cc_c2a_config.postcode.err_msg2);
				cp_obj.set("err_msg3",				window.cc_c2a_config.postcode.err_msg3);
				cp_obj.set("err_msg4",				window.cc_c2a_config.postcode.err_msg4);
				cp_obj.set("res_autoselect",		window.cc_c2a_config.postcode.res_autoselect);
				cp_obj.set("max_width",				_cp_max_width);
				cp_obj.set("org_uppercase", 0);
				cp_obj.set("town_uppercase", 0);

				cp_obj.set("on_error", function() {
					jQuery('.cc-hide-' + prefix).show(200);
					jQuery('#' + prefix + 'cc_c2a_manual').hide(200);
				});
				cp_obj.set("on_result_ready", function() {
					jQuery('#cp_result_row_' + prefix).show(200);
					if (window.cc_c2a_config.postcode.res_autoselect) {
						window.cc_c2a_functions.postcode.on_result_selected(prefix, suffix);
						jQuery('#cp_result_row_' + prefix).show();
					}
					jQuery('#crafty_postcode_lookup_result_option' + suffix).css({
						backgroundColor:	'#ffffff',
						paddingLeft:		'8px',
						marginBottom:		'1.5em'
					});
				});
				cp_obj.set("on_result_selected", function() {
					window.cc_c2a_functions.postcode.on_result_selected(prefix, suffix);
					if (window.cc_c2a_config.postcode.hide_result) {
						jQuery('#crafty_postcode_lookup_result_option' + suffix).hide();
					}
				});
				if (window.cc_c2a_config.postcode.hide_fields) {
					var cc_manual_button = jQuery(	'<span id="' + prefix + 'cc_c2a_manual"class="description">'+
														'Enter Address Manually'+
													'</span>');
					cc_manual_button.css({
						cursor:			'pointer',
						marginBottom:	0,
						display:		'none'
					});
					cc_manual_button.insertAfter(jQuery('#' + prefix + '_cp_button'));
					jQuery('<br>').insertAfter(jQuery('#' + prefix + '_cp_button'));
					cc_manual_button.on('click', function() {
						jQuery('.cc-hide-' + prefix).show(200);
						jQuery(this).hide(200);
					});

					jQuery('#' + cp_obj.config.elem_town).closest('tr').addClass('cc-hide-' + prefix);
					jQuery('#' + cp_obj.config.elem_street1).closest('tr').addClass('cc-hide-' + prefix);
					jQuery('#' + cp_obj.config.elem_street2).closest('tr').addClass('cc-hide-' + prefix);
					jQuery('#' + cp_obj.config.elem_county).closest('tr').addClass('cc-hide-' + prefix);
					jQuery('#' + prefix + '_postcode').closest('tr').addClass('cc-hide-' + prefix);
				}
			}
			jQuery('.crafty_' + prefix).show();
			if (window.cc_c2a_config.postcode.hide_fields &&
				jQuery('#' + prefix + '_address_1').val() === '' &&
				jQuery('#crafty_postcode_result_display_' + prefix).is(':empty'))
			{
				jQuery('.cc-hide-' + prefix).hide();
				jQuery('#' + prefix + 'cc_c2a_manual').show();
			}
		}
		else {
			jQuery('.crafty_' + prefix).hide();
			jQuery('#cp_result_row_' + prefix).hide();
			jQuery('.cc-hide-' + prefix).show();
		}
	}
}

window.cc_c2a_functions.postcode.on_result_selected = function(prefix, suffix) {
	var postcode = _cp_instances[suffix].res_arr[0].postcode;
	var country_elem = jQuery('#' + prefix + '_country');
	if (country_elem.attr('type') != 'hidden') {
		// UK sub-country selector
		var postcode_inital = postcode.substring(0, 2);
		var uk_sub_countries = [
			['JE',	'JE'],
			['GY',	'GG'],
			['IM',	'IM']
		];
		country_elem.val('GB');
		for (var i = 0; i < uk_sub_countries.length; i++) {
			if (postcode_inital == uk_sub_countries[i][0] && country_elem.find('option[value="' + uk_sub_countries[i][1] + '"]').length) {
				country_elem.val(uk_sub_countries[i][1]);
			}
		}
		country_elem.trigger('change');
	}
	// Address line merger
	var cp_line1 = jQuery('#' + prefix + '_address_1');
	if (cp_line1.val().length < 5) {
		var cp_line2 = jQuery('#' + prefix + '_address_2');
		cp_line1.val(cp_line1.val() + ', ' + cp_line2.val());
		cp_line2.val('');
	}

	jQuery('#' + prefix + '_postcode').val(postcode);
	jQuery('.cc-hide-' + prefix).show(200);
	jQuery('#' + prefix + 'cc_c2a_manual').hide(200);
	if (window.cc_c2a_config.postcode.counties == 2) {
		jQuery('#' + prefix + '_state').val('');
	}
	if (window.cc_c2a_config.postcode.hide_result) {
		jQuery('#cp_result_row_' + prefix).hide();
	}
}


if (typeof window.cc_c2a_config !== 'undefined' && typeof window.cc_c2a_functions !== 'undefined') {
	window.cc_c2a_functions.load = function() {
		if (typeof jQuery === 'undefined') {
			setTimeout(window.cc_c2a_functions.load, 50);
			return;
		}
		jQuery(document).ready(function(){
			window.cc_c2a_functions.autocomplete.add_autocomplete();
			window.cc_c2a_functions.postcode.add_postcode();
			window.cc_c2a_functions.email.add_email();
			window.cc_c2a_functions.phone.add_phone();
		});
	}

	window.cc_c2a_functions.load();
}
