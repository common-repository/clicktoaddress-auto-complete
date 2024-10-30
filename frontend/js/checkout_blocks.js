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

if (typeof window.cc_c2a_config !== 'undefined' && typeof window.cc_c2a_functions !== 'undefined') {
	window.cc_c2a_functions.load = function() {
		if (typeof jQuery === 'undefined') {
			setTimeout(window.cc_c2a_functions.load, 50);
			return;
		}

		if (!jQuery('fieldset[id*="-fields"]').length) {
			setTimeout(window.cc_c2a_functions.load, 50);
			return;
		}

		jQuery(document).ready(function(){
			var config = window.cc_c2a_config;
			var functions = window.cc_c2a_functions;

			var shouldEnableAutoComplete = config.autocomplete.enabled;
			var shouldEnablePostcode = config.postcode.enabled;
			var shouldEnableEmail = config.email.enabled;
			var shouldEnablePhone = config.phone.enabled;

			if (shouldEnableAutoComplete) functions.autocomplete.addAutoComplete();
			if (shouldEnablePostcode) functions.postcode.addPostcode();
			if (shouldEnableEmail) functions.email.addEmail();
			if (shouldEnablePhone) functions.phone.addPhone();
		});
	}

	window.cc_c2a_functions.load();
}


var fetchifyAutoComplete = window.cc_c2a_functions.autocomplete;
fetchifyAutoComplete.utils = fetchifyAutoComplete.utils || {};
var fetchifyAutoCompleteUtils = fetchifyAutoComplete.utils;

fetchifyAutoComplete.addAutoComplete = function() {
  var main = fetchifyAutoComplete;
  var utils = fetchifyAutoCompleteUtils;

  window.cc_c2a = new clickToAddress(
    main.createConfig()
  );
  
  utils.displayAutoComplete([
    'billing',
    'shipping'
  ]);
}


fetchifyAutoComplete.createBaseConfig = function() {
  var config = window.cc_c2a_config.autocomplete;
  var utils = fetchifyAutoCompleteUtils;

  return {
    tag: 'w1-3-0c',
    accessToken: config.access_token,
    domMode: 'object',
    gfxMode: config.layout,
    style: {
      ambient: config.ambient,
      accent: config.accent
    },
    showLogo: config.show_logo,
    getIpLocation: config.ip_location,
    transliterate: config.transliterate,
    placeholders: false,
    countryLanguage: config.language,
    countryMatchWith: 'iso_2',
    texts: {
      country_button: config.country_button,
      generic_error: config.generic_error,
      no_results: config.no_results
    },
    onResultSelected: utils.handleResultSelected,
    onError: utils.handleError
  }
}

fetchifyAutoComplete.createConfig = function() {
  var config = window.cc_c2a_config.autocomplete;

  var main = fetchifyAutoComplete;
  var utils = fetchifyAutoCompleteUtils;
  
  var extendedConfig = main.createBaseConfig();

  // Set additional options based on conditions
  var hasSetNativeLanguage = config.language === 'native';
  if (hasSetNativeLanguage) utils.setCountryLanguage(extendedConfig);

  var hasSetAreasToExclude = config.exclude_areas.length > 0;
  if (hasSetAreasToExclude) utils.setExcludeAreas(extendedConfig);

  var hasEnabledMatchCountryList = config.match_countries;
  if (hasEnabledMatchCountryList) utils.setEnabledCountries(extendedConfig);

  var hasEnabledLockCountryToDropdown = config.lock_country;
  if (hasEnabledLockCountryToDropdown) utils.setCountrySelector(extendedConfig);

  return extendedConfig;
}


fetchifyAutoCompleteUtils.setCountryLanguage = function(extendedConfig) {
  var nativeCountries = window.cc_c2a_native_countries;

  extendedConfig.countryLanguage = 'en';
  extendedConfig.texts.country_name_overrides = nativeCountries;
}

fetchifyAutoCompleteUtils.setExcludeAreas = function(extendedConfig) {
  var config = window.cc_c2a_config.autocomplete;

  extendedConfig.excludeAreas = config.exclude_areas.split(/[\r\n]+/);
}

fetchifyAutoCompleteUtils.setEnabledCountries = function(extendedConfig) {
  var utils = fetchifyAutoCompleteUtils;

  extendedConfig.enabledCountries = utils.getCountries();
}

fetchifyAutoCompleteUtils.setCountrySelector = function(extendedConfig) {
  var utils = fetchifyAutoCompleteUtils;

  extendedConfig.countrySelector = false;
  extendedConfig.onSearchFocus = utils.handleSearchFocus;
}


fetchifyAutoCompleteUtils.countyExists = function(country, county) {
  var wc = window.wc;
  var countries = wc.wcSettings.getSetting('countryData');
  var states = countries[country]['states'];

  for (var state in states) {
    var currentState = states[state].toLowerCase();

    var hasFoundMatch = currentState === county.toLowerCase();

    if (hasFoundMatch) return true;
  }

  return false;
}


fetchifyAutoCompleteUtils.getCountries = function() {
  var wc = window.wc;
  var countries = wc.wcSettings.getSetting('countryData');

  var allowedCountries = [];

  // Get all allowed countries
  for (var country in countries) {
    var isAllowed = countries[country]['allowBilling'] || countries[country]['allowShipping'];

    if (isAllowed) allowedCountries.push(country);
  }

  return allowedCountries;
}

fetchifyAutoCompleteUtils.isAllowedCountry = function(country) {
  var utils = fetchifyAutoCompleteUtils;
  
  var countries = utils.getCountries();

  if (country === 'GY') country = 'GG';

  return jQuery.inArray(country, countries) !== -1;
}

fetchifyAutoCompleteUtils.getISOCode = function(country) {
  var wc = window.wc;
  var countries = wc.wcSettings.getSetting('countries');

  for (var code in countries) {
    if (countries[code] === country) {
      return code;
    }
  }

  return '';
}


fetchifyAutoCompleteUtils.getBaseDOMObject = function() {
  var dom = {
    first_name: '',
    last_name: '',
    line_1: '',
    line_2: '',
    town: '',
    postcode: '',
    county: '',
    country: '',
    visibility: '',
    search: ''
  };

  return dom;
}

fetchifyAutoCompleteUtils.createDOMObject = function(prefix) {
  var utils = fetchifyAutoCompleteUtils;

  var dom = utils.getBaseDOMObject();

  // List of fields to be populated
  var fields = utils.getFieldIds(prefix);

  // Populate dom with DOM elements
  for (var key in dom) {
    var selector = '#' + fields[key];

    dom[key] = jQuery(selector)[0];
  }

  return dom;
}

fetchifyAutoCompleteUtils.getPrefixFromElementId = function(element) {
  var id = element.id;

  return id.split('-')[0] + '-';
}

fetchifyAutoCompleteUtils.createCrownDependencies = function() {
  return {
    'GY': 'Guernsey',
    'JE': 'Jersey',
    'IM': 'Isle of Man'
  };
}

fetchifyAutoCompleteUtils.formatPrefix = function(prefix) {
  var hasSeperator = prefix.charAt(prefix.length - 1) === '-';

  if (hasSeperator) return prefix.replace('-', '');

  return prefix + '-';
}

fetchifyAutoCompleteUtils.getFormByPrefix = function(prefix) {
  var utils = fetchifyAutoCompleteUtils;

  var id = utils.formatPrefix(prefix);
  var selector = '#' + id;

  var $form = jQuery(selector);

  return $form;
}

fetchifyAutoCompleteUtils.getWCVersion = function() {
  var wc = window.wc;
  var version = wc.wcSettings.getSetting('wcVersion');

  return version.split('.')[0];
}


fetchifyAutoCompleteUtils.displayAutoComplete = function(target) {
  // Continuously check target availability and state
  setInterval(function() {
    for (var i = 0; i < target.length; i++) {
      var prefix = target[i] + '-';
      var selector = '#' + prefix + 'address_1';
      var $target = jQuery(selector);

      // Only display on targets that are available with no `cc-applied` attribute
      var shouldDisplay =
        $target.length &&
        $target.attr('cc-applied') !== '1';

      if (shouldDisplay) {
        var config = window.cc_c2a_config.autocomplete;
        var utils = fetchifyAutoCompleteUtils;

        var shouldHideFields = config.hide_fields;

        // Display Address AutoComplete
        utils.displayOnElement(prefix);

        // Hide address fields
        if (shouldHideFields) {
          var doesNotHaveError = $target.attr('cc-error') !== '1';

          if (doesNotHaveError) {
            // Display visibility button
            utils.displayVisibilityButton(prefix);

            // Hide all fields
            utils.hideFields(prefix);
          }
        }
      }
    }
  }, 200);
}

fetchifyAutoCompleteUtils.displayOnElement = function(prefix) {
  var config = window.cc_c2a_config.autocomplete;
  var utils = fetchifyAutoCompleteUtils;

  var wcVersion = utils.getWCVersion();

  var dom = utils.createDOMObject(prefix);
  var $line1 = jQuery(dom.line_1);
  
  // Set cc-applied attribute
  $line1.attr('cc-applied', '1');

  var shouldNotShowOnLine1 = !config.search_line_1;

  if (shouldNotShowOnLine1) {
    var id = prefix + 'aac_search';

    // Create and display new search field
    utils.createSearchField(prefix, id, dom);

    // Refresh DOM object after creating new search field
    dom = utils.createDOMObject(prefix);
  } else {
    if (wcVersion < 9) {
      // Set form field margins
      var $firstName = jQuery(dom.first_name);
      var $lastName = jQuery(dom.last_name);

      $line1.parent().css({
        marginTop: '0px'
      });

      $firstName.parent().css({
        marginTop: '0px',
        marginBottom: '16px'
      });

      $lastName.parent().css({
        marginTop: '0px',
        marginBottom: '16px'
      });
    }
  }
  
  window.cc_c2a.addAddressComplete(dom);
}

