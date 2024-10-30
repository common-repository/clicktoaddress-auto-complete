=== Fetchify ===
Contributors: craftyclicks
Donate link: https://fetchify.com/
Tags: address, email, phone, postcode, lookup
Requires at least: 4.0
Tested up to: 6.6
Stable tag: 1.8.1
License: AGPLv3
License URI: https://www.gnu.org/licenses/agpl-3.0.en.html

This plugin adds global address auto-complete functionality to the address forms on the front-end in WooCommerce.

== Description ==

This plugin can be configured to provide up to 4 different data validation products. It replaces our previous plugins Crafty Clicks Address Auto-Complete and Crafty Clicks Postcode Lookup. 

= Address Auto-Complete =

Adds address auto-fill, lookup and validation to address forms on the front-end in WooCommerce for over 240 countries.

The checkout experience becomes faster and easier as a customer no longer has to type out their full address. The smart predictive search helps speed up form filling and boosts usability. Every address is verified at the point of entry. Problems due to incorrect or badly typed address data are drastically reduced.

= Postcode Lookup =

The defacto solution for address capture and validation in the UK. Enter any UK postcode in the search field, click the search button and the drop down will show all the relevant address results for that postcode. Select the required address and the form will immediately be populated with accurate information.

= Phone Validation =

Verifies all number types and formats including mobile, international and landline numbers in every country/territory worldwide. Corrects and re-formats common mistakes within forms to ensure data quality.

= Email Validation =

Email Validation provides real-time validation of any email address. Invalid format emails are declined immediately while valid emails are checked to ensure they link to an active provider. The API verifies username and domain elements of the email address.

= Customer Satisfaction & Conversions =
Easier and faster checkout saves your customers' time, improves conversions and builds loyalty.

= Data Quality =
User input is validated in real time and your customer database is populated with fully verified addresses, phone numbers and email addresses. Address verification can reduce failed deliveries by up to 50%.

= WPML Compatibility =

This plugin is compatible with WPML to make your checkout multilingual. To find out more about WPML go to https://wpml.org/

= Getting Started =
In order to use this service, you will need to sign up for an account. You will then receive an access token which will give you access to our service. You need to insert this access token in the configuration options. We offer 30 free searches for testing purposes, but in order to use this plugin on a live site, you must have a paid account with us.

= Automatic Updates =
Our service is split into 3 parts:

1. An API server that delivers the data
2. A JS library that can retrieve the data, and generate a basic UI, regardless of platform
3. WooCommerce specific JS files (located in clicktoaddress-auto-complete/frontend/js and clicktoaddress-auto-complete/admin/js)

The JS library is located on our CDN to ensure that you will automatically receive any updates. If there's an update to the API and changes to the JS library are required in order for the plugin to function correctly, you will not have to worry about updating it yourself.

== Installation ==

1. If you have not already done so, you will first need to sign up for a Fetchify account. We offer a trial account with 30 free lookups for testing. You will then receive an access token which will give you access to our service.
2. Unpack the zip file and copy the clicktoaddress-auto-complete folder to your WordPress installation’s wp-content/plugins folder.
3. In your WordPress admin panel, go to Plugins / Installed Plugins, and activate the Fetchify plugin.
4. From the admin panel, go to WooCommerce / Settings / Integration and select the Fetchify tab. Here you will need to insert your access token, which is required to use the plugin. To get an access token, you will need to sign up for an account with us, and we will email you an access token. On this page you can also choose the products you would like to enable. All products are disabled by default. Note that Address Auto-Complete and Postcode Lookup cannot both be active at the same time. For Address Auto-Complete, Postcode Lookup and Phone Validation, additional configuration options are available. These options will only become visible once the product has been enabled. Hover over the tooltip icons for more information about each setting. When you have finished configuring the plugin, click the ‘Save changes’ button at the bottom of the page.
5. Before you go live, test the integration to make sure it is working properly. We have postcodes that you can test for free. For Address Auto-Complete only: SL6 1QZ, for Postcode Lookup only: AA1 1AA, AA1 1AB, AA1 1AD and AA1 1AE.
Postcode Lookup only: AA1 1AA, AA1 1AB, AA1 1AD and AA1 1AE.
6. Once your trial lookups run out, you will need to decide on the best purchasing option based on the volume of usage you expect on your site. If you would like us to advise you then please get in touch.

If you need assistance, drop us an email on support@fetchify.com – we will help!

= WPML Configuration =
Our plugin is compatible with https://wpml.org/ which allows translation of certain texts in the search UI. The following texts can be translated.

Address Auto-Complete:
* Search field label
* Reveal fields button
* Hide fields button
* Search field placeholder
* Country search placeholder
* Change country button
* Generic error message
* No results message

Postcode Lookup:
* Lookup button text
* Search in progress message
* Unknown postcode message
* Invalid postcode message
* Server error message
* Unknown error message

If you want to use WPML to translate the Fetchify plugin, the following plugins must first be installed:
* Fetchify
* WPML Multilingual CMS
* WPML String Translation
* WooCommerce Multilingual

