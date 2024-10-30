<?php
/**
 * Plugin Name: Fetchify
 * Plugin URI: https://fetchify.com/integrations/woocommerce/
 * Description: Adds Fetchify's Address Auto-Complete, Postcode Lookup, Phone Validation and Email Validation to WooCommerce address forms.
 * Version: 1.8.1
 * Author: ClearCourse Business Services Limited t/a Fetchify
 * Author URI: https://fetchify.com/
 * Text Domain: clicktoaddress-auto-complete
 * WC requires at least: 2.4
 * WC tested up to: 9.1.2
 * Copyright: © 2021 ClearCourse Business Services Ltd
 * License: GNU Affero General Public License v3.0
 * License URI: http://www.gnu.org/licenses/agpl-3.0.en.html
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

if ( ! class_exists( 'WC_ClickToAddress_Autocomplete' ) ) :

class WC_ClickToAddress_Autocomplete {

	/**
	* Construct the plugin.
	*/
	public function __construct() {
		add_action( 'plugins_loaded', array( $this, 'init' ) );

		add_action( 'before_woocommerce_init', function() {
			if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
				\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
			}
			if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', __FILE__, true );
			}
		} );
	}

	/**
	* Initialize the plugin.
	*/
	public function init() {
		// Checks if WooCommerce is installed.
		if ( class_exists( 'WC_Integration' ) ) {
			// Include our integration class.
			include_once 'includes/class-wc-clicktoaddress-autocomplete-integration.php';

			// Register the integration.
			add_filter( 'woocommerce_integrations', array( $this, 'c2a_autocomplete_add_integration' ) );
		} else {
			// throw an admin error if you like
		}
	}

	/**
	 * Add a new integration to WooCommerce.
	 */
	public function c2a_autocomplete_add_integration( $integrations ) {
		$integrations[] = 'WC_ClickToAddress_Autocomplete_Integration';
		return $integrations;
	}

}

$WC_ClickToAddress_Autocomplete_Integration = new WC_ClickToAddress_Autocomplete( __FILE__ );

endif;