fetchifyAutoCompleteUtils.createSearchField = function(prefix, id, dom) {
  var config = window.cc_c2a_config.autocomplete;
  var utils = fetchifyAutoCompleteUtils;
  
  var wcVersion = utils.getWCVersion();
  var label = config.search_label;

  var html;

  if (wcVersion < 9) {
    html = 
      '<div class="wc-block-components-text-input" style="flex: 0 0 100%;">' +
        '<input type="text" id="' + id + '" required="" title="" value="">' +
        '<label for="' + id + '">' + label + '</label>' +
      '</div>'
    ;
  } else {
    html = 
      '<div class="wc-block-components-text-input">' +
        '<input type="text" id="' + id + '" required="" title="" value="">' +
        '<label for="' + id + '">' + label + '</label>' +
      '</div>'
    ;
  }

  var $html = jQuery(html);
  var $form = utils.getFormByPrefix(prefix);

  var hasNotHiddenFields = !config.hide_fields;

  // Insert search field at the top of the form
  $html.prependTo($form);

  if (wcVersion < 9) {
    if (hasNotHiddenFields) {
      // Add margin to first name field
      var $firstName = jQuery(dom.first_name);

      $firstName.parent().css({
        marginTop: '16px'
      });
    }
  }

  // Add is-active class on focus or click to search field
  $html.find('input').on('focus', function() {
    // Only add class if it hasn't already been added
    var shouldShowClass = !$html.hasClass('is-active');

    if (shouldShowClass) {
      $html.addClass('is-active');
    }
  });

  // Remove is-active class on blur from search field
  $html.find('input').on('blur', function() {
    // Only remove class if the field is empty
    var shouldRemoveClass = !this.value;

    if (shouldRemoveClass) {
      $html.removeClass('is-active');
    }
  });

  return $html;
}

fetchifyAutoCompleteUtils.displayVisibilityButton = function(prefix) {
  var utils = fetchifyAutoCompleteUtils;

  var $form = utils.getFormByPrefix(prefix);

  // Create visibility button
  $button = utils.createVisibilityButton(prefix);

  // Display visibility button
  $form.prepend($button);
}

fetchifyAutoCompleteUtils.createVisibilityButton = function(prefix) {
  var config = window.cc_c2a_config.autocomplete;
  var utils = fetchifyAutoCompleteUtils;

  var wcVersion = utils.getWCVersion();

  // Button text
  var revealButtonText = config.reveal_button;
  var hideButtonText = config.hide_button;

  // Get form and line elements
  var $form = utils.getFormByPrefix(prefix);

  var dom = utils.createDOMObject(prefix);
  var $line1 = jQuery(dom.line_1);

  // Set cc-hidden attribute
  $line1.attr('cc-hidden', '1');

  var id = prefix + 'aac_visibility_button';
  var marginBottom;

  if (wcVersion < 9) {
    marginBottom = '4px'
  } else {
    marginBottom = '-12px'
  }

  // Create container for visibility button
  var $container = jQuery('<div id="' + id + '"></div>')
    .css({
      width: '100%',
      textAlign: 'right',
      marginBottom: marginBottom
    });
  
  // Create visibility button
  var $visibilityButton = jQuery('<span>' + revealButtonText + '</span>')
    .css({
      cursor: 'pointer',
      fontSize: '0.8125em',
      userSelect: 'none'
    });

  // Toggle visibility
  $visibilityButton.on('click', function() {
    var isHidden = $line1.attr('cc-hidden') === '1';

    if (isHidden) {
      $form.trigger('cc-show');
    } else {
      $form.trigger('cc-hide');
    }
  });

  // Handle cc-show event
  jQuery($form).on('cc-show', function() {
    // Update button text and cc-hidden state
    $visibilityButton.text(hideButtonText);
    $line1.attr('cc-hidden', '0');

    // Show all fields
    utils.showFields(prefix);
  });

  // Handle cc-hide event
  jQuery($form).on('cc-hide', function() {
    // Update button text and cc-hidden state
    $visibilityButton.text(revealButtonText);
    $line1.attr('cc-hidden', '1');

    // Hide all fields
    utils.hideFields(prefix);
  });

  $container.append($visibilityButton);
  
  return $container;
}

fetchifyAutoCompleteUtils.hideFields = function(prefix) {
  var config = window.cc_c2a_config.autocomplete;
  var utils = fetchifyAutoCompleteUtils;

  var wcVersion = utils.getWCVersion();
  var dom = utils.createDOMObject(prefix);

  var $form = utils.getFormByPrefix(prefix);

  var hasEnabledLockCountryToDropdown = config.lock_country;

  var $elementsToHide;

  // Get elements
  var $visibility = jQuery(dom.visibility);
  var $search = jQuery(dom.search);
  var $line1 = jQuery(dom.line_1);
  var $country = jQuery(dom.country);

  if (hasEnabledLockCountryToDropdown) {
    // Hide all fields except for the visibility button, search field, and country field
    $elementsToHide = $form
      .children()
      .not($visibility)
      .not($search.parent())
      .not($country.parent());

    // Increase width of country field
    if (wcVersion < 9) $country.parent().css('flex', '0 0 100%');

    var interval;

    // Ensure all hidden fields remain hidden whilst changing country
    $country.find('input').on('focus', function() {
      var hasHiddenFields = $line1.attr('cc-hidden') === '1';

      if (hasHiddenFields) {
        interval = setInterval(() => {
          // Check if any of the elements have become visible
          var $visibleElements = $form
            .children(':visible')
            .not($visibility)
            .not($search.parent())
            .not($country.parent());
          
          var hasVisibleElements = $visibleElements.length > 0;
          
          // Hide the visible elements
          if (hasVisibleElements) {
            $visibleElements.hide();
          }
        }, 100);
      }
    });

    // Clear the interval
    $country.find('input').on('blur', function() {
      var hasHiddenFields = $line1.attr('cc-hidden') === '1';

      if (hasHiddenFields) clearInterval(interval);
    });
  } else {
    // Hide all fields except for the visibility button and search field
    $elementsToHide = $form
      .children()
      .not($visibility)
      .not($search.parent());
  }

  // Hide phone field in WC 8
  if (wcVersion < 9) {
    $elementsToHide = $elementsToHide.add(
      $form
        .parent()
        .children()
        .not($form)
    );

    // Increase width of country field
    $country.parent().css('flex', '0 0 100%');
  }

  $elementsToHide.slideUp(250);
}

fetchifyAutoCompleteUtils.showFields = function(prefix) {
  var config = window.cc_c2a_config.autocomplete;
  var utils = fetchifyAutoCompleteUtils;

  var dom = utils.createDOMObject(prefix);
  var wcVersion = utils.getWCVersion();
  var $form = utils.getFormByPrefix(prefix);

  var $country = jQuery(dom.country);
  var $elementsToShow = $form.children();

  var hasEnabledLockCountryToDropdown = config.lock_country;

  // Show phone field in WC 8
  if (wcVersion < 9) {
    $elementsToShow = $elementsToShow.add(
      $form
        .parent()
        .children()
        .not($form)
    );

    if (hasEnabledLockCountryToDropdown) {
      // Reduce width of country field
      $country.parent().css('flex', '');
    }
  }

  $elementsToShow.slideDown(250);
}

fetchifyAutoCompleteUtils.removeVisibilityButton = function(prefix) {
  var utils = fetchifyAutoCompleteUtils;

  var dom = utils.createDOMObject(prefix);

  // Get form and line elements
  var $form = utils.getFormByPrefix(prefix);
  var $line1 = jQuery(dom.line_1);

  // Remove cc-hidden attribute from line 1
  $line1.removeAttr('cc-hidden');

  // Hide visibility button
  $form.children().first().css('display', 'none');
}


fetchifyAutoCompleteUtils.getFieldIds = function(prefix) {
  var config = window.cc_c2a_config.autocomplete;

  // Determine search id
  var search = prefix + 'address_1';
  var shouldNotShowOnLine1 = !config.search_line_1;

  if (shouldNotShowOnLine1) search = prefix + 'aac_search';

  return {
    first_name: prefix + 'first_name',
    last_name: prefix + 'last_name',
    line_1: prefix + 'address_1',
    line_2: prefix + 'address_2',
    town: prefix + 'city',
    postcode: prefix + 'postcode',
    county: prefix + 'state',
    country: prefix + 'country',
    visibility: prefix + 'aac_visibility_button',
    search: search
  }
}

fetchifyAutoCompleteUtils.setCountry = function(fields, address) {
  var utils = fetchifyAutoCompleteUtils;

  var prefix = utils.getPrefixFromElementId(fields.search);
  var dom = utils.createDOMObject(prefix);

  var countryName = address.country.country_name;
  var postcodePrefix = utils.getPostcodePrefix(address.postal_code);

  var isGB = address.country.iso_3166_1_alpha_2 === 'GB';
  var isDependency = utils.isCrownDependency(postcodePrefix);

  // Handle country selection for Crown Dependencies
  if (isGB && isDependency) {
    var dependency = postcodePrefix;
    var dependencies = utils.createCrownDependencies();

    // Set country to one of the Crown Dependencies if allowed
    if (utils.isAllowedCountry(dependency)) {
      countryName = dependencies[dependency];
    }
  }

  utils.setDropdownValue(dom.country, countryName);
}

