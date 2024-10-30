/*
 * Fetchify plugin for WooCommerce
 *
 * @author		ClearCourse Business Services Ltd t/a Fetchify
 * @link		https://fetchify.com
 * @copyright	Copyright (c) 2021, ClearCourse Business Services Ltd
 * @license		Licensed under the terms of the AGPLv3 license.
 * @version		1.8.1
 */

var colours = {
	default:	'#63a2f1',
	red:		'#F44336',
	pink:		'#E91E63',
	purple:		'#9C27B0',
	deepPurple:	'#673ab7',
	indigo:		'#3f51b5',
	blue:		'#2196f3',
	lightBlue:	'#03a9f4',
	cyan:		'#00bcd4',
	teal:		'#009688',
	green:		'#4caf50',
	lightGreen:	'#8bc34a',
	lime:		'#cddc39',
	yellow:		'#ffeb3b',
	amber:		'#ffc107',
	orange:		'#ff9800',
	deepOrange:	'#ff5722',
	brown:		'#795548',
	grey:		'#9e9e9e',
	blueGrey:	'#607d8b'
};

function fetchifyAddJs() {
	var accentSelect = jQuery('#woocommerce_clicktoaddress_autocomplete_accent');
	if (accentSelect.length > 0) {
		accentSelect.hide();
		var currentAccentVal = accentSelect.val();

		var coloursDiv = jQuery('<div id="colour_cubes"></div>');
		var fieldWidth = jQuery('#woocommerce_clicktoaddress_autocomplete_access_token').css('width');
		coloursDiv.css({width: fieldWidth});
		coloursDiv.insertAfter(jQuery('#woocommerce_clicktoaddress_autocomplete_accent'));

		for(var colour in colours){
			coloursDiv.append(	'<div '+
									'class="colour_cube" '+
									'style="background-color:'+colours[colour]+'" '+
									'title="'+colour+'" '+
									'name="'+colour+'">'+
				'</div>');
		}

		var colourCubes = jQuery('.colour_cube');
		// Inital setup
		colourCubes.css({
			height:			'32px',
			width:			'32px',
			cursor:			'pointer',
			border:			'1px solid black',
			boxSizing:		'border-box',
			display:		'inline-block',
			marginRight:	'6px',
			marginTop:		'2px'
		});
		var currentCube = coloursDiv.find('[name="'+currentAccentVal+'"]');
		currentCube.css({
			border: '2px solid black',
			boxSizing: 'border-box',
		});
		// On hover
		colourCubes.hover(function(){
			jQuery(this).css({
				webkitTransform:	'scale(1.2, 1.2)',
				transform:			'scale(1.2, 1.2)'
			});
		}, function(){
			jQuery(this).css({
				webkitTransform:	'scale(1, 1)',
				transform:			'scale(1, 1)'
			});
		});
		// On click
		colourCubes.on('click', function(){
			jQuery(colourCubes).css({
				webkitTransform:	'scale(1, 1)',
				transform:			'scale(1, 1)',
				border:				'1px solid black'
			});
			jQuery(this).css({
				border:		'2px solid black',
				boxSizing:	'border-box'
			});
			var colourName = jQuery(this).attr('name');
			if(accentSelect.find('option[value="'+colourName+'"]').length){
				accentSelect.val(colourName);
			}
		});
	}

	fetchifyHideSections();
	fetchifyHideOptions();

	jQuery('.cc_enabled_select').on('change', function(){
		// Don't allow Auto-Complete and Postcode Lookup to be active at the same time
		if (jQuery(this).val() != "0") {
			var cc_checkbox_id = jQuery(this).attr('id');
			if (cc_checkbox_id == 'woocommerce_clicktoaddress_autocomplete_enabled_checkout' &&
				jQuery('#woocommerce_clicktoaddress_autocomplete_enabled_postcode').val() != "0")
			{
				jQuery('#woocommerce_clicktoaddress_autocomplete_enabled_postcode').val("0");
			}
			if (cc_checkbox_id == 'woocommerce_clicktoaddress_autocomplete_enabled_postcode' &&
				jQuery('#woocommerce_clicktoaddress_autocomplete_enabled_checkout').val() != "0")
			{
				jQuery('#woocommerce_clicktoaddress_autocomplete_enabled_checkout').val("0");
			}
		}
		// Show / hide sections for each product
		fetchifyHideSections();
		fetchifyHideOptions();
	});

	jQuery('#woocommerce_clicktoaddress_autocomplete_hide_fields, #woocommerce_clicktoaddress_autocomplete_search_line_1').on('change', function(){
		fetchifyHideOptions();
	});
}

function fetchifyHideSections() {
	var cc_sections = [
		'checkout',
		'postcode',
		'phone',
		//'email'
	];

	for (var i = 0; i < cc_sections.length; i++) {
		var sectionName = (cc_sections[i] == 'checkout') ? 'autocomplete' : cc_sections[i];
		if (jQuery('#woocommerce_clicktoaddress_autocomplete_enabled_' + cc_sections[i]).val() != "0")
		{
			jQuery('.cc_section_' + sectionName).closest('tr[valign="top"]').show(200);
			jQuery('h3.cc_section_' + sectionName).show(200);
		}
		else {
			jQuery('.cc_section_' + sectionName).closest('tr[valign="top"]').hide(200);
			jQuery('h3.cc_section_' + sectionName).hide(200);
		}
	}
}

// Prevents the options 'Hide Address Fields' and 'Search in Address Line 1' from being selected simultaneously
function fetchifyHideOptions() {
	if (jQuery('#woocommerce_clicktoaddress_autocomplete_enabled_checkout').val() !== '1') {
		return;
	}
	var fetchifyHideFieldsElem = jQuery('#woocommerce_clicktoaddress_autocomplete_hide_fields');
	var fetchifyLine1Elem = jQuery('#woocommerce_clicktoaddress_autocomplete_search_line_1');
	if (fetchifyHideFieldsElem.val() === '1') {
		fetchifyHideFieldsElem.closest('tr').show(200);
		fetchifyLine1Elem.val('0');
		fetchifyLine1Elem.closest('tr').hide(200);
	}
	else if (fetchifyLine1Elem.val() === '1') {
		fetchifyLine1Elem.closest('tr').show(200);
		fetchifyHideFieldsElem.val('0');
		fetchifyHideFieldsElem.closest('tr').hide(200);
	}
	else {
		fetchifyHideFieldsElem.closest('tr').show(200);
		fetchifyLine1Elem.closest('tr').show(200);
	}
}

function fetchifyLoad() {
	if (typeof jQuery === 'undefined') {
		setTimeout(fetchifyLoad, 50);
		return;
	}
	jQuery(document).ready(function(){
		fetchifyAddJs();
	});
}

fetchifyLoad();
