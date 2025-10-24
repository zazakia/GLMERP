<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'glmerp_pos');
define('DB_USER', 'pos_user');
define('DB_PASS', 'pos_password');
define('DB_CHARSET', 'utf8mb4');

// Currency precision
define('CURRENCY_PRECISION', 2);
define('TAX_PRECISION', 4);

// Connect to database
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Request handling
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }
    
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'calculate_total':
            calculateTotal($input);
            break;
            
        case 'calculate_tax':
            calculateTax($input);
            break;
            
        case 'calculate_discount':
            calculateDiscount($input);
            break;
            
        case 'calculate_sale_total':
            calculateSaleTotal($input);
            break;
            
        case 'convert_currency':
            convertCurrency($input);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unknown action: ' . $action]);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

/**
 * Calculate total for cart items
 */
function calculateTotal($data) {
    $items = $data['items'] ?? [];
    $total = 0.0;
    
    foreach ($items as $item) {
        $unitPrice = floatval($item['unit_price'] ?? 0);
        $quantity = intval($item['quantity'] ?? 0);
        $itemTotal = $unitPrice * $quantity;
        $total += $itemTotal;
    }
    
    $response = [
        'success' => true,
        'total' => round($total, CURRENCY_PRECISION),
        'currency' => $data['currency'] ?? 'USD'
    ];
    
    echo json_encode($response);
}

/**
 * Calculate tax for an amount
 */
function calculateTax($data) {
    $amount = floatval($data['amount'] ?? 0);
    $taxRate = floatval($data['tax_rate'] ?? 0);
    $taxType = $data['tax_type'] ?? 'standard';
    
    // Get tax rate based on type
    $taxRates = [
        'standard' => 0.08,
        'reduced' => 0.05,
        'zero' => 0.00
    ];
    
    $rate = $taxRates[$taxType] ?? 0.08;
    $taxAmount = $amount * $rate;
    
    $response = [
        'success' => true,
        'amount' => round($amount, CURRENCY_PRECISION),
        'tax_rate' => round($rate, TAX_PRECISION),
        'tax_amount' => round($taxAmount, TAX_PRECISION),
        'total_with_tax' => round($amount + $taxAmount, CURRENCY_PRECISION),
        'currency' => $data['currency'] ?? 'USD'
    ];
    
    echo json_encode($response);
}

/**
 * Calculate discount for an amount
 */