fetchifyAutoCompleteUtils.setState = function(fields, address) {
  var utils = fetchifyAutoCompleteUtils;
  
  var prefix = utils.getPrefixFromElementId(fields.search);
  var dom = utils.createDOMObject(prefix);

  var $county = jQuery(dom.county);

  // Check if county field does not exist
  var hasNoCounty = $county.length === 0;
  if (hasNoCounty) return;

  // Determine whether or not state is a dropdown
  var isDropdown = $county.find('input').attr('aria-expanded') !== undefined;

  var country = address.country.iso_3166_1_alpha_2;
  var isGB = country === 'GB';
  var isGR = country === 'GR';

  if (isDropdown) {
    var provinceName = address.province_name;

    if (isGR) provinceName = address.administrative_area_latin;

    // Set county if it exists
    if (utils.countyExists(country, provinceName)) {
      utils.setDropdownValue(dom.county, provinceName);
    }
  } else {
    var config = window.cc_c2a_config.autocomplete;

    var provinceName = address.province_name;
    var postcodePrefix = utils.getPostcodePrefix(address.postal_code);

    var shouldNotPopulateCounty = (
      !config.fill_uk_counties &&
      !utils.isCrownDependency(postcodePrefix)
    );

    // Do not populate UK counties
    if (isGB && shouldNotPopulateCounty) provinceName = '';

    utils.setFieldValue(dom.county, provinceName);
  }
}

fetchifyAutoCompleteUtils.setFields = function(fields, address) {
  var utils = fetchifyAutoCompleteUtils;

  var prefix = utils.getPrefixFromElementId(fields.search);
  var dom = utils.createDOMObject(prefix);

  var hasCompanyName = address.company_name;
  var line1 = (hasCompanyName) 
    ? address.company_name + ', ' + address.line_1
    : address.line_1;

  // Populate all fields
  utils.setFieldValue(dom.line_1, line1);

  if (dom.line_2) utils.setFieldValue(dom.line_2, address.line_2);
  
  utils.setFieldValue(dom.town, address.locality);
  utils.setFieldValue(dom.postcode, address.postal_code);
}

fetchifyAutoCompleteUtils.setDropdownValue = function(field, value) {
  var utils = fetchifyAutoCompleteUtils;

  var input = jQuery(field).find('input')[0];
  var event = new Event('input', { bubbles: true });
  var node = input;
  
  var setValue = Object.getOwnPropertyDescriptor(node.__proto__, 'value').set;

  // Set node.value to non-empty string if value is empty to trigger update
  node.value = (value === '') ? ' ' : '';
  
  setValue.call(node, value);
  
  // Dispatch input event so that React state is updated
  node.dispatchEvent(event);

  var $firstSuggestion = jQuery(field).find('li:first');

  var hasSuggestion = $firstSuggestion.length > 0;
  var hasValue = value.length > 0;

  // Programatically click the first suggestion if it exists
  if (hasValue && hasSuggestion) {
    $firstSuggestion.click();
  // Otherwise set the value to empty
  } else if (hasValue) {
    utils.setDropdownValue(field, '');
  }
}

fetchifyAutoCompleteUtils.setFieldValue = function(input, value) {
  var event = new Event('input', { bubbles: true });
  var node = input;
  
  var setValue = Object.getOwnPropertyDescriptor(node.__proto__, 'value').set;

  // Set node.value to non-empty string if value is empty to trigger update
  node.value = (value === '') ? ' ' : '';
  
  setValue.call(node, value);
  
  // Dispatch input event so that React state is updated
  node.dispatchEvent(event);
}

fetchifyAutoCompleteUtils.setFieldVisibility = function(fields) {
  var config = window.cc_c2a_config.autocomplete;
  var utils = fetchifyAutoCompleteUtils;

  var $line1 = jQuery(fields.line_1);

  var shouldShowFields =
    config.hide_fields &&
    $line1.attr('cc-hidden') !== undefined;
  
  if (shouldShowFields) {
    var prefix = utils.getPrefixFromElementId(fields.search);
    var $form = utils.getFormByPrefix(prefix);

    // Show form fields
    $form.trigger('cc-show');
    
    var shouldHideButton = config.hide_buttons;

    // Remove visibility button
    if (shouldHideButton) utils.removeVisibilityButton(prefix);
  }
}


fetchifyAutoCompleteUtils.handleResultSelected = function(c2a, elements, address) {
  var utils = fetchifyAutoCompleteUtils;
  
  utils.setCountry(elements, address);
  utils.setState(elements, address);
  utils.setFields(elements, address);
  utils.setFieldVisibility(elements);
}

fetchifyAutoCompleteUtils.handleSearchFocus = function(c2a, elements) {
  var utils = fetchifyAutoCompleteUtils;

  utils.setSearchCountry(c2a, elements);
}

fetchifyAutoCompleteUtils.handleError = function() {
  jQuery('[id*="-address_1"]').attr('cc-error', '1');
}


fetchifyAutoCompleteUtils.getPostcodePrefix = function(postcode) {
  return postcode.substring(0, 2);
}

fetchifyAutoCompleteUtils.isCrownDependency = function(postcode) {
  return jQuery.inArray(postcode, [
    'GY',
    'JE',
    'IM'
  ]) !== -1;
}


fetchifyAutoCompleteUtils.setSearchCountry = function(c2a, elements) {
  var utils = fetchifyAutoCompleteUtils;

  var $country = jQuery(elements.country);
  var $input = $country.find('input:first');

  var currentCountry = c2a.activeCountry;
  var nextCountry = utils.getISOCode(
    $input.val()
  );

  var hasNextCountry = nextCountry.length > 0;

  var shouldChangeCountry = 
    hasNextCountry &&
    currentCountry !== nextCountry;

  if (shouldChangeCountry) {
    // Change search country
    c2a.selectCountry(nextCountry);
  } else if (!hasNextCountry) {
    // Wait until the country dropdown has closed
    var interval = setInterval(function() {
      var isNotExpanded = $input.attr('aria-expanded') === 'false';

      if (isNotExpanded) {
        clearInterval(interval);

        // Try to change the search country again
        utils.setSearchCountry(c2a, elements);
      }
    }, 100);
  }
}


var fetchifyEmail = window.cc_c2a_functions.email;
fetchifyEmail.utils = fetchifyEmail.utils || {};
var fetchifyEmailUtils = fetchifyEmail.utils;

fetchifyEmail.addEmail = function() {
  var main = fetchifyEmail;
  var utils = fetchifyEmailUtils;

  var shouldInstantiateC2A = !window.cc_c2a;

  if (shouldInstantiateC2A) {
    window.cc_c2a = new clickToAddress(
      main.createConfig()
    );
  }

  utils.displayEmail([
    'email'
  ]);
}

fetchifyEmail.createBaseConfig = function() {
  var config = window.cc_c2a_config.email;

  return {
    accessToken: config.access_token
  }
}

fetchifyEmail.createConfig = function() {
  var main = fetchifyEmail;
  
  var extendedConfig = main.createBaseConfig();

  return extendedConfig;
}

fetchifyEmailUtils.getBaseDOMObject = function() {
  var dom = {
    email: ''
  }

  return dom;
}

fetchifyEmailUtils.createDOMObject = function(target) {
  var utils = fetchifyEmailUtils;

  var dom = utils.getBaseDOMObject();

  // List of fields
  var fields = [
    target
  ];

  var i = 0;

  // Populate dom with DOM elements
  for (var key in dom) {
    var selector = '#' + fields[i];

    dom[key] = jQuery(selector)[0];

    i++;
  }

  return dom;
}

fetchifyEmailUtils.displayEmail = function(targets) {
  // Continuously check target availability
  setInterval(function() {
    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      var selector = '#' + target;

      var $target = jQuery(selector);

      // Only display when target is available
      var shouldDisplay =
        $target.length &&
        $target.attr('cc-applied') !== '1';

      if (shouldDisplay) {
        var utils = fetchifyEmailUtils;

        // Display Email Validation
        utils.displayOnElement(target);
      }
    }
  }, 200);
}

fetchifyEmailUtils.displayOnElement = function(target) {
  var utils = fetchifyEmailUtils;

  var dom = utils.createDOMObject(target);

  // Get email element
  var email = dom.email;
  var $email = jQuery(email);

  // Set cc-applied attribute
  $email.attr('cc-applied', '1');

  // Display Email Validation on email field
  window.cc_c2a.addEmailVerify({
    email: email
  });
}

var fetchifyPhone = window.cc_c2a_functions.phone;
fetchifyPhone.utils = fetchifyPhone.utils || {};
var fetchifyPhoneUtils = fetchifyPhone.utils;

fetchifyPhone.addPhone = function() {
  var main = fetchifyPhone;
  var utils = fetchifyPhoneUtils;

  var shouldInstantiateC2A = !window.cc_c2a;

  if (shouldInstantiateC2A) {
    window.cc_c2a = new clickToAddress(
      main.createConfig()
    );
  }

  utils.displayPhone([
    'billing',
    'shipping'
  ]);
}

fetchifyPhone.createBaseConfig = function() {
  var config = window.cc_c2a_config.phone;

  return {
    accessToken: config.access_token
  }
}

fetchifyPhone.createConfig = function() {
  var main = fetchifyPhone;
  
  var extendedConfig = main.createBaseConfig();

  return extendedConfig;
}

fetchifyPhoneUtils.getCountries = function() {
  var wc = window.wc;
  var countries = wc.wcSettings.getSetting('countries');

  return countries;
}

