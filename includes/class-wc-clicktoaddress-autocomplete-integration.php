<?php
/**
 * ClickToAddress Integration
 *
 * @package  ClickToAddress Integration
 * @category Integration
 * @author   Fetchify
 */

if ( ! class_exists( 'WC_ClickToAddress_Autocomplete_Integration' ) ) :

class WC_ClickToAddress_Autocomplete_Integration extends WC_Integration {
	private $woocommerce_version = '';

	/**
	 * Init and hook in the integration.
	 */
	public function __construct() {
		global $woocommerce;

		if ( defined( 'WC_VERSION' ) ) {
			$this->woocommerce_version = WC_VERSION;
		}

		$this->id					= 'clicktoaddress_autocomplete';
		$this->method_title			= __( 'Fetchify', 'woocommerce-clicktoaddress-autocomplete' );
		$this->method_description	= __( 'Adds Fetchify products to WooCommerce forms.', 'woocommerce-clicktoaddress-autocomplete' );

		// Load the settings.
		$this->init_form_fields();
		$this->init_settings();

		// Define user set variables.
		$this->config = (object) array(
			'autocomplete' => (object) array(
				'enabled'				=> (int) $this->get_option( 'enabled_checkout' ),
				'access_token'			=> $this->get_option( 'access_token' ),
				'layout'				=> (int) $this->get_option( 'layout' ),
				'ambient'				=> $this->get_option( 'ambient' ),
				'accent'				=> $this->get_option( 'accent' ),
				'hide_fields'			=> (int) $this->get_option( 'hide_fields' ),
				'hide_buttons'			=> (int) $this->get_option( 'hide_buttons' ),
				'search_line_1'			=> (int) $this->get_option( 'search_first_line' ),
				'show_logo'				=> (int) $this->get_option( 'show_logo' ),
				'match_countries'		=> (int) $this->get_option( 'match_countries' ),
				'lock_country'			=> (int) $this->get_option( 'lock_country' ),
				'fill_uk_counties'		=> (int) $this->get_option( 'fill_uk_counties' ),
				'ip_location'			=> (int) $this->get_option( 'ip_location' ),
				'transliterate'			=> (int) $this->get_option( 'transliterate' ),
				'language'				=> $this->get_option( 'language' ),
				'search_label'			=> $this->get_option( 'search_label' ),
				'reveal_button'			=> $this->get_option( 'reveal_button' ),
				'hide_button'			=> $this->get_option( 'hide_button' ),
				'default_placeholder'	=> $this->get_option( 'default_placeholder' ),
				'country_placeholder'	=> $this->get_option( 'country_placeholder' ),
				'country_button'		=> $this->get_option( 'country_button' ),
				'generic_error'			=> $this->get_option( 'generic_error' ),
				'no_results'			=> $this->get_option( 'no_results' ),
				'exclude_areas'			=> $this->get_option( 'exclude_areas' ),
			),
			'postcode' => (object) array(
				'enabled'				=> (int) $this->get_option( 'enabled_postcode' ),
				'access_token'			=> $this->get_option( 'access_token' ),
				'counties'				=> (int) $this->get_option( 'postcode_counties' ),
				'hide_fields'			=> (int) $this->get_option( 'postcode_hide_fields' ),
				'hide_result'			=> (int) $this->get_option( 'postcode_hide_result' ),
				'res_autoselect'		=> (int) $this->get_option( 'postcode_res_autoselect' ),
				'button_text'			=> $this->get_option( 'postcode_button_text' ),
				'msg1'					=> $this->get_option( 'postcode_msg1' ),
				'err_msg1'				=> $this->get_option( 'postcode_err_msg1' ),
				'err_msg2'				=> $this->get_option( 'postcode_err_msg2' ),
				'err_msg3'				=> $this->get_option( 'postcode_err_msg3' ),
				'err_msg4'				=> $this->get_option( 'postcode_err_msg4' ),
				'button_css'			=> $this->get_option( 'postcode_button_css' ),
				'busy_img_url'			=> plugins_url( '../fetchify_postcode_busy.gif', __FILE__ )
			),
			'phone' => (object) array(
				'enabled'				=> (int) $this->get_option( 'enabled_phone' ),
				'access_token'			=> $this->get_option( 'access_token' ),
				'can_correct'			=> ($this->get_option( 'phone_can_correct' ) == 'yes'),
				'allowed_type'			=> $this->get_option( 'phone_allowed_type' ),
			),
			'email' => (object) array(
				'enabled'				=> (int) $this->get_option( 'enabled_email' ),
				'access_token'			=> $this->get_option( 'access_token' )
			)
		);

		// Actions.
		add_action( 'woocommerce_update_options_integration_' .  $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_settings_integration', array( $this, 'addConfigJs' ) );
		
		if ($this->config->autocomplete->enabled ||
			$this->config->postcode->enabled ||
			$this->config->phone->enabled ||
			$this->config->email->enabled)
		{
			if ($this->hasBlocks()) {
				add_action( 'woocommerce_blocks_enqueue_checkout_block_scripts_before', array( $this, 'addCheckoutBlocksJs' ) );
			} else {
				add_action( 'woocommerce_checkout_billing', array( $this, 'addCheckoutJs' ) );
			}

			add_action( 'woocommerce_before_edit_account_address_form', array( $this, 'addCheckoutJs' ) );
			add_action( 'edit_user_profile', array( $this, 'addUsersJs' ) );
			add_action( 'profile_personal_options', array( $this, 'addUsersJs' ) );
			add_action( 'add_meta_boxes', array( $this, 'addOrdersJs' ) );
		}
	}

	public function hasBlocks() {
		$containsBlocks = version_compare($this->woocommerce_version, '8.3', '>=');

		if ($containsBlocks) {
			$hasBlocksInPage = WC_Blocks_Utils::has_block_in_page( wc_get_page_id('checkout'), 'woocommerce/checkout' );

			if ($hasBlocksInPage) {
				return true;
			}
		}

		return false;
	}

	public function addConfigJs() {
		wp_enqueue_script('clicktoaddress-autocomplete-js-config', plugins_url( '../admin/js/config.js', __FILE__ ));
	}

	public function addJs($type, $dir) {
		$nativeCountryList = [
			"ala" => "Åland",
			"alb" => "Shqipëria",
			"arm" => "Հայաստան",
			"aut" => "Österreich",
			"aze" => "Azərbaycan",
			"bel" => "België",
			"bes" => "Caribisch Nederland",
			"bgr" => "България",
			"bih" => "Bosna i Hercegovina",
			"blm" => "Saint-Barthélemy",
			"blr" => "Рэспубліка Беларусь",
			"bra" => "Brasil",
			"caf" => "République Centrafricaine",
			"che" => "Schweiz",
			"cmr" => "République du Cameroun",
			"cod" => "République Dém. du Congo",
			"cog" => "République du Congo",
			"com" => "Comores",
			"cpv" => "Cabo Verde",
			"cyp" => "Κυπρος",
			"cze" => "Cesko",
			"deu" => "Deutschland",
			"dnk" => "Danmark",
			"dom" => "República Dominicana",
			"dza" => "Algérie",
			"esp" => "España",
			"est" => "Eesti",
			"fin" => "Suomi",
			"fro" => "Føroyar",
			"geo" => "საქართველო",
			"gin" => "Guinée",
			"gnb" => "Guiné-Bissau",
			"gnq" => "Guinée Équatoriale",
			"grc" => "Ελλάδα",
			"guf" => "Guyane",
			"hrv" => "Hrvatska",
			"hun" => "Magyarország",
			"isl" => "Ísland",
			"ita" => "Italia",
			"kaz" => "Қазақстан",
			"kos" => "Kosovë",
			"lbn" => "Liban",
			"ltu" => "Lietuva",
			"lux" => "Luxemburg",
			"lva" => "Latvija",
			"mac" => "RAE de Macau",
			"maf" => "Saint Martin",
			"mar" => "Maroc",
			"mex" => "México",
			"mkd" => "Република Северна Македонија",
			"mne" => "Crna Gora",
			"mng" => "Монгол Улс",
			"moz" => "Moçambique",
			"mrt" => "Mauritanie",
			"ncl" => "Nouvelle-Calédonie",
			"nld" => "Nederland",
			"nor" => "Norge",
			"pan" => "Panamá",
			"per" => "Perú",
			"pol" => "Polska",
			"pyf" => "Polynésie Française",
			"rou" => "România",
			"rus" => "Rossiya",
			"sen" => "Sénégal",
			"srb" => "Srbija",
			"stp" => "São Tomé e Príncipe",
			"svk" => "Slovensko",
			"svn" => "Slovenija",
			"swe" => "Sverige",
			"swz" => "Eswatini",
			"sxm" => "Sint Maarten",
			"tcd" => "Tchad",
			"tha" => "ประเทศไทย",
			"tun" => "Tunisie",
			"tur" => "Türkiye",
			"twn" => "台灣",
			"ukr" => "Україна",
			"uzb" => "O'zbekiston",
			"vat" => "Stato della Città del Vaticano"
		];

		if ($this->config->autocomplete->access_token != '') {
			$script_name = 'clicktoaddress-autocomplete-js-';
			wp_enqueue_script($script_name . 'core', 'https://cc-cdn.com/generic/scripts/v1/cc_c2a.min.js');
			wp_enqueue_script($script_name . $type, plugins_url( '../'.$dir.'/js/'.$type.'.js', __FILE__ ));
			wp_add_inline_script(
				$script_name . $type,
				'window.cc_c2a_config = ' . json_encode($this->config) . ';' .
				'window.cc_c2a_native_countries = ' . json_encode($nativeCountryList) . ';',
				'before'
			);
		}
	}

	public function addCheckoutBlocksJs(){ $this->addJs('checkout_blocks', 'frontend'); }
	public function addCheckoutJs(){ $this->addJs('checkout', 'frontend'); }

	public function addUsersJs(){ $this->addJs('users', 'admin'); }

	public function addOrdersJs() {
		global $pagenow;

		$isAdminOrders = 
			$pagenow === 'post.php' ||
			$pagenow === 'post-new.php' ||
			$pagenow === 'admin.php';

		$isNewOrder =
			(isset($_GET['post_type']) && $_GET['post_type'] === 'shop_order') ||
			(isset($_GET['page']) && $_GET['page'] === 'wc-orders' && isset($_GET['action']) && $_GET['action'] === 'new');

		if ($isAdminOrders && $isNewOrder) {
			$this->addJs('orders', 'admin');
		}
	}

	/**
	 * Initialize integration settings form fields.
	 *
	 * @return void
	 */
	public function init_form_fields() {
		$fields = array(
			'title_enabled' => array(
				'id'			=> 'title_enabled',
				'type'			=> 'title',
				'title'			=> __( 'Enabled Products', 'woocommerce' ),
				'description'	=> __( 'Choose the Fetchify products you would like to enable.', 'woocommerce' ),
				'css'			=> ''
			),
			'enabled_checkout' => array(
				'title'			=> __( 'Address Auto-Complete', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'class'			=> 'cc_enabled_select',
				'default'		=> 0,
				'options' => array(
					0			=> __('No', 'woocommerce' ),
					1			=> __('Yes', 'woocommerce' )
				)
			),
			'enabled_postcode' => array(
				'title'			=> __( 'Postcode Lookup', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'class'			=> 'cc_enabled_select',
				'default'		=> 0,
				'options' => array(
					0			=> __('No', 'woocommerce' ),
					1			=> __('Yes', 'woocommerce' )
				)
			),
			'enabled_phone' => array(
				'title'			=> __( 'Phone Validation', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'class'			=> 'cc_enabled_select',
				'default'		=> 0,
				'options' => array(
					0			=> __('No', 'woocommerce' ),
					1			=> __('Yes', 'woocommerce' )
				)
			),
			'enabled_email' => array(
				'title'			=> __( 'Email Validation', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'class'			=> 'cc_enabled_select',
				'default'		=> 0,
				'options' => array(
					0			=> __('No', 'woocommerce' ),
					1			=> __('Yes', 'woocommerce' )
				)
			),
			'title_access_token' => array(
				'id'			=> 'title_access_token',
				'type'			=> 'title',
				'title'			=> __( 'Access Token', 'woocommerce' ),
				'description'	=> __( 'Enter the access token you received by email when you signed up for a Fetchify account.', 'woocommerce' ),
				'css'			=> ''
			),
			'access_token' => array(
				'id'			=> 'access_token',
				'type'			=> 'text',
				'default'		=> 'xxxxx-xxxxx-xxxxx-xxxxx',
				'placeholder'	=> 'xxxxx-xxxxx-xxxxx-xxxxx'
			),
			'title_autocomplete' => array(
				'id'			=> 'title_autocomplete',
				'type'			=> 'title',
				'title'			=> __( 'Address Auto-Complete', 'woocommerce' ),
				'class'			=> 'cc_section_autocomplete',
				'css'			=> ''
			),
			'layout' => array(
				'id'			=> 'layout',
				'type'			=> 'select',
				'title'			=> __( 'Search Layout', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Choose a layout type', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 1,
				'options' => array(
					1			=> __('Below', 'woocommerce' ),
					2			=> __('Surround', 'woocommerce' )
				)
			),
			'ambient' => array(
				'id'			=> 'ambient',
				'type'			=> 'select',
				'title'			=> __( 'Colour Scheme', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Choose a light or dark colour scheme', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'light',
				'options' => array(
					'light'		=> __('light', 'woocommerce' ),
					'dark'		=> __('dark', 'woocommerce' )
				)
			),
			'accent' => array(
				'id'			=> 'accent',
				'type'			=> 'select',
				'title'			=> __( 'Accent', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Choose a secondary colour', 'woocommerce-clicktoaddress-autocomplete' ),
				// 'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'default',
				'options' => array(
					'default'		=> __('default', 'woocommerce' ),
					'red'			=> __('red', 'woocommerce' ),
					'pink'			=> __('pink', 'woocommerce' ),
					'purple'		=> __('purple', 'woocommerce' ),
					'deepPurple'	=> __('deepPurple', 'woocommerce' ),
					'indigo'		=> __('indigo', 'woocommerce' ),
					'blue'			=> __('blue', 'woocommerce' ),
					'lightBlue'		=> __('lightBlue', 'woocommerce' ),
					'cyan'			=> __('cyan', 'woocommerce' ),
					'teal'			=> __('teal', 'woocommerce' ),
					'green'			=> __('green', 'woocommerce' ),
					'lightGreen'	=> __('lightGreen', 'woocommerce' ),
					'lime'			=> __('lime', 'woocommerce' ),
					'yellow'		=> __('yellow', 'woocommerce' ),
					'amber'			=> __('amber', 'woocommerce' ),
					'orange'		=> __('orange', 'woocommerce' ),
					'deepOrange'	=> __('deepOrange', 'woocommerce' ),
					'brown'			=> __('brown', 'woocommerce' ),
					'grey'			=> __('grey', 'woocommerce' ),
					'blueGrey'		=> __('blueGrey', 'woocommerce' )
				)
			),
			'hide_fields' => array(
				'id'			=> 'hide_fields',
				'title'			=> __( 'Hide Address Fields', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'Hide the address fields until a search result is selected', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 1,
				'options' => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'hide_buttons' => array(
				'id'			=> 'hide_buttons',
				'title'			=> __( 'Disable Buttons on Result Selected', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'Show and hide fields buttons do not appear once a search result has been selected', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 1,
				'options' => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'search_first_line' => array(
				'id'			=> 'search_first_line',
				'title'			=> __( 'Search in Address Line 1', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'Use address line 1 as the search field rather than adding a separate search field', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 0,
				'options' => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'show_logo' => array(
				'id'			=> 'show_logo',
				'title'			=> __( 'Show ClickToAddress Logo', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'Show or hide the ClickToAddress logo', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 1,
				'options' => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'match_countries' => array(
				'id'			=> 'match_countries',
				'title'			=> __( 'Match WooCommerce Country List', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'The country list in the search interface will match the country list in WooCommerce.', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 1,
				'options' => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'lock_country' => array(
				'id'			=> 'lock_country',
				'title'			=> __( 'Lock Country to Dropdown', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'The selected country in the search interface is locked to the selected country in the dropdown.', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 0,
				'options' => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'fill_uk_counties' => array(
				'id'			=> 'fill_uk_counties',
				'title'			=> __( 'Fill UK counties', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'Enable/disable filling of county field (UK only).', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 1,
				'options' => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'ip_location' => array(
				'id'			=> 'ip_location',
				'title'			=> __( 'Geolocation', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'Set the default country to the user\'s location based on IP address (frontend only)', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 0,
				'options' => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'transliterate' => array(
				'id'			=> 'transliterate',
				'title'			=> __( 'Transliterate for non ASCII characters', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'select',
				'description'	=> __( 'Changes non-Latin characters to Latin characters', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 0,
				'options'     => array(
					0 => __('No', 'woocommerce' ),
					1 => __('Yes', 'woocommerce' )
				)
			),
			'language' => array(
				'id'			=> 'language',
				'type'			=> 'select',
				'title'			=> __( 'Language', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Set the language used for the country list. Note that the other texts will not be translated, but you can customise them below.', 'woocommerce-clicktoaddress-autocomplete' ),
				// 'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'en',
				'options' => array(
					'en'		=> __('English', 'woocommerce' ),
					'de'		=> __('Deutsch', 'woocommerce' ),
					'native'	=> __('Native languages', 'woocommerce' )
				)
			),
			'search_label' => array(
				'id'			=> 'search_label',
				'type'			=> 'text',
				'title'			=> __( 'Search Field Label', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Text to be displayed as the label for the address search field', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'Find Address',
				'placeholder'	=> 'Find Address'
			),
			'reveal_button' => array(
				'id'			=> 'reveal_button',
				'type'			=> 'text',
				'title'			=> __( 'Reveal Button Text', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'When the form fields are hidden, this text is displayed on the button that reveals the fields', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'Enter Address Manually',
				'placeholder'	=> 'Enter Address Manually'
			),
			'hide_button' => array(
				'id'			=> 'hide_button',
				'type'			=> 'text',
				'title'			=> __( 'Hide Button Text', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'This text is displayed on the button to hide the form fields and show the address search field', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'Search For Address',
				'placeholder'	=> 'Search For Address'
			),
			'default_placeholder' => array(
				'id'			=> 'default_placeholder',
				'type'			=> 'text',
				'title'			=> __( 'Default Placeholder', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Text to be displayed as the default placeholder', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'Start with post/zip code or street',
				'placeholder'	=> 'Start with post/zip code or street'
			),
			'country_placeholder' => array(
				'id'			=> 'country_placeholder',
				'type'			=> 'text',
				'title'			=> __( 'Country Placeholder', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Text to be displayed as the country placeholder', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'Type here to search for a country',
				'placeholder'	=> 'Type here to search for a country'
			),
			'country_button' => array(
				'id'			=> 'country_button',
				'type'			=> 'text',
				'title'			=> __( 'Country Button', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Text to be displayed on the country button', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'Change Country',
				'placeholder'	=> 'Change Country'
			),
			'generic_error' => array(
				'id'			=> 'generic_error',
				'type'			=> 'text',
				'title'			=> __( 'Generic Error', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Text to be displayed when an error occurs', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'An error occurred. Please enter your address manually',
				'placeholder'	=> 'An error occurred. Please enter your address manually'
			),
			'no_results' => array(
				'id'			=> 'no_results',
				'type'			=> 'text',
				'title'			=> __( 'No Results', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Text to be displayed when no results are found', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_autocomplete',
				'default'		=> 'No results found',
				'placeholder'	=> 'No results found'
			),
			'exclude_areas' => array(
				'id'			=> 'exclude_areas',
				'title'			=> __( 'Areas to exclude', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'textarea',
				'description'	=> __( 'A list of areas to be excluded from the search. If multiple areas are to be excluded, each should appear on a separate line. For a list of supported areas, see our documentation: https://fetchify.com/docs/javascript-library/address-auto-complete.html#excludeareas', 'woocommerce-clicktoaddress-autocomplete' ),
				'class'			=> 'cc_section_autocomplete',
				'css'			=> 'min-width: 27%; max-width: 27%; height: 75px;',
				'placeholder'	=> "Example:\r\ngbr_northern_ireland\r\ngbr_isle_of_man\r\ngbr_isle_of_wight\r\ngbr_channel_islands\r\ngbr_all_except_northern_ireland\r\nusa_non_contiguous\r\nusa_insular_areas\r\nusa_armed_forces",
			),
			'title_postcode' => array(
				'id'    => 'title_postcode',
				'type'  => 'title',
				'title' => __( 'Postcode Lookup', 'woocommerce-clicktoaddress-autocomplete' ),
				'class'	=> 'cc_section_postcode'
			),
			'postcode_counties' => array(
				'id'			=> 'postcode_counties',
				'type'			=> 'select',
				'title'			=> __( 'Counties', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Choose options for filling county field', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 2,
				'options' => array(
					2			=> __('Do not fill county', 'woocommerce' ),
					0			=> __('Use postal counties', 'woocommerce' ),
					1			=> __('Use traditional counties', 'woocommerce' )
				)
			),
			'postcode_hide_fields' => array(
				'id'			=> 'postcode_hide_fields',
				'type'			=> 'select',
				'title'			=> __( 'Hide Address Fields', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Hide the address fields until a search result is selected', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 1,
				'options' => array(
					0			=> __('No', 'woocommerce' ),
					1			=> __('Yes', 'woocommerce' )
				)
			),
			'postcode_hide_result' => array(
				'id'			=> 'postcode_hide_result',
				'type'			=> 'select',
				'title'			=> __( 'Hide Results', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Hide results box when a result is selected', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 1,
				'options' => array(
					0			=> __('No', 'woocommerce' ),
					1			=> __('Yes', 'woocommerce' )
				)
			),
			'postcode_res_autoselect' => array(
				'id'			=> 'postcode_res_autoselect',
				'type'			=> 'select',
				'title'			=> __( 'Auto-select Result', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Auto-select the first result', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 0,
				'options' => array(
					0			=> __('No', 'woocommerce' ),
					1			=> __('Yes', 'woocommerce' )
				)
			),
			'postcode_button_text' => array(
				'id'			=> 'postcode_button_text',
				'type'			=> 'text',
				'title'			=> __( 'Button Text', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Text for search button', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 'Find Address'
			),
			'postcode_msg1' => array(
				'id'			=> 'postcode_msg1',
				'title'			=> __( 'Busy Image Message', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'text',
				'description'	=> __( 'Message to attach as title to busy image', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 'Please wait while we find the address'
			),
			'postcode_err_msg1' => array(
				'id'			=> 'postcode_err_msg1',
				'title'			=> __( 'Error Message 1', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'text',
				'description'	=> __( 'Error message if postcode does not exist', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 'This postcode could not be found, please try again or enter your address manually'
			),
			'postcode_err_msg2' => array(
				'id'			=> 'postcode_err_msg2',
				'title'			=> __( 'Error Message 2', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'text',
				'description'	=> __( 'Error message if postcode incorrectly formatted', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 'This postcode is not valid, please try again or enter your address manually'
			),
			'postcode_err_msg3' => array(
				'id'			=> 'postcode_err_msg3',
				'type'			=> 'text',
				'title'			=> __( 'Error Message 3', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Error message if there is network problem', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 'Unable to connect to address lookup server, please enter your address manually'
			),
			'postcode_err_msg4' => array(
				'id'			=> 'postcode_err_msg4',
				'title'			=> __( 'Error Message 4', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'text',
				'description'	=> __( 'Error message to cover any other problem', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'default'		=> 'An unexpected error occurred, please enter your address manually'
			),
			'postcode_button_css' => array(
				'id'			=> 'postcode_button_css',
				'title'			=> __( 'Button CSS', 'woocommerce-clicktoaddress-autocomplete' ),
				'type'			=> 'textarea',
				'description'	=> __( 'CSS for the search button, just add the properties separated with ;. Example: padding-left: 20px; font-size: 15px;', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_postcode',
				'css'			=> 'min-width: 27%; max-width: 27%; height: 75px;',
				'placeholder'	=> ''
			),
			'title_phone' => array(
				'id'			=> 'title_phone',
				'type'			=> 'title',
				'title'			=> __( 'Phone Validation', 'woocommerce' ),
				'class'			=> 'cc_section_phone',
				'css'			=> ''
			),
			'phone_can_correct' => array(
				'id'			=> 'phone_can_correct',
				'type'			=> 'checkbox',
				'title'			=> 'Auto-correct number',
				'description'	=> __( 'The phone number will be automatically corrected. For example, spaces may be added.', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'label'			=> ' ',
				'default'		=> 'yes',
				'class'			=> 'cc_section_phone'
			),
			'phone_allowed_type' => array(
				'id'			=> 'phone_allowed_type',
				'type'			=> 'select',
				'title'			=> __( 'Allowed numbers', 'woocommerce-clicktoaddress-autocomplete' ),
				'description'	=> __( 'Set the type of phone number you want to capture.', 'woocommerce-clicktoaddress-autocomplete' ),
				'desc_tip'		=> true,
				'class'			=> 'cc_section_phone',
				'default'		=> 'all',
				'options' => array(
					'all'			=> __('All', 'woocommerce' ),
					'mobile'		=> __('Mobile', 'woocommerce' ),
					'landline'		=> __('Landline', 'woocommerce' )
				)
			)
		);

		if ($this->hasBlocks()) {
			// Remove incompatible fields when WC Blocks is used
			unset($fields['default_placeholder']);
			unset($fields['country_placeholder']);
		}

		$this->form_fields = $fields;
	}
}

endif;