function calculateDiscount($data) {
    $amount = floatval($data['amount'] ?? 0);
    $discountType = $data['discount_type'] ?? 'percentage';
    $discountValue = floatval($data['discount_value'] ?? 0;
    $minimumPurchase = floatval($data['minimum_purchase'] ?? 0);
    $maximumDiscount = floatval($data['maximum_discount'] ?? 0;
    
    $discountAmount = 0;
    
    if ($discountType === 'percentage') {
        $discountAmount = $amount * ($discountValue / 100);
    } else {
        $discountAmount = $discountValue;
    }
    
    // Apply minimum purchase requirement
    if ($amount < $minimumPurchase) {
        $discountAmount = 0;
    }
    
    // Apply maximum discount limit
    if ($maximumDiscount > 0 && $discountAmount > $maximumDiscount) {
        $discountAmount = $maximumDiscount;
    }
    
    $finalAmount = $amount - $discountAmount;
    
    $response = [
        'success' => true,
        'original_amount' => round($amount, CURRENCY_PRECISION),
        'discount_type' => $discountType,
        'discount_value' => round($discountValue, CURRENCY_PRECISION),
        'discount_amount' => round($discountAmount, CURRENCY_PRECISION),
        'final_amount' => round($finalAmount, CURRENCY_PRECISION),
        'currency' => $data['currency'] ?? 'USD'
    ];
    
    echo json_encode($response);
}

/**
 * Calculate complete sale total with tax and discounts
 */
function calculateSaleTotal($data) {
    $items = $data['items'] ?? [];
    $discounts = $data['discounts'] ?? [];
    $currency = $data['currency'] ?? 'USD';
    
    $subtotal = 0.0;
    
    // Calculate subtotal
    foreach ($items as $item) {
        $unitPrice = floatval($item['unit_price'] ?? 0);
        $quantity = intval($item['quantity'] ?? 0);
        $itemTotal = $unitPrice * $quantity;
        $subtotal += $itemTotal;
    }
    
    $totalDiscount = 0.0;
    
    // Apply discounts
    foreach ($discounts as $discount) {
        $discountType = $discount['discount_type'] ?? 'percentage';
        $discountValue = floatval($discount['discount_value'] ?? 0;
        
        if ($discountType === 'percentage') {
            $totalDiscount += $subtotal * ($discountValue / 100);
        } else {
            $totalDiscount += $discountValue;
        }
    }
    
    $subtotalAfterDiscount = $subtotal - $totalDiscount;
    
    // Calculate tax
    $taxRate = floatval($data['tax_rate'] ?? 0.08;
    $taxType = $data['tax_type'] ?? 'standard';
    
    $taxRates = [
        'standard' => 0.08,
        'reduced' => 0.05,
        'zero' => 0.00
    ];
    
    $rate = $taxRates[$taxType] ?? 0.08;
    $totalTax = $subtotalAfterDiscount * $rate;
    
    $total = $subtotalAfterDiscount + $totalTax;
    
    $response = [
        'success' => true,
        'subtotal' => round($subtotal, CURRENCY_PRECISION),
        'total_discount' => round($totalDiscount, CURRENCY_PRECISION),
        'subtotal_after_discount' => round($subtotalAfterDiscount, CURRENCY_PRECISION),
        'tax_rate' => round($rate, TAX_PRECISION),
        'tax_amount' => round($totalTax, TAX_PRECISION),
        'total_amount' => round($total, CURRENCY_PRECISION),
        'currency' => $currency
    ];
    
    echo json_encode($response);
}

/**
 * Convert currency amount
 */
function convertCurrency($data) {
    $amount = floatval($data['amount'] ?? 0);
    $fromCurrency = $data['from_currency'] ?? 'USD';
    $toCurrency = $data['to_currency'] ?? 'USD';
    
    // Exchange rates (in a real app, these would come from an API)
    $exchangeRates = [
        'USD' => ['USD' => 1, 'EUR' => 0.85, 'GBP' => 0.75, 'JPY' => 110.5, 'CNY' => 6.45],
        'EUR' => ['USD' => 1.18, 'GBP' => 1.33, 'JPY' => 130.0, 'CNY' => 7.60],
        'GBP' => ['USD' => 1.33, 'EUR' => 0.75, 'JPY' => 83.0, 'CNY' => 4.75],
        'JPY' => ['USD' => 0.0091, 'EUR' => 0.0077, 'GBP' => 0.0120, 'CNY' => 0.0643],
        'CNY' => ['USD' => 0.155, 'EUR' => 0.132, 'GBP' => 0.111, 'JPY' => 15.5, 'CNY' => 1.00]
    ];
    
    $fromRate = $exchangeRates[$fromCurrency][$toCurrency] ?? 1;
    $convertedAmount = $amount * $fromRate;
    
    $response = [
        'success' => true,
        'original_amount' => round($amount, CURRENCY_PRECISION),
        'from_currency' => $fromCurrency,
        'to_currency' => $toCurrency,
        'exchange_rate' => round($fromRate, TAX_PRECISION),
        'converted_amount' => round($convertedAmount, CURRENCY_PRECISION)
    ];
    
    echo json_encode($response);
}

/**
 * Get available currencies
 */
function getCurrencies() {
    $currencies = [
        ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$'],
        ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
        ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£'],
        ['code' => 'JPY', 'name' => 'Japanese Yen', 'symbol' => '¥'],
        ['code' => 'CNY', 'name' => 'Chinese Yuan', 'symbol' => '¥']
    ];
    
    $response = [
        'success' => true,
        'currencies' => $currencies
    ];
    
    echo json_encode($response);
}

/**
 * Get tax rates
 */
function getTaxRates() {
    $taxRates = [
        ['code' => 'standard', 'name' => 'Standard', 'rate' => 0.08],
        ['code' => 'reduced', 'name' => 'Reduced', 'rate' => 0.05],
        ['code' => 'zero', 'name' => 'Zero-rated', 'rate' => 0.00]
    ];
    
    $response = [
        'success' => true,
        'tax_rates' => $taxRates
    ];
    
    echo json_encode($response);
}

/**
 * Get exchange rates
 */
function getExchangeRates() {
    $exchangeRates = [
        ['from' => 'USD', 'to' => 'EUR', 'rate' => 0.85],
        ['from' => 'USD', 'to' => 'GBP', 'rate' => 0.75],
        ['from' => 'USD', 'to' => 'JPY', 'rate' => 110.5],
        ['from' => 'USD', 'to' => 'CNY', 'rate' => 6.45],
        ['from' => 'EUR', 'to' => 'USD', 'rate' => 1.18],
        ['from' => 'EUR', 'to' => 'GBP', 'rate' => 1.33],
        ['from' => 'EUR', 'to' => 'JPY', 'rate' => 130.0],
        ['from' => 'EUR', 'to' => 'CNY', 'rate' => 7.60],
        ['from' => 'GBP', 'to' => 'USD', 'rate' => 1.33],
        ['from' => 'GBP', 'to' => 'EUR', 'rate' => 0.75],
        ['from' => 'GBP', 'to' => 'JPY', 'rate' => 83.0],
        ['from' => 'GBP', 'to' => 'CNY', 'rate' => 4.75],
        ['from' => 'JPY', 'to' => 'USD', 'rate' => 0.0091],
        ['from' => 'JPY', 'to' => 'EUR', 'rate' => 0.0077],
        ['from' => 'JPY', 'to' => 'GBP', 'rate' => 0.0120],
        ['from' => 'JPY', 'to' => 'CNY', 'rate' => 0.0643],
        ['from' => 'CNY', 'to' => 'USD', 'rate' => 0.155],
        ['from' => 'CNY', 'to' => 'EUR', 'rate' => 0.132],
        ['from' => 'CNY', 'to' => 'GBP', 'rate' => 0.111],
        ['from' => 'CNY', 'to' => 'JPY', 'rate' => 15.5],
        ['from' => 'CNY', 'to' => 'CNY', 'rate' => 1.00]
    ];
    
    $response = [
        'success' => true,
        'exchange_rates' => $exchangeRates
    ];
    
    echo json_encode($response);
}
?>