fetchifyPhoneUtils.getISOCode = function(country) {
  var utils = fetchifyPhoneUtils;

  var countries = utils.getCountries();

  for (var code in countries) {
    if (countries[code] === country) {
      return code;
    }
  }

  return '';
}

fetchifyPhoneUtils.getCurrentCountryISO = function(prefix) {
  var utils = fetchifyPhoneUtils;

  var dom = utils.createDOMObject(prefix);

  // Get country element and its current value
  var $country = jQuery(dom.country);
  var country = $country.find('input').val();

  // Get country ISO code from country value
  var countryCode = utils.getISOCode(country);

  return countryCode;
}

fetchifyPhoneUtils.getBaseDOMObject = function() {
  var dom = {
    phone: '',
    country: '',
  }

  return dom;
}

fetchifyPhoneUtils.createDOMObject = function(prefix) {
  var utils = fetchifyPhoneUtils;

  var dom = utils.getBaseDOMObject();

  // List of fields
  var fields = [
    'phone',
    'country'
  ];

  var i = 0;

  // Populate dom with DOM elements
  for (var key in dom) {
    var selector = '#' + prefix + fields[i];

    dom[key] = jQuery(selector)[0];

    i++;
  }

  return dom;
}

fetchifyPhoneUtils.displayPhone = function(targets) {
  // Continuously check target availability
  setInterval(function() {
    for (var i = 0; i < targets.length; i++) {
      var prefix = targets[i] + '-';
      var selector = '#' + prefix + 'phone';
      var $target = jQuery(selector);

      // Only display when target is available
      var shouldDisplay =
        $target.length &&
        $target.attr('cc-applied') !== '1';

      if (shouldDisplay) {
        var utils = fetchifyPhoneUtils;

        // Display Phone Validation
        utils.displayOnElement(prefix);
      }
    }
  }, 200);
}

fetchifyPhoneUtils.displayOnElement = function(prefix) {
  var config = window.cc_c2a_config.phone;
  var utils = fetchifyPhoneUtils;

  var dom = utils.createDOMObject(prefix);

  // Get phone element
  var phone = dom.phone;
  var $phone = jQuery(phone);

  // Set cc-applied attribute
  $phone.attr('cc-applied', '1');

  // Display Phone Validation on phone field
  window.cc_c2a.addPhoneVerify({
    phone: phone,
    country: function() {
      var country = utils.getCurrentCountryISO(prefix);

      return country;
    },
    beforeCorrect: function(element, result) {
      utils.handleCorrect(prefix, result);
    },
    can_correct: config.can_correct,
    allowed_type: config.allowed_type
  });
}

fetchifyPhoneUtils.setField = function(prefix, value) {
  var utils = fetchifyPhoneUtils;
  var dom = utils.createDOMObject(prefix);

  // Populate phone field
  utils.setFieldValue(dom.phone, value);
}

fetchifyPhoneUtils.setFieldValue = function(input, value) {
  var event = new Event('input', { bubbles: true });
  var node = input;
  
  var setValue = Object.getOwnPropertyDescriptor(node.__proto__, 'value').set;

  // Set node.value to non-empty string if value is empty to trigger update
  node.value = (value === '') ? ' ' : '';
  
  setValue.call(node, value);
  
  // Dispatch input event so that React state is updated
  node.dispatchEvent(event);
}

fetchifyPhoneUtils.handleCorrect = function(prefix, result) {
  var utils = fetchifyPhoneUtils;

  var dom = utils.createDOMObject(prefix);
  
  // Get current and next phone value
  var currentPhoneValue = jQuery(dom.phone).val();
  var nextPhoneValue = result.national_format;

  var isInternational = currentPhoneValue.indexOf('+') !== -1;

  // Use international format
  if (isInternational) nextPhoneValue = result.phone_number;

  utils.setField(prefix, nextPhoneValue);
}

var fetchifyPostcode = window.cc_c2a_functions.postcode;
fetchifyPostcode.utils = fetchifyPostcode.utils || {};
var fetchifyPostcodeUtils = fetchifyPostcode.utils;

fetchifyPostcode.addPostcode = function() {
  var main = fetchifyPostcode;
  var utils = fetchifyPostcodeUtils;

  utils.displayPostcode([
    {
      target: 'billing',
      pcl: main.createPcl('billing'),
    },
    {
      target: 'shipping',
      pcl: main.createPcl('shipping')
    }
  ]);
}


fetchifyPostcode.createConfig = function(prefix) {
  var config = window.cc_c2a_config.postcode;
  var utils = fetchifyPostcodeUtils;

  var id = utils.getFieldIds(prefix);

  return {
    access_token: config.access_token,
    result_elem_id: prefix + 'pcl_results',
    busy_img_url: config.busy_img_url,
    form: '',
    org_uppercase: 0,
    town_uppercase: 0,
    elem_company: id.company,
    elem_street1: id.street1,
    elem_street2: id.street2,
    elem_town: id.town,
    elem_county: id.county,
    elem_postcode: id.postcode,
    res_autoselect: config.res_autoselect,
    traditional_county: config.counties,
    msg1: config.msg1,
    err_msg1: config.err_msg1,
    err_msg2: config.err_msg2,
    err_msg3: config.err_msg3,
    err_msg4: config.err_msg4,
    max_width: '100%',
    on_result_selected: function() {
      utils.handleResultSelected(prefix);
    },
    on_result_ready: function() {
      utils.handleResultReady(prefix);
    },
    on_error: function() {
      utils.handleError(prefix);
    }
  }
}

fetchifyPostcode.setConfig = function(pcl, target) {
  var main = fetchifyPostcode;

  var prefix = target + '-';
  var config = main.createConfig(prefix);

  // Set all configuration options
  for (var property in config) {
    pcl.set(property, config[property]);
  }

  return pcl;
}

fetchifyPostcode.createPcl = function(target) {
  var pcl = CraftyPostcodeCreate();
  var main = fetchifyPostcode;

  return main.setConfig(pcl, target);
}