You must also configure the Fetchify plugin first. You can find the plugin settings in WooCommerce / Settings / Integration / Fetchify. Select the products that you would like to enable and enter the texts you would like to use for your site's default language.

1. In your WordPress admin panel, go to WPML / String Translation.
2. A list will be displayed showing all strings available for translation. First you should filter this list to show only the options related to the plugin. You can do this using 'Select strings within domain'. You should select this domain: admin_texts_woocommerce_clicktoaddress_autocomplete_settings. This will display all the options from the Fetchify plugin that can be translated. Note that some of these options are for Address Auto-Complete and some are for Postcode Lookup. You can ignore any options that do not require translation.
3. For each option, click the 'translations' button next to the string. Here you can set custom translations for each language that you have enabled. When you are happy with the translation, make sure you mark that translation as complete, then save your changes.

Your translated texts will now appear in the search UI!

== Frequently Asked Questions ==

= Do you offer support? =
Yes, we do offer support during normal business hours. If you contact us outside these hours we will get back to you the next working day. If you run into any issues, let us know at support@fetchify.com and we will be happy to help.

= Is this plugin free? =
The extension is free to download and try, but to use it on a live site you will need a paid account with us. We do offer a free trial to test.

= Do I need to sign up for an account to try it? =
You’ll need a trial account to test. You can easily sign up for a free trial account at our website fetchify.com. You do not need to give us your credit card details for a trial account.

= Can I use more than one of the products? =
Yes, our products are designed to work together and separately from the same plugin installation. However, you cannot use both Address Auto-Complete and Postcode Lookup on the same form.

= Will I need separate accounts for each product? =
No, one account covers all the products you choose to use.

== Changelog ==

= 1.8.1 =
* Fix: Fixed Fetchify products not appearing on checkout pages with WooCommerce Blocks disabled
* Fix: Corected "tested up to" version number

= 1.8.0 =
* Feature: Added support for WooCommerce Blocks (v8.3.0 - v9.1.x)
* Fix: Fixed Fetchify products not appearing on WooCommerce orders page

= 1.7.0 =
* Feature: Added support for WooCommerce High-Performance Order Storage (HPOS)
* Feature: Return company and town in title case for Postcode Lookup
* Feature: Improved Greece region selection

= 1.6.1 =
* Fix: Fixed document ready bug in WP 5.9.
* Fix: Fixed country field position.
* Fix: Prevent options being selected simultaneously.
* Fix: Removed token popup script code.

= 1.6.0 =
* Feature: Updated 'test up to' WP and WC versions.
* Fix: Fixed label bug.
* Feature: Added 'do not fill UK county' option for Address Auto-Complete.

= 1.5.1 =
* Fix: Added missing "=" to attributes
* Feature: Support WooCommerce 6

= 1.5.0 =
* Feature: Changed license to AGPLv3.
* Fix: Removed redundant function causing increased load times.
* Feature: Removed "Find My Access Token".

= 1.4.0 =
* Feature: Added area exclusions.
* Fix: Form field validity indication after population.

= 1.3.1 =
* Fix: Postcode Lookup onchange for orders and users pages.
* Fix: Postcode Lookup dropdown bug.

= 1.3.0 =
* Added WPML compatibility.
* Added Fetchify branding.

= 1.2.1 =
* Fixed revealing form fields when an error occurs.
* Fix: missing image on plugin configuration page.

= 1.2.0 =
* Added postcode lookup, phone validation and email validation.

= 1.1.11 =
* Declaring supported WooCommerce version.

= 1.1.10 =
* Check: Compatible with Wordpress 5.2.1.

= 1.1.9 =
* New config option allowing transliteration of non-ASCII characters to latin characters.

= 1.1.8 =
* Fix: Trigger update event after address has been selected to validate the fields.

= 1.1.7 =
* Fix: Available country detection refactor for cases when only one shipping/billing country is provided.

= 1.1.6 =
* Check: Compatible with Wordpress 4.9.6.

= 1.1.5 =
* Fix: Missing county field related dropdown issue.

= 1.1.2 =
* New config options allowing you to enable address lookup only on certain forms.

= 1.1.0 =
* Added address lookup to admin panel address forms.
* Enhanced hide fields feature.
* The county field is no longer revealed if it does not exist for the selected country.
* Option to have address search in address line 1.
* Available countries in the search interface now match the enabled countries in WooCommerce. Also options for locking the selected country in the search interface to the selected country in the dropdown, and setting the default country by IP address.
* Minor text changes.

= 1.0.9 =
* Added additional configuration options to the admin panel.

= 1.0.5 =
* Improved compatibility with our UK Postcode Lookup extension.

= 1.0.4 =
* Added a button for manual address entry when fields are hidden.

= 1.0.3 =
* New option added for hiding the address fields then displaying them when a result is selected or when an error occurs.

= 1.0.1 =
* New option added for the search interface layout (below or surrounding the search box).
