<?php
// Function to get location based on IP address using ipinfo.io
function getLocation($ip, $ipinfoToken) {
    $url = "https://ipinfo.io/{$ip}?token={$ipinfoToken}";
    $locationData = file_get_contents($url);
    return json_decode($locationData, true);
}

// Function to get temperature based on city using WeatherAPI.com
function getTemperature($city, $weatherApiKey) {
    $url = "http://api.weatherapi.com/v1/current.json?key={$weatherApiKey}&q={$city}";
    $weatherData = file_get_contents($url);
    return json_decode($weatherData, true);
}

// Get the visitor's name from the query parameter
$visitorName = isset($_GET['visitor_name']) ? $_GET['visitor_name'] : 'Guest';

// Get the client's IP address
$clientIP = $_SERVER['REMOTE_ADDR'];

// Replace with your ipinfo.io token and WeatherAPI.com API key
$ipinfoToken = '28d61fa433e5d6';
$weatherApiKey = '5602c16bfe2f4e03a69122619240207';

// Get location data
$locationData = getLocation($clientIP, $ipinfoToken);
$city = isset($locationData['city']) ? $locationData['city'] : 'Unknown';

// Get weather data
$weatherData = getTemperature($city, $weatherApiKey);
$temperature = isset($weatherData['current']['temp_c']) ? $weatherData['current']['temp_c'] : 'unknown';

// Create the response array
$response = [
    'client_ip' => $clientIP,
    'location' => $city,
    'greeting' => "Hello, $visitorName! The temperature is $temperature degrees Celsius in $city."
];

// Set the response header to JSON
header('Content-Type: application/json');

// Output the JSON response
echo json_encode($response);