if(!_cp_js_included){var _cp_js_included=1;var _cp_instances=[],_cp_instance_idx=0,_cp_pl=["FLAT","SHOP","UNIT","BLOCK","STALL","SUITE","APARTMENT","MAISONETTE","HOUSE NUMBER"];function CraftyPostcodeCreate(){_cp_instance_idx++;_cp_instances[_cp_instance_idx]=new CraftyPostcodeClass();_cp_instances[_cp_instance_idx].obj_idx=_cp_instance_idx;return _cp_instances[_cp_instance_idx]}function _cp_sp(b){var d="",c;for(c=0;c<_cp_pl.length;c++){d=_cp_pl[c];if(d==b.substr(0,d.length).toUpperCase()){return(b.substr(d.length))}}return("")}function _cp_eh(a){var b="";while(b=a.shift()){if(!isNaN(parseInt(b))){return(parseInt(b))}}return""}function _cp_kp(a){var b;if(!a){a=window.event}if(a.keyCode){b=a.keyCode}else{if(a.which){b=a.which}}if(b==13){this.onclick()}}function CraftyPostcodeClass(){this.config={lookup_url:"pcls1.craftyclicks.co.uk/js/",access_token:"",basic_address:0,traditional_county:0,busy_img_url:"crafty_postcode_busy.gif",hide_result:0,org_uppercase:1,town_uppercase:1,county_uppercase:0,addr_uppercase:0,delimiter:", ",msg1:"Please wait while we find the address",err_msg1:"This postcode could not be found, please try again or enter your address manually",err_msg2:"This postcode is not valid, please try again or enter your address manually",err_msg3:"Unable to connect to address lookup server, please enter your address manually.",err_msg4:"An unexpected error occured, please enter your address manually.",res_autoselect:1,res_select_on_change:1,debug_mode:0,lookup_timeout:10000,form:"",elements:"",max_width:"400px",max_lines:1,first_res_line:"---- please select your address ----",result_elem_id:"",on_result_ready:null,on_result_selected:null,on_error:null,pre_populate_common_address_parts:0,elem_company:"crafty_out_company",elem_house_num:"",elem_street1:"crafty_out_street1",elem_street2:"crafty_out_street2",elem_street3:"crafty_out_street3",elem_town:"crafty_out_town",elem_county:"crafty_out_county",elem_postcode:"crafty_in_out_postcode",elem_udprn:"crafty_out_udprn",single_res_autoselect:0,single_res_notice:"---- address found, see below ----",elem_search_house:"crafty_in_search_house",elem_search_street:"crafty_in_search_street",elem_search_town:"crafty_in_search_town",max_results:25,err_msg5:"The house name/number could not be found, please try again.",err_msg6:"No results found, please modify your search and try again.",err_msg7:"Too many results, please modify your search and try again.",err_msg9:"Please provide more data and try again.",err_msg8:"Trial account limit reached, please use AA11AA, AA11AB, AA11AD or AA11AE."};this.xmlhttp=null;this.res_arr=null;this.disp_arr=null;this.res_arr_idx=0;this.dummy_1st_line=0;this.cc=0;this.flexi_search=0;this.lookup_timeout=null;this.obj_name="";this.house_search=0;this.set=function(a,b){this.config[a]=b};this.res_clicked=function(a){this.cc++;if(this.res_selected(a)){if(0!=this.config.hide_result&&((2>=this.config.max_lines&&1<this.cc)||(2<this.config.max_lines))){this.update_res(null);this.cc=0}}};this.res_selected=function(a){if(1==this.dummy_1st_line){if(0==a){return 0}else{a--}}a=this.disp_arr[a]["index"];this.populate_form_fields(this.res_arr[a]);if(this.config.on_result_selected){this.config.on_result_selected(a)}return 1};this.populate_form_fields=function(j){var b=[];var o=this.config.delimiter;for(var e=0;e<8;e++){b[e]=this.get_elem(e)}b[11]=this.get_elem(11);if(b[11]){b[11].value=j.udprn}if(b[0]){if(b[0]==b[1]&&""!=j.org){b[1].value=j.org;b[1]=b[2];b[2]=b[3];b[3]=null}else{b[0].value=j.org}}var n=j.housename2;if(""!=n&&""!=j.housename1){n+=o}n+=j.housename1;var k=j.housenumber;if(b[7]){b[7].value=n;if(""!=n&&""!=k){b[7].value+=o}b[7].value+=k;n="";k=""}var d=j.street1;var c=j.street2;if(""!=k){if(""!=c){c=k+" "+c}else{if(""!=d){d=k+" "+d}else{d=k}}}var g=c+(c==""?"":(d==""?"":o))+d;var m=j.locality_dep;var h=j.locality;if(""!=g&&parseInt(g)==g){if(""!=m){m=parseInt(g)+" "+m}else{h=parseInt(g)+" "+h}g="";d=""}var f=m+(m==""||h==""?"":o)+h;var a=g+(g==""||f==""?"":o)+f;if(b[1]&&b[2]&&b[3]){if(""!=j.pobox||""!=n){if(""!=j.pobox){b[1].value=j.pobox}else{b[1].value=n}if(""==f){if(""==c){b[2].value=d;b[3].value=""}else{b[2].value=c;b[3].value=d}}else{if(""==g){if(""==m){b[2].value=h;b[3].value=""}else{b[2].value=m;b[3].value=h}}else{b[2].value=g;b[3].value=f}}}else{if(""==g){if(""==m){b[1].value=h;b[2].value="";b[3].value=""}else{b[1].value=m;b[2].value=h;b[3].value=""}}else{if(""==f){if(""==c){b[1].value=d;b[2].value="";b[3].value=""}else{b[1].value=c;b[2].value=d;b[3].value=""}}else{if(""==c){b[1].value=d;if(""==m){b[2].value=h;b[3].value=""}else{b[2].value=m;b[3].value=h}}else{if(""==m){b[1].value=c;b[2].value=d;b[3].value=h}else{if(g.length<f.length){b[1].value=g;b[2].value=m;b[3].value=h}else{b[1].value=c;b[2].value=d;b[3].value=f}}}}}}}else{if(b[1]&&b[2]){if(""!=j.pobox){b[1].value=j.pobox;b[2].value=a}else{if(""!=n&&""!=g&&""!=f){if((n.length+g.length)<(g.length+f.length)){b[1].value=n+(n==""?"":o)+g;b[2].value=f}else{b[1].value=n;b[2].value=g+(g==""?"":o)+f}}else{if(""!=n&&""!=g){b[1].value=n;b[2].value=g}else{if(""==n&&""!=g){if(""==f){if(""!=c){b[1].value=c;b[2].value=d}else{b[1].value=g;b[2].value=""}}else{b[1].value=g;b[2].value=f}}else{if(""==g&&""!=n){b[1].value=n;b[2].value=f}else{b[1].value=f;b[2].value=""}}}}}}else{var l;if(b[1]){l=b[1]}else{if(b[2]){l=b[2]}else{l=b[3]}}if(""!=j.pobox){l.value=j.pobox+o+f}else{l.value=n+(n==""||a==""?"":o)+a}}}if(b[4]){b[4].value=j.town}if(b[5]){b[5].value=j.county}if(b[6]){b[6].value=j.postcode}return 1};this.show_busy=function(){var b=document.createElement("img");var a=document.createAttribute("src");a.value=this.config.busy_img_url;b.setAttributeNode(a);a=document.createAttribute("title");a.value=this.config.msg1;b.setAttributeNode(a);this.update_res(b)};this.disp_err=function(d,b){var a=null;var e="";if(""!=d){switch(d){case"0001":e=this.config.err_msg1;break;case"0002":e=this.config.err_msg2;break;case"9001":e=this.config.err_msg3;break;case"0003":e=this.config.err_msg9;break;case"0004":e=this.config.err_msg6;break;case"0005":e=this.config.err_msg7;break;case"7001":e=this.config.err_msg8;break;default:e="("+d+") "+this.config.err_msg4;break}if(this.config.debug_mode){var c="";switch(d){case"8000":c=" :: No Access Token ";break;case"8001":c=" :: Invalid Token Format ";break;case"8002":c=" :: Invalid Token ";break;case"8003":c=" :: Out of Credits ";break;case"8004":c=" :: Restricted by rules ";break;case"8005":c=" :: Token suspended ";break}e+=c+" :: DBG :: "+b}a=document.createTextNode(e)}this.update_res(a);if(this.config.on_error){this.config.on_error(e)}};this.disp_err_msg=function(b){var a=null;if(""!=b){a=document.createTextNode(b)}this.update_res(a);if(this.config.on_error){this.config.on_error(b)}};this.display_res_line=function(d,c){var b=document.getElementById("crafty_postcode_lookup_result_option"+this.obj_idx);var e=document.createElement("option");e.appendChild(document.createTextNode(d));if(null!=b){b.appendChild(e)}else{var a=document.createElement("select");a.id="crafty_postcode_lookup_result_option"+this.obj_idx;a.onchange=Function("_cp_instances["+this.obj_idx+"].res_clicked(this.selectedIndex);");a.onkeypress=_cp_kp;if(0!=this.config.res_select_on_change){a.onchange=Function("_cp_instances["+this.obj_idx+"].res_selected(this.selectedIndex);")}if(this.config.max_width&&""!=this.config.max_width){a.style.width=this.config.max_width}var f=this.res_arr_idx;if(1==this.dummy_1st_line){f++}if((navigator.appName=="Microsoft Internet Explorer")&&(parseFloat(navigator.appVersion)<=4)){a.size=0}else{if(f>=this.config.max_lines){a.size=this.config.max_lines}else{a.size=f}}a.appendChild(e);this.update_res(a)}};this.update_res=function(a){if(this.lookup_timeout){clearTimeout(this.lookup_timeout)}try{if(document.getElementById){var b=document.getElementById(this.config.result_elem_id);if(b.hasChildNodes()){while(b.firstChild){b.removeChild(b.firstChild)}}if(null!=a){b.appendChild(a)}}}catch(c){}};this.str_trim=function(b){var a=0;var c=b.length-1;while(a<b.length&&b[a]==" "){a++}while(c>a&&b[c]==" "){c-=1}return b.substring(a,c+1)};this.cp_uc=function(e){if("PC"==e||"UK"==e||"EU"==e){return(e)}var d="ABCDEFGHIJKLMNOPQRSTUVWXYZ";var c="";var f=1;var b=0;for(var a=0;a<e.length;a++){if(-1!=d.indexOf(e.charAt(a))){if(f||b){c=c+e.charAt(a);f=0}else{c=c+e.charAt(a).toLowerCase()}}else{c=c+e.charAt(a);if(a+2>=e.length&&"'"==e.charAt(a)){f=0}else{if("("==e.charAt(a)){close_idx=e.indexOf(")",a+1);if(a+3<close_idx){b=0;f=1}else{b=1}}else{if(")"==e.charAt(a)){b=0;f=1}else{if("-"==e.charAt(a)){close_idx=e.indexOf("-",a+1);if((-1!=close_idx&&a+3>=close_idx)||a+3>=e.length){b=0;f=0}else{b=0;f=1}}else{if(a+2<e.length&&"0"<=e.charAt(a)&&"9">=e.charAt(a)){f=0}else{f=1}}}}}}}return(c)};this.leading_caps=function(a,b){if(0!=b||2>a.length){return(a)}var d="";var f=a.split(" ");for(var c=0;c<f.length;c++){var e=this.str_trim(f[c]);if(""!=e){if(""!=d){d=d+" "}d=d+this.cp_uc(e)}}return(d)};this.new_res_line=function(){var a=[];a.org="";a.housename1="";a.housename2="";a.pobox="";a.housenumber="";a.street1="";a.street2="";a.locality_dep="";a.locality="";a.town="";a.county="";a.postcode="";a.udprn="";return(a)};this.res_arr_compare=function(e,c){if(e.match_quality>c.match_quality){return(1)}if(e.match_quality<c.match_quality){return(-1)}if(e.street1>c.street1){return(1)}if(e.street1<c.street1){return(-1)}if(e.street2>c.street2){return(1)}if(e.street2<c.street2){return(-1)}var h;if(""==e.housenumber){h=_cp_eh(Array(e.housename1,e.housename2))}else{h=parseInt(e.housenumber)}var g;if(""==c.housenumber){g=_cp_eh(Array(c.housename1,c.housename2))}else{g=parseInt(c.housenumber)}if(""==h&&""!=g){return(1)}else{if(""!=h&&""==g){return(-1)}else{if(h>g){return(1)}if(h<g){return(-1)}}}var f=_cp_sp(e.housename1);if(!isNaN(parseInt(f))){f=parseInt(f)}var d=_cp_sp(c.housename1);if(!isNaN(parseInt(d))){d=parseInt(d)}if(f>d){return(1)}if(f<d){return(-1)}var f=_cp_sp(e.housename2);if(!isNaN(parseInt(f))){f=parseInt(f)}var d=_cp_sp(c.housename2);if(!isNaN(parseInt(d))){d=parseInt(d)}if(f>d){return(1)}if(f<d){return(-1)}f=e.housename2+e.housename1;d=c.housename2+c.housename1;if(f>d){return(1)}if(f<d){return(-1)}if(e.org>c.org){return(1)}if(e.org<c.org){return(-1)}return(1)};this.disp_res_arr=function(){this.res_arr=this.res_arr.sort(this.res_arr_compare);if(0!=this.config.res_autoselect){this.populate_form_fields(this.res_arr[0])}var a=this.config.delimiter;this.disp_arr=[];for(var c=0;c<this.res_arr_idx;c++){var e=this.res_arr[c];var b=e.org+(e.org!=""?a:"")+e.housename2+(e.housename2!=""?a:"")+e.housename1+(e.housename1!=""?a:"")+e.pobox+(e.pobox!=""?a:"")+e.housenumber+(e.housenumber!=""?" ":"")+e.street2+(e.street2!=""?a:"")+e.street1+(e.street1!=""?a:"")+e.locality_dep+(e.locality_dep!=""?a:"")+e.locality+(e.locality!=""?a:"")+e.town;if(this.flexi_search){b+=a+e.postcode}var d=[];d.index=c;d.str=b;this.disp_arr[c]=d}this.dummy_1st_line=0;if(""!=this.config.first_res_line){this.dummy_1st_line=1;this.display_res_line(this.config.first_res_line,-1)}for(var c=0;c<this.res_arr_idx;c++){this.display_res_line(this.disp_arr[c]["str"],c)}if(this.config.pre_populate_common_address_parts){var f=this.new_res_line();f.org=this.res_arr[0]["org"];f.housename1=this.res_arr[0]["housename1"];f.housename2=this.res_arr[0]["housename2"];f.pobox=this.res_arr[0]["pobox"];f.housenumber=this.res_arr[0]["housenumber"];f.street1=this.res_arr[0]["street1"];f.street2=this.res_arr[0]["street2"];f.locality_dep=this.res_arr[0]["locality_dep"];f.locality=this.res_arr[0]["locality"];f.town=this.res_arr[0]["town"];f.county=this.res_arr[0]["county"];f.postcode=this.res_arr[0]["postcode"];f.udprn=this.res_arr[0]["udprn"];for(var c=1;c<this.res_arr_idx;c++){if(this.res_arr[c]["org"]!=f.org){f.org=""}if(this.res_arr[c]["housename2"]!=f.housename2){f.housename2=""}if(this.res_arr[c]["housename1"]!=f.housename1){f.housename1=""}if(this.res_arr[c]["pobox"]!=f.pobox){f.pobox=""}if(this.res_arr[c]["housenumber"]!=f.housenumber){f.housenumber=""}if(this.res_arr[c]["street1"]!=f.street1){f.street1=""}if(this.res_arr[c]["street2"]!=f.street2){f.street2=""}if(this.res_arr[c]["locality_dep"]!=f.locality_dep){f.locality_dep=""}if(this.res_arr[c]["locality"]!=f.locality){f.locality=""}if(this.res_arr[c]["town"]!=f.town){f.town=""}if(this.res_arr[c]["county"]!=f.county){f.county=""}if(this.res_arr[c]["postcode"]!=f.postcode){f.postcode=""}if(this.res_arr[c]["udprn"]!=f.udprn){f.udprn=""}}this.populate_form_fields(f)}};this.get_elem=function(a){var d="";var c=null;if(""!=this.config.elements){var b=this.config.elements.split(",");d=b[a]}else{switch(a){case 0:d=this.config.elem_company;break;case 1:d=this.config.elem_street1;break;case 2:d=this.config.elem_street2;break;case 3:d=this.config.elem_street3;break;case 4:d=this.config.elem_town;break;case 5:d=this.config.elem_county;break;case 6:default:d=this.config.elem_postcode;break;case 7:d=this.config.elem_house_num;break;case 8:d=this.config.elem_search_house;break;case 9:d=this.config.elem_search_street;break;case 10:d=this.config.elem_search_town;break;case 11:d=this.config.elem_udprn;break}}if(""!=d){if(""!=this.config.form){c=document.forms[this.config.form].elements[d]}else{if(document.getElementById){c=document.getElementById(d)}}}return(c)};this.doHouseSearch=function(){var a=this.get_elem(8);if(a&&0<a.value.length){this.house_search=1}this.doLookup()};this.doLookup=function(){this.xmlhttp=null;var a=this.get_elem(6);var b=null;if(a){this.show_busy();this.lookup_timeout=setTimeout("_cp_instances["+this.obj_idx+"].lookup_timeout_err()",this.config.lookup_timeout);b=this.validate_pc(a.value)}if(null!=b){this.direct_xml_fetch(0,b)}else{this.disp_err("0002","invalid postcode format")}};this.flexiSearch=function(){this.xmlhttp=null;var a="";if(this.get_elem(8)&&""!=this.get_elem(8).value){a+="&search_house="+this.get_elem(8).value}if(this.get_elem(9)&&""!=this.get_elem(9).value){a+="&search_street="+this.get_elem(9).value}if(this.get_elem(10)&&""!=this.get_elem(10).value){a+="&search_town="+this.get_elem(10).value}if(""!=a){this.show_busy();this.lookup_timeout=setTimeout("_cp_instances["+this.obj_idx+"].lookup_timeout_err()",this.config.lookup_timeout);this.direct_xml_fetch(1,a)}else{this.disp_err("0003","search string too short")}};this.validate_pc=function(c){var b="";do{b=c;c=c.replace(/[^A-Za-z0-9]/,"")}while(b!=c);b=c.toUpperCase();if(7>=b.length&&5<=b.length){var d=b.substring(b.length-3,b.length);var a=b.substring(0,b.length-3);if(true==/[CIKMOV]/.test(d)){return null}if("0"<=d.charAt(0)&&"9">=d.charAt(0)&&"A"<=d.charAt(1)&&"Z">=d.charAt(1)&&"A"<=d.charAt(2)&&"Z">=d.charAt(2)){switch(a.length){case 2:if("A"<=a.charAt(0)&&"Z">=a.charAt(0)&&"0"<=a.charAt(1)&&"9">=a.charAt(1)){return(b)}break;case 3:if("A"<=a.charAt(0)&&"Z">=a.charAt(0)){if("0"<=a.charAt(1)&&"9">=a.charAt(1)&&"0"<=a.charAt(2)&&"9">=a.charAt(2)){return(b)}else{if("A"<=a.charAt(1)&&"Z">=a.charAt(1)&&"0"<=a.charAt(2)&&"9">=a.charAt(2)){return(b)}else{if("0"<=a.charAt(1)&&"9">=a.charAt(1)&&"A"<=a.charAt(2)&&"Z">=a.charAt(2)){return(b)}}}}break;case 4:if("A"<=a.charAt(0)&&"Z">=a.charAt(0)&&"A"<=a.charAt(1)&&"Z">=a.charAt(1)&&"0"<=a.charAt(2)&&"9">=a.charAt(2)){if("0"<=a.charAt(3)&&"9">=a.charAt(3)){return(b)}else{if("A"<=a.charAt(3)&&"Z">=a.charAt(3)){return(b)}}}break;default:break}}}return null};this.direct_xml_fetch=function(d,a){try{var e=document.getElementById(this.config.result_elem_id);var b="";if("https:"==document.location.protocol){b="https://"}else{b="http://"}if(0==d){b+=this.config.lookup_url;if(this.config.basic_address){b+="basicaddress"}else{b+="rapidaddress"}b+="?postcode="+a+"&callback=_cp_instances["+this.obj_idx+"].handle_js_response&callback_id=0"}else{if(this.config.basic_address){this.disp_err("1207","BasicAddress can't be used for Flexi Search!");return}else{b+=this.config.lookup_url+"flexiaddress?callback=_cp_instances["+this.obj_idx+"].handle_js_response&callback_id=1";b+="&max_results="+this.config.max_results;b+=a}}if(""!=this.config.access_token){b+="&key="+this.config.access_token}var c=document.createElement("script");c.src=encodeURI(b);c.type="text/javascript";e.appendChild(c)}catch(f){this.disp_err("1206",f)}};this.handle_js_response=function(c,d,e){if(!d){var f=e.error_code;var a=e.error_msg;this.disp_err(f,a)}else{this.res_arr=[];this.res_arr_idx=0;if(0==c){this.flexi_search=0;if(this.house_search){e=this.filter_data_by_house_name(e);if(null==e){this.disp_err_msg(this.config.err_msg5);return}}this.add_to_res_array(e)}else{this.flexi_search=1;this.res_arr.total_postcode_count=e.total_postcode_count;this.res_arr.total_thoroughfare_count=e.total_thoroughfare_count;this.res_arr.total_delivery_point_count=e.total_delivery_point_count;for(var i=1;i<=e.total_postcode_count;i++){this.add_to_res_array(e[i])}}if(this.res_arr_idx){var b=false;if(1==this.res_arr_idx&&this.config.single_res_autoselect){var g=null;if(""!=this.config.single_res_notice){g=document.createTextNode(this.config.single_res_notice)}this.update_res(g);this.populate_form_fields(this.res_arr[0]);b=true}else{this.disp_res_arr();document.getElementById("crafty_postcode_lookup_result_option"+this.obj_idx).focus()}if(0==c&&""!=e.postcode){var h=this.get_elem(6);h.value=e.postcode}if(this.config.on_result_ready){this.config.on_result_ready()}if(b&&this.config.on_result_selected){this.config.on_result_selected(0)}}else{this.disp_err("1205","no result to display")}}};this.add_to_res_array=function(f){for(var d=1;d<=f.thoroughfare_count;d++){var e=f[d]["thoroughfare_name"];if(""!=f[d]["thoroughfare_descriptor"]){e+=" "+f[d]["thoroughfare_descriptor"]}e=this.leading_caps(e,this.config.addr_uppercase);var c=f[d]["dependent_thoroughfare_name"];if(""!=f[d]["dependent_thoroughfare_descriptor"]){c+=" "+f[d]["dependent_thoroughfare_descriptor"]}c=this.leading_caps(c,this.config.addr_uppercase);if("delivery_point_count" in f[d]&&0<f[d]["delivery_point_count"]){for(var a=1;a<=f[d]["delivery_point_count"];a++){var g=this.new_res_line();g.street1=e;g.street2=c;var b=f[d][a];if("match_quality" in b){g.match_quality=b.match_quality}else{g.match_quality=1}g.housenumber=b.building_number;g.housename2=this.leading_caps(b.sub_building_name,this.config.addr_uppercase);g.housename1=this.leading_caps(b.building_name,this.config.addr_uppercase);g.org=b.department_name;if(""!=g.org&&""!=b.organisation_name){g.org+=this.config.delimiter}g.org=this.leading_caps(g.org+b.organisation_name,this.config.org_uppercase);g.pobox=this.leading_caps(b.po_box_number,this.config.addr_uppercase);g.postcode=f.postcode;g.town=this.leading_caps(f.town,this.config.town_uppercase);g.locality=this.leading_caps(f.dependent_locality,this.config.addr_uppercase);g.locality_dep=this.leading_caps(f.double_dependent_locality,this.config.addr_uppercase);if(this.config.traditional_county){g.county=this.leading_caps(f.traditional_county,this.config.county_uppercase)}else{g.county=this.leading_caps(f.postal_county,this.config.county_uppercase)}g.udprn=b.udprn;this.res_arr[this.res_arr_idx]=g;this.res_arr_idx++}}else{var g=this.new_res_line();g.street1=e;g.street2=c;g.postcode=f.postcode;g.town=this.leading_caps(f.town,this.config.town_uppercase);g.locality=this.leading_caps(f.dependent_locality,this.config.addr_uppercase);g.locality_dep=this.leading_caps(f.double_dependent_locality,this.config.addr_uppercase);if(this.config.traditional_county){g.county=this.leading_caps(f.traditional_county,this.config.county_uppercase)}else{g.county=this.leading_caps(f.postal_county,this.config.county_uppercase)}g.match_quality=2;this.res_arr[this.res_arr_idx]=g;this.res_arr_idx++}}};this.filter_data_by_house_name=function(f){var g=this.get_elem(8);if(!g||!g.value.length){return f}var j=g.value.toUpperCase();var k=-1;if(parseInt(j)==j){k=parseInt(j)}var l=" "+j;var e=[];var i=1;var b=0;for(var c=1;c<=f.thoroughfare_count;c++){e[i]=[];b=0;for(var d=1;d<=f[c]["delivery_point_count"];d++){var h=f[c][d];var a=" "+h.sub_building_name+" "+h.building_name+" ";if(-1!=a.indexOf(l)||k==parseInt(h.building_number)){b++;e[i][b]=[];e[i][b]["building_number"]=h.building_number;e[i][b]["sub_building_name"]=h.sub_building_name;e[i][b]["building_name"]=h.building_name;e[i][b]["department_name"]=h.department_name;e[i][b]["organisation_name"]=h.organisation_name;e[i][b]["po_box_number"]=h.po_box_number;e[i][b]["udprn"]=h.udprn}}if(b){e[i]["delivery_point_count"]=b;e[i]["thoroughfare_name"]=f[c]["thoroughfare_name"];e[i]["thoroughfare_descriptor"]=f[c]["thoroughfare_descriptor"];e[i]["dependent_thoroughfare_name"]=f[c]["dependent_thoroughfare_name"];e[i]["dependent_thoroughfare_descriptor"]=f[c]["dependent_thoroughfare_descriptor"];i++}}if(1<i){e.thoroughfare_count=i-1;e.town=f.town;e.dependent_locality=f.dependent_locality;e.double_dependent_locality=f.double_dependent_locality;e.traditional_county=f.traditional_county;e.postal_county=f.postal_county;e.postcode=f.postcode;return e}return null};this.lookup_timeout_err=function(){this.disp_err("9001","Internal Timeout after "+this.config.lookup_timeout+"ms")}}};
{};


fetchifyPostcodeUtils.getCountries = function() {
  var wc = window.wc;
  var countries = wc.wcSettings.getSetting('countries');

  return countries;
}

fetchifyPostcodeUtils.isValidCountry = function(country) {
  var utils = fetchifyPostcodeUtils;

  var allowedCountries = [
    'GB',
    'JE',
    'GG',
    'IM'
  ];

  var countries = utils.getCountries();

  // Check if the country is valid
  for (var countryCode in countries) {
    var currentCountry = countries[countryCode];

    // Find country in countries object
    if (currentCountry === country) {
      // Check if country code matches the allowed countries
      return jQuery.inArray(countryCode, allowedCountries) !== -1;
    }
  }
}


fetchifyPostcodeUtils.getBaseDOMObject = function() {
  var dom = {
    company: '',
    street1: '',
    street2: '',
    town: '',
    county: '',
    postcode: '',
    country: '',
    visibility: '',
    find: '',
    results: ''
  };

  return dom;
}

fetchifyPostcodeUtils.createDOMObject = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  var dom = utils.getBaseDOMObject();

  // List of fields to be popualted
  var fields = utils.getFieldIds(prefix);

  // Populate dom with DOM elements
  for (var key in dom) {
    var selector = '#' + fields[key];

    dom[key] = jQuery(selector)[0];
  }

  return dom;
}

fetchifyPostcodeUtils.removeTrailingComma = function(string) {
  var suffix = ', ';

  var hasTrailingComma = string.indexOf(suffix, string.length - suffix.length) !== -1;

  if (hasTrailingComma) string = string.slice(0, -suffix.length);

  return string;
}

fetchifyPostcodeUtils.formatPrefix = function(prefix) {
  var hasSeperator = prefix.charAt(prefix.length - 1) === '-';

  if (hasSeperator) return prefix.replace('-', '');

  return prefix + '-';
}

fetchifyPostcodeUtils.getFormByPrefix = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  var id = utils.formatPrefix(prefix);
  var selector = '#' + id;

  var $form = jQuery(selector);

  return $form;
}

fetchifyPostcodeUtils.getWCVersion = function() {
  var wc = window.wc;
  var version = wc.wcSettings.getSetting('wcVersion');

  return version.split('.')[0];
}

fetchifyPostcodeUtils.displayPostcode = function(targets) {
  // Continuously check target availability and state
  setInterval(function() {
    for (var i = 0; i < targets.length; i++) {
      var prefix = targets[i].target + '-';
      var selector = '#' + prefix + 'address_1';
      var $target = jQuery(selector);

      // Only display when target is available
      var shouldDisplay =
        $target.length &&
        $target.attr('cc-applied') !== '1';

      if (shouldDisplay) {
        var utils = fetchifyPostcodeUtils;

        var dom = utils.createDOMObject(prefix);

        // Check if country is valid
        var country = jQuery(dom.country).find('input').val();
        var isValidCountry = utils.isValidCountry(country);

        // Display Postcode Lookup
        if (isValidCountry) {
          var config = window.cc_c2a_config.postcode;
          var pcl = targets[i].pcl;
          
          var shouldHideFields = config.hide_fields;

          utils.displayLookup(prefix, pcl);
          utils.setLayoutStyles(prefix);

          if (shouldHideFields) {
            // Display visibility button
            utils.displayVisibilityButton(prefix);
            
            // Hide fields
            utils.hideFields(prefix);
          }
        }
      }
    }
  }, 200);
}

fetchifyPostcodeUtils.displayLookup = function(prefix, pcl) {
  var utils = fetchifyPostcodeUtils;

  var dom = utils.createDOMObject(prefix);
  var $line1 = jQuery(dom.street1);
  var $postcode = jQuery(dom.postcode);
  var $country = jQuery(dom.country);

  // Set cc-applied attribute
  $line1.attr('cc-applied', '1');

  // Create hidden company field
  var $companyField = utils.createHiddenCompanyField(prefix);

  // Create lookup button and results dropdown
  var $button = utils.createLookupButton(prefix, pcl);
  var $resultsDropdown = utils.createResultsDropdown(prefix);

  // Insert company field before postcode
  $companyField.insertBefore($postcode.parent('div'));

  // Insert button after postcode field
  $button.insertAfter($postcode.parent('div'));

  // Insert results dropdown after postcode field
  $resultsDropdown.insertAfter($button);


  // Remove lookup when changing country
  $country.find('input').on('focus', function() {
    utils.removeLookup(prefix);
  });
}

fetchifyPostcodeUtils.removeLookup = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  var dom = utils.createDOMObject(prefix);

  var $company = jQuery(dom.company);
  var $street1 = jQuery(dom.street1);
  var $find = jQuery(dom.find);
  var $results = jQuery(dom.results);

  // Unset layout styles
  utils.unsetLayoutStyles(prefix);

  // Remove elements
  $company.remove();
  $find.remove();
  $results.remove();

  // Remove attributes
  $street1.removeAttr('cc-applied');
  $street1.removeAttr('cc-hidden');
}

fetchifyPostcodeUtils.createHiddenCompanyField = function(prefix) {
  var html;

  html = '<input id="' + prefix + 'company' + '" style="display: none;"></input>';

  return jQuery(html);
}

fetchifyPostcodeUtils.createLookupButton = function(prefix, pcl) {
  var utils = fetchifyPostcodeUtils;
  var html;

  html = 
    '<button ' +
      'id="' + prefix + 'pcl_button" ' +
      'type="button" ' +
      'class="wc-block-components-button wp-element-button wc-block-components-checkout-place-order-button contained" ' +
      'style="margin-top: 16px; max-height: 3.375em; ' + window.cc_c2a_config.postcode.button_css + '"' +
    '>' +
      '<span class="wc-block-components-button__text">' + window.cc_c2a_config.postcode.button_text + '</span>' +
    '</button>'
  ;

  var $html = jQuery(html);

  $html.on('click', function() {
    // Perform postcode lookup
    pcl.doLookup();

    // Show results dropdown
    utils.showResultsDropdown(prefix);
  });
  
  return $html;
}

fetchifyPostcodeUtils.createResultsDropdown = function(prefix) {
  var html;

  html =
    '<div ' +
      'id="' + prefix + 'pcl_results_container" ' + 
      'class="form-row-wide" ' +
      'style="margin-top: 8px; display: none;"' +
    '>' +
      '<div id="' + prefix + 'pcl_results"></div>' +
    '</div>'
  ;
  
  return jQuery(html);
}

fetchifyPostcodeUtils.displayVisibilityButton = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  var $form = utils.getFormByPrefix(prefix);

  // Create visibility button
  $button = utils.createVisibilityButton(prefix);

  // Display visibility button
  $form.prepend($button);
}

fetchifyPostcodeUtils.createVisibilityButton = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  // Button text
  var revealButtonText = 'Enter Address Manually';

  var id = prefix + 'pcl_visibility_button';
  var marginBottom = '-12px';

  // Create container for visibility button
  var $container = jQuery('<div id="' + id + '"></div>')
    .css({
      width: '100%',
      textAlign: 'left',
      marginBottom: marginBottom
    });
  
  // Create visibility button
  var $visibilityButton = jQuery('<span>' + revealButtonText + '</span>')
    .css({
      cursor: 'pointer',
      fontSize: '0.8125em',
      userSelect: 'none'
    });
  
  // Toggle visibility
  $visibilityButton.on('click', function() {
    utils.showFields(prefix);
  });

  $container.append($visibilityButton);

  return $container;
}

fetchifyPostcodeUtils.showResultsDropdown = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  // Get results element
  var dom = utils.createDOMObject(prefix);
  var $results = jQuery(dom.results);

  // Show dropdown
  $results.css('display', '');
}

fetchifyPostcodeUtils.hideResultsDropdown = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  // Get results element
  var dom = utils.createDOMObject(prefix);
  var $results = jQuery(dom.results);

  // Hide dropdown
  $results.css('display', 'none');
}

fetchifyPostcodeUtils.hideFields = function(prefix) {
  var utils = fetchifyPostcodeUtils;
  
  var wcVersion = utils.getWCVersion();
  var dom = utils.createDOMObject(prefix);

  // Get form and street1 elements
  var $form = utils.getFormByPrefix(prefix);
  var $street1 = jQuery(dom.street1);

  $street1.attr('cc-hidden', '1');

  // Get visibility button, postcode and find elements
  var $visibility = jQuery(dom.visibility);
  var $postcode = jQuery(dom.postcode).parent();
  var $find = jQuery(dom.find);

  // Hide all form elements except visibility button, postcode, and find
  var $elementsToHide = $form
    .children()
    .not($visibility)
    .not($postcode)
    .not($find);

  // Hide phone field in WC 8
  if (wcVersion < 9) {
    $elementsToHide = $elementsToHide.add(
      $form
        .parent()
        .children()
        .not($form)
    );
  }

  $elementsToHide.slideUp(250);
}

fetchifyPostcodeUtils.showFields = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  var wcVersion = utils.getWCVersion();
  var dom = utils.createDOMObject(prefix);

  // Get visibility button, results, company and street1 elements
  var $visibility = jQuery(dom.visibility);
  var $results = jQuery(dom.results);
  var $company = jQuery(dom.company);
  var $street1 = jQuery(dom.street1);

  $street1.attr('cc-hidden', '0');

  // Get form element
  var $form = utils.getFormByPrefix(prefix);

  // Remove visibility button
  $visibility.remove();

  // Show all form elements except for company and results
  var $elementsToShow = $form
    .children()
    .not($company)
    .not($results)

  // Show phone field in WC 8
  if (wcVersion < 9) {
    $elementsToShow = $elementsToShow.add(
      $form
        .parent()
        .children()
        .not($form)
    );
  }

  $elementsToShow.slideDown(250);
}

fetchifyPostcodeUtils.setLayoutStyles = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  var wcVersion = utils.getWCVersion();
  var dom = utils.createDOMObject(prefix);

  if (wcVersion < 9) {
    var $postcode = jQuery(dom.postcode);
    var $find = jQuery(dom.find);
    var $county = jQuery(dom.county);

    $county
      .parent()
      .css({
        flex: '0 0 100%',
        width: '100%'
      });
    
    $postcode
      .parent()
      .css({
        flex: '0 0 62%',
        width: '100%'
      });
    
    $find
      .css({
        flex: '0 0 34.5%',
        width: '100%'
      });
  }
}

fetchifyPostcodeUtils.unsetLayoutStyles = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  var wcVersion = utils.getWCVersion();
  var dom = utils.createDOMObject(prefix);

  if (wcVersion < 9) {
    var $postcode = jQuery(dom.postcode);
    var $find = jQuery(dom.find);
    var $county = jQuery(dom.county);

    $county
      .parent()
      .css({
        flex: '',
        width: ''
      });
    
    $postcode
      .parent()
      .css({
        flex: '',
        width: ''
      });
    
    $find
      .css({
        flex: '',
        width: ''
      });
  }
}

fetchifyPostcodeUtils.getFieldIds = function(prefix) {
  return {
    company: prefix + 'company',
    street1: prefix + 'address_1',
    street2: prefix + 'address_2',
    town: prefix + 'city',
    county: prefix + 'state',
    postcode: prefix + 'postcode',
    country: prefix + 'country',
    visibility: prefix + 'pcl_visibility_button',
    find: prefix + 'pcl_button',
    results: prefix + 'pcl_results_container'
  }
}

fetchifyPostcodeUtils.setFields = function(prefix, address) {
  var config = window.cc_c2a_config.postcode;
  var utils = fetchifyPostcodeUtils;

  var dom = utils.createDOMObject(prefix);

  var hasCompanyName = address.company;
  var street1 = utils.removeTrailingComma(address.street1);

  var street1 = (hasCompanyName)
    ? address.company + ', ' + street1
    : street1;

  var shouldFillCounties = config.counties < 2;
  var county = (shouldFillCounties) ? address.county : '';
    
  // Populate all fields
  utils.setFieldValue(dom.street1, street1);
  
  if (dom.street2) utils.setFieldValue(dom.street2, address.street2);
  
  utils.setFieldValue(dom.town, address.town);
  utils.setFieldValue(dom.county, county);
  utils.setFieldValue(dom.postcode, address.postcode);
}

fetchifyPostcodeUtils.setFieldValue = function(input, value) {
  var event = new Event('input', { bubbles: true });
  var node = input;
  
  var setValue = Object.getOwnPropertyDescriptor(node.__proto__, 'value').set;

  // Set node.value to non-empty string if value is empty to trigger update
  node.value = (value === '') ? ' ' : '';
  
  setValue.call(node, value);
  
  // Dispatch input event so that React state is updated
  node.dispatchEvent(event);
}


fetchifyPostcodeUtils.handleResultSelected = function(prefix) {
  var config = window.cc_c2a_config.postcode;
  var utils = fetchifyPostcodeUtils;
  var dom = utils.createDOMObject(prefix);

  var $street1 = jQuery(dom.street1);

  var address = {
    company: jQuery(dom.company).val(),
    street1: jQuery(dom.street1).val(),
    street2: jQuery(dom.street2).val(),
    town: jQuery(dom.town).val(),
    county: jQuery(dom.county).val(),
    postcode: jQuery(dom.postcode).val()
  };

  var shouldHideResultsDropdown = config.hide_result;
  var shouldShowFields = $street1.attr('cc-hidden') === '1';

  if (shouldHideResultsDropdown) utils.hideResultsDropdown(prefix);
  
  utils.setFields(prefix, address);
  
  if (shouldShowFields) utils.showFields(prefix);
}

fetchifyPostcodeUtils.handleResultReady = function(prefix) {
  var config = window.cc_c2a_config.postcode;
  var utils = fetchifyPostcodeUtils;
  var dom = utils.createDOMObject(prefix);

  var address = {
    postcode: jQuery(dom.postcode).val()
  };

  utils.setFieldValue(dom.postcode, address.postcode);

  var shouldAutoSelectFirstResult = config.res_autoselect;

  if (shouldAutoSelectFirstResult) utils.selectFirstResult(prefix);
}

fetchifyPostcodeUtils.handleError = function(prefix) {
  var utils = fetchifyPostcodeUtils;

  utils.showFields(prefix);
}


fetchifyPostcodeUtils.selectFirstResult = function(prefix) {
  var utils = fetchifyPostcodeUtils;
  var dom = utils.createDOMObject(prefix);

  var $results = jQuery(dom.results);

  // Select first result
  $results
    .find('select')
    .find('option:eq(1)')
    .prop('selected', true)
    .end()
    .trigger('change');
}
